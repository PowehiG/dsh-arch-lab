/* ------------------------------------------------------------------ icons */
const ICON_PATHS = {
  search: 'M10.5 4a6.5 6.5 0 1 0 4.03 11.6L20 21l1-1-5.4-5.47A6.5 6.5 0 0 0 10.5 4Zm0 1.5a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z',
  sparkles: 'M12 2.5l1.7 4.8L18.5 9l-4.8 1.7L12 15.5l-1.7-4.8L5.5 9l4.8-1.7L12 2.5Zm6.5 10l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9.9-2.4ZM5 14l.7 1.9 1.9.7-1.9.7L5 19.2l-.7-1.9-1.9-.7 1.9-.7L5 14Z',
  columns: 'M4 5h6v14H4V5Zm10 0h6v14h-6V5ZM5.5 6.5v11h3v-11h-3Zm10 0v11h3v-11h-3Z',
  sigma: 'M18 4v2h-9l5 6-5 6h9v2H7v-1.6l5.5-6.4L7 5.6V4h11Z',
  refresh: 'M12 4a8 8 0 0 1 7.7 5.9l1.4-.8.5 1.6-3.4 1.1-1.1-3.4 1.5-.5.5 1.4A6.5 6.5 0 1 0 18.4 15l1.4.8A8 8 0 1 1 12 4Z',
  chevron: 'M9 5l7 7-7 7-1.1-1.1L14 12 7.9 5.9 9 5Z',
  down: 'M12 4v12.2l4.6-4.6L18 13l-6 6-6-6 1.4-1.4 4.6 4.6V4h2Z',
  left: 'M11 5 4 12l7 7 1.1-1.1L6.2 12l5.9-5.9L11 5Z',
  close: 'M6.2 4.8 12 10.6l5.8-5.8 1.4 1.4L13.4 12l5.8 5.8-1.4 1.4L12 13.4l-5.8 5.8-1.4-1.4L10.6 12 4.8 6.2l1.4-1.4Z',
  external: 'M14 4h6v6h-2V7.4l-7.3 7.3-1.4-1.4L16.6 6H14V4ZM5 5h5v2H7v10h10v-3h2v5H5V5Z',
  plus: 'M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z',
  minus: 'M5 11h14v2H5v-2Z',
  fit: 'M4 9V4h5v2H6v3H4Zm11-5h5v5h-2V6h-3V4ZM4 15h2v3h3v2H4v-5Zm14 0h2v5h-5v-2h3v-3Z',
  layers: 'M12 3 2.5 8 12 13l9.5-5L12 3Zm0 2.3L17.9 8 12 10.7 6.1 8 12 5.3ZM3.5 12 12 16.5 20.5 12l1.5.8L12 18.5 2 12.8l1.5-.8Zm0 4L12 20.5 20.5 16l1.5.8L12 22.5 2 16.8l1.5-.8Z',
  wave: 'M2 12c2.5 0 2.5-6 5-6s2.5 12 5 12 2.5-6 5-6 2.5 3 5 3v2c-2.5 0-2.5-3-5-3s-2.5 6-5 6-2.5-12-5-12-2.5 6-5 6v-2Z',
  grid: 'M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Zm-7-7v3h3V6H6Zm9 0v3h3V6h-3ZM6 15v3h3v-3H6Zm9 0v3h3v-3h-3Z',
  split: 'M12 4v5m0 0L6 15m6-6 6 6M4 17h4v4H4v-4Zm12 0h4v4h-4v-4ZM10 2h4v4h-4V2Z',
  box: 'M12 2.5 21 7v10l-9 4.5L3 17V7l9-4.5Zm0 2.2L5.4 8.1 12 11.5l6.6-3.4L12 4.7ZM5 9.7v6.1l6 3v-6.1l-6-3Zm8 9.1 6-3V9.7l-6 3v6.1Z',
  target: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 2a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm0 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 2a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm-1 3v2h2V8h-2Zm0 4v5h2v-5h-2Z',
  book: 'M5 4h9a4 4 0 0 1 4 4v12H8a3 3 0 0 1-3-3V4Zm2 2v11a1 1 0 0 0 1 1h8V8a2 2 0 0 0-2-2H7Zm3 2h5v2h-5V8Zm0 4h5v2h-5v-2Z',
  play: 'M8 5v14l11-7L8 5Z',
  pause: 'M7 5h4v14H7V5Zm6 0h4v14h-4V5Z',
  check: 'M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6L20.1 7.4l-1.4-1.4-9.2 10.2Z',
  filter: 'M3 5h18v2H3V5Zm3 6h12v2H6v-2Zm3 6h6v2H9v-2Z',
  copy: 'M8 3h10a2 2 0 0 1 2 2v12h-2V5H8V3ZM5 7h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Zm0 2v10h9V9H5Z',
  download: 'M11 3h2v9.2l3.6-3.6L18 10l-6 6-6-6 1.4-1.4 3.6 3.6V3ZM5 19h14v2H5v-2Z',
  zap: 'M13 2 4 14h6l-1 8 9-12h-6l1-8Z',
  cpu: 'M9 2h2v2h2V2h2v2h2a3 3 0 0 1 3 3v2h2v2h-2v2h2v2h-2v2a3 3 0 0 1-3 3h-2v2h-2v-2h-2v2H9v-2H7a3 3 0 0 1-3-3v-2H2v-2h2v-2H2V9h2V7a3 3 0 0 1 3-3h2V2Zm-2 4v12h10V6H7Zm2 3h6v6H9V9Z',
  merge: 'M7 4H4v5h2V6h1a5 5 0 0 1 5 5v3h2v-3a7 7 0 0 0-7-7Zm10 0h3v5h-2V6h-1a7 7 0 0 0-7 7v7h2v-7a5 5 0 0 1 5-5Z',
}

