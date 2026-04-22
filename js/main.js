// ============================================================
// CLOUD PAINTS — Core JS
// Theme · Header · Scroll reveal · Mobile nav · Toast
// ============================================================

(function () {
  'use strict';

  // ---------- Theme ----------
  var THEME_KEY = 'cloud-theme';
  function getTheme() { return localStorage.getItem(THEME_KEY) || 'light'; }
  function setTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem(THEME_KEY, t);
    var btn = document.getElementById('themeToggle');
    if (btn) btn.querySelector('.sun').style.display = t === 'dark' ? 'block' : 'none';
    if (btn) btn.querySelector('.moon').style.display = t === 'dark' ? 'none' : 'block';
  }
  setTheme(getTheme());
  // Re-apply after partials.js injects the header button
  document.addEventListener('DOMContentLoaded', function () { setTheme(getTheme()); });

  document.addEventListener('click', function (e) {
    if (e.target.closest('#themeToggle')) {
      setTheme(getTheme() === 'dark' ? 'light' : 'dark');
    }
  });

  // ---------- Header scroll ----------
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 30) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- Mobile nav ----------
  document.addEventListener('click', function (e) {
    if (e.target.closest('#menuToggle')) {
      document.querySelector('.nav').classList.toggle('open');
    } else if (e.target.closest('.nav a')) {
      document.querySelector('.nav').classList.remove('open');
    }
  });

  // ---------- Legacy reveal (kept for pages not yet migrated) ----------
  // New `[data-anim]` reveals are handled by js/motion.js. This block still
  // runs for legacy `.reveal`/`.stagger` classes on pages we haven't rebuilt
  // yet. It is idempotent — motion.js ignores these classes.
  var legacyReveal = document.querySelectorAll('.reveal, .reveal-l, .reveal-r, .stagger, .split-chars');
  if (legacyReveal.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    legacyReveal.forEach(function (el) { io.observe(el); });
  } else {
    legacyReveal.forEach(function (el) { el.classList.add('in'); });
  }

  // ---------- Char-by-char split for headlines ----------
  document.querySelectorAll('[data-split-chars]').forEach(function (el) {
    var text = el.textContent;
    el.textContent = '';
    el.classList.add('split-chars');
    var i = 0;
    text.split('').forEach(function (ch) {
      var span = document.createElement('span');
      span.textContent = ch === ' ' ? '\u00A0' : ch;
      span.style.setProperty('--i', i);
      el.appendChild(span);
      i++;
    });
  });

  // ---------- Animated counters ----------
  // Supports both data-count="N" (index.html) and data-count-to="N" (about/projects)
  var counters = document.querySelectorAll('[data-count],[data-count-to]');
  if (counters.length && 'IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var target = parseInt(el.dataset.count || el.dataset.countTo, 10) || 0;
          var duration = 1600;
          var start = performance.now();
          function step(now) {
            var p = Math.min(1, (now - start) / duration);
            var v = Math.floor(target * (1 - Math.pow(1 - p, 3)));
            el.textContent = v;
            if (p < 1) requestAnimationFrame(step);
            else el.textContent = target;
          }
          requestAnimationFrame(step);
          co.unobserve(el);
        }
      });
    }, { threshold: 0.25, rootMargin: '0px 0px -5% 0px' });
    counters.forEach(function (c) { co.observe(c); });
  }

  // ---------- Toast ----------
  window.showToast = function (message, icon) {
    var t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = (icon || '<svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>') + '<span>' + message + '</span>';
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('show'); }, 10);
    setTimeout(function () {
      t.classList.remove('show');
      setTimeout(function () { t.remove(); }, 400);
    }, 2400);
  };

  // ---------- Smooth anchor scroll ----------
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (href.length < 2) return;
    var target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  // ---------- Magnetic buttons (subtle) ----------
  document.querySelectorAll('[data-magnetic]').forEach(function (btn) {
    btn.addEventListener('mousemove', function (e) {
      var r = btn.getBoundingClientRect();
      var x = e.clientX - r.left - r.width / 2;
      var y = e.clientY - r.top - r.height / 2;
      btn.style.transform = 'translate(' + x * 0.18 + 'px,' + y * 0.18 + 'px)';
    });
    btn.addEventListener('mouseleave', function () { btn.style.transform = ''; });
  });

  // ---------- Re-trigger legacy reveal after loader dismisses -------
  // Observer fires on DOMContentLoaded but the splash covers the page
  // until ~2.2s. Once loader:done emits, re-observe anything still dormant.
  window.addEventListener('loader:done', function () {
    if (typeof io === 'undefined') return;
    document.querySelectorAll('.reveal, .reveal-l, .reveal-r, .stagger').forEach(function (el) {
      if (!el.classList.contains('in')) io.observe(el);
    });
  });

  // ---------- Hero headline: stagger each .stack word --------
  document.querySelectorAll('.hero h1 .stack').forEach(function (el, i) {
    el.style.transitionDelay = (0.08 + i * 0.12) + 's';
  });

})();
