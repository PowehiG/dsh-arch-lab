/* --------------------------------------------------------- 3D layer scene UI
 * A small, dependency-light WebGL view (Three.js is vendored at build time).
 * It renders the per-layer graph from buildSceneGraph() as real 3D volumes:
 * boxes for projections/attention, stacked cylinders for caches, a 3x3 expert
 * grid for MoE, and animated tubes for the data flow.
 */

const S3_COLORS = {
  io: 0xf59e0b,
  norm: 0x8fa3bf,
  residual: 0x70839c,
  attention: 0x38bdf8,
  projection: 0x22d3ee,
  cache: 0x34d399,
  state: 0x2dd4bf,
  indexer: 0xf472b6,
  selector: 0xfbbf24,
  router: 0xf472b6,
  moe: 0xa78bfa,
  ffn: 0xa78bfa,
  expert: 0x8b5cf6,
  head: 0x34d399,
  custom: 0x818cf8,
  vha: 0x22d3ee,
  gate: 0xfbbf24,
}

function s3Color(kind, special) {
  if (special === 'experts') return 0x8b5cf6
  if (special === 'cache') return 0x34d399
  if (special === 'state') return 0x2dd4bf
  if (special === 'indexer') return 0xf472b6
  if (special === 'selector') return 0xfbbf24
  if (special === 'vha') return 0x22d3ee
  if (special === 'gate') return 0xfbbf24
  return S3_COLORS[kind] || S3_COLORS.custom
}



function s3LabelCandidates(node) {
  const group = node.group || ''
  const vertical = [[0, 0], [0, -42], [0, -84], [0, -126], [0, -168], [0, -210], [0, -252]]
  const right = [[104, -4], [156, -4], [210, -4], [156, -48], [210, -48], [104, -48], [260, -4], [260, -48], [260, -96], [210, -96], [260, -144], [160, -96]]
  const left = [[-104, -4], [-156, -4], [-210, -4], [-156, -48], [-210, -48], [-104, -48], [-260, -4], [-260, -48], [-260, -96], [-210, -96], [-260, -144], [-160, -96]]
  const diagonal = [[64, -84], [-64, -84], [118, -90], [-118, -90], [174, -90], [-174, -90], [220, -140], [-220, -140], [260, -200], [-260, -200]]
  const below = [[0, 36], [96, 36], [-96, 36], [156, 36], [-156, 36]]
  if (group === 'moe') return [...left, ...vertical, ...right, ...diagonal, ...below]
  if (group === 'attention') return [...right, ...vertical, ...left, ...diagonal, ...below]
  return [...vertical, ...right, ...left, ...diagonal, ...below]
}
function s3OverlapArea(a, b) {
  const w = Math.min(a.r, b.r) - Math.max(a.l, b.l)
  const h = Math.min(a.b, b.b) - Math.max(a.t, b.t)
  return w > 0 && h > 0 ? w * h : 0
}

function s3Dispose(object) {
  if (!object) return
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose()
    const materials = Array.isArray(child.material) ? child.material : child.material ? [child.material] : []
    for (const material of materials) material.dispose()
  })
}

function SceneLegend({ zh }) {
  const items = [
    ['attention', zh ? '注意力' : 'Attention'],
    ['cache', zh ? 'KV Cache' : 'KV Cache'],
    ['indexer', zh ? 'Indexer' : 'Indexer'],
    ['moe', zh ? 'MoE' : 'MoE'],
    ['residual', zh ? '残差/合并' : 'Residual'],
  ]
  return h(
    'div',
    { className: 'pl-s3-legend' },
    items.map(([kind, label]) =>
      h('span', { key: kind, 'data-kind': kind }, [
        h('i', { key: 'i', style: { background: KIND[kind] ? KIND[kind].color : 'var(--pl-dim)' } }),
        h('b', { key: 't' }, label),
      ]),
    ),
  )
}

function S3LayerRail({ total, activeIndex, onPick }) {
  return h('div', { key: 'rail', className: 'pl-l3-rail pl-s3-rail' }, [
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
          onPick(Math.round(t * (total - 1)))
        },
        onKeyDown: (e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
            e.preventDefault()
            onPick(activeIndex + 1)
          } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            e.preventDefault()
            onPick(activeIndex - 1)
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
        }),
      ),
    ),
    h('span', { key: 'b', className: 'pl-l3-rail-cap' }, `L${total}`),
  ])
}

