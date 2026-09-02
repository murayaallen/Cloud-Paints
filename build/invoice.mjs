// ============================================================
// INVOICE — Cloud Paints website and print package
// ============================================================
//   node build/invoice.mjs
//
// Writes invoices/invoice.html and prints it to invoices/invoice.pdf
// with headless Edge.
//
// EDIT THE BLOCK MARKED "FROM" BEFORE SENDING. Everything there is a
// placeholder except the email, which is taken from the git config on
// this machine — check it is the one you want on an invoice, and put
// your real trading name, phone and payment details in. An invoice
// with a bank line nobody can pay into is worse than no invoice.
//
// The client's details come from the same company record the whole
// print package uses, so the address on this matches the address on
// everything else they have been given.
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTDIR = path.join(ROOT, 'invoices');

/* ---------- FROM — YOUR DETAILS. Fill these in. ------------------------ */
const FROM = {
  name:    'Allen Muraya',
  trading: '',                       // trading name, if you invoice under one
  phone:   '',                       // <-- add
  email:   'murayamakingedits@gmail.com',
  address: '',                       // <-- add, if you want one shown
  // How you want paying. Leave a line blank and it is not printed.
  pay: {
    'M-Pesa':      '',               // <-- Paybill / Till / phone number
    'Bank':        '',               // <-- bank name
    'Account name': '',
    'Account no.': '',
  },
};

/* ---------- TO — the client -------------------------------------------- */
const TO = {
  company: 'Cloudsent Decor Ltd',
  brand:   'Cloud Paints',
  lines: [
    '10 Rangwe Road, off Lunga Lunga Road',
    'Industrial Area, Nairobi',
    'P.O. Box 44192–00100',
  ],
};

/* ---------- The invoice ------------------------------------------------- */
const INVOICE = {
  number: 'CP-2026-001',
  date:   new Date().toISOString().slice(0, 10),
  terms:  'Balance due on receipt',
  currency: 'Kshs',
  total: 40000,
  // Paid so far, in the order it was paid.
  payments: [
    { when: 'On commencement', label: 'Deposit',        amount: 10000 },
    { when: 'Mid-project',     label: 'Second payment', amount: 15000 },
  ],
};

/* What the fee covers. Priced as one project fee rather than broken into
   invented per-item figures — the total was agreed as a whole. */
const SCOPE = [
  ['Website — design, build and deployment',
   'cloudpaints.co.ke. 28 product pages, 544-shade colour collection, colour '
   + 'visualiser, services, projects and contact. Responsive. Clean URLs, security '
   + 'headers and caching configured.'],

  ['Search presence',
   'Search Console set up and verified, sitemap submitted, structured data, indexing '
   + 'faults corrected.'],

  ['Print package — 70 press-ready documents',
   'Range flier in 3 formats. Price list. 21-page colour shade card. 5 brochures. '
   + '28 product fliers, A4 and A5. Range poster, A2 and A3.'],

  ['Price list — editable Word version',
   'Built from the same source as the printed list, so the two stay in step.'],

  ['Product photography preparation',
   '28 tins cut out and prepared for press and web.'],
];

