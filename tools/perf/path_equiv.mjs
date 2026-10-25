// Old vs new findPath must return identical paths. Loads each version of minHeap.js + utils.js
// into its own VM context with the game's real CONFIG.
// Usage: node path_equiv.mjs <oldDir> <newJsDir> <navgrid.txt>
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const [, , OLD_DIR, NEW_DIR, GRID_FILE] = process.argv;
const configSrc = readFileSync(path.join(NEW_DIR, 'config.js'), 'utf8');

function makeCtx(dir) {
  const ctx = vm.createContext({ console, Math, performance, window: {}, document: undefined });
  vm.runInContext(configSrc + '\n;globalThis.CONFIG = CONFIG;', ctx, { filename: 'config.js' });
  vm.runInContext(readFileSync(path.join(dir, 'minHeap.js'), 'utf8') + '\n;globalThis.MinHeap = MinHeap;', ctx, { filename: 'minHeap.js' });
  vm.runInContext(readFileSync(path.join(dir, 'utils.js'), 'utf8'), ctx, { filename: 'utils.js' });
  return ctx;
}
const oldCtx = makeCtx(OLD_DIR), newCtx = makeCtx(NEW_DIR);

let seed = 987654321;
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const ri = (n) => Math.floor(rnd() * n);

function compare(label, grid, queries) {
  const W = grid[0].length, H = grid.length;
  let same = 0, diff = 0, nulls = 0, tOld = 0, tNew = 0; const examples = [];
  for (const [s, e, phasing] of queries) {
    let t = performance.now(); const a = oldCtx.findPath(s, e, grid, phasing); tOld += performance.now() - t;
    t = performance.now(); const b = newCtx.findPath(s, e, grid, phasing); tNew += performance.now() - t;
    const ja = JSON.stringify(a), jb = JSON.stringify(b);
    if (ja === jb) { same++; if (a === null) nulls++; } else { diff++; if (examples.length < 3) examples.push({ s, e, phasing, oldLen: a && a.length, newLen: b && b.length }); }
  }
  console.log(`${label}: ${W}x${H}, ${queries.length} queries -> identical ${same} (null ${nulls}), different ${diff}; old ${tOld.toFixed(0)} ms, new ${tNew.toFixed(0)} ms (${(tOld / tNew).toFixed(1)}x)`);
  if (examples.length) console.log('  examples:', JSON.stringify(examples));
  return diff;
}

// 1) The real phase-20 nav grid.
const real = readFileSync(GRID_FILE, 'utf8').trim().split('\n').map(r => Array.from(r.trim(), c => c.charCodeAt(0) - 48));
const RW = real[0].length, RH = real.length;
const walk = []; for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) if (real[y][x] === 0) walk.push([x, y]);
const pick = () => { const [x, y] = walk[ri(walk.length)]; return { x, y }; };
const near = (p, r) => { for (let i = 0; i < 50; i++) { const x = p.x + ri(2 * r + 1) - r, y = p.y + ri(2 * r + 1) - r; if (x >= 0 && y >= 0 && x < RW && y < RH && real[y][x] === 0) return { x, y }; } return pick(); };
const realQ = [];
for (let i = 0; i < 600; i++) { const s = pick(); realQ.push([s, near(s, 30), false]); }
for (let i = 0; i < 600; i++) { const s = pick(); realQ.push([s, near(s, 200), false]); }
for (let i = 0; i < 300; i++) realQ.push([pick(), pick(), false]);
for (let i = 0; i < 100; i++) { const s = pick(); realQ.push([s, near(s, 120), true]); }
for (let i = 0; i < 100; i++) realQ.push([pick(), { x: ri(RW), y: ri(RH) }, false]); // may hit blocked goals -> null
let diffs = compare('real phase-20 grid', real, realQ);

// 2) Random cluttered grids of varying size (unreachable goals, border-waypoint fallback),
//    interleaved with the big grid so the shared scratch buffers get reused across sizes.
for (let g = 0; g < 40; g++) {
  const W = 20 + ri(140), H = 20 + ri(140), density = 0.15 + rnd() * 0.35;
  const grid = Array.from({ length: H }, () => Array.from({ length: W }, () => (rnd() < density ? 1 : 0)));
  const q = [];
  for (let i = 0; i < 60; i++) {
    const s = { x: ri(W), y: ri(H) }, e = { x: ri(W), y: ri(H) };
    grid[s.y][s.x] = 0; if (rnd() < 0.9) grid[e.y][e.x] = 0;
    q.push([s, e, rnd() < 0.1]);
  }
  diffs += compare(`random #${g}`, grid, q);
  if (g % 10 === 9) diffs += compare('real grid again', real, realQ.slice(0, 150));
}
console.log(diffs === 0 ? 'ALL IDENTICAL' : `MISMATCHES: ${diffs}`);
process.exit(diffs === 0 ? 0 : 1);