function Glyph({ name, size = 16, className }) {
  const d = ICON_PATHS[name] || ICON_PATHS.info
  return h(
    'svg',
    {
      className,
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'currentColor',
      'aria-hidden': true,
      style: { display: 'block', flex: '0 0 auto' },
    },
    h('path', { d }),
  )
}

/* -------------------------------------------------------------- data model */
const KIND = {
  io: { label: 'I/O', color: 'var(--pl-amber)', icon: 'down' },
  norm: { label: 'Norm', color: 'var(--pl-slate)', icon: 'sigma' },
  attention: { label: 'Attention', color: 'var(--pl-cyan)', icon: 'wave' },
  moe: { label: 'MoE', color: 'var(--pl-violet)', icon: 'grid' },
  ffn: { label: 'FFN', color: 'var(--pl-violet)', icon: 'box' },
  router: { label: 'Router', color: 'var(--pl-pink)', icon: 'split' },
  expert: { label: 'Expert', color: 'var(--pl-violet)', icon: 'box' },
  residual: { label: 'Residual', color: 'var(--pl-slate)', icon: 'plus' },
  head: { label: 'Head', color: 'var(--pl-green)', icon: 'target' },
  repeat: { label: 'Block', color: 'var(--pl-indigo)', icon: 'layers' },
  linear: { label: 'Linear', color: 'var(--pl-cyan)', icon: 'merge' },
  conv: { label: 'Conv', color: 'var(--pl-cyan)', icon: 'wave' },
  cache: { label: 'Cache', color: 'var(--pl-green)', icon: 'layers' },
  indexer: { label: 'Indexer', color: 'var(--pl-pink)', icon: 'target' },
  selector: { label: 'Top-k', color: 'var(--pl-amber)', icon: 'filter' },
  state: { label: 'State', color: 'var(--pl-green)', icon: 'merge' },
  embed: { label: 'Embed', color: 'var(--pl-amber)', icon: 'down' },
  custom: { label: 'Module', color: 'var(--pl-indigo)', icon: 'cpu' },
}

const ACCENTS = ['#6d8cff', '#8b5cf6', '#14b8a6', '#f59e0b', '#f472b6', '#22d3ee', '#34d399', '#fb7185']

function num(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (!value) return 0
  const s = String(value).replace(/,/g, '').trim()
  const m = s.match(/^([\d.]+)\s*([KMBT])?/i)
  if (!m) return 0
  const base = Number(m[1])
  if (!Number.isFinite(base)) return 0
  const unit = (m[2] || '').toUpperCase()
  return base * ({ K: 1e3, M: 1e6, B: 1e9, T: 1e12 }[unit] || 1)
}

function fmtCount(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return '—'
  if (n >= 1e12) return trim(n / 1e12) + 'T'
  if (n >= 1e9) return trim(n / 1e9) + 'B'
  if (n >= 1e6) return trim(n / 1e6) + 'M'
  if (n >= 1e3) return trim(n / 1e3) + 'K'
  return String(Math.round(n))
}

function trim(n) {
  const v = n >= 100 ? n.toFixed(0) : n >= 10 ? n.toFixed(1) : n.toFixed(2)
  return v.replace(/\.0+$/, '').replace(/(\.\d)0$/, '$1')
}

function fmtBytes(bytes) {
  if (!bytes) return '—'
  if (bytes >= 1024 * 1024 * 1024) return trim(bytes / (1024 * 1024 * 1024)) + ' GB'
  if (bytes >= 1024 * 1024) return trim(bytes / (1024 * 1024)) + ' MB'
  if (bytes >= 1024) return trim(bytes / 1024) + ' KB'
  return Math.round(bytes) + ' B'
}

