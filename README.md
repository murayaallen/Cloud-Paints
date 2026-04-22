# Cloud Paints — Website

A multi-page marketing + catalogue website for **Cloudsent Decor Ltd T/A Cloud Paints**, a KEBS-certified Kenyan manufacturer of decorative paints, coatings and solvents.

Built to be handed off to Claude Code for final adjustments.

---

## Quick start

This site uses ES modules (Three.js) so it **must be served over HTTP** — opening `index.html` directly with `file://` will fail.

```bash
cd site
python3 -m http.server 8000
# then open http://localhost:8000/
```

Or any other static server (Vite, Netlify dev, `npx serve`, etc.) works just as well.

---

## Pages

| File              | Purpose                                                                 |
|-------------------|-------------------------------------------------------------------------|
| `index.html`      | Homepage: hero with interactive 3D paint bucket, marquee, pillars, story split, featured products, project gallery preview, CTA |
| `products.html`   | Full 18-product catalogue with category filter chips                    |
| `product.html`    | Product detail page — driven by `?p={slug}` — 3D bucket with real label wrapped, size toggle, specs, features, add-to-quote |
| `projects.html`   | Bento-grid project gallery + clients list + CTA                         |
| `about.html`      | Story, mission/vision/values, Managing Director, KEBS certifications, stats |
| `contact.html`    | Contact details, quote request form (sends to WhatsApp), OpenStreetMap embed |

---

## Key features

### 1. Interactive 3D paint buckets (Three.js)
- Each product page renders a real paint bucket in 3D using Three.js
- The product label PDFs (Silk Vinyl, Vinyl Matt, Iris Economy, SuperMatt, Weatherguard) are wrapped around the cylinder body as a texture
- Drag to rotate with momentum/decay, auto-rotate when idle
- Size toggle (1L / 4L / 20L / 250ml) scales the bucket smoothly
- Per-product brand colour theming (background gradient, lid colour)
- Products without a real label get a procedurally-generated canvas texture fallback

See `js/bucket3d.js`. Three.js lives in `js/vendor/` (offline, no CDN).

### 2. Quote basket (cart)
- `localStorage`-backed — persists across page loads
- Slide-out drawer from the right, cart count badge in header
- Add / remove / quantity controls
- **Send via WhatsApp** — auto-formats a message with all line items and opens `wa.me/254741405481`
- **Email Quote** — prefills `mailto:info@cloudpaints.co.ke`
- No payments; this is a quote-request flow

See `js/cart.js`.

### 3. Dark / light theme
- Toggle in header — sun / moon icons swap
- Persisted to `localStorage` under `cloud-theme`
- All colours are CSS variables in `:root` and `[data-theme="dark"]`
- In dark mode, italic accent text in headlines shifts from red to gold

See `css/main.css` tokens section.

### 4. Scroll effects
- `IntersectionObserver`-based reveal animations (`.reveal`, `.reveal-l`, `.reveal-r`, `.stagger`)
- Animated counters for hero stats (`data-count="47"`)
- Char-by-char headline split (`[data-split-chars]`)
- Magnetic CTA buttons (`[data-magnetic]`) — subtle parallax pull on hover
- Sticky header with backdrop blur on scroll
- Smooth anchor scrolling
- Continuous marquee strip of product names on homepage
- Floating blob background on hero sections (CSS-animated)

See `js/main.js`.

### 5. Responsive
- Mobile-first breakpoints at 900px and 580px
- Hamburger menu drawer on small screens
- All grids collapse cleanly
- Header, hero, cards, and forms are all touch-friendly

---

## File tree

