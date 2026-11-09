/* ------------------------------------------------------------ math parser */
const GREEK = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε', zeta: 'ζ',
  eta: 'η', theta: 'θ', vartheta: 'ϑ', iota: 'ι', kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν',
  xi: 'ξ', omicron: 'ο', pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', upsilon: 'υ', phi: 'φ',
  varphi: 'ϕ', chi: 'χ', psi: 'ψ', omega: 'ω',
  Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π', Sigma: 'Σ', Phi: 'Φ',
  Psi: 'Ψ', Omega: 'Ω',
}
const SYMBOLS = {
  cdot: '·', times: '×', div: '÷', pm: '±', mp: '∓', ast: '∗', star: '⋆', circ: '∘',
  bullet: '•', oplus: '⊕', ominus: '⊖', otimes: '⊗', odot: '⊙', oslash: '⊘',
  le: '≤', leq: '≤', ge: '≥', geq: '≥', neq: '≠', ne: '≠', approx: '≈', equiv: '≡',
  sim: '∼', simeq: '≃', propto: '∝', lt: '<', gt: '>', ll: '≪', gg: '≫',
  to: '→', rightarrow: '→', leftarrow: '←', leftrightarrow: '↔', Rightarrow: '⇒',
  Leftarrow: '⇐', leftrightarrows: '⇆', mapsto: '↦', longrightarrow: '⟶', implies: '⟹',
  in: '∈', notin: '∉', ni: '∋', subset: '⊂', subseteq: '⊆', supset: '⊃', supseteq: '⊇',
  cup: '∪', cap: '∩', emptyset: '∅', forall: '∀', exists: '∃', neg: '¬', land: '∧', lor: '∨',
  infty: '∞', partial: '∂', nabla: '∇', top: '⊤', bot: '⊥', angle: '∠', triangle: '△',
  prime: '′', dprime: '″', ldots: '…', cdots: '⋯', vdots: '⋮', ddots: '⋱',
  langle: '⟨', rangle: '⟩', lceil: '⌈', rceil: '⌉', lfloor: '⌊', rfloor: '⌋',
  vert: '|', Vert: '‖', mid: '|', hbar: 'ℏ', ell: 'ℓ', Re: 'ℜ', Im: 'ℑ', aleph: 'ℵ',
  checkmark: '✓', degree: '°', percent: '%',
  sum: '∑', prod: '∏', coprod: '∐', int: '∫', oint: '∮', bigcup: '⋃', bigcap: '⋂',
  dots: '…', dotsc: '…', uparrow: '↑', downarrow: '↓', updownarrow: '↕', nearrow: '↗', searrow: '↘',
  setminus: '∖', therefore: '∴', because: '∵', colon: ':', semicolon: ';',
}
const FUNCTIONS = [
  'ln', 'lim', 'sup', 'inf', 'sin', 'cos', 'tan', 'arcsin', 'arccos', 'arctan',
  'softmax', 'sigmoid', 'silu', 'relu', 'gelu', 'swish', 'tanh', 'TopK', 'topk', 'argmax',
  'argmin', 'softplus', 'sinkhorn', 'NewtonSchulz', 'max', 'min', 'log', 'exp', 'det',
  'diag', 'rank', 'sign', 'Tr', 'trace', 'concat', 'stack', 'where', 'mean', 'std',
]
const SPACES = { ',': '.18em', ';': '.28em', ':': '.22em', '!': '-.1em', ' ': '.28em', quad: '1em', qquad: '2em', enspace: '.5em' }
const BIGOPS = { sum: '∑', prod: '∏', coprod: '∐', int: '∫', oint: '∮', bigcup: '⋃', bigcap: '⋂', bigoplus: '⨁', bigotimes: '⨂' }

function stripOuterBraces(value) {
  const s = String(value ?? '').trim()
  if (s.startsWith('{') && s.endsWith('}')) {
    let depth = 0
    for (let i = 0; i < s.length; i++) {
      if (s[i] === '{') depth++
      else if (s[i] === '}') {
        depth--
        if (depth === 0 && i !== s.length - 1) return s
      }
    }
    return s.slice(1, -1)
  }
  return s
}

function splitTopLevelLines(tex) {
  const out = []
  let depth = 0
  let current = ''
  const s = String(tex ?? '')
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (c === '\\' && s[i + 1] === '\\') {
      if (depth === 0) {
        out.push(current)
        current = ''
        i++
        continue
      }
    }
    if (c === '{') depth++
    else if (c === '}') depth = Math.max(0, depth - 1)
    current += c
  }
  out.push(current)
  return out.filter((line) => line.trim().length > 0)
}