function estimateKvBytes(model) {
  const c = model.config || {}
  if (num(c.kvBytesPerToken) > 0) return num(c.kvBytesPerToken)
  const layers = num(c.kvLayers) || num(c.layers) || 61
  const tags = (model.tags || []).join(' ').toLowerCase()
  if (tags.includes('mla') || num(c.kvLora) > 0) {
    const latent = num(c.kvLora) || 512
    const rope = num(c.ropeDim) || 64
    return layers * (latent + rope) * 2
  }
  const kvHeads = num(c.kvHeads) || Math.max(1, Math.round((num(c.heads) || 32) / 4))
  const headDim = num(c.headDim) || 128
  return layers * kvHeads * headDim * 2 * 2
}

function shortStat(value) {
  return String(value)
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s+routed\s*/gi, ' ')
    .replace(/\s+shared\b/gi, '')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\s+/g, ' ')
    .trim()
}

function ctxLabel(value) {
  const n = num(value)
  return n >= 1024 ? fmtCount(n) : value
}

function attentionLabel(model) {
  const tags = (model.tags || []).join(' ').toLowerCase()
  if (tags.includes('csa2')) return 'CSA2 Sparse'
  if (tags.includes('dsa') && tags.includes('mla')) return 'MLA + DSA'
  if (tags.includes('dsa')) return 'Sparse Attention'
  if (tags.includes('csa') && tags.includes('hca')) return 'CSA + HCA'
  if (tags.includes('kda')) return 'KDA + MLA'
  if (tags.includes('lightning')) return 'Lightning Attention'
  if (tags.includes('hybrid swa')) return 'Hybrid SWA'
  if (tags.includes('mla')) return 'MLA'
  if (tags.includes('deltanet')) return 'Gated DeltaNet'
  if (tags.includes('hybrid') || tags.includes('linear attention')) return 'Hybrid Attention'
  if (tags.includes('gqa')) return 'GQA'
  if (tags.includes('mqa')) return 'MQA'
  return 'Self-Attention'
}


/* --------------------------------------------------------- 3D layer helpers */
function layerCount(model) {
  const c = model.config || {}
  const block = (model.stack || []).find((n) => n.kind === 'repeat' && n.inner)
  return Math.max(1, Math.min(256, Math.round(num(c.layers) || num(model.stats && model.stats.layers) || num(block && block.count) || 1)))
}

function layerPeriod(model) {
  const tags = (model.tags || []).join(' ').toLowerCase()
  if (tags.includes('kda')) return 4
  if (tags.includes('lightning')) return 8
  if (tags.includes('deltanet') || (tags.includes('linear attention') && tags.includes('gqa'))) return 4
  if (tags.includes('local/global')) return 6
  if (tags.includes('irope')) return 4
  if (tags.includes('sliding window') || tags.includes('hybrid swa')) return 2
  return 0
}

