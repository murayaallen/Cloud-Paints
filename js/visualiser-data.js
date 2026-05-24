// ============================================================
// CLOUD PAINTS — Visualiser data
// Rooms + curated "popular shades" rail. The Visualiser uses
// a full HSV picker for true unlimited colour — Cloud Paints'
// factory mixes any shade. These quick-picks are only inspiration.
// ============================================================

window.CLOUD_VISUALISER = {
  rooms: [
    { slug: 'living-modern',  label: 'Modern living',     image: 'images/rooms/room-living-modern.jpg' },
    { slug: 'living-warm',    label: 'Warm living',       image: 'images/rooms/room-living-warm.jpg' },
    { slug: 'bedroom-soft',   label: 'Calm bedroom',      image: 'images/rooms/room-bedroom-soft.jpg' },
    { slug: 'bedroom-suite',  label: 'Main bedroom',      image: 'images/rooms/room-bedroom-suite.jpg' },
    { slug: 'kitchen-island', label: 'Kitchen · island',  image: 'images/rooms/room-kitchen-island.jpg' },
    { slug: 'kitchen-warm',   label: 'Family kitchen',    image: 'images/rooms/room-kitchen-warm.jpg' },
    { slug: 'dining',         label: 'Dining room',       image: 'images/rooms/room-dining.jpg' },
    { slug: 'bathroom',       label: 'Bathroom',          image: 'images/rooms/room-bathroom.jpg' },
    { slug: 'hallway',        label: 'Hallway',           image: 'images/rooms/room-hallway.jpg' },
    { slug: 'office',         label: 'Home office',       image: 'images/rooms/room-office.jpg' },
    { slug: 'child',          label: "Child's bedroom",   image: 'images/rooms/room-child.jpg' },
    { slug: 'exterior',       label: 'Exterior',          image: 'images/rooms/room-exterior.jpg' },
  ],

  // Popular-shades rail — Kenya-flavoured inspiration. Just a starting
  // point; users are encouraged to pick any colour they want.
  quickPicks: [
    { name: 'Kilifi Clay',      hex: '#b25a44' },
    { name: 'Savanna Gold',     hex: '#c4870a' },
    { name: 'Rift Cobalt',      hex: '#1f4088' },
    { name: 'Aberdare Forest',  hex: '#2f5d40' },
    { name: 'Terracotta',       hex: '#a83a1c' },
    { name: 'Acacia Honey',     hex: '#d4a93b' },
    { name: 'Coastal Mist',     hex: '#8eb8c4' },
    { name: 'Mt Kenya Snow',    hex: '#f1ece1' },
    { name: 'Deep Indigo',      hex: '#1f2950' },
    { name: 'Buruburu Cream',   hex: '#c4b59a' },
    { name: 'Soapstone',        hex: '#6a5e51' },
    { name: 'Sunset Rust',      hex: '#963318' },
    { name: 'Tea Leaf',         hex: '#7a8c70' },
    { name: 'Nairobi Sky',      hex: '#5d8aa8' },
    { name: 'Mahogany',         hex: '#663f24' },
    { name: 'Storm Slate',      hex: '#5a5a64' },
  ],
};
