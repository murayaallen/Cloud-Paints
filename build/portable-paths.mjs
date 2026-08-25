// ============================================================
// CLOUD PAINTS — make every path mount-point independent
// ============================================================
//   node build/portable-paths.mjs --write
//
// The site is served from the domain root in production, but a
// GitHub Pages project site serves it from /<repo>/ and a staging
// box often serves it from a folder. Root-relative paths ("/images/…")
// are right for the first and wrong for the other two, by exactly
// the length of the prefix — which is why the Pages build lost every
// logo and photograph while the files sat there answering 200.
//
// So: HTML uses relative paths, which the browser resolves against
// wherever the page actually is. Depth is handled per file — root
// pages get a bare path, pages under /paints/ get "../".
//
// Anything built in JavaScript cannot use a relative path, because
// the same header string is inserted at both depths. That goes
// through window.cpUrl / window.cpLocalise from js/base.js instead.
//
// Safe to re-run: it only matches the absolute form.
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WRITE = process.argv.includes('--write');

/* Absolute site paths in href/src/poster. Deliberately does NOT match
   "//host" or a full URL, and leaves the absolute canonical and og:url
   alone — those must stay absolute, they are for production. */
const ABS = /(\s(?:href|src|poster)=")\/(?!\/)([^"]*)"/g;

const files = [
  ...fs.readdirSync(ROOT).filter(f => f.endsWith('.html')).map(f => ({ rel: f, up: '' })),
  ...(fs.existsSync(path.join(ROOT, 'paints'))
    ? fs.readdirSync(path.join(ROOT, 'paints'))
        .filter(f => f.endsWith('.html'))
        .map(f => ({ rel: 'paints/' + f, up: '../' }))
    : []),
];

let changed = 0, total = 0;
const log = [];

for (const { rel, up } of files) {
  const file = path.join(ROOT, rel);
  const before = fs.readFileSync(file, 'utf8');
  let n = 0;

  let s = before.replace(ABS, (m, lead, rest) => {
    n++;
    // href="/" is the homepage. Relative, that is the directory itself.
    if (rest === '') return `${lead}${up || './'}"`;
    return `${lead}${up}${rest}"`;
  });

  // js/base.js has to be in scope before anything else runs.
  if (!s.includes('js/base.js')) {
    const anchor = s.match(/<script src="[^"]*(?:art-manifest|products-data|icon)\.js"><\/script>/);
    if (anchor) {
      s = s.replace(anchor[0], `<script src="${up}js/base.js"></script>\n` + anchor[0]);
      n++;
    }
  }

  total += n;
  if (s !== before) {
    changed++;
    log.push(`  ${rel.padEnd(36)} ${n}`);
    if (WRITE) fs.writeFileSync(file, s, 'utf8');
  }
}

console.log(WRITE ? 'Rewrote absolute paths to relative\n' : 'DRY RUN — pass --write to apply\n');
log.forEach(l => console.log(l));
console.log(`\n  ${total} paths across ${changed} files`);
if (!WRITE) console.log('  nothing was written');
