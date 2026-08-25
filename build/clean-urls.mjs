// ============================================================
// CLOUD PAINTS — one-shot link migration to clean URLs
// ============================================================
// Rewrites every internal link in the site's HTML and JS from
// "products.html" to "/products", and every product link from
// "product.html?p=<slug>" to "/paints/<slug>".
//
//   node build/clean-urls.mjs          report what would change
//   node build/clean-urls.mjs --write  make the changes
//
// Safe to re-run: the patterns only match the old shapes, so a
// second pass finds nothing.
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WRITE = process.argv.includes('--write');

/* The map. Left side is the file on disk, right side is the URL the world
   sees. 404.html keeps its extension: Apache's ErrorDocument points at the
   file, not at a pretty URL, and nothing should ever link to it. */
const PAGES = {
  'index.html': '/',
  'products.html': '/products',
  'colours.html': '/colours',
  'visualiser.html': '/visualiser',
  'textures.html': '/textures',
  'services.html': '/services',
  'projects.html': '/projects',
  'inspiration.html': '/inspiration',
  'about.html': '/about',
  'contact.html': '/contact',
  'discover.html': '/discover',
  'discover-signs-experts.html': '/discover-signs-experts',
  'discover-dual-protection.html': '/discover-dual-protection',
  'legal.html': '/legal',
};

const FILES = [
  ...fs.readdirSync(ROOT).filter(f => f.endsWith('.html') && !f.startsWith('_')),
  ...fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js')).map(f => 'js/' + f),
];

let changed = 0, edits = 0;
const log = [];

for (const rel of FILES) {
  const file = path.join(ROOT, rel);
  const before = fs.readFileSync(file, 'utf8');
  let s = before;
  let n = 0;
  const bump = k => { n += k; };

  /* 1. Product detail links, in every shape the site built them.
        Both the string-concatenation form used by the card renderers and
        any hand-written one. ?p= and ?slug= were both in use. */
  s = s.replace(/(['"])product\.html\?(?:p|slug)=/g, (m, q) => { bump(1); return q + '/paints/'; });

  /* 2. Ordinary page links. Query strings and fragments carry over:
        products.html#wood       -> /products#wood
        products.html?surface=x  -> /products?surface=x                */
  for (const [file_, url] of Object.entries(PAGES)) {
    const re = new RegExp('(["\'])' + file_.replace(/\./g, '\\.') + '(?=["\'#?])', 'g');
    s = s.replace(re, (m, q) => { bump(1); return q + url; });
  }

  if (s !== before) {
    changed++; edits += n;
    log.push(`  ${rel.padEnd(34)} ${n} link${n === 1 ? '' : 's'}`);
    if (WRITE) fs.writeFileSync(file, s, 'utf8');
  }
}

console.log(WRITE ? 'Rewrote internal links to clean URLs\n' : 'DRY RUN — pass --write to apply\n');
log.forEach(l => console.log(l));
console.log(`\n  ${edits} links across ${changed} files`);
if (!WRITE) console.log('\n  nothing was written');
