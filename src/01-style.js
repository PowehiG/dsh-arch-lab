/* ------------------------------------------------------------------ styles */
const CSS = `
.pl-root{
  --pl-cyan:#22d3ee; --pl-indigo:#818cf8; --pl-violet:#a78bfa; --pl-pink:#f472b6;
  --pl-amber:#f59e0b; --pl-green:#34d399; --pl-slate:#94a3b8;
  --pl-panel:color-mix(in srgb, var(--dsw-alias-bg-layer-1) 88%, transparent);
  --pl-panel-2:color-mix(in srgb, var(--dsw-alias-bg-layer-2) 82%, transparent);
  --pl-line:var(--dsw-alias-border-l1);
  --pl-line-2:var(--dsw-alias-border-l2);
  --pl-text:var(--dsw-alias-label-primary);
  --pl-dim:var(--dsw-alias-label-secondary);
  --pl-accent:#6d8cff;
  position:relative; height:100%; width:100%; min-height:0; display:flex; flex-direction:column;
  overflow:hidden; color:var(--pl-text);
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
  background:
    radial-gradient(1100px 540px at 16% -12%, rgba(109,140,255,.20), transparent 62%),
    radial-gradient(900px 520px at 96% 112%, rgba(34,211,238,.16), transparent 60%),
    radial-gradient(700px 400px at 58% 42%, rgba(167,139,250,.07), transparent 65%),
    var(--dsw-alias-bg-base);
  font-size:13px; line-height:1.5;
}
.pl-root[data-pl-theme="light"]{
  background:
    radial-gradient(1100px 540px at 16% -12%, rgba(109,140,255,.16), transparent 62%),
    radial-gradient(900px 520px at 96% 112%, rgba(34,211,238,.12), transparent 60%),
    radial-gradient(700px 400px at 58% 42%, rgba(167,139,250,.06), transparent 65%),
    var(--dsw-alias-bg-base);
}
.pl-root *{box-sizing:border-box}
.pl-inspector[data-hidden="1"]{display:none}
.pl-root ::selection{background:rgba(109,140,255,.30)}
.pl-root ::-webkit-scrollbar{width:8px;height:8px}
.pl-root ::-webkit-scrollbar-thumb{background:color-mix(in srgb,var(--pl-dim) 28%,transparent);border-radius:8px;border:2px solid transparent;background-clip:content-box}
.pl-root ::-webkit-scrollbar-track{background:transparent}

.pl-root::before{
  content:""; position:absolute; inset:0; pointer-events:none; z-index:0; opacity:.30;
  background-image:
    linear-gradient(color-mix(in srgb,var(--pl-dim) 13%,transparent) 1px,transparent 1px),
    linear-gradient(90deg,color-mix(in srgb,var(--pl-dim) 13%,transparent) 1px,transparent 1px);
  background-size:44px 44px;
  mask-image:radial-gradient(ellipse at 50% 30%,#000 0%,transparent 78%);
}
.pl-root[data-pl-theme="light"]::before{opacity:.22}

/* ---------------------------------------------------------------- header */
.pl-header{
  position:relative; z-index:2; flex:0 0 62px; display:flex; align-items:center; gap:18px;
  padding:0 18px; border-bottom:1px solid var(--pl-line);
  background:color-mix(in srgb,var(--dsw-alias-bg-base) 78%,transparent);
  backdrop-filter:blur(18px) saturate(1.15);
}
.pl-brand{display:flex;align-items:center;gap:10px;flex:0 0 auto;user-select:none}
.pl-logo{width:32px;height:32px;display:grid;place-items:center;border-radius:10px;
  background:linear-gradient(140deg,rgba(34,211,238,.16),rgba(129,140,248,.16));
  border:1px solid color-mix(in srgb,var(--pl-indigo) 32%,transparent);
  box-shadow:0 0 22px rgba(109,140,255,.20), inset 0 0 14px rgba(34,211,238,.08);
}
.pl-brand-text{display:flex;flex-direction:column;line-height:1.12}
.pl-brand-title{font-size:12px;font-weight:750;letter-spacing:.2em;
  background:linear-gradient(92deg,#22d3ee 0%,#818cf8 48%,#f472b6 100%);
  -webkit-background-clip:text;background-clip:text;color:transparent;white-space:nowrap}
.pl-brand-sub{font-size:10px;letter-spacing:.14em;color:var(--pl-dim);margin-top:2px}

.pl-pills{display:flex;align-items:center;gap:6px;overflow-x:auto;flex:1 1 auto;min-width:0;
  padding:4px; scrollbar-width:none}
.pl-pills::-webkit-scrollbar{display:none}
.pl-pill{
  display:flex;align-items:center;gap:7px;flex:0 0 auto;height:32px;padding:0 11px;border-radius:9px;
  border:1px solid transparent;background:transparent;color:var(--pl-dim);cursor:pointer;
  font:inherit;font-size:12px;white-space:nowrap;transition:background .16s,border-color .16s,color .16s;
}
.pl-pill:hover{background:color-mix(in srgb,var(--pl-dim) 9%,transparent);color:var(--pl-text)}
.pl-pill[data-active="1"]{color:var(--pl-text);border-color:color-mix(in srgb,var(--pl-indigo) 40%,transparent);
  background:linear-gradient(180deg,color-mix(in srgb,var(--pl-indigo) 17%,transparent),color-mix(in srgb,var(--pl-cyan) 7%,transparent));
  box-shadow:0 0 18px rgba(109,140,255,.16), inset 0 1px 0 rgba(255,255,255,.10);
}
.pl-pill-dot{width:6px;height:6px;border-radius:50%;background:var(--dot,var(--pl-indigo));
  box-shadow:0 0 8px var(--dot,var(--pl-indigo))}
.pl-pill-params{font-size:10px;color:var(--pl-dim);font-variant-numeric:tabular-nums}

.pl-actions{display:flex;align-items:center;gap:6px;flex:0 0 auto}
.pl-refresh-wrap{position:relative;display:inline-flex;align-items:center}
.pl-refresh-badge{position:absolute;right:-4px;top:-4px;min-width:13px;height:13px;padding:0 3px;border-radius:7px;
  display:grid;place-items:center;background:var(--pl-cyan);color:#061018;font-size:7.5px;font-weight:750;line-height:1;
  box-shadow:0 0 0 2px var(--dsw-alias-bg-base),0 0 8px rgba(34,211,238,.55);pointer-events:none}
.pl-iconbtn{
  appearance:none;border:1px solid transparent;background:transparent;color:var(--pl-dim);
  width:32px;height:32px;border-radius:9px;display:grid;place-items:center;cursor:pointer;
  transition:background .15s,color .15s,border-color .15s,transform .15s;font:inherit;
}
.pl-iconbtn:hover{background:color-mix(in srgb,var(--pl-dim) 12%,transparent);color:var(--pl-text);border-color:var(--pl-line)}
.pl-iconbtn:active{transform:scale(.94)}
.pl-iconbtn[data-on="1"]{color:var(--pl-cyan);background:color-mix(in srgb,var(--pl-cyan) 12%,transparent);
  border-color:color-mix(in srgb,var(--pl-cyan) 30%,transparent)}
.pl-iconbtn:focus-visible,.pl-pill:focus-visible,.pl-btn:focus-visible,.pl-card:focus-visible{
  outline:2px solid color-mix(in srgb,var(--pl-cyan) 65%,transparent);outline-offset:1px}

/* ------------------------------------------------------------------ body */
.pl-body{position:relative;z-index:1;flex:1 1 auto;min-height:0;display:flex;align-items:stretch}
.pl-left{
  flex:0 0 246px;min-width:0;display:flex;flex-direction:column;gap:10px;padding:12px 10px 10px;
  border-right:1px solid var(--pl-line);
  background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 42%,transparent);
  transition:margin-left .22s ease,opacity .18s ease;
}
.pl-left[data-collapsed="1"]{margin-left:-246px;opacity:0;pointer-events:none}
.pl-search{position:relative;flex:0 0 auto}
.pl-search svg{position:absolute;left:9px;top:50%;transform:translateY(-50%);color:var(--pl-dim);opacity:.75}
.pl-input{
  width:100%;height:32px;border-radius:9px;border:1px solid var(--pl-line);
  background:color-mix(in srgb,var(--dsw-alias-bg-base) 60%,transparent);
  color:var(--pl-text);font:inherit;font-size:12px;padding:0 10px 0 29px;outline:none;
  transition:border-color .15s,box-shadow .15s;
}
.pl-input::placeholder{color:color-mix(in srgb,var(--pl-dim) 78%,transparent)}
.pl-input:focus{border-color:color-mix(in srgb,var(--pl-indigo) 55%,transparent);
  box-shadow:0 0 0 3px rgba(109,140,255,.12)}
.pl-chips{display:flex;flex-wrap:wrap;gap:5px;flex:0 0 auto}
.pl-chip{
  appearance:none;border:1px solid var(--pl-line);background:transparent;color:var(--pl-dim);
  font:inherit;font-size:10.5px;height:22px;padding:0 8px;border-radius:99px;cursor:pointer;
  transition:.15s;white-space:nowrap;
}
.pl-chip:hover{color:var(--pl-text);border-color:var(--pl-line-2)}
.pl-chip[data-on="1"]{color:var(--pl-cyan);border-color:color-mix(in srgb,var(--pl-cyan) 38%,transparent);
  background:color-mix(in srgb,var(--pl-cyan) 10%,transparent)}
.pl-list{flex:1 1 auto;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:6px;padding:2px 2px 8px}
.pl-year{font-size:9.5px;letter-spacing:.16em;color:var(--pl-dim);padding:9px 4px 3px;display:flex;align-items:center;gap:8px}
.pl-year::after{content:"";height:1px;flex:1;background:linear-gradient(90deg,var(--pl-line),transparent)}
.pl-modelcard{
  position:relative;display:flex;flex-direction:column;gap:5px;text-align:left;
  padding:9px 10px 8px;border-radius:11px;border:1px solid transparent;background:transparent;
  color:var(--pl-text);cursor:pointer;font:inherit;transition:.16s;overflow:hidden;
}
.pl-modelcard:hover{background:color-mix(in srgb,var(--pl-dim) 8%,transparent);border-color:var(--pl-line)}
.pl-modelcard[data-active="1"]{
  background:linear-gradient(120deg,color-mix(in srgb,var(--dot,var(--pl-indigo)) 15%,transparent),color-mix(in srgb,var(--pl-cyan) 5%,transparent));
  border-color:color-mix(in srgb,var(--dot,var(--pl-indigo)) 34%,transparent);
  box-shadow:0 6px 20px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.06);
}
.pl-modelcard[data-active="1"]::before{content:"";position:absolute;left:0;top:9px;bottom:9px;width:2px;border-radius:2px;
  background:var(--dot,var(--pl-indigo));box-shadow:0 0 10px var(--dot,var(--pl-indigo))}
.pl-modelcard-top{display:flex;align-items:center;gap:7px}
.pl-modelcard-name{font-size:12.5px;font-weight:650;letter-spacing:.01em;line-height:1.25;flex:1;min-width:0;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pl-origin{font-size:8.5px;letter-spacing:.08em;padding:1px 5px;border-radius:4px;flex:0 0 auto;
  border:1px solid color-mix(in srgb,var(--pl-amber) 40%,transparent);color:var(--pl-amber);
  background:color-mix(in srgb,var(--pl-amber) 10%,transparent)}
.pl-origin[data-kind="local"]{color:var(--pl-green);border-color:color-mix(in srgb,var(--pl-green) 40%,transparent);
  background:color-mix(in srgb,var(--pl-green) 10%,transparent)}
.pl-modelcard-meta{display:flex;align-items:center;gap:6px;font-size:10px;color:var(--pl-dim);min-width:0}
.pl-modelcard-meta em{font-style:normal;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pl-modelcard-params{display:flex;align-items:center;gap:6px;font-size:10px;font-variant-numeric:tabular-nums;color:var(--pl-dim)}
.pl-param-bar{flex:1;height:3px;border-radius:3px;background:color-mix(in srgb,var(--pl-dim) 15%,transparent);overflow:hidden}
.pl-param-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,var(--dot,var(--pl-indigo)),var(--pl-cyan));
  box-shadow:0 0 8px color-mix(in srgb,var(--pl-cyan) 50%,transparent);transition:width .4s}
.pl-minitags{display:flex;gap:4px;flex-wrap:wrap}
.pl-minitag{font-size:9px;padding:0 4px;border-radius:3px;color:var(--pl-dim);
  background:color-mix(in srgb,var(--pl-dim) 10%,transparent)}
.pl-empty{padding:22px 12px;text-align:center;color:var(--pl-dim);font-size:11px;line-height:1.7}
.pl-left-foot{flex:0 0 auto;padding:7px 4px 2px;border-top:1px solid var(--pl-line);
  font-size:9.5px;color:var(--pl-dim);display:flex;justify-content:space-between;align-items:center}

/* ----------------------------------------------------------------- stage */
.pl-stage{flex:1 1 auto;min-width:0;min-height:0;display:flex;flex-direction:column;position:relative}
.pl-toolbar{
  flex:0 0 42px;display:flex;align-items:center;gap:10px;padding:0 14px;
  border-bottom:1px solid color-mix(in srgb,var(--pl-line) 70%,transparent);
  background:color-mix(in srgb,var(--dsw-alias-bg-base) 35%,transparent);
}
.pl-crumb{display:flex;align-items:center;gap:7px;font-size:11px;color:var(--pl-dim);min-width:0;flex:1}
.pl-crumb b{color:var(--pl-text);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px}
.pl-crumb button{appearance:none;border:none;background:none;color:var(--pl-dim);font:inherit;font-size:11px;
  cursor:pointer;padding:2px 4px;border-radius:5px;display:inline-flex;align-items:center;gap:4px}
.pl-crumb button:hover{color:var(--pl-cyan);background:color-mix(in srgb,var(--pl-cyan) 9%,transparent)}
.pl-crumb-sep{opacity:.5}
.pl-seg{display:inline-flex;padding:2px;border-radius:8px;border:1px solid var(--pl-line);background:color-mix(in srgb,var(--pl-dim) 6%,transparent)}
.pl-seg button{appearance:none;border:none;background:transparent;color:var(--pl-dim);font:inherit;font-size:10.5px;
  height:22px;padding:0 9px;border-radius:6px;cursor:pointer;transition:.15s}
.pl-seg button[data-on="1"]{background:color-mix(in srgb,var(--pl-indigo) 22%,transparent);color:var(--pl-text);
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--pl-indigo) 30%,transparent)}
.pl-zoomgroup{display:flex;align-items:center;gap:2px;color:var(--pl-dim);font-size:10px;font-variant-numeric:tabular-nums}
.pl-zoomgroup .pl-iconbtn{width:26px;height:26px;border-radius:7px}
.pl-zoompct{min-width:34px;text-align:center;opacity:.8}

.pl-canvas-wrap{position:relative;flex:1 1 auto;min-height:0;overflow:hidden;cursor:grab}
.pl-canvas-wrap[data-panning="1"]{cursor:grabbing}
.pl-canvas-wrap::before{
  content:"";position:absolute;inset:0;pointer-events:none;
  background:
    radial-gradient(600px 320px at 50% 42%,rgba(109,140,255,.09),transparent 70%),
    radial-gradient(420px 260px at 78% 82%,rgba(34,211,238,.06),transparent 70%);
}
.pl-canvas-wrap::after{
  content:"";position:absolute;inset:0;pointer-events:none;
  background-image:radial-gradient(circle,color-mix(in srgb,var(--pl-dim) 26%,transparent) 1px,transparent 1px);
  background-size:22px 22px;opacity:.28;
  mask-image:radial-gradient(ellipse at 50% 45%,#000 0%,transparent 85%);
}
.pl-canvas-holder{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
.pl-canvas{position:relative;transform-origin:center center;will-change:transform}
.pl-canvas svg.pl-edges{position:absolute;left:0;top:0;overflow:visible;pointer-events:none}
.pl-edge{stroke:color-mix(in srgb,var(--pl-dim) 22%,transparent);stroke-width:1.4;fill:none}
.pl-edge-hot{stroke:var(--edge,var(--pl-cyan));stroke-width:1.6;stroke-dasharray:2 13;fill:none;
  filter:drop-shadow(0 0 4px var(--edge,var(--pl-cyan)));animation:pl-flow 1.15s linear infinite}
.pl-edge-dim{opacity:.55}
@keyframes pl-flow{to{stroke-dashoffset:-30}}
.pl-node{
  position:absolute;display:flex;align-items:center;gap:11px;padding:0 13px;border-radius:12px;
  border:1px solid var(--pl-line);text-align:left;font:inherit;color:var(--pl-text);cursor:pointer;
  background:
    linear-gradient(120deg,color-mix(in srgb,var(--kind,var(--pl-indigo)) 10%,transparent),transparent 62%),
    color-mix(in srgb,var(--dsw-alias-bg-layer-1) 86%,transparent);
  box-shadow:0 8px 24px rgba(0,0,0,.14), inset 0 1px 0 rgba(255,255,255,.05);
  transition:transform .16s ease, box-shadow .16s ease, border-color .16s ease, background .16s;
  backdrop-filter:blur(9px);overflow:hidden;
}
.pl-node::after{content:"";position:absolute;left:0;top:12%;bottom:12%;width:2px;border-radius:2px;
  background:var(--kind,var(--pl-indigo));opacity:.85;box-shadow:0 0 10px var(--kind,var(--pl-indigo))}
.pl-node:hover{transform:translateY(-1.5px);border-color:color-mix(in srgb,var(--kind,var(--pl-indigo)) 42%,var(--pl-line));
  box-shadow:0 12px 30px rgba(0,0,0,.18), 0 0 22px color-mix(in srgb,var(--kind,var(--pl-indigo)) 14%,transparent), inset 0 1px 0 rgba(255,255,255,.08)}
.pl-node[data-selected="1"]{border-color:color-mix(in srgb,var(--kind,var(--pl-indigo)) 62%,transparent);
  box-shadow:0 14px 34px rgba(0,0,0,.2), 0 0 0 1px color-mix(in srgb,var(--kind,var(--pl-indigo)) 34%,transparent),
    0 0 28px color-mix(in srgb,var(--kind,var(--pl-indigo)) 18%,transparent), inset 0 1px 0 rgba(255,255,255,.1)}
.pl-node[data-kind="residual"]{background:color-mix(in srgb,var(--dsw-alias-bg-base) 62%,transparent);
  border-style:dashed;box-shadow:none}
.pl-node[data-kind="repeat"]{background:
  linear-gradient(120deg,color-mix(in srgb,var(--pl-indigo) 16%,transparent),transparent 62%),
  color-mix(in srgb,var(--dsw-alias-bg-layer-1) 92%,transparent)}
.pl-node-icon{flex:0 0 auto;width:28px;height:28px;border-radius:8px;display:grid;place-items:center;
  color:var(--kind,var(--pl-indigo));background:color-mix(in srgb,var(--kind,var(--pl-indigo)) 13%,transparent);
  border:1px solid color-mix(in srgb,var(--kind,var(--pl-indigo)) 24%,transparent)}
.pl-node-body{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:1px}
.pl-node-title{font-size:12.5px;font-weight:640;letter-spacing:.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pl-node-sub{font-size:9.5px;color:var(--pl-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pl-node-right{flex:0 0 auto;display:flex;align-items:center;gap:6px}
.pl-count{font-size:10px;font-weight:650;padding:2px 7px;border-radius:99px;color:var(--pl-indigo);
  background:color-mix(in srgb,var(--pl-indigo) 14%,transparent);border:1px solid color-mix(in srgb,var(--pl-indigo) 28%,transparent);
  font-variant-numeric:tabular-nums;white-space:nowrap}
.pl-node-chev{color:var(--pl-dim);opacity:.6;display:grid;place-items:center}
.pl-ghost{position:absolute;left:0;right:0;height:100%;border-radius:12px;border:1px solid var(--pl-line);
  background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 55%,transparent);z-index:-1}
.pl-shape{position:absolute;font-family:"SFMono-Regular",ui-monospace,Menlo,Consolas,monospace;font-size:9px;
  color:color-mix(in srgb,var(--pl-dim) 82%,transparent);white-space:nowrap;letter-spacing:-.01em}
.pl-shape::before{content:"→ ";opacity:.5}
.pl-rail-label{position:absolute;font-size:8.5px;letter-spacing:.14em;color:var(--pl-dim);opacity:.65;white-space:nowrap}
.pl-canvas-hint{position:absolute;left:14px;bottom:12px;font-size:9.5px;color:var(--pl-dim);opacity:.7;
  display:flex;align-items:center;gap:6px;pointer-events:none;z-index:2}
.pl-canvas-hint kbd{border:1px solid var(--pl-line);border-radius:4px;padding:0 4px;font-family:inherit;font-size:9px}

.pl-legend{position:absolute;right:14px;bottom:12px;display:flex;flex-direction:column;gap:5px;
  padding:8px 10px;border-radius:10px;border:1px solid var(--pl-line);
  background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 72%,transparent);backdrop-filter:blur(10px);
  font-size:9.5px;color:var(--pl-dim);z-index:2;pointer-events:none}
.pl-legend-row{display:flex;align-items:center;gap:6px}
.pl-legend-dot{width:7px;height:7px;border-radius:2px;background:var(--c)}

/* ------------------------------------------------------------- inspector */
.pl-inspector{
  flex:0 0 358px;min-width:0;display:flex;flex-direction:column;gap:0;
  border-left:1px solid var(--pl-line);
  background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 46%,transparent);
  overflow-y:auto;overflow-x:hidden;
}
.pl-insp{padding:16px 16px 26px;display:flex;flex-direction:column;gap:14px;animation:pl-in .22s ease}
@keyframes pl-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
.pl-kicker{font-size:9px;letter-spacing:.2em;color:var(--pl-dim);text-transform:uppercase;display:flex;align-items:center;gap:8px}
.pl-kicker::after{content:"";height:1px;flex:1;background:linear-gradient(90deg,var(--pl-line),transparent)}
.pl-hero-name{font-size:27px;line-height:1.1;font-weight:750;letter-spacing:-.02em;margin:0;
  background:linear-gradient(100deg,var(--pl-text) 12%,var(--pl-cyan) 56%,var(--pl-indigo) 100%);
  -webkit-background-clip:text;background-clip:text;color:transparent;word-break:break-word}
.pl-hero-org{font-size:11px;color:var(--pl-dim);display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.pl-hero-org span{display:inline-flex;align-items:center;gap:5px}
.pl-dot{width:5px;height:5px;border-radius:50%;background:var(--pl-dim);opacity:.6}
.pl-summary{font-size:11.5px;line-height:1.82;color:color-mix(in srgb,var(--pl-text) 80%,var(--pl-dim));
  text-align:justify;margin:0}
.pl-statgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.pl-stat{position:relative;padding:8px 9px;border-radius:9px;border:1px solid var(--pl-line);
  background:color-mix(in srgb,var(--dsw-alias-bg-base) 38%,transparent);overflow:hidden}
.pl-stat::after{content:"";position:absolute;right:-9px;bottom:-9px;width:26px;height:26px;border-radius:50%;
  background:radial-gradient(circle,color-mix(in srgb,var(--pl-cyan) 24%,transparent),transparent 70%)}
.pl-stat-k{font-size:8.5px;letter-spacing:.08em;color:var(--pl-dim);text-transform:uppercase}
.pl-stat-v{font-size:14px;font-weight:680;font-variant-numeric:tabular-nums;margin-top:2px;white-space:nowrap;
  overflow:hidden;text-overflow:ellipsis}
.pl-tags{display:flex;flex-wrap:wrap;gap:4px}
.pl-tag{font-size:9.5px;padding:2px 7px;border-radius:99px;color:color-mix(in srgb,var(--pl-cyan) 82%,var(--pl-text));
  background:color-mix(in srgb,var(--pl-cyan) 9%,transparent);border:1px solid color-mix(in srgb,var(--pl-cyan) 20%,transparent)}
.pl-btn{
  appearance:none;display:inline-flex;align-items:center;justify-content:center;gap:6px;
  height:30px;padding:0 12px;border-radius:8px;border:1px solid var(--pl-line);
  background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 70%,transparent);color:var(--pl-text);
  font:inherit;font-size:11px;cursor:pointer;transition:.15s;white-space:nowrap;
}
.pl-btn:hover{border-color:var(--pl-line-2);background:color-mix(in srgb,var(--pl-dim) 10%,transparent)}
.pl-btn[data-primary="1"]{border-color:color-mix(in srgb,var(--pl-indigo) 45%,transparent);color:#eef2ff;
  background:linear-gradient(135deg,#4f6bff,#7c5cf5);box-shadow:0 6px 18px rgba(79,107,255,.30)}
.pl-btn[data-primary="1"]:hover{filter:brightness(1.08)}
.pl-btn[data-sm="1"]{height:26px;padding:0 9px;font-size:10.5px;border-radius:7px}
.pl-btn:disabled{opacity:.45;cursor:not-allowed}
.pl-row{display:flex;align-items:center;gap:7px;flex-wrap:wrap}

.pl-idea{position:relative;border-radius:11px;border:1px solid var(--pl-line);overflow:hidden;
  background:color-mix(in srgb,var(--dsw-alias-bg-base) 30%,transparent);transition:.18s}
.pl-idea:hover{border-color:var(--pl-line-2)}
.pl-idea[data-open="1"]{border-color:color-mix(in srgb,var(--pl-indigo) 40%,transparent);
  background:linear-gradient(140deg,color-mix(in srgb,var(--pl-indigo) 8%,transparent),transparent 70%)}
.pl-idea-head{display:flex;align-items:flex-start;gap:9px;padding:10px 11px;cursor:pointer;user-select:none}
.pl-idea-num{flex:0 0 auto;width:17px;height:17px;border-radius:5px;display:grid;place-items:center;
  font-size:9px;font-weight:700;color:var(--pl-cyan);background:color-mix(in srgb,var(--pl-cyan) 12%,transparent);
  border:1px solid color-mix(in srgb,var(--pl-cyan) 22%,transparent);margin-top:1px}
.pl-idea-title{font-size:11.5px;font-weight:620;line-height:1.45;flex:1}
.pl-idea-body{padding:0 11px 11px 37px;font-size:10.8px;line-height:1.8;color:color-mix(in srgb,var(--pl-text) 74%,var(--pl-dim))}
.pl-idea-formula{margin:8px 0 0;padding:8px 10px;border-radius:8px;border:1px solid var(--pl-line);
  background:color-mix(in srgb,var(--dsw-alias-bg-base) 55%,transparent);overflow-x:auto}
.pl-vars{display:flex;flex-direction:column;gap:4px;margin-top:8px}
.pl-var{display:flex;gap:8px;font-size:9.5px;line-height:1.5;color:var(--pl-dim)}
.pl-var b{flex:0 0 auto;color:var(--pl-cyan);font-weight:500;font-family:"SFMono-Regular",ui-monospace,Menlo,monospace}
.pl-nodepanel{padding:14px;border-radius:12px;border:1px solid var(--pl-line);
  background:linear-gradient(150deg,color-mix(in srgb,var(--kind,var(--pl-indigo)) 10%,transparent),transparent 60%),
  color-mix(in srgb,var(--dsw-alias-bg-base) 32%,transparent)}
.pl-nodepanel-head{display:flex;align-items:flex-start;gap:10px}
.pl-nodekind{font-size:8.5px;letter-spacing:.14em;text-transform:uppercase;padding:2px 6px;border-radius:4px;
  color:var(--kind,var(--pl-indigo));background:color-mix(in srgb,var(--kind,var(--pl-indigo)) 12%,transparent);
  border:1px solid color-mix(in srgb,var(--kind,var(--pl-indigo)) 24%,transparent);margin-bottom:5px;display:inline-block}
.pl-nodepanel h3{margin:0;font-size:17px;line-height:1.25;font-weight:700}
.pl-nodepanel .pl-desc{font-size:10.8px;line-height:1.8;color:color-mix(in srgb,var(--pl-text) 76%,var(--pl-dim));margin:8px 0 0}
.pl-shapebox{margin-top:10px;padding:7px 9px;border-radius:7px;border:1px dashed var(--pl-line-2);
  font-family:"SFMono-Regular",ui-monospace,Menlo,monospace;font-size:9.5px;color:var(--pl-dim);
  white-space:pre-wrap;word-break:break-word}
.pl-formulabox{margin-top:11px;border-radius:9px;border:1px solid color-mix(in srgb,var(--pl-cyan) 18%,var(--pl-line));
  background:color-mix(in srgb,var(--dsw-alias-bg-base) 52%,transparent);padding:12px 12px;overflow-x:auto}
.pl-formulabox .pl-kicker{margin-bottom:8px;color:color-mix(in srgb,var(--pl-cyan) 70%,var(--pl-dim))}
.pl-sectionhead{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:2px}
.pl-sectionhead h4{margin:0;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--pl-dim);font-weight:600}
.pl-caption{font-size:9.5px;color:var(--pl-dim);opacity:.8;line-height:1.6}

/* ------------------------------------------------------------------ math */
.pl-math{font-family:"Cambria Math","STIX Two Math","Latin Modern Math","Times New Roman",Georgia,serif;
  font-size:15px;line-height:1.9;color:var(--pl-text);display:block;white-space:normal}
.pl-math-line{display:flex;flex-wrap:wrap;align-items:center;gap:.12em;min-height:1.9em}
.pl-math-inline{display:inline-flex;align-items:center;gap:.08em;white-space:nowrap;vertical-align:middle}
.pl-m-seq{display:inline-flex;align-items:center;gap:.06em;flex-wrap:wrap}
.pl-m-sym{display:inline-block;white-space:pre}
.pl-m-frac{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;
  margin:0 .16em;font-size:.94em;line-height:1.18}
.pl-m-num{padding:0 .22em .06em;border-bottom:1px solid color-mix(in srgb,var(--pl-text) 55%,transparent)}
.pl-m-den{padding:.06em .22em 0}
.pl-m-sqrt{display:inline-flex;align-items:flex-start;margin:0 .1em}
.pl-m-rad{font-size:1.28em;line-height:.92;transform:translateY(.08em)}
.pl-m-sqrtbody{border-top:1px solid color-mix(in srgb,var(--pl-text) 65%,transparent);padding:.05em .18em 0;margin-left:-.05em}
.pl-m-sup,.pl-m-sub{font-size:.66em;line-height:1;display:inline-block}
.pl-m-sup{vertical-align:super;margin-left:.04em}
.pl-m-sub{vertical-align:sub;margin-left:.04em}
.pl-m-bigop{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;margin:0 .2em;line-height:1}
.pl-m-bigop-op{font-size:1.55em;line-height:1}
.pl-m-bigop-lim{font-size:.58em;line-height:1.15;color:color-mix(in srgb,var(--pl-text) 86%,transparent);white-space:nowrap;text-align:center}
.pl-m-bigop-under{margin-top:.06em}
.pl-m-bigop-over{margin-bottom:.06em}
.pl-m-delim{display:inline-flex;align-items:stretch;margin:0 .06em}
.pl-m-delim-char{display:inline-flex;align-items:center;font-size:1.55em;line-height:.95;
  transform:scaleY(1.05);color:color-mix(in srgb,var(--pl-text) 88%,transparent)}
.pl-m-delim-body{display:inline-flex;align-items:center;padding:0 .06em}
.pl-m-accent{position:relative;display:inline-block;padding-top:.42em}
.pl-m-accent-body{display:inline-block}
.pl-m-accent-mark{position:absolute;left:50%;top:-.02em;transform:translateX(-50%);font-size:.78em;line-height:1}
.pl-m-text{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC",sans-serif;font-size:.82em;
  padding:0 .08em;font-style:normal}
.pl-m-mono{font-family:"SFMono-Regular",ui-monospace,Menlo,monospace}
.pl-m-italic{font-style:italic}
.pl-m-bold{font-weight:700}
.pl-m-cal{font-family:"Snell Roundhand","Segoe Script",cursive}
.pl-m-bb{font-family:"STIX Two Math","Cambria Math",serif;font-weight:600}
.pl-m-space{display:inline-block}
.pl-m-raw{font-family:"SFMono-Regular",ui-monospace,Menlo,monospace;font-size:.82em;
  color:var(--pl-amber);white-space:pre}

/* ---------------------------------------------------------------- modals */
.pl-backdrop{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;
  padding:30px;background:rgba(4,7,18,.58);backdrop-filter:blur(5px);animation:pl-fade .16s ease}
.pl-root[data-pl-theme="light"] .pl-backdrop{background:rgba(24,30,52,.36)}
@keyframes pl-fade{from{opacity:0}to{opacity:1}}
.pl-modal{position:relative;width:min(880px,100%);max-height:min(86vh,900px);display:flex;flex-direction:column;
  border-radius:16px;border:1px solid color-mix(in srgb,var(--pl-indigo) 26%,var(--pl-line));
  background:linear-gradient(160deg,color-mix(in srgb,var(--dsw-alias-bg-layer-1) 96%,#10162c 4%),var(--dsw-alias-bg-layer-1));
  box-shadow:0 40px 100px rgba(0,0,0,.50), 0 0 0 1px rgba(255,255,255,.04) inset, 0 0 60px rgba(109,140,255,.10);
  animation:pl-pop .2s cubic-bezier(.2,.8,.2,1);overflow:hidden}
@keyframes pl-pop{from{opacity:0;transform:translateY(8px) scale(.985)}to{opacity:1;transform:none}}
.pl-modal-head{flex:0 0 auto;display:flex;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid var(--pl-line);
  background:linear-gradient(90deg,rgba(109,140,255,.10),transparent 70%)}
.pl-modal-title{font-size:14px;font-weight:680;letter-spacing:.02em}
.pl-modal-sub{font-size:10px;color:var(--pl-dim);margin-top:1px}
.pl-modal-body{flex:1 1 auto;min-height:0;overflow-y:auto;padding:16px 18px 20px}
.pl-modal-foot{flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;gap:10px;
  padding:11px 18px;border-top:1px solid var(--pl-line);background:color-mix(in srgb,var(--dsw-alias-bg-base) 36%,transparent)}
.pl-close{margin-left:auto}

.pl-tabs{display:inline-flex;gap:2px;padding:2px;border-radius:8px;border:1px solid var(--pl-line);
  background:color-mix(in srgb,var(--pl-dim) 6%,transparent);margin-bottom:12px}
.pl-tabs button{appearance:none;border:none;background:transparent;color:var(--pl-dim);font:inherit;font-size:11px;
  height:24px;padding:0 11px;border-radius:6px;cursor:pointer}
.pl-tabs button[data-on="1"]{color:var(--pl-text);background:color-mix(in srgb,var(--pl-indigo) 20%,transparent)}

.pl-field{display:flex;flex-direction:column;gap:5px;margin-bottom:10px}
.pl-label{font-size:10px;color:var(--pl-dim);letter-spacing:.06em}
.pl-textarea{width:100%;min-height:150px;resize:vertical;border-radius:9px;border:1px solid var(--pl-line);
  background:color-mix(in srgb,var(--dsw-alias-bg-base) 52%,transparent);color:var(--pl-text);
  font-family:"SFMono-Regular",ui-monospace,Menlo,monospace;font-size:11px;line-height:1.7;padding:10px;outline:none}
.pl-textarea:focus{border-color:color-mix(in srgb,var(--pl-indigo) 52%,transparent);box-shadow:0 0 0 3px rgba(109,140,255,.1)}
.pl-textarea[data-plain="1"]{font-family:inherit}
.pl-hint{font-size:9.5px;color:var(--pl-dim);line-height:1.7}
.pl-hint b{color:var(--pl-cyan);font-weight:500}

.pl-analyze{display:grid;grid-template-columns:1.05fr .95fr;gap:14px}
@media (max-width:760px){.pl-analyze{grid-template-columns:1fr}}
.pl-report{border-radius:11px;border:1px solid var(--pl-line);background:color-mix(in srgb,var(--dsw-alias-bg-base) 30%,transparent);
  padding:11px;display:flex;flex-direction:column;gap:8px;min-height:200px}
.pl-report-row{display:flex;gap:8px;font-size:10.5px;line-height:1.5}
.pl-report-k{flex:0 0 64px;color:var(--pl-dim);font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;padding-top:1px}
.pl-report-v{flex:1;min-width:0;color:var(--pl-text);word-break:break-word}
.pl-report-tags{display:flex;flex-wrap:wrap;gap:4px}
.pl-discover{display:flex;flex-direction:column;gap:18px}
.pl-discover-section{display:flex;flex-direction:column;gap:7px}
.pl-discover-head{display:flex;align-items:baseline;gap:8px;padding-bottom:3px;border-bottom:1px solid var(--pl-line)}
.pl-discover-head b{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--pl-text)}
.pl-discover-head span{font-size:9.5px;color:var(--pl-dim)}
.pl-discover-row{display:flex;align-items:flex-start;gap:12px;padding:9px 10px;border:1px solid var(--pl-line);
  border-radius:8px;background:color-mix(in srgb,var(--dsw-alias-bg-base) 28%,transparent)}
.pl-discover-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
.pl-discover-title{font-size:11.5px;font-weight:600;line-height:1.35;color:var(--pl-text);word-break:break-word}
.pl-discover-meta{font-size:9px;color:var(--pl-dim);line-height:1.4}
.pl-discover-sub{font-size:10px;line-height:1.5;color:color-mix(in srgb,var(--pl-text) 72%,var(--pl-dim));display:-webkit-box;
  -webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.pl-discover-badge{display:inline-block;margin-left:6px;padding:1px 5px;border-radius:4px;font-size:8px;font-weight:600;
  color:var(--pl-cyan);border:1px solid color-mix(in srgb,var(--pl-cyan) 38%,transparent);vertical-align:1px}
.pl-discover-tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:2px}
.pl-discover .pl-btn{flex:0 0 auto;margin-top:1px}
@media (max-width:620px){.pl-discover-row{flex-direction:column}.pl-discover .pl-btn{align-self:flex-end}}
.pl-spinner{width:12px;height:12px;border-radius:50%;border:2px solid color-mix(in srgb,var(--pl-cyan) 30%,transparent);
  border-top-color:var(--pl-cyan);animation:pl-spin .7s linear infinite;display:inline-block}
@keyframes pl-spin{to{transform:rotate(360deg)}}

/* compare */
.pl-cmp{display:flex;flex-direction:column;gap:12px}
.pl-cmp-pick{display:flex;flex-wrap:wrap;gap:6px}
.pl-cmp-chip{appearance:none;font:inherit;font-size:10.5px;height:26px;padding:0 9px;border-radius:7px;cursor:pointer;
  border:1px solid var(--pl-line);background:transparent;color:var(--pl-dim)}
.pl-cmp-chip[data-on="1"]{color:var(--pl-text);border-color:color-mix(in srgb,var(--pl-cyan) 45%,transparent);
  background:color-mix(in srgb,var(--pl-cyan) 10%,transparent)}
.pl-bars{display:flex;flex-direction:column;gap:7px;padding:4px 0}
.pl-bar-row{display:grid;grid-template-columns:150px 1fr 74px;align-items:center;gap:9px;font-size:10.5px}
.pl-bar-name{display:flex;align-items:center;gap:6px;min-width:0}
.pl-bar-name span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pl-bar-track{height:12px;border-radius:4px;background:color-mix(in srgb,var(--pl-dim) 10%,transparent);overflow:hidden;position:relative}
.pl-bar-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,var(--c,var(--pl-indigo)),color-mix(in srgb,var(--c,var(--pl-indigo)) 55%,#fff));
  box-shadow:0 0 12px color-mix(in srgb,var(--c,var(--pl-indigo)) 30%,transparent);transition:width .5s}
.pl-bar-v{text-align:right;font-variant-numeric:tabular-nums;color:var(--pl-dim)}
.pl-table{width:100%;border-collapse:collapse;font-size:10.5px}
.pl-table th,.pl-table td{text-align:left;padding:7px 8px;border-bottom:1px solid var(--pl-line)}
.pl-table th{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--pl-dim);font-weight:600}
.pl-table td{color:var(--pl-text);font-variant-numeric:tabular-nums}
.pl-table tr:last-child td{border-bottom:none}

/* calculator */
.pl-slider{display:flex;flex-direction:column;gap:4px;margin-bottom:12px}
.pl-slider-head{display:flex;justify-content:space-between;font-size:10px;color:var(--pl-dim)}
.pl-slider-head b{color:var(--pl-text);font-weight:600;font-variant-numeric:tabular-nums}
.pl-range{-webkit-appearance:none;appearance:none;width:100%;height:3px;border-radius:3px;outline:none;
  background:linear-gradient(90deg,var(--pl-cyan),var(--pl-indigo));cursor:pointer}
.pl-range::-webkit-slider-thumb{-webkit-appearance:none;width:13px;height:13px;border-radius:50%;
  background:#fff;border:2px solid var(--pl-indigo);box-shadow:0 0 10px rgba(109,140,255,.6)}
.pl-calcgrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media (max-width:760px){.pl-calcgrid{grid-template-columns:1fr}}
.pl-calcout{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.pl-calcbox{padding:10px;border-radius:9px;border:1px solid var(--pl-line);background:color-mix(in srgb,var(--dsw-alias-bg-base) 34%,transparent)}
.pl-calcbox .k{font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--pl-dim)}
.pl-calcbox .v{font-size:16px;font-weight:700;font-variant-numeric:tabular-nums;margin-top:2px}
.pl-calcbox .v small{font-size:10px;font-weight:500;color:var(--pl-dim);margin-left:3px}

/* toast */
.pl-toast{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);z-index:20;
  display:flex;align-items:center;gap:8px;padding:8px 13px;border-radius:9px;font-size:11px;
  border:1px solid color-mix(in srgb,var(--pl-green) 35%,transparent);
  background:color-mix(in srgb,var(--dsw-alias-bg-overlay) 88%,transparent);backdrop-filter:blur(10px);
  box-shadow:0 12px 30px rgba(0,0,0,.3);animation:pl-in .2s ease;max-width:80%}
.pl-toast[data-kind="err"]{border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 45%,transparent)}

@media (max-width:1180px){
  .pl-left{flex-basis:208px}
  .pl-inspector{flex-basis:320px}
  .pl-modelcard-params{font-size:9.5px}
}
@media (max-width:980px){
  .pl-inspector{flex-basis:290px}
  .pl-brand-sub{display:none}
  .pl-statgrid{grid-template-columns:1fr 1fr}
}
.pl-code{font-family:"SFMono-Regular",ui-monospace,Menlo,monospace;font-size:.88em;padding:.05em .28em;
  border-radius:4px;background:color-mix(in srgb,var(--pl-cyan) 10%,transparent);color:var(--pl-cyan)}
.pl-m-underbrace{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;margin:0 .1em}
.pl-m-underbrace-body{border-bottom:1px solid color-mix(in srgb,var(--pl-text) 55%,transparent);padding:0 .12em .16em;
  position:relative}
.pl-m-underbrace-label{font-size:.66em;line-height:1.15;padding-top:.06em;color:color-mix(in srgb,var(--pl-text) 82%,transparent)}
.pl-m-overbrace{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;margin:0 .1em}
.pl-m-overbrace-label{font-size:.66em;line-height:1.15;padding-bottom:.06em;color:color-mix(in srgb,var(--pl-text) 82%,transparent)}
.pl-m-overbrace-body{border-top:1px solid color-mix(in srgb,var(--pl-text) 55%,transparent);padding:.16em .12em 0}
.pl-m-not{position:relative}
.pl-m-not::before{content:"/";position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-68deg);
  font-size:1.25em;color:color-mix(in srgb,var(--pl-text) 70%,transparent)}

.pl-zoom-float{position:absolute;left:12px;top:12px;z-index:3;display:flex;flex-direction:column;gap:2px;
  padding:5px;border-radius:10px;border:1px solid var(--pl-line);
  background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 72%,transparent);backdrop-filter:blur(10px);
  align-items:center}
.pl-zoom-float .pl-iconbtn{width:24px;height:24px;border-radius:6px}
.pl-zoom-pct{font-size:8.5px;color:var(--pl-dim);font-variant-numeric:tabular-nums;padding:1px 0 2px;line-height:1}

.pl-statstrip{flex:0 0 34px;display:flex;align-items:center;gap:14px;padding:0 14px;
  border-top:1px solid color-mix(in srgb,var(--pl-line) 65%,transparent);
  background:color-mix(in srgb,var(--dsw-alias-bg-base) 42%,transparent);
  font-size:9.5px;color:var(--pl-dim);font-variant-numeric:tabular-nums;letter-spacing:.02em;
  white-space:nowrap;overflow:hidden}
.pl-statstrip span{display:inline-flex;align-items:center;gap:4px}
.pl-statstrip span::before{content:"";width:3px;height:3px;border-radius:50%;background:color-mix(in srgb,var(--pl-cyan) 60%,transparent)}
.pl-statstrip span:first-child::before{display:none}


/* --------------------------------------------------------------- 3D layer deck */
.pl-l3-root{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;position:relative;
  background:radial-gradient(ellipse at 48% 38%,color-mix(in srgb,var(--pl-indigo) 13%,transparent),transparent 62%),
  linear-gradient(180deg,color-mix(in srgb,var(--dsw-alias-bg-base) 42%,transparent),transparent)}
.pl-l3-bar{flex:0 0 36px;display:flex;align-items:center;gap:8px;padding:0 10px;border-bottom:1px solid var(--pl-line);
  background:color-mix(in srgb,var(--dsw-alias-bg-base) 54%,transparent);overflow:hidden}
.pl-l3-bar-k{font-size:8.5px;letter-spacing:.17em;color:var(--pl-dim);white-space:nowrap}
.pl-l3-bar-l{font:600 11px "SFMono-Regular",ui-monospace,Menlo,monospace;color:var(--pl-text);white-space:nowrap}
.pl-l3-bar-v{font-size:8px;letter-spacing:.08em;padding:2px 6px;border-radius:4px;white-space:nowrap;
  color:color-mix(in srgb,var(--pl-cyan) 82%,var(--pl-text));background:color-mix(in srgb,var(--pl-cyan) 10%,transparent);
  border:1px solid color-mix(in srgb,var(--pl-cyan) 22%,transparent)}
.pl-l3-bar-shape,.pl-l3-bar-kv{font:8.5px "SFMono-Regular",ui-monospace,Menlo,monospace;color:var(--pl-dim);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px}
.pl-l3-bar-kv{color:color-mix(in srgb,var(--pl-cyan) 55%,var(--pl-dim))}
.pl-l3-bar-sp{flex:1}
.pl-l3-bar .pl-iconbtn{width:25px;height:25px;border-radius:6px}
.pl-l3-stage{position:relative;flex:1 1 auto;min-height:0;overflow:hidden;outline:none;
  perspective:2200px;perspective-origin:50% 47%;cursor:grab;
  background:radial-gradient(ellipse at 50% 45%,color-mix(in srgb,var(--pl-cyan) 7%,transparent),transparent 58%)}
.pl-l3-stage::after{content:"";position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(90deg,color-mix(in srgb,var(--dsw-alias-bg-base) 26%,transparent),transparent 18%,transparent 82%,color-mix(in srgb,var(--dsw-alias-bg-base) 26%,transparent))}
.pl-l3-stage:focus-visible{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--pl-cyan) 34%,transparent)}
.pl-l3-stage[data-panning="1"]{cursor:grabbing}
.pl-l3-stage[data-panning="1"] .pl-l3-world{transition:none}
.pl-l3-stage[data-panning="1"] .pl-l3-card{transition:none}
.pl-l3-world{position:absolute;left:50%;top:46%;width:0;height:0;transform-style:preserve-3d;
  transition:transform .4s cubic-bezier(.2,.8,.2,1)}
.pl-l3-floor{position:absolute;left:0;top:0;width:1400px;height:920px;margin-left:-700px;margin-top:-460px;
  transform:translateY(245px) rotateX(90deg);
  background-image:linear-gradient(rgba(96,160,255,.16) 1px,transparent 1px),linear-gradient(90deg,rgba(96,160,255,.16) 1px,transparent 1px);
  background-size:46px 46px;opacity:.34;
  -webkit-mask-image:radial-gradient(ellipse at center,#000 8%,transparent 68%);
  mask-image:radial-gradient(ellipse at center,#000 8%,transparent 68%);pointer-events:none}
.pl-l3-spine{position:absolute;left:0;top:0;width:2px;margin-left:-1px;border-radius:2px;pointer-events:none;
  background:linear-gradient(180deg,transparent,color-mix(in srgb,var(--pl-cyan) 42%,transparent) 20%,color-mix(in srgb,var(--pl-indigo) 52%,transparent) 80%,transparent);
  transform:translateZ(-46px);opacity:.55;overflow:hidden}
.pl-l3-spine::after{content:"";position:absolute;left:-2px;top:-80px;width:6px;height:70px;border-radius:3px;
  background:linear-gradient(180deg,transparent,var(--pl-cyan),transparent);opacity:0}
.pl-l3-root[data-flow="1"] .pl-l3-spine::after{opacity:.8;animation:pl-l3-flow 3.4s linear infinite}
@keyframes pl-l3-flow{0%{top:-80px}100%{top:110%}}
.pl-l3-card{position:absolute;left:0;top:0;margin-left:0;margin-top:0;display:flex;flex-direction:column;gap:3px;
  padding:7px 9px 7px 11px;text-align:left;color:var(--pl-text);font:inherit;cursor:pointer;
  border:1px solid color-mix(in srgb,var(--kind) 28%,var(--pl-line));border-radius:11px;
  background:linear-gradient(135deg,color-mix(in srgb,var(--dsw-alias-bg-layer-2) 72%,transparent),color-mix(in srgb,var(--dsw-alias-bg-base) 58%,transparent));
  box-shadow:0 10px 26px rgba(0,0,0,.26),inset 0 1px 0 color-mix(in srgb,var(--kind) 16%,transparent);
  transform-style:preserve-3d;transition:transform .48s cubic-bezier(.2,.8,.2,1),opacity .25s,border-color .25s,box-shadow .25s;
  opacity:.62;overflow:hidden;pointer-events:auto}
.pl-l3-card::before{content:"";position:absolute;left:0;top:8px;bottom:8px;width:2.5px;border-radius:2px;background:var(--kind);opacity:.8}
.pl-l3-card::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;
  background:linear-gradient(120deg,color-mix(in srgb,var(--kind) 8%,transparent),transparent 42%)}
.pl-l3-card:hover{opacity:.94;border-color:color-mix(in srgb,var(--kind) 55%,var(--pl-line))}
.pl-l3-card[data-active="1"]{opacity:1;border-color:color-mix(in srgb,var(--kind) 78%,var(--pl-line));
  box-shadow:0 24px 60px rgba(0,0,0,.42),0 0 0 1px color-mix(in srgb,var(--kind) 36%,transparent),0 0 34px color-mix(in srgb,var(--kind) 22%,transparent);
  background:linear-gradient(135deg,color-mix(in srgb,var(--kind) 16%,var(--dsw-alias-bg-layer-2)),color-mix(in srgb,var(--dsw-alias-bg-base) 68%,transparent))}
.pl-l3-card[data-endpoint="1"]{border-radius:9px}
.pl-l3-card-top{display:flex;align-items:center;gap:6px;min-width:0}
.pl-l3-card-top b{font:700 11px "SFMono-Regular",ui-monospace,Menlo,monospace;letter-spacing:.03em;color:color-mix(in srgb,var(--kind) 82%,var(--pl-text));white-space:nowrap}
.pl-l3-badge{font-size:7.5px;letter-spacing:.08em;padding:1px 4px;border-radius:3px;white-space:nowrap;
  color:color-mix(in srgb,var(--kind) 86%,var(--pl-text));background:color-mix(in srgb,var(--kind) 9%,transparent);
  border:1px solid color-mix(in srgb,var(--kind) 20%,transparent);overflow:hidden;text-overflow:ellipsis;max-width:92px}
.pl-l3-count{margin-left:auto;font:8px "SFMono-Regular",ui-monospace,Menlo,monospace;color:var(--pl-dim);opacity:.8}
.pl-l3-name{font-size:10px;font-weight:600;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  color:color-mix(in srgb,var(--pl-text) 88%,var(--pl-dim))}
.pl-l3-mini{display:flex;gap:3px;height:4px;margin:1px 0 0;flex:0 0 auto}
.pl-l3-mini i{flex:1;border-radius:2px;opacity:.62;min-width:3px}
.pl-l3-card[data-active="1"] .pl-l3-mini i{opacity:.92}
.pl-l3-meta{display:flex;align-items:center;gap:8px;margin-top:auto;min-width:0;font-size:8px;color:var(--pl-dim)}
.pl-l3-meta code{font:8.5px "SFMono-Regular",ui-monospace,Menlo,monospace;color:color-mix(in srgb,var(--pl-cyan) 72%,var(--pl-text));
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:68%}
.pl-l3-meta span{margin-left:auto;white-space:nowrap;opacity:.82;font-size:7.5px}

.pl-l3-rail{position:absolute;left:7px;top:14px;bottom:52px;width:20px;display:flex;flex-direction:column;align-items:center;
  z-index:4;opacity:.8;pointer-events:auto}
.pl-l3-rail-cap{font:7.5px "SFMono-Regular",ui-monospace,Menlo,monospace;color:var(--pl-dim);opacity:.8}
.pl-l3-rail-track{position:relative;flex:1;width:100%;margin:7px 0;cursor:pointer;outline:none}
.pl-l3-tick{position:absolute;left:50%;width:18px;height:9px;transform:translate(-50%,-50%);padding:0;border:0;
  background:transparent;cursor:pointer;pointer-events:none}
.pl-l3-tick::after{content:"";position:absolute;left:50%;top:50%;width:8px;height:1px;transform:translate(-50%,-50%);
  border-radius:2px;background:var(--pl-line-2);opacity:.75;transition:.15s}
.pl-l3-tick:hover::after{width:14px;height:2px;background:var(--pl-cyan);opacity:1}
.pl-l3-tick[data-on="1"]::after{width:17px;height:2px;background:var(--pl-cyan);opacity:1;box-shadow:0 0 7px var(--pl-cyan)}

.pl-l3-scrub{position:absolute;left:50%;bottom:11px;transform:translateX(-50%);z-index:5;display:flex;align-items:center;gap:7px;
  padding:5px 9px;border-radius:99px;border:1px solid var(--pl-line);
  background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 82%,transparent);backdrop-filter:blur(12px);
  box-shadow:0 12px 30px rgba(0,0,0,.28);pointer-events:auto}
.pl-l3-step{appearance:none;width:20px;height:20px;border-radius:50%;border:1px solid var(--pl-line);display:grid;place-items:center;
  background:transparent;color:var(--pl-dim);cursor:pointer;padding:0}
.pl-l3-step:hover:not(:disabled){color:var(--pl-cyan);border-color:color-mix(in srgb,var(--pl-cyan) 45%,var(--pl-line))}
.pl-l3-step:disabled{opacity:.32;cursor:not-allowed}
.pl-l3-scrub input[type="range"]{width:clamp(120px,22vw,280px);height:14px;accent-color:var(--pl-cyan);cursor:pointer;background:transparent}
.pl-l3-scrub b{font:600 9.5px "SFMono-Regular",ui-monospace,Menlo,monospace;color:var(--pl-text);min-width:46px;text-align:center;white-space:nowrap}
.pl-l3-scrub b em{font-style:normal;color:var(--pl-dim);font-weight:400}
.pl-l3-hint{position:absolute;left:34px;bottom:14px;z-index:3;display:flex;align-items:center;gap:5px;font-size:8.5px;color:var(--pl-dim);opacity:.66;pointer-events:none;white-space:nowrap}

/* layer blueprint drawer */
.pl-l3-drawer{flex:0 0 192px;min-height:0;display:flex;flex-direction:column;border-top:1px solid var(--pl-line);
  background:linear-gradient(180deg,color-mix(in srgb,var(--dsw-alias-bg-layer-1) 56%,transparent),color-mix(in srgb,var(--dsw-alias-bg-base) 48%,transparent))}
.pl-l3-root[data-drawer="0"] .pl-l3-drawer{display:none}
.pl-bp-head{flex:0 0 37px;display:flex;align-items:center;gap:8px;padding:0 11px;border-bottom:1px solid color-mix(in srgb,var(--pl-line) 70%,transparent);overflow:hidden}
.pl-bp-layer{font:700 14px "SFMono-Regular",ui-monospace,Menlo,monospace;color:var(--pl-cyan);white-space:nowrap}
.pl-bp-badge{font-size:8px;letter-spacing:.08em;padding:2px 6px;border-radius:4px;white-space:nowrap;
  color:color-mix(in srgb,var(--pl-cyan) 82%,var(--pl-text));background:color-mix(in srgb,var(--pl-cyan) 9%,transparent);
  border:1px solid color-mix(in srgb,var(--pl-cyan) 20%,transparent)}
.pl-bp-title{font-size:9.5px;color:var(--pl-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.pl-bp-kv{font:8.5px "SFMono-Regular",ui-monospace,Menlo,monospace;color:color-mix(in srgb,var(--pl-cyan) 52%,var(--pl-dim));white-space:nowrap}
.pl-bp-headsp{flex:1}
.pl-bp-toggle{appearance:none;width:22px;height:22px;border-radius:6px;border:1px solid var(--pl-line);display:grid;place-items:center;
  background:transparent;color:var(--pl-dim);cursor:pointer;transform:rotate(180deg)}
.pl-bp-toggle:hover{color:var(--pl-cyan);border-color:color-mix(in srgb,var(--pl-cyan) 40%,var(--pl-line))}
.pl-bp-flow{flex:1;min-height:0;display:flex;align-items:center;gap:0;padding:8px 11px;overflow-x:auto;overflow-y:hidden;scrollbar-width:thin}
.pl-bp-node{position:relative;flex:0 0 106px;height:128px;display:flex;flex-direction:column;gap:4px;padding:9px 9px 8px 11px;
  text-align:left;border-radius:9px;border:1px solid color-mix(in srgb,var(--kind) 26%,var(--pl-line));
  background:linear-gradient(145deg,color-mix(in srgb,var(--dsw-alias-bg-layer-2) 64%,transparent),color-mix(in srgb,var(--dsw-alias-bg-base) 52%,transparent));
  color:var(--pl-text);font:inherit;cursor:pointer;overflow:hidden;transition:.16s}
.pl-bp-node::before{content:"";position:absolute;left:0;top:7px;bottom:7px;width:2px;border-radius:2px;background:var(--kind);opacity:.75}
.pl-bp-node:hover{border-color:color-mix(in srgb,var(--kind) 55%,var(--pl-line));transform:translateY(-1px)}
.pl-bp-node[data-selected="1"]{border-color:color-mix(in srgb,var(--kind) 82%,var(--pl-line));
  box-shadow:0 0 0 1px color-mix(in srgb,var(--kind) 30%,transparent),0 8px 20px rgba(0,0,0,.25);
  background:linear-gradient(145deg,color-mix(in srgb,var(--kind) 13%,var(--dsw-alias-bg-layer-2)),color-mix(in srgb,var(--dsw-alias-bg-base) 55%,transparent))}
.pl-bp-kind{display:flex;align-items:center;gap:4px;font-size:7.5px;letter-spacing:.1em;color:color-mix(in srgb,var(--kind) 78%,var(--pl-dim));text-transform:uppercase}
.pl-bp-name{font-size:10.5px;font-weight:620;line-height:1.15;white-space:normal;padding-right:8px;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;max-height:2.3em}
.pl-bp-shape{font:8.5px/1.3 "SFMono-Regular",ui-monospace,Menlo,monospace;color:color-mix(in srgb,var(--pl-cyan) 80%,var(--pl-text));
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:color-mix(in srgb,var(--pl-cyan) 6%,transparent);
  border-radius:3px;padding:2px 4px;margin-right:2px}
.pl-bp-detail{font:7.5px/1.25 "SFMono-Regular",ui-monospace,Menlo,monospace;color:var(--pl-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:.7}
.pl-bp-sub{font-size:8.5px;line-height:1.45;color:color-mix(in srgb,var(--pl-text) 62%,var(--pl-dim));
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.pl-bp-f{position:absolute;right:7px;top:6px;font:italic 11px Georgia,serif;color:var(--pl-cyan);opacity:.8}
.pl-bp-arrow{flex:0 0 11px;display:grid;place-items:center;color:var(--pl-line-2);opacity:.7}
.pl-bp-endpoint{flex:1;min-height:0;display:flex;align-items:center;gap:14px;padding:10px 14px;overflow:auto}
.pl-bp-endpoint .pl-bp-node{flex:0 0 250px;height:126px}
.pl-bp-desc{min-width:0;max-width:560px}
.pl-bp-desc p{margin:0 0 6px;font-size:9.5px;line-height:1.75;color:color-mix(in srgb,var(--pl-text) 72%,var(--pl-dim))}
.pl-bp-desc code{font:8.5px "SFMono-Regular",ui-monospace,Menlo,monospace;color:var(--pl-cyan)}
.pl-layerpill{font-size:8.5px;letter-spacing:.08em;color:var(--pl-dim);padding:3px 8px;border-radius:99px;
  border:1px solid var(--pl-line);background:color-mix(in srgb,var(--dsw-alias-bg-base) 34%,transparent);white-space:nowrap}

@media (max-width:1180px){
  .pl-l3-bar-shape{display:none}
  .pl-l3-rail{display:none}
  .pl-l3-hint{left:12px}
}
@media (max-width:900px){
  .pl-l3-hint{display:none}
  .pl-l3-drawer{flex-basis:172px}
  .pl-bp-node{flex-basis:104px;height:112px}
  .pl-bp-title{display:none}
  .pl-l3-bar-k{display:none}
}

@media (prefers-reduced-motion:reduce){
  .pl-edge-hot{animation:none}
  .pl-root::before{animation:none}
  .pl-node,.pl-modelcard,.pl-pill,.pl-l3-card,.pl-l3-world{transition:none}
  .pl-l3-root[data-flow="1"] .pl-l3-spine::after{animation:none}
}

/* --------------------------------------------------------- 3D layer scene */
.pl-s3-root{background:
  radial-gradient(ellipse at 50% 45%,color-mix(in srgb,var(--pl-cyan) 9%,transparent),transparent 58%),
  linear-gradient(180deg,color-mix(in srgb,var(--dsw-alias-bg-base) 38%,transparent),transparent);
  overflow:hidden}
.pl-s3-stage{position:relative;flex:1 1 auto;min-height:0;overflow:hidden;outline:none;cursor:grab;
  background:
    radial-gradient(ellipse at 50% 56%,rgba(56,189,248,.055),transparent 62%),
    radial-gradient(ellipse at 18% 28%,rgba(167,139,250,.045),transparent 55%),
    linear-gradient(180deg,rgba(8,13,22,.32),rgba(8,13,22,.06))}
.pl-s3-stage::before{content:"";position:absolute;inset:0;pointer-events:none;z-index:0;
  background-image:linear-gradient(rgba(125,211,252,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(125,211,252,.035) 1px,transparent 1px);
  background-size:44px 44px;
  mask-image:radial-gradient(ellipse at 50% 50%,#000 0%,transparent 72%)}
.pl-s3-stage::after{content:"";position:absolute;inset:0;pointer-events:none;z-index:2;
  box-shadow:inset 0 0 110px 30px color-mix(in srgb,var(--dsw-alias-bg-base) 78%,transparent),
  inset 0 0 0 1px color-mix(in srgb,var(--pl-cyan) 9%,transparent)}
.pl-s3-stage:focus-visible{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--pl-cyan) 40%,transparent)}
.pl-s3-stage[data-panning="1"]{cursor:grabbing}
.pl-s3-canvas{position:absolute;inset:0;z-index:1}
.pl-s3-canvas canvas{display:block;width:100%!important;height:100%!important;outline:none}
.pl-s3-root[data-fallback="1"] .pl-s3-canvas{display:none}
.pl-s3-labels{position:absolute;inset:0;z-index:3;pointer-events:none;overflow:hidden}
.pl-s3-leader{position:absolute;left:0;top:0;height:1px;transform-origin:0 50%;pointer-events:none;z-index:0;
  background:linear-gradient(90deg,rgba(125,211,252,.04),rgba(125,211,252,.55));opacity:0}
.pl-s3-leader[data-selected="1"]{height:2px;background:linear-gradient(90deg,rgba(125,211,252,.12),rgba(125,211,252,.9));
  box-shadow:0 0 8px rgba(34,211,238,.45)}
.pl-s3-label{position:absolute;left:0;top:0;display:flex;flex-direction:column;gap:2px;max-width:132px;
  padding:4px 6px;border-radius:6px;opacity:0;will-change:transform;
  background:color-mix(in srgb,var(--dsw-alias-bg-base) 84%,transparent);
  border:1px solid color-mix(in srgb,var(--pl-line) 84%,transparent);
  box-shadow:0 4px 14px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.045);
  backdrop-filter:blur(6px);transition:opacity .16s,border-color .2s,box-shadow .2s;
  pointer-events:auto;cursor:pointer}
.pl-s3-label b{font-size:9px;font-weight:620;line-height:1.15;color:var(--pl-text);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:.005em}
.pl-s3-label code{font:8px "SFMono-Regular",ui-monospace,Menlo,monospace;line-height:1.15;color:var(--pl-dim);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:120px}
.pl-s3-label[data-selected="1"]{z-index:6;border-color:color-mix(in srgb,var(--pl-cyan) 72%,transparent);
  box-shadow:0 0 0 1px color-mix(in srgb,var(--pl-cyan) 28%,transparent),0 8px 24px rgba(0,0,0,.42)}
.pl-s3-label[data-selected="1"] b{color:color-mix(in srgb,var(--pl-cyan) 82%,var(--pl-text))}
.pl-s3-root[data-labels="0"] .pl-s3-label,
.pl-s3-root[data-labels="0"] .pl-s3-leader{display:none}
.pl-s3-legend{position:absolute;left:36px;top:11px;z-index:3;pointer-events:none;display:flex;align-items:center;gap:9px;
  padding:4px 7px;border-radius:6px;background:color-mix(in srgb,var(--dsw-alias-bg-base) 46%,transparent);
  border:1px solid color-mix(in srgb,var(--pl-line) 52%,transparent);backdrop-filter:blur(5px)}
.pl-s3-legend span{display:inline-flex;align-items:center;gap:4px;white-space:nowrap}
.pl-s3-legend i{width:5px;height:5px;border-radius:50%;box-shadow:0 0 7px currentColor}
.pl-s3-legend b{font-size:7.5px;font-weight:500;color:var(--pl-dim);letter-spacing:.02em}
.pl-s3-stage .pl-l3-rail{z-index:5}
.pl-s3-stage .pl-l3-scrub{z-index:6}
.pl-s3-stage .pl-l3-hint{z-index:4}
.pl-s3-fallback{position:absolute;inset:44px 18px 52px 34px;z-index:4;overflow:auto;
  display:flex;flex-direction:column;gap:10px;padding:12px;border-radius:8px;
  background:color-mix(in srgb,var(--dsw-alias-bg-base) 78%,transparent);border:1px solid var(--pl-line)}
.pl-s3-fallback>b{font-size:11px;color:var(--pl-text)}
.pl-s3-fallback>p{margin:0;font-size:9.5px;line-height:1.5;color:var(--pl-dim)}
.pl-s3-fallback-flow{display:flex;flex-wrap:wrap;gap:7px}
.pl-s3-fallback-flow .pl-bp-node{flex:0 0 128px}
.pl-s3-fallback-flow .pl-bp-arrow{display:none}

@media (max-width:1180px){
  .pl-s3-legend{left:12px;top:8px;gap:6px;padding:3px 6px}
  .pl-s3-legend b{display:none}
  .pl-s3-label{max-width:128px;padding:3px 5px}
  .pl-s3-label code{max-width:118px}
}
@media (max-width:900px){
  .pl-s3-legend{display:none}
  .pl-s3-label{max-width:108px}
  .pl-s3-label code{display:none}
  .pl-s3-fallback{inset:40px 10px 48px 10px}
}
`;