/* ----------------------------------------------------------------------- */
const money = n => INVOICE.currency + '. ' + n.toLocaleString('en-KE');
const paid = INVOICE.payments.reduce((t, p) => t + p.amount, 0);
const due = INVOICE.total - paid;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const payRows = Object.entries(FROM.pay).filter(([, v]) => v)
  .map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('');

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Invoice ${esc(INVOICE.number)}</title>
<style>
@page { size: 210mm 297mm; margin: 0; }
* { margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
body { font:400 10pt/1.5 'Segoe UI', Arial, sans-serif; color:#14161f; }
.sheet { width:210mm; height:297mm; padding:16mm 18mm 14mm; position:relative;
        overflow:hidden; }

.head { display:flex; justify-content:space-between; align-items:flex-start;
        border-bottom:1.2mm solid #14213d; padding-bottom:6mm; }
.head h1 { font:700 26pt/1 'Segoe UI', Arial, sans-serif; letter-spacing:.02em;
           color:#14213d; text-transform:uppercase; }
.head .meta { text-align:right; font-size:9pt; color:#4a4f60; line-height:1.7; }
.head .meta b { color:#14161f; }

.parties { display:flex; gap:12mm; margin-top:6mm; }
.parties > div { flex:1; }
.k { font:700 7.6pt/1 'Segoe UI', Arial, sans-serif; letter-spacing:.16em;
     text-transform:uppercase; color:#8a8f9e; margin-bottom:2.5mm; }
.parties .nm { font-weight:600; font-size:11pt; }
.parties p { font-size:9.4pt; color:#4a4f60; }

table { width:100%; border-collapse:collapse; margin-top:7mm; }
th { text-align:left; font:700 7.6pt/1 'Segoe UI', Arial, sans-serif; letter-spacing:.14em;
     text-transform:uppercase; color:#fff; background:#14213d; padding:3mm 3.5mm; }
td { padding:2.8mm 3.5mm; border-bottom:.3mm solid #d8dbe3; vertical-align:top; }
td.d b { font-size:10.4pt; }
td.d span { display:block; font-size:9pt; color:#565b6b; margin-top:1.2mm; }
td.a { text-align:right; white-space:nowrap; font-weight:600; }

.sums { margin-top:5mm; margin-left:auto; width:88mm; }
.sums div { display:flex; justify-content:space-between; padding:2.4mm 0;
            font-size:10pt; border-bottom:.3mm solid #d8dbe3; }
.sums div span { color:#565b6b; }
.sums div b { font-variant-numeric:tabular-nums; }
.sums .paid b { color:#1c7a4a; }
.sums .due { margin-top:2mm; background:#14213d; color:#fff; border:0;
             padding:4mm 4mm; border-radius:1.4mm; font-size:12pt; }
.sums .due span, .sums .due b { color:#fff; }
.sums .due b { font-weight:700; }

.pay { margin-top:6mm; padding:5mm 5.5mm; background:#f4f5f8; border-radius:1.4mm;
       border-left:1.4mm solid #14213d; }
.pay .row div { display:flex; justify-content:space-between; font-size:9.6pt;
                padding:1.4mm 0; }
.pay .row div span { color:#565b6b; }
.foot { position:absolute; left:18mm; right:18mm; bottom:14mm;
        border-top:.3mm solid #d8dbe3; padding-top:4mm;
        font-size:8.6pt; color:#7a7f8e; display:flex; justify-content:space-between; }
.note { margin-top:6mm; font-size:9pt; color:#565b6b; }
</style></head><body>
<div class="sheet">
  <div class="head">
    <h1>Invoice</h1>
    <div class="meta">
      <div>Invoice <b>${esc(INVOICE.number)}</b></div>
      <div>Date <b>${esc(INVOICE.date)}</b></div>
      <div>Terms <b>${esc(INVOICE.terms)}</b></div>
    </div>
  </div>

  <div class="parties">
    <div>
      <div class="k">From</div>
      <p class="nm">${esc(FROM.trading || FROM.name)}</p>
      ${FROM.trading ? `<p>${esc(FROM.name)}</p>` : ''}
      ${FROM.address ? `<p>${esc(FROM.address)}</p>` : ''}
      ${FROM.phone ? `<p>${esc(FROM.phone)}</p>` : ''}
      <p>${esc(FROM.email)}</p>
    </div>
    <div>
      <div class="k">Billed to</div>
      <p class="nm">${esc(TO.company)}</p>
      <p>${esc(TO.brand)}</p>
      ${TO.lines.map(l => `<p>${esc(l)}</p>`).join('')}
    </div>
  </div>

  <table>
    <tr><th style="width:74%">Description</th><th style="text-align:right">Amount</th></tr>
    ${SCOPE.map((s, i) => `<tr>
      <td class="d"><b>${esc(s[0])}</b><span>${esc(s[1])}</span></td>
      <td class="a">${i === 0 ? money(INVOICE.total) : '—'}</td>
    </tr>`).join('')}
  </table>

  <div class="sums">
    <div><span>Project total</span><b>${money(INVOICE.total)}</b></div>
    ${INVOICE.payments.map(p => `<div class="paid">
      <span>${esc(p.label)} — ${esc(p.when)}</span><b>&minus; ${money(p.amount)}</b></div>`).join('')}
    <div class="due"><span>Balance due</span><b>${money(due)}</b></div>
  </div>

  ${payRows ? `<div class="pay">
    <div class="k">Payment</div>
    <div class="row">${payRows}</div>
  </div>` : `<div class="note"><b>Payment details are not set.</b>
    Open build/invoice.mjs, fill in the FROM.pay block and re-run before sending.</div>`}

  <div class="note">Agreed as one project fee; the lines above set out what it covers.
    ${money(paid)} received with thanks.</div>

  <div class="foot">
    <span>${esc(FROM.trading || FROM.name)} · ${esc(FROM.email)}</span>
    <span>Invoice ${esc(INVOICE.number)}</span>
  </div>
</div></body></html>`;

fs.mkdirSync(OUTDIR, { recursive: true });
const htmlPath = path.join(OUTDIR, 'invoice.html');
const pdfPath = path.join(OUTDIR, 'invoice.pdf');
fs.writeFileSync(htmlPath, html, 'utf8');

const EDGE = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].find(p => fs.existsSync(p));

if (EDGE) {
  spawnSync(EDGE, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer',
    `--print-to-pdf=${pdfPath}`, 'file:///' + htmlPath.replace(/\\/g, '/')],
    { stdio: 'ignore' });
}

const missing = Object.entries({ phone: FROM.phone, ...FROM.pay })
  .filter(([, v]) => !v).map(([k]) => k);

console.log('  ' + htmlPath);
if (fs.existsSync(pdfPath)) console.log('  ' + pdfPath);
console.log('');
console.log('  Total        %s', money(INVOICE.total));
INVOICE.payments.forEach(p => console.log('  %-12s %s  (%s)', p.label, money(p.amount), p.when));
console.log('  Balance due  %s', money(due));
if (missing.length) {
  console.log('');
  console.log('  STILL BLANK — fill these in build/invoice.mjs before sending:');
  console.log('    ' + missing.join(', '));
}
