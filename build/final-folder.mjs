// ============================================================
// CLOUD PAINTS — assemble the deliverable folder
// ============================================================
//   node build/final-folder.mjs           report what it would copy
//   node build/final-folder.mjs --write   build it
//
// Produces, beside the project:
//
//   Cloud Paints Final/
//     README.md          which half is which
//     website/           EXACTLY what goes on cloudpaints.co.ke
//     print-package/     the finished PDFs and what makes them
//
// The split matters. The website half must contain the site and
// nothing else: build scripts, print sources and working notes on
// a public server are at best clutter and at worst a map of the
// place. .htaccess refuses most of them anyway, but a file that
// was never uploaded cannot be served by a misconfiguration.
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.resolve(ROOT, '..', 'Cloud Paints Final');
const WRITE = process.argv.includes('--write');

/* ---------- what the website is ----------------------------------------
   Named explicitly rather than filtered by exclusion. An allow-list cannot
   leak something new that lands in the root next week. */
const SITE_DIRS = ['css', 'js', 'images', 'fonts', 'datasheets', 'paints'];
const SITE_FILES = [
  '.htaccess', 'favicon.ico', 'robots.txt', 'sitemap.xml',
  'index.html', 'products.html', 'product.html', 'colours.html', 'visualiser.html',
  'textures.html', 'services.html', 'projects.html', 'inspiration.html',
  'about.html', 'contact.html', 'discover.html',
  'discover-signs-experts.html', 'discover-dual-protection.html',
  'legal.html', '404.html',
];

/* Inside those directories, a few things are workshop rather than website. */
const SITE_SKIP = [
  /(^|\/)README\.txt$/i,          // the empty-folder notes in images/
  /(^|\/)\.DS_Store$/i,
  /(^|\/)Thumbs\.db$/i,
  /(^|\/)desktop\.ini$/i,
];

/* ---------- what the print package is ---------------------------------- */
const PRINT_DIRS = ['assets', 'build', 'pdf'];   // html/ is a rebuildable intermediate
const PRINT_FILES = ['README.md'];

let copied = 0, bytes = 0;
const skipped = [];