function layerVariant(model, index) {
  const tags = (model.tags || []).join(' ').toLowerCase()
  const period = layerPeriod(model)
  const full = period ? (index + 1) % period === 0 : true
  if (tags.includes('kda')) {
    return full
      ? { kind: 'mla', badge: 'MLA', label: 'MLA', desc: '每 4 层插入一次全注意力 MLA，负责跨层全局信息交换。' }
      : { kind: 'linear', badge: 'KDA', label: 'KDA', desc: 'Kimi Delta Attention：带门控的线性注意力，用常数状态替代完整 KV cache。' }
  }
  if (tags.includes('deltanet') || (tags.includes('linear attention') && tags.includes('gqa'))) {
    return full
      ? { kind: 'full', badge: 'GA', label: 'Gated Attention', desc: '每 4 层一次的全注意力，带输出门控；其余 3 层是线性注意力。' }
      : { kind: 'linear', badge: 'GDN', label: 'Gated DeltaNet', desc: 'Gated DeltaNet 线性注意力：只维护常数大小的矩阵状态，不保存完整 KV。' }
  }
  if (tags.includes('lightning attention')) {
    return full
      ? { kind: 'full', badge: 'FULL', label: 'Full Attention', desc: '每 8 层一次的全注意力，用来补回全局感受野。' }
      : { kind: 'linear', badge: 'LIGHT', label: 'Lightning Attention', desc: 'Lightning Attention：分块线性注意力，状态大小与序列长度无关。' }
  }
  if (tags.includes('local/global')) {
    return full
      ? { kind: 'global', badge: 'GLOBAL', label: 'Global Attention', desc: '每 6 层一次的全注意力，覆盖完整上下文。' }
      : { kind: 'local', badge: 'LOCAL', label: 'Local Attention', desc: '局部滑动窗口注意力，只保留最近 W 个 token 的 KV。' }
  }
  if (tags.includes('irope')) {
    return full
      ? { kind: 'global', badge: 'GLOBAL', label: 'Global Attention (NoPE)', desc: 'iRoPE 的全局层：不做位置插值，负责长程信息。' }
      : { kind: 'local', badge: 'LOCAL', label: 'Local Attention', desc: 'iRoPE 的局部层：分块注意力，块内使用 RoPE。' }
  }
  if (tags.includes('sliding window') || tags.includes('hybrid swa')) {
    return full
      ? { kind: 'full', badge: 'FULL', label: 'Full Attention', desc: '全注意力层，跨窗口交换信息。' }
      : { kind: 'local', badge: 'SWA', label: 'Sliding Window', desc: '滑动窗口注意力，KV cache 随窗口大小封顶。' }
  }
  if (tags.includes('csa') || tags.includes('hca') || tags.includes('csa2')) {
    const csa2 = tags.includes('csa2')
    const hca = !csa2 && tags.includes('hca') && index % 2 === 1
    return {
      kind: 'hybrid',
      badge: csa2 ? 'CSA2' : hca ? 'HCA' : 'CSA',
      label: csa2 ? 'CSA2' : hca ? 'HCA' : 'CSA',
      ratio: csa2 || !hca ? 4 : 128,
      desc: csa2
        ? 'CSA2：先把每 4 个 token 的 KV 压成一条 latent，再在压缩块上做稀疏选择；V4.1 用它降低长上下文 KV。'
        : hca
          ? 'HCA：以更激进的压缩比（m=128）压缩 KV，并在压缩块上做稠密注意力，与 CSA 层交替出现。'
          : 'CSA：先把每 4 个 token 的 KV 压成一条 latent，再在块级做稀疏选择，显著缩短长上下文的 KV。',
    }
  }
  if (tags.includes('dsa')) {
    return { kind: 'dsa', badge: 'DSA', label: tags.includes('mla') ? 'MLA + DSA' : 'DSA', desc: 'DSA 稀疏注意力：轻量 indexer 为每个 query 选 top-k 历史 token，再做精确注意力。' }
  }
  if (tags.includes('mla')) return { kind: 'mla', badge: 'MLA', label: 'MLA', desc: 'Multi-head Latent Attention：把 KV 压缩到低秩 latent，显著降低解码 KV cache。' }
  if (tags.includes('gqa')) return { kind: 'full', badge: 'GQA', label: 'GQA', desc: 'Grouped-Query Attention：多个 query head 共享一组 KV head。' }
  return { kind: 'full', badge: 'ATTN', label: attentionLabel(model), desc: '标准自注意力层。' }
}

function layerShapes(model) {
  const c = model.config || {}
  const tags = (model.tags || []).join(' ').toLowerCase()
  const d = num(c.dModel) || 4096
  const H = num(c.heads) || 32
  const KV = num(c.kvHeads) || H
  const Dh = num(c.headDim) || 128
  const E = num(c.experts) || 0
  const K = num(c.topK) || 2
  const V = num(c.vocab) || 0
  const latent = num(c.kvLora) || 512
  const rope = num(c.ropeDim) || 64
  const inter = num(c.moeInter) || Math.max(256, Math.round(d * 2.5))
  const W = num(c.window) || num(c.slidingWindow) ||
    (tags.includes('local/global') ? 1024
      : tags.includes('irope') ? 8192
        : (tags.includes('sliding window') || tags.includes('hybrid swa')) ? 128
          : Math.min(4096, num(c.context) || 4096))
  return {
    d, H, KV, Dh, E, K, V, W, latent, rope, inter,
    hidden: `[B, T, ${d}]`,
    q: `[B, ${H}, T, ${Dh}]`,
    kv: `[B, ${KV}, T, ${Dh}]`,
    qkv: `Q [B, ${H}, T, ${Dh}] · KV [B, ${KV}, T, ${Dh}]`,
    latent: `KV [B, T, ${latent}+${rope}]`,
    state: `S [B, ${H}, ${Dh}, ${Dh}]`,
    window: `[B, ${KV}, ${W}, ${Dh}]`,
    router: E > 1 ? `[B, T, ${E}]` : '[B, T, d]',
    topk: E > 1 ? `[B, T, ${K}]` : '[B, T, d]',
    expert: E > 1 ? `[B, T, ${inter}]` : `[B, T, ${inter}]`,
    out: `[B, T, ${d}]`,
    vocab: `[B, T, ${V ? fmtCount(V) : 'V'}]`,
  }
}

function layerAttentionShape(variant, shapes) {
  if (variant.kind === 'linear') return shapes.state
  if (variant.kind === 'local') return shapes.window
  if (variant.kind === 'mla' || variant.kind === 'dsa') return shapes.latent
  if (variant.kind === 'hybrid') {
    const ratio = variant.ratio || (/HCA/.test(variant.badge || '') ? 128 : 4)
    const dim = (shapes.latent.match(/\[B, T, (.+)\]/) || [])[1] || `${shapes.latent}+${shapes.rope}`
    return `[B, T/${ratio}, ${dim}]`
  }
  return shapes.qkv
}

