// Boot-profiles Raccoon Platoon in headless Chrome over CDP (muted, throwaway profile).
// Usage: node cdp_boot.mjs <url> <profileDir> [cpuProfileOut]
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const [, , URL_, PROFILE_DIR, CPU_OUT] = process.argv;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9333;

const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE_DIR}`,
  '--mute-audio', '--autoplay-policy=no-user-gesture-required', '--window-size=1920,1080',
  '--no-first-run', '--no-default-browser-check', 'about:blank'
], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));
let wsUrl;
for (let i = 0; i < 50 && !wsUrl; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    wsUrl = list.find(t => t.type === 'page')?.webSocketDebuggerUrl;
  } catch { }
  if (!wsUrl) await sleep(200);
}
const ws = new WebSocket(wsUrl);
await new Promise(r => ws.addEventListener('open', r));
let nextId = 1; const pending = new Map(); const listeners = [];
ws.addEventListener('message', ev => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  else if (msg.method) listeners.forEach(l => l(msg));
});
const send = (method, params = {}) => new Promise(res => { const id = nextId++; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
const evalJS = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.result?.value;

// Network accounting
const reqs = new Map(); let firstReq = null;
listeners.push(m => {
  if (m.method === 'Network.requestWillBeSent') { reqs.set(m.params.requestId, { url: m.params.request.url, t0: m.params.timestamp }); if (firstReq === null) firstReq = m.params.timestamp; }
  if (m.method === 'Network.responseReceived') { const r = reqs.get(m.params.requestId); if (r) r.type = m.params.type; }
  if (m.method === 'Network.loadingFinished') { const r = reqs.get(m.params.requestId); if (r) { r.bytes = m.params.encodedDataLength; r.t1 = m.params.timestamp; } }
});
await send('Network.enable', { maxTotalBufferSize: 0 });
await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Page.enable');
await send('Runtime.enable');
// Mute via the game's own preference before any game script runs.
await send('Page.addScriptToEvaluateOnNewDocument', { source: `try{const K='raccoon_platoon_preferences';const p=JSON.parse(localStorage.getItem(K)||'{}');p.masterVolume=0;localStorage.setItem(K,JSON.stringify(p));}catch(e){}` });

if (CPU_OUT) { await send('Profiler.enable'); await send('Profiler.setSamplingInterval', { interval: 200 }); await send('Profiler.start'); }
const tNav = Date.now();
await send('Page.navigate', { url: URL_ });

// Wait for the loading screen to hide (main menu shown).
let bootMs = null;
for (let i = 0; i < 600; i++) {
  const hidden = await evalJS(`(() => { const el = document.getElementById('assetLoadingScreen'); return !!(el && el.classList.contains('hidden')); })()`);
  if (hidden) { bootMs = Date.now() - tNav; break; }
  await sleep(250);
}
if (CPU_OUT) { const prof = await send('Profiler.stop'); writeFileSync(CPU_OUT, JSON.stringify(prof.result.profile)); }

// Inspect the live Game instance via queryObjects.
const proto = await send('Runtime.evaluate', { expression: 'Game.prototype' });
const q = await send('Runtime.queryObjects', { prototypeObjectId: proto.result.result.objectId });
const stats = await send('Runtime.callFunctionOn', {
  objectId: q.result.objects.objectId, returnByValue: true,
  functionDeclaration: `function() {
    const g = this[0]; window.__game = g;
    const imgs = Object.entries(g.preloadedImages || {}).filter(([k, v]) => v);
    let px = 0; const uniq = new Set(); let big = [];
    for (const [k, v] of imgs) { if (uniq.has(v)) continue; uniq.add(v); const p = (v.naturalWidth||v.width) * (v.naturalHeight||v.height); px += p; big.push([p, k, (v.naturalWidth||v.width)+'x'+(v.naturalHeight||v.height)]); }
    big.sort((a,b)=>b[0]-a[0]);
    const snd = g.audioManager ? Object.keys(g.audioManager.sounds).length : 0;
    return { images: uniq.size, decodedMB: +(px*4/1048576).toFixed(1), sounds: snd,
             heapMB: performance.memory ? +(performance.memory.usedJSHeapSize/1048576).toFixed(1) : null,
             top: big.slice(0,8).map(b=>b[2]+' '+b[1]) };
  }`
});

const all = [...reqs.values()].filter(r => r.bytes !== undefined);
const byType = {}; let total = 0; let lastEnd = 0;
for (const r of all) { const ext = (r.url.split('?')[0].match(/\.(\w+)$/) || [, 'other'])[1].toLowerCase(); byType[ext] = byType[ext] || { n: 0, MB: 0 }; byType[ext].n++; byType[ext].MB += r.bytes / 1048576; total += r.bytes; if (r.t1 > lastEnd) lastEnd = r.t1; }
for (const k in byType) byType[k].MB = +byType[k].MB.toFixed(1);
const heaviest = all.sort((a, b) => b.bytes - a.bytes).slice(0, 10).map(r => `${(r.bytes / 1024).toFixed(0)} KB ${r.url.replace(/^.*?\/\/[^/]+\//, '')}`);
console.log(JSON.stringify({ bootToMenuMs: bootMs, requests: all.length, downloadedMB: +(total / 1048576).toFixed(1), networkSpanS: +(lastEnd - firstReq).toFixed(1), byType, heaviest, game: stats.result?.result?.value }, null, 2));

ws.close(); chrome.kill();
process.exit(0);
