// ============================================================
// CLOUD PAINTS — Legal page TOC scrollspy
// Highlights the TOC link for the section currently in view.
// ============================================================

(function () {
  'use strict';

  function init() {
    var toc = document.querySelector('.lg-toc');
    if (!toc || !('IntersectionObserver' in window)) return;
    var links = Array.from(toc.querySelectorAll('a[href^="#"]'));
    var map = {};
    links.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      var sec = document.getElementById(id);
      if (sec) map[id] = a;
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var a = map[entry.target.id];
        if (!a) return;
        if (entry.isIntersecting) {
          links.forEach(function (l) { l.classList.remove('is-active'); });
          a.classList.add('is-active');
        }
      });
    }, {
      rootMargin: '-100px 0px -55% 0px',
      threshold: 0,
    });

    Object.values(map).forEach(function (a) {
      var sec = document.getElementById(a.getAttribute('href').slice(1));
      if (sec) io.observe(sec);
    });
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