function layerKvLabel(model, variant) {
  if (variant.kind === 'linear') return 'KV 0 · O(1) state'
  const c = model.config || {}
  const kvLayers = num(c.kvLayers) || layerCount(model)
  const per = model.kvBytes / Math.max(1, kvLayers)
  if (!per) return 'KV —'
  if (variant.kind === 'local') return `KV ${fmtBytes(per)} / layer · window`
  return `KV ${fmtBytes(per)} / layer`
}

function enrichLayerNode(node, variant, shapes) {
  let shape = node.shape || ''
  if (node.kind === 'norm' || node.kind === 'residual') shape = shapes.hidden
  if (node.kind === 'io') shape = node.shape || shapes.hidden
  if (node.kind === 'attention') shape = layerAttentionShape(variant, shapes)
  if (node.kind === 'moe') shape = `[B, T, ${shapes.E}] → top-${shapes.K} → [B, T, ${shapes.d}]`
  if (node.kind === 'router') shape = shapes.router
  if (node.kind === 'expert') shape = `[B, T, ${shapes.d}]`
  if (node.kind === 'head') shape = node.shape || shapes.vocab
  if (node.kind === 'embed') shape = node.shape || shapes.hidden
  let formula = node.formula || ''
  if (!formula && node.kind === 'attention') {
    if (variant.kind === 'linear') formula = 'S_t=\\alpha_t S_{t-1}+\\beta_t k_t v_t^{\\top},\\quad y_t=S_t q_t'
    else if (variant.kind === 'hybrid') formula = 'K_c=\\mathrm{Compress}(K; m),\\quad y=\\mathrm{softmax}\\!\\left(\\frac{QK_c^{\\top}}{\\sqrt{d_h}}\\right)V_c'
    else if (variant.kind === 'dsa') formula = 'I=\\mathrm{TopK}(\\mathrm{Indexer}(q,k)),\\quad y=\\mathrm{softmax}\\!\\left(qk_I^{\\top}/\\sqrt{d_h}\\right)v_I'
    else if (variant.kind === 'local') formula = 'y_t=\\mathrm{softmax}\\!\\left(q_tK_{t-W:t}^{\\top}/\\sqrt{d_h}\\right)V_{t-W:t}'
    else formula = '\\mathrm{Attn}(Q,K,V)=\\mathrm{softmax}\\!\\left(\\frac{QK^{\\top}}{\\sqrt{d_h}}\\right)V'
  }
  return {
    ...node,
    shape,
    shapeDetail: node.shape && node.shape !== shape ? node.shape : '',
    formula,
    sub: node.kind === 'attention' ? (variant.desc || node.sub) : node.sub,
  }
}

function buildLayerNodes(model, index) {
  const block = (model.stack || []).find((n) => n.kind === 'repeat' && n.inner) ||
    buildDefaultStack(model).find((n) => n.kind === 'repeat' && n.inner)
  const variant = layerVariant(model, index)
  const shapes = layerShapes(model)
  let nodes = (block && block.inner ? block.inner : buildDefaultStack(model).find((n) => n.kind === 'repeat').inner)
    .map((n) => ({ ...n, vars: n.vars || [] }))
  const attentions = nodes.filter((n) => n.kind === 'attention')
  if (attentions.length > 1) {
    const linearRe = /delta|kda|lightning|linear|gdn|mamba/i
    const wantLinear = variant.kind === 'linear'
    const drop = new Set()
    nodes.forEach((n, i) => {
      if (n.kind !== 'attention') return
      if (linearRe.test(n.label) !== wantLinear) {
        drop.add(i)
        if (nodes[i + 1] && nodes[i + 1].kind === 'residual') drop.add(i + 1)
      }
    })
    const kept = nodes.filter((_, i) => !drop.has(i))
    if (kept.some((n) => n.kind === 'attention')) nodes = kept
  }
  nodes = nodes.map((n) => {
    if (n.kind !== 'attention') return n
    if (attentions.length === 1) return { ...n, label: variant.label, sub: variant.desc }
    const isLinear = /delta|kda|lightning|linear|gdn|mamba/i.test(n.label)
    if (isLinear === (variant.kind === 'linear')) return n
    return { ...n, label: variant.label, sub: variant.desc }
  })
  return nodes.map((n) => enrichLayerNode(n, variant, shapes))
}

function buildLayerInfo(model, index) {
  const variant = layerVariant(model, index)
  const shapes = layerShapes(model)
  const nodes = buildLayerNodes(model, index)
  return {
    type: 'layer',
    key: `layer-${index}`,
    index,
    total: layerCount(model),
    label: `L${index + 1}`,
    title: `Transformer layer ${index + 1}`,
    tag: variant.badge,
    variant,
    shapes,
    nodes,
    shape: shapes.hidden,
    kv: layerKvLabel(model, variant),
    desc: variant.desc,
  }
}