```
site/
├── index.html              # Home
├── products.html           # Catalogue
├── product.html            # Dynamic product detail (?p=slug)
├── projects.html           # Project gallery
├── about.html              # Story, certifications, leadership
├── contact.html            # Quote form, details, map
│
├── css/
│   └── main.css            # All styles — design system + components
│
├── js/
│   ├── main.js             # Theme, scroll reveal, mobile nav, toast
│   ├── partials.js         # Injects header/footer/cart drawer on every page
│   ├── products-data.js    # Full product catalogue (18 items with specs)
│   ├── cart.js             # Cart state + drawer rendering
│   ├── bucket3d.js         # Three.js 3D bucket module (ES import)
│   └── vendor/
│       ├── three.module.min.js    # Three.js r183 ES module build
│       └── three.core.min.js      # Required by three.module.min.js
│
└── images/
    ├── logo.png            # Brand logo (from your upload)
    ├── logo-icon.png       # Favicon
    ├── labels/             # 5 product labels used as 3D textures
    │   ├── silk-vinyl.jpg
    │   ├── vinyl-matt.jpg
    │   ├── iris-economy.jpg
    │   ├── supermatt.jpg
    │   └── weatherguard.jpg
    └── projects/           # 11 curated project photos
        ├── pazuri-vipingo.jpg
        ├── pazuri-villa.jpg
        ├── westpointe-stairwell.jpg
        ├── westpointe-corridors.jpg
        ├── emana-apartments.jpg
        ├── complex-plaza.jpg
        ├── mlolongo-commercial.jpg
        ├── vanice-estate.jpg
        ├── residential-syokimau.jpg
        ├── amana-apartments.jpg
        └── moi-forces.jpg
```

---

## Where to tweak things

### Change brand colours
`css/main.css`, the `:root` block at the top. Corporate blue, wine red and mustard are already set as `--blue`, `--red`, `--gold` (with `-2`, `-glow`, `-soft` variants).

### Add a new product
`js/products-data.js` — push a new object into the `CLOUD_PRODUCTS` array. Required fields: `slug`, `name`, `cat`, `cat_label`, `primary`, `accent`, `brandClass`, `sizes[]`, `features[]`, `specs{}`, `short`, `full`. Optional: `label` (path to label image for 3D wrap), `kebs` (permit number).

### Change WhatsApp phone number
Search/replace `254741405481` across `js/cart.js`, `contact.html`, `js/partials.js`, `index.html`, `projects.html`.

### Change email
Search/replace `info@cloudpaints.co.ke`.

### Add a new project photo
Drop into `images/projects/` (~1400px max edge, JPEG 82% quality), then reference it in `projects.html` and `index.html`.

### Adjust the 3D bucket shape / lighting
`js/bucket3d.js` — the `createBucket` function builds body, lid, rim, handle. Light rigs are in `initBucketScene` after the camera setup.

---

## Known items for Claude Code

1. **Fonts** — the HTML links `fonts.googleapis.com` with an `onerror="this.remove()"` fallback. If you have access, Fraunces (serif) + Inter (sans) will look best. Otherwise the CSS falls back to Lora + system sans which still renders cleanly.
2. **OpenStreetMap embed on contact page** — uses a rough bbox for Industrial Area. You may want a proper Google Maps embed with the exact "10 Rangwe Road" pin.
3. **Product label textures** — I have real labels for Silk Vinyl, Vinyl Matt, Iris Economy, SuperMatt and Weatherguard. The other 13 products fall back to a procedural canvas texture. Adding real labels for Gloss Enamel, Rocketex, Roof Paint etc. is just dropping JPEGs into `images/labels/` and setting `label:` in `products-data.js`.
4. **Form submission on contact page** — currently redirects to WhatsApp. If you want server-side handling (Netlify Forms, Formspree, your own endpoint), swap the submit handler in `contact.html`.
5. **Favicon** — `logo-icon.png` is 128×128. You may want a proper multi-size `favicon.ico` and `apple-touch-icon.png`.
6. **SEO** — meta descriptions are in place per page. Add structured data (Organization, Product schema) when you're ready.
7. **Cart persistence** — uses `cart-v1` key in localStorage. If you ever change the data shape, bump the key.

---

## Contact

Allen · murayamakingedits@gmail.com
