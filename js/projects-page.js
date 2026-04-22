// ============================================================
// CLOUD PAINTS — Projects page controller (Phase 7)
// ============================================================
// Filter pills (FLIP), masonry grid render, modal detail view,
// location strip counts. Data from window.CLOUD_PROJECTS.
// ============================================================

(function () {
  'use strict';

  if (!window.CLOUD_PROJECTS) return;

  var TYPE_ORDER = [
    { key: 'all',         label: 'All projects' },
    { key: 'residential', label: 'Residential' },
    { key: 'commercial',  label: 'Commercial' },
    { key: 'hospitality', label: 'Institutional' },
  ];

  var state = {
    type: 'all',
    mounted: false,
  };

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------
  function iconSvg(name) {
    return window.icon ? window.icon(name, 16) : '';
  }

  function countByType(key) {
    if (key === 'all') return window.CLOUD_PROJECTS.length;
    return window.CLOUD_PROJECTS.filter(function (p) { return p.type === key; }).length;
  }

  function projectsForType(key) {
    if (key === 'all') return window.CLOUD_PROJECTS.slice();
    return window.CLOUD_PROJECTS.filter(function (p) { return p.type === key; });
  }

  function productChip(slug) {
    var prod = window.getProduct && window.getProduct(slug);
    if (!prod) return '';
    return '<a class="pj-product-chip" href="product.html?p=' + prod.slug + '">' +
           '<span class="sw" style="background:' + prod.primary + '"></span>' +
           prod.name +
           '</a>';
  }

  function productChipsHtml(slugs) {
    if (!slugs || !slugs.length) return '';
    return slugs.map(productChip).join('');
  }

  // ------------------------------------------------------------
  // Hero ribbon (auto-panning thumbnail strip)
  // ------------------------------------------------------------
  function renderRibbon() {
    var track = document.getElementById('pjRibbonTrack');
    if (!track) return;
    // duplicate sequence so the loop is seamless
    var pool = window.CLOUD_PROJECTS.concat(window.CLOUD_PROJECTS);
    track.innerHTML = pool.map(function (p) {
      return '<div class="pj-ribbon-img"><img src="' + p.image + '" alt="' + p.name + '" loading="lazy"></div>';
    }).join('');
  }

  // ------------------------------------------------------------
  // Filter pills
  // ------------------------------------------------------------
  function renderPills() {
    var wrap = document.getElementById('pjPills');
    if (!wrap) return;
    wrap.innerHTML = TYPE_ORDER.map(function (t) {
      var n = countByType(t.key);
      var activeClass = t.key === state.type ? ' active' : '';
      return '<button class="pj-pill' + activeClass + '" type="button" data-type="' + t.key + '">' +
             '<span>' + t.label + '</span>' +
             '<span class="num">' + n + '</span>' +
             '</button>';
    }).join('');

    wrap.addEventListener('click', function (e) {
      var btn = e.target.closest('.pj-pill');
      if (!btn) return;
      var key = btn.getAttribute('data-type');
      if (!key || key === state.type) return;
      setType(key);
    });
  }

  function setType(key) {
    state.type = key;
    // update active class
    var pills = document.querySelectorAll('#pjPills .pj-pill');
    pills.forEach(function (p) {
      p.classList.toggle('active', p.getAttribute('data-type') === key);
    });
    updateCount();
    renderGrid(true);
    // update url hash without scroll jump
    if (key === 'all') {
      history.replaceState(null, '', location.pathname + location.search);
    } else {
      history.replaceState(null, '', '#' + key);
    }
  }

  function updateCount() {
    var el = document.getElementById('pjCount');
    if (!el) return;
    var n = countByType(state.type);
    el.textContent = n + (n === 1 ? ' project' : ' projects');
  }

  // ------------------------------------------------------------
  // Grid render with FLIP-style transition
  // ------------------------------------------------------------
  function renderGrid(transition) {
    var grid = document.getElementById('pjGrid');
    if (!grid) return;

    var list = projectsForType(state.type);

    if (transition) {
      // fade out existing cards, then rebuild
      var existing = grid.querySelectorAll('.pj-card');
      existing.forEach(function (el) { el.classList.add('is-leaving'); });
      setTimeout(function () { buildCards(grid, list); }, 280);
    } else {
      buildCards(grid, list);
    }
  }

  function buildCards(grid, list) {
    if (!list.length) {
      grid.innerHTML = '<div class="pj-empty">No projects match that filter — yet.</div>';
      return;
    }
    grid.innerHTML = list.map(function (p, i) {
      return '<article class="pj-card" data-slug="' + p.slug + '" style="transition-delay:' + (i * 40) + 'ms;">' +
             '<img src="' + p.image + '" alt="' + p.name + '" loading="lazy">' +
             '<div class="pj-card-meta">' +
               '<span class="tag">' + p.type_label + '</span>' +
               '<h4>' + p.name + '</h4>' +
               '<p>' + p.location + ' · ' + p.scope + '</p>' +
               '<span class="pj-view" aria-hidden="true">' + iconSvg('arrow-up-right') + '</span>' +
             '</div>' +
             '</article>';
    }).join('');

    // click handler → modal
    var cards = grid.querySelectorAll('.pj-card');
    cards.forEach(function (el) {
      el.addEventListener('click', function () {
        openModal(el.getAttribute('data-slug'));
      });
    });

    // animate in
    requestAnimationFrame(function () {
      cards.forEach(function (el, i) {
        setTimeout(function () { el.classList.add('is-in'); }, 20 + i * 40);
      });
    });
  }

  // ------------------------------------------------------------
  // Featured case study
  // ------------------------------------------------------------
  function renderFeatured() {
    var slot = document.getElementById('pjFeatured');
    if (!slot) return;
    var feat = window.CLOUD_PROJECTS.find(function (p) { return p.featured; });
    if (!feat) feat = window.CLOUD_PROJECTS[0];

    slot.style.setProperty('--feat-tint', feat.accent);
    slot.innerHTML =
      '<div class="pj-featured-media">' +
        '<img src="' + feat.image + '" alt="' + feat.name + '">' +
        '<span class="pj-feat-tag">Featured case study</span>' +
      '</div>' +
      '<div class="pj-featured-body">' +
        '<span class="eyebrow">' + feat.type_label + ' · ' + feat.year + '</span>' +
        '<h2>' + feat.name.replace(/·.*/, '').trim() + ' <em>finished in full.</em></h2>' +
        '<div class="pj-meta-row">' +
          '<span class="mk">' + iconSvg('map-pin') + feat.location + '</span>' +
          '<span class="mk">' + iconSvg('check') + feat.scope + '</span>' +
          '<span class="mk">' + iconSvg('bucket') + feat.products_used.length + ' products</span>' +
        '</div>' +
        '<p>' + feat.brief + '</p>' +
        '<div class="pj-products">' +
          '<div class="pj-products-label">Products used</div>' +
          '<div class="pj-product-chips">' + productChipsHtml(feat.products_used) + '</div>' +
        '</div>' +
      '</div>';

    slot.style.cursor = 'pointer';
    slot.addEventListener('click', function (e) {
      if (e.target.closest('.pj-product-chip')) return;
      openModal(feat.slug);
    });
  }

  // ------------------------------------------------------------
  // Modal
  // ------------------------------------------------------------
  function buildModal() {
    if (document.getElementById('pjModal')) return;
    var modal = document.createElement('div');
    modal.id = 'pjModal';
    modal.className = 'pj-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML =
      '<div class="pj-modal-backdrop" data-close></div>' +
      '<div class="pj-modal-panel">' +
        '<button class="pj-modal-close" type="button" data-close aria-label="Close">' +
          (window.icon ? window.icon('close', 18) : '×') +
        '</button>' +
        '<div class="pj-modal-media"><img id="pjModalImg" src="" alt=""></div>' +
        '<div class="pj-modal-body" id="pjModalBody"></div>' +
      '</div>';
    document.body.appendChild(modal);

    modal.addEventListener('click', function (e) {
      if (e.target.matches('[data-close]') || e.target.closest('[data-close]')) {
        closeModal();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
    });
  }

  function openModal(slug) {
    var p = window.getProject(slug);
    if (!p) return;
    buildModal();
    var modal = document.getElementById('pjModal');
    var img = document.getElementById('pjModalImg');
    var body = document.getElementById('pjModalBody');
    img.src = p.image;
    img.alt = p.name;
    body.innerHTML =
      '<span class="eyebrow">' + p.type_label + ' · ' + p.year + '</span>' +
      '<h2>' + p.name.split('·')[0].trim() + '</h2>' +
      '<div class="pj-meta-row">' +
        '<span class="mk">' + iconSvg('map-pin') + p.location + '</span>' +
        '<span class="mk">' + iconSvg('check') + p.scope + '</span>' +
        '<span class="mk">' + iconSvg('shield') + (p.client || '—') + '</span>' +
      '</div>' +
      '<p>' + p.brief + '</p>' +
      '<div class="pj-products">' +
        '<div class="pj-products-label">Products used</div>' +
        '<div class="pj-product-chips">' + productChipsHtml(p.products_used) + '</div>' +
      '</div>';

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    var modal = document.getElementById('pjModal');
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // ------------------------------------------------------------
  // Location strip
  // ------------------------------------------------------------
  var CITIES = [
    { city: 'Nairobi',    county: 'Nairobi',  matchers: ['nairobi', 'madaraka'] },
    { city: 'Kitengela',  county: 'Kajiado',  matchers: ['kitengela'] },
    { city: 'Syokimau',   county: 'Machakos', matchers: ['syokimau'] },
    { city: 'Mlolongo',   county: 'Machakos', matchers: ['mlolongo'] },
    { city: 'Kilifi',     county: 'Kilifi',   matchers: ['kilifi'] },
    { city: 'Mombasa',    county: 'Mombasa',  matchers: ['mombasa', 'vipingo'] },
  ];

  function renderLocations() {
    var slot = document.getElementById('pjLocs');
    if (!slot) return;
    slot.innerHTML = CITIES.map(function (c) {
      var n = window.CLOUD_PROJECTS.filter(function (p) {
        var hay = (p.location + ' ' + p.county).toLowerCase();
        return c.matchers.some(function (m) { return hay.indexOf(m) !== -1; });
      }).length;
      return '<div class="pj-loc">' +
             '<span class="pin">' + iconSvg('map-pin') + '</span>' +
             '<div class="city">' + c.city + '</div>' +
             '<div class="county">' + c.county + ' County</div>' +
             '<div class="count">' + n + ' ' + (n === 1 ? 'project' : 'projects') + '</div>' +
             '</div>';
    }).join('');
  }

  // ------------------------------------------------------------
  // Boot
  // ------------------------------------------------------------
  function readHash() {
    var h = (location.hash || '').replace('#', '').toLowerCase();
    var valid = TYPE_ORDER.some(function (t) { return t.key === h; });
    if (valid) state.type = h;
  }

  function mount() {
    if (state.mounted) return;
    state.mounted = true;
    readHash();
    renderRibbon();
    renderFeatured();
    renderPills();
    updateCount();
    renderGrid(false);
    renderLocations();

    window.addEventListener('hashchange', function () {
      readHash();
      var pills = document.querySelectorAll('#pjPills .pj-pill');
      pills.forEach(function (p) {
        p.classList.toggle('active', p.getAttribute('data-type') === state.type);
      });
      updateCount();
      renderGrid(true);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