function buildEndpointInfo(model, type) {
  const stack = model.stack || []
  const shapes = layerShapes(model)
  let node
  if (type === 'embed') {
    node = stack.find((n) => n.kind === 'io' && /embed|token/i.test(n.label)) || stack.find((n) => n.kind === 'io') || stack[0]
  } else if (type === 'norm') {
    node = [...stack].reverse().find((n) => n.kind === 'norm') || { label: 'Final RMSNorm', kind: 'norm', shape: shapes.hidden }
  } else {
    node = stack.find((n) => n.kind === 'head' && /lm head|logits/i.test(n.label)) || stack.find((n) => n.kind === 'head') ||
      { label: 'LM Head', kind: 'head', shape: `${shapes.hidden} → ${shapes.vocab}`, desc: '输出词表 logits。' }
  }
  if (!node) {
    node = type === 'embed'
      ? { label: 'Token Embedding', kind: 'io', shape: `[B, T] → ${shapes.hidden}`, desc: '把 token id 映射为隐藏向量。' }
      : type === 'norm'
        ? { label: 'Final RMSNorm', kind: 'norm', shape: shapes.hidden, desc: '最终归一化。' }
        : { label: 'LM Head', kind: 'head', shape: `${shapes.hidden} → ${shapes.vocab}`, desc: '输出词表 logits。' }
  }
  const enriched = enrichLayerNode({ ...node, vars: node.vars || [] }, layerVariant(model, 0), shapes)
  return {
    type: 'endpoint',
    key: type,
    label: type === 'embed' ? 'EMBED' : type === 'norm' ? 'NORM' : 'HEAD',
    title: node.label,
    tag: type === 'embed' ? 'IO' : type === 'norm' ? 'NORM' : 'HEAD',
    kind: node.kind,
    nodes: [enriched],
    shape: type === 'head' ? shapes.vocab : shapes.hidden,
    kv: type === 'head' ? 'logits' : type === 'embed' ? 'token ids' : 'hidden',
    desc: node.desc || '',
  }
}

function sampleLayerIndices(total, max, active) {
  if (total <= max) return Array.from({ length: total }, (_, i) => i)
  const out = new Set()
  for (let i = 0; i < max; i++) out.add(Math.round((i * (total - 1)) / (max - 1)))
  if (active >= 0) out.add(active)
  if (out.size > max) {
    const removable = [...out].filter((i) => i !== 0 && i !== total - 1 && i !== active)
    removable.sort((a, b) => Math.abs(a - active) - Math.abs(b - active))
    out.delete(removable[0])
  }
  return [...out].sort((a, b) => a - b)
}

