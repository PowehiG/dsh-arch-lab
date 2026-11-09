/**
 * Host half of the Arch Lab bundle.
 *
 * Owns three things the browser half cannot:
 *  - the curated architecture library (`data/models.json`) served fresh on every
 *    request, so the dataset can grow without rebuilding the client module;
 *  - a same-origin paper fetcher (arXiv HTML/abs, generic HTML) that turns a
 *    paper URL into readable text while keeping LaTeX `alttext` formulas;
 *  - the model-facing `paper_lab` tool: fetch a paper, or publish an
 *    architecture spec that the panel picks up live.
 *
 * The browser half is `client.js`; it registers the sidebar icon and the
 * `main` panel. Nothing here renders.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = path.dirname(fileURLToPath(import.meta.url))
const DATA_FILE = path.join(DIR, 'data', 'models.json')
const ROUTE_PREFIX = '/paper-lab/api/'
const ROUTE_BASE = '/paper-lab/api'
const MAX_FETCH_CHARS = 160000
const MAX_SPEC_BYTES = 256 * 1024
const MAX_CUSTOM = 40

/** Specs published by the agent during this host process, newest first. */
const customModels = new Map()

export const inject = ['tools', 'webServer']

export function apply(ctx) {
  ctx.effect(() =>
    ctx.webServer.register({ kind: 'prefix', path: ROUTE_BASE, handler: (req, res) => handleRoute(ctx, req, res) }),
  )

  ctx.effect(() =>
    ctx.tools.register({
      name: 'paper_lab',
      description:
        'Arch Lab (架构显微镜) bridge. Use `fetch` to download a paper URL (arXiv abs/HTML or any article) as readable text with LaTeX formulas preserved; use `publish` to push a structured architecture spec into the Arch Lab panel where the user can explore it visually; use `list` to see specs already published in this process. After publishing, tell the user to open Arch Lab from the sidebar (架构显微镜 icon) and select the new model.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          action: {
            type: 'string',
            enum: ['fetch', 'publish', 'list', 'clear'],
            description: 'fetch = download paper text; publish = add/replace a model spec in the panel; list = list published specs.',
          },
          url: {
            type: 'string',
            description: 'Paper URL for action=fetch. http(s) only; arXiv /abs/ and /html/ pages are extracted specially.',
          },
          maxChars: {
            type: 'integer',
            description: 'fetch: maximum characters returned (default 40000, max 120000).',
          },
          spec: {
            type: 'object',
            description:
              'publish: the architecture spec. Required: name, summary. Recommended: org, released, paper{title,url}, tags[], stats{}, config{layers,dModel,heads,kvHeads,headDim,experts,shared,topK,vocab}, ideas[{title,body,formula,vars[[symbol,meaning]]}], stack[{id,label,sub,kind,desc,shape,formula,vars}]. Use LaTeX subset: \\frac{a}{b}, \\sum_{i}^{n}, \\sqrt{x}, \\mathrm{softmax}, \\text{...}, subscripts, Greek letters.',
            additionalProperties: true,
          },
        },
        required: ['action'],
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: true,
          required: ['ok', 'action'],
          properties: {
            ok: { type: 'boolean' },
            action: { type: 'string' },
            url: { type: 'string' },
            title: { type: 'string' },
            text: { type: 'string' },
            chars: { type: 'integer' },
            truncated: { type: 'boolean' },
            id: { type: 'string' },
            name: { type: 'string' },
            models: { type: 'array', items: { type: 'object', additionalProperties: true } },
            message: { type: 'string' },
          },
        },
        render: (_args, value) => {
          if (value.action === 'fetch') {
            const head = `Fetched ${value.url} (${value.chars} chars${value.truncated ? ', truncated' : ''})`
            return [{ type: 'text', text: `${head}\n\n${String(value.text ?? '').slice(0, 12000)}` }]
          }
          if (value.action === 'publish') {
            return [{ type: 'text', text: `${value.message ?? 'Published'} (id: ${value.id})` }]
          }
          const names = (value.models ?? []).map((m) => `- ${m.name} (${m.id})`).join('\n')
          return [{ type: 'text', text: names || 'No specs published yet.' }]
        },
      },
      async execute(args) {
        const action = String(args?.action ?? '')
        if (action === 'fetch') return toolFetch(ctx, String(args?.url ?? ''), args?.maxChars)
        if (action === 'publish') return toolPublish(args?.spec)
        if (action === 'list') return toolList()
        if (action === 'clear') {
          const cleared = customModels.size
          customModels.clear()
          return { ok: true, action: 'clear', message: `Cleared ${cleared} published specs.`, models: [] }
        }
        throw new Error(`paper_lab: unknown action "${action}"`)
      },
      presentCall: (args) => ({
        card: 'generic',
        title:
          args?.action === 'publish'
            ? `Publish architecture: ${args?.spec?.name ?? 'untitled'}`
            : args?.action === 'list'
              ? 'List Arch Lab specs'
              : `Read paper: ${args?.url ?? ''}`,
        kind: args?.action === 'fetch' ? 'fetch' : 'other',
      }),
    }),
  )
}

