// How large is each image file actually drawn? Plays one fixed-seed mission (muted, headless,
// 1920x1080, devicePixelRatio 1), kills every enemy so corpses show, then sweeps the camera over
// the whole world with the sim paused. Every drawImage on any 2D context is recorded:
// scale = destination device px / source px (includes zoom, render transform and the baked
// unit-outline bitmaps, which UnitSpriteFx keeps in source pixels).
// A source drawn at max scale s needs ~s x its size at DPR 1 and ~2s x on a 200%-scaled 4K
// screen (render scale <= 1), so files with 2s well under 1 are bigger than they ever look.
// Usage: node sprite_scale.mjs <url> <profileDir> <out.json>
// Env: PHASE (default 0), MISSION (default 0), SEED (default 424242), PORT (default 9370),
//      LIST=<phases> prints biome + objectives of every mission in phases 0..<phases>-1 and exits
//      (each run prints its own too; generation is per seed/phase/mission, so they match).
// <out.json> is merged with what it already holds (max per file), so run several missions
// (biomes, finales with bosses, hostage missions) into one file.
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const [, , URL_, PROFILE_DIR, OUT] = process.argv;
const PHASE = Number(process.env.PHASE ?? 0), MISSION = Number(process.env.MISSION ?? 0), SEED = Number(process.env.SEED ?? 424242);
const PORT = Number(process.env.PORT ?? 9370);
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
const finish = (code) => { try { ws.close(); } catch { } chrome.kill(); process.exit(code); };

await send('Page.enable'); await send('Runtime.enable');
await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Page.addScriptToEvaluateOnNewDocument', { source: `try{const K='raccoon_platoon_preferences';const p=JSON.parse(localStorage.getItem(K)||'{}');p.masterVolume=0;localStorage.setItem(K,JSON.stringify(p));}catch(e){} HTMLMediaElement.prototype.play=function(){return Promise.resolve();};` });
await send('Page.navigate', { url: URL_ });
for (let i = 0; i < 400; i++) { if (await evalJS(`!!document.getElementById('assetLoadingScreen')?.classList.contains('hidden')`)) break; await sleep(250); }
const proto = await send('Runtime.evaluate', { expression: 'Game.prototype' });
const q = await send('Runtime.queryObjects', { prototypeObjectId: proto.result.result.objectId });
await send('Runtime.callFunctionOn', { objectId: q.result.objects.objectId, functionDeclaration: 'function(){ window.__game = this[0]; }' });

if (process.env.LIST) {
  const list = await evalJS(`(() => { const g = window.__game, out = [];
    const realNow = Date.now; Date.now = () => ${SEED}; g.initializeNewCampaign(true); Date.now = realNow;
    for (let ph = 0; ph < ${Number(process.env.LIST)}; ph++) {
      g._generatePhaseStructure(ph); const st = g.campaignStructure[ph];
      for (let m = 0; m < st.missionsInPhase; m++) {
        g.currentPhaseIndex = ph; g.currentMissionIndex = m; g.generateAndSetCurrentMissionParams(ph, m);
        const p = g.currentMissionParams || {};
        out.push(ph + '/' + m + ' ' + (p.baseParams && p.baseParams.biome) + ' ' + (p.objectives || []).map(o => o.type + (o.targetType ? ':' + o.targetType : '')).join(','));
      }
    }
    return out; })()`);
  console.log(Array.isArray(list) ? list.join('\n') : JSON.stringify(list));
  finish(0);
}