function tokenizeTex(input) {
  const src = String(input ?? '')
  let i = 0
  const len = src.length

  function sym(value, extra) {
    return { t: 'sym', v: value, ...extra }
  }

  function skip() {
    while (i < len && (src[i] === ' ' || src[i] === '\n' || src[i] === '\t')) i++
  }

  function parseArg() {
    skip()
    if (i >= len) return sym('')
    if (src[i] === '{') return parseGroup()
    if (src[i] === '\\') return parseCommand()
    if (src[i] === '^' || src[i] === '_') return sym(src[i++])
    const ch = src[i++]
    return { t: 'seq', items: [sym(ch)] }
  }

  function parseGroup() {
    if (src[i] !== '{') return parseArg()
    i++
    const items = parseSeq()
    if (src[i] === '}') i++
    return { t: 'seq', items }
  }

  function readRawGroup() {
    if (src[i] !== '{') {
      const ch = src[i++] ?? ''
      return ch
    }
    i++
    let depth = 1
    let out = ''
    while (i < len) {
      const c = src[i]
      if (c === '\\' && src[i + 1] === '{') { out += '{'; i += 2; continue }
      if (c === '\\' && src[i + 1] === '}') { out += '}'; i += 2; continue }
      if (c === '{') { depth++; out += c; i++; continue }
      if (c === '}') {
        depth--
        i++
        if (depth === 0) break
        out += c
        continue
      }
      out += c
      i++
    }
    return out
  }

  function parseCommand() {
    i++ // backslash
    if (i >= len) return sym('\\')
    const c = src[i]
    if (!/[a-zA-Z]/.test(c)) {
      i++
      if (c === '\\') return { t: 'newline' }
      if (c === '{' || c === '}' || c === '|' || c === '%' || c === '&' || c === '#' || c === '_') return sym(c)
      if (c === ' ') return { t: 'space', w: '.28em' }
      return sym(c)
    }
    let name = ''
    while (i < len && /[a-zA-Z]/.test(src[i])) name += src[i++]

    if (name === 'frac' || name === 'dfrac' || name === 'tfrac') {
      const a = parseArg()
      const b = parseArg()
      return { t: 'frac', num: a, den: b }
    }
    if (name === 'sqrt') {
      let index = null
      skip()
      if (src[i] === '[') {
        i++
        let raw = ''
        while (i < len && src[i] !== ']') raw += src[i++]
        if (src[i] === ']') i++
        index = { t: 'seq', items: [sym(raw)] }
      }
      return { t: 'sqrt', body: parseArg(), index }
    }
    if (name === 'left' || name === 'right' || name === 'middle') {
      skip()
      let delim = src[i++] ?? '.'
      if (delim === '\\') {
        let dn = ''
        while (i < len && /[a-zA-Z]/.test(src[i])) dn += src[i++]
        delim = SYMBOLS[dn] || (GREEK[dn] || dn)
      }
      if (name === 'right') return { t: 'right', delim }
      if (name === 'middle') return sym(delim)
      const items = parseSeq()
      let right = ')'
      if (src[i] === '\\' && src.startsWith('\\right', i)) {
        i += '\\right'.length
        skip()
        let rd = src[i++] ?? '.'
        if (rd === '\\') {
          let dn = ''
          while (i < len && /[a-zA-Z]/.test(src[i])) dn += src[i++]
          rd = SYMBOLS[dn] || (GREEK[dn] || dn)
        }
        right = rd
      }
      return { t: 'delim', left: delim, right, body: { t: 'seq', items } }
    }
    if (name === 'big' || name === 'Big' || name === 'bigg' || name === 'Bigg' || name === 'bigl' || name === 'Bigl' || name === 'bigr' || name === 'Bigr') {
      skip()
      let delim = src[i++] ?? ''
      if (delim === '\\') {
        let dn = ''
        while (i < len && /[a-zA-Z]/.test(src[i])) dn += src[i++]
        delim = SYMBOLS[dn] || dn
      }
      return { t: 'delim', left: delim, right: '', body: { t: 'seq', items: [] }, big: true }
    }
    if (name === 'mathrm' || name === 'mathbf' || name === 'mathit' || name === 'mathcal' || name === 'mathbb' || name === 'mathsf' || name === 'mathtt' || name === 'boldsymbol') {
      const style = name.replace('math', '').toLowerCase()
      return { t: 'style', style, body: parseArg() }
    }
    if (name === 'operatorname' || name === 'operatorname*') return { t: 'style', style: 'text', body: parseArg() }
    if (name === 'text' || name === 'textrm' || name === 'textbf' || name === 'mbox') {
      return { t: 'text', v: readRawGroup() }
    }
    if (name === 'hat' || name === 'widehat' || name === 'bar' || name === 'overline' || name === 'tilde' || name === 'widetilde' || name === 'vec' || name === 'dot' || name === 'ddot') {
      return { t: 'accent', kind: name, body: parseArg() }
    }
    if (name === 'underbrace' || name === 'overbrace') {
      return { t: name, body: parseArg() }
    }
    if (FUNCTIONS.includes(name)) return { t: 'func', v: name }
    if (BIGOPS[name]) return { t: 'bigop', op: BIGOPS[name] }
    if (GREEK[name]) return sym(GREEK[name])
    if (SYMBOLS[name] !== undefined) return sym(SYMBOLS[name])
    if (SPACES[name] !== undefined) return { t: 'space', w: SPACES[name] }
    if (name === 'bmod') return { t: 'seq', items: [{ t: 'space', w: '.22em' }, { t: 'func', v: 'mod' }, { t: 'space', w: '.22em' }] }
    if (name === 'begin' || name === 'end') {
      const env = readRawGroup()
      return { t: 'raw', v: `\\${name}{${env}}` }
    }
    if (name === 'not') {
      const next = parseArg()
      return { t: 'style', style: 'not', body: next }
    }
    return { t: 'raw', v: `\\${name}` }
  }

  function attach(base) {
    let sup = null
    let sub = null
    for (;;) {
      skip()
      if (src[i] === '^') {
        i++
        sup = parseArg()
      } else if (src[i] === '_') {
        i++
        sub = parseArg()
      } else break
    }
    if (!sup && !sub) return base
    if (base.t === 'bigop') return { ...base, over: sup ?? base.over, under: sub ?? base.under }
    if (base.t === 'underbrace' || base.t === 'overbrace') return { ...base, under: sub, over: sup }
    return { t: 'scripts', base, sup, sub }
  }

  function parseNode() {
    skip()
    if (i >= len) return null
    const c = src[i]
    if (c === '}') return null
    if (c === '\\') {
      if (src.startsWith('\\right', i)) return null
      const cmd = parseCommand()
      if (cmd.t === 'newline') return cmd
      return attach(cmd)
    }
    if (c === '{') return attach(parseGroup())
    if (c === '^' || c === '_') {
      i++
      const arg = parseArg()
      return attach({ t: 'seq', items: [] , firstScript: c, arg})
    }
    if (c === '&') { i++; return { t: 'space', w: '.6em' } }
    if (c === '~') { i++; return { t: 'space', w: '.35em' } }
    if (c === '\n' || c === '\t') { i++; return { t: 'space', w: '.2em' } }

    const rest = src.slice(i)
    for (const fn of FUNCTIONS) {
      if (rest.startsWith(fn) && !/[A-Za-z0-9]/.test(rest[fn.length] ?? '')) {
        i += fn.length
        return attach({ t: 'func', v: fn })
      }
    }
    if (/[0-9]/.test(c)) {
      let num = ''
      while (i < len && /[0-9.,]/.test(src[i])) num += src[i++]
      return attach(sym(num))
    }
    i++
    return attach(sym(c))
  }

  function parseSeq() {
    const items = []
    for (;;) {
      skip()
      if (i >= len || src[i] === '}') break
      if (src[i] === '\\' && src.startsWith('\\right', i)) break
      const node = parseNode()
      if (!node) break
      items.push(node)
    }
    return items
  }

  return parseSeq()
}

