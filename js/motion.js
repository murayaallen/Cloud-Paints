// ============================================================
// CLOUD PAINTS — Motion System
// Boots Lenis smooth scroll (desktop only) + GSAP ScrollTrigger.
// Wires the [data-anim] directional reveal pattern and exposes
// a few small helpers for pages to extend with their own
// choreography (landing hero pour, product pages, etc.).
//
// Gated on the `loader:done` CustomEvent emitted by loader.js,
// so reveal motion doesn't fire while the splash is covering
// the page.
// ============================================================

(function () {
  'use strict';

  var prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = matchMedia('(pointer: coarse)').matches;
  var isMobile = window.innerWidth < 768;

  // ---- Public namespace --------------------------------------
  window.CP = window.CP || {};
  window.CP.motion = {
    reduced: prefersReduce,
    mobile: isMobile,
    ready: false,
    lenis: null
  };

  // ---- Fallback IntersectionObserver reveal ------------------
  // Runs in reduced-motion mode or if GSAP fails to load.
  function fallbackReveal() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('[data-anim]').forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });

    document.querySelectorAll('[data-anim]').forEach(function (el, i) {
      // Apply stagger index if under a reveal-parent
      if (el.parentElement && el.parentElement.classList.contains('reveal-parent')) {
        el.style.setProperty('--i', i);
      }
      io.observe(el);
    });
  }

  // ---- GSAP-powered reveal -----------------------------------
  function gsapReveal() {
    if (!window.gsap || !window.ScrollTrigger) return fallbackReveal();
    window.gsap.registerPlugin(window.ScrollTrigger);

    // Group elements by parent for natural stagger
    var groups = new Map();
    document.querySelectorAll('[data-anim]').forEach(function (el) {
      var parent = el.closest('.reveal-parent') || el.parentElement;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(el);
    });

    groups.forEach(function (els, parent) {
      window.ScrollTrigger.create({
        trigger: parent,
        start: 'top 85%',
        once: true,
        onEnter: function () {
          els.forEach(function (el, i) {
            setTimeout(function () { el.classList.add('is-in'); }, i * 80);
          });
        }
      });
    });

    // Parallax layers — any element with data-parallax=0.3 (multiplier of scroll)
    document.querySelectorAll('[data-parallax]').forEach(function (el) {
      var speed = parseFloat(el.dataset.parallax) || 0.2;
      window.gsap.to(el, {
        yPercent: speed * -20,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    });

    // Mark ready
    window.CP.motion.ready = true;
    window.dispatchEvent(new CustomEvent('cp:motion-ready'));
  }

  // ---- Lenis smooth scroll (desktop + touch laptops) ---------
  function initLenis() {
    if (prefersReduce || isMobile || !window.Lenis) return;
    try {
      var lenis = new window.Lenis({
        duration: 1.3,
        easing: function (t) { return 1 - Math.pow(1 - t, 4); },
        smoothWheel: true,
        wheelMultiplier: 0.9,
        touchMultiplier: 1.5,
        infinite: false
      });
      window.CP.motion.lenis = lenis;

      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);

      // Keep ScrollTrigger in sync
      if (window.ScrollTrigger) {
        lenis.on('scroll', window.ScrollTrigger.update);
      }
    } catch (e) { /* silent */ }
  }

  // ---- Kick-off ---------------------------------------------
  // Wait for loader:done so splash finishes before reveals play.
  var kicked = false;
  function boot() {
    if (kicked) return;
    kicked = true;

    if (prefersReduce) {
      document.querySelectorAll('[data-anim]').forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    initLenis();
    gsapReveal();
  }

  window.addEventListener('loader:done', boot);

  // Safety net: if loader:done never fires (e.g. loader.js not on page),
  // boot after window load + small delay so content is ready.
  window.addEventListener('load', function () {
    setTimeout(function () { if (!kicked) boot(); }, 200);
  });

  // Recompute ScrollTrigger on resize (debounced)
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    }, 200);
  });

})();
