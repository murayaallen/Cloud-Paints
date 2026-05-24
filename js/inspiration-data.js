// ============================================================
// CLOUD PAINTS — Inspiration Gallery data
// ============================================================
// Lifestyle / styled / finished-interior + exterior photos
// shown on /inspiration.html. Independent of CLOUD_PROJECTS
// (which are attributed real client work). New imagery
// (real photographs or AI-generated) drops in by adding rows.
// ============================================================

window.CLOUD_INSPIRATION = [
  // ---------- WARM / EARTHY ----------
  { slug: 'terracotta-living',     image: 'images/inspiration/inspiration-terracotta-living.jpg',
    title: 'Terracotta Living',    room: 'living',   mood: 'warm', aspect: 'landscape', accent: '#a83a1c', featured: true },

  { slug: 'clay-bedroom',          image: 'images/inspiration/inspiration-clay-bedroom.jpg',
    title: 'Clay-Pink Bedroom',    room: 'bedroom',  mood: 'warm', aspect: 'portrait',  accent: '#c08573' },

  { slug: 'ochre-dining',          image: 'images/inspiration/inspiration-ochre-dining.jpg',
    title: 'Ochre Dining Nook',    room: 'dining',   mood: 'warm', aspect: 'landscape', accent: '#c4870a' },

  { slug: 'clay-kitchen',          image: 'images/inspiration/inspiration-clay-kitchen.jpg',
    title: 'Clay-Red Kitchen',     room: 'kitchen',  mood: 'warm', aspect: 'square',    accent: '#a32018' },

  { slug: 'savanna-living',        image: 'images/inspiration/inspiration-savanna-living.jpg',
    title: 'Savanna Gold Living',  room: 'living',   mood: 'warm', aspect: 'landscape', accent: '#c4870a' },

  { slug: 'rust-hallway',          image: 'images/inspiration/inspiration-rust-hallway.jpg',
    title: 'Rust-Red Hallway',     room: 'hallway',  mood: 'warm', aspect: 'portrait',  accent: '#963318' },

  // ---------- COOL / COASTAL ----------
  { slug: 'coastal-bedroom',       image: 'images/inspiration/inspiration-coastal-bedroom.jpg',
    title: 'Sea-Glass Bedroom',    room: 'bedroom',  mood: 'cool', aspect: 'landscape', accent: '#8eb8c4' },

  { slug: 'navy-study',            image: 'images/inspiration/inspiration-navy-study.jpg',
    title: 'Deep Navy Study',      room: 'office',   mood: 'cool', aspect: 'portrait',  accent: '#1f2950' },

  { slug: 'rift-cobalt-living',    image: 'images/inspiration/inspiration-rift-cobalt-living.jpg',
    title: 'Rift Cobalt Living',   room: 'living',   mood: 'cool', aspect: 'landscape', accent: '#1f4088' },

  { slug: 'mist-bathroom',         image: 'images/inspiration/inspiration-mist-bathroom.jpg',
    title: 'Misty Blue Bathroom',  room: 'bathroom', mood: 'cool', aspect: 'square',    accent: '#b6cad4' },

  { slug: 'coastal-veranda',       image: 'images/inspiration/inspiration-coastal-veranda.jpg',
    title: 'Lamu Coastal Veranda', room: 'veranda',  mood: 'neutral', aspect: 'landscape', accent: '#e8a317', featured: true },

  // ---------- NEUTRAL ----------
  { slug: 'warm-white-kitchen',    image: 'images/inspiration/inspiration-warm-white-kitchen.jpg',
    title: 'Warm-White Kitchen',   room: 'kitchen',  mood: 'neutral', aspect: 'landscape', accent: '#cfb89a' },

  // ---------- EXTERIORS ----------
  { slug: 'buruburu-maisonette',   image: 'images/inspiration/inspiration-buruburu-maisonette.jpg',
    title: 'Buruburu Maisonette',  room: 'exterior', mood: 'neutral', aspect: 'landscape', accent: '#c4b59a' },

  { slug: 'villa-cream-charcoal',  image: 'images/inspiration/inspiration-villa-cream-charcoal.jpg',
    title: 'Cream & Charcoal Villa', room: 'exterior', mood: 'neutral', aspect: 'landscape', accent: '#3d3d3d', featured: true },

  { slug: 'apartments-sage',       image: 'images/inspiration/inspiration-apartments-sage.jpg',
    title: 'Sage Green Apartments', room: 'exterior', mood: 'cool', aspect: 'landscape', accent: '#7a8c70' },

  { slug: 'coastal-villa-lamu',    image: 'images/inspiration/inspiration-coastal-villa-lamu.jpg',
    title: 'Lamu Coastal Villa',   room: 'exterior', mood: 'neutral', aspect: 'landscape', accent: '#d9c89a' },

  { slug: 'apartment-urban-tower', image: 'images/inspiration/inspiration-apartment-urban-tower.jpg',
    title: 'Urban Apartment Tower', room: 'exterior', mood: 'neutral', aspect: 'landscape', accent: '#c9bfa8' },
];

window.getInspiration = function (slug) {
  return window.CLOUD_INSPIRATION.find(function (p) { return p.slug === slug; });
};
