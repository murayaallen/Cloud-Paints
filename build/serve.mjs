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
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.argv[2]) || 8322;

/* Serve the site from a subdirectory, the way a GitHub Pages project site
   does: `node build/serve.mjs 8323 /Cloud-Paints`. Production is the domain
   root, but the site has to survive being mounted anywhere, and the only
   way to know it does is to serve it that way. */
const MOUNT = (() => {
  // Accept "Cloud-Paints" or "/Cloud-Paints". A Git Bash shell rewrites a
  // bare leading slash into a Windows path before Node ever sees it, so the
  // slash-less form is the one that survives every shell.
  const raw = (process.argv[3] || '').trim().replace(/^[A-Za-z]:[\/].*[\/]/, '');
  const clean = raw.replace(/^\/+|\/+$/g, '');
  return clean ? '/' + clean : '';
})();

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
const mounted = p => (MOUNT ? MOUNT + p : p);

/* Production runs mod_deflate over HTML, CSS, JS, SVG and XML. Serving those
   uncompressed here would make every local measurement of page weight and
   load time pessimistic by roughly a factor of four on exactly the files
   that block rendering — so the harness compresses them too. */
const COMPRESS = /^(text\/|application\/(javascript|json|xml)|image\/svg)/;

const serveFile = (res, file, code = 200, req) => {
  const ext = path.extname(file).toLowerCase();
  const type = TYPES[ext] || 'application/octet-stream';
  let body = fs.readFileSync(file);
  const headers = { 'Content-Type': type };

  const accepts = (req && req.headers['accept-encoding'] || '').includes('gzip');
  if (accepts && COMPRESS.test(type) && body.length > 512) {
    body = zlib.gzipSync(body, { level: 6 });
    headers['Content-Encoding'] = 'gzip';
    headers['Vary'] = 'Accept-Encoding';
  }
  headers['Content-Length'] = body.length;
  send(res, code, body, headers);
};

http.createServer((req, res) => {
  let [pathname, query = ''] = req.url.split('?');
  try { pathname = decodeURIComponent(pathname); } catch { /* leave as-is */ }

  if (MOUNT) {
    if (pathname === MOUNT) return redirect(res, MOUNT + '/');
    if (!pathname.startsWith(MOUNT + '/')) {
      return send(res, 404, `Not found. The site is mounted at ${MOUNT}/`,
        { 'Content-Type': 'text/plain' });
    }
    pathname = pathname.slice(MOUNT.length) || '/';
  }

  // .htaccess rule: never serve the workshop
  if (BLOCKED_DIR.test(pathname) || BLOCKED_EXT.test(pathname)) {
    return send(res, 403, 'Forbidden', { 'Content-Type': 'text/plain' });
  }

  // .htaccess rule 2 — old product URLs
  if (pathname === '/product.html') {
    const m = query.match(/(?:^|&)(?:p|slug)=([a-z0-9-]+)(?:&|$)/);
    return redirect(res, mounted(m ? `/paints/${m[1]}` : '/products'));
  }

  // .htaccess rule 3 — retire the .html extension
  if (pathname.endsWith('.html') && pathname !== '/404.html') {
    return redirect(res, mounted(pathname.slice(0, -5)) + (query ? '?' + query : ''));
  }

  if (pathname === '/') pathname = '/index.html';

  const asFile = path.join(ROOT, pathname);
  const asPage = path.join(ROOT, pathname.replace(/\/$/, '') + '.html');

  // .htaccess rule 4 — clean URL to the file behind it
  if (fs.existsSync(asFile) && fs.statSync(asFile).isFile()) return serveFile(res, asFile, 200, req);
  if (fs.existsSync(asPage) && fs.statSync(asPage).isFile()) return serveFile(res, asPage, 200, req);

  const notFound = path.join(ROOT, '404.html');
  if (fs.existsSync(notFound)) return serveFile(res, notFound, 404, req);
  return send(res, 404, 'Not found', { 'Content-Type': 'text/plain' });
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Cloud Paints — serving ${ROOT}`);
  console.log(`  http://127.0.0.1:${PORT}${MOUNT}/`);
  if (MOUNT) console.log(`  mounted at ${MOUNT} — the GitHub Pages shape`);
  console.log(`  clean URLs, 301s and the production CSP are all in force here.`);
});
