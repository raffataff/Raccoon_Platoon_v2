// Generates mission levels without playing them and dumps the layout (obstacles with type, sprite,
// position, size, flip; nav grid hash; every positioned item the Level holds), for before/after
// diffs of changes that must not move anything (asset resizes, generator refactors).
// Usage: node layout_dump.mjs <url> <profileDir> <out.json>
// Env: COMBOS='424242:0/0,424242:3/3' (seed:phase/mission, default: 4 seeds x 8 missions), PORT (default 9390).
// Compare two dumps: node layout_dump.mjs --diff a.json b.json [tolerancePx]
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

if (process.argv[2] === '--diff') {
  const [a, b] = [JSON.parse(readFileSync(process.argv[3], 'utf8')), JSON.parse(readFileSync(process.argv[4], 'utf8'))];
  const tol = Number(process.argv[5] ?? 0);
  let same = 0; const diffs = [];
  for (const k of Object.keys(a)) {
    const x = a[k], y = b[k];
    if (!y) { diffs.push(`${k}: missing in second dump`); continue; }
    const probs = [];
    if (x.navHash !== y.navHash) probs.push('nav grid differs');
    if (x.spawns !== y.spawns) probs.push('player spawns differ');
    if (x.obstacles.length !== y.obstacles.length) probs.push(`obstacle count ${x.obstacles.length} vs ${y.obstacles.length}`);
    let maxD = 0, moved = 0;
    for (let i = 0; i < Math.min(x.obstacles.length, y.obstacles.length); i++) {
      const o = x.obstacles[i], p = y.obstacles[i];
      if (o[0] !== p[0] || o[1] !== p[1] || o[6] !== p[6]) { probs.push(`obstacle ${i}: ${o[0]} ${o[1]} vs ${p[0]} ${p[1]}`); break; }
      const d = Math.max(...[2, 3, 4, 5].map(j => Math.abs(o[j] - p[j])));
      if (d > maxD) maxD = d;
      if (d > tol) moved++;
    }
    if (moved) probs.push(`${moved} obstacles moved/resized > ${tol}px (max ${maxD.toFixed(3)})`);
    if (JSON.stringify(x.items) !== JSON.stringify(y.items)) probs.push('level items differ');
    if (probs.length) diffs.push(`${k}: ${probs.join('; ')}`); else same++;
  }
  console.log(`identical (within ${tol}px): ${same}/${Object.keys(a).length}`);
  diffs.forEach(d => console.log('  ' + d));
  process.exit(0);
}

const [, , URL_, PROFILE_DIR, OUT] = process.argv;
const PORT = Number(process.env.PORT ?? 9390);
const COMBOS = (process.env.COMBOS || ['424242', '7', '20261025', '99991'].flatMap(s => ['0/0', '1/2', '2/0', '3/3', '5/0', '6/4', '8/0', '9/3'].map(pm => `${s}:${pm}`)).join(','))
  .split(',').map(c => { const [seed, pm] = c.split(':'); const [phase, mission] = pm.split('/'); return { seed: +seed, phase: +phase, mission: +mission }; });

