/* -------------------------------------------------------------------- icon */
function LabIcon({ size = 22, active }) {
  return h(
    'span',
    {
      style: {
        display: 'grid',
        placeItems: 'center',
        width: size,
        height: size,
        lineHeight: 0,
        filter: active ? 'drop-shadow(0 0 6px rgba(34,211,238,.55))' : 'none',
        opacity: active ? 1 : 0.92,
      },
    },
    h(
      'svg',
      { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true },
      [
        h('path', { key: 'a', d: 'M12 3 21 8l-9 5-9-5 9-5Z', stroke: 'currentColor', strokeWidth: '1.5', strokeLinejoin: 'round', opacity: active ? 1 : 0.9 }),
        h('path', { key: 'b', d: 'M3 12l9 5 9-5', stroke: 'currentColor', strokeWidth: '1.5', strokeLinejoin: 'round', opacity: active ? 0.8 : 0.55 }),
        h('path', { key: 'c', d: 'M3 16l9 5 9-5', stroke: 'currentColor', strokeWidth: '1.5', strokeLinejoin: 'round', opacity: active ? 0.55 : 0.35 }),
        active ? h('circle', { key: 'd', cx: 12, cy: 8, r: 1.7, fill: 'var(--dsw-alias-brand-primary, #22d3ee)' }) : null,
      ],
    ),
  )
}