// drawImage hook on every 2D context type. Sources are keyed by the image file path; baked
// outline bitmaps are mapped back to their PNG before the sweep.
await evalJS(`(() => {
  const rec = window.__ds = new Map(), alias = window.__alias = new Map();
  const origin = location.origin + '/';
  const hook = P => { if (!P) return; const od = P.drawImage;
    P.drawImage = function (img, a, b, c, d, e, f, g, h) {
      const key = (img && img.src) ? decodeURIComponent(img.src.replace(origin, '').split('?')[0]) : alias.get(img);
      if (key) {
        const sw0 = img.naturalWidth || img.width, sh0 = img.naturalHeight || img.height;
        let sx = 1, sy = 1;
        if (arguments.length >= 9) { sx = g / c; sy = h / d; } else if (arguments.length >= 5) { sx = c / sw0; sy = d / sh0; }
        const m = this.getTransform();
        const s = Math.max(Math.abs(sx) * Math.hypot(m.a, m.b), Math.abs(sy) * Math.hypot(m.c, m.d));
        const r = rec.get(key);
        if (!r) rec.set(key, { s, n: 1 }); else { r.n++; if (s > r.s) r.s = s; }
      }
      return od.apply(this, arguments);
    }; };
  hook(CanvasRenderingContext2D.prototype); hook(window.OffscreenCanvasRenderingContext2D && OffscreenCanvasRenderingContext2D.prototype);
  return true; })()`);

const start = await evalJS(`(async () => { const g = window.__game;
  g.shouldTriggerAmbush = () => false;
  const realNow = Date.now; Date.now = () => ${SEED};
  g.initializeNewCampaign(true); g.currentPhaseIndex = ${PHASE}; g.currentMissionIndex = ${MISSION};
  g.generateAndSetCurrentMissionParams(g.currentPhaseIndex, g.currentMissionIndex);
  Date.now = realNow;
  g.confirmSquadAndStartMission(g.getAvailableRecruits().slice(0, 4));
  const p = g.currentMissionParams || {};
  return { phase: ${PHASE}, mission: ${MISSION}, biome: p.baseParams && p.baseParams.biome, objectives: (p.objectives || []).map(o => o.type) }; })()`);
let state;
for (let i = 0; i < 60; i++) { state = await evalJS(`window.__game.gameState`); if (state === 'RUNNING') break; await sleep(500); }
if (state !== 'RUNNING') { console.log(JSON.stringify({ start, state, errs })); finish(1); }
await sleep(1500);

// Kill every enemy and turret (corpses, destroyed states), let death effects play, then pause and sweep.
const sweep = await evalJS(`(async () => { const g = window.__game, sq = g.deployedSquadRoster.filter(u => u.isAlive());
  sq.forEach(u => { u.takeDamage = () => {}; });
  for (const e of g.enemyUnits) if (e.isAlive()) { try { e.takeDamage(1e9, sq[0]); } catch (err) {} }
  await new Promise(r => setTimeout(r, 2500));
  for (const [img, entry] of g.unitSpriteFx ? g.unitSpriteFx._entries : []) if (entry && entry.outline && img.src) window.__alias.set(entry.outline.image, decodeURIComponent(img.src.replace(location.origin + '/', '').split('?')[0]));
  g.gameState = 'PAUSED';
  const zoom = g.cameraZoom || 1, vw = g.viewWidth / zoom, vh = g.viewHeight / zoom; let frames = 0;
  for (let y = 0; y < CONFIG.WORLD_HEIGHT; y += vh * 0.8) for (let x = 0; x < CONFIG.WORLD_WIDTH; x += vw * 0.8) {
    g.cameraX = x; g.cameraY = y; g.render(); frames++;
  }
  return { frames, world: Math.round(CONFIG.WORLD_WIDTH) + 'x' + Math.round(CONFIG.WORLD_HEIGHT), view: Math.round(vw) + 'x' + Math.round(vh) }; })()`);

const rows = await evalJS(`(() => { const out = {}; for (const [k, v] of window.__ds) out[k] = +v.s.toFixed(4); return out; })()`);
const merged = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
for (const [k, s] of Object.entries(rows || {})) merged[k] = Math.max(merged[k] || 0, s);
writeFileSync(OUT, JSON.stringify(merged, null, 1));
console.log(JSON.stringify({ start, sweep, filesThisRun: Object.keys(rows || {}).length, filesTotal: Object.keys(merged).length, errors: errs.slice(0, 5).map(e => String(e).slice(0, 300)) }));
finish(0);
