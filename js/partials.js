// ============================================================
// CLOUD PAINTS — Page Partials
// Injects header, footer and cart drawer into every page.
// Also exposes window.bucketCardHtml() used by all product
// card rendering scripts across the site.
// ============================================================

(function () {
  'use strict';

  var page = document.body.dataset.page || '';

  function isActive(name) {
    if (page === name) return 'active';
    // Sub-pages: product detail counts as "products", project detail as "projects"
    if (name === 'products' && page === 'product') return 'active';
    if (name === 'projects' && page === 'project') return 'active';
    return '';
  }

  // ----------------------------------------------------------
  // SHARED: Realistic 3D CSS bucket card HTML
  // Call window.bucketCardHtml(productObject) from any page
  // to get the full bucket markup including cert badge.
  //
  // If the product has an `image` path but the file doesn't exist
  // yet, the onerror handler swaps in the 3D CSS bucket so the
  // site never shows a broken image while photos are being
  // produced from the mockup templates.
  // ----------------------------------------------------------
  function bucket3dHtml(p) {
    var labelStyle = p.label
      ? 'background-image:url(' + p.label + ');background-size:cover;background-position:center top;'
      : 'background:linear-gradient(175deg,' + p.accent + ' 0%,' + p.primary + ' 100%);';

    return (
      '<div class="bucket3d-wrap" style="--bkt-primary:' + p.primary + ';--bkt-accent:' + p.accent + '">' +
        '<div class="bucket3d">' +
          '<div class="b-handle"></div>' +
          '<div class="b-lid"></div>' +
          '<div class="b-rim-top"></div>' +
          '<div class="b-body">' +
            '<div class="b-label" style="' + labelStyle + '"></div>' +
            '<div class="b-light"></div>' +
            '<div class="b-shadow-l"></div>' +
            '<div class="b-shadow-r"></div>' +
            '<div class="b-sheen"></div>' +
          '</div>' +
          '<div class="b-rim-bot"></div>' +
        '</div>' +
      '</div>'
    );
  }

  // Clean branded panel for products that don't have a mockup photo yet.
  function bucketNoImageHtml(p) {
    return (
      '<div class="bucket-noimg" style="--bkt-primary:' + p.primary + ';--bkt-accent:' + p.accent + '">' +
        '<span class="bucket-noimg-label">' + (p.cat_label || 'Cloud Paints') + '</span>' +
        '<span class="bucket-noimg-name">' + p.name + '</span>' +
      '</div>'
    );
  }

  // Stash the fallback markup on the element on error — swap in-place.
  window.__cpBucketFallback = function (imgEl, slug) {
    var p = window.getProduct ? window.getProduct(slug) : null;
    if (!p) return;
    var wrap = imgEl.closest('.bucket-photo-wrap');
    if (!wrap) return;
    wrap.outerHTML = bucketNoImageHtml(p);
  };

  // Root-relative, always. These cards render on pages at the site root and
  // on product pages one level down at /paints/<slug>, where a bare
  // "images/..." resolves to /paints/images/... and 404s.
  // js/base.js knows where the site is mounted — the domain root in
  // production, /<repo>/ on a GitHub Pages project site, a folder on a
  // staging box. Everything built here is inserted at two different page
  // depths from one string, so it cannot use a relative path and must not
  // assume the domain root.
  var asset = window.cpUrl || function (p) { return p; };
  var localise = window.cpLocalise || function (h) { return h; };
  window.cpAsset = asset;

  // What art this product actually has, from the manifest build/site.mjs
  // generates off the filesystem. The old code asked every card for a
  // transparent cut-out — art only twelve of the twenty-eight products own —
  // and let onerror sort out the rest, which cost a 404 per card for the
  // other sixteen.
  function artFor(p) {
    if (!p) return '';
    var m = window.CLOUD_ART;
    if (m && m[p.slug]) return m[p.slug];
    return asset(p.image);
  }
  window.cpArtFor = artFor;

  // Still the last word: a card rendered before the manifest loads, or a file
  // removed from disk without a rebuild, both land here.
  window.__cpBucketError = function (imgEl, slug) {
    var p = window.getProduct ? window.getProduct(slug) : null;
    if (imgEl.src.indexOf('/hero/') !== -1 && p && p.image) {
      imgEl.src = asset(p.image);
      return;
    }
    window.__cpBucketFallback(imgEl, slug);
  };

  window.bucketCardHtml = function (p) {
    var certBadge = '';

    var firstSrc = artFor(p);
    if (firstSrc) {
      return (
        '<div class="bucket-photo-wrap">' +
          '<img class="bucket-photo" src="' + firstSrc + '" alt="' + p.name +
            '" loading="lazy" decoding="async"' +
            ' onerror="window.__cpBucketError(this,\'' + p.slug + '\')">' +
        '</div>' +
        certBadge
      );
    }

    // No mockup photo yet — clean branded panel instead of a fake bucket
    return bucketNoImageHtml(p) + certBadge;
  };

  // ----------------------------------------------------------
  // HEADER — Phase 3 nav system
  // Desktop: 88px bar, transparent → frosted on scroll, mega-menu
  //          on Products, search overlay, quote CTA.
  // Mobile:  64px bar + hamburger → right-slide drawer with
  //          category sub-list, WhatsApp CTA, socials, theme.
  // ----------------------------------------------------------
  function useIcon(name, cls, size) {
    // Use the inline icon helper from icon.js (no external SVG references)
    if (window.icon) return window.icon(name, size || 22, cls || '');
    size = size || 22;
    return '<svg class="cp-icon' + (cls ? ' ' + cls : '') + '" width="' + size + '" height="' + size +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"' +
      ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="8" opacity=".3"/></svg>';
  }

  function megaColumn(title, items) {
    return '<div class="cp-mega-col">' +
      '<h5>' + title + '</h5>' +
      '<ul>' + items.map(function (it) {
        return '<li><a href="/paints/' + it.slug + '">' + it.name + '</a></li>';
      }).join('') + '</ul>' +
    '</div>';
  }

  function buildMega() {
    var products = window.CLOUD_PRODUCTS || [];
    function byCat(cats) {
      return products.filter(function (p) { return cats.indexOf(p.cat) !== -1; });
    }
    // New taxonomy: 10 customer-facing buckets (+ solvents kept inside
    // the Primer column so the mega stays tidy).
    var interior  = byCat(['interior-wall']);
    var exterior  = byCat(['exterior-wall']);
    var wood      = byCat(['wood']);
    var floorRoof = byCat(['floor', 'roof', 'road']);
    var enamels   = byCat(['enamel']);
    var primers   = byCat(['primer', 'solvent']);
    var textures  = byCat(['texture']);

    // Visual feature cards for the two flagship browse experiences —
    // sit at the top of the mega so the Colour book and Texture
    // collection are seen as soon as the menu opens. Built inline so
    // the spectrum strip stays in sync with the brand palette.
    var featureCards =
      '<div class="cp-mega-features">' +
        '<a class="cp-mega-feat cp-mega-feat--colours" href="/colours">' +
          '<span class="cp-mega-feat-strip" aria-hidden="true">' +
            '<i style="background:#C70F18"></i><i style="background:#E97923"></i>' +
            '<i style="background:#F0D61B"></i><i style="background:#7CD834"></i>' +
            '<i style="background:#2CAA50"></i><i style="background:#40CCBD"></i>' +
            '<i style="background:#348DD8"></i><i style="background:#3D4BCF"></i>' +
            '<i style="background:#8C74D0"></i><i style="background:#D33898"></i>' +
            '<i style="background:#B17C5A"></i><i style="background:#1D1F21"></i>' +
          '</span>' +
          '<span class="cp-mega-feat-meta">' +
            '<span class="cp-mega-feat-eyebrow">Colour Collection &middot; 2026</span>' +
            '<span class="cp-mega-feat-title">544 shades, 17 families</span>' +
            '<span class="cp-mega-feat-sub">Mixed to order in any finish ' + useIcon('arrow-right', 'arr', 14) + '</span>' +
          '</span>' +
        '</a>' +
        '<a class="cp-mega-feat cp-mega-feat--textures" href="/textures">' +
          '<span class="cp-mega-feat-strip cp-mega-feat-strip--tex" aria-hidden="true">' +
            '<i style="background:#7a6b5c"></i><i style="background:#7d7e80"></i>' +
            '<i style="background:#6b5e7a"></i><i style="background:#9a7b3f"></i>' +
            '<i style="background:#d4c4a8"></i><i style="background:#9b6b48"></i>' +
            '<i style="background:#c4a47c"></i><i style="background:#b58963"></i>' +
            '<i style="background:#ddc9b5"></i><i style="background:#5e605e"></i>' +
          '</span>' +
          '<span class="cp-mega-feat-meta">' +
            '<span class="cp-mega-feat-eyebrow">Decorative Texture Collection</span>' +
            '<span class="cp-mega-feat-title">10 hand-applied finishes</span>' +
            '<span class="cp-mega-feat-sub">Stone &middot; Marble &middot; Concrete &middot; Metallic ' + useIcon('arrow-right', 'arr', 14) + '</span>' +
          '</span>' +
        '</a>' +
      '</div>';

    return '<div class="cp-mega" role="menu" aria-label="Products">' +
      featureCards +
      '<div class="cp-mega-grid">' +
        megaColumn('Interior Wall Paints', interior) +
        megaColumn('Exterior Wall Paints', exterior) +
        megaColumn('Wood &amp; Enamel', wood.concat(enamels)) +
        megaColumn('Floor, Roof &amp; Road', floorRoof) +
        megaColumn('Primers &amp; Solvents', primers) +
        megaColumn('Decorative Textures', textures) +
      '</div>' +
      '<div class="cp-mega-foot">' +
        '<a href="/products" class="cp-mega-all">View the full catalogue ' + useIcon('arrow-right', 'arr', 16) + '</a>' +
      '</div>' +
    '</div>';
  }

  // Smaller link-list dropdown for non-products groups (Inspiration,
  // About). Sits beside the big mega in the navbar.
  function buildDrop(items) {
    return '<div class="cp-drop" role="menu">' +
      '<ul>' + items.map(function (it) {
        return '<li><a href="' + it.href + '">' +
          '<span class="cp-drop-name">' + it.name + '</span>' +
          (it.sub ? '<span class="cp-drop-sub">' + it.sub + '</span>' : '') +
        '</a></li>';
      }).join('') + '</ul>' +
    '</div>';
  }

  var header =
    '<a href="#main-content" class="skip-to-content">Skip to content</a>' +
    '<header class="site-header" data-nav>' +
      '<div class="container cp-nav-inner">' +
        '<a href="/" class="cp-logo" aria-label="Cloud Paints — home">' +
          '<img class="cp-logo-mark" src="/images/logo-mark.webp" alt="Cloud Paints" width="1140" height="968">' +
          '<span class="cp-logo-text">' +
            '<span class="cp-logo-name">' +
              '<span class="c-blue">Cloud</span><span class="c-red">Paints</span>' +
            '</span>' +
            '<span class="cp-logo-tag">' +
              '<span class="c-blue">Buy it</span><span class="dot">·</span>' +
              '<span class="c-red">Paint it</span><span class="dot">·</span>' +
              '<span class="c-blue">Love it</span>' +
            '</span>' +
          '</span>' +
        '</a>' +

        '<span class="cp-nav-divider" aria-hidden="true"></span>' +

        '<nav class="cp-primary" aria-label="Primary">' +
          '<a href="/" class="cp-link ' + isActive('home') + '"><span>Home</span></a>' +

          /* PRODUCTS — big mega-menu (catalogue + textures + colours) */
          '<div class="cp-has-mega" data-mega>' +
            '<a href="/products" class="cp-link ' + isActive('products') + ' ' + isActive('textures') + '" aria-haspopup="true" aria-expanded="false"><span>Products</span>' +
              useIcon('chevron-down', 'cp-link-caret', 14) +
            '</a>' +
            buildMega() +
          '</div>' +

          '<a href="/colours" class="cp-link ' + isActive('colours') + '"><span>Colours</span></a>' +
          '<a href="/visualiser" class="cp-link ' + isActive('visualiser') + '"><span>Visualiser</span></a>' +

          /* INSPIRATION — small dropdown: inspiration / projects / discover */
          '<div class="cp-has-drop" data-drop>' +
            '<a href="/inspiration" class="cp-link ' + isActive('inspiration') + ' ' + isActive('projects') + ' ' + isActive('discover') + '" aria-haspopup="true" aria-expanded="false"><span>Inspiration</span>' +
              useIcon('chevron-down', 'cp-link-caret', 14) +
            '</a>' +
            buildDrop([
              { name: 'Inspiration gallery', href: '/inspiration', sub: 'Curated Kenyan rooms' },
              { name: 'Projects',            href: '/projects',    sub: 'Real Cloud Paints jobs' },
              { name: 'Discover',            href: '/discover',    sub: 'Articles &amp; technology' },
            ]) +
          '</div>' +

          '<a href="/services" class="cp-link ' + isActive('services') + '"><span>Services</span></a>' +

          /* ABOUT — small dropdown: about / faq+contact / legal */
          '<div class="cp-has-drop" data-drop>' +
            '<a href="/about" class="cp-link ' + isActive('about') + ' ' + isActive('faq') + ' ' + isActive('contact') + ' ' + isActive('legal') + '" aria-haspopup="true" aria-expanded="false"><span>About</span>' +
              useIcon('chevron-down', 'cp-link-caret', 14) +
            '</a>' +
            buildDrop([
              { name: 'About Cloud Paints', href: '/about',   sub: 'Our story &amp; standards' },
              { name: 'FAQ &amp; contact',  href: '/contact', sub: 'Reach us, get a quote' },
              { name: 'Policies',           href: '/legal',   sub: 'Terms, privacy, warranty' },
            ]) +
          '</div>' +
        '</nav>' +

        '<div class="cp-actions">' +
          '<button id="themeToggle" class="icon-btn cp-theme-toggle" aria-label="Toggle light / dark theme" title="Toggle light / dark">' +
            '<span class="cp-theme-icon cp-theme-icon--sun">' + useIcon('sun') + '</span>' +
            '<span class="cp-theme-icon cp-theme-icon--moon">' + useIcon('moon') + '</span>' +
          '</button>' +
          '<button id="navSearch" class="icon-btn hide-sm" aria-label="Search products">' + useIcon('search') + '</button>' +
          '<button id="cartOpen" class="icon-btn" aria-label="Open quote basket">' +
            useIcon('cart') +
            '<span class="cart-count" id="cartCount">0</span>' +
          '</button>' +
          '<a href="#" class="btn btn-primary cp-quote-btn hide-sm" id="cpQuoteBtn">Get a quote</a>' +
          '<button id="menuToggle" class="icon-btn menu-toggle hide-lg" aria-label="Open menu" aria-expanded="false" aria-controls="mobileDrawer">' +
            useIcon('menu') +
          '</button>' +
        '</div>' +
      '</div>' +
    '</header>';

  // ----------------------------------------------------------
  // MOBILE DRAWER
  // ----------------------------------------------------------
  var mobileDrawer =
    '<div id="navBackdrop" class="nav-backdrop" aria-hidden="true"></div>' +
    '<aside id="mobileDrawer" class="mobile-drawer" role="dialog" aria-modal="true" aria-label="Site menu" aria-hidden="true" tabindex="-1">' +
      '<div class="md-head">' +
        '<span class="md-eyebrow">Menu</span>' +
        '<button id="navClose" class="icon-btn" aria-label="Close menu">' + useIcon('close') + '</button>' +
      '</div>' +
      '<nav class="md-nav" aria-label="Mobile primary">' +
        '<a href="/" class="md-link ' + isActive('home') + '"><em>Home</em>' + useIcon('arrow-up-right', 'md-arr', 18) + '</a>' +
        '<a href="/products" class="md-link ' + isActive('products') + '"><em>Products</em>' + useIcon('arrow-up-right', 'md-arr', 18) + '</a>' +
        '<details class="md-sub">' +
          '<summary>Browse by category ' + useIcon('chevron-down', 'md-caret', 16) + '</summary>' +
          '<div class="md-sub-grid">' +
            '<a href="/products#interior-wall">Interior wall paints</a>' +
            '<a href="/products#exterior-wall">Exterior wall paints</a>' +
            '<a href="/products#wood">Wood paints</a>' +
            '<a href="/products#metal">Metal paints</a>' +
            '<a href="/products#floor">Floor paints</a>' +
            '<a href="/products#roof">Roof paints</a>' +
            '<a href="/products#road">Road paints</a>' +
            '<a href="/products#enamel">Enamels</a>' +
            '<a href="/products#primer">Primers</a>' +
            '<a href="/products#texture">Decorative textures</a>' +
            '<a href="/products#solvent">Solvents</a>' +
          '</div>' +
        '</details>' +
        '<a href="/textures" class="md-link ' + isActive('textures') + '"><em>Texture Collection</em>' + useIcon('arrow-up-right', 'md-arr', 18) + '</a>' +
        '<a href="/colours" class="md-link ' + isActive('colours') + '"><em>Colour Collection</em>' + useIcon('arrow-up-right', 'md-arr', 18) + '</a>' +
        '<a href="/inspiration" class="md-link ' + isActive('inspiration') + '"><em>Inspiration</em>' + useIcon('arrow-up-right', 'md-arr', 18) + '</a>' +
        '<a href="/visualiser" class="md-link ' + isActive('visualiser') + '"><em>Visualiser</em>' + useIcon('arrow-up-right', 'md-arr', 18) + '</a>' +
        '<a href="/projects" class="md-link ' + isActive('projects') + '"><em>Projects</em>' + useIcon('arrow-up-right', 'md-arr', 18) + '</a>' +
        '<a href="/services" class="md-link ' + isActive('services') + '"><em>Services</em>' + useIcon('arrow-up-right', 'md-arr', 18) + '</a>' +
        '<a href="/discover" class="md-link ' + isActive('discover') + '"><em>Discover</em>' + useIcon('arrow-up-right', 'md-arr', 18) + '</a>' +
        '<a href="/about" class="md-link ' + isActive('about') + '"><em>About</em>' + useIcon('arrow-up-right', 'md-arr', 18) + '</a>' +
        '<a href="/contact" class="md-link ' + isActive('faq') + ' ' + isActive('contact') + '"><em>FAQ &amp; Contact</em>' + useIcon('arrow-up-right', 'md-arr', 18) + '</a>' +
      '</nav>' +
      '<div class="md-cta">' +
        '<a href="https://wa.me/254741405481" class="btn btn-wa md-wa" target="_blank" rel="noopener">' +
          useIcon('whatsapp', null, 18) + ' Chat on WhatsApp' +
        '</a>' +
      '</div>' +
      '<div class="md-foot">' +
        '<div class="md-socials">' +
          '<a href="https://www.instagram.com/cloudpaints" target="_blank" rel="noopener" aria-label="Instagram">' + useIcon('instagram', null, 20) + '</a>' +
          '<a href="https://www.facebook.com/cloudpaintsKE" target="_blank" rel="noopener" aria-label="Facebook">' + useIcon('facebook', null, 20) + '</a>' +
          '<a href="tel:+254741405481" aria-label="Phone">' + useIcon('phone', null, 20) + '</a>' +
          '<a href="mailto:info@cloudpaints.co.ke" aria-label="Email">' + useIcon('mail', null, 20) + '</a>' +
        '</div>' +
      '</div>' +
    '</aside>';

  // ----------------------------------------------------------
  // SEARCH OVERLAY
  // ----------------------------------------------------------
  var searchOverlay =
    '<div id="searchOverlay" class="search-overlay" aria-hidden="true">' +
      '<div class="so-sheet">' +
        '<div class="container so-bar">' +
          useIcon('search', 'so-icon', 22) +
          '<input id="searchInput" type="text" placeholder="Search products · e.g. Weatherguard, Silk Vinyl, Thinner" autocomplete="off">' +
          '<button id="searchClose" class="btn btn-ghost" aria-label="Close search">ESC</button>' +
        '</div>' +
        '<div class="container so-results" id="searchResults" aria-live="polite"></div>' +
      '</div>' +
    '</div>';

  // ----------------------------------------------------------
  // FOOTER
  // ----------------------------------------------------------
  var footer =
    '<footer>' +
    '  <div class="container">' +
    '    <div class="footer-grid">' +
    '      <div class="footer-brand">' +
    '        <h3>Cloud <em>Paints.</em></h3>' +
    '        <p>Premium decorative paints, coatings and solvents made in Kenya. Trusted by contractors and homeowners across the country.</p>' +
    '        <div class="cp-kebs" title="KEBS Standardization Mark — certified quality" aria-label="KEBS Standardization Mark — certified quality">' +
    '          <span class="cp-kebs-mark" aria-hidden="true">' +
    '            <svg viewBox="0 0 36 36" width="34" height="34"><circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" stroke-width="2"/><text x="18" y="16.5" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-weight="900" font-size="12" fill="currentColor">S</text><text x="18" y="27" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-weight="700" font-size="4.6" letter-spacing="0.5" fill="currentColor">KEBS</text></svg>' +
    '          </span>' +
    '          <div class="cp-kebs-text"><strong>KEBS Certified</strong><span>Standardization mark of quality</span></div>' +
    '        </div>' +
    '        <div class="socials">' +
    '          <a href="https://www.instagram.com/cloudpaints" target="_blank" rel="noopener" aria-label="Instagram">' +
    '            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>' +
    '          </a>' +
    '          <a href="https://www.facebook.com/cloudpaintsKE" target="_blank" rel="noopener" aria-label="Facebook">' +
    '            <svg fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/></svg>' +
    '          </a>' +
    '          <a href="https://wa.me/254741405481" target="_blank" rel="noopener" aria-label="WhatsApp">' +
    '            <svg fill="currentColor" viewBox="0 0 24 24"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.4-1.4-.9-.8-1.5-1.8-1.6-2.1-.2-.3 0-.4.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4-.1-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.4-.5-.6-.5h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2 0 1.3.9 2.5 1.1 2.7.1.2 1.8 2.7 4.4 3.8.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.6-.6 1.8-1.3.2-.7.2-1.3.2-1.4-.1-.2-.3-.2-.6-.4zm-5.5 7.5c-1.5 0-3-.4-4.3-1.2l-3.1.8.8-3c-.9-1.4-1.4-3-1.4-4.7 0-4.9 4-8.9 8.9-8.9 2.4 0 4.6.9 6.3 2.6 1.7 1.7 2.6 3.9 2.6 6.3 0 4.9-4 8.9-8.8 8.1zM12 0C5.4 0 0 5.4 0 12c0 2.1.5 4.1 1.6 5.9L0 24l6.3-1.6c1.7.9 3.7 1.4 5.7 1.4 6.6 0 12-5.4 12-12S18.6 0 12 0z"/></svg>' +
    '          </a>' +
    '        </div>' +
    '      </div>' +
    '      <div class="footer-col">' +
    '        <h5>Browse</h5>' +
    '        <ul>' +
    '          <li><a href="/products">All products</a></li>' +
    '          <li><a href="/products#interior-wall">Interior walls</a></li>' +
    '          <li><a href="/products#exterior-wall">Exterior walls</a></li>' +
    '          <li><a href="/products#wood">Wood paints</a></li>' +
    '          <li><a href="/products#enamel">Enamels</a></li>' +
    '          <li><a href="/textures">Texture Collection</a></li>' +
    '          <li><a href="/colours">Colour Collection</a></li>' +
    '        </ul>' +
    '      </div>' +
    '      <div class="footer-col">' +
    '        <h5>Explore</h5>' +
    '        <ul>' +
    '          <li><a href="/inspiration">Inspiration</a></li>' +
    '          <li><a href="/visualiser">Colour Visualiser</a></li>' +
    '          <li><a href="/projects">Projects</a></li>' +
    '          <li><a href="/services">Painting services</a></li>' +
    '          <li><a href="/discover">Discover</a></li>' +
    '        </ul>' +
    '      </div>' +
    '      <div class="footer-col">' +
    '        <h5>Company</h5>' +
    '        <ul>' +
    '          <li><a href="/about">Our story</a></li>' +
    '          <li><a href="/about#certifications">Quality &amp; standards</a></li>' +
    '          <li><a href="/contact">FAQ &amp; contact</a></li>' +
    '        </ul>' +
    '      </div>' +
    '      <div class="footer-col">' +
    '        <h5>Visit Us</h5>' +
    '        <p>10 Rangwe Road<br>Off Lunga Lunga Road<br>Industrial Area, Nairobi</p>' +
    '        <p style="margin-top:14px;"><a href="tel:+254741405481">+254 741 405 481</a><br><a href="mailto:info@cloudpaints.co.ke">info@cloudpaints.co.ke</a></p>' +
    '      </div>' +
    '    </div>' +
    '    <div class="footer-base">' +
    '      <span>© 2026 Cloudsent Decor Ltd · Cloud Paints®</span>' +
    '      <span class="footer-legal-links">' +
    '        <a href="/legal#privacy-policy">Privacy</a>' +
    '        <span aria-hidden="true">·</span>' +
    '        <a href="/legal#cookie-policy">Cookies</a>' +
    '        <span aria-hidden="true">·</span>' +
    '        <a href="/legal#service-delivery">Terms</a>' +
    '        <span aria-hidden="true">·</span>' +
    '        <a href="/legal">All policies</a>' +
    '      </span>' +
    '      <span class="tag">Buy it · Paint it · Love it.</span>' +
    '    </div>' +
    '  </div>' +
    '</footer>';

  // ----------------------------------------------------------
  // CART DRAWER
  // ----------------------------------------------------------
  var drawer =
    '<div id="cartBackdrop" class="drawer-backdrop"></div>' +
    '<aside id="cartDrawer" class="cart-drawer">' +
    '  <div class="cart-head">' +
    '    <h3>Your <em style="color:var(--red-2);font-style:italic">Quote.</em></h3>' +
    '    <button id="cartClose" class="icon-btn" aria-label="Close">' +
    '      <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>' +
    '    </button>' +
    '  </div>' +
    '  <div id="cartBody" class="cart-body"></div>' +
    '  <div id="cartFoot" class="cart-foot">' +
    '    <div class="cart-total"><span>Total items</span><span class="v" id="cartTotalItems">0</span></div>' +
    '    <div class="cart-review" id="cartReview">' +
    '      <label class="cart-field">' +
    '        <span>Your name <small>(optional)</small></span>' +
    '        <input id="cartName" type="text" placeholder="e.g. Juma Otieno" autocomplete="name">' +
    '      </label>' +
    '      <label class="cart-field">' +
    '        <span>Quote preview</span>' +
    '        <textarea id="cartPreview" readonly rows="8"></textarea>' +
    '      </label>' +
    '      <p class="cart-note">Both buttons send the same message. Basket stays until you clear it — tweak and resend anytime.</p>' +
    '    </div>' +
    '    <div class="cart-actions">' +
    '      <button id="cartReviewToggle" class="btn btn-primary" type="button">Review &amp; send <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" style="transition:transform .3s;"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg></button>' +
    '      <div class="cart-send-row">' +
    '        <button id="cartWhatsapp" class="btn btn-wa" type="button">' +
    '          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M20.5 3.5A11.87 11.87 0 0012 0C5.4 0 0 5.4 0 12c0 2.1.6 4.1 1.6 5.9L0 24l6.3-1.6A11.9 11.9 0 0012 24c6.6 0 12-5.4 12-12 0-3.2-1.2-6.2-3.5-8.5zM12 21.9c-1.8 0-3.6-.5-5.1-1.4l-.4-.2-3.7.9.9-3.6-.2-.4c-1-1.6-1.5-3.4-1.5-5.2C2 6.5 6.5 2 12 2c5.5 0 10 4.5 10 10s-4.5 9.9-10 9.9z"/><path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.4-1.4-.9-.8-1.5-1.8-1.6-2.1-.2-.3 0-.4.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4-.1-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.4-.5-.6-.5h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2 0 1.3.9 2.5 1.1 2.7.1.2 1.8 2.7 4.4 3.8.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.6-.6 1.8-1.3.2-.7.2-1.3.2-1.4-.1-.2-.3-.2-.6-.4z"/></svg>' +
    '          WhatsApp' +
    '        </button>' +
    '        <button id="cartEmail" class="btn btn-mail" type="button">' +
    '          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>' +
    '          Email' +
    '        </button>' +
    '      </div>' +
    '      <button id="cartClear" class="btn btn-ghost cart-clear" type="button">Clear basket</button>' +
    '    </div>' +
    '  </div>' +
    '</aside>';

  // Site-wide morphing background blobs — fixed behind every page,
  // five paint-coloured blobs drifting and morphing under heavy blur.
  // Hidden from a11y tree; pointer-events: none so they never block
  // clicks. Honours prefers-reduced-motion via the CSS @media query.
  var bgBlobs =
    '<div class="cp-bg-blobs" aria-hidden="true">' +
      '<span class="cp-bg-blob b1"></span>' +
      '<span class="cp-bg-blob b2"></span>' +
      '<span class="cp-bg-blob b3"></span>' +
      '<span class="cp-bg-blob b4"></span>' +
      '<span class="cp-bg-blob b5"></span>' +
    '</div>';

  // Inject — bg-blobs first (sit behind everything), header at top,
  // footer + drawer + nav extras at end.
  document.body.insertAdjacentHTML('afterbegin', localise(bgBlobs + header));
  document.body.insertAdjacentHTML('beforeend',
    localise(footer + drawer + mobileDrawer + searchOverlay));

  // a11y: mark the first content landmark so the skip-link lands somewhere.
  // Prefer an existing <main>, otherwise the first <section> after the header.
  if (!document.getElementById('main-content')) {
    var mainEl = document.querySelector('main') ||
                 document.querySelector('.site-header ~ section') ||
                 document.querySelector('body > section');
    if (mainEl) {
      mainEl.id = 'main-content';
      if (mainEl.tagName !== 'MAIN' && !mainEl.hasAttribute('role')) {
        mainEl.setAttribute('role', 'main');
      }
      mainEl.setAttribute('tabindex', '-1');
    }
  }

  // ----------------------------------------------------------
  // NAV BEHAVIOUR
  // Mega-menu hover + click (desktop), mobile drawer open/close
  // with scroll-lock + focus trap, search overlay with live filter,
  // and a cart-badge pop on `cart:update`.
  // ----------------------------------------------------------
  (function navBehaviour() {
    var html = document.documentElement;
    var mqDesktop = window.matchMedia('(min-width: 1024px)');

    // ---- Mega-menu (desktop) ----
    var megaHost = document.querySelector('[data-mega]');
    if (megaHost) {
      var megaLink = megaHost.querySelector('.cp-link');
      var closeTimer;
      function openMega() {
        clearTimeout(closeTimer);
        megaHost.classList.add('is-open');
        megaLink.setAttribute('aria-expanded', 'true');
      }
      function closeMega() {
        megaHost.classList.remove('is-open');
        megaLink.setAttribute('aria-expanded', 'false');
      }
      megaHost.addEventListener('mouseenter', function () {
        if (mqDesktop.matches) openMega();
      });
      megaHost.addEventListener('mouseleave', function () {
        if (mqDesktop.matches) {
          closeTimer = setTimeout(closeMega, 180);
        }
      });
      // Keyboard: toggle on Enter/Space from the link when focused
      megaLink.addEventListener('keydown', function (e) {
        if (!mqDesktop.matches) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          megaHost.classList.toggle('is-open');
          megaLink.setAttribute('aria-expanded', megaHost.classList.contains('is-open'));
        } else if (e.key === 'Escape') {
          closeMega();
        }
      });
      // Close when clicking anywhere outside
      document.addEventListener('click', function (e) {
        if (!megaHost.contains(e.target)) closeMega();
      });
    }

    // ---- Small dropdowns (Inspiration, About) ----
    // Same hover/keyboard pattern as the mega, applied per-host so any
    // number of `[data-drop]` blocks in the nav can coexist.
    Array.prototype.forEach.call(document.querySelectorAll('[data-drop]'), function (host) {
      var link = host.querySelector('.cp-link');
      if (!link) return;
      var closeT;
      function open()  { clearTimeout(closeT); host.classList.add('is-open'); link.setAttribute('aria-expanded', 'true'); }
      function close() { host.classList.remove('is-open'); link.setAttribute('aria-expanded', 'false'); }
      host.addEventListener('mouseenter', function () { if (mqDesktop.matches) open(); });
      host.addEventListener('mouseleave', function () { if (mqDesktop.matches) closeT = setTimeout(close, 160); });
      link.addEventListener('keydown', function (e) {
        if (!mqDesktop.matches) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          host.classList.toggle('is-open');
          link.setAttribute('aria-expanded', host.classList.contains('is-open'));
        } else if (e.key === 'Escape') {
          close();
        }
      });
      document.addEventListener('click', function (e) { if (!host.contains(e.target)) close(); });
    });

    // ---- Mobile drawer ----
    var drawerEl = document.getElementById('mobileDrawer');
    var backdrop = document.getElementById('navBackdrop');
    var openBtn = document.getElementById('menuToggle');
    var closeBtn = document.getElementById('navClose');
    var lastFocus = null;

    function openDrawer() {
      if (!drawerEl) return;
      lastFocus = document.activeElement;
      drawerEl.classList.add('is-open');
      backdrop.classList.add('is-open');
      drawerEl.setAttribute('aria-hidden', 'false');
      backdrop.setAttribute('aria-hidden', 'false');
      openBtn.setAttribute('aria-expanded', 'true');
      html.classList.add('nav-lock');
      drawerEl.focus();
    }
    function closeDrawer() {
      if (!drawerEl) return;
      drawerEl.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      drawerEl.setAttribute('aria-hidden', 'true');
      backdrop.setAttribute('aria-hidden', 'true');
      openBtn.setAttribute('aria-expanded', 'false');
      html.classList.remove('nav-lock');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    if (openBtn) openBtn.addEventListener('click', openDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (backdrop) backdrop.addEventListener('click', closeDrawer);
    if (drawerEl) {
      drawerEl.addEventListener('click', function (e) {
        if (e.target.closest('a')) closeDrawer();
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawerEl && drawerEl.classList.contains('is-open')) {
        closeDrawer();
      }
    });
    // Focus trap (cycle Tab within drawer)
    if (drawerEl) {
      drawerEl.addEventListener('keydown', function (e) {
        if (e.key !== 'Tab' || !drawerEl.classList.contains('is-open')) return;
        var focusable = drawerEl.querySelectorAll('a,button,details,input,[tabindex]:not([tabindex="-1"])');
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      });
    }

    // ---- Search overlay ----
    var searchBtn = document.getElementById('navSearch');
    var searchOv = document.getElementById('searchOverlay');
    var searchClose = document.getElementById('searchClose');
    var searchInput = document.getElementById('searchInput');
    var searchResults = document.getElementById('searchResults');

    function renderResults(q) {
      var items = window.CLOUD_PRODUCTS || [];
      q = (q || '').trim().toLowerCase();
      if (!q) {
        searchResults.innerHTML = '<div class="so-hint">Type to search — try <em>silk</em>, <em>weather</em>, <em>enamel</em>…</div>';
        return;
      }
      var matches = items.filter(function (p) {
        return p.name.toLowerCase().indexOf(q) !== -1 ||
               (p.tagline || '').toLowerCase().indexOf(q) !== -1 ||
               (p.cat_label || '').toLowerCase().indexOf(q) !== -1;
      }).slice(0, 8);
      if (!matches.length) {
        searchResults.innerHTML = '<div class="so-hint">No products matched "' + q + '".</div>';
        return;
      }
      searchResults.innerHTML = localise(matches.map(function (p) {
        return '<a class="so-row" href="/paints/' + p.slug + '">' +
          '<span class="so-swatch" style="background:' + p.primary + '"></span>' +
          '<span class="so-txt"><strong>' + p.name + '</strong><em>' + (p.cat_label || '') + '</em></span>' +
          useIcon('arrow-up-right', 'so-arr', 18) +
        '</a>';
      }).join(''));
    }
    function openSearch() {
      if (!searchOv) return;
      searchOv.classList.add('is-open');
      searchOv.setAttribute('aria-hidden', 'false');
      html.classList.add('nav-lock');
      renderResults('');
      setTimeout(function () { searchInput && searchInput.focus(); }, 40);
    }
    function closeSearch() {
      if (!searchOv) return;
      searchOv.classList.remove('is-open');
      searchOv.setAttribute('aria-hidden', 'true');
      html.classList.remove('nav-lock');
      if (searchInput) searchInput.value = '';
    }
    if (searchBtn) searchBtn.addEventListener('click', openSearch);
    if (searchClose) searchClose.addEventListener('click', closeSearch);
    if (searchOv) {
      searchOv.addEventListener('click', function (e) {
        if (e.target === searchOv) closeSearch();
      });
    }
    if (searchInput) {
      var searchTimer;
      searchInput.addEventListener('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () { renderResults(searchInput.value); }, 40);
      });
      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeSearch();
        if (e.key === 'Enter') {
          var first = searchResults.querySelector('a');
          if (first) window.location.href = first.getAttribute('href');
        }
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && searchOv && searchOv.classList.contains('is-open')) closeSearch();
      if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && !html.classList.contains('nav-lock')) {
        e.preventDefault(); openSearch();
      }
    });

    // ---- Quote CTA (opens cart drawer) ----
    var quoteBtn = document.getElementById('cpQuoteBtn');
    if (quoteBtn) {
      quoteBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var cartOpen = document.getElementById('cartOpen');
        if (cartOpen) cartOpen.click();
      });
    }

    // ---- Cart badge pop on update ----
    window.addEventListener('cart:update', function () {
      var count = document.getElementById('cartCount');
      if (!count) return;
      count.classList.remove('pop');
      // Force reflow so the animation restarts
      void count.offsetWidth;
      count.classList.add('pop');
    });
  })();

})();