function copyFile(from, to) {
  copied++;
  bytes += fs.statSync(from).size;
  if (!WRITE) return;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

function copyTree(from, to, skip = []) {
  if (!fs.existsSync(from)) return;
  for (const name of fs.readdirSync(from)) {
    const src = path.join(from, name);
    const dst = path.join(to, name);
    const rel = path.relative(ROOT, src).replace(/\\/g, '/');
    if (skip.some(re => re.test(rel))) { skipped.push(rel); continue; }
    const st = fs.statSync(src);
    if (st.isDirectory()) copyTree(src, dst, skip);
    else copyFile(src, dst);
  }
}

if (WRITE) {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
}

// ---- website -------------------------------------------------------------
const webBefore = copied;
for (const d of SITE_DIRS) copyTree(path.join(ROOT, d), path.join(OUT, 'website', d), SITE_SKIP);
for (const f of SITE_FILES) {
  const src = path.join(ROOT, f);
  if (fs.existsSync(src)) copyFile(src, path.join(OUT, 'website', f));
  else skipped.push(f + '  (MISSING FROM THE PROJECT)');
}
const webFiles = copied - webBefore;
const webBytes = bytes;

// ---- print package -------------------------------------------------------
const pkg = path.join(ROOT, 'client-package');
for (const d of PRINT_DIRS) copyTree(path.join(pkg, d), path.join(OUT, 'print-package', d));
for (const f of PRINT_FILES) {
  const src = path.join(pkg, f);
  if (fs.existsSync(src)) copyFile(src, path.join(OUT, 'print-package', f));
}
const printFiles = copied - webFiles;
const printBytes = bytes - webBytes;

// ---- the note at the top -------------------------------------------------
const pdfCount = fs.existsSync(path.join(pkg, 'pdf'))
  ? (function count(d) {
      return fs.readdirSync(d).reduce((n, f) => {
        const p = path.join(d, f);
        return n + (fs.statSync(p).isDirectory() ? count(p) : (f.endsWith('.pdf') ? 1 : 0));
      }, 0);
    })(path.join(pkg, 'pdf'))
  : 0;

const README = `# Cloud Paints — final

Two things, kept apart on purpose.

## website/

**Exactly what goes on cloudpaints.co.ke, and nothing else.**

Upload the *contents* of this folder to the web root — so that \`index.html\`
lands at the root, not inside a \`website\` folder. If it ends up one level
down the site still works, because every path in it is relative; but the
canonical URLs and the sitemap name the domain root, so search would see two
addresses for one site.

\`.htaccess\` needs Apache with **mod_rewrite, mod_headers, mod_deflate** and
**mod_expires**. DirectAdmin has all four as standard. It does real work — the
clean URLs, the redirects from every old address, the security headers and the
Content-Security-Policy all live there. Without it the site loads but every
link 404s.

Nothing here needs Node, npm or a build step on the server. It is static
files. There is no database.

### After uploading

1. Check \`https://cloudpaints.co.ke/\` loads.
2. Check \`https://cloudpaints.co.ke/products\` — no \`.html\`. If that 404s,
   \`.htaccess\` did not upload or mod_rewrite is off.
3. Check \`https://cloudpaints.co.ke/product.html?p=silk-vinyl\` redirects to
   \`/paints/silk-vinyl\`. That redirect is what carries the old addresses'
   standing in search over to the new ones — leave it in place.
4. Submit \`sitemap.xml\` in Google Search Console.

## print-package/

The finished print collateral: **${pdfCount} PDFs** in \`pdf/\`, ready for a
printer. \`README.md\` inside carries the full specification — stock weights,
fold instructions, panel widths, bleed and colour notes.

\`assets/\` and \`build/\` are the sources they were generated from, included so
nothing about how they were made is hidden.

**Rebuilding happens in the project, not here.** Every document is generated
from the website's own product catalogue — one file, \`js/products-data.js\`,
which lives on the website side. That is deliberate: it is why a coverage
figure corrected once is corrected on the flier, the brochure, the poster and
the price list at the next build, and why print and web cannot drift apart. It
also means \`build/build.mjs\` reaches up to a catalogue that is not beside it
in this folder, so running it here will fail on a missing path.

To change a price or a product, work in the repository:

\`\`\`
git clone -b v2 https://github.com/murayaallen/Cloud-Paints.git
cd Cloud-Paints/client-package
node build/build.mjs      # catalogue + prices -> html/
node build/render.mjs     # html/ -> pdf/
python build/verify.py    # check the finished PDFs
\`\`\`

Prices live in one file — \`build/prices.js\`, numbers only. \`python
build/verify.py\` does work here: it reads the finished PDFs and checks page
geometry, font embedding and that every word on every page survived the trip
into the file.

**Do not upload this folder to the website.** It is the workshop, and 89MB of
PDFs on a web server is a slow backup nobody asked for.

---

Generated ${new Date().toISOString().slice(0, 10)} from the \`v2\` branch of
github.com/murayaallen/Cloud-Paints
`;

if (WRITE) fs.writeFileSync(path.join(OUT, 'README.md'), README, 'utf8');

// ---- report --------------------------------------------------------------
const mb = b => (b / 1048576).toFixed(1) + ' MB';
console.log(WRITE ? `Built  ${OUT}\n` : 'DRY RUN — pass --write to build\n');
console.log(`  website/        ${String(webFiles).padStart(5)} files   ${mb(webBytes)}`);
console.log(`  print-package/  ${String(printFiles).padStart(5)} files   ${mb(printBytes)}   (${pdfCount} PDFs)`);
console.log(`  ${'total'.padEnd(14)}  ${String(copied).padStart(5)} files   ${mb(bytes)}`);
if (skipped.length) {
  console.log(`\n  skipped (${skipped.length}):`);
  [...new Set(skipped)].slice(0, 12).forEach(s => console.log('    ' + s));
}
console.log('\n  NOT included in website/, deliberately:');
console.log('    build/  client-package/  new/  samples/  Finishes/  .git/  .claude/');
console.log('    *.md  *.docx  *.zip  and the three unreferenced PDFs in the root');