/* --------------------------------------------------------------- rendering */
function renderMathNode(node, key) {
  if (!node) return null
  const k = key ?? undefined
  switch (node.t) {
    case 'sym':
      return h('span', { key: k, className: 'pl-m-sym' }, node.v)
    case 'func':
      return h('span', { key: k, className: 'pl-m-sym pl-m-text' }, node.v)
    case 'seq':
      return h('span', { key: k, className: 'pl-m-m-seq' }, (node.items || []).map((child, i) => renderMathNode(child, i)))
    case 'space':
      return h('span', { key: k, className: 'pl-m-space', style: { width: node.w } })
    case 'newline':
      return null
    case 'frac':
      return h('span', { key: k, className: 'pl-m-frac' }, [
        h('span', { key: 'n', className: 'pl-m-num' }, renderMathNode(node.num)),
        h('span', { key: 'd', className: 'pl-m-den' }, renderMathNode(node.den)),
      ])
    case 'sqrt':
      return h('span', { key: k, className: 'pl-m-sqrt' }, [
        node.index ? h('span', { key: 'i', className: 'pl-m-sup', style: { alignSelf: 'flex-start' } }, renderMathNode(node.index)) : null,
        h('span', { key: 'r', className: 'pl-m-rad' }, '√'),
        h('span', { key: 'b', className: 'pl-m-sqrtbody' }, renderMathNode(node.body)),
      ])
    case 'scripts':
      return h('span', { key: k, className: 'pl-m-inline' }, [
        renderMathNode(node.base, 'b'),
        node.sub ? h('span', { key: 's', className: 'pl-m-sub' }, renderMathNode(node.sub)) : null,
        node.sup ? h('span', { key: 'p', className: 'pl-m-sup' }, renderMathNode(node.sup)) : null,
      ])
    case 'bigop':
      return h('span', { key: k, className: 'pl-m-bigop' }, [
        node.over ? h('span', { key: 'o', className: 'pl-m-bigop-lim pl-m-bigop-over' }, renderMathNode(node.over)) : null,
        h('span', { key: 'p', className: 'pl-m-bigop-op' }, node.op),
        node.under ? h('span', { key: 'u', className: 'pl-m-bigop-lim pl-m-bigop-under' }, renderMathNode(node.under)) : null,
      ])
    case 'delim':
      return h('span', { key: k, className: 'pl-m-delim' }, [
        node.left && node.left !== '.' ? h('span', { key: 'l', className: 'pl-m-delim-char' }, node.left) : null,
        h('span', { key: 'b', className: 'pl-m-delim-body' }, renderMathNode(node.body)),
        node.right && node.right !== '.' ? h('span', { key: 'r', className: 'pl-m-delim-char' }, node.right) : null,
      ])
    case 'accent': {
      const marks = { hat: 'ˆ', widehat: 'ˆ', bar: '¯', overline: '¯', tilde: '˜', widetilde: '˜', vec: '→', dot: '˙', ddot: '¨' }
      return h('span', { key: k, className: 'pl-m-accent' }, [
        h('span', { key: 'm', className: 'pl-m-accent-mark' }, marks[node.kind] ?? 'ˆ'),
        h('span', { key: 'b', className: 'pl-m-accent-body' }, renderMathNode(node.body)),
      ])
    }
    case 'underbrace':
      return h('span', { key: k, className: 'pl-m-underbrace' }, [
        h('span', { key: 'b', className: 'pl-m-underbrace-body' }, renderMathNode(node.body)),
        node.under ? h('span', { key: 'u', className: 'pl-m-underbrace-label' }, renderMathNode(node.under)) : null,
      ])
    case 'overbrace':
      return h('span', { key: k, className: 'pl-m-overbrace' }, [
        node.over ? h('span', { key: 'o', className: 'pl-m-overbrace-label' }, renderMathNode(node.over)) : null,
        h('span', { key: 'b', className: 'pl-m-overbrace-body' }, renderMathNode(node.body)),
      ])
    case 'style': {
      const cls = {
        rm: 'pl-m-text', bf: 'pl-m-bold', it: 'pl-m-italic', cal: 'pl-m-cal',
        bb: 'pl-m-bb', sf: 'pl-m-text', tt: 'pl-m-mono', not: 'pl-m-not',
      }[node.style] || ''
      return h('span', { key: k, className: 'pl-m-inline ' + cls }, renderMathNode(node.body))
    }
    case 'text':
      return h('span', { key: k, className: 'pl-m-text' }, node.v)
    case 'raw':
      return h('span', { key: k, className: 'pl-m-raw' }, node.v)
    default:
      return null
  }
}

