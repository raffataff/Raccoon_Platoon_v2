// Fixed-seed phase-N combat benchmark for before/after comparisons (muted headless Chrome).
// Env: PHASE (default 19), SEED (default 424242), SECS (default 20), PORT (default 9340),
//      DUMP_GRID=<file> to save the mission nav grid, CPU=<file> to save a CPU profile,
//      CFG / GAMEPROP / EXTRA / SHOT (see below).
// Usage: node cdp_bench.mjs <url> <profileDir>
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const [, , URL_, PROFILE_DIR] = process.argv;
const PHASE = Number(process.env.PHASE ?? 19), SEED = Number(process.env.SEED ?? 424242), SECS = Number(process.env.SECS ?? 20);
const PORT = Number(process.env.PORT ?? 9340);
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE_DIR}`,
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
  else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errs.push('console.error: ' + m.params.args.map(a => a.value ?? a.description).join(' '));
});
const send = (method, params = {}) => new Promise(res => { const id = nextId++; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
const evalJS = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.result?.exceptionDetails) return { __error: r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text }; return r.result?.result?.value; };
const finish = (code) => { try { ws.close(); } catch { } chrome.kill(); process.exit(code); };

await send('Page.enable'); await send('Runtime.enable');
await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true }); // always load the files as they are on disk now
await send('Page.addScriptToEvaluateOnNewDocument', { source: `try{const K='raccoon_platoon_preferences';const p=JSON.parse(localStorage.getItem(K)||'{}');p.masterVolume=0;localStorage.setItem(K,JSON.stringify(p));}catch(e){} HTMLMediaElement.prototype.play=function(){return Promise.resolve();};` });
await send('Page.navigate', { url: URL_ });
for (let i = 0; i < 400; i++) { if (await evalJS(`!!document.getElementById('assetLoadingScreen')?.classList.contains('hidden')`)) break; await sleep(250); }
const proto = await send('Runtime.evaluate', { expression: 'Game.prototype' });
const q = await send('Runtime.queryObjects', { prototypeObjectId: proto.result.result.objectId });
await send('Runtime.callFunctionOn', { objectId: q.result.objects.objectId, functionDeclaration: 'function(){ window.__game = this[0]; }' });

// CFG='{"PATHFINDING.ENEMY_PATH_BUDGET_MS":0}' overrides CONFIG values (dotted paths) for this run.
const cfgOverrides = process.env.CFG ? JSON.parse(process.env.CFG) : {};
await evalJS(`(() => { const o = ${JSON.stringify(cfgOverrides)}; for (const k in o) { const parts = k.split('.'); let t = CONFIG; for (let i = 0; i < parts.length - 1; i++) t = t[parts[i]]; t[parts[parts.length - 1]] = o[k]; } return true; })()`);
// GAMEPROP='{"SPATIAL_GRID_CELL_SIZE":32}' sets properties on the Game instance before the mission starts.
if (process.env.GAMEPROP) await evalJS(`Object.assign(window.__game, ${process.env.GAMEPROP}), true`);
const start = await evalJS(`(async () => { const g = window.__game;
  g.shouldTriggerAmbush = () => false; // keep the run in campaign combat
  const realNow = Date.now; Date.now = () => ${SEED};
  g.initializeNewCampaign(true); g.currentPhaseIndex = ${PHASE}; g.generateAndSetCurrentMissionParams(g.currentPhaseIndex, g.currentMissionIndex);
  Date.now = realNow;
  g.confirmSquadAndStartMission(g.getAvailableRecruits().slice(0, 4));
  return { phase: g.currentPhaseIndex, seed: g.campaignSeed }; })()`);
let state;
for (let i = 0; i < 60; i++) { state = await evalJS(`window.__game.gameState`); if (state === 'RUNNING') break; await sleep(500); }
if (state !== 'RUNNING') { console.log(JSON.stringify({ start, state, errs })); finish(1); }
await sleep(1000);

const level = await evalJS(`(() => { const g = window.__game, L = g.level;
  return { world: Math.round(CONFIG.WORLD_WIDTH) + 'x' + Math.round(CONFIG.WORLD_HEIGHT), obstacles: L.obstacles.length, enemies: g.enemyUnits.length, navGrid: L.navGrid.length + 'x' + L.navGrid[0].length,
    firstEnemy: g.enemyUnits[0] ? Math.round(g.enemyUnits[0].x) + ',' + Math.round(g.enemyUnits[0].y) : null }; })()`);
if (process.env.DUMP_GRID) {
  const grid = await evalJS(`window.__game.level.navGrid.map(r => r.join('')).join('\\n')`);
  writeFileSync(process.env.DUMP_GRID, grid);
}

// Optional: old vs new queryLine / hasLineOfSight on the live level (OLD_DIR = saved copies).
let losEquiv = null;
if (process.env.OLD_DIR) {
  const { readFileSync } = await import('node:fs');
  const oldGrid = readFileSync(process.env.OLD_DIR + '/spatialGrid.js', 'utf8');
  const oldUtils = readFileSync(process.env.OLD_DIR + '/utils.js', 'utf8');
  const losFn = oldUtils.slice(oldUtils.indexOf('function hasLineOfSight'), oldUtils.indexOf('function lineIntersectsCircle'));
  losEquiv = await evalJS(`(() => {
    const OldGrid = (function () { ${oldGrid}; return SpatialGrid; })();
    const oldLOS = (function () { ${losFn}; return hasLineOfSight; })();
    const g = window.__game, L = g.level, sg = g.spatialGrid, W = CONFIG.WORLD_WIDTH, H = CONFIG.WORLD_HEIGHT;
    let s = 99; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    let qlSame = 0, qlDiff = 0, losSame = 0, losDiff = 0, coverSame = 0, coverDiff = 0, blocked = 0;
    const units = [...g.enemyUnits, ...g.deployedSquadRoster];
    for (let i = 0; i < 4000; i++) {
      let x1, y1, x2, y2;
      if (i % 2 === 0) { const a = units[Math.floor(rnd() * units.length)], b = units[Math.floor(rnd() * units.length)]; x1 = a.x; y1 = a.y; x2 = b.x; y2 = b.y; }
      else { x1 = rnd() * W; y1 = rnd() * H; const ang = rnd() * 6.283, d = 20 + rnd() * 900; x2 = x1 + Math.cos(ang) * d; y2 = y1 + Math.sin(ang) * d; }
      const a = OldGrid.prototype.queryLine.call(sg, x1, y1, x2, y2), b = sg.queryLine(x1, y1, x2, y2);
      if (a.length === b.length && a.every((o, k) => o === b[k])) qlSame++; else qlDiff++;
      const lo = oldLOS(x1, y1, x2, y2, L.activeObstacles, L), ln = hasLineOfSight(x1, y1, x2, y2, L.activeObstacles, L);
      if (lo === ln) losSame++; else losDiff++; if (!ln) blocked++;
      const co = oldLOS(x1, y1, x2, y2, L.activeObstacles, L, true), cn = hasLineOfSight(x1, y1, x2, y2, L.activeObstacles, L, true);
      if (co === cn) coverSame++; else coverDiff++;
    }
    return { queryLine: { same: qlSame, diff: qlDiff }, hasLineOfSight: { same: losSame, diff: losDiff, blocked }, coverOnly: { same: coverSame, diff: coverDiff } };
  })()`);
}

// Combat setup (same every run): invulnerable squad heads for the nearest enemy, every enemy is alerted.
const move = await evalJS(`(() => { const g = window.__game; const sq = g.deployedSquadRoster.filter(u => u.isAlive());
  const c = sq[0]; let best = null, bd = Infinity; for (const e of g.enemyUnits) { if (!e.isAlive()) continue; const d = (e.x-c.x)**2 + (e.y-c.y)**2; if (d < bd) { bd = d; best = e; } }
  sq.forEach(u => { u.takeDamage = () => {}; u.setMoveTarget(best.x, best.y); });
  g.enemyUnits.forEach(e => { if (e.isAlive()) e.propagateAlert(sq[0]); });
  return Math.round(Math.sqrt(bd)); })()`);

await evalJS(`(() => { const g = window.__game; const st = window.__st = { u: [], f: [], last: 0, spikes: [], samples: [] };
  const fp = window.findPath; st.fp = { n: 0, ms: 0, max: 0 };
  window.findPath = function () { const t = performance.now(); const r = fp.apply(this, arguments); const d = performance.now() - t; st.fp.n++; st.fp.ms += d; if (d > st.fp.max) st.fp.max = d; return r; };
  const los = window.hasLineOfSight; st.los = { n: 0, ms: 0 };
  window.hasLineOfSight = function () { const t = performance.now(); const r = los.apply(this, arguments); st.los.n++; st.los.ms += performance.now() - t; return r; };
  if (${!!process.env.DIAG}) {
    // Who asks for paths: tally calculatePath callers (file:line of the two frames above it).
    st.callers = {}; const ocp = Unit.prototype.calculatePath;
    Unit.prototype.calculatePath = function () { const lines = new Error().stack.split('\\n').slice(2, 5).map(l => (l.match(/js\\/([\\w\\/]+\\.js):(\\d+)/) || [, '?', ''])[1] + ':' + (l.match(/js\\/[\\w\\/]+\\.js:(\\d+)/) || [, ''])[1]);
      const k = (this.team || '?') + ' ' + lines.join(' < '); st.callers[k] = (st.callers[k] || 0) + 1; return ocp.apply(this, arguments); };
    st.served = 0; const osq = g._serveQueuedEnemyPaths ? g._serveQueuedEnemyPaths.bind(g) : null;
    st.deferred = 0; const odr = g.deferEnemyPathRequest ? g.deferEnemyPathRequest.bind(g) : null;
    if (odr) g.deferEnemyPathRequest = (u, x, y, e) => { const r = odr(u, x, y, e); if (r) st.deferred++; return r; };
  }
  const ou = g.update.bind(g), orr = g.render.bind(g);
  g.update = (dt) => { const t = performance.now(), n0 = st.fp.n, ms0 = st.fp.ms; ou(dt); const d = performance.now() - t; st.u.push(d);
    if (d > 50) st.spikes.push({ ms: Math.round(d), paths: st.fp.n - n0, pathMs: Math.round(st.fp.ms - ms0) }); };
  st.r = []; g.render = () => { const t = performance.now(); orr(); st.r.push(performance.now() - t); if (st.last) st.f.push(t - st.last); st.last = t; };
  // Once a second: how many enemies are moving / shooting (catches AI that stalls waiting for paths).
  st.iv = setInterval(() => { let mv = 0, sh = 0, ch = 0; for (const e of g.enemyUnits) { if (!e.isAlive()) continue; if (e.isMoving) mv++; if (/SHOOTING/.test(e.aiState)) sh++; if (/CHASING/.test(e.aiState)) ch++; } st.samples.push([mv, ch, sh, g._enemyPathQueue ? g._enemyPathQueue.length : 0]); }, 1000);
  // Average distance from alive enemies to the squad leader, start vs end (did they close in?).
  st.dist = () => { const c = g.deployedSquadRoster[0]; let s = 0, n = 0; for (const e of g.enemyUnits) if (e.isAlive()) { s += Math.hypot(e.x - c.x, e.y - c.y); n++; } return Math.round(s / Math.max(1, n)); };
  st.dist0 = st.dist();
  return true; })()`);
// EXTRA=<file.js>: extra instrumentation evaluated after setup (window.__game is the game); define
// window.__extraResult = () => value to have it reported as "extra" in the output.
if (process.env.EXTRA) { const r = await evalJS((await import('node:fs')).readFileSync(process.env.EXTRA, 'utf8')); if (r && r.__error) errs.push('EXTRA: ' + r.__error); }
if (process.env.CPU) { await send('Profiler.enable'); await send('Profiler.setSamplingInterval', { interval: 250 }); await send('Profiler.start'); }
await sleep(SECS * 1000);
if (process.env.CPU) writeFileSync(process.env.CPU, JSON.stringify((await send('Profiler.stop')).result.profile));
// SHOT=<file.png>: screenshot of the page at the end of the run.
if (process.env.SHOT) writeFileSync(process.env.SHOT, Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).result.data, 'base64'));

const out = await evalJS(`(() => { const st = window.__st, g = window.__game; clearInterval(st.iv);
  const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return +(s[Math.min(s.length - 1, Math.floor(s.length * p))] || 0).toFixed(1); };
  const avg = a => +(a.reduce((x, y) => x + y, 0) / Math.max(1, a.length)).toFixed(2);
  const sumCol = i => st.samples.reduce((s, r) => s + r[i], 0);
  return {
    frames: st.f.length, frameAvg: avg(st.f), frameP99: pct(st.f, 0.99), frameMax: pct(st.f, 1), framesOver33ms: st.f.filter(x => x > 33.4).length,
    updateAvg: avg(st.u), updateP95: pct(st.u, 0.95), updateP99: pct(st.u, 0.99), updateMax: pct(st.u, 1),
    renderAvg: avg(st.r), renderP95: pct(st.r, 0.95), renderP99: pct(st.r, 0.99), renderMax: pct(st.r, 1),
    spikesOver50ms: st.spikes.length, worstSpikes: st.spikes.sort((a, b) => b.ms - a.ms).slice(0, 4),
    findPath: { calls: st.fp.n, totalMs: Math.round(st.fp.ms), avgMs: +(st.fp.ms / Math.max(1, st.fp.n)).toFixed(2), maxMs: +st.fp.max.toFixed(1) },
    los: { calls: st.los.n, perFrame: Math.round(st.los.n / Math.max(1, st.f.length)), totalMs: Math.round(st.los.ms) },
    ai: { avgMoving: +(sumCol(0) / st.samples.length).toFixed(1), avgChasing: +(sumCol(1) / st.samples.length).toFixed(1), avgShooting: +(sumCol(2) / st.samples.length).toFixed(1),
          avgQueue: +(sumCol(3) / st.samples.length).toFixed(1), maxQueue: Math.max(...st.samples.map(r => r[3])), meanDistToSquad: st.dist0 + ' -> ' + st.dist() },
    callers: st.callers ? Object.entries(st.callers).sort((a, b) => b[1] - a[1]).slice(0, 12) : undefined, deferredCalls: st.deferred,
    enemiesKilled: g.enemyUnits.filter(e => !e.isAlive()).length, pathQueue: g._enemyPathQueue ? g._enemyPathQueue.length : null,
    heapMB: performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null, state: g.gameState,
    extra: window.__extraResult ? window.__extraResult() : undefined };
})()`);
console.log(JSON.stringify({ start, level, losEquiv, squadToEnemyPx: move, ...out, errors: errs.slice(0, 10).map(e => String(e).slice(0, 300)) }, null, 1));
finish(0);