function S3Scrubber({ total, activeIndex, onPick }) {
  return h('div', { key: 'scrub', className: 'pl-l3-scrub pl-s3-scrub' }, [
    h('button', { key: 'p', type: 'button', className: 'pl-l3-step', disabled: activeIndex <= 0, onClick: () => onPick(activeIndex - 1), 'aria-label': '上一层' }, h(Glyph, { name: 'left', size: 12 })),
    h('input', {
      key: 'r',
      type: 'range',
      min: 1,
      max: total,
      step: 1,
      value: activeIndex + 1,
      'aria-label': '选择层',
      onChange: (e) => onPick(Number(e.target.value) - 1),
    }),
    h('button', { key: 'n', type: 'button', className: 'pl-l3-step', disabled: activeIndex >= total - 1, onClick: () => onPick(activeIndex + 1), 'aria-label': '下一层' }, h(Glyph, { name: 'chevron', size: 12 })),
    h('b', { key: 'l' }, [`L${activeIndex + 1}`, h('em', { key: 'e' }, `/${total}`)]),
  ])
}

function LayerScene3D({ model, selectedNodeId, onSelect, onClear, flow, ctx }) {
  const zh = isZh(ctx)
  const total = layerCount(model)
  const [activeLayer, setActiveLayer] = React.useState(0)
  const [labels, setLabels] = React.useState(true)
  const [auto, setAuto] = React.useState(false)
  const [fallback, setFallback] = React.useState(false)
  const stageRef = React.useRef(null)
  const canvasRef = React.useRef(null)
  const threeRef = React.useRef(null)
  const labelEls = React.useRef({})
  const leaderEls = React.useRef({})
  const selectedIdRef = React.useRef(null)
  const onSelectRef = React.useRef(onSelect)
  const onClearRef = React.useRef(onClear)
  const flowRef = React.useRef(flow)
  const labelsRef = React.useRef(labels)
  const autoRef = React.useRef(auto)
  const selectedRef = React.useRef(selectedNodeId)

  const activeIndex = Math.max(0, Math.min(total - 1, activeLayer))
  const graph = React.useMemo(() => buildSceneGraph(model, activeIndex), [model, activeIndex])
  const graphRef = React.useRef(graph)
  graphRef.current = graph
  onSelectRef.current = onSelect
  onClearRef.current = onClear
  flowRef.current = flow
  labelsRef.current = labels
  autoRef.current = auto
  selectedRef.current = selectedNodeId

  const setLayer = (raw) => {
    const next = Math.max(0, Math.min(total - 1, raw))
    setActiveLayer(next)
    if (onClear) onClear()
  }

  React.useEffect(() => {
    setActiveLayer(0)
    if (onClear) onClear()
  }, [model.id])

  /* --------------------------------------------------------------- init WebGL */
  React.useEffect(() => {
    const host = stageRef.current
    const mount = canvasRef.current
    if (!host || !mount) return
    const THREE = window.THREE
    if (!THREE || (!window.WebGLRenderingContext && !window.WebGL2RenderingContext)) {
      setFallback(true)
      return
    }
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    } catch (err) {
      setFallback(true)
      return
    }
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 120)
    const target = new THREE.Vector3(0, 0.25, 0)
    const state = {
      theta: 0.72,
      phi: 1.16,
      radius: 29,
      pointer: null,
      hovered: null,
      graph: null,
      group: null,
      helper: null,
      nodeMeshes: new Map(),
      pickables: [],
      flows: [],
      target,
      lastModel: null,
    }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
    renderer.outputEncoding = THREE.sRGBEncoding
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.08
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.58))
    const key = new THREE.DirectionalLight(0xffffff, 0.95)
    key.position.set(7, 13, 11)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0x38bdf8, 0.42)
    fill.position.set(-10, 3, -8)
    scene.add(fill)
    const rim = new THREE.PointLight(0xa78bfa, 1.15, 42)
    rim.position.set(8, -4, -7)
    scene.add(rim)

    const grid = new THREE.GridHelper(30, 30, 0x2a4a69, 0x18283b)
    grid.position.y = -6.45
    grid.material.transparent = true
    grid.material.opacity = 0.28
    scene.add(grid)

    const updateCamera = () => {
      const r = state.radius
      camera.position.set(
        target.x + r * Math.sin(state.phi) * Math.sin(state.theta),
        target.y + r * Math.cos(state.phi),
        target.z + r * Math.sin(state.phi) * Math.cos(state.theta),
      )
      camera.lookAt(target)
      camera.updateMatrixWorld()
    }
    updateCamera()

    const fitView = () => {
      const nodes = state.graph && state.graph.graph && state.graph.graph.nodes
      if (!nodes || !nodes.length) return
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity
      for (const n of nodes) {
        minX = Math.min(minX, n.x - n.w / 2); maxX = Math.max(maxX, n.x + n.w / 2)
        minY = Math.min(minY, n.y - n.h / 2); maxY = Math.max(maxY, n.y + n.h / 2)
        minZ = Math.min(minZ, n.z - n.d / 2); maxZ = Math.max(maxZ, n.z + n.d / 2)
      }
      target.set((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2)
      const w = Math.max(120, renderer.domElement.clientWidth)
      const h = Math.max(120, renderer.domElement.clientHeight)
      const availH = Math.max(180, h - 62)
      const projectBounds = (r) => {
        state.radius = r
        updateCamera()
        camera.updateMatrixWorld()
        let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
        const v = new THREE.Vector3()
        for (const n of nodes) {
          for (const dx of [-n.w / 2, n.w / 2]) {
            for (const dy of [-n.h / 2, n.h / 2]) {
              for (const dz of [-n.d / 2, n.d / 2]) {
                v.set(n.x + dx, n.y + dy, n.z + dz).project(camera)
                const x = (v.x * 0.5 + 0.5) * w
                const y = (-v.y * 0.5 + 0.5) * h
                x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y)
              }
            }
          }
        }
        return { x0, x1, y0, y1, w: x1 - x0, h: y1 - y0 }
      }
      let r = Math.max(22, Math.min(44, state.radius || 28))
      for (let i = 0; i < 16; i++) {
        const b = projectBounds(r)
        const fx = b.w / (w * 0.84)
        const fy = b.h / (availH * 0.84)
        const f = Math.max(fx, fy)
        if (f > 1.02) r = Math.min(48, r * Math.min(1.35, f * 1.02))
        else if (f < 0.88) r = Math.max(18, r * Math.max(0.78, f * 0.97))
        else break
      }
      state.radius = r
      updateCamera()
    }
    state.fit = fitView

    const resize = () => {
      const w = Math.max(160, host.clientWidth)
      const h = Math.max(160, host.clientHeight)
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      if (state.graph && state.fit) state.fit()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(host)

    const nodeColor = (node) => new THREE.Color(s3Color(node.kind, node.special))

    const makeNode = (node) => {
      const color = nodeColor(node)
      const group = new THREE.Group()
      group.position.set(node.x, node.y, node.z)
      group.userData.node = node
      const outlineColor = color.clone().lerp(new THREE.Color(0xffffff), 0.32)
      const outline = (geometry, scale = 1.015, opacity = 0.66) => {
        const edges = new THREE.LineSegments(
          new THREE.EdgesGeometry(geometry, 24),
          new THREE.LineBasicMaterial({ color: outlineColor, transparent: true, opacity }),
        )
        edges.scale.setScalar(scale)
        group.add(edges)
        return edges
      }
      let hit
      if (node.special === 'experts') {
        const box = new THREE.BoxGeometry(node.w, node.h, node.d)
        const shell = new THREE.Mesh(
          box,
          new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.11, roughness: 0.42, metalness: 0.1, depthWrite: false }),
        )
        shell.userData.baseOpacity = 0.11
        group.add(shell)
        outline(box, 1.02, 0.72)
        const cols = 3
        const rows = 3
        const cw = node.w * 0.2
        const ch = node.h * 0.2
        const cd = node.d * 0.55
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const cell = new THREE.Mesh(
              new THREE.BoxGeometry(cw, ch, cd),
              new THREE.MeshStandardMaterial({ color, roughness: 0.32, metalness: 0.25, emissive: color, emissiveIntensity: 0.08 }),
            )
            cell.position.set((c - 1) * node.w * 0.29, (r - 1) * node.h * 0.29, 0)
            group.add(cell)
          }
        }
        hit = shell
      } else if (node.special === 'cache') {
        const radius = Math.min(node.w, node.d) * 0.34
        const stackH = node.h * 0.62
        for (let i = 0; i < 3; i++) {
          const geo = new THREE.CylinderGeometry(radius, radius, stackH, 28, 1, false)
          const mat = new THREE.MeshStandardMaterial({
            color,
            transparent: true,
            opacity: 0.55 - i * 0.06,
            roughness: 0.28,
            metalness: 0.4,
            emissive: color,
            emissiveIntensity: 0.1,
            depthWrite: false,
          })
          const cyl = new THREE.Mesh(geo, mat)
          cyl.userData.baseOpacity = mat.opacity
          cyl.position.y = (i - 1) * node.h * 0.29
          group.add(cyl)
          outline(geo, 1.01, 0.55)
        }
        hit = new THREE.Mesh(
          new THREE.BoxGeometry(node.w, node.h, node.d),
          new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.001, depthWrite: false }),
        )
        group.add(hit)
      } else if (node.special === 'state') {
        const radius = Math.min(node.w, node.d) * 0.36
        const geo = new THREE.CylinderGeometry(radius, radius * 1.08, node.h * 0.82, 32, 2, false)
        const mat = new THREE.MeshStandardMaterial({
          color,
          transparent: true,
          opacity: 0.42,
          roughness: 0.25,
          metalness: 0.45,
          emissive: color,
          emissiveIntensity: 0.12,
          depthWrite: false,
        })
        const cyl = new THREE.Mesh(geo, mat)
        cyl.userData.baseOpacity = 0.42
        group.add(cyl)
        outline(geo, 1.01, 0.62)
        for (const y of [-node.h * 0.28, node.h * 0.28]) {
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(radius * 1.02, 0.018, 6, 32),
            new THREE.MeshBasicMaterial({ color: outlineColor, transparent: true, opacity: 0.7 }),
          )
          ring.rotation.x = Math.PI / 2
          ring.position.y = y
          group.add(ring)
        }
        hit = new THREE.Mesh(
          new THREE.BoxGeometry(node.w, node.h, node.d),
          new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.001, depthWrite: false }),
        )
        group.add(hit)
      } else {
        const box = new THREE.BoxGeometry(node.w * 0.94, node.h * 0.92, node.d * 0.94)
        const mat = new THREE.MeshStandardMaterial({
          color,
          roughness: node.kind === 'attention' ? 0.24 : 0.4,
          metalness: node.kind === 'attention' ? 0.35 : 0.18,
          transparent: true,
          opacity: node.kind === 'attention' ? 0.86 : 0.9,
          emissive: color,
          emissiveIntensity: node.kind === 'attention' ? 0.16 : 0.08,
        })
        hit = new THREE.Mesh(box, mat)
        hit.userData.baseOpacity = mat.opacity
        group.add(hit)
        outline(box, 1.012, 0.68)
      }
      group.traverse((child) => {
        child.userData.node = node
      })
      return { group, hit }
    }

    state.rebuild = (nextGraph) => {
      const data = nextGraph.graph
      if (state.group) {
        scene.remove(state.group)
        s3Dispose(state.group)
      }
      if (state.helper) {
        scene.remove(state.helper)
        s3Dispose(state.helper)
        state.helper = null
      }
      const group = new THREE.Group()
      const nodeMeshes = new Map()
      const pickables = []
      for (const node of data.nodes) {
        const made = makeNode(node)
        group.add(made.group)
        nodeMeshes.set(node.id, made.group)
        if (made.hit) pickables.push(made.hit)
      }
      const byId = new Map(data.nodes.map((n) => [n.id, n]))
      const flows = []
      const skipMat = new THREE.LineDashedMaterial({ color: 0x52657c, dashSize: 0.16, gapSize: 0.12, transparent: true, opacity: 0.55 })
      const flowColors = { main: 0x5eead4, select: 0xf472b6, state: 0x34d399, branch: 0x7c9cbb }
      for (const edge of data.edges) {
        const from = byId.get(edge.from)
        const to = byId.get(edge.to)
        if (!from || !to) continue
        const a = new THREE.Vector3(from.x, from.y + from.h * 0.44, from.z)
        const b = new THREE.Vector3(to.x, to.y - to.h * 0.44, to.z)
        const mid = a.clone().add(b).multiplyScalar(0.5)
        if (edge.kind === 'skip') {
          mid.x += from.x < 0 ? -1.7 : 1.7
          mid.z += 0.9
        } else if (edge.kind === 'select') {
          mid.z -= 0.55
        } else {
          mid.z += 0.32
        }
        const curve = new THREE.CatmullRomCurve3([a, mid, b], false, 'centripetal')
        if (edge.kind === 'skip') {
          const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(28)), skipMat.clone())
          line.computeLineDistances()
          group.add(line)
        } else {
          const color = flowColors[edge.kind] || flowColors.branch
          const radius = edge.kind === 'main' ? 0.036 : edge.kind === 'select' ? 0.026 : 0.018
          const tube = new THREE.Mesh(
            new THREE.TubeGeometry(curve, 22, radius, 6, false),
            new THREE.MeshBasicMaterial({ color, transparent: true, opacity: edge.kind === 'main' ? 0.72 : 0.48, depthWrite: false }),
          )
          group.add(tube)
          if (edge.kind === 'main' || edge.kind === 'select' || edge.kind === 'state') {
            const dot = new THREE.Mesh(
              new THREE.SphereGeometry(edge.kind === 'main' ? 0.085 : 0.06, 8, 8),
              new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 }),
            )
            group.add(dot)
            flows.push({ curve, dot, t: Math.random(), speed: edge.kind === 'main' ? 0.12 : 0.08 })
          }
        }
      }
      const spineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -5.8, 0),
        new THREE.Vector3(0, 6.3, 0),
      ])
      const spine = new THREE.Line(spineGeo, new THREE.LineBasicMaterial({ color: 0x1f4b63, transparent: true, opacity: 0.45 }))
      group.add(spine)
      scene.add(group)
      state.group = group
      state.nodeMeshes = nodeMeshes
      state.pickables = pickables
      state.flows = flows
      state.graph = nextGraph
      applySelection(selectedRef.current)
      renderer.render(scene, camera)
    }

    const applySelection = (selectedId) => {
      for (const [id, group] of state.nodeMeshes) {
        const on = id === selectedId
        group.scale.setScalar(on ? 1.045 : 1)
        group.traverse((child) => {
          if (!child.isMesh || !child.material) return
          const mat = child.material
          if (mat.emissive) mat.emissiveIntensity = on ? 0.78 : child.userData.baseOpacity ? 0.12 : 0.3
          if (child.userData.baseOpacity != null && mat.transparent) mat.opacity = on ? 1 : child.userData.baseOpacity
        })
      }
      if (state.helper) {
        scene.remove(state.helper)
        s3Dispose(state.helper)
        state.helper = null
      }
      const selectedGroup = selectedId ? state.nodeMeshes.get(selectedId) : null
      if (selectedGroup) {
        const helper = new THREE.BoxHelper(selectedGroup, 0x7dd3fc)
        helper.material.transparent = true
        helper.material.opacity = 0.72
        helper.material.depthTest = false
        helper.renderOrder = 5
        scene.add(helper)
        state.helper = helper
      }
    }
    state.applySelection = applySelection

    const raycast = (clientX, clientY) => {
      const rect = renderer.domElement.getBoundingClientRect()
      if (!rect.width || !rect.height) return null
      const pointer = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      )
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(state.pickables, true)
      const seen = new Set()
      let best = null
      let bestScore = Infinity
      const v = new THREE.Vector3()
      for (const hit of hits) {
        let object = hit.object
        let node = null
        while (object) {
          if (object.userData && object.userData.node) { node = object.userData.node; break }
          object = object.parent
        }
        if (!node || seen.has(node.id)) continue
        seen.add(node.id)
        v.set(node.x, node.y, node.z).project(camera)
        const sx = (v.x * 0.5 + 0.5) * rect.width
        const sy = (-v.y * 0.5 + 0.5) * rect.height
        const score = (sx - (clientX - rect.left)) ** 2 + (sy - (clientY - rect.top)) ** 2
        if (score < bestScore) { bestScore = score; best = node }
      }
      return best
    }

    const canvas = renderer.domElement
    canvas.style.touchAction = 'none'
    const onDown = (e) => {
      if (e.button !== 0) return
      if (stageRef.current) stageRef.current.focus()
      state.pointer = { x: e.clientX, y: e.clientY, moved: false }
      canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId)
    }
    const onMove = (e) => {
      if (state.pointer) {
        const dx = e.clientX - state.pointer.x
        const dy = e.clientY - state.pointer.y
        if (Math.abs(dx) + Math.abs(dy) > 3) state.pointer.moved = true
        if (state.pointer.moved) {
          state.theta -= dx * 0.0055
          state.phi = Math.max(0.35, Math.min(1.55, state.phi - dy * 0.0045))
          updateCamera()
          state.pointer.x = e.clientX
          state.pointer.y = e.clientY
          canvas.style.cursor = 'grabbing'
        }
        return
      }
      const hit = raycast(e.clientX, e.clientY)
      const next = hit ? hit.id : null
      if (next !== state.hovered) {
        state.hovered = next
        canvas.style.cursor = next ? 'pointer' : 'grab'
      }
    }
    const onUp = (e) => {
      const pointer = state.pointer
      state.pointer = null
      canvas.style.cursor = 'grab'
      if (!pointer || pointer.moved) return
      const hit = raycast(e.clientX, e.clientY)
      if (hit && onSelectRef.current) onSelectRef.current(hit)
      else if (!hit && onClearRef.current) onClearRef.current()
    }
    const onCancel = () => {
      state.pointer = null
      canvas.style.cursor = 'grab'
    }
    const onWheel = (e) => {
      e.preventDefault()
      state.radius = Math.max(14, Math.min(48, state.radius * Math.exp(e.deltaY * 0.0011)))
      updateCamera()
    }
    const onDouble = () => {
      state.theta = 0.72
      state.phi = 1.16
      if (state.fit) state.fit()
      else updateCamera()
    }
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onCancel)
    canvas.addEventListener('pointerleave', onCancel)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('dblclick', onDouble)

    state.reset = () => {
      state.theta = 0.72
      state.phi = 1.16
      if (state.fit) state.fit()
      else updateCamera()
    }
    state.zoomBy = (factor) => {
      state.radius = Math.max(16, Math.min(48, state.radius / factor))
      updateCamera()
    }

    const clock = new THREE.Clock()
    let raf = 0
    const animate = () => {
      raf = requestAnimationFrame(animate)
      const dt = Math.min(0.05, clock.getDelta())
      if (autoRef.current && !state.pointer) {
        state.theta += dt * 0.16
        updateCamera()
      }
      const data = state.graph && state.graph.graph
      if (data && labelsRef.current) {
        const w = renderer.domElement.clientWidth
        const h = renderer.domElement.clientHeight
        const v = new THREE.Vector3()
        const placed = []
        const obstacles = new Map()
        for (const n of data.nodes) {
          let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
          for (const dx of [-n.w / 2, n.w / 2]) {
            for (const dy of [-n.h / 2, n.h / 2]) {
              for (const dz of [-n.d / 2, n.d / 2]) {
                v.set(n.x + dx, n.y + dy, n.z + dz).project(camera)
                const sx = (v.x * 0.5 + 0.5) * w
                const sy = (-v.y * 0.5 + 0.5) * h
                x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy)
              }
            }
          }
          obstacles.set(n.id, { l: x0 - 4, r: x1 + 4, t: y0 - 4, b: y1 + 4 })
        }
        const ordered = data.nodes.slice().sort((a, b) => {
          const rank = (n) => (n.id === selectedIdRef.current ? 0 : n.group === 'main' ? 1 : n.special === 'attention' ? 2 : n.special === 'indexer' || n.special === 'selector' ? 3 : 4)
          return rank(a) - rank(b)
        })
        for (const node of ordered) {
          const el = labelEls.current[node.id]
          if (!el) continue
          const sig = el.textContent
          if (el._s3sig !== sig) {
            el._s3w = el.offsetWidth
            el._s3h = el.offsetHeight
            el._s3sig = sig
          }
          const lw = el._s3w || 120
          const lh = el._s3h || 32
          v.set(node.x, node.y + node.h / 2 + 0.16, node.z).project(camera)
          const ax = (v.x * 0.5 + 0.5) * w
          const ay = (-v.y * 0.5 + 0.5) * h
          let best = null
          for (const [dx, dy] of s3LabelCandidates(node)) {
            let x = ax + dx
            let y = ay + dy
            x = Math.max(lw / 2 + 8, Math.min(w - lw / 2 - 8, x))
            y = Math.max(lh + 6, Math.min(h - 48, y))
            const rect = { l: x - lw / 2, r: x + lw / 2, t: y - lh, b: y }
            let area = 0
            for (const r of placed) area += s3OverlapArea(rect, r)
            for (const [oid, r] of obstacles) if (oid !== node.id) area += s3OverlapArea(rect, r) * 2.4
            const score = area * 20 + Math.abs(dx) * 0.04 + Math.abs(dy) * 0.04
            if (!best || score < best.score) best = { x, y, rect, score, area }
          }
          if (!best) continue
          if (best.area > 0) {
            const baseY = best.y
            for (const dy of [-34, 34, -68, 68, -102, 102, -136, 136, -170, 170, -204, 204, -238, 238, -272, 272]) {
              const y = Math.max(lh + 6, Math.min(h - 48, baseY + dy))
              const rect = { l: best.x - lw / 2, r: best.x + lw / 2, t: y - lh, b: y }
              let area = 0
              for (const r of placed) area += s3OverlapArea(rect, r)
              for (const [oid, r] of obstacles) if (oid !== node.id) area += s3OverlapArea(rect, r) * 2.4
              if (area === 0) { best = { ...best, y, rect } ; break }
            }
          }
          placed.push(best.rect)
          el.style.transform = `translate(-50%,-100%) translate3d(${best.x.toFixed(1)}px,${best.y.toFixed(1)}px,0)`
          el.style.opacity = v.z < 1 ? '1' : '0'
          const leader = leaderEls.current[node.id]
          if (leader) {
            const ldx = best.x - ax
            const ldy = best.y - ay
            const len = Math.hypot(ldx, ldy)
            leader.style.width = `${len.toFixed(1)}px`
            leader.style.transform = `translate3d(${ax.toFixed(1)}px,${ay.toFixed(1)}px,0) rotate(${Math.atan2(ldy, ldx)}rad)`
            leader.style.opacity = v.z < 1 && len > 18 ? '0.42' : '0'
          }
        }
      }
      for (const f of state.flows) {
        if (flowRef.current) {
          f.dot.visible = true
          f.t = (f.t + dt * f.speed) % 1
          f.dot.position.copy(f.curve.getPointAt(f.t))
        } else {
          f.dot.visible = false
        }
      }
      renderer.render(scene, camera)
    }
    animate()
    threeRef.current = state
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onCancel)
      canvas.removeEventListener('pointerleave', onCancel)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('dblclick', onDouble)
      if (state.group) s3Dispose(state.group)
      if (state.helper) s3Dispose(state.helper)
      s3Dispose(grid)
      renderer.dispose()
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
      threeRef.current = null
    }
  }, [])

  React.useEffect(() => {
    const state = threeRef.current
    if (!state || !state.rebuild || !graph) return
    state.rebuild(graph)
    if (!state.lastModel || state.lastModel !== model.id) {
      state.lastModel = model.id
      state.fit()
    }
  }, [graph, model.id])

  React.useEffect(() => {
    selectedIdRef.current = selectedNodeId
    const state = threeRef.current
    if (state && state.applySelection) state.applySelection(selectedNodeId)
  }, [selectedNodeId])

  const reset = () => {
    if (threeRef.current && threeRef.current.reset) threeRef.current.reset()
  }
  const zoom = (factor) => {
    if (threeRef.current && threeRef.current.zoomBy) threeRef.current.zoomBy(factor)
  }

  const onKeyDown = (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON')) return
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      setLayer(activeIndex - 1)
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault()
      setLayer(activeIndex + 1)
    } else if (e.key === '0') {
      e.preventDefault()
      reset()
    }
  }

  const variant = graph.variant
  const graphNodes = graph.graph.nodes

  return h('div', { className: 'pl-l3-root pl-s3-root', 'data-labels': labels ? '1' : '0', 'data-fallback': fallback ? '1' : '0' }, [
    h('div', { key: 'bar', className: 'pl-l3-bar pl-s3-bar' }, [
      h('span', { key: 'k', className: 'pl-l3-bar-k' }, '3D LAYER STRUCTURE'),
      h('b', { key: 'l', className: 'pl-l3-bar-l' }, `L${activeIndex + 1} / ${total}`),
      h('span', { key: 'v', className: 'pl-l3-bar-v', 'data-kind': variant.kind }, variant.badge),
      variant.vha ? h('span', { key: 'vha', className: 'pl-l3-bar-v pl-vha-chip', title: 'Virtual Head Attention in this layer' }, 'VHA') : null,
      h('span', { key: 's', className: 'pl-l3-bar-shape' }, graph.shape),
      h('span', { key: 'kv', className: 'pl-l3-bar-kv' }, graph.kv),
      h('span', { key: 'sp', className: 'pl-l3-bar-sp' }),
      h(IconButton, { key: 'fit', icon: 'fit', label: zh ? '重置视角' : 'Reset camera', onClick: reset }),
      h(IconButton, { key: 'minus', icon: 'minus', label: zh ? '缩小' : 'Zoom out', onClick: () => zoom(1 / 1.16) }),
      h(IconButton, { key: 'plus', icon: 'plus', label: zh ? '放大' : 'Zoom in', onClick: () => zoom(1.16) }),
      h(IconButton, { key: 'labels', icon: 'book', label: zh ? '显示/隐藏标签' : 'Toggle labels', on: labels, onClick: () => setLabels((v) => !v) }),
      h(IconButton, { key: 'auto', icon: auto ? 'pause' : 'play', label: zh ? '自动旋转' : 'Auto rotate', on: auto, onClick: () => setAuto((v) => !v) }),
    ]),
    h('div', {
      key: 'stage',
      className: 'pl-s3-stage',
      ref: stageRef,
      tabIndex: 0,
      onKeyDown,
    }, [
      h('div', { key: 'canvas', className: 'pl-s3-canvas', ref: canvasRef }),
      fallback
        ? h('div', { key: 'fallback', className: 'pl-s3-fallback' }, [
            h('b', { key: 't' }, zh ? '当前环境不支持 WebGL' : 'WebGL is not available'),
            h('p', { key: 'd' }, zh ? '已切换为模块列表；切换到 2D 视图也能继续查看完整结构。' : 'Showing the module list instead. The 2D view remains available.'),
            h('div', { key: 'n', className: 'pl-s3-fallback-flow' }, graphNodes.map((n) =>
              h(BlueprintNode, { key: n.id, node: n, selected: selectedNodeId === n.id, onSelect }),
            )),
          ])
        : null,
      h('div', { key: 'labels', className: 'pl-s3-labels' }, fallback ? null : [
        ...graphNodes.map((n) => h('span', {
          key: 'lead-' + n.id,
          className: 'pl-s3-leader',
          'data-selected': selectedNodeId === n.id ? '1' : '0',
          ref: (el) => {
            if (el) leaderEls.current[n.id] = el
            else delete leaderEls.current[n.id]
          },
        })),
        ...graphNodes.map((n) =>
        h('div', {
          key: n.id,
          className: 'pl-s3-label',
          'data-kind': n.kind,
          'data-special': n.special || '',
          'data-selected': selectedNodeId === n.id ? '1' : '0',
          title: n.desc || n.label,
          onClick: () => { if (onSelect) onSelect(n) },
          onPointerDown: (e) => e.stopPropagation(),
          ref: (el) => {
            if (el) labelEls.current[n.id] = el
            else delete labelEls.current[n.id]
          },
        }, [
          h('b', { key: 'l' }, n.label),
          h('code', { key: 's' }, n.shape || '—'),
        ])),
      ]),
      h(S3LayerRail, { key: 'rail', total, activeIndex, onPick: setLayer }),
      h(S3Scrubber, { key: 'scrub', total, activeIndex, onPick: setLayer }),
      h('div', { key: 'hint', className: 'pl-l3-hint pl-s3-hint' }, [
        h(Glyph, { key: 'i', name: 'info', size: 11 }),
        h('span', { key: 't' }, zh ? '拖拽旋转 · 滚轮缩放 · 点击模块查看形状/公式 · 方向键换层' : 'Drag to orbit · wheel to zoom · click a module for shapes/formulas'),
      ]),
      h(SceneLegend, { key: 'legend', zh }),
    ]),
  ])
}
