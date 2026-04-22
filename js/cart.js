// ============================================================
// CLOUD PAINTS — Cart system
// localStorage-backed quote-builder cart (no payments)
// ============================================================

(function () {
  'use strict';

  var CART_KEY = 'cloud-cart-v1';
  var NAME_KEY = 'cloud-cart-name';

  function read() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
    catch (e) { return []; }
  }
  function write(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    renderCount();
    renderPreview();
    window.dispatchEvent(new CustomEvent('cart:update'));
  }

  function readName() {
    try { return localStorage.getItem(NAME_KEY) || ''; }
    catch (e) { return ''; }
  }
  function writeName(name) {
    try { localStorage.setItem(NAME_KEY, name || ''); } catch (e) {}
  }

  window.cartAdd = function (slug, size) {
    var cart = read();
    var existing = cart.find(function (i) { return i.slug === slug && i.size === size; });
    if (existing) existing.qty += 1;
    else cart.push({ slug: slug, size: size, qty: 1 });
    write(cart);
    var p = window.getProduct(slug);
    if (window.showToast) window.showToast((p ? p.name : 'Item') + ' added to your quote');
    renderDrawer();
  };

  window.cartRemove = function (slug, size) {
    write(read().filter(function (i) { return !(i.slug === slug && i.size === size); }));
    renderDrawer();
  };

  window.cartUpdateQty = function (slug, size, delta) {
    var cart = read();
    var item = cart.find(function (i) { return i.slug === slug && i.size === size; });
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter(function (i) { return !(i.slug === slug && i.size === size); });
    }
    write(cart);
    renderDrawer();
  };

  window.cartClear = function () { write([]); renderDrawer(); };
  window.cartCount = function () { return read().reduce(function (a, b) { return a + b.qty; }, 0); };

  function renderCount() {
    var el = document.getElementById('cartCount');
    if (!el) return;
    var n = window.cartCount();
    el.textContent = n;
    el.classList.toggle('has-items', n > 0);
    el.classList.add('pop');
    setTimeout(function () { el.classList.remove('pop'); }, 500);
  }

  function bucketSvg(primary, accent) {
    var id = 'g' + primary.replace('#', '');
    return '<svg viewBox="0 0 100 100" fill="none">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + accent + '"/><stop offset="1" stop-color="' + primary + '"/>' +
      '</linearGradient></defs>' +
      '<ellipse cx="50" cy="22" rx="32" ry="6" fill="' + primary + '" opacity=".5"/>' +
      '<rect x="18" y="22" width="64" height="60" rx="3" fill="url(#' + id + ')"/>' +
      '<rect x="22" y="34" width="56" height="34" rx="2" fill="rgba(255,255,255,.92)"/>' +
      '<rect x="22" y="38" width="56" height="3" fill="' + primary + '"/>' +
      '<rect x="22" y="58" width="56" height="2" fill="' + primary + '"/>' +
      '<ellipse cx="50" cy="22" rx="32" ry="5" fill="' + accent + '"/>' +
      '<path d="M16 28 Q12 50 16 78" stroke="' + primary + '" stroke-width="2" fill="none"/>' +
      '</svg>';
  }

  function renderDrawer() {
    var body = document.getElementById('cartBody');
    var foot = document.getElementById('cartFoot');
    if (!body) return;
    var cart = read();
    if (cart.length === 0) {
      body.innerHTML =
        '<div class="cart-empty">' +
        '<svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>' +
        '<p>Your quote basket is empty.<br>Add some products to get started.</p>' +
        '</div>';
      if (foot) foot.style.display = 'none';
      return;
    }
    if (foot) foot.style.display = 'block';
    body.innerHTML = cart.map(function (item) {
      var p = window.getProduct(item.slug);
      if (!p) return '';
      return '<div class="cart-item">' +
        '<div class="thumb" style="background:' + p.primary + ';">' + bucketSvg(p.primary, p.accent) + '</div>' +
        '<div class="info"><h5>' + p.name + '</h5><div class="size">' + item.size + '</div>' +
        '<div class="qty" style="margin-top:8px;">' +
        '<button onclick="cartUpdateQty(\'' + item.slug + '\',\'' + item.size + '\',-1)">−</button>' +
        '<span class="v">' + item.qty + '</span>' +
        '<button onclick="cartUpdateQty(\'' + item.slug + '\',\'' + item.size + '\',1)">+</button>' +
        '</div></div>' +
        '<button class="icon-btn" style="width:32px;height:32px;background:transparent;" onclick="cartRemove(\'' + item.slug + '\',\'' + item.size + '\')" aria-label="Remove">' +
        '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"/></svg>' +
        '</button></div>';
    }).join('');

    var totalItems = cart.reduce(function (a, b) { return a + b.qty; }, 0);
    var totalEl = document.getElementById('cartTotalItems');
    if (totalEl) totalEl.textContent = totalItems + ' item' + (totalItems !== 1 ? 's' : '');

    renderPreview();
  }

  // ============================================================
  // Shared quote text — identical body for WhatsApp + Email
  // ============================================================
  window.cartBuildQuoteText = function (opts) {
    opts = opts || {};
    var cart = read();
    if (cart.length === 0) return '';
    var name = (opts.customerName || readName() || '').trim();
    var lines = [];
    lines.push('*Cloud Paints — Quote Request*');
    lines.push('');
    lines.push('Hi Cloud Paints team,');
    lines.push('');
    lines.push("I'd like a quote for the following:");
    lines.push('');
    cart.forEach(function (item) {
      var p = window.getProduct(item.slug);
      if (!p) return;
      lines.push('• ' + p.name + ' — ' + item.size + ' × ' + item.qty);
    });
    lines.push('');
    lines.push('Name: ' + (name || '—'));
    lines.push('Sent from: cloudpaints.co.ke');
    lines.push('');
    lines.push('Asante.');
    return lines.join('\n');
  };

  // Legacy helpers (kept so product pages don't break)
  window.cartBuildWhatsappLink = function () {
    var text = window.cartBuildQuoteText();
    if (!text) return null;
    return 'https://wa.me/254741405481?text=' + encodeURIComponent(text);
  };
  window.cartBuildEmailLink = function () {
    var text = window.cartBuildQuoteText();
    if (!text) return null;
    var subject = encodeURIComponent('Quote Request — Cloud Paints');
    var body = encodeURIComponent(text);
    return 'mailto:info@cloudpaints.co.ke?subject=' + subject + '&body=' + body;
  };

  function renderPreview() {
    var ta = document.getElementById('cartPreview');
    if (!ta) return;
    ta.value = window.cartBuildQuoteText();
  }

  function openReview() {
    var foot = document.getElementById('cartFoot');
    var toggle = document.getElementById('cartReviewToggle');
    if (!foot || !toggle) return;
    foot.classList.add('is-reviewing');
    toggle.setAttribute('aria-expanded', 'true');
    renderPreview();
    var nameInput = document.getElementById('cartName');
    if (nameInput) {
      nameInput.value = readName();
      setTimeout(function () { nameInput.focus(); }, 220);
    }
  }

  function closeReview() {
    var foot = document.getElementById('cartFoot');
    var toggle = document.getElementById('cartReviewToggle');
    if (!foot || !toggle) return;
    foot.classList.remove('is-reviewing');
    toggle.setAttribute('aria-expanded', 'false');
  }

  // ============================================================
  // Drawer behaviour
  // ============================================================
  document.addEventListener('click', function (e) {
    if (e.target.closest('#cartOpen')) {
      var d = document.getElementById('cartDrawer');
      var bd = document.getElementById('cartBackdrop');
      if (d) d.classList.add('open');
      if (bd) bd.classList.add('open');
      renderDrawer();
    }
    if (e.target.closest('#cartClose') || e.target === document.getElementById('cartBackdrop')) {
      var d2 = document.getElementById('cartDrawer');
      var bd2 = document.getElementById('cartBackdrop');
      if (d2) d2.classList.remove('open');
      if (bd2) bd2.classList.remove('open');
      closeReview();
    }
    if (e.target.closest('#cartReviewToggle')) {
      var foot = document.getElementById('cartFoot');
      if (foot && foot.classList.contains('is-reviewing')) closeReview();
      else openReview();
    }
    if (e.target.closest('#cartWhatsapp')) {
      var url = window.cartBuildWhatsappLink();
      if (url) window.open(url, '_blank');
      else if (window.showToast) window.showToast('Your basket is empty');
    }
    if (e.target.closest('#cartEmail')) {
      var eurl = window.cartBuildEmailLink();
      if (eurl) window.location.href = eurl;
      else if (window.showToast) window.showToast('Your basket is empty');
    }
    if (e.target.closest('#cartClear')) {
      window.cartClear();
      closeReview();
    }
  });

  document.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'cartName') {
      writeName(e.target.value);
      renderPreview();
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    renderCount();
    renderDrawer();
  });

})();