function buildDefaultStack(model) {
  const c = model.config || {}
  const layers = num(c.layers) || 32
  const d = num(c.dModel) || 4096
  const experts = num(c.experts) || 0
  const topK = num(c.topK) || 2
  const active = attentionLabel(model)
  const inner = [
    { id: 'in', label: 'h  (残差流)', sub: `[B, T, ${d}]`, kind: 'io', shape: `[B, T, ${d}]`, desc: '上一层输出的隐藏状态，也是两条残差捷径的起点。' },
    { id: 'norm1', label: 'RMSNorm', sub: 'pre-norm', kind: 'norm', shape: `[B, T, ${d}]`, desc: 'Pre-Norm：先归一化再进入注意力子层。', formula: '\\mathrm{RMSNorm}(x)=\\frac{x}{\\sqrt{\\frac{1}{d}\\sum_i x_i^2+\\epsilon}}\\odot\\gamma' },
    { id: 'attn', label: active, sub: `${num(c.heads) || '?'} heads · ${num(c.kvHeads) || '?'} KV`, kind: 'attention', shape: `[B, T, ${num(c.heads) || '?'}, ${num(c.headDim) || 128}]`, desc: `注意力子层：${active}。` },
    { id: 'res1', label: 'Residual +', sub: 'h ← h + Attn(Norm(h))', kind: 'residual', shape: `[B, T, ${d}]`, desc: '注意力子层的残差回写。' },
    { id: 'norm2', label: 'RMSNorm', sub: 'pre-norm', kind: 'norm', shape: `[B, T, ${d}]`, desc: '前馈子层前的归一化。' },
    experts > 1
      ? { id: 'moe', label: 'MoE', sub: `${experts} experts · top-${topK}`, kind: 'moe', shape: `[B, T, ${d}] → [B, T, ${d}]`, desc: `稀疏混合专家：每个 token 激活 ${topK} 个专家。`, formula: 'y=\\sum_{i\\in\\mathrm{TopK}}g_i\\,\\mathrm{FFN}_i(x)' }
      : { id: 'ffn', label: 'SwiGLU FFN', sub: 'd → 4d → d', kind: 'ffn', shape: `[B, T, ${d}] → [B, T, ${d}]`, desc: '稠密前馈网络，使用 SwiGLU 激活。', formula: '\\mathrm{FFN}(x)=W_2\\left(\\mathrm{SiLU}(W_1x)\\odot W_3x\\right)' },
    { id: 'res2', label: 'Residual +', sub: 'h ← h + FFN(Norm(h))', kind: 'residual', shape: `[B, T, ${d}]`, desc: '前馈子层的残差回写。' },
  ]
  return [
    { id: 'tokens', label: 'Input Tokens', sub: 'tokenizer · [B, T]', kind: 'io', shape: `[B, T]`, desc: '文本先被 tokenizer 切成 token id 序列，这是整张计算图的起点。' },
    { id: 'embed', label: 'Token Embedding', sub: `${num(c.vocab) ? fmtCount(num(c.vocab)) : '?'} × ${d}`, kind: 'io', shape: `[B, T] → [B, T, ${d}]`, desc: '把 token id 映射为隐藏向量。' },
    { id: 'block', label: 'Transformer Block', sub: `${active}${experts > 1 ? ` · ${experts} experts` : ''}`, kind: 'repeat', count: layers, shape: `[B, T, ${d}] → [B, T, ${d}]`, desc: `重复 ${layers} 层；每层包含注意力与${experts > 1 ? ' MoE' : '前馈'}两个子层。`, inner },
    { id: 'norm', label: 'Final RMSNorm', sub: `${d}`, kind: 'norm', shape: `[B, T, ${d}]`, desc: '最终归一化。' },
    { id: 'head', label: 'LM Head', sub: `${d} × ${num(c.vocab) ? fmtCount(num(c.vocab)) : '?'}`, kind: 'head', shape: `[B, T, ${d}] → [B, T, V]`, desc: '输出词表 logits。' },
    { id: 'sample', label: 'Logits → Next Token', sub: 'softmax · temperature · top-p', kind: 'head', shape: `[B, T, V] → [B, T]`, desc: '对 logits 做 softmax 与采样，得到下一个 token；自回归解码时这一步会被反复执行。' },
  ]
}

function normalizeNode(raw, index) {
  const kind = KIND[raw?.kind] ? raw.kind : 'custom'
  return {
    id: raw?.id || `n${index}`,
    label: raw?.label || 'Module',
    sub: raw?.sub || '',
    kind,
    shape: raw?.shape || '',
    desc: raw?.desc || '',
    formula: raw?.formula || '',
    vars: Array.isArray(raw?.vars) ? raw.vars : [],
    count: num(raw?.count),
    inner: Array.isArray(raw?.inner) ? raw.inner.map(normalizeNode) : undefined,
  }
}

function normalizeModel(raw, index) {
  const config = raw?.config && typeof raw.config === 'object' ? { ...raw.config } : {}
  const stats = raw?.stats && typeof raw.stats === 'object' ? raw.stats : {}
  if (!config.context && stats.context) config.context = num(stats.context)
  if (!config.layers && stats.layers) config.layers = num(stats.layers)
  if (!config.experts && stats.experts) config.experts = num(stats.experts)
  if (!config.topK && stats.topK) config.topK = num(stats.topK)
  const model = {
    id: raw?.id || `model-${index}`,
    name: raw?.name || 'Untitled model',
    org: raw?.org || 'Unknown lab',
    released: raw?.released || '',
    accent: raw?.accent || ACCENTS[index % ACCENTS.length],
    paper: raw?.paper && typeof raw.paper === 'object' ? raw.paper : null,
    summary: raw?.summary || '',
    tags: Array.isArray(raw?.tags) ? raw.tags.filter((t) => typeof t === 'string') : [],
    stats,
    config,
    ideas: Array.isArray(raw?.ideas)
      ? raw.ideas
          .filter((idea) => idea && (idea.title || idea.body))
          .map((idea, i) => ({
            title: idea.title || `Idea ${i + 1}`,
            body: idea.body || '',
            formula: idea.formula || '',
            vars: Array.isArray(idea.vars) ? idea.vars.filter((v) => Array.isArray(v) && v.length >= 2) : [],
          }))
      : [],
    origin: raw?.origin || 'builtin',
    publishedAt: raw?.publishedAt || '',
    confidence: raw?.confidence || '',
    sources: Array.isArray(raw?.sources) ? raw.sources : [],
  }
  model.totalParams = num(stats.total) || num(config.total)
  model.activeParams = num(stats.active) || num(config.active) || model.totalParams
  model.kvBytes = estimateKvBytes(model)
  model.activeRatio = model.totalParams > 0 ? Math.min(1, model.activeParams / model.totalParams) : 1
  model.stack = Array.isArray(raw?.stack) && raw.stack.length
    ? raw.stack.map(normalizeNode)
    : buildDefaultStack(model)
  return model
}