/* ------------------------------------------------------------------ routes */

async function handleRoute(ctx, req, res) {
  const url = new URL(req.url ?? '/', 'http://paper-lab.local')
  try {
    if (url.pathname === `${ROUTE_PREFIX}library`) {
      const library = await readLibrary()
      return json(res, 200, library)
    }
    if (url.pathname === `${ROUTE_PREFIX}custom`) {
      return json(res, 200, { models: [...customModels.values()] })
    }
    if (url.pathname === `${ROUTE_PREFIX}fetch`) {
      const target = url.searchParams.get('url') ?? ''
      const maxChars = clamp(Number(url.searchParams.get('max') ?? 60000), 2000, MAX_FETCH_CHARS)
      const page = await fetchPaper(ctx, target, maxChars)
      return json(res, 200, page)
    }
    if (url.pathname === `${ROUTE_PREFIX}health`) {
      return json(res, 200, { ok: true, custom: customModels.size, version: 8 })
    }
    return json(res, 404, { ok: false, error: 'not found' })
  } catch (error) {
    return json(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) })
  }
}

function json(res, status, value) {
  const body = JSON.stringify(value)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  })
  res.end(body)
}

async function readLibrary() {
  try {
    const text = await fs.readFile(DATA_FILE, 'utf8')
    const parsed = JSON.parse(text)
    return { ...parsed, source: 'builtin' }
  } catch (error) {
    return { models: [], error: error instanceof Error ? error.message : String(error) }
  }
}

/* ------------------------------------------------------------------- tools */

async function toolFetch(ctx, target, rawMax) {
  if (!target) throw new Error('paper_lab.fetch requires url')
  const maxChars = clamp(Number(rawMax ?? 40000), 2000, 120000)
  const page = await fetchPaper(ctx, target, maxChars)
  return {
    ok: true,
    action: 'fetch',
    url: page.url,
    title: page.title,
    text: page.text,
    chars: page.text.length,
    truncated: page.truncated,
  }
}

