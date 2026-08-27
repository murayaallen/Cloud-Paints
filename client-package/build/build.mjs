// ============================================================
// CLOUD PAINTS — print package builder
// ============================================================
// Generates every HTML master in html/ from the website's own
// product catalogue. Nothing here is hand-maintained: change a
// product on the website, re-run this, and the print collateral
// follows.
//
//   node build/build.mjs
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import {
  ROOT, CO, loadProducts, loadColours, esc, clean, trim, firstSentence, sentences,
  assets, heroImage, thumbImage, appliedImage, isTexture,
  head, tail, mast, foot, footCompact, footLine, accentVars, write, tint, readable, inkOn,
} from './lib.mjs';
import { PRICES, PRICE_GROUPS, CURRENCY, TRADE_NOTE, EFFECTIVE_FROM } from './prices.js';

const P = loadProducts();
const bySlug = Object.fromEntries(P.map(p => [p.slug, p]));
const made = [];

/* Products we hold a print-quality photograph for. The rest appear in the
   range tables and price list but get no flier — a phone snapshot of a tin
   on a desk would undercut the whole package. */
const withArt = P.filter(p => heroImage(p, 0));
const paints  = withArt.filter(p => !isTexture(p));
const textures= withArt.filter(p =>  isTexture(p));

/* ---------- shared fragments -------------------------------------------- */

const safetyLine = p =>
  clean([p.safety?.lead, p.safety?.voc].filter(Boolean).join(' · ')) ||
  'Water-based · lead-free · low odour';

const specRows = (p, max) => Object.entries(p.specs || {}).slice(0, max)
  .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(trim(v, 52))}</td></tr>`).join('');

const packChips = p => (p.sizes || [])
  .map((s, i) => `<span class="pack${i === 0 ? '' : ''}">${esc(s)}</span>`).join('');

/* The hero visual. A tin is a cut-out that floats; a texture is a render
   that wants an edge, so each gets its own treatment rather than one
   compromise frame that suits neither. */
function heroArt(p, depth, w) {
  const src = heroImage(p, depth);
  if (!src) return '';
  if (isTexture(p)) {
    return `<div class="hero-tex" style="width:${w}"><img src="${src}" alt="${esc(p.name)} finish"></div>`;
  }
  return `<div class="hero-tin" style="width:${w}"><img src="${src}" alt="${esc(p.name)} — ${esc(p.sizes?.[1] || '4L')} pack"></div>`;
}

/* ============================================================
   1. A4 PRODUCT FLIER — single-sided poster, one product
   ============================================================ */
const A4_CSS = `
@page { size: 210mm 297mm; margin: 0; }
.sheet { --sheet-w:210mm; --sheet-h:297mm; --pad:14mm; }
.pad   { inset: 14mm 14mm 22mm; display:flex; flex-direction:column;
         justify-content:space-between; }

.hero      { display:flex; gap:9mm; margin-top:6mm; align-items:center; }
.hero-copy { flex:1; min-width:0; padding-top:1mm; }
.hero-tin  { height:79mm; flex:none; display:flex; align-items:center; justify-content:center; }
.hero-tin img { max-width:100%; max-height:100%; width:auto; height:auto; }
.hero-tex  { border-radius:2mm; overflow:hidden; border:.3mm solid var(--rule); }
.hero-tex img { width:100%; height:78mm; object-fit:cover; }

.h1 { font:400 36pt/0.97 var(--serif); letter-spacing:-.018em; margin:2.5mm 0 3mm; }
.h1 .sub { display:block; font-size:22pt; color:var(--ink-2); }

.cols { display:flex; gap:8mm; margin-top:7mm; }
.col-1 { width:60mm; } .col-2 { width:56mm; } .col-3 { flex:1; }

.surf { margin-top:4mm; padding-top:3mm; border-top:.25mm solid var(--rule-2); }
.surf .k { font:600 6.6pt/1.3 var(--sans); letter-spacing:.12em; text-transform:uppercase; color:var(--ink-3); margin-bottom:1.4mm; }
.surf .v { font:400 7.6pt/1.42 var(--sans); color:var(--ink-2); }

/* How to apply — three steps across, the questions a painter asks in order */
.apply { padding-top:2mm; }
.steps { display:flex; gap:7mm; }
.step  { flex:1; }
.step .n { display:inline-block; width:5mm; height:5mm; border-radius:50%;
           background:var(--accent); color:#fff; text-align:center;
           font:600 6.6pt/5.2mm var(--sans); margin-bottom:1.8mm; }
.step h4 { font:600 7.6pt/1.2 var(--sans); color:var(--ink); margin-bottom:1.2mm; }
.step p  { font:400 6.9pt/1.4 var(--sans); color:var(--ink-2); }
.apply .cleanup { margin-top:3mm; padding-top:2.4mm; border-top:.25mm solid var(--rule-2);
                  font:400 6.7pt/1.38 var(--sans); color:var(--ink-3); }

.buy { display:flex; align-items:center; gap:6mm; margin-top:6mm;
       padding:4.4mm 5mm; background:var(--cream); border-radius:1.6mm; }
.buy .k { font:700 6.6pt/1 var(--sans); letter-spacing:.14em; text-transform:uppercase;
          color:var(--ink-3); margin-bottom:2.2mm; }
`;

function flierA4(p) {
  const d = 3;
  const art = heroArt(p, d, isTexture(p) ? '58mm' : '62mm');
  const [n1, ...n2] = p.name.split(' with ');
  const ap = p.application || {};
  return head(`${p.name} — Cloud Paints`, d, A4_CSS) + `
<div class="sheet" style="${accentVars(p.primary)}">
  <div class="band"></div>
  <div class="pad">
    ${mast(d, { grade: p.grade, logoW: '18mm' })}

    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow">${esc(p.cat_label)}</span>
        <h1 class="h1">${esc(n1)}${n2.length ? `<span class="sub">with ${esc(n2.join(' with '))}</span>` : ''}</h1>
        <p class="tagline">${esc(clean(p.tagline))}</p>
        <p class="body mt-2">${esc(trim(p.short, 420))}</p>
      </div>
      ${art}
    </section>

    <section class="cols">
      <div class="col-1">
        <div class="slab">Key features</div>
        <ul class="ticks">
          ${(p.features || []).slice(0, 5).map(f => `<li>${esc(trim(f, 70))}</li>`).join('')}
        </ul>
      </div>

      <div class="col-2">
        <div class="slab">Technical data</div>
        <table class="specs">${specRows(p, 6)}</table>
      </div>

      <div class="col-3">
        <div class="slab">Where to use it</div>
        <ul class="dots">
          ${(p.uses || []).slice(0, 4).map(u => `<li>${esc(trim(u.split('—')[0], 54))}</li>`).join('')}
        </ul>
        ${(p.surfaces || []).length ? `
        <div class="surf">
          <div class="k">Suitable surfaces</div>
          <div class="v">${esc(trim((p.surfaces || []).join(' · '), 96))}</div>
        </div>` : ''}
      </div>
    </section>

    <section class="apply">
      <div class="slab">How to apply</div>
      <div class="steps">
        <div class="step">
          <span class="n">1</span>
          <h4>Prepare the surface</h4>
          <p>${esc(sentences(ap.prep, 200))}</p>
        </div>
        <div class="step">
          <span class="n">2</span>
          <h4>Prime or undercoat</h4>
          <p>${esc(sentences(ap.new_surface, 200))}</p>
        </div>
        <div class="step">
          <span class="n">3</span>
          <h4>Apply the finish</h4>
          <p>${esc(sentences(ap.method, 200))}</p>
        </div>
      </div>
      <div class="cleanup"><strong>Previously painted:</strong> ${esc(sentences(ap.previously_painted, 140))}
        &nbsp;·&nbsp; <strong>Clean-up:</strong> ${esc(sentences(ap.cleanup, 90))}</div>
    </section>

    <section class="buy">
      <div>
        <div class="k">Available in</div>
        <div class="packs">${packChips(p)}</div>
      </div>
      <div class="grow">
        <div class="k">Safety &amp; storage</div>
        <div class="fine">${esc(safetyLine(p))}. ${esc(sentences(p.safety?.storage || '', 130))} Keep out of reach of children.</div>
      </div>
    </section>
  </div>
  ${foot()}
</div>` + tail;
}

/* ============================================================
   2. A5 PRODUCT FLIER — the hand-out version
   ============================================================ */
const A5_CSS = `
@page { size: 148mm 210mm; margin: 0; }
.sheet { --sheet-w:148mm; --sheet-h:210mm; --pad:11mm; }
.pad   { inset: 11mm 11mm 19mm; display:flex; flex-direction:column;
         justify-content:space-between; }

.hero      { display:flex; gap:6mm; margin-top:5mm; }
.hero-copy { flex:1; min-width:0; }
.hero-tin  { height:54mm; flex:none; display:flex; align-items:center; justify-content:center; }
.hero-tin img { max-width:100%; max-height:100%; width:auto; height:auto; }
.hero-tex  { border-radius:1.6mm; overflow:hidden; border:.3mm solid var(--rule); }
.hero-tex img { width:100%; height:62mm; object-fit:cover; }

.h1 { font:400 24pt/0.99 var(--serif); letter-spacing:-.015em; margin:2mm 0 2mm; }
.tagline { font-size:9.5pt; }

.cols { display:flex; gap:6mm; margin-top:6mm; flex:1; }
.cols .a { width:56mm; } .cols .b { flex:1; }
.ticks li { font-size:7.6pt; margin-bottom:1.5mm; }
.specs th { font-size:6.4pt; } .specs td { font-size:7.4pt; }
.specs th, .specs td { padding:1.3mm 0; }

.buy { margin-top:5mm; padding:3.4mm 4mm; background:var(--cream); border-radius:1.4mm; }
.buy .k { font:700 6pt/1 var(--sans); letter-spacing:.14em; text-transform:uppercase;
          color:var(--ink-3); margin-bottom:1.8mm; }
.pack { font-size:7.2pt; padding:1.7mm 2.4mm 1.5mm; }
`;

function flierA5(p) {
  const d = 3;
  return head(`${p.name} — Cloud Paints (A5)`, d, A5_CSS) + `
<div class="sheet" style="${accentVars(p.primary)}">
  <div class="band" style="--band-h:4.5mm"></div>
  <div class="pad">
    ${mast(d, { tag: p.cat_label, logoW: '21mm' })}

    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow">${esc(p.grade)}</span>
        <h1 class="h1">${esc(p.name)}</h1>
        <p class="tagline">${esc(trim(p.tagline, 58))}</p>
        <p class="body-sm mt-1">${esc(trim(p.short, 210))}</p>
      </div>
      ${heroArt(p, d, isTexture(p) ? '40mm' : '46mm')}
    </section>

    <section class="cols">
      <div class="a">
        <div class="slab">Key features</div>
        <ul class="ticks">
          ${(p.features || []).slice(0, 6).map(f => `<li>${esc(trim(f, 58))}</li>`).join('')}
        </ul>
      </div>
      <div class="b">
        <div class="slab">Technical data</div>
        <table class="specs">${specRows(p, 6)}</table>
      </div>
    </section>

    <section class="buy">
      <div class="k">Available in</div>
      <div class="packs">${packChips(p)}</div>
      <div class="fine mt-1">${esc(safetyLine(p))} · Keep out of reach of children.</div>
    </section>
  </div>
  ${footCompact()}
</div>` + tail;
}

/* ============================================================
   2b. COLOUR PRODUCT FLIER — A4 and A5
   ------------------------------------------------------------
   The same complete information as the white fliers, on a field
   of the product's own colour.

   The tin does the work here. Every cut-out is a transparent PNG,
   so it sits directly on the colour with no box around it and
   breaks the edge of the field at the bottom — which is what stops
   the page reading as two stacked rectangles.

   The logo and the standards mark are red-and-blue on transparent
   and disappear on a deep ground, so both sit in white chips. That
   is a deliberate device, not a patch: it reads as a label on the
   colour, and it is how the price list masthead already works.
   ============================================================ */
const COLOUR_CSS = `
.sheet { position:relative; }

/* the colour field, and the tin that breaks out of it */
.field { position:absolute; left:0; right:0; top:0; background:var(--accent); }
.field-pad { position:absolute; inset:0; padding:var(--fpad); }

.chip { background:#fff; border-radius:1.8mm; padding:2.6mm 3mm; display:inline-flex;
        align-items:center; gap:3mm; }
.chip img { display:block; }
.chip-rule { width:.3mm; align-self:stretch; background:var(--rule); margin:1mm 0; }
.chip .kebs { height:var(--kebsh); width:auto; }

.c-mast { display:flex; align-items:flex-start; justify-content:space-between; gap:6mm; }
.c-grade { font:600 6.4pt/1 var(--sans); letter-spacing:.15em; text-transform:uppercase;
           color:#fff; border:.3mm solid rgba(255,255,255,.5); border-radius:1mm;
           padding:2.2mm 3.2mm 2mm; }

.c-eyebrow { font:600 7pt/1.2 var(--sans); letter-spacing:.17em; text-transform:uppercase;
             color:var(--gold); }
