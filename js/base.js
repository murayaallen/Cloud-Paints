// ============================================================
// CLOUD PAINTS — where the site is mounted
// ============================================================
// Must be the first script on every page.
//
// The site is served from the domain root in production, but not
// everywhere: a GitHub Pages project site puts it under
// /<repo>/, and a staging box often puts it in a folder. Product
// pages also sit one level down at /paints/<slug>, so a bare
// "images/logo.png" written into the shared header would resolve
// against /paints/ and 404 there.
//
// Absolute paths fix the depth problem and break the mount-point
// one. Relative paths do the reverse. So: HTML uses relative
// paths, which the browser resolves correctly at any mount point,
// and anything built in JavaScript — the header, the footer, the
// hero rotation, the product art — goes through here.
//
// The mount point is read from this file's own URL, which is the
// one path on the page the browser has already resolved for us.
// ============================================================

(function () {
  'use strict';

  var self = document.currentScript || (function () {
    var all = document.getElementsByTagName('script');
    for (var i = all.length - 1; i >= 0; i--) {
      if (/js\/base\.js(?:[?#]|$)/.test(all[i].src || '')) return all[i];
    }
    return null;
  })();

  // "https://host/Cloud-Paints/js/base.js" -> "https://host/Cloud-Paints/"
  var base = self && self.src
    ? self.src.replace(/js\/base\.js(?:[?#].*)?$/, '')
    : '/';

  window.CP_BASE = base;

  /** Resolve a site-root path against wherever the site is mounted.
   *  Absolute URLs, protocol-relative URLs, fragments and data URIs
   *  are returned untouched. */
  window.cpUrl = function (p) {
    if (!p) return '';
    p = String(p);
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(p)) return p;
    return base + p.replace(/^\/+/, '');
  };

  /** Rewrite every root-relative href/src in a block of generated HTML.
   *  One pass over the header, footer and drawer markup is cheaper and
   *  far less error-prone than threading cpUrl() through sixty string
   *  concatenations — and it cannot be forgotten on the sixty-first. */
  window.cpLocalise = function (html) {
    if (!html) return html;
    return String(html).replace(/(\s(?:href|src|poster)=")\/(?!\/)/g, '$1' + base);
  };
})();
