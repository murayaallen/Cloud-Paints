// ============================================================
// CLOUD PAINTS — Products catalogue page (Phase 5)
// Filter state + FLIP grid transitions + deep-link.
// Relies on window.CLOUD_PRODUCTS, window.bucketCardHtml,
// window.cartAdd being available globally.
// ============================================================

(function () {
  'use strict';

  var CAT_ORDER = [
    { key: 'all',       label: 'All products' },
    { key: 'emulsion',  label: 'Emulsions' },
    { key: 'exterior',  label: 'Exterior' },
    { key: 'enamel',    label: 'Gloss &amp; Enamel' },
    { key: 'undercoat', label: 'Primers' },
    { key: 'wood',      label: 'Wood &amp; Varnish' },
    { key: 'specialty', label: 'Specialty' },
    { key: 'solvent',   label: 'Solvents' },
  ];

  function catCount(key) {
    if (!window.CLOUD_PRODUCTS) return 0;
    if (key === 'all') return window.CLOUD_PRODUCTS.length;
    return window.CLOUD_PRODUCTS.filter(function (p) { return p.cat === key; }).length;
  }

  function pillHtml(c, activeKey) {
    var active = c.key === activeKey ? ' active' : '';
    return (
      '<button type="button" class="pp-pill' + active + '" data-filter="' + c.key + '" aria-pressed="' + (c.key === activeKey) + '">' +
        '<span>' + c.label + '</span>' +
        '<span class="num">' + catCount(c.key) + '</span>' +
      '</button>'
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

    // Build pills
    bar.innerHTML = CAT_ORDER.map(function (c) { return pillHtml(c, current); }).join('');

    // Render grid (initial)
    renderGrid(current, false);

    // Click handlers
    bar.addEventListener('click', function (e) {
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

    function setActive(key, skipScroll) {
      current = key;
      bar.querySelectorAll('.pp-pill').forEach(function (b) {
        var on = b.getAttribute('data-filter') === key;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', on);
      });
      // Sync URL without scroll jump
      try { history.replaceState(null, '', key === 'all' ? location.pathname : '#' + key); } catch (e) {}
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
        return filter === 'all' || p.cat === filter;
      });
      if (count) count.textContent = list.length + ' product' + (list.length === 1 ? '' : 's');

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