.c-name { font:400 var(--namesize)/0.97 var(--serif); letter-spacing:-.018em; color:#fff; }
.c-name .sub { display:block; font-size:var(--subsize); color:rgba(255,255,255,.72); }
.c-tag  { font:400 italic var(--tagsize)/1.3 var(--serif); color:var(--gold); }
.c-desc { font:400 var(--descsize)/1.5 var(--sans); color:rgba(255,255,255,.9); }

.c-tin { position:absolute; z-index:2; }
.c-tin img { width:100%; height:auto; }

/* the white half */
.c-body { position:absolute; left:0; right:0; padding:0 var(--fpad); }

.slab { color:var(--accent); border-bottom-color:var(--accent); }
.ticks li::before { border-color:var(--accent); }
.dots li::before  { background:var(--accent); }
`;

/** Shared content for the lower half — identical information to the white
 *  flier, so "colour version" never means "less of the product data". */
function colourBody(p, d, opts) {
  const ap = p.application || {};
  return `
    <section class="cols">
      <div class="col-1">
        <div class="slab">Key features</div>
        <ul class="ticks">
          ${(p.features || []).slice(0, opts.feat).map(f => `<li>${esc(trim(f, opts.featLen))}</li>`).join('')}
        </ul>
      </div>
      <div class="col-2">
        <div class="slab">Technical data</div>
        <table class="specs">${specRows(p, opts.specs)}</table>
      </div>
      <div class="col-3">
        <div class="slab">Where to use it</div>
        <ul class="dots">
          ${(p.uses || []).slice(0, opts.uses).map(u => `<li>${esc(trim(u.split('—')[0], 54))}</li>`).join('')}
        </ul>
        ${(p.surfaces || []).length ? `
        <div class="surf">
          <div class="k">Suitable surfaces</div>
          <div class="v">${esc(trim((p.surfaces || []).join(' · '), 96))}</div>
        </div>` : ''}
      </div>
    </section>

    <section class="apply">
      <div class="slab">How to apply</div>
      <div class="steps">
        <div class="step"><span class="n">1</span><h4>Prepare the surface</h4>
          <p>${esc(sentences(ap.prep, opts.step))}</p></div>
        <div class="step"><span class="n">2</span><h4>Prime or undercoat</h4>
          <p>${esc(sentences(ap.new_surface, opts.step))}</p></div>
        <div class="step"><span class="n">3</span><h4>Apply the finish</h4>
          <p>${esc(sentences(ap.method, opts.step))}</p></div>
      </div>
      ${opts.cleanup === false ? '' : `<div class="cleanup"><strong>Previously painted:</strong> ${esc(sentences(ap.previously_painted, 140))}
        &nbsp;·&nbsp; <strong>Clean-up:</strong> ${esc(sentences(ap.cleanup, 90))}</div>`}
    </section>

    <section class="buy">
      <div>
        <div class="k">Available in</div>
        <div class="packs">${packChips(p)}</div>
      </div>
      <div class="grow">
        <div class="k">Safety &amp; storage</div>
        <div class="fine">${esc(safetyLine(p))}. ${esc(sentences(p.safety?.storage || '', 130))} Keep out of reach of children.${
          opts.cleanup === false ? ' <strong>Clean-up:</strong> ' + esc(sentences(ap.cleanup, 90)) : ''}</div>
      </div>
    </section>`;
}

function flierColourA4(p) {
  const d = 3;
  const a = assets(d);
  const [n1, ...n2] = p.name.split(' with ');
  const css = `
@page { size: 210mm 297mm; margin: 0; }
.sheet { --sheet-w:210mm; --sheet-h:297mm; --pad:14mm; --fpad:14mm; --kebsh:14mm;
         --namesize:36pt; --subsize:22pt; --tagsize:12pt; --descsize:9.4pt; }
.field  { height:104mm; }
.c-mast .chip > img:first-child { width:18mm; }
.c-copy { position:absolute; left:14mm; top:45mm; width:116mm; height:55mm; overflow:hidden; }
.c-tin  { right:14mm; top:40mm; width:64mm; }   /* 82mm tall — clears the field by 18mm */
.c-body { top:128mm; bottom:19mm; }

.cols { display:flex; gap:8mm; }
.col-1 { width:60mm; } .col-2 { width:56mm; } .col-3 { flex:1; }
.surf { margin-top:4mm; padding-top:3mm; border-top:.25mm solid var(--rule-2); }
.surf .k { font:600 6.6pt/1.3 var(--sans); letter-spacing:.12em; text-transform:uppercase; color:var(--ink-3); margin-bottom:1.4mm; }
.surf .v { font:400 7.6pt/1.42 var(--sans); color:var(--ink-2); }

.apply { padding-top:7mm; }
.steps { display:flex; gap:7mm; }
.step  { flex:1; }
.step .n { display:inline-block; width:5mm; height:5mm; border-radius:50%;
           background:var(--accent); color:#fff; text-align:center;
           font:600 6.6pt/5.2mm var(--sans); margin-bottom:1.8mm; }
.step h4 { font:600 7.6pt/1.2 var(--sans); color:var(--ink); margin-bottom:1.2mm; }
.step p  { font:400 6.9pt/1.4 var(--sans); color:var(--ink-2); }
.apply .cleanup { margin-top:3mm; padding-top:2.4mm; border-top:.25mm solid var(--rule-2);
                  font:400 6.7pt/1.38 var(--sans); color:var(--ink-3); }

.buy { display:flex; align-items:center; gap:6mm; margin-top:7mm;
       padding:4.4mm 5mm; background:var(--cream); border-radius:1.6mm; }
.buy .k { font:700 6.6pt/1 var(--sans); letter-spacing:.14em; text-transform:uppercase;
          color:var(--ink-3); margin-bottom:2.2mm; }
` + COLOUR_CSS;

  return head(`${p.name} — Cloud Paints (colour A4)`, d, css) + `
<div class="sheet" style="${accentVars(p.primary)}">
  <div class="field"></div>

  <div class="field-pad">
    <header class="c-mast">
      <span class="chip">
        <img src="${a}/img/brand/logo.png" alt="Cloud Paints">
        <span class="chip-rule"></span>
        <img class="kebs" src="${a}/img/brand/kebs.png" alt="KEBS Standardisation Mark">
      </span>
      <span class="c-grade">${esc(p.grade)}</span>
    </header>
  </div>

  <div class="c-copy">
    <span class="c-eyebrow">${esc(p.cat_label)}</span>
    <h1 class="c-name mt-1">${esc(n1)}${n2.length ? `<span class="sub">with ${esc(n2.join(' with '))}</span>` : ''}</h1>
    <p class="c-tag mt-1">${esc(clean(p.tagline))}</p>
    <p class="c-desc mt-2">${esc(trim(p.short, 300))}</p>
  </div>

  <div class="c-tin"><img src="${heroImage(p, d)}" alt="${esc(p.name)} — ${esc(p.sizes?.[1] || '4L')} pack"></div>

  <div class="c-body">
    ${colourBody(p, d, { feat: 5, featLen: 70, specs: 6, uses: 4, step: 205 })}
  </div>

  ${foot()}
</div>` + tail;
}

function flierColourA5(p) {
  const d = 3;
  const a = assets(d);
  const css = `
@page { size: 148mm 210mm; margin: 0; }
.sheet { --sheet-w:148mm; --sheet-h:210mm; --pad:11mm; --fpad:11mm; --kebsh:10.5mm;
         --namesize:21pt; --subsize:14pt; --tagsize:9pt; --descsize:7.4pt; }
.field  { height:78mm; }
.c-mast .chip > img:first-child { width:14mm; }
.c-copy { position:absolute; left:11mm; top:33mm; width:80mm; height:42mm; overflow:hidden; }
.c-tin  { right:10mm; top:29mm; width:46mm; }   /* 60mm tall — clears the field by 11mm */
.c-body { top:94mm; bottom:17mm; }

.cols { display:flex; gap:6mm; }
.col-1 { width:56mm; } .col-2 { flex:1; } .col-3 { display:none; }
.ticks li { font-size:7.4pt; margin-bottom:1.4mm; }
.specs th { font-size:6.4pt; } .specs td { font-size:7.4pt; }
.specs th, .specs td { padding:1.3mm 0; }

.apply { padding-top:2mm; }
.steps { display:flex; gap:5mm; }
.step  { flex:1; }
.step .n { display:inline-block; width:4.4mm; height:4.4mm; border-radius:50%;
           background:var(--accent); color:#fff; text-align:center;
           font:600 6pt/4.6mm var(--sans); margin-bottom:1.4mm; }
.step h4 { font:600 6.8pt/1.2 var(--sans); color:var(--ink); margin-bottom:1mm; }
.step p  { font:400 6.2pt/1.38 var(--sans); color:var(--ink-2); }
.apply .cleanup { margin-top:2.4mm; padding-top:2mm; border-top:.25mm solid var(--rule-2);
                  font:400 6pt/1.35 var(--sans); color:var(--ink-3); }

.buy { display:flex; align-items:center; gap:5mm; margin-top:3mm;
       padding:3.2mm 4mm; background:var(--cream); border-radius:1.4mm; }
.buy .k { font:700 6pt/1 var(--sans); letter-spacing:.14em; text-transform:uppercase;
          color:var(--ink-3); margin-bottom:1.8mm; }
.pack { font-size:7.2pt; padding:1.7mm 2.4mm 1.5mm; }
` + COLOUR_CSS;

  return head(`${p.name} — Cloud Paints (colour A5)`, d, css) + `
<div class="sheet" style="${accentVars(p.primary)}">
  <div class="field"></div>

  <div class="field-pad">
    <header class="c-mast">
      <span class="chip" style="padding:2mm 2.4mm">
        <img src="${a}/img/brand/logo.png" alt="Cloud Paints">
        <span class="chip-rule"></span>
        <img class="kebs kebs--sm" src="${a}/img/brand/kebs.png" alt="KEBS Standardisation Mark">
      </span>
      <span class="c-grade">${esc(p.grade)}</span>
    </header>
  </div>

  <div class="c-copy">
    <span class="c-eyebrow">${esc(p.cat_label)}</span>
    <h1 class="c-name mt-1">${esc(p.name)}</h1>
    <p class="c-tag mt-1">${esc(trim(clean(p.tagline), 58))}</p>
    <p class="c-desc mt-1">${esc(sentences(p.short, 170))}</p>
  </div>

  <div class="c-tin"><img src="${heroImage(p, d)}" alt="${esc(p.name)}"></div>

  <div class="c-body">
    ${colourBody(p, d, { feat: 4, featLen: 68, specs: 5, uses: 0, step: 130, cleanup: false })}
  </div>

  ${footCompact()}
</div>` + tail;
}

/* ============================================================
   3. RANGE POSTER — the whole line-up on one sheet
   Drawn at A3 and scaled to A2 and A4. All three are √2 sheets,
   so one artwork serves every size with no reflow.
   ============================================================ */
const POSTER_CSS = `
.sheet { --sheet-w:297mm; --sheet-h:420mm; --pad:15mm; }
.pad   { inset:15mm 15mm 26mm; display:flex; flex-direction:column; }

.p-head { display:flex; justify-content:space-between; align-items:flex-end;
          padding-bottom:6mm; border-bottom:.8mm solid var(--blue); }
.p-title { font:400 34pt/1 var(--serif); letter-spacing:-.02em; color:var(--blue-deep); }
.p-title em { font-style:italic; color:var(--red); }
.p-sub { font:400 9.5pt/1.4 var(--sans); color:var(--ink-2); max-width:132mm; margin-top:2.5mm; }

.sec-h { display:flex; align-items:baseline; gap:4mm; margin:5mm 0 4mm; }
.sec-h h2 { font:400 17pt/1 var(--serif); color:var(--ink); }
.sec-h .n { font:600 7pt/1 var(--sans); letter-spacing:.15em; text-transform:uppercase; color:var(--ink-3); }
.sec-h .ln { flex:1; height:.25mm; background:var(--rule); }

/* Five across, because the paint range is fifteen photographed lines and
   fifteen divides by five. At four it was three full rows plus a row of
   three, which ran the sheet past its own trim. The textures below already
   sit five across, so the two grids now share a rhythm. */
.grid  { display:grid; grid-template-columns:repeat(5,1fr); gap:4mm; }
.tgrid { display:grid; grid-template-columns:repeat(5,1fr); gap:4mm; }

.tcard { border:.3mm solid var(--rule-2); border-radius:1.6mm; overflow:hidden; background:var(--paper); }
.tcard img { width:100%; height:32mm; object-fit:cover; }
.tcard .t { padding:2.6mm 3mm 3mm; }
.tcard .nm { font:400 8.6pt/1.15 var(--serif); color:var(--ink); }
.tcard .cat{ font:600 5.6pt/1.3 var(--sans); letter-spacing:.1em; text-transform:uppercase;
             color:var(--ink-3); margin-top:1.2mm; }

.pcard-note { height:7.6mm; overflow:hidden; }
.p-note { margin-top:auto; padding-top:4mm; display:flex; gap:8mm; align-items:flex-end; }
.p-note .kb { display:flex; align-items:center; gap:3mm; }
.p-note .kb .fine { max-width:64mm; }
`;

function rangePoster(size) {
  const d = 1;
  const a = assets(d);
  // A3 is the drawing size; the others are exact √2 steps from it.
  const page = { A2: '420mm 594mm', A3: '297mm 420mm', A4: '210mm 297mm' }[size];
  const zoom = { A2: 1.41421, A3: 1, A4: 0.70711 }[size];

  const card = p => `
    <div class="pcard pcard-top" style="${accentVars(p.primary)}--pcard-img-h:22mm;">
      <div class="pcard-img"><img src="${thumbImage(p, d)}" alt="${esc(p.name)}"></div>
      <div class="pcard-cat">${esc(p.cat_label)}</div>
      <div class="pcard-name">${esc(p.name)}</div>
      <div class="pcard-note">${esc(trim(clean(p.tagline), 90))}</div>
      <div class="pcard-sizes">${esc((p.sizes || []).join(' · '))}</div>
    </div>`;

  const tcard = p => `
    <div class="tcard">
      <img src="${thumbImage(p, d)}" alt="${esc(p.name)}">
      <div class="t">
        <div class="nm">${esc(p.name.replace(/^Cloud /, ''))}</div>
        <div class="cat">${esc((p.sizes || []).join(' · '))}</div>
      </div>
    </div>`;

  return head(`Cloud Paints — the range (${size})`, d,
    `@page { size:${page}; margin:0; }\nbody { zoom:${zoom}; }\n` + POSTER_CSS) + `
<div class="sheet">
  <div class="pad">
    <header class="p-head">
      <div>
        <span class="eyebrow" style="color:var(--red)">Cloudsent Decor Ltd · Nairobi</span>
        <h1 class="p-title mt-1">The <em>Cloud Paints</em> range</h1>
        <p class="p-sub">Paints, coatings and decorative finishes manufactured in Nairobi
          for Kenyan walls, weather and light. Every tin below is made at our Industrial
          Area plant and available in the pack sizes shown.</p>
      </div>
      <img src="${a}/img/brand/logo.png" style="width:30mm" alt="Cloud Paints">
    </header>

    <div class="sec-h"><h2>The paint range</h2><span class="n">${paints.length} lines</span><span class="ln"></span></div>
    <div class="grid">${paints.map(card).join('')}</div>

    <div class="sec-h"><h2>Decorative &amp; textured finishes</h2><span class="n">${textures.length} finishes</span><span class="ln"></span></div>
    <div class="tgrid">${textures.map(tcard).join('')}</div>

    <div class="p-note">
      <div class="kb">
        <img class="kebs" style="width:11mm" src="${a}/img/brand/kebs.png" alt="KEBS Standardisation Mark">
        <div class="fine">Manufactured to the Kenya Bureau of Standards
          Standardisation Mark. Colour matching and tinting available in store.</div>
      </div>
      <div class="grow"></div>
    </div>
  </div>
  ${foot()}
</div>` + tail;
}

/* ============================================================
   4. TRI-FOLD BROCHURE — A4 landscape, two sides
   ------------------------------------------------------------
   Roll fold: the right-hand panel folds in first, then the left
   folds over it. That makes the tucked panel narrower — 96mm
   against 100.5mm — so it does not bind at the spine.

     Side 1 (outside) : [ tuck-in flap ] [ back cover ] [ FRONT COVER ]
     Side 2 (inside)  : [ panel 1 ] [ panel 2 ] [ panel 3 = back of flap ]

   Panel widths mirror between the two sides because the sheet is
   turned over on its vertical axis.
   ============================================================ */
const TRI_CSS = `
@page { size: 297mm 210mm; margin: 0; }
.sheet { --sheet-w:297mm; --sheet-h:210mm; }
.fold { display:flex; width:297mm; height:210mm; }
.pnl  { position:relative; padding:11mm 9mm; display:flex; flex-direction:column; overflow:hidden; }
.pnl--narrow { width:96mm; }
.pnl--wide   { width:100.5mm; }
@media screen { .pnl + .pnl { border-left:.15mm dashed #e6e2d8; } }  /* proofing aid, screen only */

.cover { padding:0; }
.cover-art { height:96mm; overflow:hidden; position:relative; }
.cover-art img { width:100%; height:100%; object-fit:cover; }
.cover-body { flex:1; padding:9mm 9mm 0; display:flex; flex-direction:column; }
.cover h1 { font:400 26pt/1.02 var(--serif); letter-spacing:-.015em; margin:3mm 0 3mm; }
.cover h1 em { font-style:italic; color:var(--accent); }

.bar { height:5mm; background:var(--accent); }

.pnl h2 { font:400 15pt/1.08 var(--serif); letter-spacing:-.01em; margin-bottom:3mm; }
.pnl h3 { font:400 11pt/1.1 var(--serif); }

.item { padding:4mm 0; border-bottom:.25mm solid var(--rule-2); display:flex; gap:4mm; }
.item:last-child { border-bottom:0; }
.item-img { width:17mm; flex:none; display:flex; align-items:flex-start; justify-content:center; }
.item-img img { width:100%; }
.item-img.tex img { border-radius:1mm; height:24mm; object-fit:cover; }
.item-b { flex:1; min-width:0; }
.item-cat { font:600 5.8pt/1.2 var(--sans); letter-spacing:.11em; text-transform:uppercase; color:var(--accent); }
.item-nm  { font:400 10.5pt/1.12 var(--serif); margin:.8mm 0 1.4mm; }
.item-tx  { font:400 7.2pt/1.4 var(--sans); color:var(--ink-2); }
.item-sz  { font:500 6.4pt/1 var(--sans); color:var(--ink-3); letter-spacing:.05em; margin-top:1.6mm; }
.item-feat { margin:2mm 0 0; }
.item-feat li { font-size:6.8pt; margin-bottom:1mm; }
.item-spec { font:500 6.3pt/1.35 var(--sans); color:var(--ink-3); margin-top:2mm;
             padding-top:1.6mm; border-top:.25mm solid var(--rule-2); }

.also { margin-top:5mm; padding-top:3.5mm; border-top:.5mm solid var(--rule); }
.also .k { font:700 6.2pt/1 var(--sans); letter-spacing:.14em; text-transform:uppercase;
           color:var(--ink-3); margin-bottom:2.4mm; }
.also-r { font:400 7.2pt/1.35 var(--sans); color:var(--ink-2); margin-bottom:1.6mm; }
.also-r b { font-weight:600; color:var(--ink); }
.also-r span { display:block; font-size:6.3pt; color:var(--ink-3); }

.cover-calc { margin-top:5mm; padding-top:3.5mm; border-top:.5mm solid var(--rule); }
.cover-calc .k { font:700 6.2pt/1 var(--sans); letter-spacing:.14em; text-transform:uppercase;
                 color:var(--ink-3); margin-bottom:2.6mm; }
.calc { width:100%; border-collapse:collapse; }
.calc th { font:600 5.9pt/1.2 var(--sans); letter-spacing:.1em; text-transform:uppercase;
           color:var(--ink-3); text-align:left; padding:0 0 1.6mm; }
.calc th:last-child, .calc td:last-child { text-align:right; }
.calc td { font:400 7.2pt/1.3 var(--sans); color:var(--ink-2);
           padding:1.6mm 0; border-top:.25mm solid var(--rule-2);
           font-variant-numeric:tabular-nums; }
.calc td b { font-weight:600; color:var(--accent); }

.cbox { background:var(--cream); border-radius:1.6mm; padding:4.5mm; margin-top:4mm; }
.pnl .grow { flex:1; }
.cbox .k { font:700 6.2pt/1 var(--sans); letter-spacing:.14em; text-transform:uppercase; color:var(--ink-3); margin-bottom:2mm; }
.cbox .v { font:400 7.6pt/1.5 var(--sans); color:var(--ink); }
.cbox .v b { font-weight:600; }

.stat { display:flex; gap:5mm; margin:4mm 0; }
.stat div { flex:1; }
.stat .n { font:400 17pt/1 var(--serif); color:var(--accent); }
.stat .l { font:500 6.2pt/1.25 var(--sans); letter-spacing:.08em; text-transform:uppercase; color:var(--ink-3); margin-top:1.2mm; }
`;

/** One product row inside a brochure panel.
 *
 *  Two densities. A brochure covering eleven products needs every row to be
 *  compact; one covering five has three panels to fill and a compact row
 *  leaves the bottom half of each panel empty. The extra room goes to the
 *  things a buyer actually asks — what it does well, and how far a litre
 *  goes — rather than to bigger type. */
function briefItem(p, d, roomy) {
  const src = thumbImage(p, d);
  const spec = p.specs || {};
  const quick = ['Coverage', 'Touch dry', 'Finish']
    .filter(k => spec[k]).map(k => `${k}: ${trim(spec[k], 40)}`).join('  ·  ');
  return `
  <div class="item">
    <div class="item-img${isTexture(p) ? ' tex' : ''}">${src ? `<img src="${src}" alt="${esc(p.name)}">` : ''}</div>
    <div class="item-b" style="${accentVars(p.primary)}">
      <div class="item-cat">${esc(p.cat_label)}</div>
      <div class="item-nm">${esc(p.name)}</div>
      <div class="item-tx">${esc(roomy ? sentences(p.short, 240) : firstSentence(p.short, 118))}</div>
      ${roomy && (p.features || []).length ? `
      <ul class="ticks ticks--tight item-feat">
        ${p.features.slice(0, 3).map(f => `<li>${esc(trim(f, 54))}</li>`).join('')}
      </ul>` : ''}
      ${roomy && quick ? `<div class="item-spec">${esc(quick)}</div>` : ''}
      <div class="item-sz">${esc((p.sizes || []).join(' · '))}</div>
    </div>
  </div>`;
}

/** Products with no print-quality photograph still belong in the brochure —
 *  they just do not get a picture slot that would sit empty. */
function alsoList(list) {
  if (!list.length) return '';
  return `
  <div class="also">
    <div class="k">Also in the range</div>
    ${list.map(p => `<div class="also-r"><b>${esc(p.name)}</b>
      <span>${esc(p.cat_label)} · ${esc((p.sizes || []).join(' · '))}</span></div>`).join('')}
  </div>`;
}

/** How much paint to buy.
 *  The question every counter gets asked, answered from the range's own
 *  10–12 m² per litre. Deliberately rounded up: sending someone home half a
 *  litre short costs them a second trip and a batch that may not match. */
function coverageBlock() {
  const rows = [
    ['Small bedroom', '~20 m²', '4 L'],
    ['Large bedroom', '~40 m²', '8 L'],
    ['Living room', '~60 m²', '11 L'],
    ['Small house, inside', '~100 m²', '18 L'],
  ];
  return `
  <div class="cover-calc">
    <div class="k">How much will you need?</div>
    <table class="calc">
      <tr><th></th><th>Wall area</th><th>Two coats</th></tr>
      ${rows.map(([a, b, c]) =>
        `<tr><td>${esc(a)}</td><td>${esc(b)}</td><td><b>${esc(c)}</b></td></tr>`).join('')}
    </table>
    <div class="fine mt-1">Based on 10–12 m² per litre on a smooth, primed surface.
      Textured, porous or previously unpainted walls take more — bring your
      measurements and we will work it out with you.</div>
  </div>`;
}

/** Spread the products across three panels by how much room each actually
 *  has. Panel 1 loses height to the section introduction and panel 3 to the
 *  coverage table, so an equal split leaves the last panel half empty. */
function allot(n, caps) {
  const total = caps.reduce((a, b) => a + b, 0);
  const exact = caps.map(c => n * c / total);
  const base = exact.map(Math.floor);
  let left = n - base.reduce((a, b) => a + b, 0);
  // largest remainder takes what rounding left over
  exact.map((e, i) => [e - base[i], i]).sort((x, y) => y[0] - x[0])
    .forEach(([, i]) => { if (left > 0) { base[i]++; left--; } });
  return base;
}

function brochure(cfg) {
  const d = 2;
  const a = assets(d);
  const all = cfg.slugs.map(s => bySlug[s]).filter(Boolean);
  // Only products we can show go in the picture rows; the rest are listed.
  const items = all.filter(p => heroImage(p, d));
  const noArt = all.filter(p => !heroImage(p, d));
  /* Does each product get the long treatment — a full description, its
     feature list and a spec line — or the short one? The threshold was set
     when Wood & Metal had five photographed products. It has eight now that
     Varnish Stain, Metal Primer and Universal Undercoat have been shot, and
     eight long entries do not fit three panels. Six is the real boundary:
     Interior and Exterior stay long at five each, Wood & Metal goes short. */
  const roomy = items.length <= 6;

  const calcPanel = noArt.length > 3 ? 1 : 2;
  const sizes = allot(items.length, [150, 188, Math.max(40, 100 - noArt.length * 8)]);
  const chunks = [];
  let at = 0;
  for (const s of sizes) { chunks.push(items.slice(at, at + s)); at += s; }

  const backCover = `
    <div class="pnl pnl--wide">
      <img src="${a}/img/brand/logo.png" style="width:30mm" alt="Cloud Paints" class="mb-3">
      <h2>Come and see the <em style="font-style:italic;color:var(--accent)">colour.</em></h2>
      <p class="body-sm mb-3">Bring a photograph, a fabric or a paint chip to the Industrial
        Area counter and we will match it, mix it and tell you honestly how much you need.</p>

      <div class="cbox" style="margin-top:0">
        <div class="k">Talk to us</div>
        <div class="v">
          <b>${esc(CO.phones[0])}</b> · WhatsApp<br>
          ${esc(CO.phones[1])}<br>${esc(CO.phones[2])}<br>
          ${esc(CO.email)}
        </div>
      </div>

      <div class="cbox">
        <div class="k">Find us</div>
        <div class="v">
          <b>${esc(CO.street)}</b><br>
          ${esc(CO.area)}<br>${esc(CO.box)}<br>
          <span class="fine">${esc(CO.hours)}</span>
        </div>
      </div>

      <div class="grow"></div>
      <div class="row mt-3" style="align-items:center;gap:4mm">
        <img class="kebs" src="${a}/img/brand/kebs.png" alt="KEBS Standardisation Mark">
        <div class="fine">Manufactured in Nairobi by ${esc(CO.legal)} to the
          Kenya Bureau of Standards Standardisation Mark.</div>
      </div>
      <div class="fine mt-2" style="color:var(--accent);font-weight:600">${esc(CO.web)}</div>
    </div>`;

  const frontCover = `
    <div class="pnl pnl--wide cover">
      <div class="cover-art"><img src="${a}/img/${cfg.cover}" alt=""></div>
      <div class="bar"></div>
      <div class="cover-body">
        <img src="${a}/img/brand/logo.png" style="width:34mm" alt="Cloud Paints">
        <h1 class="mt-2">${cfg.title}</h1>
        <p class="body-sm">${esc(cfg.kicker)}</p>
        <div class="grow"></div>
        <div class="fine mb-3">${esc(CO.legal)} · ${esc(CO.web)}</div>
      </div>
    </div>`;

  const flapOut = `
    <div class="pnl pnl--narrow">
      <span class="eyebrow">Why Cloud Paints</span>
      <h2 class="mt-1">Made here, for <em style="font-style:italic;color:var(--accent)">here.</em></h2>
      <p class="body-sm mb-2">${esc(cfg.flap)}</p>

      <div class="stat">
        <div><div class="n">2018</div><div class="l">Manufacturing<br>since</div></div>
        <div><div class="n">${P.length}</div><div class="l">Products<br>in the range</div></div>
      </div>

      <ul class="ticks ticks--tight mt-1">
        <li>Mixed and tinted to your colour at the counter</li>
        <li>Trade and contractor rates for stockists and painters</li>
        <li>Technical datasheets for every line</li>
        <li>Delivery across Nairobi and upcountry</li>
      </ul>

      <div class="grow"></div>
      <div class="cbox">
        <div class="k">Order or enquire</div>
        <div class="v"><b>${esc(CO.whatsapp)}</b><br>${esc(CO.email)}</div>
      </div>
    </div>`;

  const insidePanel = (list, i) => `
    <div class="pnl ${i === 2 ? 'pnl--narrow' : 'pnl--wide'}">
      ${i === 0 ? `<span class="eyebrow">${esc(cfg.eyebrow)}</span>
        <h2 class="mt-1 mb-2">${cfg.insideTitle}</h2>
        <p class="body-sm mb-2">${esc(cfg.intro)}</p>` : ''}
      ${list.map(p => briefItem(p, d, roomy)).join('')}
      ${i === 2 ? alsoList(noArt) : ''}
      ${i === calcPanel ? coverageBlock() : ''}
      ${i === 2 ? `<div class="cbox">
        <div class="k">Not sure which?</div>
        <div class="v">Tell us the surface and where it is — inside, outside,
          wood, metal or roof — and we will tell you exactly what to buy and how much.
          <br><b>${esc(CO.whatsapp)}</b></div>
      </div>` : ''}
    </div>`;

  // Both sides in one document: page 1 prints on the front of the sheet,
  // page 2 on the back. Duplex, flip on the SHORT edge.
  return head(`Cloud Paints — ${cfg.name} brochure`, d,
    `${TRI_CSS}\n.sheet{${accentVars(cfg.accent)}}`) + `
<!-- PAGE 1 · OUTSIDE — left to right: tuck-in flap | back cover | front cover -->
<div class="sheet"><div class="fold">${flapOut}${backCover}${frontCover}</div></div>

<!-- PAGE 2 · INSIDE — left to right: panel 1 | panel 2 | panel 3 (backs the flap) -->
<div class="sheet"><div class="fold">
  ${insidePanel(chunks[0], 0)}${insidePanel(chunks[1], 1)}${insidePanel(chunks[2], 2)}
</div></div>` + tail;
}

/* ============================================================
   4b. RANGE FLIER — folded once, four panels
   ------------------------------------------------------------
   A half fold, not a tri-fold: four panels, which is what
   "cover, two inner sheets, back" describes.

     Page 1 (outside) :  [ BACK COVER ] [ FRONT COVER ]
     Page 2 (inside)  :  [ INNER LEFT ] [ INNER RIGHT ]

   Fold left half over right with the inside face up. The panel
   behind the front cover is the inner left, so nothing on the
   spread is interrupted by the fold. A half fold needs no
   tuck-in allowance, so all four panels are full width.

   Two sizes, both from this one template: an A3 sheet that folds
   to A4, and an A4 sheet that folds to A5. Type and spacing are
   tokenised per size rather than scaled, so the small one stays
   readable instead of becoming a 70% photocopy.
   ============================================================ */
/* Type runs about a fifth larger than it did. The A5 fold in particular was
   set for someone holding it still under good light; at arm's length on a
   site it was small. The character budgets (txLen, noteLen) come DOWN by
   roughly the same proportion — bigger type in the same box means fewer
   words, and the alternative is copy that overflows and is silently cut. */
/* ============================================================
   What each product is FOR — one complete sentence
   ============================================================
   The catalogue's `short` is written for the website, where a
   product card has room for two or three sentences. Dropped into a
   flier cell 39mm wide it did not fit, so it was cut to a character
   budget and the cut was marked with an ellipsis: "Superior
   alkyd-based high gloss with excellent flow…". Fifteen products,
   most of them trailing off mid-thought. A price list may abbreviate;
   a range flier is the thing a customer reads to find out what a
   product does, and half a sentence does not tell them.
   
   So the flier gets its own line per product: one sentence, saying
   what the product is for, written to the width it has to live in.
   Every one is drawn from that product's own `short`, `cat_label`
   and `uses` in js/products-data.js — this is the same information
   set tighter, not new claims about the paint. Facts that can go out
   of date (sizes, coverage, prices) are still read from the
   catalogue at build time and are not repeated here.
   
   Keep them under ~100 characters and ending in a full stop. Both
   folds check it: see the assertion in flierLine below. */
const FLIER_LINE = {
  'silk-vinyl':          'A silky low-sheen finish for interior walls, easy to wipe clean in busy homes and offices.',
  'vinyl-matt':          'A brilliant long-lasting white with a smooth non-reflective matt finish, inside and out.',
  'iris-economy':        'An economy emulsion for interior walls and ceilings, with good hiding power over large areas.',
  'supermatt':           'The smooth matt base coat under Cloud Paints decorative top coats, with excellent coverage.',
  'weatherguard':        'An exterior wall finish with silicone that repels water and holds colour through harsh weather.',
  'rocketex':            'A super-premium acrylic textured coating that hides surface imperfections on walls and façades.',
  'super-gloss':         'A quick-drying high gloss for interior and exterior wood and metal, tough and hard-wearing.',
  'gloss-enamel':        'An oil-based gloss enamel for wood, metal and plaster, inside and out.',
  'clear-varnish':       'A quick-drying multipurpose clear varnish for doors, trim, furniture and interior joinery.',
  'varnish-stain':       'A tinted polyurethane varnish that stains and protects timber in a single coat.',
  'metal-primer':        'An anti-corrosive primer for gates, grilles and other ferrous metal before top coating.',
  'universal-undercoat': 'An all-purpose undercoat giving wood, metal and primed masonry a smooth base for any top coat.',
  'roof-paint':          'A durable flexible coating for galvanised roofing sheets and exposed steelwork.',
  'road-marking':        'A fast-drying high-opacity paint for road, car park and warehouse floor markings.',
  'turpentine':          'A professional pine-derived thinner for oil-based paints, enamels and varnishes.',
};

/* Resolve a product to its flier line. The table above is the answer for
   everything the flier shows today. The fallback exists so that adding a
   product to a panel renders something COMPLETE rather than something cut:
   whole sentences that fit, else the shortest single sentence, else the
   clause before an em-dash, else the tagline. Each of those ends where a
   thought ends. Nothing here can emit an ellipsis, and the assertion says so
   out loud if a hand-written line is ever edited past the width it has. */
function flierLine(p, max) {
  const written = FLIER_LINE[p.slug];
  if (written) {
    if (written.length > max) {
      console.warn('  ! flier line for ' + p.slug + ' is ' + written.length
        + ' chars, budget ' + max + ' — it will wrap further than the cell allows');
    }
    return written;
  }

  const t = String(p.short || p.full || '').replace(/\s+/g, ' ').trim();
  const parts = t.match(/[^.!?]+[.!?]+(\s|$)/g) || (t ? [t] : []);

  let run = '';
  for (const s of parts) { if ((run + s).trim().length > max) break; run += s; }
  if (run.trim()) return run.trim();

  const shortest = parts.map(s => s.trim()).filter(s => s.length <= max)
    .sort((a, b) => a.length - b.length)[0];
  if (shortest) return shortest;

  const clause = t.split(/\s+—\s+/)[0].trim().replace(/[,;:]$/, '');
  if (clause && clause.length <= max) return clause + '.';

  const tag = String(p.tagline || '').replace(/\s+/g, ' ').trim();
  if (tag) return tag.replace(/[.\s]+$/, '') + '.';

  return t.slice(0, max);
}

const RANGE_SIZES = {
  A4: { sheet: '420mm 297mm', w: '420mm', h: '297mm', panel: '210mm', k: 1,
        frame: '8mm', pad: '17mm',
        logo: '46mm', kebs: '20mm', h1: '48pt', kick: '12.2pt', strap: '15pt',
        sw: '7mm', lineH: '78mm', tinH: '46mm', tinGap: '3mm', rowIn: '4mm', rowUp: '26mm',
        lineup: ['silk-vinyl', 'weatherguard', 'vinyl-matt', 'supermatt', 'rocketex'],
        footFs: '8.4pt',
        ipH2: '22pt', cols: 3, gridGap: '7mm 5mm', cellImg: '38mm', cellImgShort: '74mm',
        nm: '11.4pt', tx: '7.8pt', sz: '7.2pt', txLen: 110,
        bcH3: '19.5pt', bcV: '8.8pt', restB: '9.2pt', restS: '7.6pt', aboutFs: '9.4pt',
        secGap: '8mm', calc: true, aboutParas: 2, ticks: 5, noteLen: 240 },
  A5: { sheet: '297mm 210mm', w: '297mm', h: '210mm', panel: '148.5mm', k: 0.707,
        frame: '5.5mm', pad: '12mm',
        logo: '33mm', kebs: '14mm', h1: '31pt', kick: '8.8pt', strap: '10.6pt',
        sw: '5mm', lineH: '55mm', tinH: '26mm', tinGap: '2mm', rowIn: '7mm', rowUp: '22mm',
        lineup: ['silk-vinyl', 'weatherguard', 'vinyl-matt', 'iris-economy', 'supermatt', 'rocketex'],
        footFs: '6.9pt',
        ipH2: '15.5pt', cols: 3, gridGap: '5mm 3.5mm', cellImg: '19mm', cellImgShort: '46mm',
        nm: '8.8pt', tx: '6.6pt', sz: '6.2pt', txLen: 110,
        bcH3: '13.8pt', bcV: '7.2pt', restB: '7.6pt', restS: '6.5pt', aboutFs: '7.4pt',
        secGap: '4mm', calc: false, aboutParas: 2, ticks: 5, noteLen: 135, cellImg2: '29mm' },
};

/* The eight paint colours the website mixes its decorative fields from.
   On the cover they become a swatch strip — the most direct way for a paint
   company to say "we make colour" without writing the sentence. */
const SWATCHES = ['#d92843', '#e8a317', '#1e3a8a', '#166534',
                  '#6e3122', '#84cc16', '#5a4374', '#d6b884'];

/* "Buy it… Paint it… Love it..!" in the brand's own colours — blue, red,
   blue, the way the tagline is set beneath the logo itself.
   The literal brand navy is unreadable on the cover's dark ground, so each
   word takes a lightened version of the same hue. It reads as the brand
   pairing at a glance; the true #1e3a8a and #e11f29 are used wherever the
   tagline sits on white. */
function strapColoured() {
  const parts = CO.strap.split('…').map(t => t.trim()).filter(Boolean);
  const tone = ['s-blue', 's-red', 's-blue'];
  return parts
    .map((t, i) => `<span class="${tone[i % 3]}">${esc(t)}</span>`)
    .join('<span class="s-dot">·</span>');
}

const rangeCss = z => `
@page { size: ${z.sheet}; margin: 0; }
.sheet { --sheet-w:${z.w}; --sheet-h:${z.h}; --k:${z.k}; }
.fold { display:flex; width:${z.w}; height:${z.h}; }
.pnl  { position:relative; width:${z.panel}; height:${z.h}; overflow:hidden; }
@media screen { .pnl + .pnl { border-left:.15mm dashed rgba(0,0,0,.25); } }

/* A hairline frame on every panel, inset from the trim. It gives the piece a
   held edge when it is folded, and it is what stops four full-bleed panels
   reading as four unrelated sheets. */
.frame { position:absolute; inset:${z.frame}; border:.3mm solid var(--fr, var(--rule));
         z-index:4; pointer-events:none; }

/* ---- cover ----
   The ground is the website's opening hero, flattened for print. On screen
   that is a dark plum base with three blurred pools drifting over it — a
   crimson top-left, a deep blue top-right and an amber low centre — composited
   with mix-blend-mode: screen. Blend modes and 74px blurs are not things to
   hand a press, so the same composition is rebuilt as four stacked radial
   gradients with ordinary painting: same hues, same positions, same feel,
   and it rasterises cleanly. */
.cover {
  color:#fff; --fr:rgba(255,255,255,.32);
  background:
    radial-gradient(58% 46% at 14% 6%,  rgba(150,20,52,.85),  transparent 68%),
    radial-gradient(56% 44% at 88% 4%,  rgba(30,40,132,.82),  transparent 68%),
    radial-gradient(70% 40% at 56% 96%, rgba(150,100,18,.55), transparent 70%),
    radial-gradient(140% 110% at 62% 46%, #241030, #0b0610 72%);
}

/* Shapes, in the brand palette, sized off one multiplier so the small fold
   keeps the same composition rather than a different one. */
.cover i { position:absolute; display:block; }
/* Held right back now the ground carries the colour. At their old weight
   the band and the blob cut straight across the gradient's pools and the
   cover read as two designs arguing. */
.sh-ring { width:calc(168mm * var(--k)); height:calc(168mm * var(--k));
           right:calc(-58mm * var(--k)); top:calc(-52mm * var(--k));
           border-radius:50%; border:calc(11mm * var(--k)) solid rgba(232,163,23,.10); }
.sh-band { left:calc(-24mm * var(--k)); right:calc(-24mm * var(--k));
           height:calc(30mm * var(--k)); bottom:calc(74mm * var(--k));
           background:rgba(139,30,44,.16); transform:rotate(-5.5deg); }
.sh-blob { width:calc(48mm * var(--k)); height:calc(48mm * var(--k));
           left:calc(-16mm * var(--k)); bottom:calc(104mm * var(--k));
           border-radius:50%; background:rgba(37,71,184,.16); }
.sh-bar  { right:0; width:calc(3.4mm * var(--k)); top:0; bottom:0;
           background:linear-gradient(180deg,var(--red-glow),var(--gold) 55%,var(--blue-2)); }

/* Bounded at the bottom by the line-up it sits above. With a zero bottom inset the
   column ran the full height of the panel, so the tagline flowed down into
   the tins and the standards mark was drawn straight over it. */
.cover-in { position:absolute; z-index:2;
            top:${z.pad}; left:${z.pad}; right:${z.pad};
            bottom:calc(${z.rowUp} + ${z.tinH} + ${z.kebs} + 9mm);
            display:flex; flex-direction:column; align-items:center;
            justify-content:center; text-align:center; }
.cover-in .swatch { justify-content:center; }
/* The logo alone, centred, and larger than it was. The standards mark used
   to share this chip, which made it look like part of the brand rather than
   a certification of the product; it has moved down to the tins. */
.cover .chip { background:#fff; border-radius:2mm; padding:3.4mm 5mm;
               display:inline-flex; align-items:center; align-self:center; }
.cover .chip > img:first-child { width:${z.logo}; }

.swatch { display:flex; gap:1.2mm; }
.swatch i { position:static; width:${z.sw}; height:calc(${z.sw} * .62); border-radius:.8mm; }

.cover h1 { font:400 ${z.h1}/0.98 var(--serif); letter-spacing:-.02em; color:#fff; }
.cover h1 em { font-style:italic; color:var(--gold-2, #ffc93d); }
.cover .kick { font:400 ${z.kick}/1.55 var(--sans); color:rgba(255,255,255,.86); }
.cover .strap { font:400 italic ${z.strap}/1.3 var(--serif); }
.cover .strap .s-blue { color:#8fb0ff; }
.cover .strap .s-red  { color:#ff5f70; }
.cover .strap .s-dot  { color:rgba(255,255,255,.42); margin:0 .5em; font-style:normal; }
.cover .rule-g { height:.8mm; width:calc(34mm * var(--k)); background:var(--gold); }

.cover-line { position:absolute; left:0; right:0; bottom:0;
              height:${z.lineH}; z-index:2; }
/* Directly above the line-up, so the mark reads as certifying what is
   underneath it. Positioned against the panel, clear of the tins. */
.cover-mark { position:absolute; left:${z.frame}; right:${z.frame};
              bottom:calc(${z.rowUp} + ${z.tinH} + 4mm);
              display:flex; align-items:center; justify-content:center;
              gap:2.4mm; z-index:3; }
.cover .cover-mark img { height:${z.kebs}; width:auto; background:#fff;
                         padding:1mm; border-radius:1mm; flex:none; }
.cover-mark span { font:500 calc(${z.footFs} * .96)/1.25 var(--sans); text-align:left;
                   color:rgba(255,255,255,.9); }
.cover-mark b { display:block; color:var(--gold); font-weight:700;
                letter-spacing:.14em; text-transform:uppercase;
                font-size:calc(${z.footFs} * .84); }

.cover-line .row { position:absolute; left:${z.rowIn}; right:${z.rowIn}; bottom:${z.rowUp};
                   display:flex; align-items:flex-end; justify-content:center; gap:${z.tinGap}; }
.cover-line img { height:${z.tinH}; width:auto; flex:none; }

.cover-foot { position:absolute; left:${z.frame}; right:${z.frame}; bottom:${z.frame};
              background:rgba(0,0,0,.34); padding:3.4mm 5mm; display:flex;
              justify-content:space-between; gap:5mm;
              font:500 ${z.footFs}/1.4 var(--sans); color:rgba(255,255,255,.92); z-index:5; }
.cover-foot b { color:var(--gold); font-weight:600; letter-spacing:.1em;
                text-transform:uppercase; font-size:calc(${z.footFs} * .88); }

/* ---- inner panels ---- */
.ip { position:absolute; inset:${z.pad}; display:flex; flex-direction:column; }
.ip-head { display:flex; align-items:baseline; gap:4mm; padding-bottom:3mm;
           border-bottom:.8mm solid var(--accent); margin-bottom:5mm; }
.ip-head h2 { font:400 ${z.ipH2}/1 var(--serif); color:var(--ink); letter-spacing:-.01em; }
.ip-head .n { font:600 6.8pt/1 var(--sans); letter-spacing:.15em; text-transform:uppercase;
              color:var(--ink-3); margin-left:auto; }
.ip-note { font:400 ${z.tx}/1.5 var(--sans); color:var(--ink-2); margin-bottom:5mm; }

.pgrid { display:grid; grid-template-columns:repeat(${z.cols}, 1fr);
         gap:${z.gridGap}; flex:1; align-content:start; }
.pcell { display:flex; flex-direction:column; }
.pcell-img { height:var(--cell-img, ${z.cellImg}); display:flex; align-items:flex-end;
             justify-content:center; margin-bottom:3mm; }
.pcell-img img { max-height:100%; width:auto; }
/* Two lines' worth of room whether the category needs one or two. Several
   run long — "Interior & Exterior Wall Paint", "Gloss Enamel - Wood & Metal" —
   and a wrapping label pushed its product name a line lower than the one
   beside it, so nothing across a row lined up. */
.pcell .cat { font:600 5.8pt/1.25 var(--sans); letter-spacing:.11em; text-transform:uppercase;
              color:var(--pc); min-height:calc(5.8pt * 1.25 * 2); }
.pcell .nm  { font:400 ${z.nm}/1.1 var(--serif); color:var(--ink); margin:1mm 0 1.6mm; }
.pcell .tx  { font:400 ${z.tx}/1.42 var(--sans); color:var(--ink-2); flex:1; }
.pcell .sz  { font:500 ${z.sz}/1 var(--sans); color:var(--ink-3); letter-spacing:.05em;
              margin-top:2.4mm; padding-top:2mm; border-top:.25mm solid var(--rule-2);
              font-variant-numeric:tabular-nums; }

/* ---- back cover ---- */

/* "What you get" reads as a list of things offered, so the marker points
   forward rather than confirming something already done. A shaded plate with
   a solid arrow on it — both drawn in CSS, because a glyph like ▸ would make
   the renderer reach past Fraunces and Inter and embed a whole third font to
   draw one shape. The tick stays everywhere else in the package. */
.bc-ticks li { padding-left:6.6mm; margin-bottom:2mm;
               font:400 ${z.bcV}/1.42 var(--sans); color:var(--ink-2); }
.bc-ticks li::before {
  content:''; position:absolute; left:0; top:.35mm;
  width:4.2mm; height:4.2mm; border-radius:.9mm;
  background:var(--accent-soft); border:0; transform:none;
}
.bc-ticks li::after {
  content:''; position:absolute; left:1.65mm; top:1.4mm;
  width:0; height:0;
  border-left:1.5mm solid var(--accent);
  border-top:1.05mm solid transparent;
  border-bottom:1.05mm solid transparent;
}

.bc { position:absolute; inset:${z.pad}; display:flex; flex-direction:column; }
.bc .mt-4 { margin-top:${z.secGap}; }
.bc-h { font:700 7pt/1 var(--sans); letter-spacing:.15em; text-transform:uppercase;
        color:var(--blue); padding-bottom:2.4mm; border-bottom:.3mm solid var(--rule);
        margin-bottom:4mm; }

.about { font:400 ${z.aboutFs}/1.6 var(--sans); color:var(--ink-2); }
.about b { color:var(--ink); font-weight:600; }
.about + .about { margin-top:2.6mm; }

.also2 { display:grid; grid-template-columns:1fr 1fr; gap:2.6mm 6mm; }
.also2 .r b { font:600 ${z.restB}/1.2 var(--sans); color:var(--ink); display:block; }
.also2 .r span { font:400 ${z.restS}/1.3 var(--sans); color:var(--ink-3); }



.bc-calc { margin-top:${z.secGap}; }
.bc-calc .cover-calc { margin-top:0; padding-top:3.5mm; border-top:.5mm solid var(--rule); }
.bc-calc .cover-calc .k { font:700 ${z.restS}/1 var(--sans); letter-spacing:.14em;
        text-transform:uppercase; color:var(--ink-3); margin-bottom:2.6mm; }
.bc-calc .calc { width:100%; border-collapse:collapse; }
.bc-calc .calc th { font:600 ${z.restS}/1.2 var(--sans); letter-spacing:.1em;
        text-transform:uppercase; color:var(--ink-3); text-align:left; padding:0 0 1.6mm; }
.bc-calc .calc th:last-child, .bc-calc .calc td:last-child { text-align:right; }
.bc-calc .calc td { font:400 ${z.bcV}/1.3 var(--sans); color:var(--ink-2);
        padding:1.5mm 0; border-top:.25mm solid var(--rule-2); font-variant-numeric:tabular-nums; }
.bc-calc .calc td b { font-weight:600; color:var(--blue); }
.bc-calc .fine { margin-top:2mm; }

/* the contact block sits inside the frame rather than bleeding past it */
.bc-contact { margin-top:auto; background:var(--blue-deep); color:#fff;
              border-radius:1.6mm; padding:5.5mm 6mm 6mm; }
.bc-contact h3 { font:400 ${z.bcH3}/1.1 var(--serif); color:#fff; margin-bottom:4mm; }
.bc-contact h3 em { font-style:italic; color:var(--gold); }
.bc-grid { display:grid; grid-template-columns:1fr 1fr; gap:4.5mm 7mm; }
.bc-grid .k { font:600 6.2pt/1 var(--sans); letter-spacing:.14em; text-transform:uppercase;
              color:var(--gold); margin-bottom:1.6mm; }
.bc-grid .v { font:400 ${z.bcV}/1.45 var(--sans); color:rgba(255,255,255,.88); }
.bc-grid .v b { color:#fff; font-weight:600; }
`;

function rangeFlier(size) {
  const d = 1;
  const a = assets(d);
  const z = RANGE_SIZES[size];

  // The twelve studio tins, split so each inner panel holds one clear idea.
  /* Metal Primer, Universal Undercoat and Varnish Stain have photographs now,
     so they move out of the "Also in the range" list on the back and into the
     spread. All three are primers and wood finishes, so they belong with the
     trade panel — which takes it to nine, and the grid to three columns. The
     wall panel keeps its six and uses the same three columns, so both sides
     of the spread share one rhythm and only the row count differs. */
  const WALLS = ['silk-vinyl', 'vinyl-matt', 'iris-economy', 'supermatt', 'weatherguard', 'rocketex'];
  const TRADE = ['super-gloss', 'gloss-enamel', 'clear-varnish', 'varnish-stain',
                 'metal-primer', 'universal-undercoat', 'roof-paint', 'road-marking', 'turpentine'];
  const shown = new Set([...WALLS, ...TRADE]);

  // Everything tinned that has no studio photograph, listed rather than shown.
  const rest = P.filter(p => !isTexture(p) && !shown.has(p.slug));

  const cell = slug => {
    const p = bySlug[slug];
    return `
    <div class="pcell" style="--pc:${readable(p.primary)}">
      <div class="pcell-img"><img src="${heroImage(p, d)}" alt="${esc(p.name)}"></div>
      <div class="cat">${esc(p.cat_label)}</div>
      <div class="nm">${esc(p.name)}</div>
      <div class="tx">${esc(flierLine(p, z.txLen))}</div>
      <div class="sz">${esc((p.sizes || []).join(' · '))}</div>
    </div>`;
  };

  /* Six products in three columns is two rows; nine is three. Left at one
     fixed tin height the shorter panel finished a third of the way up the
     page with a hole under it. So the panel works out its own row count and
     sizes the tin to fill the height it actually has — the two sides of the
     spread end level, and the wall tins get to be larger, which they can
     carry: they are the high-resolution photographs in the set. */
  const innerPanel = (title, note, slugs, accent) => {
    const rows = Math.ceil(slugs.length / z.cols);
    const img = rows <= 2 ? z.cellImgShort : z.cellImg;
    return `
    <div class="pnl" style="${accentVars(accent)};--cell-img:${img}">
      <div class="frame"></div>
      <div class="ip">
        <div class="ip-head">
          <h2>${title}</h2>
          <span class="n">${slugs.length} lines</span>
        </div>
        <p class="ip-note">${esc(sentences(note, z.noteLen))}</p>
        <div class="pgrid">${slugs.map(cell).join('')}</div>
      </div>
    </div>`;
  };

  const frontCover = `
    <div class="pnl cover">
      <i class="sh-ring"></i>
      <i class="sh-blob"></i>
      <i class="sh-band"></i>
      <i class="sh-bar"></i>
      <div class="frame"></div>

      <div class="cover-in">
        <span class="chip">
          <img src="${a}/img/brand/logo.png" alt="Cloud Paints">
        </span>
        <div class="rule-g mt-3"></div>
        <h1 class="mt-2">The complete<br><em>Cloud Paints</em> range</h1>
        <div class="swatch mt-2">
          ${SWATCHES.map(c => `<i style="background:${c}"></i>`).join('')}
        </div>
        <p class="kick mt-2">Paints, coatings and decorative finishes manufactured in
          Industrial Area, Nairobi — made for Kenyan walls, Kenyan weather and Kenyan
          light, from the primer that goes on first to the topcoat everybody sees.</p>
        <p class="kick mt-1">Every tin is mixed and tinted to your colour at our factory,
          carries the KEBS Standardisation Mark, and comes with a technical datasheet.</p>
        <p class="strap mt-2">${strapColoured()}</p>
      </div>

      <!-- The standards mark sits with the product it certifies, not tucked
           into the logo lockup where it reads as part of the brand. Kept a
           sibling of .cover-line rather than a child: inside it, the rule
           that sizes the tins to 30mm matched this image too and blew the
           mark up to tin height, straight over the tagline. -->
      <div class="cover-mark">
        <img src="${a}/img/brand/kebs.png" alt="KEBS Standardisation Mark">
        <span><b>KEBS</b>Standardisation Mark</span>
      </div>

      <div class="cover-line">
        <div class="row">
          ${z.lineup
            .map(s => `<img src="${heroImage(bySlug[s], d)}" alt="${esc(bySlug[s].name)}">`).join('')}
        </div>
      </div>

      <div class="cover-foot">
        <span><b>Manufactured by</b><br>${esc(CO.legal)} · ${esc(CO.area)}</span>
        <span style="text-align:right"><b>Find us</b><br>${esc(CO.web)} · ${esc(CO.phones[0])}</span>
      </div>
    </div>`;

  const backCover = `
    <div class="pnl" style="${accentVars('#1e3a8a')}">
      <div class="frame"></div>
      <div class="bc">
        <div class="bc-h">About Cloud Paints</div>
        <p class="about"><b>Cloud Paints is the flagship brand of Cloudsent Decor Ltd</b>,
          a Nairobi Manufacturer of Decorative Paints, Coatings and Solvents. We spent a
          decade in home décor, interior planning and gypsum fitting before we started
          making the paint ourselves — customer after customer asked where we sourced it,
          and whether they could buy the same quality for their own projects.</p>
        ${z.aboutParas > 1 ? `<p class="about">So we built the plant. Everything is manufactured at Industrial
          Area, Nairobi, to KEBS standards. All products are tested and awarded a Quality
          Standardisation Mark, and we know what Kenyan sun, rain and dust do to a wall
          because we have spent years repainting them. Bring a colour of your choice from
          our charts, or any colour chart or paint sample, to the company and we will
          match it, mix it, and tell you honestly the quantity of paint you need.</p>` : ''}

        <div class="bc-h mt-4">Also in the range</div>
        <div class="also2">
          ${rest.map(p => {
            const cat = p.cat_label && p.cat_label.toLowerCase() !== p.name.toLowerCase()
              ? esc(p.cat_label) + ' · ' : '';
            return `<div class="r"><b>${esc(p.name)}</b>
            <span>${cat}${esc((p.sizes || []).join(' · '))}</span></div>`;
          }).join('')}
        </div>

        <div class="bc-h mt-4">What you get at the counter</div>
        <ul class="ticks ticks--tight bc-ticks">
          <li>Mixed and tinted to your colour while you wait</li>
          <li>Trade and contractor rates for stockists and painters</li>
          <li>A technical datasheet for every line in the range</li>
          ${z.ticks > 3 ? `<li>Delivery across Nairobi and upcountry</li>
          <li>Colour matching from a photograph, a fabric or a chip</li>` : ''}
        </ul>

        ${z.calc ? `<div class="bc-calc">${coverageBlock()}</div>` : ''}

        <div class="bc-contact">
          <h3>Come and see the <em>colour.</em></h3>
          <div class="bc-grid">
            <div>
              <div class="k">Call or WhatsApp</div>
              <div class="v"><b>${esc(CO.phones[0])}</b><br>${esc(CO.phones[1])}<br>${esc(CO.phones[2])}</div>
            </div>
            <div>
              <div class="k">Visit the counter</div>
              <div class="v"><b>${esc(CO.street)}</b><br>${esc(CO.area)}<br>${esc(CO.box)}</div>
            </div>
            <div>
              <div class="k">Email</div>
              <div class="v">${esc(CO.email)}<br>${esc(CO.web)}</div>
            </div>
            <div>
              <div class="k">Opening hours</div>
              <div class="v">${esc(CO.hours)}<br>Sunday &amp; public holidays closed</div>
            </div>
          </div>
        </div>
      </div>
    </div>`;

  return head(`Cloud Paints — the complete range (folds to ${size})`, d, rangeCss(z)) + `
<!-- PAGE 1 · OUTSIDE — left to right: back cover | front cover -->
<div class="sheet"><div class="fold">${backCover}${frontCover}</div></div>

<!-- PAGE 2 · INSIDE — left to right: inner left | inner right -->
<div class="sheet"><div class="fold">
  ${innerPanel('Walls, Inside and Out',
    'Sheen is the decision most people get wrong. Silk lifts colour and wipes clean; matt hides an uneven wall and calms a bright room. Weatherguard and Rocketex take the weather outside, and SuperMatt is the base that makes any of them last.',
    WALLS, '#1e3a8a')}
  ${innerPanel('Wood, Metal, Roofs &amp; Road',
    'Doors, Frames, Grills, Gates, Balustrades, Roofs and Car Parks all take a beating. These are the hard-drying finishes for them — and the thinner that keeps the brushes usable afterwards.',
    TRADE, '#8b1e2c')}
</div></div>` + tail;
}

/* ============================================================
   5. PRICE LIST — A4, paginated
   ------------------------------------------------------------
   Cards are a fixed height, so pages are packed here rather than
   left to the browser: that keeps a group heading from stranding
   at the foot of a page with no rows under it.
   ============================================================ */
/* Drawn here rather than linked, because the package has no icon set and a
   three-icon dependency is not worth one. Stroked shapes, no fills to trap,
   and they scale to whatever the row asks for. */
const ICON = {
  instagram: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1">
    <rect x="3" y="3" width="18" height="18" rx="5.2"/><circle cx="12" cy="12" r="4.2"/>
    <circle cx="17.3" cy="6.7" r="1.25" fill="currentColor" stroke="none"/></svg>`,
  facebook: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-8h2.71l.4-3.13H13.5V7.88c0-.9.25-1.52 1.55-1.52h1.66V3.56c-.29-.04-1.28-.12-2.43-.12-2.4 0-4.05 1.47-4.05 4.17v2.26H7.5V13h2.73v8h3.27Z"/></svg>`,
  x: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.53 3h3.05l-6.66 7.61L21.75 21h-6.13l-4.8-6.28L5.3 21H2.25l7.13-8.15L2.25 3h6.29l4.34 5.74L17.53 3Zm-1.07 16.2h1.69L7.62 4.71H5.8L16.46 19.2Z"/></svg>`,
};

const PRICE_CSS = `
@page { size: 210mm 297mm; margin: 0; }
.sheet { --sheet-w:210mm; --sheet-h:297mm; }

/* ---- The frame -------------------------------------------------------
   A double keyline — a half-millimetre navy rule with a gold hairline set
   just inside it — is the cheapest mark of quality available on a press:
   both colours are already on the sheet, and it needs no lamination, no
   die and no second pass. Everything on the page lives inside it, so a
   trim that wanders half a millimetre never makes the layout look
   crooked. The masthead and the signature bar run the full width of the
   frame and the gold hairline crosses both, which ties the three together
   instead of stacking three separate boxes. */
.pinner { position:absolute; inset:8mm; border:.5mm solid var(--blue-deep);
          display:flex; flex-direction:column; overflow:hidden; }
.pinner::after { content:''; position:absolute; inset:1.3mm; z-index:3;
                 border:.2mm solid var(--gold); pointer-events:none; }

/* ---- Masthead, page one ---------------------------------------------- */
/* The name is set in the company's own two colours, which is only possible
   on a light ground: the masthead used to be a full-bleed navy block, and
   #1e3a8a on #0f1f5c is the same colour twice. Lightening the type instead
   would have given an approximation of the brand rather than the brand.

   It suits the document as well as the request. This is the one piece in the
   package that gets written on at a counter, and it was carrying the heaviest
   ink coverage of anything here — a 44mm full-bleed navy band on 100gsm bond,
   which cockles the sheet and shows every fingerprint. A navy rule under the
   masthead keeps the structure the block was providing. */
.ph { height:38mm; flex:none; background:var(--paper); color:var(--ink);
      padding:0 9mm; display:flex; justify-content:space-between;
      align-items:center; gap:8mm; border-bottom:1.2mm solid var(--blue-deep); }
.ph .eyebrow { color:var(--red); }
.ph h1 { font:400 37pt/1 var(--serif); letter-spacing:-.015em; margin-top:1.8mm; }
.ph h1 .c-blue { color:#1e3a8a; }
.ph h1 .c-red  { color:#e11f29; font-style:italic; }
.ph .cur { display:flex; align-items:center; gap:3mm; margin-top:2.4mm;
           font:600 7.6pt/1 var(--sans); letter-spacing:.14em;
           text-transform:uppercase; color:var(--ink-3); }
.ph .cur::before { content:''; width:12mm; height:.35mm; background:var(--gold); flex:none; }
/* The logo and the standards mark are already artwork on white, so on a
   white ground they need no chip behind them. */
/* The standards mark used to sit beside the logo here, which read as part
   of the brand lockup rather than as a certification. It has moved to the
   terms block on the last page, next to the line that says what it is. */
.ph-mark { display:flex; align-items:center; flex:none; }
.ph-mark .lg { width:38mm; }

/* ---- Running head, every page after the first ------------------------- */
.prh { height:15mm; flex:none; display:flex; justify-content:space-between;
       align-items:center; padding:0 9mm; border-bottom:.3mm solid var(--rule); }
.prh .b { font:600 8pt/1 var(--sans); letter-spacing:.16em;
          text-transform:uppercase; color:var(--ink-3); }
.prh img { height:12mm; width:auto; }   /* by height — the 18mm head clips a logo set by width */

.pbody { flex:1; min-height:0; overflow:hidden; padding:4mm 9mm 0; }

/* ---- Section heading -------------------------------------------------- */
.grp { margin-bottom:5.5mm; }
.grp:last-child { margin-bottom:0; }
.gh { display:flex; align-items:center; gap:2.8mm; margin:0 0 3.6mm; }
.gh .sq { width:1.9mm; height:1.9mm; background:var(--gold); flex:none; }
.gh .t { font:700 9.6pt/1 var(--sans); letter-spacing:.14em; text-transform:uppercase;
         color:var(--blue-deep); white-space:nowrap; }
.gh .ln { flex:1; height:.25mm; background:var(--rule); }

.cards { display:grid; grid-template-columns:1fr 1fr; gap:3mm 4mm; }

/* ---- One product ------------------------------------------------------
   Ruled on all four sides and divided between pack sizes. The list ships
   unpriced, so every cell has to read as a field waiting for a number
   rather than as something the printer dropped — which is exactly what an
   open, borderless cell with a blank in it looks like. The writing rule
   runs the full width of its cell for the same reason: a short rule
   floating in a wide cell reads as decoration, a full one as a field. */
.pc { border:.3mm solid var(--rule); border-radius:1.2mm; overflow:hidden;
      display:flex; min-height:20.5mm; }
.pc-b { flex:1; min-width:0; display:flex; flex-direction:column; }
.pc-h { background:var(--label); color:var(--label-ink); padding:2.4mm 3mm 2.2mm;
        font:600 9.6pt/1.15 var(--sans); letter-spacing:.005em;
        display:flex; align-items:baseline; gap:2.4mm; }
/* The index number sat in gold on every card. Gold on Road Marking's yellow
   is invisible, so it now takes the same ink as the name and steps back
   with opacity instead of with a second colour. */
.pc-h .n { font:600 7pt/1 var(--sans); color:var(--label-ink); opacity:.62; flex:none;
           letter-spacing:.06em; font-variant-numeric:tabular-nums; }
.pc-h .nm { min-width:0; }
.pc-sizes { display:flex; flex:1; }
.pc-sz { flex:1; min-width:0; padding:2.4mm 3mm 2.2mm; border-right:.25mm solid var(--rule-2); }
.pc-sz:last-child { border-right:0; }
.pc-sz .s { font:600 7.4pt/1 var(--sans); letter-spacing:.1em; text-transform:uppercase;
            color:var(--ink-2); font-variant-numeric:tabular-nums; }
.pc-sz .p { font:600 11pt/1 var(--sans); color:var(--ink); margin-top:1.8mm;
            font-variant-numeric:tabular-nums; white-space:nowrap; }
.pc-sz .p small { font-weight:500; font-size:6.8pt; color:var(--ink-3); letter-spacing:.06em; }
.pc-sz .p.na { color:var(--ink-3); font-weight:500; }
.pc-sz .p.tbc { display:block; height:4mm; border-bottom:.3mm solid var(--ink-3); }

/* The picture column is drawn whether or not there is a photograph to put
   in it. Six lines have none, and a card that simply stops 19mm short of
   its neighbour breaks the grid far more visibly than an empty panel. */
.pc-img { width:19mm; flex:none; background:var(--cream);
          border-left:.3mm solid var(--rule-2);
          display:flex; align-items:center; justify-content:center; padding:2mm; }
.pc-img img { max-height:19mm; width:auto; max-width:100%; object-fit:contain; }
.pc-img--none { background:var(--cream-2); }

/* ---- Closing note ----------------------------------------------------- */
.pnote { margin-top:1.5mm; background:var(--cream);
         border:.3mm solid var(--rule); border-top:.9mm solid var(--gold);
         padding:3.4mm 4.6mm; }
.pnote .h { font:700 8pt/1 var(--sans); letter-spacing:.14em; text-transform:uppercase;
            color:var(--blue-deep); margin-bottom:2.8mm; }
.pnote p { font:400 8.2pt/1.5 var(--sans); color:var(--ink-2); }
.pnote p + p { margin-top:1.4mm; }
.pnote b { color:var(--ink); font-weight:600; }

/* ---- The foot of the terms block -------------------------------------- */
/* The standards mark, and every way of reaching the company, in one place
   on the page a customer keeps. */
.pn-foot { display:flex; align-items:flex-start; gap:5mm; margin-top:3.2mm;
           padding-top:3mm; border-top:.3mm solid var(--rule); }
.pn-mark { flex:none; display:flex; align-items:center; gap:2.6mm; }
.pn-mark img { width:15mm; }
.pn-mark span { font:500 6.8pt/1.35 var(--sans); color:var(--ink-2); }
.pn-mark b { display:block; font:700 6.6pt/1.5 var(--sans); letter-spacing:.12em;
             text-transform:uppercase; color:var(--blue-deep); }
.pn-contact { flex:1; min-width:0; }
.pn-contact p { font:400 7.8pt/1.5 var(--sans); color:var(--ink-2); }
.pn-contact p + p { margin-top:.9mm; }
.pn-contact b { color:var(--ink); font-weight:600; }
.pn-social { display:flex; flex-wrap:wrap; gap:1.5mm 5.5mm; margin-top:2.2mm; }
.pn-social span { display:inline-flex; align-items:center; gap:1.7mm;
                  font:500 7.6pt/1 var(--sans); color:var(--ink-2); }
.pn-social svg { width:4mm; height:4mm; flex:none; color:var(--blue-deep); }

/* ---- Signature bar, every page ---------------------------------------- */
/* One line, both halves, on every page. Nowrap because a second line here
   would be clipped by the frame rather than pushing anything down. */
/* nowrap is deliberate — a second line here is clipped by the frame rather
   than pushing anything down. That makes the width a hard budget, and the
   type going up to 7.2pt spent more than there was: the web address lost its
   last three characters. Back to 6.9pt with tighter tracking and narrower
   side padding, which fits the line with room to spare. */
.psig { height:11mm; flex:none; background:var(--blue-deep); color:#fff;
        padding:0 7mm; display:flex; align-items:center;
        justify-content:space-between; gap:5mm;
        font:500 6.9pt/1.3 var(--sans); letter-spacing:.02em; white-space:nowrap; }
.psig .r { color:var(--gold); }
`;

/* ============================================================
   The colour on the tin
   ============================================================
   The name box on each price card used to take readable(p.primary) — the
   catalogue's accent, darkened until white type held on it. That is a
   sensible default and it was wrong here often enough to notice: SuperMatt
   came out red when the tin is green, Roof Paint red when the tin is grey,
   Road Marking near-black when the tin is yellow.

   These are sampled from the product photographs in assets/img/buckets —
   the middle band of the tin, ignoring the white body, the black type and
   the greys, then the most common remaining hue. Four were corrected by eye
   afterwards, because the largest area of colour and the colour a person
   would name are not always the same thing:

     iris-economy   the yellow frame, not the blue band inside it
     roof-paint     the grey roof in the photograph
     super-gloss    the violet frame, not the gold door in the photograph
     clear-varnish  the wood tone, on a label that is mostly silver

   Three products have no photograph, so there is nothing to sample and
   they keep the catalogue colour. */
const TIN_LABEL = {
  'silk-vinyl':          '#8f236e',
  'vinyl-matt':          '#252879',
  'iris-economy':        '#f0c000',
  'supermatt':           '#0f6b53',
  'weatherguard':        '#c91c24',
  'rocketex':            '#c81219',
  'roof-paint':          '#5b6165',
  'super-gloss':         '#7b3f98',
  'gloss-enamel':        '#335e83',
  'clear-varnish':       '#7a5c33',
  'varnish-stain':       '#c8841e',
  'metal-primer':        '#e7f03a',
  'universal-undercoat': '#1a4486',
  'road-marking':        '#edcb59',
  'turpentine':          '#b3181c',
};

const labelColour = p => TIN_LABEL[p.slug] || readable(p.primary);

function priceCards(d) {
  // Build every card once, tagged with the group it belongs to.
  return PRICE_GROUPS.map(g => {
    const rows = g.slugs.map(slug => {
      const p = bySlug[slug];
      if (!p) return null;
      const table = PRICES[slug] || {};
      // Only sizes the product actually stocks, in the catalogue's order.
      const sizes = (p.sizes || []).filter(s => s in table);
      return { p, sizes, table, src: thumbImage(p, d) };
    }).filter(Boolean);
    /* Photographed tins first, the rest at the foot of their own section.
       Scattered through the grid, an empty picture panel reads as artwork
       that failed to load; collected at the bottom it reads as a deliberate
       sub-list. Two passes rather than a comparator, so the order written
       in prices.js survives inside each block. */
    return { title: g.title,
             rows: [...rows.filter(r => r.src), ...rows.filter(r => !r.src)] };
  }).filter(g => g.rows.length);
}

function priceCardHTML(entry, n) {
  const { p, sizes, table, src } = entry;
  const cell = s => {
    const v = table[s];
    if (v === null || v === undefined)
      return `<div class="pc-sz"><div class="s">${esc(s)}</div><div class="p na">—</div></div>`;
    if (!v)
      return `<div class="pc-sz"><div class="s">${esc(s)}</div><div class="p tbc"></div></div>`;
    return `<div class="pc-sz"><div class="s">${esc(s)}</div>`
         + `<div class="p">${v.toLocaleString('en-KE')} <small>${esc(CURRENCY)}</small></div></div>`;
  };
  /* The name is set as the catalogue writes it, not upper-cased. Capitals
     flatten the names that carry a capital of their own — SuperMatt,
     RockShield, Rocketex — into SUPERMATT and ROCKSHIELD, which is the
     brand spelled wrong in the one place a customer reads it. */
  const bg = labelColour(p);
  return `
  <div class="pc" style="${accentVars(p.primary)};--label:${bg};--label-ink:${inkOn(bg)}">
    <div class="pc-b">
      <div class="pc-h"><span class="n">${String(n).padStart(2, '0')}</span><span class="nm">${esc(p.name)}</span></div>
      <div class="pc-sizes">${sizes.map(cell).join('')}</div>
    </div>
    ${src ? `<div class="pc-img"><img src="${src}" alt=""></div>`
          : `<div class="pc-img pc-img--none"></div>`}
  </div>`;
}

function priceList() {
  const d = 1;
  const a = assets(d);
  const groups = priceCards(d);

  /* --- pagination -------------------------------------------------------
     Measured off the sheet, not estimated. Inside the 8mm frame there is
     281mm of height. A first page spends 38 on the masthead, 11 on the
     signature bar and 4 on the body's opening air, leaving 228; every page
     after it spends 15 on the running head instead of 38, leaving 251.

     A card is 21.4mm over a 3mm gutter, a section heading with its margin
     costs 7, one section is separated from the next by 5.5, and the terms
     block needs 80 wherever it lands.

     The gap is charged between sections rather than after each one, because
     the last section on a page has its bottom margin collapsed away — count
     it and the page loses a card row it had room for.

     These numbers came down across the board in the compaction pass. The
     type did not move — it was raised on request and stays raised. Every
     millimetre came out of spacing: the masthead lost 6, the running head
     3, the card 3.5 off its minimum height, and the rest off padding,
     gutters and margins. That is 347mm of sections against 479mm on two
     sheets, so the list is back to two pages with the terms block on the
     second, where it was before the contact details were added to it.

     Packing here rather than letting the browser flow it is what stops a
     section heading stranding at the foot of a page, and render.mjs measures
     every .pbody afterwards, so if these numbers ever drift the build says
     so rather than clipping in silence. */
  const ROW = 25, HEAD = 7, GAP = 6, NOTE = 80;
  const cap = i => (i === 0 ? 228 : 251);

  const cost = g => HEAD + Math.ceil(g.rows.length / 2) * ROW;

  /* Pack to a ceiling, and report where everything landed. A `soft` ceiling
     below the real one is what lets the sections be spread rather than
     stacked; the real cap is still honoured, so a soft value can never
     overfill a sheet. */
  const layout = soft => {
    const pages = [];
    let page = [], used = 0;
    for (const g of groups) {
      const add = cost(g) + (page.length ? GAP : 0);
      const limit = Math.min(soft, cap(pages.length));
      if (page.length && used + add > limit) {
        pages.push(page); page = [g]; used = cost(g);
      } else {
        page.push(g); used += add;
      }
    }
    if (page.length) pages.push(page);
    // The note rides on the last page if it fits, otherwise it takes its own.
    if (used + NOTE > cap(pages.length - 1)) pages.push([]);
    return pages;
  };

  /* Filling each sheet to the brim before starting the next is the fewest
     pages the content can occupy, and it looked it: three sections packed
     onto page one, two on page two with a hand's depth of white under them,
     and the terms block alone on page three.

     The page count is not negotiable — 505mm of content will not go on two
     sheets. How it is distributed across them is. So take the greedy count
     as the target, then find the TIGHTEST ceiling that still meets it.
     Squeezing the ceiling forces sections down onto the later sheets until
     they are evenly loaded, and the first value that still fits the target
     is the most even one available. Here it turns 220/191/86 into roughly
     144/144/201, with the terms block back on the last sheet of paint. */
  const target = layout(Infinity).length;
  let soft = 60;
  while (soft < 300 && layout(soft).length > target) soft += 2;
  const pages = layout(soft);

  let n = 0;
  const sheets = pages.map((groupsOnPage, i) => {
    const isFirst = i === 0;
    const isLast  = i === pages.length - 1;

    /* No effective date and no page numbers, by request. The list is
       reprinted whenever the numbers move, so a date only ages it on the
       counter, and "page 2 of 2" is furniture on a document nobody files. */
    const header = isFirst ? `
      <div class="ph">
        <div>
          <span class="eyebrow">Price list · Recommended retail</span>
          <h1><span class="c-blue">Cloud</span> <span class="c-red">Paints</span></h1>
          <div class="cur">All prices in Kenya Shillings${
            EFFECTIVE_FROM ? ' · Effective ' + esc(EFFECTIVE_FROM) : ''}</div>
        </div>
        <div class="ph-mark">
          <img class="lg" src="${a}/img/brand/logo.png" alt="Cloud Paints">
        </div>
      </div>` : `
      <div class="prh">
        <span class="b">Cloud Paints · Price list${
          EFFECTIVE_FROM ? ' · Effective ' + esc(EFFECTIVE_FROM) : ''}</span>
        <img src="${a}/img/brand/logo.png" alt="Cloud Paints">
      </div>`;

    const body = groupsOnPage.map(g => `
      <div class="grp">
        <div class="gh"><span class="sq"></span><span class="t">${esc(g.title)}</span><span class="ln"></span></div>
        <div class="cards">${g.rows.map(r => priceCardHTML(r, ++n)).join('')}</div>
      </div>`).join('');

    const note = isLast ? `
      <div class="pnote">
        <div class="h">Terms and the counter</div>
        <p>${esc(TRADE_NOTE)}</p>
        <p><b>Colour tinting</b> is available at the Industrial Area counter on all
           emulsions and enamels. Tinted shades may carry a surcharge depending on
           the colourant used.</p>
        <p><b>Textured and decorative finishes</b> are quoted separately. They are
           sold by weight and applied by hand, so the figure depends on the wall —
           bring your measurements and ask for the decorative deck.</p>
        <div class="pn-foot">
          <div class="pn-mark">
            <img src="${a}/img/brand/kebs.png" alt="KEBS Standardisation Mark">
            <span><b>KEBS</b>Standardisation<br>Mark</span>
          </div>
          <div class="pn-contact">
            <p><b>Manufactured by ${esc(CO.legal)}</b> · ${esc(CO.street)},
               ${esc(CO.area)} · ${esc(CO.box)}</p>
            <p><b>Call</b> ${CO.phones.map(esc).join(' · ')}</p>
            <p><b>WhatsApp</b> ${esc(CO.whatsapps.join(' or '))}</p>
            <p><b>Email</b> ${esc(CO.email)} &nbsp;·&nbsp; <b>Web</b> ${esc(CO.web)}</p>
            <div class="pn-social">
              <span>${ICON.instagram}${esc(CO.social.handle)}</span>
              <span>${ICON.facebook}${esc(CO.social.handle)}</span>
              <span>${ICON.x}${esc(CO.social.handle)}</span>
            </div>
          </div>
        </div>
      </div>` : '';

    return `
<div class="sheet">
  <div class="pinner">
    ${header}
    <div class="pbody">${body}${note}</div>
    <div class="psig">
      <span>Manufactured by ${esc(CO.legal)} · ${esc(CO.area)}</span>
      <span class="r">${esc(CO.phones[0])} · ${esc(CO.email)} · ${esc(CO.web)}</span>
    </div>
  </div>
</div>`;
  }).join('\n');

  return head('Cloud Paints — Price List', d, PRICE_CSS) + sheets + tail;
}

/* ============================================================
   5b. The Colour Collection — the full shade card
   ============================================================
   544 shades in 17 families, generated from js/colours-data.js the
   same way everything else here is generated from the product
   catalogue: rename a colour on the website and the chart follows.

   One family to a page. Thirty-two shades in a four-wide grid read
   left to right, palest first, which is the order the codes are in
   — CP·RD010 is the palest red and CP·RD320 the deepest, in steps of
   ten. Someone comparing two shades in the same family should find
   them next to each other, and someone reading a code off a tin
   should be able to find it without an index.

   The name and code sit UNDER the patch on white rather than over the
   colour. Text on top of a swatch costs you the part of the swatch
   you are trying to judge, and on the pale families it needs a dark
   ink that changes how the colour reads.
   ============================================================ */
const COLLECTION_CSS = `
@page { size: 210mm 297mm; margin: 0; }
.sheet { --sheet-w:210mm; --sheet-h:297mm; }

/* The same double keyline as the price list — a navy rule with a gold
   hairline inside it. Both colours are already on the sheet. */
.pinner { position:absolute; inset:8mm; border:.5mm solid var(--blue-deep);
          display:flex; flex-direction:column; overflow:hidden; }
.pinner::after { content:''; position:absolute; inset:1.3mm; z-index:3;
                 border:.2mm solid var(--gold); pointer-events:none; }

/* ---- Cover ------------------------------------------------------------
   The ground is the range flier's, which is the website's opening hero
   flattened for print: a dark plum base with a crimson pool top-left, a
   deep blue top-right and an amber low centre, rebuilt as four stacked
   radial gradients because blend modes and 74px blurs are not things to
   hand a press. Same hues, same positions, same feel — so the shade card
   and the flier read as two pieces from one house rather than two designs.

   The brand blue and red do not survive being put on it: #1E3A8A on a
   #0B0610 ground is one dark on another. The strapline takes the lifted
   pair the flier already uses for this — the brand colours as they read
   on dark, rather than an approximation of them that cannot be seen.

   The band is still the cover. Seventeen columns, one per family, four
   shades each from pale to deep. Sixty-eight colours say what the document
   is faster than a photograph of a tin could, and on this ground they
   carry far more than they did on white.

   The inside pages stay white, and they have to. A patch is judged against
   the paper around it, so 544 of them on a coloured ground would every one
   of them read wrong. The dark treatment is the cover's alone. */
.pinner--dark { border-color:rgba(255,255,255,.30); color:#fff;
  background:
    radial-gradient(58% 46% at 14% 6%,  rgba(150,20,52,.85),  transparent 68%),
    radial-gradient(56% 44% at 88% 4%,  rgba(30,40,132,.82),  transparent 68%),
    radial-gradient(70% 40% at 56% 96%, rgba(150,100,18,.55), transparent 70%),
    radial-gradient(140% 110% at 62% 46%, #241030, #0b0610 72%); }
.pinner--dark::after { border-color:rgba(232,163,23,.42); }

.cov { flex:1; min-height:0; display:flex; flex-direction:column;
       align-items:center; text-align:center; padding:12mm 12mm 9mm; }
/* The logo keeps its white chip. The mark is drawn in the brand blue and
   red, and neither of them holds on this ground. */
.cov .chip { flex:none; background:#fff; border-radius:2mm; padding:3.4mm 5.2mm;
             display:inline-flex; align-items:center; }
.cov .chip img { width:40mm; display:block; }
.cov .rule-g { flex:none; height:.8mm; width:30mm; background:var(--gold); margin:7mm 0 4.5mm; }
.cov .eyebrow { flex:none; color:#ffc93d; }
.cov h1 { flex:none; font:400 45pt/0.97 var(--serif); letter-spacing:-.02em;
          color:#fff; margin-top:3mm; }
.cov h1 em { font-style:italic; color:#ffc93d; }
.cov .sub { flex:none; font:400 10.4pt/1.5 var(--sans);
            color:rgba(255,255,255,.86); margin-top:4.5mm; max-width:132mm; }
.cov .strap { flex:none; font:400 italic 14pt/1.3 var(--serif); margin-top:5.5mm; }
.cov .strap .s-blue { color:#8fb0ff; }
.cov .strap .s-red  { color:#ff5f70; }
.cov .strap .s-dot  { color:rgba(255,255,255,.42); margin:0 .5em; font-style:normal; }
.cov-band { width:100%; flex:1; min-height:0; display:grid;
            grid-template-columns:repeat(17,1fr); margin-top:7mm;
            border:.3mm solid rgba(255,255,255,.30); }
.cov-band .cb { display:grid; grid-template-rows:repeat(4,1fr); }
.cov-band i { display:block; }
.cov-mark { flex:none; display:flex; align-items:center; gap:3.2mm; margin-top:6.5mm; }
.cov-mark img { height:14mm; width:auto; background:#fff; padding:.9mm; border-radius:1mm; }
.cov-mark span { font:500 7pt/1.25 var(--sans); text-align:left; color:rgba(255,255,255,.86); }
.cov-mark b { display:block; font:700 6.4pt/1.4 var(--sans); letter-spacing:.12em;
              text-transform:uppercase; color:var(--gold); }
.cov-foot { width:100%; flex:none; margin-top:6.5mm; display:flex;
            align-items:flex-end; justify-content:space-between; gap:8mm;
            text-align:left; font:400 7pt/1.45 var(--sans); color:rgba(255,255,255,.8); }
.cov-foot .r { text-align:right; }
.cov-foot b { display:block; font:600 6.4pt/1 var(--sans); letter-spacing:.11em;
              text-transform:uppercase; color:var(--gold); margin-bottom:1.4mm; }

/* ---- Running head and signature bar ----------------------------------- */
.crh { height:16mm; flex:none; display:flex; justify-content:space-between;
       align-items:center; padding:0 9mm; border-bottom:.3mm solid var(--rule); }
.crh .b, .crh .r { font:600 7pt/1 var(--sans); letter-spacing:.15em;
                   text-transform:uppercase; color:var(--ink-3); }
.crh .r { display:flex; align-items:center; gap:4.5mm; }
.crh img { height:10.5mm; width:auto; }
.pbody { flex:1; min-height:0; padding:6mm 9mm 4mm; display:flex; flex-direction:column; }
.psig { height:11mm; flex:none; display:flex; align-items:center;
        justify-content:space-between; padding:0 9mm; border-top:.3mm solid var(--rule);
        font:400 6.2pt/1 var(--sans); color:var(--ink-3); }

/* ---- A family page ----------------------------------------------------- */
.fh { flex:none; display:flex; justify-content:space-between; align-items:flex-start; gap:8mm; }
.fcode { display:inline-block; font:700 7pt/1 var(--sans); letter-spacing:.16em;
         color:#fff; background:var(--accent); padding:1.9mm 2.8mm; border-radius:.8mm; }
.fh h2 { font:400 24pt/1 var(--serif); letter-spacing:-.015em; color:var(--ink); margin:2.4mm 0 0; }
.fh .sub { font:400 8.4pt/1.4 var(--sans); color:var(--ink-2); margin-top:2.2mm; max-width:120mm; }
.fh .cnt { flex:none; text-align:right; font:600 6.8pt/1.6 var(--sans);
           letter-spacing:.12em; text-transform:uppercase; color:var(--ink-3); }
.crule { flex:none; height:.9mm; background:var(--accent); margin:4mm 0 5mm; }
.cgrid { flex:1; min-height:0; display:grid; grid-template-columns:repeat(4,1fr);
         gap:3.2mm 4mm; align-content:start; }
.chip .sw { height:16mm; border:.18mm solid rgba(0,0,0,.16); border-radius:.7mm; }
.chip .nm { font:500 7.2pt/1.15 var(--sans); color:var(--ink); margin-top:1.7mm; }
.chip .cd { font:600 5.7pt/1 var(--sans); letter-spacing:.09em;
            color:var(--ink-3); margin-top:.9mm; }

/* ---- The guide and contents page --------------------------------------- */
.ptitle { flex:none; margin-bottom:5mm; }
.ptitle h2 { font:400 26pt/1 var(--serif); letter-spacing:-.015em; color:var(--ink); }
.ptitle .k { font:400 9.6pt/1.5 var(--serif); color:var(--ink-2); margin-top:2.5mm; max-width:150mm; }
.gcols { flex:1; min-height:0; display:grid; grid-template-columns:1fr 1.05fr; gap:10mm; }
.gsec h3 { font:600 6.8pt/1 var(--sans); letter-spacing:.15em; text-transform:uppercase;
           color:var(--red); margin-bottom:3mm; }
.gsec p { font:400 8pt/1.5 var(--sans); color:var(--ink-2); margin-bottom:3.4mm; }
.gsec p b { color:var(--ink); font-weight:600; }
.gsec + .gsec { margin-top:7mm; }
.ctab { width:100%; border-collapse:collapse; }
.ctab td { padding:1.45mm 0; border-bottom:.2mm solid var(--rule-2);
           font:400 7.6pt/1.3 var(--sans); color:var(--ink-2); vertical-align:middle; }
.ctab td.d { width:7mm; }
.ctab td.n { color:var(--ink); font-weight:500; }
.ctab td.r { text-align:right; font:600 6.3pt/1 var(--sans);
             letter-spacing:.08em; color:var(--ink-3); white-space:nowrap; }
.dot { display:block; width:5mm; height:5mm; border-radius:50%;
       border:.18mm solid rgba(0,0,0,.16); }
.note { flex:none; margin-top:5mm; padding:4mm 5mm; background:var(--cream);
        border-left:.9mm solid var(--gold); }
.note b { color:var(--ink); font-weight:600; }
.note p { font:400 7.6pt/1.45 var(--sans); color:var(--ink-2); }

/* ---- Finishes and textures --------------------------------------------- */
.ftab { width:100%; border-collapse:collapse; }
.ftab th { text-align:left; font:600 6.4pt/1 var(--sans); letter-spacing:.14em;
           text-transform:uppercase; color:var(--ink-3);
           padding:0 0 2.2mm; border-bottom:.3mm solid var(--rule); }
.ftab td { padding:2.8mm 0; border-bottom:.2mm solid var(--rule-2);
           font:400 8pt/1.42 var(--sans); color:var(--ink-2); vertical-align:top; }
.ftab td.n { font:400 10pt/1.2 var(--serif); color:var(--ink); width:36mm; }
.ftab td.s { width:27mm; font:600 7.4pt/1.3 var(--sans); color:var(--accent); }
.fsec { flex:none; }
.fsec + .fsec { margin-top:9mm; }
.fsec h3 { font:400 17pt/1 var(--serif); color:var(--ink); margin-bottom:1.6mm; }
.fsec .k { font:400 7.8pt/1.45 var(--sans); color:var(--ink-2); margin-bottom:4mm; max-width:150mm; }

/* ---- Back page ---------------------------------------------------------- */
.bk { flex:1; min-height:0; display:flex; flex-direction:column; }
.bk-grid { display:grid; grid-template-columns:1fr 1fr; gap:9mm; margin-top:6mm; }
.bcard { padding:5mm 5.5mm; background:var(--cream); }
.bcard h4 { font:600 6.6pt/1 var(--sans); letter-spacing:.15em; text-transform:uppercase;
            color:var(--red); margin-bottom:2.6mm; }
.bcard p { font:400 7.8pt/1.5 var(--sans); color:var(--ink-2); }
.bk-contact { margin-top:auto; padding-top:7mm; border-top:.5mm solid var(--blue-deep);
              display:flex; justify-content:space-between; align-items:flex-end; gap:8mm; }
.bk-contact .l { font:400 8pt/1.6 var(--sans); color:var(--ink-2); }
.bk-contact .l b { display:block; font:600 6.6pt/1 var(--sans); letter-spacing:.15em;
                   text-transform:uppercase; color:var(--ink-3); margin-bottom:2mm; }
.bk-contact .lg { width:40mm; }
.sel { flex:none; margin-top:9mm; }
.sel h3 { font:600 6.6pt/1 var(--sans); letter-spacing:.15em; text-transform:uppercase;
          color:var(--red); margin-bottom:3mm; }
.stab { width:100%; border-collapse:collapse; }
.stab th { text-align:left; font:600 6.2pt/1 var(--sans); letter-spacing:.14em;
           text-transform:uppercase; color:var(--ink-3);
           padding:0 0 2.2mm; border-bottom:.3mm solid var(--rule); }
.stab td { height:8.6mm; border-bottom:.2mm solid var(--rule); }

/* The depth ladders on the guide page. Thirty-two bars to a strip, which is
   the whole family at a glance and the clearest way to show that the number
   in a code is a depth rather than a serial. */
.lads { margin-top:1mm; }
.lad + .lad { margin-top:3.4mm; }
.lbars { display:grid; grid-template-columns:repeat(32,1fr); height:6.6mm;
         border:.18mm solid rgba(0,0,0,.16); }
.lbars i { display:block; }
.llab { display:flex; justify-content:space-between; margin-top:1.1mm;
        font:600 5.6pt/1 var(--sans); letter-spacing:.07em; color:var(--ink-3); }
.llab .n { color:var(--ink-2); }
`;

function colourCollection() {
  const d = 1;
  const a = assets(d);
  const C = loadColours();

  /* Shades arrive as one flat list. Group them by family and sort by the
     position in the code, so each column runs pale to deep in the order the
     numbering already implies. */
  const byFamily = Object.fromEntries(C.families.map(f => [f.code, []]));
  for (const s of C.shades) if (byFamily[s.family]) byFamily[s.family].push(s);
  for (const k of Object.keys(byFamily)) byFamily[k].sort((x, y) => x.pos - y.pos);

  const runHead = right => `
    <div class="crh">
      <span class="b">Cloud Paints · The Colour Collection · ${esc(C.edition)}</span>
      <span class="r">${esc(right)}<img src="${a}/img/brand/logo.png" alt="Cloud Paints"></span>
    </div>`;

  const sig = `
    <div class="psig">
      <span>Manufactured by ${esc(CO.legal)} · ${esc(CO.area)}</span>
      <span class="r">${esc(CO.phones[0])} · ${esc(CO.email)} · ${esc(CO.web)}</span>
    </div>`;

  const sheet = (inner, cls = '') =>
    `<div class="sheet"><div class="pinner${cls ? ' ' + cls : ''}">${inner}</div></div>`;

  /* ---- 1. Cover -------------------------------------------------------- */
  const band = C.families.map(f => {
    const fam = byFamily[f.code];
    const pick = [40, 130, 220, 310].map(pos => fam.find(s => s.pos === pos) || fam[0]);
    return `<div class="cb">${pick.map(s =>
      `<i style="background:${esc(s.hex)}"></i>`).join('')}</div>`;
  }).join('');

  const cover = sheet(`
    <div class="cov">
      <span class="chip"><img src="${a}/img/brand/logo.png" alt="Cloud Paints"></span>
      <div class="rule-g"></div>
      <span class="eyebrow">${esc(C.edition)} Edition · Interior &amp; Exterior</span>
      <h1>The Colour <em>Collection</em></h1>
      <p class="sub">${C.shades.length} shades in ${C.families.length} families, tinted to order
         at our Industrial Area counter on emulsions and enamels alike.</p>
      <div class="strap"><span class="s-blue">Buy it</span><span class="s-dot">·</span><span
        class="s-red">Paint it</span><span class="s-dot">·</span><span class="s-blue">Love it..!</span></div>
      <div class="cov-band">${band}</div>
      <div class="cov-mark">
        <img src="${a}/img/brand/kebs.png" alt="KEBS Standardisation Mark">
        <span><b>KEBS</b>Standardisation Mark</span>
      </div>
      <div class="cov-foot">
        <div><b>Manufactured by</b>${esc(CO.legal)}<br>${esc(CO.street)}, ${esc(CO.area)}</div>
        <div class="r"><b>Find us</b>${esc(CO.web)}<br>${esc(CO.phones[0])}</div>
      </div>
    </div>`, 'pinner--dark');

  /* ---- 2. How to read it, and what is in it ---------------------------- */
  /* Four families spread across the spectrum, each as a full 32-step strip.
     Data only — it is the card explaining its own numbering. */
  const LADDERS = ['RD', 'GN', 'BL', 'BR'].map(code => {
    const f = C.families.find(x => x.code === code);
    if (!f) return '';
    return `
      <div class="lad">
        <div class="lbars">${byFamily[code].map(s =>
          `<i style="background:${esc(s.hex)}"></i>`).join('')}</div>
        <div class="llab"><span class="n">${esc(f.name)}</span>
          <span>CP·${esc(code)}010 → ${esc(code)}320</span></div>
      </div>`;
  }).join('');

  const contents = C.families.map(f => `
    <tr>
      <td class="d"><span class="dot" style="background:${esc(f.accent)}"></span></td>
      <td class="n">${esc(f.name)}</td>
      <td class="r">CP·${esc(f.code)}010–${esc(f.code)}320 · ${byFamily[f.code].length}</td>
    </tr>`).join('');

  const guide = sheet(runHead('How to read it') + `
    <div class="pbody">
      <div class="ptitle">
        <h2>Reading the chart</h2>
        <p class="k">Every shade carries a code, and the code is the thing to quote at the
           counter. Names are easy to mishear, and more than one family has a shade
           people will call &ldquo;the dusty rose&rdquo;.</p>
      </div>
      <div class="gcols">
        <div>
          <div class="gsec">
            <h3>The code</h3>
            <p><b>CP·RD010</b> breaks into three parts. <b>CP</b> is Cloud Paints.
               <b>RD</b> is the family — Reds &amp; Crimsons. <b>010</b> is the position
               within that family.</p>
            <p>Positions run <b>010 to 320 in steps of ten</b>, palest to deepest. So
               CP·RD010 is the lightest red on the card and CP·RD320 the darkest, with
               thirty-two steps between. The same holds in all ${C.families.length}
               families, which is why two shades the same distance down two different
               pages sit at about the same depth.</p>
          </div>
          <div class="gsec">
            <h3>Getting it mixed</h3>
            <p>Any shade here can be tinted onto our emulsions and enamels at the
               Industrial Area counter. Bring the code, the finish you want and the tin
               size. Tinted shades may carry a surcharge depending on the colourant.</p>
            <p>Ready-mixed whites and standard colours are on the shelf and need no
               tinting — those are in the price list.</p>
          </div>
          <div class="gsec">
            <h3>The same ladder in every family</h3>
            <p>Each strip is one family, all thirty-two steps in order. Position in
               the code is position on the strip, so CP·GN160 and CP·BL160 sit at
               the same depth as each other.</p>
            <div class="lads">${LADDERS}</div>
          </div>
        </div>
        <div>
          <div class="gsec">
            <h3>The ${C.families.length} families</h3>
            <table class="ctab">${contents}</table>
          </div>
          <div class="gsec">
            <h3>Choosing on site</h3>
            <p>Colour changes with the light it is under and with the sheen it is mixed
               into: the same code reads deeper in matt than in silk, and a north-facing
               room will cool it. Look at a shade on the wall it is destined for, at the
               hour you will most often see it.</p>
          </div>
        </div>
      </div>
      <div class="note">
        <p><b>These patches are printed ink, not paint.</b> Press and paper get a colour
           close but never exactly — pale neutrals and strong reds drift the most. Use
           the chart to find and name a shade, then ask for a brush-out of the actual
           mixed paint before committing it to a wall.</p>
      </div>
    </div>` + sig);

  /* ---- 3. One page per family ------------------------------------------ */
  const familyPages = C.families.map(f => {
    const fam = byFamily[f.code];
    const chips = fam.map(s => `
      <div class="chip">
        <div class="sw" style="background:${esc(s.hex)}"></div>
        <div class="nm">${esc(s.name)}</div>
        <div class="cd">${esc(s.code)}</div>
      </div>`).join('');

    return sheet(runHead(f.name) + `
      <div class="pbody" style="${accentVars(f.accent)}">
        <div class="fh">
          <div>
            <span class="fcode">${esc(f.code)}</span>
            <h2>${esc(f.name)}</h2>
            <p class="sub">${esc(f.subtitle)}</p>
          </div>
          <div class="cnt">${fam.length} shades<br>CP·${esc(f.code)}010–${esc(f.code)}320</div>
        </div>
        <div class="crule"></div>
        <div class="cgrid">${chips}</div>
      </div>` + sig);
  }).join('\n');

  /* ---- 4. Finishes and textures ---------------------------------------- */
  const finishRows = C.finishes.map(x => `
    <tr><td class="n">${esc(x.name)}</td><td class="s">${esc(x.sheen)}</td>
        <td>${esc(x.use)}</td></tr>`).join('');
  const textureRows = C.textures.map(x => `
    <tr><td class="n">${esc(x.name)}</td><td>${esc(x.use)}</td></tr>`).join('');

  const finishes = sheet(runHead('Finishes & textures') + `
    <div class="pbody" style="${accentVars('#1e3a8a')}">
      <div class="ptitle">
        <h2>Finish and texture</h2>
        <p class="k">A colour is only half the decision. The same shade in matt and in
           high-gloss will not look like the same colour, and it will not wear the same
           way either.</p>
      </div>
      <div class="fsec">
        <h3>Sheen levels</h3>
        <p class="k">Sheen is how much light the dry film throws back. Low sheen hides an
           uneven wall; high sheen takes scrubbing.</p>
        <table class="ftab">
          <tr><th>Finish</th><th>Sheen</th><th>Where it belongs</th></tr>
          ${finishRows}
        </table>
      </div>
      <div class="fsec">
        <h3>Textured finishes</h3>
        <p class="k">Applied by hand with a trowel, roller or sponge, so no two walls come
           out quite alike. Quoted separately from the tinted ranges.</p>
        <table class="ftab">
          <tr><th>Texture</th><th>Effect</th></tr>
          ${textureRows}
        </table>
      </div>
      <div class="note">
        <p><b>Sheen comes from the product, not from the tint.</b> Silk Vinyl gives a
           silk finish, Vinyl Matt and SuperMatt a matt one, and Super Gloss or Gloss
           Enamel the high-sheen end. Pick the line for the finish the surface needs,
           then have it tinted to the code you chose here — the range flier sets out
           what each line is for.</p>
      </div>
    </div>` + sig);

  /* ---- 5. Back --------------------------------------------------------- */
  const back = sheet(runHead('Ordering') + `
    <div class="pbody">
      <div class="bk">
        <div class="ptitle">
          <h2>From the card to the wall</h2>
          <p class="k">Four things get a shade mixed correctly the first time.</p>
        </div>
        <div class="bk-grid">
          <div class="bcard">
            <h4>1 · Quote the code</h4>
            <p>Read it off the chart — <b>CP·BL180</b>, not &ldquo;the mid blue&rdquo;. The
               code is unambiguous, and it is what the tinting machine takes.</p>
          </div>
          <div class="bcard">
            <h4>2 · Name the finish</h4>
            <p>Matt, eggshell, satin, silk, semi-gloss or high-gloss. Sheen changes how
               deep the colour reads, so settle it with the shade rather than after it.</p>
          </div>
          <div class="bcard">
            <h4>3 · Bring your measurements</h4>
            <p>Wall area, number of coats and the surface underneath. We work the quantity
               out with you rather than selling you a round number.</p>
          </div>
          <div class="bcard">
            <h4>4 · Ask for a brush-out</h4>
            <p>A sample of the mixed paint on a card, to take home and look at in your own
               light before the full batch is made up.</p>
          </div>
        </div>
        <div class="sel">
          <h3>Your selection</h3>
          <table class="stab">
            <tr><th>Room or surface</th><th>Shade code</th><th>Finish</th><th>Product and size</th></tr>
            ${'<tr><td></td><td></td><td></td><td></td></tr>'.repeat(8)}
          </table>
        </div>
        <div class="bk-contact">
          <div class="l">
            <b>Cloud Paints · ${esc(CO.legal)}</b>
            ${esc(CO.street)}, ${esc(CO.area)}<br>
            ${esc(CO.box)}<br>
            ${esc(CO.phones[0])} · ${esc(CO.phones[1])} · ${esc(CO.phones[2])}<br>
            ${esc(CO.email)} · ${esc(CO.web)}<br>
            ${esc(CO.hours)}
          </div>
          <img class="lg" src="${a}/img/brand/logo.png" alt="Cloud Paints">
        </div>
      </div>
    </div>` + sig);

  return head('Cloud Paints — The Colour Collection', d, COLLECTION_CSS)
       + [cover, guide, familyPages, finishes, back].join('\n') + tail;
}

/* ============================================================
   6. Build
   ============================================================ */
console.log('Cloud Paints — building print masters\n');

for (const p of withArt) {
  made.push(write(`html/fliers/a4/${p.slug}.html`, flierA4(p)));
  made.push(write(`html/fliers/a5/${p.slug}.html`, flierA5(p)));
}
console.log(`  fliers        ${withArt.length} products × A4 + A5 = ${withArt.length * 2} sheets`);

/* Colour flier — one product, both sizes, as a sample to approve before the
   treatment is rolled across the range. Change the slug to try another. */
const COLOUR_SAMPLE = 'weatherguard';
const cs = bySlug[COLOUR_SAMPLE];
made.push(write(`html/fliers/colour/${cs.slug}-a4.html`, flierColourA4(cs)));
made.push(write(`html/fliers/colour/${cs.slug}-a5.html`, flierColourA5(cs)));
console.log(`  colour flier  ${cs.name} — A4 + A5`);

for (const s of ['A4', 'A5']) made.push(write(`html/range-flier-${s.toLowerCase()}.html`, rangeFlier(s)));
console.log(`  range flier   folds to A4 · folds to A5`);

for (const s of ['A2', 'A3']) made.push(write(`html/poster-range-${s.toLowerCase()}.html`, rangePoster(s)));
console.log(`  range poster  A2 · A3`);

const BROCHURES = [
  {
    name: 'range', accent: '#1e3a8a',
    title: 'The <em>Cloud Paints</em> range',
    kicker: 'Paints, coatings and decorative finishes made in Nairobi.',
    eyebrow: 'The full range',
    insideTitle: 'One manufacturer, wall to roof.',
    intro: 'From the primer that goes on first to the finish everybody sees — every coat on the building can come from the same plant, mixed to the same standard.',
    flap: 'Cloud Paints is manufactured in Industrial Area, Nairobi by Cloudsent Decor Ltd — a decade in home décor and interiors before we started making the paint ourselves. We know what Kenyan sun, rain and dust do to a wall, because we have been repainting them.',
    cover: 'projects/cloud-red-roof-residence.jpg',
    slugs: ['silk-vinyl', 'vinyl-matt', 'iris-economy', 'weatherguard', 'rocketex',
            'roof-paint', 'supermatt', 'super-gloss', 'gloss-enamel', 'clear-varnish',
            'road-marking', 'turpentine'],
  },
  {
    name: 'interior', accent: '#6b1f6e',
    title: 'Interior <em>walls</em> &amp; ceilings',
    kicker: 'Silk, matt and economy emulsions for rooms people live in.',
    eyebrow: 'Interior emulsions',
    insideTitle: 'The right sheen for the room.',
    intro: 'Sheen is the decision most people get wrong. Silk lifts colour and wipes clean; matt hides an uneven wall and calms a bright room. Here is how the three lines differ.',
    flap: 'Every interior emulsion we make is water-based, lead-free and low odour, so a room can be lived in again quickly. All three lines tint to the same colour card at our counter.',
    cover: 'applied/vinyl-matt-applied.jpg',
    slugs: ['silk-vinyl', 'vinyl-matt', 'iris-economy', 'supermatt', 'universal-undercoat'],
  },
  {
    name: 'exterior', accent: '#8b1e2c',
    title: 'Exterior <em>protection</em>',
    kicker: 'Weatherguard, textured masonry coatings and roof paint.',
    eyebrow: 'Exterior & roof',
    insideTitle: 'The coat that takes the weather.',
    intro: 'An exterior wall in Kenya takes hard sun, hard rain and dust, often in the same week. These are the coatings built for that, and the primer that should go under them.',
    flap: 'Coastal and lakeside buildings weather faster than upcountry ones. If you are painting in Mombasa, Kilifi, Diani or Kisumu, tell us — it changes what we recommend and how many coats you need.',
    cover: 'applied/weatherguard-applied.jpg',
    slugs: ['weatherguard', 'rocketex', 'vinyl-matt', 'roof-paint', 'supermatt'],
  },
  {
    name: 'wood-metal', accent: '#0f1f5c',
    title: 'Wood, <em>metal</em> &amp; floors',
    kicker: 'Enamels, varnishes, primers and the thinners that go with them.',
    eyebrow: 'Wood, metal & floors',
    insideTitle: 'Gloss that stays glossy.',
    intro: 'Doors, window frames, grilles, gates, balustrades and floors all take a beating. These are the hard-drying finishes for them — and the primers that make them last.',
    flap: 'Enamel work lives or dies on preparation. Bare metal wants a metal primer, bare wood wants a sanding seal, and both want the surface dry. Ask us and we will walk you through it.',
    cover: 'applied/clear-varnish-applied.jpg',
    slugs: ['super-gloss', 'gloss-enamel', 'clear-varnish', 'varnish-stain',
            'metal-primer', 'universal-undercoat', 'floor-paint', 'road-marking',
            'turpentine', 'white-spirit', 'standard-thinner'],
  },
  {
    name: 'textures', accent: '#7a6b5c',
    title: 'Decorative <em>finishes</em>',
    kicker: 'Stone, concrete, marble and metallic textures applied by hand.',
    eyebrow: 'Textured & decorative',
    insideTitle: 'Where a flat wall was.',
    intro: 'A textured finish does what paint cannot: it gives a wall depth, shadow and a surface worth touching. Each of these is applied by hand, so the wall is never quite the same twice.',
    flap: 'Textured finishes are sold by weight or volume and applied with a trowel, roller or sponge depending on the effect. Coverage varies with how heavily it is laid on — bring your wall measurements and we will work it out with you.',
    cover: 'textures/finish-cloud-venetian-marble.jpg',
    slugs: textures.map(t => t.slug),
  },
];

for (const b of BROCHURES) made.push(write(`html/brochures/${b.name}.html`, brochure(b)));
console.log(`  brochures     ${BROCHURES.length} tri-folds, 2 sides each`);

made.push(write('html/price-list.html', priceList()));
console.log(`  price list    1 document`);

made.push(write('html/colour-collection.html', colourCollection()));
{
  const C = loadColours();
  console.log(`  colour card   ${C.shades.length} shades · ${C.families.length} families`);
}

const skipped = P.filter(p => !heroImage(p, 0)).map(p => p.name);
console.log(`\n  ${made.length} HTML masters written to client-package/html/`);
if (skipped.length) {
  console.log(`\n  No print-quality photograph — no individual flier generated:`);
  skipped.forEach(s => console.log(`    · ${s}`));
  console.log(`  These still appear in the range tables and the price list.`);
}