/* ------------------------------------------------------------------- panel */
function Panel({ ctx }) {
  const zh = isZh(ctx)
  const [theme, setTheme] = useState(() => themeMode(ctx))
  const [, setLocaleTick] = useState(0)
  const [builtin, setBuiltin] = useState(null)
  const [agentModels, setAgentModels] = useState([])
  const [localModels, setLocalModels] = useState(() => readLocalModels().map(normalizeModel))
  const [selectedId, setSelectedId] = useState(() => safeGet('paper-lab.selected.v2') || '')
  const [ready, setReady] = useState(false)
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [pickedNode, setPickedNode] = useState(null)
  const [view, setView] = useState('macro')
  const [renderMode, setRenderMode] = useState(() => (safeGet('paper-lab.render.v1') === '2d' ? '2d' : '3d'))
  const [openIdea, setOpenIdea] = useState(0)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(true)
  const rootRef = useRef(null)
  const leftTouched = useRef(false)
  const [flow, setFlow] = useState(true)
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [latest, setLatest] = useState(null)
  const [latestBusy, setLatestBusy] = useState(false)

  React.useEffect(() => {
    const offTheme = ctx.on('theme/change', (snap) => {
      try {
        setTheme(snap.active.colorScheme || 'dark')
      } catch {
        setTheme('dark')
      }
    })
    const offLocale = ctx.on('locale/change', () => {
      setLocaleTick((v) => v + 1)
    })
    return () => {
      if (typeof offTheme === 'function') offTheme()
      if (typeof offLocale === 'function') offLocale()
    }
  }, [ctx])

  const loadLibrary = React.useCallback(async (announce) => {
    setRefreshing(true)
    try {
      const data = await fetchJson('/paper-lab/api/library')
      const models = normalizeLibrary(data)
      if (!models.length) throw new Error('library is empty')
      setBuiltin(models)
      setLoadError('')
      if (announce) notify((isZh(ctx) ? '已刷新 · ' : 'Refreshed · ') + models.length + ' models', 'ok')
    } catch (e) {
      setBuiltin(normalizeLibrary({ models: SEED }))
      setLoadError((e && e.message) || String(e))
    } finally {
      setRefreshing(false)
      setReady(true)
    }
  }, [ctx])

  const loadLatest = React.useCallback(async (force, announce) => {
    setLatestBusy(true)
    try {
      const data = await fetchJson('/paper-lab/api/' + (force ? 'refresh' : 'latest'))
      if (!data || (!Array.isArray(data.papers) && !Array.isArray(data.models))) throw new Error('latest discovery returned no data')
      setLatest(data)
      if (announce) {
        const count = (data.papers || []).length + (data.models || []).length
        notify((zh ? '已发现 ' : 'Discovered ') + count + (zh ? ' 条最新内容' : ' latest items') + (data.warnings && data.warnings.length ? ' · ' + data.warnings[0] : ''), 'ok')
      }
      return data
    } catch (e) {
      if (announce) notify((zh ? '在线搜索失败：' : 'Discovery failed: ') + (e && e.message ? e.message : String(e)), 'err')
      return null
    } finally {
      setLatestBusy(false)
    }
  }, [ctx])

  React.useEffect(() => {
    loadLibrary(false)
  }, [loadLibrary])

  React.useEffect(() => {
    loadLatest(false, false)
  }, [loadLatest])

  const refreshLatest = async () => {
    const data = await loadLatest(true, true)
    setModal({ type: 'latest', data: data || latest })
  }

  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width
      if (w < 1080 && !leftTouched.current) setLeftCollapsed(true)
      if (w < 900) setInspectorOpen(false)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  React.useEffect(() => {
    let alive = true
    const pull = async () => {
      try {
        const data = await fetchJson('/paper-lab/api/custom')
        if (!alive) return
        const list = Array.isArray(data.models) ? data.models.map((m, i) => normalizeModel({ ...m, origin: 'agent' }, i)) : []
        setAgentModels((prev) => {
          if (JSON.stringify(prev.map((m) => [m.id, m.name, m.ideas.length])) === JSON.stringify(list.map((m) => [m.id, m.name, m.ideas.length]))) return prev
          return list
        })
      } catch {
        /* host half may be absent in a static preview */
      }
    }
    pull()
    const timer = setInterval(() => {
      if (document.visibilityState !== 'hidden') pull()
    }, 4200)
    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [])

  const all = React.useMemo(() => {
    const map = new Map()
    for (const m of builtin || []) map.set(m.id, m)
    for (const m of agentModels) map.set(m.id, m)
    for (const m of localModels) map.set(m.id, m)
    return [...map.values()].sort((a, b) => String(b.released).localeCompare(String(a.released)))
  }, [builtin, agentModels, localModels])

  const preferred = all.find((m) => m.id === 'deepseek-v4-1-flash')
  const selected = all.find((m) => m.id === selectedId) || (ready ? preferred || all[0] : null)
  const microBlock = selected ? selected.stack.find((n) => n.kind === 'repeat' && n.inner) : null
  const innerNodes = microBlock && microBlock.inner ? microBlock.inner : []
  const nodePool = selected
    ? selected.stack.reduce((acc, n) => {
        acc.push(n)
        if (n.inner) acc.push(...n.inner)
        return acc
      }, [])
    : []
  const selectedNode = selectedNodeId
    ? (pickedNode && pickedNode.id === selectedNodeId ? pickedNode : nodePool.find((n) => n.id === selectedNodeId) || null)
    : null

  React.useEffect(() => {
    if (!ready || !selected) return
    if (selectedId !== selected.id) setSelectedId(selected.id)
    safeSet('paper-lab.selected.v2', selected.id)
  }, [ready, selected, selectedId])

  React.useEffect(() => {
    setSelectedNodeId(null)
    setPickedNode(null)
    setView('macro')
    setOpenIdea(0)
  }, [selected && selected.id])

  React.useEffect(() => {
    safeSet('paper-lab.render.v1', renderMode)
  }, [renderMode])

  const notify = (message, kind) => setToast({ message, kind })

  React.useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(t)
  }, [toast])

  const removeLocal = () => {
    if (!selected || selected.origin !== 'local') return
    setLocalModels((prev) => {
      const next = prev.filter((m) => m.id !== selected.id)
      writeLocalModels(next)
      return next
    })
    setSelectedId('')
    setSelectedNodeId(null)
    notify(zh ? '已移除本地模型' : 'Local model removed')
  }

  const importModel = (raw) => {
    const model = normalizeModel({ ...raw, origin: 'local' }, 0)
    setLocalModels((prev) => {
      const next = [model, ...prev.filter((m) => m.id !== model.id)]
      writeLocalModels(next)
      return next
    })
    setSelectedId(model.id)
    setSelectedNodeId(null)
    setView('macro')
    notify((zh ? '已导入：' : 'Imported: ') + model.name, 'ok')
  }

  const filterOptions = [
    ['all', zh ? '全部' : 'All'],
    ['moe', 'MoE'],
    ['sparse', zh ? '稀疏注意力' : 'Sparse'],
    ['hybrid', zh ? '线性 / 混合' : 'Hybrid'],
    ['2026', '2026'],
  ]

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return all.filter((m) => {
      if (q) {
        const hay = [m.name, m.org, m.summary, (m.tags || []).join(' ')].join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      const tags = (m.tags || []).join(' ').toLowerCase()
      if (filter === 'moe' && !tags.includes('moe')) return false
      if (filter === 'sparse' && !/(dsa|csa|hca|sparse)/.test(tags + ' ' + m.summary.toLowerCase())) return false
      if (filter === 'hybrid' && !/(linear|deltanet|hybrid|lightning|kda)/.test(tags)) return false
      if (filter === '2026' && !String(m.released).startsWith('2026')) return false
      return true
    })
  }, [all, query, filter])

  const years = React.useMemo(() => {
    const map = new Map()
    for (const m of visible) {
      const y = String(m.released || '').slice(0, 4) || '—'
      if (!map.has(y)) map.set(y, [])
      map.get(y).push(m)
    }
    return [...map.entries()]
  }, [visible])

  const openPaper = () => {
    if (selected && selected.paper && selected.paper.url) window.open(selected.paper.url, '_blank', 'noopener,noreferrer')
  }

  const header = h('header', { key: 'h', className: 'pl-header' }, [
    h('div', { key: 'b', className: 'pl-brand' }, [
      h('div', { key: 'l', className: 'pl-logo' }, h(LabIcon, { size: 21, active: true })),
      h('div', { key: 't', className: 'pl-brand-text' }, [
        h('div', { key: 'a', className: 'pl-brand-title' }, 'ARCH LAB'),
        h('div', { key: 's', className: 'pl-brand-sub' }, zh ? '架构显微镜 · 论文解剖' : 'ARCHITECTURE MICROSCOPE'),
      ]),
    ]),
    h(
      'div',
      { key: 'p', className: 'pl-pills' },
      all.map((m) =>
        h(
          'button',
          {
            key: m.id,
            type: 'button',
            className: 'pl-pill',
            'data-active': selected && selected.id === m.id ? '1' : '0',
            style: { '--dot': m.accent },
            onClick: () => {
              setSelectedId(m.id)
              setSelectedNodeId(null)
              setView('macro')
            },
            title: m.name + ' · ' + m.org,
          },
          [
            h('span', { key: 'd', className: 'pl-pill-dot' }),
            h('span', { key: 'n' }, m.name.replace(/-(80B-A3B|32B-A3B|26B-A4B)$/, '')),
            m.stats && m.stats.total ? h('span', { key: 'v', className: 'pl-pill-params' }, String(m.stats.total).split(' ')[0]) : null,
          ],
        ),
      ),
    ),
    h('div', { key: 'a', className: 'pl-actions' }, [
      h(IconButton, { key: 'left', icon: 'filter', label: zh ? '收起模型列表' : 'Toggle library', on: !leftCollapsed, onClick: () => { leftTouched.current = true; setLeftCollapsed((v) => !v) } }),
      h(IconButton, { key: 'insp', icon: 'info', label: zh ? '收起检查器' : 'Toggle inspector', on: inspectorOpen, onClick: () => setInspectorOpen((v) => !v) }),
      h(IconButton, { key: 'paper', icon: 'sparkles', label: zh ? '解析论文' : 'Analyze a paper', onClick: () => setModal({ type: 'paper' }) }),
      h(IconButton, { key: 'cmp', icon: 'columns', label: zh ? '横向对比' : 'Compare', onClick: () => setModal({ type: 'compare' }) }),
      h(IconButton, { key: 'calc', icon: 'sigma', label: zh ? '参数计算器' : 'Parameter math', onClick: () => setModal({ type: 'calc' }) }),
      h('div', { key: 'refreshwrap', className: 'pl-refresh-wrap' }, [
        h(IconButton, { key: 'refresh', icon: 'refresh', label: zh ? '刷新并搜索最新论文/模型' : 'Refresh and discover latest papers/models', onClick: refreshLatest, disabled: latestBusy || refreshing }),
        latest && ((latest.papers || []).length + (latest.models || []).length)
          ? h('span', { key: 'badge', className: 'pl-refresh-badge', title: zh ? '发现的最新内容' : 'Discovered items' }, String((latest.papers || []).length + (latest.models || []).length))
          : null,
      ]),
    ]),
  ])

  const left = h('aside', { key: 'l', className: 'pl-left', 'data-collapsed': leftCollapsed ? '1' : '0' }, [
    h('div', { key: 's', className: 'pl-search' }, [
      h(Glyph, { key: 'i', name: 'search', size: 13 }),
      h('input', {
        key: 'in',
        className: 'pl-input',
        value: query,
        placeholder: zh ? '搜索模型 / 机构 / 技术…' : 'Search models, labs, techniques…',
        onChange: (e) => setQuery(e.target.value),
        'aria-label': zh ? '搜索' : 'Search',
      }),
    ]),
    h('div', { key: 'c', className: 'pl-chips' }, filterOptions.map(([value, label]) =>
      h('button', { key: value, type: 'button', className: 'pl-chip', 'data-on': filter === value ? '1' : '0', onClick: () => setFilter(value) }, label),
    )),
    h(
      'div',
      { key: 'list', className: 'pl-list' },
      years.length
        ? years.map(([year, items]) =>
            h('div', { key: year, style: { display: 'flex', flexDirection: 'column', gap: 5 } }, [
              h('div', { key: 'y', className: 'pl-year' }, year),
              ...items.map((m) =>
                h(
                  'button',
                  {
                    key: m.id,
                    type: 'button',
                    className: 'pl-modelcard',
                    'data-active': selected && selected.id === m.id ? '1' : '0',
                    style: { '--dot': m.accent },
                    onClick: () => {
                      setSelectedId(m.id)
                      setSelectedNodeId(null)
                      setView('macro')
                    },
                    title: m.summary,
                  },
                  [
                    h('div', { key: 't', className: 'pl-modelcard-top' }, [
                      h('span', { key: 'n', className: 'pl-modelcard-name' }, m.name),
                      m.origin === 'agent' ? h('span', { key: 'o', className: 'pl-origin' }, 'AGENT') : null,
                      m.origin === 'local' ? h('span', { key: 'o', className: 'pl-origin', 'data-kind': 'local' }, 'IMPORT') : null,
                    ]),
                    h('div', { key: 'm', className: 'pl-modelcard-meta' }, [
                      h('em', { key: 'o' }, m.org),
                      h('span', { key: 'd', className: 'pl-dot' }),
                      h('em', { key: 'y' }, m.released || '—'),
                    ]),
                    h('div', { key: 'p', className: 'pl-modelcard-params' }, [
                      h('span', { key: 't' }, m.stats.total || fmtCount(m.totalParams)),
                      h('span', { key: 's', style: { opacity: 0.7 } }, m.stats.active || fmtCount(m.activeParams)),
                      h('span', { key: 'b', className: 'pl-param-bar' }, h('span', { className: 'pl-param-fill', style: { width: Math.max(3, m.activeRatio * 100) + '%' } })),
                    ]),
                    m.tags && m.tags.length
                      ? h('div', { key: 'g', className: 'pl-minitags' }, m.tags.slice(0, 3).map((t) => h('span', { key: t, className: 'pl-minitag' }, t)))
                      : null,
                  ],
                ),
              ),
            ]),
          )
        : h('div', { key: 'e', className: 'pl-empty' }, zh ? '没有匹配的模型。试试清空搜索或切换筛选。' : 'No model matches. Try clearing filters.'),
    ),
    h('div', { key: 'f', className: 'pl-left-foot' }, [
      h('span', { key: 'n' }, all.length + (zh ? ' 个模型 · 论文驱动' : ' models · paper-driven')),
      loadError ? h('span', { key: 'e', title: loadError, style: { color: 'var(--pl-amber)' } }, zh ? '离线数据' : 'offline') : h('span', { key: 'ok', style: { color: 'var(--pl-green)' } }, 'live'),
    ]),
  ])

  const toolbar = h('div', { key: 't', className: 'pl-toolbar' }, [
    h('div', { key: 'c', className: 'pl-crumb' }, [
      h('button', { key: 'm', type: 'button', onClick: () => { setSelectedNodeId(null); setPickedNode(null); setView('macro') } }, [
        h(Glyph, { key: 'i', name: 'layers', size: 12 }),
        h('b', { key: 'n' }, selected ? selected.name : '—'),
      ]),
      h('span', { key: 's', className: 'pl-crumb-sep' }, '/'),
      h('span', { key: 'v' }, renderMode === '3d' ? '3D' : view === 'micro' ? (zh ? '层内视图' : 'LAYER') : (zh ? '宏观结构' : 'MACRO')),
      selectedNode ? h('span', { key: 'sn', style: { color: 'var(--pl-cyan)' } }, [
        h('span', { key: 'd', className: 'pl-crumb-sep' }, '·'),
        h('span', { key: 'x' }, selectedNode.label),
      ]) : null,
    ]),
    h(Segmented, {
      key: 'r',
      value: renderMode,
      onChange: (v) => {
        setRenderMode(v)
        setSelectedNodeId(null)
        setPickedNode(null)
      },
      options: [
        { value: '3d', label: '3D' },
        { value: '2d', label: '2D' },
      ],
    }),
    renderMode === '2d'
      ? h(Segmented, {
          key: 'v',
          value: view,
          onChange: (v) => {
            if (v === 'micro' && !microBlock) return
            setView(v)
            setSelectedNodeId(null)
            setPickedNode(null)
          },
          options: [
            { value: 'macro', label: zh ? '宏观' : 'MACRO' },
            { value: 'micro', label: zh ? '层内' : 'LAYER', disabled: !microBlock, title: microBlock ? '' : '该模型没有层内结构' },
          ],
        })
      : h('span', { key: 'lc', className: 'pl-layerpill' }, (selected ? layerCount(selected) : '—') + (zh ? ' 层' : ' layers')),
    h(IconButton, { key: 'f', icon: flow ? 'pause' : 'play', label: zh ? '数据流动画' : 'Flow animation', on: flow, onClick: () => setFlow((v) => !v) }),
  ])

  const stage = h('main', { key: 'm', className: 'pl-stage' }, [
    toolbar,
    selected
      ? renderMode === '3d'
        ? h(LayerScene3D, {
            key: 'scene3d',
            model: selected,
            selectedNodeId,
            flow,
            onSelect: (node) => {
              setSelectedNodeId(node.id)
              setPickedNode(node)
              setOpenIdea(-1)
            },
            onClear: () => {
              setSelectedNodeId(null)
              setPickedNode(null)
            },
          })
        : h(ArchCanvas, {
            key: 'canvas',
            model: selected,
            view: microBlock ? view : 'macro',
            selectedNodeId,
            flow,
            onSelect: (node) => {
              setSelectedNodeId(node.id)
              setPickedNode(node)
              setOpenIdea(-1)
            },
            onDrill: () => {
              setView('micro')
              setSelectedNodeId(null)
            },
            onOpenNode: (node) => {
              if (node.inner) {
                setView('micro')
                setSelectedNodeId(null)
              }
            },
          })
      : h('div', { key: 'empty', className: 'pl-empty', style: { margin: 'auto' } }, zh ? '正在载入架构数据…' : 'Loading architectures…'),
    h('div', { key: 's', className: 'pl-statstrip' }, [
      h('span', { key: 't' }, selected ? (zh ? '总参数 ' : 'total ') + (selected.stats.total || fmtCount(selected.totalParams)) : ''),
      h('span', { key: 'a' }, selected ? (zh ? '激活 ' : 'active ') + (selected.stats.active || fmtCount(selected.activeParams)) : ''),
      h('span', { key: 'l' }, selected ? (zh ? '层数 ' : 'layers ') + (selected.stats.layers || selected.config.layers || '—') : ''),
      h('span', { key: 'c' }, selected ? (selected.stats.context || '—') + ' ctx' : ''),
      h('span', { key: 'k' }, selected ? 'KV ' + fmtBytes(selected.kvBytes) + '/tok' : ''),
      h('span', { key: 'g', style: { flex: 1 } }),
      h('span', { key: 'p' }, zh ? '置信度 ' : 'confidence ', selected ? (selected.confidence || '—') : ''),
    ]),
  ])

  const inspector = h('aside', { key: 'i', className: 'pl-inspector', 'data-hidden': inspectorOpen ? '0' : '1' }, [
    selected && selectedNode
      ? h(NodeInspector, {
          key: 'node-' + selectedNode.id,
          model: selected,
          node: selectedNode,
          ctx,
          onBack: () => {
            setSelectedNodeId(null)
            setPickedNode(null)
          },
          onDrill: () => {
            setRenderMode('2d')
            setView('micro')
            setSelectedNodeId(null)
            setPickedNode(null)
          },
          onPaper: openPaper,
        })
      : selected
        ? h(ModelInspector, {
            key: 'model-' + selected.id,
            model: selected,
            ctx,
            openIdea,
            setOpenIdea,
            onPaper: openPaper,
            onOpenCalc: () => setModal({ type: 'calc' }),
            onOpenCompare: () => setModal({ type: 'compare' }),
            onRemove: removeLocal,
          })
        : null,
  ])

  return h('div', { className: 'pl-root', 'data-pl-theme': theme, ref: rootRef }, [
    h('style', { key: 'css' }, CSS),
    header,
    h('div', { key: 'body', className: 'pl-body' }, [left, stage, inspector]),
    toast
      ? h('div', { key: 'toast', className: 'pl-toast', 'data-kind': toast.kind === 'err' ? 'err' : undefined }, [
          h(Glyph, { key: 'i', name: toast.kind === 'err' ? 'info' : 'check', size: 13 }),
          h('span', { key: 't' }, toast.message),
        ])
      : null,
    modal && modal.type === 'paper'
      ? h(PaperModal, { key: 'pm', seedUrl: modal.seedUrl || '', onClose: () => setModal(null), onImport: importModel, notify })
      : null,
    modal && modal.type === 'latest'
      ? h(DiscoverModal, {
          key: 'dm',
          data: modal.data || latest,
          busy: latestBusy,
          onClose: () => setModal(null),
          onRefresh: async () => {
            const data = await loadLatest(true, true)
            setModal({ type: 'latest', data: data || latest })
          },
          onPaper: (p) => setModal({ type: 'paper', seedUrl: p.url || p.html || p.pdf }),
          onImport: (m) => { importModel(m); setModal(null) },
        })
      : null,
    modal && modal.type === 'compare'
      ? h(CompareModal, { key: 'cm', models: all, selectedId: selected ? selected.id : '', onPick: (id) => { setSelectedId(id); setSelectedNodeId(null); setView('macro') }, onClose: () => setModal(null) })
      : null,
    modal && modal.type === 'calc'
      ? h(CalcModal, { key: 'calc', model: selected, onClose: () => setModal(null) })
      : null,
  ])
}

/* ---------------------------------------------------------------- register */
return {
  inject: ['slots', 'theme', 'locale'],
  apply(ctx) {
    const label = () => (isZh(ctx) ? '架构显微镜' : 'Arch Lab')
    ctx.slots.inject('sidebar.panellist', () =>
      ctx.slots.register(
        { name: 'sidebar.panellist', id: 'arch-lab', order: 12, label },
        (props) => h(LabIcon, { size: props && props.size ? props.size : 22, active: props && props.active }),
      ),
    )
    ctx.slots.inject('main', () =>
      ctx.slots.register({ name: 'main', key: 'arch-lab' }, () => h(Panel, { ctx })),
    )
  },
}
