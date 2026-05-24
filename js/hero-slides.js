// ============================================================
// CLOUD PAINTS — Hero rotation
// Slide 0 = brand "stunner": company studio backdrop + animated
// Cloud Paints logo (in place of the bucket) with effects.
// Slides 1+ = bucket-in-painted-room — every bucket paired to
// a room that matches the paint's category (interior emulsion
// with interior rooms, exterior coatings with exterior shots).
// ============================================================

(function () {
  'use strict';

  var SLIDES = [
    // 0 — Brand stage. No bucket; the logo replaces it.
    {
      type:  'brand',
      bg:    'images/showroom/showroom-hero-new.jpg',
      color: '#e11f29',
      name:  'Cloud Paints',
    },
    // 1 — Weatherguard (exterior emulsion) ↔ modern villa exterior
    {
      type:  'bucket',
      src:   'images/buckets/hero/weatherguard.png',
      bg:    'images/inspiration/inspiration-villa-cream-charcoal.jpg',
      color: '#d92843',
      name:  'Weatherguard',
    },
    // 2 — Silk Vinyl (interior premium emulsion) ↔ warm interior bedroom
    {
      type:  'bucket',
      src:   'images/buckets/hero/silk-vinyl.png',
      bg:    'images/inspiration/inspiration-clay-bedroom.jpg',
      color: '#9b2ca8',
      name:  'Silk Vinyl',
    },
    // 3 — Rocketex (textured exterior) ↔ apartment block exterior
    {
      type:  'bucket',
      src:   'images/buckets/hero/rocketex.png',
      bg:    'images/inspiration/inspiration-apartments-sage.jpg',
      color: '#1f4088',
      name:  'Rocketex Wallmaster',
    },
    // 4 — Premium Emulsion (interior) ↔ warm gold living
    {
      type:  'bucket',
      src:   'images/buckets/hero/mockup-b.png',
      bg:    'images/inspiration/inspiration-savanna-living.jpg',
      color: '#c4870a',
      name:  'Premium Emulsion',
    },
    // 5 — Gloss Enamel (trim) ↔ soft-blue coastal bedroom
    {
      type:  'bucket',
      src:   'images/buckets/hero/gloss-enamel.png',
      bg:    'images/inspiration/inspiration-coastal-bedroom.jpg',
      color: '#1a56db',
      name:  'Gloss Enamel',
    },
    // 6 — Iris Emulsion (mockup-c, interior) ↔ rich terracotta living
    {
      type:  'bucket',
      src:   'images/buckets/hero/mockup-c.png',
      bg:    'images/inspiration/inspiration-terracotta-living.jpg',
      color: '#a83a1c',
      name:  'Iris Plastic Emulsion',
    },
  ];

  // Brand slide holds longer (let the effects breathe);
  // regular slides at the standard tempo.
  var BRAND_HOLD_MS  = 6500;
  var SLIDE_HOLD_MS  = 5200;
  var FADE_MS        = 900;

  var current = 0;
  var busy    = false;
  var timer   = null;

  var pour, bucketA, bucketB, bgA, bgB, brandStage;

  function applyColor(color) {
    if (pour) pour.style.setProperty('--hero-color', color);
    if (bucketA) bucketA.style.setProperty('--bucket-glow', color);
    if (bucketB) bucketB.style.setProperty('--bucket-glow', color);
  }

  function switchTo(index) {
    if (busy) return;
    busy = true;
    var slide = SLIDES[index];

    var inactiveBg = (bgA && bgB) ? (bgA.classList.contains('hs-active') ? bgB : bgA) : null;
    var activeBg   = (bgA && bgB) ? (bgA.classList.contains('hs-active') ? bgA : bgB) : null;
    if (inactiveBg) inactiveBg.src = slide.bg;

    var inactiveBucket, activeBucket;
    if (slide.type === 'bucket') {
      inactiveBucket = bucketA.classList.contains('hs-active') ? bucketB : bucketA;
      activeBucket   = bucketA.classList.contains('hs-active') ? bucketA : bucketB;
      inactiveBucket.src = slide.src;
    }

    var pending = 0;
    function done() {
      pending--;
      if (pending > 0) return;
      applyColor(slide.color);

      // Switch foreground: brand stage vs bucket image
      if (slide.type === 'brand') {
        if (brandStage) {
          // Force animation reset by toggling off then on so keyframes replay
          brandStage.classList.remove('hs-active');
          // Force reflow
          void brandStage.offsetWidth;
          brandStage.classList.add('hs-active');
        }
        bucketA.classList.remove('hs-active');
        bucketB.classList.remove('hs-active');
      } else {
        if (brandStage) brandStage.classList.remove('hs-active');
        if (activeBucket)   activeBucket.classList.remove('hs-active');
        if (inactiveBucket) inactiveBucket.classList.add('hs-active');
      }

      // Crossfade bg
      if (inactiveBg) {
        inactiveBg.classList.add('hs-active');
        activeBg.classList.remove('hs-active');
      }

      setTimeout(function () { busy = false; }, FADE_MS + 50);
    }

    // Preload checks
    if (inactiveBg) {
      var bgReady = inactiveBg.complete && inactiveBg.naturalWidth > 0;
      if (!bgReady) { pending++; inactiveBg.onload = done; inactiveBg.onerror = done; }
    }
    if (slide.type === 'bucket' && inactiveBucket) {
      var bucketReady = inactiveBucket.complete && inactiveBucket.naturalWidth > 0;
      if (!bucketReady) { pending++; inactiveBucket.onload = done; inactiveBucket.onerror = done; }
    }
    if (pending === 0) { pending = 1; done(); }
  }

  function scheduleNext() {
    var hold = SLIDES[current].type === 'brand' ? BRAND_HOLD_MS : SLIDE_HOLD_MS;
    clearTimeout(timer);
    timer = setTimeout(function () {
      current = (current + 1) % SLIDES.length;
      switchTo(current);
      scheduleNext();
    }, hold);
  }

  function preloadAll() {
    SLIDES.forEach(function (s, i) {
      if (i === 0) return;
      if (s.src) { var b = new Image(); b.src = s.src; }
      if (s.bg)  { var g = new Image(); g.src = s.bg; }
    });
  }

  function init() {
    pour       = document.querySelector('.lp-pour');
    brandStage = document.querySelector('.lp-hero-brand');
    var bucketEl = document.querySelector('.lp-hero-bucket');
    var bgEl     = document.querySelector('.lp-hero-bg');
    if (!pour || !bucketEl) return;

    var bImgs = bucketEl.querySelectorAll('img');
    bucketA = bImgs[0]; bucketB = bImgs[1];

    if (bgEl) {
      var bgImgs = bgEl.querySelectorAll('img.lp-hero-bg-img');
      bgA = bgImgs[0]; bgB = bgImgs[1];
    }

    // Initial state — slide 0 is the brand stage
    if (bgA) bgA.src = SLIDES[0].bg;
    if (bgA) bgA.classList.add('hs-active');
    bucketA.classList.remove('hs-active');
    bucketB.classList.remove('hs-active');
    if (brandStage) brandStage.classList.add('hs-active');
    applyColor(SLIDES[0].color);

    function startSlides() {
      preloadAll();
      scheduleNext();
    }

    if (document.body.classList.contains('cp-ready')) {
      startSlides();
    } else {
      window.addEventListener('loader:done', startSlides, { once: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