function normalizeLibrary(payload) {
  const models = Array.isArray(payload?.models) ? payload.models : []
  return models.map(normalizeModel)
}

/* ------------------------------------------------------------------- seed */
const SEED = [
  {
    id: 'deepseek-v3-2',
    name: 'DeepSeek-V3.2',
    org: 'DeepSeek-AI',
    released: '2025-12',
    accent: '#4d6bfe',
    paper: { title: 'DeepSeek-V3.2', url: 'https://arxiv.org/abs/2512.02556' },
    summary: 'MLA + DeepSeekMoE 主干加上 DSA 稀疏注意力：轻量索引器为每个 query 选 top-k 历史 token，把长上下文成本从 O(L²) 降到 O(L·k)。',
    tags: ['MoE', 'DSA', 'MLA', 'MTP'],
    stats: { total: '671B', active: '37B', layers: '61', context: '128K', experts: '256 + 1 shared', topK: '8' },
    config: { layers: 61, dModel: 7168, heads: 128, kvHeads: 128, headDim: 128, experts: 256, shared: 1, topK: 8, vocab: 129280, context: 131072 },
    ideas: [
      {
        title: 'DSA：学习出来的 top-k 稀疏注意力',
        body: 'Lightning Indexer 为每个 query 给历史 token 打分，选出 k 个后只在这些 token 上做精确 softmax 注意力。',
        formula: 'I_{t,s}=\\sum_{j=1}^{H_I}w_{t,j}\\cdot\\mathrm{ReLU}\\left(q_{t,j}\\cdot k_s\\right),\\quad \\mathcal{S}_t=\\mathrm{TopK}_{s<t}\\left(I_{t,s},k\\right)',
        vars: [['I_{t,s}', '索引分数'], ['k', '保留的 token 数（2048）'], ['\\mathcal{S}_t', '选中的历史 token 集合']],
      },
      {
        title: 'MLA：低秩 KV 压缩',
        body: '缓存 512 维潜向量 + 64 维 RoPE 键，而不是完整 K/V。',
        formula: 'c_t^{KV}=W^{DKV}h_t,\\quad k_t^{C}=W^{UK}c_t^{KV},\\quad v_t^{C}=W^{UV}c_t^{KV}',
        vars: [['c_t^{KV}', '每 token 每层缓存的潜向量'], ['W^{DKV}', '下投影 7168 → 512']],
      },
      {
        title: 'DeepSeekMoE：细粒度 + 共享专家',
        body: '256 个路由专家中激活 8 个，再加一个始终激活的共享专家。',
        formula: 'y=\\sum_{i\\in\\mathrm{TopK}}g_i\\,\\mathrm{FFN}_i(x)+\\mathrm{FFN}_{s}(x)',
        vars: [['g_i', '门控权重'], ['\\mathrm{FFN}_s', '共享专家']],
      },
    ],
  },
  {
    id: 'kimi-k2',
    name: 'Kimi K2',
    org: 'Moonshot AI',
    released: '2025-07',
    accent: '#8b5cf6',
    paper: { title: 'Kimi K2: Open Agentic Intelligence', url: 'https://arxiv.org/abs/2507.20534' },
    summary: '1T 总参数、32B 激活的稀疏 MoE，384 专家 top-8，MLA 注意力；训练用 MuonClip 保持稳定。',
    tags: ['MoE', 'MLA', 'MuonClip'],
    stats: { total: '1.04T', active: '32B', layers: '61', context: '128K', experts: '384 + 1 shared', topK: '8' },
    config: { layers: 61, dModel: 7168, heads: 64, kvHeads: 64, headDim: 128, experts: 384, shared: 1, topK: 8, vocab: 163840, context: 131072 },
    ideas: [
      {
        title: 'QK-Clip：在 logits 爆炸前裁剪',
        body: '监控每层最大 logits，超过阈值 τ 就按比例缩放 Q/K 权重。',
        formula: '\\alpha=\\min\\left(1,\\frac{\\tau}{\\max_{i,j}\\left|q_i^{\\top}k_j\\right|}\\right)',
        vars: [['\\tau', '允许的最大 logit'], ['\\alpha', '裁剪系数']],
      },
      {
        title: '极端稀疏 MoE',
        body: '总参数 1.04T，每个 token 只激活 8 + 1 个专家，计算量接近 32B 稠密模型。',
        formula: '\\text{ratio}=\\frac{8+1}{384+1}\\approx 2.3\\%',
        vars: [['384', '路由专家数'], ['8', '激活专家数']],
      },
    ],
  },
]
