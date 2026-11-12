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
import { createRequire } from 'node:module'

const DIR = path.dirname(fileURLToPath(import.meta.url))
const DATA_FILE = path.join(DIR, 'data', 'models.json')
const ROUTE_PREFIX = '/paper-lab/api/'
const ROUTE_BASE = '/paper-lab/api'
const MAX_FETCH_CHARS = 160000
const MAX_SPEC_BYTES = 256 * 1024
const MAX_CUSTOM = 40
const LATEST_TTL = 15 * 60 * 1000
const require = createRequire(import.meta.url)
let pdfParse = null

/** Specs published by the agent during this host process, newest first. */
const customModels = new Map()
/* Latest online discoveries, refreshed lazily and cached for LATEST_TTL. */
let latestCache = null

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
            enum: ['fetch', 'publish', 'list', 'clear', 'discover'],
            description: 'fetch = download paper text; discover = search recent arXiv papers and Hugging Face configs; publish = add/replace a model spec; list = list published specs.',
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
          if (value.action === 'discover') {
            const papers = (value.papers ?? []).slice(0, 5).map((p) => `- [${p.published || '?'}] ${p.title} (${p.url})`).join('\n')
            const models = (value.models ?? []).slice(0, 5).map((m) => `- ${m.name} (${m.org}) · ${m.config?.layers || '?'} layers`).join('\n')
            return [{ type: 'text', text: `Latest discoveries\nPapers:\n${papers || 'none'}\nModels:\n${models || 'none'}` }]
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
        if (action === 'discover') return { ok: true, action: 'discover', ...(await latestModels(false)) }
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
    if (url.pathname === `${ROUTE_PREFIX}latest` || url.pathname === `${ROUTE_PREFIX}refresh`) {
      const force = url.pathname.endsWith('refresh') || url.searchParams.get('force') === '1'
      const data = await latestModels(force)
      return json(res, 200, data)
    }
    if (url.pathname === `${ROUTE_PREFIX}health`) {
      return json(res, 200, { ok: true, custom: customModels.size, version: 10 })
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

function parseArxiv(target) {
  let parsed
  try {
    parsed = new URL(target)
  } catch {
    return null
  }
  if (!/(^|\.)arxiv\.org$/i.test(parsed.hostname)) return null
  const m = parsed.pathname.match(/^\/(abs|pdf|html)\/(.+?)\/?$/i)
  if (!m) return null
  let id
  try {
    id = decodeURIComponent(m[2])
  } catch {
    id = m[2]
  }
  id = id.replace(/\.pdf$/i, '').replace(/v\d+$/i, '').replace(/\/+$/, '')
  if (!id || /\s/.test(id)) return null
  return { kind: m[1].toLowerCase(), id, url: `https://arxiv.org/abs/${id}` }
}

async function fetchPaper(ctx, target, maxChars) {
  const url = normalizeUrl(target)
  const arxiv = parseArxiv(url)
  let pageUrl = url
  let page = null
  let source = 'html'
  if (arxiv) {
    const htmlUrl = `https://arxiv.org/html/${arxiv.id}`
    try {
      const probe = await readText(ctx, htmlUrl)
      const html = probe && probe.kind === 'html' ? String(probe.html || '') : ''
      const unavailable = /(no html (?:is )?available|html (?:version )?is not available|there is no html)/i.test(html)
      if (html.length > 6000 && !unavailable) {
        page = probe
        pageUrl = htmlUrl
        source = 'arxiv-html'
      }
    } catch {
      // Older papers may not have an arXiv HTML rendering.
    }
    if (!page) {
      try {
        const pdf = await fetchDirect(`https://arxiv.org/pdf/${arxiv.id}`, AbortSignal.timeout(45000))
        if (pdf && pdf.kind === 'pdf') {
          const text = await pdfToText(pdf.buffer)
          if (text.length > 1500) {
            page = { html: text, kind: 'text' }
            pageUrl = `https://arxiv.org/pdf/${arxiv.id}`
            source = 'pdf'
          }
        }
      } catch {
        // Fall through to the abstract page.
      }
    }
    if (!page) {
      page = await readText(ctx, arxiv.url)
      pageUrl = arxiv.url
      source = 'arxiv-abs'
    }
  } else {
    page = await readText(ctx, url)
    source = page.kind === 'pdf' ? 'pdf' : page.kind === 'text' ? 'text' : 'html'
    if (page.kind === 'pdf') {
      page = { html: await pdfToText(page.buffer), kind: 'text' }
      source = 'pdf'
    }
  }
  const raw = page.kind === 'text' ? page.html : htmlToText(extractMainHtml(page.html))
  let text = cleanText(raw)
  const title = extractTitle(page.html) || (source === 'pdf' ? guessPdfTitle(text) : '') || url
  const truncated = text.length > maxChars
  return { ok: true, url: pageUrl, source, title, text: truncated ? text.slice(0, maxChars) : text, truncated, chars: text.length }
}

function cleanText(input) {
  return String(input || '')
    .replace(/\u0000/g, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0001-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function guessPdfTitle(text) {
  const lines = String(text || '').split(/\n+/).map((l) => l.trim()).filter(Boolean)
  for (const line of lines.slice(0, 12)) {
    if (line.length < 6 || line.length > 140) continue
    if (/^(arxiv|abstract|keywords|introduction|contents|preprint)\b/i.test(line)) continue
    if (/^[A-Z0-9 .:;()\-]{6,}$/.test(line) && line === line.toUpperCase()) return line
    if (!/[.!?]$/.test(line) && line.split(/\s+/).length <= 18) return line
  }
  return lines[0] || ''
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
  if (/\.pdf(?:$|[?#])/i.test(url)) {
    const direct = await fetchDirect(url, signal)
    if (direct.kind === 'pdf') return { html: await pdfToText(direct.buffer), kind: 'text' }
    return direct
  }
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
  const direct = await fetchDirect(url, signal)
  if (direct.kind === 'pdf') return { html: await pdfToText(direct.buffer), kind: 'text' }
  return direct
}

async function fetchDirect(url, signal) {
  const response = await fetch(url, {
    signal,
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36',
      accept: 'text/html,application/xhtml+xml,application/pdf,text/plain;q=0.9,*/*;q=0.5',
    },
  })
  if (!response.ok) throw new Error(`paper fetch failed: HTTP ${response.status}`)
  const type = response.headers.get('content-type') ?? ''
  if (/pdf/i.test(type) || /\.pdf(?:$|[?#])/i.test(url)) {
    return { html: '', kind: 'pdf', buffer: Buffer.from(await response.arrayBuffer()) }
  }
  const body = await response.text()
  return { html: body, kind: /html|xml/i.test(type) ? 'html' : 'text' }
}

async function pdfToText(buffer) {
  if (!buffer || !buffer.length) return ''
  if (!pdfParse) {
    const loaded = require('pdf-parse')
    pdfParse = loaded && loaded.default ? loaded.default : loaded
  }
  const parsed = await pdfParse(buffer)
  return cleanText(parsed && parsed.text ? parsed.text : '')
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
  const titleH1 = html.match(/<h1[^>]*class=["'][^"']*(?:ltx_title|title)[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i)
  if (titleH1) {
    const value = stripTags(titleH1[1])
    if (value.length > 3) return value
  }
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  if (h1) {
    const value = stripTags(h1[1])
    if (value.length > 3) return value
  }
  const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
  if (og) return decodeEntities(og[1]).trim()
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  if (title) return decodeEntities(stripTags(title[1])).replace(/\s+/g, ' ').trim()
  return ''
}

function extractMainHtml(html) {
  const source = String(html || '')
  const article = source.match(/<article\b[^>]*class=["'][^"']*ltx_document[^"']*["'][^>]*>([\s\S]*?)<\/article>/i)
  if (article) return article[1]
  const main = source.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)
  if (main) return main[1]
  const generic = source.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)
  return generic ? generic[1] : source
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
  s = s.replace(/<header[\s\S]*?<\/header>/gi, ' ')
  s = s.replace(/<aside[\s\S]*?<\/aside>/gi, ' ')
  s = s.replace(/<svg[\s\S]*?<\/svg>/gi, ' ')

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

/* --------------------------------------------------------------- latest sources */

const HOST_LAB_HINTS = [
  ['deepseek', 'DeepSeek-AI'], ['qwen', 'Alibaba Qwen'], ['kimi', 'Moonshot AI'], ['moonshot', 'Moonshot AI'],
  ['minimax', 'MiniMax'], ['zhipu', 'Zhipu AI'], ['glm', 'Zhipu AI'], ['llama', 'Meta'], ['meta ai', 'Meta'],
  ['gemma', 'Google DeepMind'], ['gemini', 'Google DeepMind'], ['gpt', 'OpenAI'], ['mistral', 'Mistral AI'],
  ['grok', 'xAI'], ['ernie', 'Baidu'], ['baidu', 'Baidu'], ['hunyuan', 'Tencent'], ['step', 'StepFun'],
  ['yi', '01.AI'], ['baichuan', 'Baichuan'], ['internlm', 'Shanghai AI Lab'], ['pangu', 'Huawei'],
  ['peking', 'Peking University'], ['tsinghua', 'Tsinghua University'], ['nvidia', 'NVIDIA'], ['microsoft', 'Microsoft'],
]

function guessHostOrg(text) {
  const low = String(text || '').toLowerCase()
  for (const [needle, org] of HOST_LAB_HINTS) {
    if (new RegExp(`(^|[^a-z0-9])${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`, 'i').test(low)) return org
  }
  return 'arXiv'
}

async function latestModels(force) {
  const now = Date.now()
  if (!force && latestCache && now - latestCache.at < LATEST_TTL) {
    return { ...latestCache.data, cached: true }
  }
  const warnings = []
  const [papers, models] = await Promise.all([
    searchArxiv().catch((error) => {
      warnings.push('arXiv: ' + (error instanceof Error ? error.message : String(error)))
      return []
    }),
    searchHuggingFace().catch((error) => {
      warnings.push('Hugging Face: ' + (error instanceof Error ? error.message : String(error)))
      return []
    }),
  ])
  const data = {
    ok: true,
    updated: new Date().toISOString(),
    cached: false,
    sources: ['arxiv', 'huggingface'],
    warnings,
    papers,
    models,
  }
  latestCache = { at: now, data }
  return data
}

async function searchArxiv() {
  const query = 'cat:cs.CL AND (abs:"large language model" OR abs:"mixture-of-experts" OR abs:"attention" OR abs:"architecture")'
  const params = new URLSearchParams({
    search_query: query,
    start: '0',
    max_results: '24',
    sortBy: 'submittedDate',
    sortOrder: 'descending',
  })
  const response = await fetch(`https://export.arxiv.org/api/query?${params}`, {
    signal: AbortSignal.timeout(25000),
    headers: { 'user-agent': 'ArchLab/2.1 (arXiv discovery; contact via GitHub PowehiG)' },
  })
  if (!response.ok) throw new Error(`arXiv API HTTP ${response.status}`)
  const xml = await response.text()
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)]
  const seen = new Set()
  const out = []
  for (const match of entries) {
    const body = match[1]
    const rawId = xmlMatch(body, 'id')
    if (!rawId) continue
    const id = rawId.replace(/^https?:\/\/arxiv\.org\/abs\//i, '').replace(/v\d+$/i, '').trim()
    if (!id || seen.has(id)) continue
    seen.add(id)
    const title = xmlText(xmlMatch(body, 'title'))
    const summary = xmlText(xmlMatch(body, 'summary'))
    if (!title || !summary) continue
    const published = xmlMatch(body, 'published') || xmlMatch(body, 'updated')
    const authors = [...body.matchAll(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/gi)]
      .map((m) => xmlText(m[1])).filter(Boolean)
    out.push({
      id,
      title: title.slice(0, 220),
      summary: summary.slice(0, 900),
      published: published ? published.slice(0, 10) : '',
      authors: authors.slice(0, 8),
      org: guessHostOrg(`${title} ${summary} ${authors.join(' ')}`),
      url: `https://arxiv.org/abs/${id}`,
      html: `https://arxiv.org/html/${id}`,
      pdf: `https://arxiv.org/pdf/${id}`,
      source: 'arxiv',
    })
    if (out.length >= 18) break
  }
  return out
}

function xmlMatch(body, tag) {
  const match = body.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return match ? match[1] : ''
}

function xmlText(input) {
  return decodeEntities(String(input || '').replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

async function searchHuggingFace() {
  const latestParams = new URLSearchParams({
    sort: 'lastModified',
    direction: '-1',
    limit: '60',
    filter: 'text-generation',
    full: 'true',
  })
  const popularParams = new URLSearchParams({
    sort: 'likes',
    direction: '-1',
    limit: '30',
    filter: 'text-generation',
    full: 'true',
  })
  const mode = /^(1|true|yes)$/i.test(String(process.env.ARCH_LAB_HF_BASE_ONLY || ''))
  const read = async (params, discovery) => {
    const response = await fetch(`https://huggingface.co/api/models?${params}`, {
      signal: AbortSignal.timeout(25000),
      headers: { 'user-agent': 'ArchLab/2.1 (Hugging Face discovery; contact via GitHub PowehiG)' },
    })
    if (!response.ok) throw new Error(`Hugging Face API HTTP ${response.status}`)
    const list = await response.json()
    if (!Array.isArray(list)) throw new Error('unexpected Hugging Face response')
    return list.map((m) => ({ ...m, _discovery: discovery }))
  }
  const settled = await Promise.allSettled([read(latestParams, 'latest'), read(popularParams, 'popular')])
  const merged = []
  const seen = new Set()
  for (const result of settled) {
    if (result.status !== 'fulfilled') continue
    for (const item of result.value) {
      if (!item || !item.id || seen.has(item.id)) continue
      seen.add(item.id)
      merged.push(item)
    }
  }
  if (!merged.length) {
    const reason = settled.find((r) => r.status === 'rejected')
    throw reason && reason.reason ? reason.reason : new Error('Hugging Face returned no models')
  }
  const candidates = merged
    .filter((m) => isArchitectureCandidate(m, mode))
    .slice(0, 24)
  const specs = await mapLimit(candidates, 4, async (m) => {
    try {
      const configUrl = `https://huggingface.co/${m.id}/raw/main/config.json`
      const r = await fetch(configUrl, {
        signal: AbortSignal.timeout(10000),
        headers: { 'user-agent': 'ArchLab/2.1' },
      })
      if (!r.ok) return null
      const cfg = await r.json()
      const spec = huggingFaceSpec(m, cfg)
      if (spec) spec.discovery = m._discovery || 'latest'
      return spec
    } catch {
      return null
    }
  })
  return specs.filter(Boolean).slice(0, 12)
}

function isArchitectureCandidate(m, baseOnly) {
  const id = String(m.id || '')
  const tags = Array.isArray(m.tags) ? m.tags.join(' ') : ''
  if (!id || !m.pipeline_tag || m.pipeline_tag !== 'text-generation') return false
  if (m.private || m.gated) return false
  if (!(m.siblings || []).some((f) => f && f.rfilename === 'config.json')) return false
  const noisy = /(^|[\s,;:_-])(gguf|awq|gptq|quantized|4bit|8bit|onnx|mlx|lora|adapter|dpo|rlhf|heretic|abliterated|uncensored|merge|distill)(?=[\s,;:_-]|$)/i
  if (noisy.test(id + ' ' + tags)) return false
  if (m._discovery === 'latest') {
    const known = /(deepseek-ai|qwen|meta-llama|mistralai|openai|google|zai-org|moonshotai|minimax|nvidia|microsoft|baidu|tencent|stepfun|01-ai)/i
    if (!known.test(id) && Number(m.likes || 0) < 2 && Number(m.downloads || 0) < 100) return false
  }
  if (baseOnly && /(chat|instruct|it\b)/i.test(id)) return false
  return true
}

function huggingFaceSpec(m, cfg) {
  if (!cfg || typeof cfg !== 'object') return null
  const layers = numValue(cfg.num_hidden_layers, cfg.n_layer, cfg.num_layers, cfg.n_layers)
  const dModel = numValue(cfg.hidden_size, cfg.n_embd, cfg.d_model, cfg.model_dim)
  const heads = numValue(cfg.num_attention_heads, cfg.n_head, cfg.num_heads, cfg.n_heads)
  if (!layers || !dModel || layers < 8 || dModel < 1024 || layers > 300 || dModel > 65536) return null
  const kvHeads = numValue(cfg.num_key_value_heads, cfg.num_kv_heads, cfg.n_kv_heads) || heads || 1
  const headDim = numValue(cfg.head_dim) || (heads ? Math.round(dModel / heads) : 0)
  const experts = numValue(cfg.num_local_experts, cfg.num_experts, cfg.n_routed_experts, cfg.moe_num_experts, cfg.n_experts)
  const shared = numValue(cfg.n_shared_experts, cfg.num_shared_experts, cfg.shared_expert_num)
  const topK = numValue(cfg.num_experts_per_tok, cfg.num_experts_per_token, cfg.moe_top_k, cfg.top_k_experts, cfg.num_selected_experts)
  const context = numValue(cfg.max_position_embeddings, cfg.max_seq_len, cfg.seq_length, cfg.n_positions, cfg.max_sequence_length)
  const vocab = numValue(cfg.vocab_size, cfg.padded_vocab_size)
  const id = String(m.id || '')
  const name = id.split('/').pop() || id
  const org = id.includes('/') ? id.split('/')[0] : 'Hugging Face'
  const modelType = String(cfg.model_type || (Array.isArray(cfg.architectures) ? cfg.architectures[0] : '') || 'transformer')
  const tags = []
  if (experts > 1) tags.push('MoE')
  if (heads && kvHeads < heads) tags.push('GQA')
  if (/mla|latent/i.test(modelType) || cfg.kv_lora_rank) tags.push('MLA')
  if (/vha|virtual.?head/i.test(modelType)) tags.push('VHA')
  if (/deepseek/i.test(modelType)) tags.push('MLA')
  if (/moe|mixture/i.test(modelType) && experts > 1) tags.push('MoE')
  if (context >= 131072) tags.push('Long Context')
  if (/linear|recurrent|mamba|rwkv/i.test(modelType)) tags.push('Linear Attention')
  if (!tags.length) tags.push('Dense')
  const stats = {
    total: '?',
    active: '?',
    layers: String(layers),
    context: context ? compact(context) : '?',
    experts: experts > 1 ? String(experts) + (topK ? ' · top-' + topK : '') : 'Dense',
    topK: topK ? String(topK) : '—',
  }
  const config = { layers, dModel, heads, kvHeads, headDim, experts: experts || 0, shared: shared || 0, topK: topK || 0, vocab: vocab || 0, context: context || 0 }
  const summary = `${org}/${name} · ${modelType} · ${layers} layers · d=${dModel} · ${kvHeads} KV heads${experts > 1 ? ` · ${experts} experts` : ''}. 从 Hugging Face config.json 自动读取的架构配置；总参/激活需以模型卡为准。`
  return {
    id: 'hf-' + slug(id),
    name,
    org,
    released: typeof m.lastModified === 'string' ? m.lastModified.slice(0, 7) : '',
    paper: { title: id, url: `https://huggingface.co/${id}` },
    summary,
    tags: [...new Set(tags)].slice(0, 6),
    stats,
    config,
    ideas: [{
      title: '自动发现的 Hugging Face 架构',
      body: summary,
      formula: '',
      vars: [],
    }],
    confidence: 'config.json',
    sources: [`https://huggingface.co/${id}`],
    source: 'huggingface',
    url: `https://huggingface.co/${id}`,
    lastModified: m.lastModified || '',
    downloads: m.downloads || 0,
    likes: m.likes || 0,
  }
}

function numValue(...values) {
  for (const value of values) {
    const n = Number(value)
    if (Number.isFinite(n) && n > 0) return Math.round(n)
  }
  return 0
}

function compact(n) {
  if (!Number.isFinite(n) || n <= 0) return '?'
  if (n >= 1e12) return (n / 1e12).toFixed(2).replace(/\.0+$/, '') + 'T'
  if (n >= 1e9) return (n / 1e9).toFixed(2).replace(/\.0+$/, '') + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(2).replace(/\.0+$/, '') + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0+$/, '') + 'K'
  return String(n)
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length)
  let next = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++
      results[index] = await fn(items[index]).catch(() => null)
    }
  })
  await Promise.all(workers)
  return results
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

/* Named exports are also useful for standalone extraction tests. */
export { fetchPaper, parseArxiv, pdfToText, latestModels, searchArxiv, searchHuggingFace, isArchitectureCandidate, huggingFaceSpec }
