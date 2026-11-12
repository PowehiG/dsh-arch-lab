/* ------------------------------------------------------------------ 3D scene
 * Pure data for the per-layer 3D architecture. The UI turns every node into a
 * box/cylinder/grid in a WebGL scene; keeping the coordinates and graph here
 * makes the layout testable without a browser.
 *
 * Axis convention: Y is the residual-stream direction (bottom → top), X puts
 * the attention branch on the right and MoE on the left, Z separates parallel
 * projections/caches so the layer has visible depth instead of being a flat
 * diagram.
 */

const SCENE_SIZE = {
  io: [2.9, 0.62, 2.2],
  norm: [2.25, 0.5, 1.85],
  residual: [2.25, 0.5, 1.85],
  projection: [1.95, 0.72, 1.55],
  attention: [2.75, 0.92, 2.15],
  cache: [1.95, 1.65, 1.95],
  state: [2.25, 1.55, 2.25],
  router: [1.9, 0.62, 1.6],
  experts: [3.55, 2.35, 2.75],
  expert: [1.35, 0.72, 1.3],
  moe: [3.0, 1.15, 2.35],
  ffn: [2.9, 1.3, 2.25],
  head: [2.55, 0.72, 2.0],
  custom: [1.95, 0.72, 1.6],
  vha: [2.35, 0.78, 1.85],
  gate: [2.15, 0.72, 1.7],
}

function sceneSize(kind, special) {
  if (special === 'experts') return SCENE_SIZE.experts
  if (special === 'cache') return SCENE_SIZE.cache
  if (special === 'state') return SCENE_SIZE.state
  return SCENE_SIZE[kind] || SCENE_SIZE.custom
}

function sceneTopkTokens(model) {
  const c = model.config || {}
  return num(c.dsaTopK) || num(c.indexTopK) || num(c.topkTokens) || 2048
}

function sceneLatentDim(shapes) {
  const m = String(shapes.latent || '').match(/\[B, T, (.+)\]/)
  return m ? m[1] : `${shapes.latent || 512}+${shapes.rope || 64}`
}

/**
 * Build the complete 3D graph for one transformer layer.
 * Nodes carry the same fields the inspector expects (shape/formula/desc),
 * plus x/y/z/w/h/d for the scene and `group` for highlighting.
 */
