// Summarize a .cpuprofile: top self time and top inclusive time by function.
import { readFileSync } from 'node:fs';
const prof = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const N = Number(process.argv[3] || 25);
const byId = new Map(prof.nodes.map(n => [n.id, n]));
const parent = new Map();
for (const n of prof.nodes) for (const c of (n.children || [])) parent.set(c, n.id);
const dt = prof.timeDeltas; const samples = prof.samples;
const selfT = new Map();
for (let i = 0; i < samples.length; i++) selfT.set(samples[i], (selfT.get(samples[i]) || 0) + (dt[i] || 0));
const key = n => { const cf = n.callFrame; const f = cf.url ? cf.url.replace(/^.*\/js\//, 'js/') : ''; return `${cf.functionName || '(anon)'} ${f}${f ? ':' + (cf.lineNumber + 1) : ''}`; };
const self = new Map(), incl = new Map();
let total = 0;
for (const [id, t] of selfT) {
  total += t; const n = byId.get(id); const k = key(n); self.set(k, (self.get(k) || 0) + t);
  const seen = new Set(); let cur = id;
  while (cur !== undefined) { const kk = key(byId.get(cur)); if (!seen.has(kk)) { incl.set(kk, (incl.get(kk) || 0) + t); seen.add(kk); } cur = parent.get(cur); }
}
const fmt = (m) => [...m].sort((a, b) => b[1] - a[1]).slice(0, N).map(([k, t]) => `${(t / 1000).toFixed(0).padStart(7)} ms ${(100 * t / total).toFixed(1).padStart(5)}%  ${k}`).join('\n');
console.log(`total sampled: ${(total / 1000).toFixed(0)} ms\n== SELF ==\n${fmt(self)}\n== INCLUSIVE ==\n${fmt(incl)}`);
