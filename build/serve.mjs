// ============================================================
// CLOUD PAINTS — local server
// ============================================================
//   node build/serve.mjs [port]
//
// A plain static server would not tell you whether the site works,
// because in production .htaccess does real work: it serves /products
// from products.html, redirects the old URLs, and sets a strict
// Content-Security-Policy. This mirrors those rules so the thing you
// test is the thing you deploy — including the CSP, which is the one
// header that can break a working site on the way out the door.
//
// It is a development tool. It is not in the zip.
// ============================================================

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.argv[2]) || 8322;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
  '.pdf': 'application/pdf', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
  '.mp4': 'video/mp4', '.webm': 'video/webm',
};

// Kept byte-identical to the policy in .htaccess. If you change one,
// change both — that is the whole point of testing against it.
const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline'; "
  + "style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; "
  + "connect-src 'self'; frame-src 'self' https://www.openstreetmap.org; "
  + "media-src 'self'; object-src 'none'; frame-ancestors 'self'; "
  + "base-uri 'self'; form-action 'self'";

const SECURITY = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',
  'Content-Security-Policy': CSP,
};

const BLOCKED_DIR = /^\/(build|client-package|new|samples|Finishes|\.git|\.claude)\//i;
const BLOCKED_EXT = /\.(md|mjs|py|json|zip|docx|bak)$/i;

const send = (res, code, body, headers = {}) => {
  res.writeHead(code, { ...SECURITY, ...headers });
  res.end(body);
};
const redirect = (res, to) => send(res, 301, '', { Location: to, 'Content-Type': 'text/plain' });

const serveFile = (res, file, code = 200) => {
  const ext = path.extname(file).toLowerCase();
  const body = fs.readFileSync(file);
  send(res, code, body, {
    'Content-Type': TYPES[ext] || 'application/octet-stream',
    'Content-Length': body.length,
  });
};

http.createServer((req, res) => {
  let [pathname, query = ''] = req.url.split('?');
  try { pathname = decodeURIComponent(pathname); } catch { /* leave as-is */ }

  // .htaccess rule: never serve the workshop
  if (BLOCKED_DIR.test(pathname) || BLOCKED_EXT.test(pathname)) {
    return send(res, 403, 'Forbidden', { 'Content-Type': 'text/plain' });
  }

  // .htaccess rule 2 — old product URLs
  if (pathname === '/product.html') {
    const m = query.match(/(?:^|&)(?:p|slug)=([a-z0-9-]+)(?:&|$)/);
    return redirect(res, m ? `/paints/${m[1]}` : '/products');
  }

  // .htaccess rule 3 — retire the .html extension
  if (pathname.endsWith('.html') && pathname !== '/404.html') {
    return redirect(res, pathname.slice(0, -5) + (query ? '?' + query : ''));
  }

  if (pathname === '/') pathname = '/index.html';

  const asFile = path.join(ROOT, pathname);
  const asPage = path.join(ROOT, pathname.replace(/\/$/, '') + '.html');

  // .htaccess rule 4 — clean URL to the file behind it
  if (fs.existsSync(asFile) && fs.statSync(asFile).isFile()) return serveFile(res, asFile);
  if (fs.existsSync(asPage) && fs.statSync(asPage).isFile()) return serveFile(res, asPage);

  const notFound = path.join(ROOT, '404.html');
  if (fs.existsSync(notFound)) return serveFile(res, notFound, 404);
  return send(res, 404, 'Not found', { 'Content-Type': 'text/plain' });
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Cloud Paints — serving ${ROOT}`);
  console.log(`  http://127.0.0.1:${PORT}/`);
  console.log(`  clean URLs, 301s and the production CSP are all in force here.`);
});