function MathBlock({ tex, inline }) {
  const lines = splitTopLevelLines(stripOuterBraces(tex))
  if (!lines.length) return null
  const body = lines.map((line, idx) =>
    h(
      'div',
      { key: idx, className: inline ? 'pl-math-inline' : 'pl-math-line' },
      renderMathNode({ t: 'seq', items: tokenizeTex(line) }),
    ),
  )
  return h('div', { className: inline ? 'pl-m-inline' : 'pl-math' }, body)
}

/** Tiny rich text: `code`, **bold**, $inline math$. */
function RichText({ text }) {
  const src = String(text ?? '')
  if (!src) return null
  const parts = []
  const re = /(\$[^$]+\$|`[^`]+`|\*\*[^*]+\*\*)/g
  let last = 0
  let match
  let key = 0
  while ((match = re.exec(src))) {
    if (match.index > last) parts.push(src.slice(last, match.index))
    const token = match[0]
    if (token.startsWith('$')) parts.push(h(MathBlock, { key: 'm' + key++, tex: token.slice(1, -1), inline: true }))
    else if (token.startsWith('`')) parts.push(h('code', { key: 'c' + key++, className: 'pl-code' }, token.slice(1, -1)))
    else parts.push(h('strong', { key: 'b' + key++ }, token.slice(2, -2)))
    last = match.index + token.length
  }
  if (last < src.length) parts.push(src.slice(last))
  return h('span', null, parts)
}
