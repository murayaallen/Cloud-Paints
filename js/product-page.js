// ============================================================
// CLOUD PAINTS — Product detail page (Phase 6)
// Slug routing, size/qty, coverage calc, cross-sell, sticky buy-bar.
// ============================================================

(function () {
  'use strict';

  // Pack size → litres (for coverage calc)
  var SIZE_L = { '1L': 1, '4L': 4, '20L': 20, '5L': 5, '10L': 10, '250ml': 0.25, '500ml': 0.5 };

  // Paint-industry finish data per product category
  var FINISH_MAP = {
    'silk-vinyl':   { name: 'Silk',          sheen: 5 },
    'vinyl-matt':   { name: 'Matt',          sheen: 2 },
    'supermatt':    { name: 'Super Matt',    sheen: 1 },
    'iris-economy': { name: 'Matt',          sheen: 2 },
    'weatherguard': { name: 'Satin',         sheen: 4 },
    'rocketex':     { name: 'Matt',          sheen: 2 },
    'gloss-enamel': { name: 'High Gloss',    sheen: 7 },
    'super-gloss':  { name: 'High Gloss',    sheen: 7 },
    'roof-paint':   { name: 'Satin',         sheen: 4 },
    'floor-paint':  { name: 'Semi-Gloss',    sheen: 6 },
    'metal-primer': { name: 'Flat',          sheen: 1 },
    'universal-undercoat': { name: 'Flat',   sheen: 1 },
    'clear-varnish':{ name: 'Gloss',         sheen: 7 },
    'varnish-stain':{ name: 'Satin',         sheen: 4 },
  };

  // Default application guidance per category — gets overridden by product-specific data when available
  var APPLY_GUIDE = {
    emulsion: {
      prep:    ['Plaster: 14 days cure, dust-free', 'Previously painted: wash with sugar soap', 'Fill cracks; sand smooth'],
      thinning:['Add up to 10% clean water for first coat', 'Undiluted for second & third coats'],
      method:  ['Brush · Roller (medium nap) · Spray', 'Tip size: 0.017–0.021"', 'Pressure: 1800–2200 psi'],
      drying:  ['Touch dry: 1 hr', 'Recoat: 3–4 hrs', 'Hard dry: 24 hrs @ 25°C, 50% RH'],
    },
    exterior: {
      prep:    ['Concrete: 28 days cure', 'Remove all chalking and loose material', 'Use anti-carbonation primer if required'],
      thinning:['5–10% clean water for first coat', 'Subsequent coats undiluted'],
      method:  ['Brush · Roller · Airless spray', 'Avoid application in direct sun or rain'],
      drying:  ['Touch dry: 1–2 hrs', 'Recoat: 4 hrs minimum', 'Full cure: 7 days'],
    },
    enamel: {
      prep:    ['Sand existing gloss surfaces', 'Apply metal primer on bare metal', 'Ensure surface is clean, dry, grease-free'],
      thinning:['Thin with White Spirit if required (max 10%)', 'Stir thoroughly before use'],
      method:  ['Brush · Roller · Conventional spray', 'Two thin coats preferred over one thick'],
      drying:  ['Touch dry: 4 hrs', 'Recoat: 16–24 hrs', 'Hard dry: 48 hrs'],
    },
    undercoat: {
      prep:    ['Ensure surface is dry, clean, sound', 'Remove rust, loose paint and grease', 'Sand glossy surfaces'],
      thinning:['Stir well before use', 'Do not thin unless manufacturer-specified'],
      method:  ['Brush · Roller', 'Single coat typically sufficient'],
      drying:  ['Touch dry: 2–4 hrs', 'Overcoat: 12–16 hrs'],
    },
    wood: {
      prep:    ['Sand wood with 120-grit then 240-grit', 'Remove dust with tack cloth', 'Seal knots with knot sealer'],
      thinning:['Use straight from can', 'For spray, thin 5–10% with recommended thinner'],
      method:  ['Brush · Foam pad · Cloth wipe-on', 'Apply with the grain'],
      drying:  ['Touch dry: 2 hrs', 'Recoat: 4–6 hrs', 'Full cure: 7 days'],
    },
    specialty: {
      prep:    ['Follow product label for specific surface requirements', 'Ensure surface is sound and clean'],
      thinning:['As per label'],
      method:  ['Brush · Roller · Spray (as per label)'],
      drying:  ['See label for specific drying times'],
    },
    solvent: {
      prep:    ['Solvent — not a paint', 'Use in well-ventilated areas only'],
      thinning:['N/A — used to thin other products'],
      method:  ['Use as directed by paint manufacturer', 'Never near open flame'],
      drying:  ['Evaporates readily — see safety data'],
    },
  };

  function param(key) {
    return new URLSearchParams(location.search).get(key);
  }

  function svgIcon(name) {
    return window.icon ? window.icon(name, 22) :
      '<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" opacity=".3"/></svg>';
  }

  function splitName(n) {
    var parts = n.split(' ');
    if (parts.length === 1) return n + '.';
    return parts.slice(0, -1).join(' ') + ' <em>' + parts.slice(-1)[0] + '.</em>';
  }

  function init() {
    var slug = param('p') || param('slug') || 'weatherguard';
    var product = window.getProduct && window.getProduct(slug);

    if (!product) {
      showNotFound();
      return;
    }

    populate(product);
    wireCoverage(product);
    wireCrossSell(product);
    wireSticky(product);
    applyThemeVars(product);
  }

  function showNotFound() {
    var root = document.querySelector('main.pd-root') || document.body;
    root.innerHTML =
      '<div style="min-height:70vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:140px 20px;">' +
        '<div>' +
          '<div style="font-family:var(--serif);font-style:italic;font-size:3rem;color:var(--red-2);margin-bottom:16px;">Not found.</div>' +
          '<p style="color:var(--text-2);max-width:420px;margin:0 auto 24px;">The product you\'re looking for doesn\'t exist in our current range.</p>' +
          '<a href="products.html" class="btn btn-dark">Back to the catalogue</a>' +
        '</div>' +
      '</div>';
  }

  function applyThemeVars(p) {
    var root = document.documentElement;
    root.style.setProperty('--pd-accent', p.primary || '#b8243a');
    root.style.setProperty('--pd-accent-2', p.accent || p.primary || '#d92843');
    root.style.setProperty('--finish-color', p.primary || '#b8243a');
    var stage = document.getElementById('pdStage');
    if (stage) stage.style.setProperty('--stage-grad', 'linear-gradient(160deg, ' + (p.primary || '#b8243a') + ' 0%, ' + (p.accent || p.primary || '#d92843') + ' 100%)');
  }

  function populate(p) {
    document.title = p.name + ' — Cloud Paints';

    var desc = (p.short || p.full || p.name) + ' · ' + p.cat_label + '.';
    var m = document.querySelector('meta[name="description"]');
    if (m) m.setAttribute('content', desc);

    var pageUrl = 'https://cloudpaints.co.ke/product.html?p=' + p.slug;
    var imgUrl = p.image ? ('https://cloudpaints.co.ke/' + p.image.replace(/^\//, '')) : 'https://cloudpaints.co.ke/images/logo.png';
    function setMeta(sel, attr, val) {
      var el = document.querySelector(sel);
      if (!el) {
        el = document.createElement('meta');
        var parts = sel.match(/\[([^=]+)="([^"]+)"\]/);
        if (parts) el.setAttribute(parts[1], parts[2]);
        document.head.appendChild(el);
      }
      el.setAttribute(attr, val);
    }
    setMeta('meta[property="og:title"]', 'content', p.name + ' — Cloud Paints');
    setMeta('meta[property="og:description"]', 'content', desc);
    setMeta('meta[property="og:url"]', 'content', pageUrl);
    setMeta('meta[property="og:image"]', 'content', imgUrl);
    setMeta('meta[name="twitter:title"]', 'content', p.name + ' — Cloud Paints');
    setMeta('meta[name="twitter:description"]', 'content', desc);
    setMeta('meta[name="twitter:image"]', 'content', imgUrl);

    var canon = document.querySelector('link[rel="canonical"]');
    if (!canon) {
      canon = document.createElement('link');
      canon.setAttribute('rel', 'canonical');
      document.head.appendChild(canon);
    }
    canon.setAttribute('href', pageUrl);

    var oldLd = document.getElementById('pd-jsonld');
    if (oldLd) oldLd.remove();
    var ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.id = 'pd-jsonld';
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.name,
      description: p.short || p.full || '',
      brand: { '@type': 'Brand', name: 'Cloud Paints' },
      manufacturer: { '@type': 'Organization', name: 'Cloudsent Decor Ltd' },
      category: p.cat_label,
      image: imgUrl,
      url: pageUrl,
      sku: p.slug,
      additionalProperty: []
    });
    document.head.appendChild(ld);

    // Breadcrumb
    setText('pdCrumb', p.name);

    // Hero text
    setText('pdEyebrow', p.cat_label);
    setHTML('pdName', splitName(p.name));
    setText('pdTagline', p.tagline || p.short || '');

    // Quality badge
    var kebsEl = document.getElementById('pdKebs');
    if (kebsEl) kebsEl.innerHTML = 'Quality <span class="n">Certified</span>';

    // Stage image
    var img = document.getElementById('pdStageImg');
    if (img) {
      img.src = p.image || 'images/buckets/' + p.slug + '.jpg';
      img.alt = p.name + ' 4L bucket';
      img.onerror = function () {
        this.style.display = 'none';
        var wrap = this.closest('.pd-stage');
        if (wrap) {
          var fallback = document.createElement('div');
          fallback.style.cssText = 'font-family:var(--serif);font-size:2rem;color:#fff;opacity:0.35;text-align:center;padding:40px;font-style:italic;line-height:1.1;';
          fallback.textContent = p.name;
          wrap.appendChild(fallback);
        }
      };
    }

    // Sizes
    var sizes = document.getElementById('pdSizes');
    var currentSize = p.sizes[0] || '4L';
    if (sizes) {
      sizes.innerHTML = (p.sizes || []).map(function (s, i) {
        return '<button type="button" data-size="' + s + '" class="' + (i === 0 ? 'active' : '') + '">' + s + '</button>';
      }).join('');
      sizes.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-size]');
        if (!btn) return;
        sizes.querySelectorAll('button').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentSize = btn.dataset.size;
        var sticky = document.getElementById('pdStickySize');
        if (sticky) sticky.textContent = currentSize;
      });
    }

    // Quantity
    var qtyInput = document.getElementById('pdQty');
    var qtyMinus = document.getElementById('pdQtyMinus');
    var qtyPlus  = document.getElementById('pdQtyPlus');
    function getQty() { var n = parseInt(qtyInput.value, 10); return isNaN(n) || n < 1 ? 1 : n; }
    if (qtyMinus) qtyMinus.addEventListener('click', function () { qtyInput.value = Math.max(1, getQty() - 1); });
    if (qtyPlus)  qtyPlus.addEventListener('click',  function () { qtyInput.value = getQty() + 1; });

    // Add to quote
    var addBtn = document.getElementById('pdAdd');
    if (addBtn) addBtn.addEventListener('click', function () {
      var n = getQty();
      for (var i = 0; i < n; i++) window.cartAdd(p.slug, currentSize);
    });

    // Download datasheet — link to PDF if present, else hide
    var sheet = document.getElementById('pdSheet');
    if (sheet) {
      var sheetUrl = p.datasheet || p.datasheet_url;
      if (sheetUrl) {
        sheet.href = sheetUrl;
        sheet.setAttribute('target', '_blank');
      } else {
        sheet.style.display = 'none';
      }
    }

    // At-a-glance specs (4-col). Prefer Coverage + first available drying key.
    var glance = document.getElementById('pdGlance');
    if (glance) {
      var specs = p.specs || {};
      var dryKey = specs['Touch dry'] ? 'Touch dry' : (specs['Drying time'] ? 'Drying time' : 'Touch dry');
      var useKey = p.cat === 'solvent' ? 'Use' : 'Application';
      var order = ['Coverage', dryKey, 'Recoat', useKey];
      var glanceIcons = {
        'Coverage':    'coverage',
        'Touch dry':   'clock',
        'Drying time': 'clock',
        'Recoat':      'layers',
        'Application': 'roller',
        'Use':         'droplet',
      };
      glance.innerHTML = order.map(function (k) {
        var v = specs[k] || '—';
        return '<div class="pd-glance"><div class="ic">' + svgIcon(glanceIcons[k] || 'swatch') + '</div><div class="k">' + k + '</div><div class="v">' + v + '</div></div>';
      }).join('');
    }

    // Description paragraphs + verbatim claims
    var descEl = document.getElementById('pdDesc');
    if (descEl) {
      var descHtml = '<p>' + (p.full || p.short || '').replace(/\n\n/g, '</p><p>') + '</p>';
      if (p.uses && p.uses.length) {
        descHtml += '<div class="pd-uses"><h4>Where to use it</h4><ul>' +
          p.uses.map(function (u) { return '<li>' + u + '</li>'; }).join('') +
          '</ul></div>';
      }
      descEl.innerHTML = descHtml;
    }

    var claimsEl = document.getElementById('pdClaims');
    if (claimsEl) {
      // Prefer verbatim label claims; fall back to features.
      var lines = (p.claims && p.claims.length ? p.claims : (p.features || [])).slice(0, 8);
      claimsEl.innerHTML = lines.map(function (f) {
        return '<li>' + f + '</li>';
      }).join('');
    }

    // Finish
    var fin = FINISH_MAP[p.slug] || { name: p.cat_label, sheen: 3 };
    setText('pdFinishName', fin.name);
    setText('pdFinishSheen', 'Sheen level ' + fin.sheen + '/7');
    var bar = document.getElementById('pdSheenBar');
    if (bar) {
      var html = '';
      for (var s = 1; s <= 7; s++) html += '<span class="' + (s <= fin.sheen ? 'on' : '') + '"></span>';
      bar.innerHTML = html;
    }

    // Application guidance — prefer product-specific verbatim label data
    var applyEl = document.getElementById('pdApply');
    if (applyEl) {
      var guide = APPLY_GUIDE[p.cat] || APPLY_GUIDE.emulsion;
      var app = p.application || {};
      var specs = p.specs || {};

      var prepLines = app.prep ? [app.prep] : guide.prep;
      if (app.new_surface) prepLines = prepLines.concat(['New surface: ' + app.new_surface]);
      if (app.previously_painted) prepLines = prepLines.concat(['Previously painted: ' + app.previously_painted]);

      var thinningLines = specs['Thinning'] ? [specs['Thinning']] : guide.thinning;
      var methodLines = (app.method ? [app.method] : guide.method).slice();
      if (specs['Application']) methodLines.push('Tools: ' + specs['Application']);
      if (app.cleanup) methodLines.push('Cleanup: ' + app.cleanup);

      var dryingLines = [];
      if (specs['Touch dry'])  dryingLines.push('Touch dry: ' + specs['Touch dry']);
      if (specs['Recoat'])     dryingLines.push('Recoat: ' + specs['Recoat']);
      if (specs['Hard dry'])   dryingLines.push('Hard dry: ' + specs['Hard dry']);
      if (specs['Through dry']) dryingLines.push('Through dry: ' + specs['Through dry']);
      if (specs['Max hardness']) dryingLines.push('Max hardness: ' + specs['Max hardness']);
      if (!dryingLines.length) dryingLines = guide.drying;

      applyEl.innerHTML = [
        applyCard('Surface prep',   'brush',   prepLines),
        applyCard('Thinning',       'droplet', thinningLines),
        applyCard('Method',         'roller',  methodLines),
        applyCard('Drying (25°C)',  'clock',   dryingLines),
      ].join('');
    }

    // Safety — prefer verbatim label safety data
    setText('pdKebsNum', 'Meets Kenya Bureau of Standards');
    var safetyList = document.getElementById('pdSafety');
    if (safetyList) {
      var s = p.safety || {};
      var defaultVoc = p.cat === 'solvent' ? 'Flammable · solvent-based' : 'Low-VOC · water-based';
      var items = [
        { k: 'Lead declaration', v: s.lead || 'Lead-free formulation',                                  ic: 'shield' },
        { k: 'VOC / flammability', v: s.flammable || s.voc || defaultVoc,                                ic: 'leaf' },
        { k: 'Storage',          v: s.storage || 'Cool, dry place · keep lid tightly closed',            ic: 'bucket' },
        { k: 'First aid',        v: s.first_aid || 'Rinse eyes/skin with water · seek advice if ingested', ic: 'droplet' },
        { k: 'Disposal',         v: s.disposal || 'Do not pour down drains · dispose via licensed handler', ic: 'trash' },
      ];
      safetyList.innerHTML = items.map(function (i) {
        return '<div class="item"><div class="ic">' + svgIcon(i.ic) + '</div><div><div class="k">' + i.k + '</div><div class="v">' + i.v + '</div></div></div>';
      }).join('');
    }

    // Sticky bar
    setText('pdStickyName', p.name);
    setText('pdStickySize', currentSize);
    var stickyAdd = document.getElementById('pdStickyAdd');
    if (stickyAdd) stickyAdd.addEventListener('click', function () { window.cartAdd(p.slug, currentSize); });
  }

  function applyCard(title, icon, items) {
    return (
      '<div class="pd-apply-card">' +
        '<div class="ic">' + svgIcon(icon) + '</div>' +
        '<h4>' + title + '</h4>' +
        '<ul>' + (items || []).map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>' +
      '</div>'
    );
  }

  // Coverage calculator
  function wireCoverage(p) {
    var form = document.getElementById('pdCalc');
    if (!form) return;
    var areaEl   = document.getElementById('calcArea');
    var coatsEl  = document.getElementById('calcCoats');
    var sizeEl   = document.getElementById('calcSize');
    var resLit   = document.getElementById('calcResLit');
    var resPacks = document.getElementById('calcResPacks');
    var addBtn   = document.getElementById('calcAdd');

    // Populate pack size select
    if (sizeEl) {
      sizeEl.innerHTML = (p.sizes || []).map(function (s, i) {
        return '<option value="' + s + '"' + (i === p.sizes.length - 1 ? ' selected' : '') + '>' + s + '</option>';
      }).join('');
    }

    // Parse coverage (e.g. "10–12 m² / litre" → 11 midpoint)
    var covStr = (p.specs && p.specs['Coverage']) || '10 m²/L';
    var covRange = covStr.match(/(\d+(\.\d+)?)[^\d]+(\d+(\.\d+)?)/);
    var covPerL = covRange ? (parseFloat(covRange[1]) + parseFloat(covRange[3])) / 2 : parseFloat(covStr) || 10;

    function recalc() {
      var area  = parseFloat(areaEl.value) || 0;
      var coats = parseInt(coatsEl.value, 10) || 2;
      var size  = SIZE_L[sizeEl.value] || 4;
      if (!area) {
        resLit.textContent   = '—';
        resPacks.textContent = '';
        return;
      }
      // Add 10% for porous surfaces / wastage
      var litres = (area * coats / covPerL) * 1.1;
      var packs  = Math.ceil(litres / size);
      resLit.textContent   = litres.toFixed(1) + ' L';
      resPacks.textContent = packs + ' × ' + sizeEl.value + ' pack' + (packs === 1 ? '' : 's') + ' · incl. 10% allowance';
    }

    [areaEl, coatsEl, sizeEl].forEach(function (el) {
      if (!el) return;
      el.addEventListener('input',  recalc);
      el.addEventListener('change', recalc);
    });
    recalc();

    if (addBtn) addBtn.addEventListener('click', function () {
      var area  = parseFloat(areaEl.value) || 0;
      if (!area) { if (window.showToast) window.showToast('Enter a wall area first'); return; }
      var coats = parseInt(coatsEl.value, 10) || 2;
      var size  = SIZE_L[sizeEl.value] || 4;
      var litres = (area * coats / covPerL) * 1.1;
      var packs  = Math.max(1, Math.ceil(litres / size));
      for (var i = 0; i < packs; i++) window.cartAdd(p.slug, sizeEl.value);
    });
  }

  // Cross-sell — prefer explicit pairs_with, fall back to same category, then other
  function wireCrossSell(p) {
    var grid = document.getElementById('pdXsell');
    if (!grid || !window.CLOUD_PRODUCTS) return;
    var pool = [];
    if (p.pairs_with && p.pairs_with.length) {
      p.pairs_with.forEach(function (s) {
        var q = window.getProduct(s);
        if (q && q.slug !== p.slug) pool.push(q);
      });
    }
    if (pool.length < 3) {
      var same = window.CLOUD_PRODUCTS.filter(function (q) {
        return q.slug !== p.slug && q.cat === p.cat && pool.indexOf(q) === -1;
      });
      pool = pool.concat(same);
    }
    if (pool.length < 3) {
      var other = window.CLOUD_PRODUCTS.filter(function (q) {
        return q.slug !== p.slug && pool.indexOf(q) === -1;
      });
      pool = pool.concat(other);
    }
    pool = pool.slice(0, 3);
    grid.innerHTML = pool.map(function (q) {
      return (
        '<a href="product.html?p=' + q.slug + '" class="product-card ' + q.brandClass + '">' +
          '<div class="product-thumb">' +
            window.bucketCardHtml(q) +
            '<span class="floating-chip">' + q.cat_label + '</span>' +
          '</div>' +
          '<div class="product-body">' +
            '<div class="cat">' + q.cat_label + '</div>' +
            '<h4>' + q.name + '</h4>' +
            '<p class="desc">' + (q.short || '') + '</p>' +
            '<div class="product-foot">' +
              '<div class="sizes">' + (q.sizes || []).map(function (s) { return '<span class="size-chip">' + s + '</span>'; }).join('') + '</div>' +
              '<button class="add-btn" onclick="event.preventDefault();event.stopPropagation();cartAdd(\'' + q.slug + '\',\'' + (q.sizes[0] || '4L') + '\')" aria-label="Add to quote">' +
                '<svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>' +
              '</button>' +
            '</div>' +
          '</div>' +
        '</a>'
      );
    }).join('');
  }

  function wireSticky(p) { /* event binding already done in populate */ }

  // Utilities
  function setText(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }
  function setHTML(id, v) { var el = document.getElementById(id); if (el) el.innerHTML = v; }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);

})();