function buildSceneGraph(model, index) {
  const info = buildLayerInfo(model, index)
  const v = info.variant
  const sh = info.shapes
  const c = model.config || {}
  const E = num(c.experts) || 0
  const K = num(c.topK) || 0
  const latentDim = sceneLatentDim(sh)
  const topkT = sceneTopkTokens(model)
  const variantKind = v.kind
  const nodes = []
  const edges = []

  const add = (node) => {
    const size = sceneSize(node.kind, node.special)
    const out = {
      group: 'main',
      special: '',
      ...node,
      w: size[0],
      h: size[1],
      d: size[2],
    }
    nodes.push(out)
    return out
  }

  const addRaw = (id, pos, opts = {}) => {
    const raw = info.nodes.find((n) => n.id === id) || info.nodes.find((n) => n.kind === opts.kind) || {}
    const node = add({
      ...raw,
      id: opts.id || raw.id || id,
      label: opts.label || raw.label || id,
      kind: opts.kind || raw.kind || 'custom',
      shape: opts.shape || raw.shape || sh.hidden,
      desc: opts.desc || raw.desc || '',
      formula: opts.formula || raw.formula || '',
      sub: opts.sub || raw.sub || '',
      vars: opts.vars || raw.vars || [],
      ...opts,
      x: pos[0],
      y: pos[1],
      z: pos[2],
    })
    return node
  }

  const addS = (id, label, kind, pos, shape, desc, formula, opts = {}) =>
    add({
      id,
      label,
      kind,
      shape,
      desc,
      formula,
      sub: '',
      vars: [],
      ...opts,
      x: pos[0],
      y: pos[1],
      z: pos[2],
    })

  const link = (from, to, kind = 'branch', extra = {}) => {
    if (nodes.some((n) => n.id === from) && nodes.some((n) => n.id === to)) {
      edges.push({ from, to, kind, ...extra })
    }
  }

  const d = sh.d
  const rope = sh.rope
  const qShape = sh.q
  const outShape = `[B, T, ${d}]`

  /* ---------------------------------------------------------- main stream */
  const input = addRaw('in', [0, -5.8, 0], { group: 'main', label: 'h · 残差流' })
  const norm1 = addRaw('norm1', [0, -4.45, 0], { group: 'main' })
  const res1 = addRaw('res1', [0, 0.35, 0], { group: 'main' })
  const norm2 = addRaw('norm2', [0, 1.55, 0], { group: 'main' })
  const res2 = addRaw('res2', [0, 5.25, 0], { group: 'main' })
  const output = addS('scene-out', 'h′ · 输出', 'io', [0, 6.3, 0], sh.hidden,
    '本层输出，回到残差流并送往下一层。', '', { group: 'main' })

  /* ------------------------------------------------------------ attention */
  const attnRaw = info.nodes.find((n) => n.kind === 'attention') || {}
  const attnId = attnRaw.id || 'scene-attn'
  const attnPosition = variantKind === 'linear' ? [5.9, -0.2, 0.25]
    : variantKind === 'local' ? [6.1, -0.2, 0.35]
      : variantKind === 'hybrid' ? [6.2, -0.2, 0.35]
        : variantKind === 'mla' || variantKind === 'dsa' ? [6.4, -0.2, 0.35]
          : [6.05, -0.2, 0.35]
  const baseAttnLabel = variantKind === 'dsa' ? (v.vha ? 'MLA-DSA' : 'MLA + DSA')
    : variantKind === 'mla' ? 'MLA 注意力'
      : variantKind === 'hybrid' ? (v.vha ? 'HCA' : `${v.badge} 压缩注意力`)
        : variantKind === 'linear' ? v.label
          : variantKind === 'local' ? '滑动窗口'
            : v.label || '自注意力'
  const attnLabel = v.vha ? `${baseAttnLabel}+VHA` : baseAttnLabel

  const attn = addRaw(attnId, attnPosition, {
    kind: 'attention',
    group: 'attention',
    label: attnLabel,
    special: 'attention',
    sub: v.desc,
  })

  const outProj = addS('scene-outproj', '输出投影', 'attention', [3.3, 0.9, 0.05], outShape,
    '把多头注意力输出投影回隐藏维度，再与残差相加。',
    'y=\\mathrm{Concat}(head_1,\\dots,head_H)W_O',
    { group: 'attention', shapeDetail: '多头输出拼接后投影：H × d_h → d' })

  if (variantKind === 'mla' || variantKind === 'dsa') {
    const q = addS('scene-q', 'Q 投影', 'attention', [2.9, -3.35, 1.85], qShape,
      `把隐藏状态投影成 ${sh.H} 个 query head。`,
      'Q=XW_Q,\\quad [B,T,d]\\to[B,H,T,d_h]',
      { group: 'attention' })
    const kvDown = addS('scene-kvdown', 'KV 压缩', 'projection', [3.0, -2.05, -1.95],
      `[B, T, ${d}] → [B, T, ${latentDim}]`,
      '把 K/V 一起压缩到一个低秩 latent，而不是保存完整 KV。',
      'c_t=W_{DK}x_t,\\quad d_c\\ll 2H d_h',
      { group: 'attention' })
    const latent = addS('scene-latent', variantKind === 'dsa' ? 'Latent Cache' : 'Latent KV Cache',
      'cache', [3.0, -0.62, -2.3], `[B, T, ${latentDim}]`,
      '每个 token 只保存一条 latent；解码时 KV cache 从 O(H·d_h) 降到 O(d_c)。',
      '\\mathrm{cache}_t=c_t',
      { group: 'attention', special: 'cache' })
    const kvUp = addS('scene-kvup', 'KV 升维', 'projection', [4.9, -1.55, -1.1],
      `[B, T, ${latentDim}] → K/V [B, ${sh.KV}, T, ${sh.Dh}]`,
      '在注意力计算前把 latent 还原成 K/V（可与 RoPE 的维度拼接）。',
      'K_t=W_{UK}c_t,\\quad V_t=W_{UV}c_t',
      { group: 'attention' })
    link(norm1.id, q.id, 'main')
    link(norm1.id, kvDown.id, 'branch')
    link(kvDown.id, latent.id, 'branch')
    link(latent.id, kvUp.id, 'branch')
    link(q.id, attn.id, 'branch')
    link(kvUp.id, attn.id, 'branch')

    if (variantKind === 'dsa') {
      const indexer = addS('scene-indexer', 'DSA Indexer', 'indexer', [5.8, -4.35, 2.15],
        '[B, T, d] → scores [B, T]',
        '轻量 indexer 为每个 query 估计历史 token 的重要性，不读取完整 KV。',
        's_t=\\mathrm{Indexer}(q_t,k_t)\\in\\mathbb{R}^{T}',
        { group: 'attention', special: 'indexer' })
      const topk = addS('scene-topk', 'Top-k 选择', 'selector', [6.35, -3.1, 2.15],
        `[B, T] → top-${fmtCount(topkT)} tokens`,
        `每个 query 只保留分数最高的 ${fmtCount(topkT)} 个 token，随后做精确注意力。`,
        `I_t=\\mathrm{TopK}(s_t, ${fmtCount(topkT)})`,
        { group: 'attention', special: 'selector' })
      link(norm1.id, indexer.id, 'branch')
      link(latent.id, indexer.id, 'select')
      link(indexer.id, topk.id, 'select')
      link(topk.id, attn.id, 'select')
    }
  } else if (variantKind === 'hybrid') {
    const ratio = v.ratio || (v.badge === 'HCA' ? 128 : 4)
    const compress = addS('scene-compress', `KV 压缩 m=${ratio}`, 'projection', [3.0, -2.05, -1.98],
      `[B, T, ${d}] → [B, T/${ratio}, ${latentDim}]`,
      `每 ${ratio} 个 token 的 KV 被压成一条 latent，长上下文 KV 按块增长。`,
      `K_c=\\mathrm{Compress}(K;${ratio}),\\quad [B,T,m,d_h]\\to[B,T/m,d_h]`,
      { group: 'attention' })
    const blockCache = addS('scene-blockcache', '压缩块 Cache', 'cache', [3.0, -0.62, -2.32],
      `[B, T/${ratio}, ${latentDim}]`,
      '缓存压缩后的块级 KV，供 attention 直接读取。',
      '\\mathrm{cache}=\\{K_c,V_c\\}',
      { group: 'attention', special: 'cache' })
    const q = addS('scene-q', 'Q 投影', 'attention', [2.9, -3.35, 1.85], qShape,
      'query 仍按 token 生成；只有 KV 被压缩。',
      'Q=XW_Q',
      { group: 'attention' })
    link(norm1.id, q.id, 'main')
    link(norm1.id, compress.id, 'branch')
    link(compress.id, blockCache.id, 'branch')
    link(q.id, attn.id, 'branch')
    link(blockCache.id, attn.id, 'branch')
    if (v.badge !== 'HCA') {
      const indexer = addS('scene-indexer', `${v.badge} Indexer`, 'indexer', [5.8, -4.35, 2.15],
        '[B, T, d] → block scores',
        '在压缩块上做轻量打分，为每个 query 选择要读取的块。',
        's_t=\\mathrm{BlockScore}(q_t,K_c)',
        { group: 'attention', special: 'indexer' })
      const topk = addS('scene-topk', 'Block Top-k', 'selector', [6.35, -3.1, 2.15],
        `[B, T] → top-${fmtCount(topkT)} blocks`,
        '只把选中的压缩块送入注意力，进一步减少读取量。',
        'I_t=\\mathrm{TopK}(s_t)',
        { group: 'attention', special: 'selector' })
      link(norm1.id, indexer.id, 'branch')
      link(blockCache.id, indexer.id, 'select')
      link(indexer.id, topk.id, 'select')
      link(topk.id, attn.id, 'select')
    }
  } else if (variantKind === 'linear') {
    const q = addS('scene-q', 'Q 投影', 'attention', [2.85, -3.2, 1.85], qShape,
      'query 投影；线性注意力不保存完整 KV。', 'q_t=W_Qx_t', { group: 'attention' })
    const k = addS('scene-k', 'K 投影', 'projection', [4.65, -3.2, -1.55], `[B, ${sh.KV}, T, ${sh.Dh}]`,
      'key 投影，用于更新循环状态。', 'k_t=W_Kx_t', { group: 'attention' })
    const vv = addS('scene-v', 'V 投影', 'projection', [4.65, -2.2, -1.55], `[B, ${sh.KV}, T, ${sh.Dh}]`,
      'value 投影。', 'v_t=W_Vx_t', { group: 'attention' })
    const gate = addS('scene-gate', '门控 Gate', 'router', [4.65, -1.2, 1.85], `[B, T, ${d}]`,
      '逐 token / 逐 head 的衰减门控，控制旧状态保留多少。', '\\alpha_t=\\sigma(x_tW_\\alpha)',
      { group: 'attention', special: 'gate' })
    const state = addS('scene-state', '循环状态 S', 'state', [2.85, -0.55, -2.3], sh.state,
      '常数大小矩阵状态；推理时不需要随上下文增长的 KV cache。',
      'S_t=\\alpha_t S_{t-1}+\\beta_t k_t v_t^{\\top}',
      { group: 'attention', special: 'state' })
    link(norm1.id, q.id, 'main')
    link(norm1.id, k.id, 'branch')
    link(norm1.id, vv.id, 'branch')
    link(norm1.id, gate.id, 'branch')
    link(q.id, attn.id, 'branch')
    link(k.id, attn.id, 'branch')
    link(vv.id, attn.id, 'branch')
    link(gate.id, attn.id, 'branch')
    link(state.id, attn.id, 'state')
    link(attn.id, state.id, 'state')
  } else if (variantKind === 'local') {
    const q = addS('scene-q', 'Q 投影', 'attention', [2.9, -3.2, 1.85], qShape,
      'query 投影。', 'q_t=W_Qx_t', { group: 'attention' })
    const kv = addS('scene-kv', 'K/V 投影', 'projection', [3.05, -2.1, -1.95], sh.kv,
      'K/V 投影；只有最近 W 个 token 会留在 cache 中。', 'k_t=W_Kx_t,\\quad v_t=W_Vx_t',
      { group: 'attention' })
    const window = addS('scene-window', '滑动窗口 KV', 'cache', [3.05, -0.65, -2.32], sh.window,
      `只保留最近 ${fmtCount(sh.W)} 个 token 的 KV，内存随窗口封顶。`,
      `\\mathrm{cache}_t=\\{k_{t-W:t},v_{t-W:t}\\}`,
      { group: 'attention', special: 'cache' })
    link(norm1.id, q.id, 'main')
    link(norm1.id, kv.id, 'branch')
    link(kv.id, window.id, 'branch')
    link(q.id, attn.id, 'branch')
    link(window.id, attn.id, 'branch')
  } else {
    const qkv = addS('scene-qkv', 'Q · K · V 投影', 'projection', [3.0, -2.7, 0.4], sh.qkv,
      '标准多头/分组查询投影。', 'Q=XW_Q,\\quad K=XW_K,\\quad V=XW_V',
      { group: 'attention' })
    const ropeNode = addS('scene-rope', 'RoPE 位置编码', 'custom', [4.4, -1.55, 0.5], `[B, T, ${rope}]`,
      '对 Q/K 施加旋转位置编码。', '\\tilde q_t=R_tq_t,\\quad \\tilde k_t=R_tk_t',
      { group: 'attention' })
    const cache = addS('scene-cache', 'KV Cache', 'cache', [3.0, -0.65, -2.32], sh.kv,
      '标准 KV cache；大小随上下文线性增长。', '\\mathrm{cache}_t=\\{k_t,v_t\\}',
      { group: 'attention', special: 'cache' })
    link(norm1.id, qkv.id, 'branch')
    link(qkv.id, ropeNode.id, 'branch')
    link(ropeNode.id, attn.id, 'branch')
    link(qkv.id, cache.id, 'branch')
    link(cache.id, attn.id, 'branch')
  }

  link(attn.id, outProj.id, 'main')
  link(outProj.id, res1.id, 'main')

  /* ------------------------------------------------------------------ MoE */
  if (E > 1) {
    const router = addS('scene-router', 'Router 路由', 'router', [-2.9, 2.35, 1.9], sh.router,
      `为每个 token 计算 ${fmtCount(E)} 个专家的分数，并选出 top-${K}。`,
      `g_t=\\mathrm{softmax}(\\mathrm{TopK}(x_tW_r,${K}))`,
      { group: 'moe', special: 'router' })
    const shared = addS('scene-shared', '共享专家', 'expert', [-2.9, 3.8, -2.0], `[B, T, ${sh.inter}]`,
      '所有 token 都会经过的共享专家，负责通用特征。',
      'y_{\\mathrm{shared}}=E_{\\mathrm{shared}}(x_t)',
      { group: 'moe' })
    const experts = addRaw('moe', [-5.35, 3.8, 0.3], {
      kind: 'moe',
      group: 'moe',
      special: 'experts',
      shape: `[B, T, ${E}] → top-${K}`,
      desc: `路由到 ${fmtCount(E)} 个专家中的 top-${K}；每个专家是一个独立的 FFN。`,
      formula: `y_t=\\sum_{i\\in\\mathrm{TopK}}g_{t,i}E_i(x_t)`,
    })
    const combine = addS('scene-combine', '专家合并', 'residual', [-2.2, 4.85, -0.3], outShape,
      '按门控权重把共享专家与 top-k 专家的输出相加。',
      'y_{\\mathrm{moe}}=y_{\\mathrm{shared}}+\\sum_i g_iE_i(x_t)',
      { group: 'moe' })
    link(norm2.id, router.id, 'main')
    link(router.id, experts.id, 'branch')
    link(router.id, shared.id, 'branch')
    link(experts.id, combine.id, 'branch')
    link(shared.id, combine.id, 'branch')
    link(combine.id, res2.id, 'main')
  } else {
    const ffn = addRaw('moe', [-4.6, 3.4, 0.2], {
      kind: 'ffn',
      group: 'moe',
      label: 'FFN',
      shape: `[B, T, ${d}] → [B, T, ${sh.inter}] → [B, T, ${d}]`,
      desc: '稠密前馈网络：两层线性变换加激活。',
      formula: '\\mathrm{FFN}(x)=W_2\\,\\sigma(W_1x)',
    })
    link(norm2.id, ffn.id, 'main')
    link(ffn.id, res2.id, 'main')
  }

  /* ------------------------------------------------------------ VHA sublayer */
  if (v.vha) {
    const removeEdge = (from, to) => {
      for (let i = edges.length - 1; i >= 0; i--) {
        if (edges[i].from === from && edges[i].to === to) edges.splice(i, 1)
      }
    }
    const qNode = nodes.find((n) => n.id === 'scene-q')
    if (qNode) {
      const premix = addS('scene-premix', 'Q Premix', 'vha', [4.55, -3.55, 2.75],
        `[B, ${Math.max(1, Math.round(sh.H / 2))}, T, ${sh.Dh}] → [B, ${sh.H}, T, ${sh.Dh}]`,
        'VHA 的 Q Premix：按 KV 组对物理 query head 做近恒等线性变换，扩展出虚拟 query head。',
        '\\tilde Q_{i,g}=Q_iW_g^{premix},\\quad W_g^{premix}=I+\\alpha\\epsilon',
        { group: 'attention', special: 'vha' })
      removeEdge(qNode.id, attn.id)
      link(qNode.id, premix.id, 'branch')
      link(premix.id, attn.id, 'branch')
    }
    const postmix = addS('scene-postmix', 'Postmix', 'vha', [4.6, 1.85, 1.55],
      `[B, ${sh.H}, T, ${sh.Dh}] → [B, T, ${d}]`,
      'VHA 的 Linear Postmix：在 head 轴上做低秩 identity-residual 混合，融合跨组 head 特征；推理时可吸收进 W_O。',
      "Y'=(I_{H_v}+BA^{\\top})Y,\\quad A,B\\in\\mathbb{R}^{H_v\\times r}",
      { group: 'attention', special: 'vha' })
    removeEdge(attn.id, outProj.id)
    link(attn.id, postmix.id, 'main')
    if (v.gated) {
      const gate = addS('scene-gatevha', '输出门', 'gate', [5.45, 2.35, 0.7],
        `[B, T, ${d}] → [B, T, ${d}]`,
        '低秩门控注意力：输出门由低秩 query latent 计算，门控乘在 attention 输出上。',
        'g=\\sigma(W_gq_{\\mathrm{latent}}),\\quad y=g\\odot y',
        { group: 'attention', special: 'gate' })
      link(postmix.id, gate.id, 'main')
      link(gate.id, outProj.id, 'main')
    } else {
      link(postmix.id, outProj.id, 'main')
    }
  }

  /* -------------------------------------------------------- residual spine */
  link(input.id, norm1.id, 'main')
  link(input.id, res1.id, 'skip')
  link(res1.id, norm2.id, 'main')
  link(res1.id, res2.id, 'skip')
  link(res2.id, output.id, 'main')

  return {
    ...info,
    graph: {
      nodes,
      edges,
      bounds: { x: [-7.2, 7.2], y: [-6.2, 6.8], z: [-3.2, 3.2] },
      counts: { E, K, topkT, latentDim },
    },
  }
}
