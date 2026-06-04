// ============================================================
// CLOUD PAINTS — Decorative Texture Collection page controller
// Reads window.CLOUD_PRODUCTS, finds entries by slug, and renders
// product cards into each .tx-fam-grid slot listed by data-products.
// ============================================================

(function () {
  'use strict';

  function init() {
    if (!window.CLOUD_PRODUCTS) return;
    var grids = document.querySelectorAll('.tx-fam-grid[data-products]');
    grids.forEach(function (grid) {
      var slugs = grid.getAttribute('data-products').split(',').map(function (s) { return s.trim(); });
      var html = slugs.map(function (slug) {
        var p = window.getProduct(slug);
        if (!p) return '';
        return renderCard(p);
      }).join('');
      grid.innerHTML = html;
    });
  }

  function renderCard(p) {
    var sizes = (p.sizes || []).map(function (s) {
      return '<span class="tx-card-size">' + s + '</span>';
    }).join('');
    var url = 'product.html?p=' + encodeURIComponent(p.slug);
    return (
      '<a class="tx-card" href="' + url + '" style="--c:' + (p.accent || p.primary || '#d92843') + '">' +
        '<div class="tx-card-img">' +
          '<span class="tx-card-tag">' + (p.cat_label || 'Decorative') + '</span>' +
          '<img src="' + p.image + '" alt="' + p.name + '" loading="lazy" width="720" height="900" decoding="async">' +
        '</div>' +
        '<div class="tx-card-body">' +
          '<h3 class="tx-card-name">' + p.name + '</h3>' +
          '<p class="tx-card-tagline">' + (p.tagline || '') + '</p>' +
          '<div class="tx-card-meta">' +
            '<div class="tx-card-sizes">' + sizes + '</div>' +
            '<span class="tx-card-cta">View &rarr;</span>' +
          '</div>' +
        '</div>' +
      '</a>'
    );
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