function toolPublish(rawSpec) {
  if (!rawSpec || typeof rawSpec !== 'object' || Array.isArray(rawSpec)) {
    throw new Error('paper_lab.publish requires a spec object')
  }
  const encoded = JSON.stringify(rawSpec)
  if (Buffer.byteLength(encoded) > MAX_SPEC_BYTES) throw new Error('spec exceeds 256 KiB')
  const name = typeof rawSpec.name === 'string' ? rawSpec.name.trim() : ''
  if (!name) throw new Error('spec.name is required')
  if (rawSpec.summary !== undefined && typeof rawSpec.summary !== 'string') throw new Error('spec.summary must be a string')
  if (rawSpec.ideas !== undefined && !Array.isArray(rawSpec.ideas)) throw new Error('spec.ideas must be an array')
  if (rawSpec.stack !== undefined && !Array.isArray(rawSpec.stack)) throw new Error('spec.stack must be an array')

  const base = slug(name)
  let id = `custom-${base}`
  let n = 2
  while (customModels.has(id) && customModels.get(id).name !== name) id = `custom-${base}-${n++}`

  const model = {
    id,
    name,
    org: typeof rawSpec.org === 'string' ? rawSpec.org : 'Agent',
    released: typeof rawSpec.released === 'string' ? rawSpec.released : new Date().toISOString().slice(0, 7),
    paper: rawSpec.paper && typeof rawSpec.paper === 'object' ? rawSpec.paper : undefined,
    summary: typeof rawSpec.summary === 'string' ? rawSpec.summary : '',
    tags: Array.isArray(rawSpec.tags) ? rawSpec.tags.filter((t) => typeof t === 'string').slice(0, 8) : ['Agent'],
    stats: rawSpec.stats && typeof rawSpec.stats === 'object' ? rawSpec.stats : {},
    config: rawSpec.config && typeof rawSpec.config === 'object' ? rawSpec.config : {},
    ideas: Array.isArray(rawSpec.ideas) ? rawSpec.ideas.slice(0, 16) : [],
    stack: Array.isArray(rawSpec.stack) ? rawSpec.stack.slice(0, 40) : undefined,
    accent: typeof rawSpec.accent === 'string' ? rawSpec.accent : undefined,
    origin: 'agent',
    publishedAt: new Date().toISOString(),
  }
  customModels.delete(id)
  customModels.set(id, model)
  while (customModels.size > MAX_CUSTOM) customModels.delete(customModels.keys().next().value)
  return {
    ok: true,
    action: 'publish',
    id,
    name,
    models: [...customModels.values()].map((m) => ({ id: m.id, name: m.name })),
    message: `Published "${name}" to Arch Lab. The panel refreshes within a few seconds.`,
  }
}

function toolList() {
  return {
    ok: true,
    action: 'list',
    models: [...customModels.values()].map((m) => ({ id: m.id, name: m.name, org: m.org, ideas: m.ideas.length })),
  }
}

/* ------------------------------------------------------------------- fetch */