const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE_DIR}`, '--force-device-scale-factor=1',
  '--mute-audio', '--autoplay-policy=no-user-gesture-required', '--window-size=1920,1080', '--no-first-run', '--no-default-browser-check', 'about:blank'
], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let wsUrl;
for (let i = 0; i < 50 && !wsUrl; i++) {
  try { wsUrl = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(t => t.type === 'page')?.webSocketDebuggerUrl; } catch { }
  if (!wsUrl) await sleep(200);
}
const ws = new WebSocket(wsUrl);
await new Promise(r => ws.addEventListener('open', r));
let nextId = 1; const pending = new Map(); const errs = [];
ws.addEventListener('message', ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  else if (m.method === 'Runtime.exceptionThrown') errs.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
});
const send = (method, params = {}) => new Promise(res => { const id = nextId++; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
const evalJS = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.result?.exceptionDetails) return { __error: r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text }; return r.result?.result?.value; };

await send('Page.enable'); await send('Runtime.enable');
await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Page.addScriptToEvaluateOnNewDocument', { source: `try{const K='raccoon_platoon_preferences';const p=JSON.parse(localStorage.getItem(K)||'{}');p.masterVolume=0;localStorage.setItem(K,JSON.stringify(p));}catch(e){} HTMLMediaElement.prototype.play=function(){return Promise.resolve();};` });
await send('Page.navigate', { url: URL_ });
for (let i = 0; i < 400; i++) { if (await evalJS(`!!document.getElementById('assetLoadingScreen')?.classList.contains('hidden')`)) break; await sleep(250); }
const proto = await send('Runtime.evaluate', { expression: 'Game.prototype' });
const q = await send('Runtime.queryObjects', { prototypeObjectId: proto.result.result.objectId });
await send('Runtime.callFunctionOn', { objectId: q.result.objects.objectId, functionDeclaration: 'function(){ window.__game = this[0]; }' });

const out = {};
for (const c of COMBOS) {
  // Same world sizing and setup as Game's mission start, then only the generator runs.
  const r = await evalJS(`(() => { const g = window.__game;
    const realNow = Date.now; Date.now = () => ${c.seed};
    g.initializeNewCampaign(true); g.currentPhaseIndex = ${c.phase}; g.currentMissionIndex = ${c.mission};
    g._generatePhaseStructure(${c.phase}); g.generateAndSetCurrentMissionParams(${c.phase}, ${c.mission});
    Date.now = realNow;
    const bp = g.currentMissionParams.baseParams, AR = CONFIG.BASE_WORLD_WIDTH / CONFIG.BASE_WORLD_HEIGHT;
    let W = CONFIG.BASE_WORLD_WIDTH * (bp.worldWidthFactor || 1), H = CONFIG.BASE_WORLD_HEIGHT * (bp.worldHeightFactor || 1);
    if (g.viewWidth / g.viewHeight > AR) { H = Math.max(H, g.viewHeight); W = Math.max(W, Math.round(H * AR)); }
    else { W = Math.max(W, g.viewWidth); H = Math.max(H, Math.round(W / AR)); }
    CONFIG.WORLD_WIDTH = W; CONFIG.WORLD_HEIGHT = H;
    g.hostageUnits = []; g.intelConsoles = []; g.possumTurrets = []; g.possumAntiAirTurrets = [];
    g.spatialGrid = new SpatialGrid(W, H, g.SPATIAL_GRID_CELL_SIZE, g);
    const spawns = g.level.generateLevelAndGetPlayerSpawns(W, H, g.currentMissionParams, 4, g.preloadedImages, g.currentMissionSeed);
    const L = g.level, rd = v => Math.round(v * 1000) / 1000;
    const src = o => { const im = o.imageNormal || o.image; return im && im.src ? im.src.split('/').pop() : ''; };
    let h = 0; for (const row of L.navGrid) for (const v of row) h = (h * 31 + (v ? 1 : 0) + 7) | 0;
    const items = {};
    for (const k of Object.keys(L)) { const v = L[k];
      if (k !== 'obstacles' && k !== 'activeObstacles' && Array.isArray(v) && v.length && v[0] && typeof v[0].x === 'number')
        items[k] = v.map(o => [o.type || o.constructor.name, rd(o.x), rd(o.y)]); }
    return { biome: bp.biome, world: W + 'x' + H, navHash: h, spawns: JSON.stringify((spawns || []).map(s => [rd(s.x), rd(s.y)])),
      obstacles: L.obstacles.map(o => [o.type, src(o), rd(o.x), rd(o.y), rd(o.width), rd(o.height), !!o.isFlippedHorizontally]), items };
  })()`);
  out[`${c.seed}:${c.phase}/${c.mission}`] = r;
  if (r && r.__error) console.log(c, r.__error);
}
writeFileSync(OUT, JSON.stringify(out));
console.log(JSON.stringify({ combos: COMBOS.length, obstacles: Object.values(out).reduce((s, r) => s + (r.obstacles ? r.obstacles.length : 0), 0), errors: errs.slice(0, 5) }));
try { ws.close(); } catch { } chrome.kill(); process.exit(0);
