/* --------------------------------------------------------------- utilities */
function cls() {
  let out = ''
  for (let i = 0; i < arguments.length; i++) if (arguments[i]) out += (out ? ' ' : '') + arguments[i]
  return out
}

function safeGet(key) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key, value) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* private mode */
  }
}

function readLocalModels() {
  try {
    const raw = safeGet('paper-lab.local.v1')
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLocalModels(models) {
  safeSet('paper-lab.local.v1', JSON.stringify(models.slice(0, 40)))
}

async function fetchJson(path) {
  const res = await fetch(path, { cache: 'no-store', headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

function isZh(ctx) {
  try {
    return String(ctx.locale.getLocale().active || '').toLowerCase().startsWith('zh')
  } catch {
    return true
  }
}

function themeMode(ctx) {
  try {
    return ctx.theme.getTheme().active.colorScheme || 'dark'
  } catch {
    return 'dark'
  }
}

/* ------------------------------------------------------------------- atoms */
function Segmented({ value, options, onChange }) {
  return h(
    'div',
    { className: 'pl-seg', role: 'tablist' },
    options.map((opt) =>
      h(
        'button',
        {
          key: opt.value,
          type: 'button',
          role: 'tab',
          'aria-selected': value === opt.value,
          'data-on': value === opt.value ? '1' : '0',
          onClick: () => onChange(opt.value),
          disabled: opt.disabled,
          title: opt.title,
        },
        opt.label,
      ),
    ),
  )
}

function IconButton({ icon, label, onClick, on, disabled, size = 16 }) {
  return h(
    'button',
    { type: 'button', className: 'pl-iconbtn', title: label, 'aria-label': label, onClick, 'data-on': on ? '1' : '0', disabled },
    h(Glyph, { name: icon, size }),
  )
}

function Stat({ k, v }) {
  return h('div', { className: 'pl-stat' }, [
    h('div', { key: 'k', className: 'pl-stat-k' }, k),
    h('div', { key: 'v', className: 'pl-stat-v', title: String(v) }, v || '—'),
  ])
}

function Tag({ children }) {
  return h('span', { className: 'pl-tag' }, children)
}

function IdeaCard({ idea, index, open, onToggle }) {
  return h(
    'div',
    { className: 'pl-idea', 'data-open': open ? '1' : '0' },
    h(
      'div',
      {
        className: 'pl-idea-head',
        role: 'button',
        tabIndex: 0,
        onClick: onToggle,
        onKeyDown: (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggle()
          }
        },
      },
      [
        h('div', { key: 'n', className: 'pl-idea-num' }, String(index + 1)),
        h('div', { key: 't', className: 'pl-idea-title' }, idea.title),
        h('div', { key: 'c', className: 'pl-node-chev', style: { transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .18s' } },
          h(Glyph, { name: 'chevron', size: 12 })),
      ],
    ),
    open
      ? h('div', { className: 'pl-idea-body' }, [
          idea.body ? h('div', { key: 'b' }, h(RichText, { text: idea.body })) : null,
          idea.formula
            ? h('div', { key: 'f', className: 'pl-idea-formula' }, h(MathBlock, { tex: idea.formula }))
            : null,
          idea.vars && idea.vars.length
            ? h(
                'div',
                { key: 'v', className: 'pl-vars' },
                idea.vars.map((v, i) =>
                  h('div', { key: i, className: 'pl-var' }, [h('b', { key: 's' }, v[0]), h('span', { key: 'd' }, v[1])]),
                ),
              )
            : null,
        ])
      : null,
  )
}

/* ------------------------------------------------------------------ legend */
function CanvasLegend() {
  const rows = [
    ['attention', '注意力'],
    ['moe', 'MoE / FFN'],
    ['norm', '归一化'],
    ['residual', '残差'],
    ['head', '输出头'],
  ]
  return h(
    'div',
    { className: 'pl-legend', 'aria-hidden': true },
    rows.map(([kind, label]) =>
      h('div', { key: kind, className: 'pl-legend-row' }, [
        h('span', { key: 'd', className: 'pl-legend-dot', style: { '--c': KIND[kind].color } }),
        h('span', { key: 'l' }, label),
      ]),
    ),
  )
}

/* ------------------------------------------------------------- arch canvas */
function ArchCanvas({ model, view, selectedNodeId, onSelect, onDrill, flow, onOpenNode }) {
  const [size, setSize] = useState({ w: 700, h: 520 })
  const [zoom, setZoom] = useState(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const wrapRef = React.useRef(null)
  const dragRef = React.useRef(null)

  const block = view === 'micro' ? model.stack.find((n) => n.kind === 'repeat' && n.inner) : null
  const nodes = view === 'micro' && block && block.inner ? block.inner : model.stack

  const NODE_W = 384
  const LEFT = 98
  const W = 610
  const GAP = 22
  const PAD = 26

  const heights = nodes.map((n) => (n.kind === 'residual' ? 38 : n.kind === 'repeat' ? 70 : 58))
  const positions = []
  let cursor = PAD
  for (let i = 0; i < nodes.length; i++) {
    positions.push({ y: cursor, h: heights[i] })
    cursor += heights[i] + GAP
  }
  const contentH = Math.max(260, cursor - GAP + PAD)
  const fit = Math.min(1.05, (size.w - 56) / W, (size.h - 28) / contentH)
  const scale = zoom == null ? Math.max(0.45, Math.min(1.05, fit)) : zoom

  React.useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const box = entries[0].contentRect
      setSize({ w: Math.max(320, box.width), h: Math.max(260, box.height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  React.useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const onWheel = (e) => {
      if (!e.ctrlKey && Math.abs(e.deltaY) < 2) return
      e.preventDefault()
      setZoom((z) => {
        const base = z == null ? scale : z
        return Math.max(0.42, Math.min(2, base * Math.exp(-e.deltaY * 0.0016)))
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [scale])

  React.useEffect(() => {
    setZoom(null)
    setOffset({ x: 0, y: 0 })
  }, [model.id, view])

  const onPointerDown = (e) => {
    if (e.button !== 0) return
    if (e.target.closest && e.target.closest('.pl-node')) return
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
    if (wrapRef.current) wrapRef.current.setAttribute('data-panning', '1')
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e) => {
    const d = dragRef.current
    if (!d) return
    setOffset({ x: d.ox + (e.clientX - d.x), y: d.oy + (e.clientY - d.y) })
  }
  const onPointerUp = () => {
    dragRef.current = null
    if (wrapRef.current) wrapRef.current.removeAttribute('data-panning')
  }

  const edges = []
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = positions[i]
    const b = positions[i + 1]
    const x = LEFT + NODE_W / 2
    edges.push({ d: `M${x},${a.y + a.h} L${x},${b.y}`, key: 'e' + i, color: KIND[nodes[i + 1].kind]?.color })
  }
  const residualEdges = []
  if (view === 'micro') {
    const source = positions[0]
    if (source) {
      nodes.forEach((n, i) => {
        if (n.kind !== 'residual') return
        const p = positions[i]
        const y1 = source.y + source.h / 2
        const y2 = p.y + p.h / 2
        residualEdges.push({
          key: 'r' + i,
          d: `M${LEFT - 12},${y1} C${LEFT - 62},${y1} ${LEFT - 62},${y2} ${LEFT - 12},${y2}`,
        })
      })
    }
  }

  return h(
    'div',
    {
      className: 'pl-canvas-wrap',
      ref: wrapRef,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
    [
      h(
        'div',
        { key: 'holder', className: 'pl-canvas-holder' },
        h(
          'div',
          {
            className: 'pl-canvas',
            style: { width: W, height: contentH, transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` },
          },
          [
            h(
              'svg',
              { key: 'svg', className: 'pl-edges', width: W, height: contentH, viewBox: `0 0 ${W} ${contentH}` },
              [
                h(
                  'defs',
                  { key: 'defs' },
                  h('marker', {
                    id: 'pl-arrow',
                    viewBox: '0 0 10 10',
                    refX: '5',
                    refY: '5',
                    markerWidth: '5',
                    markerHeight: '5',
                    orient: 'auto-start-reverse',
                  }, h('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: 'currentColor', opacity: '.5' })),
                ),
                ...edges.map((e) =>
                  h('g', { key: e.key }, [
                    h('path', { key: 'b', className: 'pl-edge', d: e.d }),
                    flow ? h('path', { key: 'h', className: 'pl-edge-hot', d: e.d, style: { '--edge': e.color } }) : null,
                  ]),
                ),
                ...residualEdges.map((e) =>
                  h('path', {
                    key: e.key,
                    d: e.d,
                    fill: 'none',
                    stroke: 'var(--pl-cyan)', strokeOpacity: '0.38',
                    strokeWidth: '1.1',
                    strokeDasharray: '3 5',
                    opacity: '.8',
                  }),
                ),
                view === 'micro'
                  ? h('text', { key: 'restext', x: 12, y: positions[0] ? positions[0].y + 26 : 30, fill: 'currentColor', opacity: '.45', fontSize: '8', letterSpacing: '2', transform: 'rotate(-90 12 ' + ((positions[0] ? positions[0].y : 30) + 26) + ')' }, 'RESIDUAL')
                  : null,
              ],
            ),
            ...nodes.map((node, i) => {
              const p = positions[i]
              const meta = KIND[node.kind] || KIND.custom
              const selected = selectedNodeId === node.id
              return h(
                'button',
                {
                  key: node.id,
                  type: 'button',
                  className: 'pl-node',
                  'data-kind': node.kind,
                  'data-selected': selected ? '1' : '0',
                  'aria-pressed': selected,
                  title: node.desc || node.label,
                  style: {
                    left: LEFT,
                    top: p.y,
                    width: NODE_W,
                    height: p.h,
                    '--kind': meta.color,
                  },
                  onClick: () => {
                    onSelect(node)
                  },
                  onDoubleClick: () => onOpenNode && onOpenNode(node),
                },
                [
                  h('span', { key: 'i', className: 'pl-node-icon' }, h(Glyph, { name: meta.icon, size: 15 })),
                  h('span', { key: 'b', className: 'pl-node-body' }, [
                    h('span', { key: 't', className: 'pl-node-title' }, node.label),
                    node.sub ? h('span', { key: 's', className: 'pl-node-sub' }, node.sub) : null,
                  ]),
                  h('span', { key: 'r', className: 'pl-node-right' }, [
                    node.count ? h('span', { key: 'c', className: 'pl-count' }, '×' + node.count) : null,
                    node.inner
                      ? h('span', { key: 'd', className: 'pl-node-chev' }, h(Glyph, { name: 'chevron', size: 13 }))
                      : null,
                  ]),
                ],
              )
            }),
            ...nodes.map((node, i) => {
              const p = positions[i]
              if (!node.shape || node.kind === 'residual') return null
              return h(
                'span',
                {
                  key: 's' + node.id,
                  className: 'pl-shape',
                  style: { left: LEFT + NODE_W + 16, top: p.y + p.h / 2 - 6, maxWidth: W - LEFT - NODE_W - 20, overflow: 'hidden', textOverflow: 'ellipsis' },
                },
                node.shape,
              )
            }),
            view === 'micro' && block
              ? h(
                  'span',
                  { key: 'rail', className: 'pl-rail-label', style: { left: 14, top: 126 } },
                  'BLOCK ×' + (block.count || ''),
                )
              : null,
          ],
        ),
      ),
      h(
        'div',
        { key: 'zoom', className: 'pl-zoom-float' },
        h(IconButton, { icon: 'plus', label: '放大', onClick: () => setZoom(Math.min(2, scale * 1.15)) }),
        h(IconButton, { icon: 'minus', label: '缩小', onClick: () => setZoom(Math.max(0.42, scale / 1.15)) }),
        h(IconButton, { icon: 'fit', label: '适应画布', onClick: () => { setZoom(null); setOffset({ x: 0, y: 0 }) } }),
        h('span', { className: 'pl-zoom-pct' }, Math.round(scale * 100) + '%'),
      ),
      h('div', { key: 'hint', className: 'pl-canvas-hint' }, [
        h(Glyph, { key: 'i', name: 'info', size: 11 }),
        h('span', { key: 't' }, '滚轮缩放 · 拖拽平移 · 双击层块进入层内'),
      ]),
      h(CanvasLegend, { key: 'legend' }),
    ],
  )
}


/* ------------------------------------------------------------ 3D layer deck */
function LayerCard3D({ item, active, width, height, x, y, z, onClick }) {
  const color = item.type === 'endpoint'
    ? (KIND[item.kind] || KIND.io).color
    : item.variant.kind === 'linear'
      ? 'var(--pl-green)'
      : item.variant.kind === 'local'
        ? 'var(--pl-amber)'
        : item.variant.kind === 'hybrid'
          ? 'var(--pl-indigo)'
          : KIND.attention.color
  const nodes = item.nodes || []
  return h(
    'button',
    {
      type: 'button',
      className: 'pl-l3-card',
      'data-active': active ? '1' : '0',
      'data-endpoint': item.type === 'endpoint' ? '1' : '0',
      style: { width, height, marginLeft: -width / 2, marginTop: -height / 2, transform: `translate3d(${x}px, ${y}px, ${z}px)`, '--kind': color },
      onClick,
      title: item.desc || item.title,
    },
    [
      h('span', { key: 'top', className: 'pl-l3-card-top' }, [
        h('b', { key: 'i' }, item.label),
        h('span', { key: 'b', className: 'pl-l3-badge' }, item.tag),
        item.type === 'layer' ? h('span', { key: 'c', className: 'pl-l3-count' }, item.index + 1 + '/' + item.total) : null,
      ]),
      h('span', { key: 'n', className: 'pl-l3-name' }, item.title),
      h(
        'span',
        { key: 'm', className: 'pl-l3-mini' },
        nodes.slice(0, 8).map((n, i) => h('i', { key: i, style: { background: (KIND[n.kind] || KIND.custom).color } })),
      ),
      h('span', { key: 'meta', className: 'pl-l3-meta' }, [
        h('code', { key: 's' }, item.shape || '—'),
        h('span', { key: 'k' }, item.kv || ''),
      ]),
    ],
  )
}

function BlueprintNode({ node, selected, onSelect, wide }) {
  const meta = KIND[node.kind] || KIND.custom
  return h(
    'button',
    {
      type: 'button',
      className: 'pl-bp-node',
      'data-kind': node.kind,
      'data-selected': selected ? '1' : '0',
      'data-wide': wide ? '1' : '0',
      style: { '--kind': meta.color },
      onClick: () => onSelect(node),
      title: node.desc || node.label,
    },
    [
      h('span', { key: 'k', className: 'pl-bp-kind' }, [
        h(Glyph, { key: 'i', name: meta.icon, size: 10 }),
        h('span', { key: 't' }, meta.label),
      ]),
      h('b', { key: 'n', className: 'pl-bp-name' }, node.label),
      h('code', { key: 's', className: 'pl-bp-shape', title: node.shape }, node.shape || '—'),
      node.shapeDetail ? h('span', { key: 'd', className: 'pl-bp-detail', title: node.shapeDetail }, node.shapeDetail) : null,
      node.sub ? h('span', { key: 'b', className: 'pl-bp-sub' }, node.sub) : null,
      node.formula ? h('span', { key: 'f', className: 'pl-bp-f', title: '含公式' }, 'ƒ') : null,
    ],
  )
}

function LayerDrawer({ info, selectedNodeId, onSelect, onCollapse }) {
  const isLayer = info.type === 'layer'
  const v = info.variant
  const nodes = info.nodes || []
  return h('div', { className: 'pl-l3-drawer' }, [
    h('div', { key: 'head', className: 'pl-bp-head' }, [
      h('span', { key: 'l', className: 'pl-bp-layer' }, isLayer ? `L${info.index + 1}` : info.label),
      h('span', { key: 'b', className: 'pl-bp-badge', 'data-kind': isLayer ? v.kind : info.kind }, isLayer ? v.badge : info.tag),
      h('span', { key: 't', className: 'pl-bp-title' }, isLayer ? `${v.label} · ${nodes.length} 个模块` : info.title),
      h('span', { key: 'k', className: 'pl-bp-kv' }, info.kv),
      h('span', { key: 's', className: 'pl-bp-headsp' }),
      h('button', { key: 'c', type: 'button', className: 'pl-bp-toggle', onClick: onCollapse, title: '收起层内结构' }, h(Glyph, { name: 'down', size: 13 })),
    ]),
    isLayer
      ? h(
          'div',
          { key: 'flow', className: 'pl-bp-flow' },
          nodes.map((n, i) =>
            h(React.Fragment, { key: (n.id || 'n') + '-' + i }, [
              h(BlueprintNode, {
                key: 'n',
                node: n,
                selected: selectedNodeId === n.id,
                onSelect,
              }),
              i < nodes.length - 1
                ? h('span', { key: 'a', className: 'pl-bp-arrow' }, h(Glyph, { name: 'chevron', size: 11 }))
                : null,
            ]),
          ),
        )
      : h('div', { key: 'end', className: 'pl-bp-endpoint' }, [
          h(BlueprintNode, { key: 'n', node: nodes[0], selected: selectedNodeId === nodes[0].id, onSelect, wide: true }),
          h('div', { key: 'd', className: 'pl-bp-desc' }, [
            h('p', { key: 'p' }, info.desc || '该模块不包含重复层结构。'),
            h('code', { key: 's' }, info.shape),
          ]),
        ]),
  ])
}

function ArchCanvas3D({ model, selectedNodeId, onSelect, onClear, flow }) {
  const [size, setSize] = useState({ w: 820, h: 560 })
  const [activeLayer, setActiveLayer] = useState(0)
  const [activeKey, setActiveKey] = useState('layer-0')
  const [rx, setRx] = useState(14)
  const [ry, setRy] = useState(-18)
  const [zoom, setZoom] = useState(1)
  const [depth, setDepth] = useState(false)
  const [drawer, setDrawer] = useState(true)
  const stageRef = React.useRef(null)
  const dragRef = React.useRef(null)

  const total = layerCount(model)
  const activeIndex = Math.max(0, Math.min(total - 1, activeLayer))
  const maxLayers = Math.max(3, Math.min(8, Math.floor((size.h - 90) / 70)))
  const indices = React.useMemo(() => sampleLayerIndices(total, maxLayers, activeIndex), [total, maxLayers, activeIndex])
  const endpoints = React.useMemo(
    () => ({
      embed: buildEndpointInfo(model, 'embed'),
      norm: buildEndpointInfo(model, 'norm'),
      head: buildEndpointInfo(model, 'head'),
    }),
    [model],
  )
  const items = React.useMemo(() => {
    const layers = indices.map((i) => buildLayerInfo(model, i))
    return [endpoints.embed, ...layers, endpoints.norm, endpoints.head]
  }, [model, indices, endpoints])

  const activeItem = items.find((i) => i.key === activeKey) ||
    items.find((i) => i.type === 'layer' && i.index === activeIndex) ||
    items[1] || items[0]

  React.useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const box = entries[0].contentRect
      setSize({ w: Math.max(320, box.width), h: Math.max(280, box.height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  React.useEffect(() => {
    setActiveLayer(0)
    setActiveKey('layer-0')
    setRx(14)
    setRy(-18)
    setZoom(1)
  }, [model.id])

  React.useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const onWheel = (e) => {
      e.preventDefault()
      setZoom((z) => Math.max(0.7, Math.min(1.4, z * Math.exp(-e.deltaY * 0.0012))))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const stepY = Math.max(38, Math.min(72, (size.h - 210) / Math.max(1, items.length - 1)))
  const cardW = Math.max(246, Math.min(418, size.w * 0.56))
  const cardH = Math.max(74, Math.min(84, stepY + 22))
  const totalH = stepY * (items.length - 1) + cardH + 60
  const sampled = items.filter((i) => i.type === 'layer').length
  const activeX = -258 * Math.tan((ry * Math.PI) / 180)

  const setLayer = (raw) => {
    const next = Math.max(0, Math.min(total - 1, raw))
    setActiveLayer(next)
    setActiveKey('layer-' + next)
    if (onClear) onClear()
  }

  const pick = (item) => {
    setActiveKey(item.key)
    if (item.type === 'layer') setActiveLayer(item.index)
    if (onClear) onClear()
  }

  const onPointerDown = (e) => {
    if (e.button !== 0) return
    if (e.target.closest && e.target.closest('button,input,.pl-l3-rail,.pl-l3-scrub')) return
    dragRef.current = { x: e.clientX, y: e.clientY, rx, ry }
    if (stageRef.current) stageRef.current.setAttribute('data-panning', '1')
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e) => {
    const d = dragRef.current
    if (!d) return
    const nextY = Math.max(-42, Math.min(42, d.ry + (e.clientX - d.x) * 0.26))
    const nextX = Math.max(-8, Math.min(38, d.rx - (e.clientY - d.y) * 0.2))
    setRy(nextY)
    setRx(nextX)
  }
  const onPointerUp = () => {
    dragRef.current = null
    if (stageRef.current) stageRef.current.removeAttribute('data-panning')
  }
  const reset = () => {
    setRx(14)
    setRy(-18)
    setZoom(1)
  }
  const onKeyDown = (e) => {
    if (e.target && e.target.tagName === 'INPUT') return
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      setLayer(activeIndex + 1)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      setLayer(activeIndex - 1)
    }
  }

  return h('div', { className: 'pl-l3-root', 'data-drawer': drawer ? '1' : '0', 'data-flow': flow ? '1' : '0' }, [
    h('div', { key: 'bar', className: 'pl-l3-bar' }, [
      h('span', { key: 'k', className: 'pl-l3-bar-k' }, '3D LAYER DECK'),
      h('b', { key: 'l', className: 'pl-l3-bar-l' }, activeItem.type === 'layer' ? `L${activeItem.index + 1} / ${total}` : activeItem.label),
      h('span', { key: 'v', className: 'pl-l3-bar-v', 'data-kind': activeItem.type === 'layer' ? activeItem.variant.kind : activeItem.kind }, activeItem.type === 'layer' ? activeItem.variant.badge : activeItem.tag),
      h('span', { key: 's', className: 'pl-l3-bar-shape' }, activeItem.shape),
      h('span', { key: 'kv', className: 'pl-l3-bar-kv' }, activeItem.kv),
      h('span', { key: 'sp', className: 'pl-l3-bar-sp' }),
      h(IconButton, { key: 'fit', icon: 'fit', label: '重置视角', onClick: reset }),
      h(IconButton, { key: 'minus', icon: 'minus', label: '缩小', onClick: () => setZoom((z) => Math.max(0.7, z / 1.12)) }),
      h(IconButton, { key: 'plus', icon: 'plus', label: '放大', onClick: () => setZoom((z) => Math.min(1.4, z * 1.12)) }),
      h(IconButton, { key: 'depth', icon: 'layers', label: '加深景深', on: depth, onClick: () => setDepth((v) => !v) }),
      h(IconButton, { key: 'drawer', icon: 'grid', label: drawer ? '收起层内结构' : '展开层内结构', on: drawer, onClick: () => setDrawer((v) => !v) }),
    ]),
    h('div', {
      key: 'stage',
      className: 'pl-l3-stage',
      ref: stageRef,
      tabIndex: 0,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onDoubleClick: (e) => { if (e.target.closest && e.target.closest('button')) return; reset() },
      onKeyDown,
    }, [
      h('div', {
        key: 'world',
        className: 'pl-l3-world',
        style: { transform: `rotateX(${rx}deg) rotateY(${ry}deg) scale(${zoom})` },
      }, [
        h('div', { key: 'floor', className: 'pl-l3-floor' }),
        h('div', {
          key: 'spine',
          className: 'pl-l3-spine',
          style: { height: totalH, marginTop: -totalH / 2 },
        }),
        ...items.map((item, i) => {
          const active = activeItem && item.key === activeItem.key
          const y = active ? 0 : (i - (items.length - 1) / 2) * stepY
          const z = active ? 258 : -i * (depth ? 58 : 34)
          const x = active ? activeX : Math.sin(i * 1.4) * 9
          return h(LayerCard3D, {
            key: item.key,
            item,
            active,
            width: cardW,
            height: cardH,
            x,
            y,
            z,
            onClick: () => pick(item),
          })
        }),
      ]),
      h('div', { key: 'rail', className: 'pl-l3-rail' }, [
        h('span', { key: 'a', className: 'pl-l3-rail-cap' }, 'L1'),
        h(
          'div',
          {
            key: 't',
            className: 'pl-l3-rail-track',
            role: 'slider',
            tabIndex: 0,
            'aria-label': '层索引',
            'aria-valuemin': 1,
            'aria-valuemax': total,
            'aria-valuenow': activeIndex + 1,
            onPointerDown: (e) => {
              const r = e.currentTarget.getBoundingClientRect()
              const t = Math.max(0, Math.min(1, (e.clientY - r.top) / Math.max(1, r.height)))
              e.stopPropagation()
              setLayer(Math.round(t * (total - 1)))
            },
            onKeyDown: (e) => {
              if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault()
                setLayer(activeIndex + 1)
              } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault()
                setLayer(activeIndex - 1)
              }
              e.stopPropagation()
            },
          },
          Array.from({ length: total }, (_, i) =>
            h('button', {
              key: i,
              type: 'button',
              tabIndex: -1,
              className: 'pl-l3-tick',
              'data-on': i === activeIndex ? '1' : '0',
              style: {
                top: total <= 1 ? '50%' : (i / (total - 1)) * 100 + '%',
                height: Math.max(2, Math.min(9, 180 / total)) + 'px',
              },
              title: `Layer ${i + 1}`,
              'aria-label': `Layer ${i + 1}`,
              onClick: () => setLayer(i),
            }),
          ),
        ),
        h('span', { key: 'b', className: 'pl-l3-rail-cap' }, `L${total}`),
      ]),
      h('div', { key: 'scrub', className: 'pl-l3-scrub' }, [
        h('button', { key: 'p', type: 'button', className: 'pl-l3-step', disabled: activeIndex <= 0, onClick: () => setLayer(activeIndex - 1), 'aria-label': '上一层' }, h(Glyph, { name: 'left', size: 12 })),
        h('input', {
          key: 'r',
          type: 'range',
          min: 1,
          max: total,
          step: 1,
          value: activeIndex + 1,
          'aria-label': '选择层',
          onChange: (e) => setLayer(Number(e.target.value) - 1),
        }),
        h('button', { key: 'n', type: 'button', className: 'pl-l3-step', disabled: activeIndex >= total - 1, onClick: () => setLayer(activeIndex + 1), 'aria-label': '下一层' }, h(Glyph, { name: 'chevron', size: 12 })),
        h('b', { key: 'l' }, [`L${activeIndex + 1}`, h('em', { key: 'e' }, `/${total}`)]),
      ]),
      h('div', { key: 'hint', className: 'pl-l3-hint' }, [
        h(Glyph, { key: 'i', name: 'info', size: 11 }),
        h('span', { key: 't' }, `拖拽旋转 · 滚轮缩放 · 层片采样 ${sampled}/${total}，拖滑杆查看全部`),
      ]),
    ]),
    drawer ? h(LayerDrawer, { key: 'drawer', info: activeItem, selectedNodeId, onSelect, onCollapse: () => setDrawer(false) }) : null,
  ])
}

/* -------------------------------------------------------------- inspector */
function ModelInspector({ model, openIdea, setOpenIdea, onPaper, onOpenCalc, onOpenCompare, onRemove, ctx }) {
  const zh = isZh(ctx)
  const stats = [
    ['总参数', shortStat(model.stats.total || fmtCount(model.totalParams))],
    ['激活参数', shortStat(model.stats.active || fmtCount(model.activeParams))],
    ['层数', model.stats.layers || String(model.config.layers || '—')],
    ['上下文', ctxLabel(model.stats.context || (model.config.context ? fmtCount(model.config.context) : '—'))],
    ['专家', shortStat(model.stats.experts || (num(model.config.experts) > 1 ? String(model.config.experts) : 'Dense'))],
    ['Top-K', model.stats.topK || (num(model.config.topK) ? String(model.config.topK) : '—')],
  ]
  return h('div', { className: 'pl-insp' }, [
    h('div', { key: 'kick', className: 'pl-kicker' }, zh ? '论文解剖 · 2025—2026' : 'PAPER DISSECTION'),
    h('h1', { key: 'name', className: 'pl-hero-name' }, model.name),
    h('div', { key: 'org', className: 'pl-hero-org' }, [
      h('span', { key: 'o' }, model.org),
      h('span', { key: 'd1', className: 'pl-dot' }),
      h('span', { key: 'y' }, model.released || '—'),
      model.paper && model.paper.url
        ? h('button', { key: 'p', className: 'pl-btn', 'data-sm': '1', onClick: onPaper, style: { marginLeft: 'auto' } }, [
            h(Glyph, { key: 'g', name: 'book', size: 12 }),
            h('span', { key: 't' }, zh ? '论文原文' : 'Paper'),
            h(Glyph, { key: 'e', name: 'external', size: 10 }),
          ])
        : null,
    ]),
    model.summary ? h('p', { key: 'sum', className: 'pl-summary' }, h(RichText, { text: model.summary })) : null,
    h('div', { key: 'stats', className: 'pl-statgrid' }, stats.map(([k, v]) => h(Stat, { key: k, k, v }))),
    h(
      'div',
      { key: 'kv', className: 'pl-caption', style: { display: 'flex', justifyContent: 'space-between', gap: 8 } },
      [
        h('span', { key: 'k' }, (model.tags || []).includes('MLA') ? 'MLA 潜向量 KV cache' : 'KV cache（每 token）'),
        h('b', { key: 'v', style: { color: 'var(--pl-cyan)', fontWeight: 600 } }, fmtBytes(model.kvBytes) + ' / token'),
      ],
    ),
    model.tags && model.tags.length
      ? h('div', { key: 'tags', className: 'pl-tags' }, model.tags.map((t) => h(Tag, { key: t }, t)))
      : null,
    h('div', { key: 'row', className: 'pl-row' }, [
      h('button', { key: 'calc', className: 'pl-btn', onClick: onOpenCalc }, [h(Glyph, { key: 'g', name: 'sigma', size: 12 }), h('span', { key: 't' }, zh ? '参数计算器' : 'Param math')]),
      h('button', { key: 'cmp', className: 'pl-btn', onClick: onOpenCompare }, [h(Glyph, { key: 'g', name: 'columns', size: 12 }), h('span', { key: 't' }, zh ? '横向对比' : 'Compare')]),
      model.origin === 'agent' ? h('span', { key: 'a', className: 'pl-origin' }, 'AGENT') : null,
      model.origin === 'local' ? h('span', { key: 'l', className: 'pl-origin', 'data-kind': 'local' }, 'IMPORTED') : null,
      model.origin === 'local' && onRemove
        ? h('button', { key: 'rm', className: 'pl-btn', 'data-sm': '1', onClick: onRemove, style: { marginLeft: 'auto' } }, [h(Glyph, { key: 'g', name: 'close', size: 10 }), h('span', { key: 't' }, zh ? '移除' : 'Remove')])
        : null,
    ]),
    h('div', { key: 'div', className: 'pl-sectionhead' }, [
      h('h4', { key: 't' }, zh ? '核心创新 · 点击展开公式' : 'KEY IDEAS'),
      h('span', { key: 'c', className: 'pl-caption' }, (model.ideas || []).length + ' ideas'),
    ]),
    model.ideas && model.ideas.length
      ? h(
          'div',
          { key: 'ideas', style: { display: 'flex', flexDirection: 'column', gap: 7 } },
          model.ideas.map((idea, i) =>
            h(IdeaCard, {
              key: i,
              idea,
              index: i,
              open: openIdea === i,
              onToggle: () => setOpenIdea(openIdea === i ? -1 : i),
            }),
          ),
        )
      : h('div', { key: 'noidea', className: 'pl-empty' }, '这个模型还没有公式卡片。'),
    model.sources && model.sources.length
      ? h('div', { key: 'src', className: 'pl-caption', style: { wordBreak: 'break-all' } }, ['Sources: ' + model.sources.join(' · ')])
      : null,
  ])
}

function NodeInspector({ model, node, onBack, onDrill, onPaper, ctx }) {
  const zh = isZh(ctx)
  const meta = KIND[node.kind] || KIND.custom
  const block = model.stack.find((n) => n.kind === 'repeat')
  return h('div', { className: 'pl-insp' }, [
    h('div', { key: 'kick', className: 'pl-kicker' }, [
      h('button', { key: 'b', type: 'button', onClick: onBack, style: { border: 'none', background: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', display: 'inline-flex', gap: 4, alignItems: 'center', padding: 0 } }, [
        h(Glyph, { key: 'i', name: 'left', size: 11 }),
        h('span', { key: 't' }, model.name),
      ]),
      h('span', { key: 's', className: 'pl-crumb-sep' }, '/'),
      h('span', { key: 'c' }, zh ? '模块' : 'MODULE'),
    ]),
    h('div', { key: 'panel', className: 'pl-nodepanel', style: { '--kind': meta.color } }, [
      h('div', { key: 'head', className: 'pl-nodepanel-head' }, [
        h('span', { key: 'ic', className: 'pl-node-icon', style: { width: 34, height: 34 }, }, h(Glyph, { name: meta.icon, size: 17 })),
        h('div', { key: 'txt', style: { minWidth: 0 } }, [
          h('span', { key: 'k', className: 'pl-nodekind' }, meta.label),
          h('h3', { key: 'n' }, node.label),
        ]),
      ]),
      node.desc ? h('p', { key: 'd', className: 'pl-desc' }, h(RichText, { text: node.desc })) : null,
      node.shape ? h('div', { key: 's', className: 'pl-shapebox' }, node.shape) : null,
      node.formula
        ? h('div', { key: 'f', className: 'pl-formulabox' }, [
            h('div', { key: 'k', className: 'pl-kicker' }, zh ? '本模块的数学' : 'THE MATH'),
            h(MathBlock, { key: 'm', tex: node.formula }),
          ])
        : null,
      node.vars && node.vars.length
        ? h(
            'div',
            { key: 'v', className: 'pl-vars' },
            node.vars.map((v, i) => h('div', { key: i, className: 'pl-var' }, [h('b', { key: 's' }, v[0]), h('span', { key: 'd' }, v[1])])),
          )
        : null,
    ]),
    node.inner
      ? h('div', { key: 'drill', className: 'pl-row' }, h('button', { className: 'pl-btn', 'data-primary': '1', onClick: () => onDrill(node) }, [
          h(Glyph, { key: 'g', name: 'layers', size: 12 }),
          h('span', { key: 't' }, zh ? '进入层内视图' : 'Open layer view'),
        ]))
      : null,
    h('div', { key: 'tip', className: 'pl-caption' }, zh ? '提示：点击画布上的其他模块可继续探查；滚轮缩放、拖拽平移。' : 'Tip: click any block to inspect it; wheel to zoom, drag to pan.'),
    block && block.inner && node.id !== block.id
      ? h('div', { key: 'sib', className: 'pl-sectionhead' }, [
          h('h4', { key: 't' }, zh ? '同层其他模块' : 'SIBLINGS'),
          h('button', { key: 'b', className: 'pl-btn', 'data-sm': '1', onClick: () => onDrill(block) }, block.label + ' ×' + (block.count || '')),
        ])
      : null,
    h('div', { key: 'row', className: 'pl-row', style: { marginTop: 2 } }, [
      model.paper && model.paper.url
        ? h('button', { key: 'p', className: 'pl-btn', 'data-sm': '1', onClick: onPaper }, [h(Glyph, { key: 'g', name: 'book', size: 11 }), h('span', { key: 't' }, zh ? '论文原文' : 'Paper')])
        : null,
      h('button', { key: 'b', className: 'pl-btn', 'data-sm': '1', onClick: onBack }, [h(Glyph, { key: 'g', name: 'left', size: 11 }), h('span', { key: 't' }, zh ? '返回模型概览' : 'Overview')]),
    ]),
  ])
}

/* ------------------------------------------------------------------- modal */
function Modal({ title, subtitle, icon, onClose, children, footer, wide }) {
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return h(
    'div',
    {
      className: 'pl-backdrop',
      onMouseDown: (e) => {
        if (e.target === e.currentTarget) onClose()
      },
    },
    h('div', { className: 'pl-modal', style: wide ? { width: 'min(980px, 100%)' } : undefined, role: 'dialog', 'aria-modal': 'true', 'aria-label': title }, [
      h('div', { key: 'h', className: 'pl-modal-head' }, [
        icon ? h('span', { key: 'i', className: 'pl-node-icon', style: { width: 30, height: 30 } }, h(Glyph, { name: icon, size: 15 })) : null,
        h('div', { key: 't', style: { minWidth: 0 } }, [
          h('div', { key: 'a', className: 'pl-modal-title' }, title),
          subtitle ? h('div', { key: 'b', className: 'pl-modal-sub' }, subtitle) : null,
        ]),
        h('button', { key: 'x', type: 'button', className: 'pl-iconbtn pl-close', onClick: onClose, 'aria-label': 'Close' }, h(Glyph, { name: 'close', size: 15 })),
      ]),
      h('div', { key: 'b', className: 'pl-modal-body' }, children),
      footer ? h('div', { key: 'f', className: 'pl-modal-foot' }, footer) : null,
    ]),
  )
}

/* ------------------------------------------------------------ paper parser */
const LAB_HINTS = [
  ['deepseek', 'DeepSeek-AI'], ['qwen', 'Alibaba Qwen'], ['kimi', 'Moonshot AI'], ['moonshot', 'Moonshot AI'],
  ['minimax', 'MiniMax'], ['glm', 'Zhipu AI'], ['zhipu', 'Zhipu AI'], ['llama', 'Meta'], ['meta ai', 'Meta'],
  ['gemma', 'Google DeepMind'], ['gemini', 'Google DeepMind'], ['gpt', 'OpenAI'], ['mistral', 'Mistral AI'],
  ['grok', 'xAI'], ['ernie', 'Baidu'], ['hunyuan', 'Tencent'], ['step', 'StepFun'], ['yi', '01.AI'],
]

const TAG_RULES = [
  ['DSA', /deepseek sparse attention|\bDSA\b/i],
  ['CSA', /\bCSA\b|compressed sparse attention/i],
  ['HCA', /\bHCA\b|hybrid compressed attention/i],
  ['MLA', /\bMLA\b|multi-head latent attention|low-rank kv/i],
  ['MoE', /mixture[- ]of[- ]experts|\bMoE\b/i],
  ['MTP', /multi[- ]token prediction|\bMTP\b/i],
  ['DeltaNet', /gated deltanet|delta ?net/i],
  ['Linear Attention', /linear attention|lightning attention|linear[- ]attention/i],
  ['Hybrid', /hybrid attention|hybrid architecture|interleav/i],
  ['Sliding Window', /sliding[- ]window/i],
  ['Attention Sink', /attention sink/i],
  ['QK-Norm', /qk[- ]?norm/i],
  ['GQA', /grouped[- ]query|\bGQA\b/i],
  ['MQA', /multi[- ]query|\bMQA\b/i],
  ['RoPE', /rotary|rope/i],
  ['MoE Balance', /aux[- ]loss[- ]free|loss[- ]free balanc/i],
  ['Muon', /muon|newton[- ]schulz/i],
  ['FP8', /\bFP8\b|fp4|mxfp4/i],
  ['Engram', /engram/i],
]

function guessOrg(text) {
  const low = String(text || '').toLowerCase().slice(0, 30000)
  for (const [needle, org] of LAB_HINTS) {
    const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    if (new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(low)) return org
  }
  return 'Unknown lab'
}

function guessTitle(text) {
  const lines = String(text || '')
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
  for (const line of lines.slice(0, 6)) {
    let clean = line.replace(/^#{1,3}\s*/, '').replace(/^title:\s*/i, '').trim()
    let cut = false
    if (clean.length > 64) {
      clean = clean.split(/(?<=[。.!?])\s+/)[0].trim()
      if (clean.length > 64) {
        clean = clean.slice(0, 64).trim()
        cut = true
      }
    }
    if (clean.length >= 8 && !/^arxiv:/i.test(clean) && !/^abstract/i.test(clean)) return clean.replace(/[。.]$/, '') + (cut ? '…' : '')
  }
  const first = lines[0] || 'Imported paper'
  return first.slice(0, 110)
}

function firstNumber(text, patterns, min, max) {
  for (const re of patterns) {
    const m = String(text).match(re)
    if (!m) continue
    const value = Number(String(m[1]).replace(/,/g, ''))
    if (Number.isFinite(value) && value >= min && value <= max) return value
  }
  return 0
}

function analyzePaper(text, fallbackTitle) {
  const src = String(text || '')
  const lower = src.toLowerCase()
  const title = (fallbackTitle || guessTitle(src)).slice(0, 120)
  const org = guessOrg(src)
  const tags = TAG_RULES.filter(([, re]) => re.test(src)).map(([tag]) => tag)
  if (!tags.includes('MoE') && /experts?/i.test(src)) tags.push('MoE')

  const config = {
    layers: firstNumber(src, [/(\d{1,3})\s*(?:transformer\s+)?layers/i, /(\d{1,3})\s*层/i], 4, 200),
    dModel: firstNumber(src, [/(?:hidden(?:\s+size)?|d[_\s-]?model|model\s+dim(?:ension)?)\s*(?:of|:|=)?\s*([\d,]{3,6})/i], 256, 32768),
    heads: firstNumber(src, [/(\d{1,4})\s*(?:attention\s+)?heads/i], 1, 256),
    kvHeads: firstNumber(src, [/(\d{1,4})\s*(?:kv|key[- ]value)\s*heads/i], 1, 256),
    headDim: firstNumber(src, [/(?:head\s*dim(?:ension)?|d_h)\s*(?:of|:|=)?\s*(\d{2,4})/i], 16, 1024),
    experts: firstNumber(src, [/([\d,]{2,5})\s*(?:routed\s+)?experts/i], 2, 4096),
    topK: firstNumber(src, [/top[- ]?(\d{1,3})\s*(?:experts|routed)?/i], 1, 128),
    vocab: firstNumber(src, [/(?:vocab(?:ulary)?(?:\s+size)?)\s*(?:of|:|=)?\s*([\d,]{3,7})/i], 1000, 2000000),
    context: firstNumber(src, [/(\d{2,4})\s*([KM])\s*(?:context|tokens)/i], 1, 10000000),
  }
  // context pattern needs the unit; recompute explicitly.
  const ctxMatch = src.match(/(\d{2,4})\s*([KM])\s*(?:context|tokens)/i)
  if (ctxMatch) {
    const base = Number(ctxMatch[1])
    config.context = base * (ctxMatch[2].toUpperCase() === 'M' ? 1e6 : 1e3)
  }
  if (!config.dModel && config.heads && config.headDim) config.dModel = config.heads * config.headDim
  if (!config.kvHeads) config.kvHeads = config.heads

  const totalMatch = src.match(/(\d+(?:\.\d+)?)\s*([BT])\s*(?:total\s*)?(?:parameters|params)/i)
  const activeMatch = src.match(/(\d+(?:\.\d+)?)\s*([BT])\s*(?:activated|active)/i)
  const toNum = (m) => (m ? Number(m[1]) * (m[2].toUpperCase() === 'T' ? 1e12 : 1e9) : 0)
  const total = toNum(totalMatch)
  const active = toNum(activeMatch) || total
  const stats = {
    total: total ? fmtCount(total) : '?',
    active: active ? fmtCount(active) : '?',
    layers: config.layers ? String(config.layers) : '?',
    context: config.context ? fmtCount(config.context) : '?',
    experts: config.experts ? String(config.experts) + (config.topK ? ' · top-' + config.topK : '') : 'Dense',
    topK: config.topK ? String(config.topK) : '—',
  }

  const formulas = []
  const seenF = new Set()
  const fre = /\$([^$\n]{4,180})\$|\\\((.{4,180}?)\\\)/g
  let fm
  while ((fm = fre.exec(src))) {
    const tex = (fm[1] || fm[2] || '').trim()
    if (!/[=_^\\]/.test(tex)) continue
    const key = tex.replace(/\s+/g, '')
    if (seenF.has(key)) continue
    seenF.add(key)
    formulas.push(tex)
    if (formulas.length >= 8) break
  }

  const sentences = src
    .replace(/\s+/g, ' ')
    .split(/(?<=[。.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40 && s.length < 420)
  const keywordRe = /(sparse attention|mixture[- ]of[- ]experts|routed expert|linear attention|delta ?net|sliding window|multi[- ]token|low[- ]rank|kv cache|attention sink|qk[- ]?norm|rope|compression|router|residual|engram|sinkhorn)/i
  const ideas = []
  for (const s of sentences) {
    if (ideas.length >= 5) break
    if (!keywordRe.test(s)) continue
    if (ideas.some((idea) => idea.body === s)) continue
    const idx = ideas.length
    ideas.push({
      title: s.split(/[,，。:：]/)[0].slice(0, 42),
      body: s,
      formula: formulas[idx] || '',
      vars: [],
    })
  }
  if (!ideas.length) {
    ideas.push({
      title: '论文摘要',
      body: src.slice(0, 360).replace(/\s+/g, ' '),
      formula: formulas[0] || '',
      vars: [],
    })
  }

  const yearMatch = src.match(/(?:19|20)\d{2}/)
  const draft = {
    id: 'local-' + Date.now().toString(36),
    name: title,
    org,
    released: (yearMatch ? yearMatch[0] : String(new Date().getFullYear())) + '-' + String(new Date().getMonth() + 1).padStart(2, '0'),
    summary: (sentences.find((s) => s.length > 60) || src.slice(0, 240)).slice(0, 320),
    tags: tags.length ? tags.slice(0, 6) : ['Imported'],
    stats,
    config,
    ideas,
    origin: 'local',
  }
  draft.stack = buildDefaultStack(draft)
  return { draft, formulas: formulas.length, tags, config }
}

/* --------------------------------------------------------------- modals (1) */
function PaperModal({ onClose, onImport, notify }) {
  const [tab, setTab] = useState('text')
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [report, setReport] = useState(null)
  const [draft, setDraft] = useState(null)
  const [json, setJson] = useState('')

  const grab = async () => {
    if (!url.trim()) return
    setBusy('fetch')
    setError('')
    try {
      const data = await fetchJson('/paper-lab/api/fetch?url=' + encodeURIComponent(url.trim()) + '&max=120000')
      if (data.error) throw new Error(data.error)
      setText(data.text || '')
      setMetaTitle(data.title || '')
      notify('已抓取 ' + (data.text || '').length.toLocaleString() + ' 字符', 'ok')
    } catch (e) {
      setError('抓取失败：' + (e && e.message ? e.message : String(e)))
    } finally {
      setBusy('')
    }
  }

  const analyze = () => {
    if (!text.trim()) {
      setError('先粘贴论文正文，或从链接抓取。')
      return
    }
    setBusy('analyze')
    setError('')
    setTimeout(() => {
      try {
        const result = analyzePaper(text, metaTitle)
        setDraft(result.draft)
        setReport(result)
      } catch (e) {
        setError('解析失败：' + (e && e.message ? e.message : String(e)))
      } finally {
        setBusy('')
      }
    }, 30)
  }

  const importJson = () => {
    try {
      const parsed = JSON.parse(json)
      const raw = Array.isArray(parsed) ? parsed[0] : parsed.models ? parsed.models[0] : parsed
      const model = normalizeModel({ ...raw, origin: 'local', id: raw.id || 'local-' + Date.now().toString(36) }, 0)
      onImport(model)
      onClose()
    } catch (e) {
      setError('JSON 解析失败：' + (e && e.message ? e.message : String(e)))
    }
  }

  return h(
    Modal,
    {
      title: '解析一篇论文',
      subtitle: '抓取 → 启发式抽取 → 在实验室里继续追问',
      icon: 'sparkles',
      onClose,
      wide: true,
      footer: [
        h('span', { key: 'h', className: 'pl-hint' }, '启发式抽取只读文本；更精确的结构可以让 Agent 读取论文后 publish 到 Arch Lab。'),
        h('div', { key: 'b', className: 'pl-row' }, [
          h('button', { key: 'c', className: 'pl-btn', onClick: onClose }, '取消'),
          tab === 'json'
            ? h('button', { key: 'j', className: 'pl-btn', 'data-primary': '1', onClick: importJson, disabled: !json.trim() }, '导入 JSON')
            : h('button', { key: 'i', className: 'pl-btn', 'data-primary': '1', onClick: () => { if (draft) { onImport(draft); onClose() } }, disabled: !draft }, '导入实验室'),
        ]),
      ],
    },
    h('div', null, [
      h('div', { key: 'tabs', className: 'pl-tabs' }, [
        h('button', { key: 't', 'data-on': tab === 'text' ? '1' : '0', onClick: () => setTab('text') }, '论文链接 / 文本'),
        h('button', { key: 'j', 'data-on': tab === 'json' ? '1' : '0', onClick: () => setTab('json') }, '粘贴 JSON'),
      ]),
      tab === 'text'
        ? h('div', { key: 'text' }, [
            h('div', { key: 'row', className: 'pl-row', style: { marginBottom: 10 } }, [
              h('div', { key: 'u', style: { flex: 1, minWidth: 240 } }, h('input', {
                className: 'pl-input',
                placeholder: 'https://arxiv.org/abs/2512.02556',
                value: url,
                onChange: (e) => setUrl(e.target.value),
                onKeyDown: (e) => { if (e.key === 'Enter') grab() },
                style: { paddingLeft: 10 },
              })),
              h('button', { key: 'g', className: 'pl-btn', onClick: grab, disabled: busy === 'fetch' }, busy === 'fetch' ? h('span', { className: 'pl-spinner' }) : h(Glyph, { name: 'download', size: 12 }), '抓取'),
            ]),
            h('div', { key: 'l', className: 'pl-field' }, [
              h('span', { key: 'k', className: 'pl-label' }, '论文正文（可先粘贴 arXiv HTML / 摘要 / 架构章节）'),
              h('textarea', {
                key: 't',
                className: 'pl-textarea',
                placeholder: '把论文正文粘贴到这里……支持 $...$ LaTeX 公式，会被自动抽取到公式卡片。',
                value: text,
                onChange: (e) => setText(e.target.value),
                style: { minHeight: 190 },
              }),
            ]),
            h('div', { key: 'row2', className: 'pl-row' }, [
              h('button', { key: 'a', className: 'pl-btn', onClick: analyze, disabled: busy === 'analyze' || !text.trim() }, busy === 'analyze' ? h('span', { className: 'pl-spinner' }) : h(Glyph, { name: 'zap', size: 12 }), '解析结构'),
              h('span', { key: 'c', className: 'pl-hint' }, '会抽取层数、d_model、专家数、top-k、上下文，以及带 LaTeX 的公式。'),
            ]),
            error ? h('div', { key: 'e', className: 'pl-hint', style: { color: 'var(--dsw-alias-state-error-primary)', marginTop: 8 } }, error) : null,
            report && draft
              ? h('div', { key: 'r', className: 'pl-analyze', style: { marginTop: 14 } }, [
                  h('div', { key: 'rep', className: 'pl-report' }, [
                    h('div', { key: 'k', className: 'pl-kicker' }, '抽取结果'),
                    h('div', { key: 't', className: 'pl-report-row' }, [h('span', { key: 'k', className: 'pl-report-k' }, '标题'), h('span', { key: 'v', className: 'pl-report-v' }, draft.name)]),
                    h('div', { key: 'o', className: 'pl-report-row' }, [h('span', { key: 'k', className: 'pl-report-k' }, '机构'), h('span', { key: 'v', className: 'pl-report-v' }, draft.org)]),
                    h('div', { key: 'c', className: 'pl-report-row' }, [
                      h('span', { key: 'k', className: 'pl-report-k' }, '配置'),
                      h('span', { key: 'v', className: 'pl-report-v' }, [
                        draft.config.layers ? draft.config.layers + ' 层 · ' : '',
                        draft.config.dModel ? 'd=' + draft.config.dModel + ' · ' : '',
                        draft.config.experts ? draft.config.experts + ' experts · top-' + (draft.config.topK || '?') : 'dense',
                        draft.config.context ? ' · ' + fmtCount(draft.config.context) + ' ctx' : '',
                      ].join('')),
                    ]),
                    h('div', { key: 'g', className: 'pl-report-row' }, [h('span', { key: 'k', className: 'pl-report-k' }, '标签'), h('span', { key: 'v', className: 'pl-report-tags' }, draft.tags.map((t) => h(Tag, { key: t }, t)))]),
                    h('div', { key: 'f', className: 'pl-report-row' }, [h('span', { key: 'k', className: 'pl-report-k' }, '公式'), h('span', { key: 'v', className: 'pl-report-v' }, report.formulas + ' 条 · ' + draft.ideas.length + ' 张卡片')]),
                    h('div', { key: 'edit', className: 'pl-field', style: { marginTop: 6 } }, [
                      h('span', { key: 'l', className: 'pl-label' }, '导入后的模型名'),
                      h('input', { key: 'i', className: 'pl-input', value: draft.name, onChange: (e) => setDraft({ ...draft, name: e.target.value }), style: { paddingLeft: 10 } }),
                    ]),
                  ]),
                  h('div', { key: 'prev', className: 'pl-report' }, [
                    h('div', { key: 'k', className: 'pl-kicker' }, '结构预览'),
                    draft.stack.map((n, i) =>
                      h('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: 7, padding: '5px 7px', borderRadius: 7, border: '1px solid var(--pl-line)', background: 'color-mix(in srgb, var(--dsw-alias-bg-layer-1) 55%, transparent)' } }, [
                        h('span', { key: 'd', style: { width: 6, height: 6, borderRadius: 2, background: (KIND[n.kind] || KIND.custom).color } }),
                        h('span', { key: 'l', style: { fontSize: 10.5, flex: 1 } }, n.label),
                        h('span', { key: 's', style: { fontSize: 9, color: 'var(--pl-dim)' } }, n.count ? '×' + n.count : n.sub),
                      ]),
                    ),
                    h('div', { key: 'note', className: 'pl-hint' }, '预览是抽取结果，可在导入后继续让 Agent 修正。'),
                  ]),
                ])
              : null,
          ])
        : h('div', { key: 'json' }, [
            h('div', { key: 'l', className: 'pl-label', style: { marginBottom: 5 } }, '架构 JSON（单个对象，或 { models: [...] } / [ ... ]）'),
            h('textarea', { key: 't', className: 'pl-textarea', value: json, onChange: (e) => setJson(e.target.value), placeholder: '{\\n  "name": "...",\\n  "org": "...",\\n  "tags": ["MoE"],\\n  "config": {...},\\n  "ideas": [{"title":"...","body":"...","formula":"..."}]\\n}', style: { minHeight: 280 } }),
            error ? h('div', { key: 'e', className: 'pl-hint', style: { color: 'var(--dsw-alias-state-error-primary)' } }, error) : null,
            h('div', { key: 'hint', className: 'pl-hint', style: { marginTop: 8 } }, '字段与内置数据相同；缺省 stack 时会按 config 自动生成结构图。'),
          ]),
    ]),
  )
}

/* --------------------------------------------------------------- modals (2) */
function CompareModal({ models, selectedId, onPick, onClose }) {
  const initial = React.useMemo(() => {
    const ids = [selectedId]
    for (const m of models) {
      if (ids.length >= 3) break
      if (!ids.includes(m.id)) ids.push(m.id)
    }
    return ids
  }, [selectedId, models])
  const [picked, setPicked] = useState(initial)
  const chosen = models.filter((m) => picked.includes(m.id))
  const metric = (m) => Math.max(1, m.totalParams)
  const maxTotal = Math.max(...chosen.map(metric), 1)
  const maxActive = Math.max(...chosen.map((m) => m.activeParams || 1), 1)
  const maxKv = Math.max(...chosen.map((m) => m.kvBytes || 1), 1)
  const maxCtx = Math.max(...chosen.map((m) => num(m.config.context) || 1), 1)
  const log = (v, max) => (v > 0 ? Math.min(100, Math.max(3, (Math.log10(v) / Math.log10(max)) * 100)) : 0)

  return h(
    Modal,
    {
      title: '横向对比',
      subtitle: '同一坐标系里看容量、激活、KV 与上下文',
      icon: 'columns',
      onClose,
      wide: true,
      footer: h('span', { className: 'pl-hint' }, '选择 2–4 个模型；条形使用对数尺度，避免 1T 与 8B 放在一起失真。'),
    },
    h('div', { className: 'pl-cmp' }, [
      h('div', { key: 'pick', className: 'pl-cmp-pick' }, models.map((m) =>
        h('button', {
          key: m.id,
          className: 'pl-cmp-chip',
          'data-on': picked.includes(m.id) ? '1' : '0',
          onClick: () => {
            setPicked((prev) => {
              if (prev.includes(m.id)) return prev.length > 1 ? prev.filter((id) => id !== m.id) : prev
              if (prev.length >= 4) return prev
              return [...prev, m.id]
            })
          },
        }, m.name),
      )),
      chosen.length
        ? h('div', { key: 'bars', className: 'pl-bars' }, [
            h('div', { key: 'h1', className: 'pl-label' }, '总参数（对数）'),
            ...chosen.map((m) => h('div', { key: 't' + m.id, className: 'pl-bar-row' }, [
              h('div', { key: 'n', className: 'pl-bar-name' }, [h('span', { key: 'd', style: { width: 7, height: 7, borderRadius: 2, background: m.accent, flex: '0 0 auto' } }), h('span', { key: 't' }, m.name)]),
              h('div', { key: 'b', className: 'pl-bar-track' }, h('div', { className: 'pl-bar-fill', style: { width: log(m.totalParams, maxTotal) + '%', '--c': m.accent } })),
              h('div', { key: 'v', className: 'pl-bar-v' }, fmtCount(m.totalParams)),
            ])),
            h('div', { key: 'h2', className: 'pl-label', style: { marginTop: 6 } }, '激活参数（对数）'),
            ...chosen.map((m) => h('div', { key: 'a' + m.id, className: 'pl-bar-row' }, [
              h('div', { key: 'n', className: 'pl-bar-name' }, h('span', { key: 't' }, m.name)),
              h('div', { key: 'b', className: 'pl-bar-track' }, h('div', { className: 'pl-bar-fill', style: { width: log(m.activeParams, maxActive) + '%', '--c': m.accent } })),
              h('div', { key: 'v', className: 'pl-bar-v' }, fmtCount(m.activeParams)),
            ])),
            h('div', { key: 'h3', className: 'pl-label', style: { marginTop: 6 } }, 'KV cache / token（对数，越小越好）'),
            ...chosen.map((m) => h('div', { key: 'k' + m.id, className: 'pl-bar-row' }, [
              h('div', { key: 'n', className: 'pl-bar-name' }, h('span', { key: 't' }, m.name)),
              h('div', { key: 'b', className: 'pl-bar-track' }, h('div', { className: 'pl-bar-fill', style: { width: log(m.kvBytes, maxKv) + '%', '--c': m.accent } })),
              h('div', { key: 'v', className: 'pl-bar-v' }, fmtBytes(m.kvBytes)),
            ])),
            h('div', { key: 'h4', className: 'pl-label', style: { marginTop: 6 } }, '上下文长度（对数）'),
            ...chosen.map((m) => h('div', { key: 'c' + m.id, className: 'pl-bar-row' }, [
              h('div', { key: 'n', className: 'pl-bar-name' }, h('span', { key: 't' }, m.name)),
              h('div', { key: 'b', className: 'pl-bar-track' }, h('div', { className: 'pl-bar-fill', style: { width: log(num(m.config.context), maxCtx) + '%', '--c': m.accent } })),
              h('div', { key: 'v', className: 'pl-bar-v' }, m.stats.context || fmtCount(num(m.config.context))),
            ])),
          ])
        : null,
      h('div', { key: 'table', style: { overflowX: 'auto', marginTop: 4 } }, h('table', { className: 'pl-table' }, [
        h('thead', { key: 'h' }, h('tr', null, [
          h('th', { key: 'n' }, '模型'), h('th', { key: 'o' }, '机构'), h('th', { key: 'p' }, '总/激活'), h('th', { key: 'l' }, '层'), h('th', { key: 'e' }, '专家'), h('th', { key: 'c' }, '上下文'), h('th', { key: 'k' }, 'KV/token'), h('th', { key: 'a' }, '注意力'),
        ])),
        h('tbody', { key: 'b' }, chosen.map((m) => h('tr', { key: m.id }, [
          h('td', { key: 'n' }, h('button', { type: 'button', onClick: () => { onPick(m.id); onClose() }, style: { border: 'none', background: 'none', color: 'var(--pl-cyan)', font: 'inherit', cursor: 'pointer', padding: 0 } }, m.name)),
          h('td', { key: 'o' }, m.org),
          h('td', { key: 'p' }, (m.stats.total || fmtCount(m.totalParams)) + ' / ' + (m.stats.active || fmtCount(m.activeParams))),
          h('td', { key: 'l' }, m.stats.layers || String(m.config.layers || '—')),
          h('td', { key: 'e' }, m.stats.experts || (num(m.config.experts) > 1 ? String(m.config.experts) : 'Dense')),
          h('td', { key: 'c' }, m.stats.context || fmtCount(num(m.config.context))),
          h('td', { key: 'k' }, fmtBytes(m.kvBytes)),
          h('td', { key: 'a' }, attentionLabel(m)),
        ]))),
      ])),
    ]),
  )
}

/* --------------------------------------------------------------- modals (3) */
function CalcModal({ model, onClose }) {
  const base = model.config || {}
  const [layers, setLayers] = useState(clampInt(num(base.layers) || 32, 4, 160))
  const [dModel, setDModel] = useState(clampInt(num(base.dModel) || 4096, 512, 16384))
  const [experts, setExperts] = useState(clampInt(num(base.experts) || 1, 1, 512))
  const [topK, setTopK] = useState(clampInt(num(base.topK) || 1, 1, 32))
  const [kvHeads, setKvHeads] = useState(clampInt(num(base.kvHeads) || 8, 1, 128))
  const [heads, setHeads] = useState(clampInt(num(base.heads) || 32, 1, 256))
  const [context, setContext] = useState(clampInt(num(base.context) || 131072, 4096, 1048576))
  const headDim = clampInt(num(base.headDim) || 128, 32, 512)
  const vocab = clampInt(num(base.vocab) || 128000, 32000, 300000)
  const inter = clampInt(num(base.moeInter) || 2048, 256, 16384)
  const isMla = (model.tags || []).join(' ').toLowerCase().includes('mla') || num(base.kvLora) > 0

  const calc = React.useMemo(() => {
    const attn = dModel * heads * headDim + 2 * dModel * kvHeads * headDim + heads * headDim * dModel
    const perExpert = 3 * dModel * inter
    const moeTotal = experts > 1 ? experts * perExpert : 3 * dModel * (headDim * 4)
    const moeActive = experts > 1 ? topK * perExpert : 3 * dModel * (headDim * 4)
    const norms = 2 * dModel
    const perLayerTotal = attn + moeTotal + norms
    const perLayerActive = attn + moeActive + norms
    const embed = vocab * dModel
    const head = vocab * dModel
    const total = embed + head + layers * perLayerTotal
    const active = embed + head + layers * perLayerActive
    const baseLayers = num(base.layers) || layers
    const kvLayers = Math.max(1, Math.round((num(base.kvLayers) || baseLayers) * (layers / baseLayers)))
    const kvPerToken = isMla ? kvLayers * ((num(base.kvLora) || 512) + (num(base.ropeDim) || 64)) * 2 : kvLayers * kvHeads * headDim * 2 * 2
    const kvAtCtx = kvPerToken * context
    return { total, active, kvPerToken, kvAtCtx, attn, perLayerTotal, perLayerActive, share: active / total }
  }, [layers, dModel, experts, topK, kvHeads, heads, headDim, vocab, inter, context, isMla, base.kvLora, base.ropeDim, base.kvLayers, base.layers])

  const slider = (label, value, min, max, step, setter, format) =>
    h('div', { key: label, className: 'pl-slider' }, [
      h('div', { key: 'h', className: 'pl-slider-head' }, [h('span', { key: 'l' }, label), h('b', { key: 'v' }, format ? format(value) : value)]),
      h('input', {
        key: 'i',
        className: 'pl-range',
        type: 'range',
        min,
        max,
        step,
        value,
        onChange: (e) => setter(Number(e.target.value)),
      }),
    ])

  return h(
    Modal,
    {
      title: '参数与 KV 计算器',
      subtitle: '拖动滑块，看公式如何决定显存和算力',
      icon: 'sigma',
      onClose,
      footer: h('span', { className: 'pl-hint' }, '估算值：MoE 按每专家 3·d·d_ff，KV 按 BF16；实际参数量受词表绑定、MLA 细节与实现影响。'),
    },
    h('div', { className: 'pl-calcgrid' }, [
      h('div', { key: 'sliders' }, [
        slider('层数 L', layers, 4, 160, 1, setLayers),
        slider('隐藏维度 d', dModel, 512, 16384, 256, setDModel, (v) => v.toLocaleString()),
        slider('专家数 N', experts, 1, 512, 1, setExperts),
        slider('激活专家 top-k', topK, 1, 32, 1, setTopK, (v) => 'top-' + v),
        slider('注意力头数', heads, 1, 256, 1, setHeads),
        slider('KV 头数', kvHeads, 1, 128, 1, setKvHeads),
        slider('上下文', context, 4096, 1048576, 4096, setContext, fmtCount),
      ]),
      h('div', { key: 'out' }, [
        h('div', { key: 'grid', className: 'pl-calcout' }, [
          h('div', { key: 't', className: 'pl-calcbox' }, [h('div', { key: 'k', className: 'k' }, '总参数'), h('div', { key: 'v', className: 'v' }, [fmtCount(calc.total)])]),
          h('div', { key: 'a', className: 'pl-calcbox' }, [h('div', { key: 'k', className: 'k' }, '激活参数'), h('div', { key: 'v', className: 'v' }, [fmtCount(calc.active)])]),
          h('div', { key: 'k', className: 'pl-calcbox' }, [h('div', { key: 'k', className: 'k' }, 'KV / token'), h('div', { key: 'v', className: 'v' }, [fmtBytes(calc.kvPerToken)])]),
          h('div', { key: 'c', className: 'pl-calcbox' }, [h('div', { key: 'k', className: 'k' }, 'KV @ ' + fmtCount(context)), h('div', { key: 'v', className: 'v' }, [fmtBytes(calc.kvAtCtx)])]),
        ]),
        h('div', { key: 'f1', className: 'pl-formulabox', style: { marginTop: 10 } }, [
          h('div', { key: 'k', className: 'pl-kicker' }, '稀疏度'),
          h(MathBlock, { key: 'm', tex: '\\frac{N_{\\mathrm{active}}}{N_{\\mathrm{total}}}\\approx ' + (calc.share * 100).toFixed(1) + '\\%' }),
        ]),
        h('div', { key: 'f2', className: 'pl-formulabox', style: { marginTop: 8 } }, [
          h('div', { key: 'k', className: 'pl-kicker' }, '每层参数'),
          h(MathBlock, { key: 'm', tex: 'N_{\\ell}=N_{\\mathrm{attn}}+N_{\\mathrm{MoE}}+2d' }),
          h('div', { key: 'v', className: 'pl-caption', style: { marginTop: 6 } }, '≈ ' + fmtCount(calc.perLayerTotal) + ' / 层；激活 ≈ ' + fmtCount(calc.perLayerActive)),
        ]),
        h('div', { key: 'f3', className: 'pl-formulabox', style: { marginTop: 8 } }, [
          h('div', { key: 'k', className: 'pl-kicker' }, '推理 KV cache'),
          h(MathBlock, { key: 'm', tex: isMla ? '\\mathrm{KV}=L\\cdot(d_c+d_R)\\cdot 2\\ \\mathrm{bytes}' : '\\mathrm{KV}=L\\cdot n_{kv}\\cdot d_h\\cdot 2\\cdot 2\\ \\mathrm{bytes}' }),
        ]),
        h('div', { key: 'note', className: 'pl-caption', style: { marginTop: 9 } }, '解码每 token 的计算量约 2·N_active FLOPs；长上下文时 KV 读取往往先成为瓶颈。'),
      ]),
    ]),
  )
}

function clampInt(value, min, max) {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.round(value)))
}