async function fetchPaper(ctx, target, maxChars) {
  const url = normalizeUrl(target)
  let pageUrl = url
  let page = null
  const arxiv = url.match(/^https?:\/\/arxiv\.org\/abs\/([^?#]+)/i)
  if (arxiv) {
    const htmlUrl = `https://arxiv.org/html/${arxiv[1]}`
    try {
      const probe = await readText(ctx, htmlUrl)
      if (probe && probe.html && probe.html.length > 6000) {
        page = probe
        pageUrl = htmlUrl
      }
    } catch {
      // No HTML rendering for this paper; fall back to the abstract page.
    }
  }
  if (!page) page = await readText(ctx, url)
  const title = extractTitle(page.html) || url
  let text = page.kind === 'text' ? page.html : htmlToText(page.html)
  text = text.replace(/\n{3,}/g, '\n\n').trim()
  const truncated = text.length > maxChars
  return { ok: true, url: pageUrl, title, text: truncated ? text.slice(0, maxChars) : text, truncated, chars: text.length }
}

function normalizeUrl(raw) {
  let parsed
  try {
    parsed = new URL(raw.trim())
  } catch {
    throw new Error('invalid URL')
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('only http(s) URLs are allowed')
  const host = parsed.hostname.toLowerCase()
  const blocked =
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host.endsWith('.local') ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  if (blocked) throw new Error('private network addresses are not allowed')
  return parsed.href
}

async function readText(ctx, url) {
  const signal = AbortSignal.timeout(30000)
  if (/arxiv\.org\/html\//i.test(url)) {
    try {
      return await fetchDirect(url, signal)
    } catch {
      // fall through to the Harness web service
    }
  }
  const web = ctx.get('web')
  if (web) {
    try {
      const result = await web.fetch({ url }, signal)
      if (result && result.statusCode >= 200 && result.statusCode < 300 && result.body) {
        const content = String(result.body.content || '')
        const shortArxivHtml = /arxiv\.org\/html\//i.test(url) && content.length < 60000
        if (!shortArxivHtml) return { html: content, kind: result.body.kind }
      }
    } catch {
      // fall through to the platform fetch
    }
  }
  return fetchDirect(url, signal)
}

async function fetchDirect(url, signal) {
  const response = await fetch(url, {
    signal,
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36',
      accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5',
    },
  })
  if (!response.ok) throw new Error(`paper fetch failed: HTTP ${response.status}`)
  const type = response.headers.get('content-type') ?? ''
  const body = await response.text()
  return { html: body, kind: /html|xml/i.test(type) ? 'html' : 'text' }
}

const ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  rsquo: '’',
  lsquo: '‘',
  ldquo: '“',
  rdquo: '”',
  middot: '·',
  times: '×',
  le: '≤',
  ge: '≥',
  ne: '≠',
  rarr: '→',
  larr: '←',
  harr: '↔',
}

function decodeEntities(input) {
  return input
    .replace(/&#x([0-9a-f]+);/gi, (_m, hex) => safeChar(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_m, dec) => safeChar(parseInt(dec, 10)))
    .replace(/&([a-z][a-z0-9]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m)
}

function safeChar(code) {
  try {
    return String.fromCodePoint(code)
  } catch {
    return ''
  }
}

function extractTitle(html) {
  const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
  if (og) return decodeEntities(og[1]).trim()
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  if (title) return decodeEntities(title[1]).replace(/\s+/g, ' ').trim()
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  if (h1) return decodeEntities(h1[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
  return ''
}

/** Turn a paper page into readable text; MathML `alttext` becomes `$...$`. */
export function htmlToText(html) {
  let s = html
  s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ')
  s = s.replace(/<style[\s\S]*?<\/style>/gi, ' ')
  s = s.replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
  s = s.replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
  s = s.replace(/<dialog[\s\S]*?<\/dialog>/gi, ' ')
  s = s.replace(/<form[\s\S]*?<\/form>/gi, ' ')
  s = s.replace(/<button[\s\S]*?<\/button>/gi, ' ')
  s = s.replace(/<footer[\s\S]*?<\/footer>/gi, ' ')

  // Keep LaTeX from MathML before tags disappear.
  s = s.replace(/<math\b[^>]*\balttext=["']([^"']*)["'][^>]*>[\s\S]*?<\/math>/gi, (_m, alt) => ` $${decodeEntities(alt)}$ `)
  s = s.replace(/<annotation[^>]*encoding=["']application\/x-tex["'][^>]*>([\s\S]*?)<\/annotation>/gi, (_m, tex) => ` $${decodeEntities(tex)}$ `)

  s = s.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_m, level, body) => `\n\n${'#'.repeat(Number(level))} ${stripTags(body)}\n\n`)
  s = s.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, body) => `\n- ${stripTags(body)}`)
  s = s.replace(/<\/(p|div|section|article|tr|blockquote|figcaption|table)>/gi, '\n\n')
  s = s.replace(/<br\s*\/?>/gi, '\n')
  s = s.replace(/<td[^>]*>/gi, ' | ')
  s = s.replace(/<[^>]+>/g, ' ')
  s = decodeEntities(s)
  s = s.replace(/[ \t\u00a0]+/g, ' ')
  s = s.replace(/ *\n */g, '\n')
  s = s.replace(/\n{3,}/g, '\n\n')
  return s.trim()
}

function stripTags(input) {
  return decodeEntities(input.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
}

/* ------------------------------------------------------------------ helpers */

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.round(value)))
}

function slug(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'model'
}
