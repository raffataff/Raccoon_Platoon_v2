// Asset audit: paths whose case differs from the file on disk (fine on Windows, 404 on a
// case-sensitive file system such as Linux / Steam Deck), referenced files that don't exist,
// and files nothing seems to use.
// Usage: node asset_audit.mjs <repoRoot> [urls.txt ...]   (urls.txt = cdp_boot.mjs URLS output)
// "Unused" = never requested in the given runs AND basename never appears in js/, index.html,
// style.css. Names built at runtime (directions, frames, '_night') can still hide in that list:
// check each before deleting anything.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, basename } from 'node:path';

const [, , ROOT, ...URL_FILES] = process.argv;
const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
};
const rel = p => relative(ROOT, p).split('\\').join('/');

const files = walk(join(ROOT, 'assets')).map(p => ({ path: rel(p), size: statSync(p).size }));
const exact = new Set(files.map(f => f.path));
const byLower = new Map(files.map(f => [f.path.toLowerCase(), f.path]));

const sources = walk(join(ROOT, 'js')).filter(p => p.endsWith('.js'))
  .concat(['index.html', 'style.css', 'minigame_test.html'].map(f => join(ROOT, f)).filter(p => { try { return statSync(p).isFile(); } catch { return false; } }));
let allCode = '';
const caseBad = [], missing = [];
for (const src of sources) {
  const text = readFileSync(src, 'utf8');
  allCode += text + '\n';
  text.split('\n').forEach((line, i) => {
    for (const m of line.matchAll(/assets\/[A-Za-z0-9_\-./ ]+\.[A-Za-z0-9]{2,4}\b/g)) {
      const p = m[0];
      if (exact.has(p)) continue;
      const where = `${rel(src)}:${i + 1}${line.trimStart().startsWith('//') ? ' (commented out)' : ''}`;
      if (byLower.has(p.toLowerCase())) caseBad.push(`${where}\n      code: ${p}\n      disk: ${byLower.get(p.toLowerCase())}`);
      else missing.push(`${where}  ${p}`);
    }
  });
}

const requested = new Set();
const runtimeCase = new Set(), runtimeFailed = new Set();
for (const f of URL_FILES) {
  for (const line of readFileSync(f, 'utf8').split('\n')) {
    const m = line.match(/^(\d+) (assets\/.*)$/);
    if (!m) continue;
    const [, status, p] = m;
    if (+status >= 400) runtimeFailed.add(`${status} ${p}`);
    if (exact.has(p)) requested.add(p);
    else if (byLower.has(p.toLowerCase())) { runtimeCase.add(`${p}  ->  ${byLower.get(p.toLowerCase())}`); requested.add(byLower.get(p.toLowerCase())); }
  }
}

// ShootoutController builds night backgrounds as <day image>_night.<ext>.
const nameUsed = name => allCode.includes(name) || (/_night\.\w+$/.test(name) && allCode.includes(name.replace(/_night(\.\w+)$/, '$1')));
const unused = files.filter(f => !requested.has(f.path) && !nameUsed(basename(f.path))).sort((a, b) => b.size - a.size);
const MB = n => (n / 1048576).toFixed(2);
console.log(`assets: ${files.length} files, ${MB(files.reduce((s, f) => s + f.size, 0))} MB; requested in given runs: ${requested.size}`);
console.log(`\nCASE MISMATCH in code (${caseBad.length}):\n` + caseBad.map(s => '  ' + s).join('\n'));
console.log(`\nCASE MISMATCH at runtime (${runtimeCase.size}):\n` + [...runtimeCase].map(s => '  ' + s).join('\n'));
console.log(`\nMISSING literal paths (${missing.length}):\n` + missing.map(s => '  ' + s).join('\n'));
console.log(`\nFAILED requests (${runtimeFailed.size}):\n` + [...runtimeFailed].map(s => '  ' + s).join('\n'));
console.log(`\nPOSSIBLY UNUSED (${unused.length} files, ${MB(unused.reduce((s, f) => s + f.size, 0))} MB):\n` + unused.map(f => `  ${MB(f.size).padStart(6)} MB  ${f.path}`).join('\n'));
