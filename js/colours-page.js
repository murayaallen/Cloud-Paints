// ============================================================
// CLOUD PAINTS — Colour Collection page controller
// Renders the 544 shades grouped into 17 family sections, the
// family nav, the spectrum strip, the sheen + texture rows, and
// a swatch-detail popover. All from window.CLOUD_COLOURS.
// ============================================================

(function () {
  'use strict';

  // Hex luminance → label colour so the swatch text stays readable
  // whether the swatch is pale chiffon or carbon black.
  function labelOn(hex) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var r = parseInt(h.slice(0, 2), 16) || 0;
    var g = parseInt(h.slice(2, 4), 16) || 0;
    var b = parseInt(h.slice(4, 6), 16) || 0;
    // Relative luminance, sRGB
    var lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return lum > 0.62 ? '#1a1916' : '#ffffff';
  }

  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  function init() {
    if (!window.CLOUD_COLOURS) return;
    var fams = window.CLOUD_COLOURS.families || [];
    var shades = window.CLOUD_COLOURS.shades || [];
    var sheens = window.CLOUD_COLOURS.finishes || [];
    var textures = window.CLOUD_COLOURS.textures || [];

    renderHeroStrip(fams);
    renderFamNav(fams);
    renderFamilies(fams, shades);
    renderSheens(sheens);
    renderTextures(textures);
    bindDetail();
    bindFamNavSpy(fams);
    handleDeepLink();
  }

  // --- 17-family spectrum strip under the hero ---
  function renderHeroStrip(fams) {
    var el = $('#clHeroStrip');
    if (!el) return;
    el.innerHTML = fams.map(function (f) {
      return '<span style="background:' + f.accent + '" title="' + f.name + '"></span>';
    }).join('');
  }

  // --- sticky family chips ---
  function renderFamNav(fams) {
    var el = $('#clFamNav');
    if (!el) return;
    el.innerHTML = fams.map(function (f, i) {
      var num = String(i + 1).padStart(2, '0');
      return (
        '<li>' +
          '<a href="#fam-' + f.slug + '" data-fam="' + f.slug + '" style="--c:' + f.accent + '">' +
            '<span>' + num + '</span> ' + f.name +
          '</a>' +
        '</li>'
      );
    }).join('');
  }

  // --- 17 family sections, each with 32 swatches ---
  function renderFamilies(fams, shades) {
    var host = $('#clFamilies');
    if (!host) return;
    var html = fams.map(function (f, i) {
      var fShades = shades.filter(function (s) { return s.family === f.code; });
      var num = String(i + 1).padStart(2, '0');
      return (
        '<article class="cl-family" id="fam-' + f.slug + '" style="--c:' + f.accent + '">' +
          '<div class="container">' +
            '<header class="cl-family-head">' +
              '<div>' +
                '<span class="cl-family-tag">Family ' + num + ' / 17</span>' +
                '<h2 class="cl-family-name">' + f.name + '</h2>' +
                '<p class="cl-family-sub">' + f.subtitle + '</p>' +
              '</div>' +
              '<div class="cl-family-meta">' +
                '<span class="cl-family-fcode">' + f.code + '</span>' +
                '32 shades' +
              '</div>' +
            '</header>' +
            '<div class="cl-grid">' +
              fShades.map(swatchHtml).join('') +
            '</div>' +
          '</div>' +
        '</article>'
      );
    }).join('');
    host.innerHTML = html;
  }

  function swatchHtml(s) {
    var lbl = labelOn(s.hex);
    return (
      '<button type="button" class="cl-swatch" data-slug="' + s.slug + '"' +
        ' style="--c:' + s.hex + ';--lbl:' + lbl + '"' +
        ' aria-label="' + s.name + ', ' + s.code + ', ' + s.hex + '">' +
        '<span class="cl-swatch-label">' +
          '<span class="cl-swatch-name">' + s.name + '</span>' +
          '<span class="cl-swatch-code">' + s.code + '</span>' +
          '<span class="cl-swatch-hex">' + s.hex + '</span>' +
        '</span>' +
      '</button>'
    );
  }

  // --- 6 sheen tiles ---
  function renderSheens(sheens) {
    var host = $('#clSheens');
    if (!host) return;
    host.innerHTML = sheens.map(function (sh) {
      return (
        '<div class="cl-sheen-card">' +
          '<div class="cl-sheen" data-slug="' + sh.slug + '" aria-label="' + sh.name + '"></div>' +
          '<div class="cl-sheen-label">' + sh.name +
            '<span class="cl-sheen-sheen">' + sh.sheen + '</span>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  // --- 6 specialty texture tiles ---
  function renderTextures(textures) {
    var host = $('#clTextures');
    if (!host) return;
    host.innerHTML = textures.map(function (t) {
      return (
        '<div class="cl-texture-card">' +
          '<div class="cl-texture" data-slug="' + t.slug + '" aria-label="' + t.name + '"></div>' +
          '<div class="cl-texture-label">' + t.name + '</div>' +
        '</div>'
      );
    }).join('');
  }

  // --- Detail popover ---
  function bindDetail() {
    var detail = $('#clDetail');
    if (!detail) return;
    var swatch = $('#clDetailSwatch');
    var fam = $('#clDetailFamily');
    var name = $('#clDetailName');
    var code = $('#clDetailCode');
    var hex = $('#clDetailHex');
    var visualise = $('#clDetailVisualise');
    var wa = $('#clDetailWA');

    document.addEventListener('click', function (e) {
      var sw = e.target.closest('.cl-swatch');
      if (!sw) return;
      var s = window.getCloudColour(sw.getAttribute('data-slug'));
      if (!s) return;
      var fams = window.CLOUD_COLOURS.families || [];
      var famObj = fams.find(function (f) { return f.code === s.family; });
      swatch.style.setProperty('--c', s.hex);
      fam.textContent = famObj ? famObj.name : s.family;
      fam.style.setProperty('--c', famObj ? famObj.accent : 'var(--red-2)');
      name.textContent = s.name;
      code.textContent = s.code;
      hex.textContent = s.hex;
      var msg = encodeURIComponent('Hi Cloud Paints, I’d like to order colour ' + s.name + ' (' + s.code + ', ' + s.hex + ').');
      wa.href = 'https://wa.me/254741405481?text=' + msg;
      visualise.href = 'visualiser.html?hex=' + encodeURIComponent(s.hex.replace('#', ''));
      detail.classList.add('is-open');
      detail.setAttribute('aria-hidden', 'false');
      try { history.replaceState(null, '', '?c=' + s.slug + location.hash); } catch (e2) {}
    });

    document.addEventListener('click', function (e) {
      if (e.target.matches('[data-detail-close]')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && detail.classList.contains('is-open')) close();
    });
    function close() {
      detail.classList.remove('is-open');
      detail.setAttribute('aria-hidden', 'true');
      try {
        var u = new URL(location.href);
        u.searchParams.delete('c');
        history.replaceState(null, '', u.pathname + (u.search || '') + u.hash);
      } catch (e2) {}
    }
  }

  // --- Active family in nav as you scroll ---
  function bindFamNavSpy(fams) {
    if (!('IntersectionObserver' in window)) return;
    var links = $$('#clFamNav a');
    var byFam = {};
    links.forEach(function (a) { byFam[a.getAttribute('data-fam')] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var slug = entry.target.id.replace('fam-', '');
        var a = byFam[slug];
        if (!a) return;
        links.forEach(function (l) { l.classList.remove('is-active'); });
        a.classList.add('is-active');
        // Scroll the active chip into view in the nav strip ONLY —
        // never the page. Compute the horizontal delta inside the
        // chip's scroll container and apply it directly.
        var strip = a.parentElement && a.parentElement.parentElement;
        if (strip && strip.scrollWidth > strip.clientWidth) {
          var stripRect = strip.getBoundingClientRect();
          var chipRect = a.getBoundingClientRect();
          var margin = 24;
          if (chipRect.left < stripRect.left + margin) {
            strip.scrollBy({ left: chipRect.left - stripRect.left - margin, behavior: 'smooth' });
          } else if (chipRect.right > stripRect.right - margin) {
            strip.scrollBy({ left: chipRect.right - stripRect.right + margin, behavior: 'smooth' });
          }
        }
      });
    }, { rootMargin: '-30% 0px -55% 0px', threshold: 0 });
    fams.forEach(function (f) {
      var sec = document.getElementById('fam-' + f.slug);
      if (sec) io.observe(sec);
    });
  }

  // --- Open detail if URL carries ?c=slug ---
  function handleDeepLink() {
    var p = new URLSearchParams(location.search || '');
    var slug = (p.get('c') || '').toLowerCase();
    if (!slug) return;
    var btn = document.querySelector('.cl-swatch[data-slug="' + slug + '"]');
    if (btn) btn.click();
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
