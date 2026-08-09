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
    // The bg now points at images/hero/hero-brand-stage.jpg, an
    // AI-generated branded backdrop yet to be created (see
    // AI-IMAGES-NEEDED.md Section 1A — Hero brand stage). Until that
    // file exists, CSS provides a vibrant brand gradient fallback on
    // .lp-hero-brand-bg so the slide never appears empty.
    {
      type:  'brand',
      bg:    'images/hero/hero-brand-stage.jpg',
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
    // 4 — SuperMatt Emulsion (interior ceilings & walls) ↔ owner photo of a
    // flat white ceiling + walls. Chalk-matte surfaces with no sheen are
    // exactly what SuperMatt sells, so the finish itself is the subject.
    {
      type:  'bucket',
      src:   'images/buckets/hero/supermatt.png',
      bg:    'images/products/applied/supermatt-applied.jpg',
      bgMobile: 'images/products/applied/supermatt-applied-portrait.jpg',
      color: '#7f95a3',
      name:  'SuperMatt Emulsion',
    },
    // 5 — Gloss Enamel (trim · doors · woodwork) ↔ owner photo of enamelled
    // metal cladding. Gloss on metal reads far truer than the old rust
    // hallway, where the emulsion walls dominated the frame.
    {
      type:  'bucket',
      src:   'images/buckets/hero/gloss-enamel.png',
      bg:    'images/products/applied/gloss-enamel-applied.jpg',
      bgMobile: 'images/products/applied/gloss-enamel-applied-portrait.jpg',
      color: '#5a7183',
      name:  'Gloss Enamel',
    },
    // 6 — Iris Plastic Emulsion (interior) ↔ owner photo of a warm cream
    // interior over timber. Broad, evenly-rolled emulsion walls and ceiling
    // are the subject.
    {
      type:  'bucket',
      src:   'images/buckets/hero/iris-economy.png',
      bg:    'images/products/applied/iris-economy-applied.jpg',
      color: '#b57a2b',
      name:  'Iris Plastic Emulsion',
    },
    // 7 — Weatherguard pairs again ↔ a real Cloud Paints project
    {
      type:  'bucket',
      src:   'images/buckets/hero/weatherguard.png',
      bg:    'images/projects/pazuri-villa.jpg',
      color: '#c4870a',
      name:  'Weatherguard · Pazuri Villa',
    },
    // 8 — Silk Vinyl second pass ↔ soft-blue coastal bedroom.
    // The painted feature wall and silky finish make this a clean
    // Silk Vinyl scene (was previously mis-paired with Gloss Enamel).
    {
      type:  'bucket',
      src:   'images/buckets/hero/silk-vinyl.png',
      bg:    'images/inspiration/inspiration-coastal-bedroom.jpg',
      color: '#5d8aa8',
      name:  'Silk Vinyl',
    },
    // 9 — Vinyl Matt (matte emulsion, rated interior *and* exterior) ↔ owner
    // photo of a brilliant-white stepped ceiling. The large unbroken white
    // plane is the product claim made visible.
    {
      type:  'bucket',
      src:   'images/buckets/hero/vinyl-matt.png',
      bg:    'images/products/applied/vinyl-matt-applied.jpg',
      color: '#6b7b8c',
      name:  'Vinyl Matt',
    },
    // 10 — Clear Varnish / Wood Care ↔ owner photo of varnished timber
    // cladding on an A-frame. Bare sealed wood, lit warm — the varnish is
    // the subject rather than a background note.
    {
      type:  'bucket',
      src:   'images/buckets/hero/clear-varnish.png',
      bg:    'images/products/applied/clear-varnish-applied.jpg',
      bgMobile: 'images/products/applied/clear-varnish-applied-portrait.jpg',
      color: '#c4870a',
      name:  'Clear Varnish',
    },
    // 11 — Gloss Enamel pairs again ↔ mist bathroom (gloss trim suits)
    {
      type:  'bucket',
      src:   'images/buckets/hero/gloss-enamel.png',
      bg:    'images/inspiration/inspiration-mist-bathroom.jpg',
      color: '#5d8aa8',
      name:  'Gloss Enamel',
    },
    // 12 — Road Marking Paint ↔ real yellow road markings on asphalt
    // (owner-supplied photo — replaced the commercial-building shot
    // that didn't show the product at all)
    {
      type:  'bucket',
      src:   'images/buckets/hero/road-marking.png',
      bg:    'images/products/applied/road-marking-applied.jpg',
      color: '#e8a317',
      name:  'Road Marking Paint',
    },
    // 13 — Weatherguard ↔ owner photo of a green exterior in full sun.
    // NOTE: this slot used to carry Roof Paint (green-roof-villa). The
    // replacement photo is a painted exterior *wall*, not a roof, so the
    // pairing is now Weatherguard; Roof Paint is currently unrepresented
    // in the rotation.
    {
      type:  'bucket',
      src:   'images/buckets/hero/weatherguard.png',
      bg:    'images/products/applied/weatherguard-applied.jpg',
      bgMobile: 'images/products/applied/weatherguard-applied-portrait.jpg',
      color: '#2f5d40',
      name:  'Weatherguard · Green exterior',
    },
    // 14 — Roof Paint ↔ the green-roofed villa. Slide 13 used to carry Roof
    // Paint; when its photo was replaced with a painted exterior wall the
    // product lost its only slide, so it gets this one back.
    {
      type:  'bucket',
      src:   'images/buckets/hero/roof-paint.png',
      bg:    'images/projects/green-roof-villa.jpg',
      color: '#1f7a4d',
      name:  'Roof Paint',
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

  // The hero is taller than it is wide on a phone, so object-fit: cover
  // throws away the sides of a landscape backdrop. Slides that ship a
  // portrait rendition use it there instead — same photo, far more of it.
  var mqPortrait = window.matchMedia('(max-width: 780px)');

  function bgFor(slide) {
    return (slide.bgMobile && mqPortrait.matches) ? slide.bgMobile : slide.bg;
  }

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
    if (inactiveBg) {
      // The brand-stage img hides itself via onerror while that file
      // is pending — undo the hide before reusing this element, or
      // every slide that lands on it shows only the gradient.
      inactiveBg.style.display = '';
      inactiveBg.src = bgFor(slide);
    }

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
      var heroEl = document.querySelector('.lp-hero');
      if (slide.type === 'brand') {
        if (heroEl) heroEl.classList.add('brand-active');
        if (brandStage) {
          // Force animation reset by toggling off then on so keyframes replay
          brandStage.classList.remove('hs-active');
          // Force reflow — guarantees the keyframes restart on every loop
          void brandStage.offsetWidth;
          brandStage.classList.add('hs-active');
        }
        bucketA.classList.remove('hs-active');
        bucketB.classList.remove('hs-active');
      } else {
        if (heroEl) heroEl.classList.remove('brand-active');
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
      if (s.bg)  { var g = new Image(); g.src = bgFor(s); }
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
    if (bgA) bgA.src = bgFor(SLIDES[0]);
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
