// ============================================================
// CLOUD PAINTS — correct the pack sizes at source
// ============================================================
//   node build/pack-sizes.mjs           report
//   node build/pack-sizes.mjs --write   apply
//
// js/products-data.js is the one place pack sizes are stated. The
// website's product pages, the price list, the brochures, the range
// poster and both fliers all read from it, so a size corrected here
// is corrected everywhere at the next build — and a size corrected
// anywhere else would put two different answers in front of the same
// customer.
//
// Order is largest first throughout. A customer reading a range
// sheet is deciding how much to buy, and the biggest tin is the one
// a contractor is looking for.
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'js', 'products-data.js');
const WRITE = process.argv.includes('--write');

/* The corrected range. Anything not named here keeps the sizes it has and
   is only re-ordered, largest first. */
const SIZES = {
  'silk-vinyl':          ['20L', '4L', '1L'],
  'vinyl-matt':          ['20L', '4L', '1L'],
  'iris-economy':        ['20L', '4L', '1L'],
  'weatherguard':        ['20L', '4L', '1L'],

  // SuperMatt is a liquid emulsion sold in tins, not a bagged powder. It
  // was listed at 30kg/10kg with Rocketex, which is bagged; only Rocketex
  // belongs there.
  'supermatt':           ['20L', '4L', '1L'],
  'rocketex':            ['30kg', '5kg'],

  // Four and one only. Super Gloss, Clear Varnish and Road Marking used to
  // carry a 20L; Metal Primer and Varnish Stain a 5L. Neither is stocked.
  'gloss-enamel':        ['4L', '1L'],
  'universal-undercoat': ['4L', '1L'],
  'floor-paint':         ['4L', '1L'],
  'roof-paint':          ['4L', '1L'],
  'super-gloss':         ['4L', '1L'],
  'clear-varnish':       ['4L', '1L'],
  'road-marking':        ['4L', '1L'],
  'metal-primer':        ['4L', '1L'],
  'varnish-stain':       ['4L', '1L'],

  // Solvents: five and one.
  'turpentine':          ['5L', '1L'],
  'white-spirit':        ['5L', '1L'],
  'standard-thinner':    ['5L', '1L'],
};

/** Largest first. Litres and kilos never mix within one product, so a single
 *  numeric comparison on the leading number is enough — except for millilitres,
 *  which have to be scaled or 250ml sorts above 4L. */
function descending(list) {
  const value = s => {
    const n = parseFloat(s);
    return /ml/i.test(s) ? n / 1000 : n;
  };
  return [...list].sort((a, b) => value(b) - value(a));
}

const src = fs.readFileSync(FILE, 'utf8');
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(src, ctx, { filename: 'products-data.js' });
const products = ctx.window.CLOUD_PRODUCTS;

let out = src;
const rows = [];

for (const p of products) {
  const before = p.sizes || [];
  const after = descending(SIZES[p.slug] || before);
  if (before.join('|') === after.join('|')) continue;

  const fmt = list => `sizes: [${list.map(s => `'${s}'`).join(', ')}]`;
  const oldLine = fmt(before);
  if (!out.includes(oldLine)) {
    rows.push([p.slug, before.join(' · '), after.join(' · '), 'NOT FOUND IN SOURCE']);
    continue;
  }
  // Several products share an identical size list, so anchor the replacement
  // to this product's own slug rather than replacing the first match.
  const slugAt = out.indexOf(`slug: '${p.slug}'`);
  const lineAt = out.indexOf(oldLine, slugAt);
  if (slugAt === -1 || lineAt === -1) {
    rows.push([p.slug, before.join(' · '), after.join(' · '), 'ANCHOR FAILED']);
    continue;
  }
  out = out.slice(0, lineAt) + fmt(after) + out.slice(lineAt + oldLine.length);
  rows.push([p.slug, before.join(' · '), after.join(' · '), '']);
}

console.log('%-24s %-20s %-18s %s', 'PRODUCT', 'WAS', 'NOW', '');
rows.forEach(([s, b, a, note]) => console.log('%-24s %-20s %-18s %s', s, b, a, note));
console.log('');
console.log(`  ${rows.filter(r => !r[3]).length} products updated`);

const failed = rows.filter(r => r[3]);
if (failed.length) {
  console.error(`  ${failed.length} could not be matched — nothing written`);
  process.exit(1);
}

if (WRITE) {
  fs.writeFileSync(FILE, out, 'utf8');
  console.log('  written to js/products-data.js');
  console.log('  now re-run: node build/site.mjs && node build/schema.mjs');
  console.log('              cd client-package && node build/build.mjs && node build/render.mjs');
} else {
  console.log('  DRY RUN — pass --write to apply');
}
