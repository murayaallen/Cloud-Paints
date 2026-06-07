// ============================================================
// CLOUD PAINTS — Products catalogue page (Phase 5)
// Filter state + FLIP grid transitions + deep-link.
// Relies on window.CLOUD_PRODUCTS, window.bucketCardHtml,
// window.cartAdd being available globally.
// ============================================================

(function () {
  'use strict';

  // Categories per the new client taxonomy. A chip matches if the
  // product's cat equals the key OR its surface_tags contains the key,
  // so cross-cutting filters (metal, wood) pick up enamels and primers
  // that double-up as metal/wood paint without duplicating data.
  var CAT_ORDER = [
    { key: 'all',            label: 'All products' },
    { key: 'interior-wall',  label: 'Interior Wall' },
    { key: 'exterior-wall',  label: 'Exterior Wall' },
    { key: 'wood',           label: 'Wood' },
    { key: 'metal',          label: 'Metal' },
    { key: 'floor',          label: 'Floor' },
    { key: 'roof',           label: 'Roof' },
    { key: 'road',           label: 'Road' },
    { key: 'enamel',         label: 'Enamel' },
    { key: 'primer',         label: 'Primer' },
    { key: 'texture',        label: 'Texture' },
    { key: 'solvent',        label: 'Solvent' },
  ];

  function productMatchesCat(p, key) {
    if (p.cat === key) return true;
    if (Array.isArray(p.surface_tags) && p.surface_tags.indexOf(key) !== -1) return true;
    return false;
  }

  var SURFACE_LABEL = {
    cement:   'Cement',
    metal:    'Metal',
    wood:     'Wood',
    exterior: 'Exterior'
  };

  function readSurface() {
    var p = new URLSearchParams(location.search || '');
    var s = (p.get('surface') || '').toLowerCase();
    return SURFACE_LABEL[s] ? s : '';
  }

  // Surface-aware category count — counts within the current surface filter.
  function catCount(key, surface) {
    if (!window.CLOUD_PRODUCTS) return 0;
    var list = window.CLOUD_PRODUCTS;
    if (surface) {
      list = list.filter(function (p) {
        return Array.isArray(p.surface_tags) && p.surface_tags.indexOf(surface) !== -1;
      });
    }
    if (key === 'all') return list.length;
    return list.filter(function (p) { return productMatchesCat(p, key); }).length;
  }

  function pillHtml(c, activeKey, surface) {
    var active = c.key === activeKey ? ' active' : '';
    return (
      '<button type="button" class="pp-pill' + active + '" data-filter="' + c.key + '" aria-pressed="' + (c.key === activeKey) + '">' +
        '<span>' + c.label + '</span>' +
      '</button>'
    );
  }

  function surfaceChipHtml(surface) {
    if (!surface) return '';
    return (
      '<div class="pp-surface-active" data-surface-chip>' +
        '<span>Surface · ' + SURFACE_LABEL[surface] + '</span>' +
        '<button type="button" aria-label="Clear surface filter" data-clear-surface>&times;</button>' +
      '</div>'
    );
  }

  function cardHtml(p, i) {
    return (
      '<a href="product.html?p=' + p.slug + '" ' +
         'class="product-card ' + p.brandClass + '" ' +
         'data-cat="' + p.cat + '" ' +
         'data-slug="' + p.slug + '" ' +
         'style="--card-tint:' + (p.primary || '#000') + ';transition-delay:' + (i * 40) + 'ms;">' +
        '<div class="product-thumb">' +
          window.bucketCardHtml(p) +
          '<span class="floating-chip">' + p.cat_label + '</span>' +
        '</div>' +
        '<div class="product-body">' +
          '<div class="cat">' + p.cat_label + '</div>' +
          '<h4>' + p.name + '</h4>' +
          '<p class="desc">' + (p.short || '') + '</p>' +
          '<div class="product-foot">' +
            '<div class="sizes">' + (p.sizes || []).map(function (s) { return '<span class="size-chip">' + s + '</span>'; }).join('') + '</div>' +
            '<button class="add-btn" onclick="event.preventDefault();event.stopPropagation();cartAdd(\'' + p.slug + '\',\'' + (p.sizes[0] || '4L') + '\')" aria-label="Add ' + p.name + ' to quote">' +
              '<svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</a>'
    );
  }

  function init() {
    var bar   = document.getElementById('ppPills');
    var count = document.getElementById('ppCount');
    var grid  = document.getElementById('ppGrid');
    if (!bar || !grid || !window.CLOUD_PRODUCTS) return;

    var current = 'all';
    var surface = readSurface();

    // Build pills (with optional surface chip prepended)
    rebuildPills();

    // Render grid (initial)
    renderGrid(current, false);

    // If a surface filter is active on first load, jump past the hero to the
    // grid — the user clicked a tile expecting to see the filtered catalogue.
    if (surface) {
      requestAnimationFrame(function () {
        var target = document.getElementById('ppGridSection');
        if (target) {
          var y = target.getBoundingClientRect().top + window.scrollY - 140;
          window.scrollTo({ top: y, behavior: 'auto' });
        }
      });
    }

    // Click handlers — category pills + clear-surface button
    bar.addEventListener('click', function (e) {
      if (e.target.closest('[data-clear-surface]')) {
        clearSurface();
        return;
      }
      var pill = e.target.closest('.pp-pill');
      if (!pill) return;
      var key = pill.getAttribute('data-filter');
      if (key === current) return;
      setActive(key);
    });

    // Deep-link hash (#emulsion etc.)
    var hash = (location.hash || '').replace('#', '');
    if (hash && CAT_ORDER.some(function (c) { return c.key === hash; })) {
      setActive(hash, true);
    }

    window.addEventListener('hashchange', function () {
      var h = (location.hash || '').replace('#', '');
      if (h && CAT_ORDER.some(function (c) { return c.key === h; })) setActive(h);
    });

    function rebuildPills() {
      bar.innerHTML =
        surfaceChipHtml(surface) +
        CAT_ORDER.map(function (c) { return pillHtml(c, current, surface); }).join('');
    }

    function clearSurface() {
      surface = '';
      try {
        var url = new URL(location.href);
        url.searchParams.delete('surface');
        history.replaceState(null, '', url.pathname + (url.hash || ''));
      } catch (e) {}
      rebuildPills();
      renderGrid(current, true);
    }

    function setActive(key, skipScroll) {
      current = key;
      rebuildPills();
      // Sync URL without scroll jump (preserve ?surface= if active)
      try {
        var url = new URL(location.href);
        url.hash = (key === 'all') ? '' : key;
        history.replaceState(null, '', url.pathname + url.search + url.hash);
      } catch (e) {}
      renderGrid(key, true);

      if (!skipScroll) {
        var target = document.getElementById('ppGridSection');
        if (target) {
          var y = target.getBoundingClientRect().top + window.scrollY - 140;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }
    }

    function renderGrid(filter, animate) {
      var list = window.CLOUD_PRODUCTS.filter(function (p) {
        // Only show products that have a real mockup photo —
        // imageless entries are hidden from the catalogue.
        if (!p.image) return false;
        if (filter !== 'all' && !productMatchesCat(p, filter)) return false;
        if (surface && !(Array.isArray(p.surface_tags) && p.surface_tags.indexOf(surface) !== -1)) return false;
        return true;
      });
      // Count display intentionally suppressed (no metrics on the site).
      if (count) count.textContent = '';

      if (!list.length) {
        grid.innerHTML = '<div class="pp-empty">No products in this category yet. Check back soon.</div>';
        return;
      }

      if (!animate) {
        grid.innerHTML = list.map(cardHtml).join('');
        // reveal after paint
        requestAnimationFrame(function () {
          grid.querySelectorAll('.product-card').forEach(function (el) { el.classList.add('is-in'); });
        });
        return;
      }

      // FLIP transition: fade current out, rebuild, fade new in.
      var existing = grid.querySelectorAll('.product-card');
      existing.forEach(function (el, i) { el.style.transitionDelay = (i * 15) + 'ms'; el.classList.add('is-leaving'); });

      setTimeout(function () {
        grid.innerHTML = list.map(cardHtml).join('');
        requestAnimationFrame(function () {
          grid.querySelectorAll('.product-card').forEach(function (el) { el.classList.add('is-in'); });
        });
      }, 220);
    }
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);

})();
