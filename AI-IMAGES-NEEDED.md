# Cloud Paints — AI Image Brief (v2)

A complete, audited brief for every image the website needs corrected or
added. Built specifically for **Gemini AI image creation**. Each prompt
has been written to surface the actual subject Cloud Paints is selling
(the *paint product*, not just the room around it).

---

## How to use this file

1. **Style prefix** — paste this line in front of every prompt so all
   outputs share a consistent look:

   > Editorial architecture photography, natural light, Kenyan
   > residential or commercial setting, no people, no text overlays, no
   > logos, no watermarks, photo-real (not illustrated, not painterly),
   > sharp focus, 16:10 framing unless specified otherwise.

2. **Aspect ratio** — note the **(W×H or ratio)** at the end of each
   prompt and ask Gemini for that ratio.

3. **Save filenames** — save each output exactly as the **Drop file as:**
   line specifies. Filenames already match what the website code expects,
   so they will appear in the right slot the moment you replace them.

4. **Folder layout** — drop everything inside the project's `images/`
   folder under the subfolder noted in each prompt. The Section 9
   filename map at the bottom is a quick reference for everything.

---

# SECTION 1 — Hero slideshow corrections

The hero slideshow cycles 13 slides; each slide pairs a bucket image
with a backdrop. The backdrop should clearly show **the product on a
real surface**, not just any room. Findings from the audit:

| # | Product | Current backdrop | Verdict | Needs new shot? |
|---|---|---|---|---|
| 1 | Weatherguard | inspiration-villa-cream-charcoal | ✓ exterior villa | no |
| 2 | Silk Vinyl | inspiration-clay-bedroom | ✓ interior emulsion wall visible | no |
| 3 | Rocketex Wallmaster | inspiration-apartments-sage | ✓ textured exterior | no |
| 4 | Premium Emulsion | inspiration-savanna-living | ✓ interior matte walls | no |
| 5 | Gloss Enamel | inspiration-rust-hallway | ⚠ walls dominate; gloss is for **trim** | **YES** |
| 6 | Iris Plastic Emulsion | inspiration-rift-cobalt-living | ✓ premium navy wall | no |
| 7 | Weatherguard × Pazuri Villa | pazuri-villa | ✓ real CP project | no |
| 8 | Silk Vinyl × coastal | inspiration-coastal-bedroom | ✓ painted feature wall | no |
| 9 | Vinyl Matt | inspiration-warm-white-kitchen | ✓ bright matte ceiling | no |
| 10 | Clear Varnish | inspiration-ochre-dining | ⚠ ochre walls dominate, not varnish | **YES** |
| 11 | Gloss Enamel × bathroom | inspiration-mist-bathroom | ✓ glossy vanity & trim | no |
| 12 | Road Marking Paint | mlolongo-commercial | ⚠ road markings not visible | **YES** |
| 13 | Roof Paint × green roof | green-roof-villa | ✓ tiled roof is subject | no |

### 1A. Gloss Enamel — replacement for slide 5
> A close-up architectural detail of a Kenyan home's front door and
> window trim, **the trim itself painted in deep glossy black or
> charcoal gloss enamel** with a clear high-sheen surface that
> visibly reflects the surroundings. The wall around the trim is a
> calm cream emulsion finish (recedes). Wooden front door slightly
> ajar; the gloss enamel coating on the door's panel mouldings catches
> the light. Late afternoon golden sidelight. The gloss enamel finish
> on wood/metal trim is the visual subject. 50 mm lens at f/4. (16:10)

Drop file as: `images/inspiration/inspiration-gloss-enamel-trim.jpg`

### 1B. Clear Varnish / Wood Care — replacement for slide 10
> Close-up of a polished Kenyan mahogany handrail running down a
> wooden staircase, the wood freshly finished in a high-gloss clear
> varnish that visibly catches the light along the grain. The grain
> pattern is rich and warm; the varnish shows a clean reflective
> sheen along the top edge of the handrail. The wall behind is soft
> out-of-focus cream. Daylight from the right. The varnished wood
> grain is the subject. 60 mm macro lens at f/4. (16:10)

Drop file as: `images/inspiration/inspiration-varnished-handrail.jpg`

### 1C. Road Marking Paint — replacement for slide 12
> A wide commercial-property parking area in Nairobi, freshly painted
> with bright white road-marking paint — crisp parallel parking bays
> in the foreground showing fresh white lines on dark grey tarmac, a
> clear yellow disabled-bay symbol mid-frame, an arrow direction
> marker visible to the left. Morning light, the paint still slightly
> wet-looking. The painted markings on the asphalt are the subject —
> they should dominate the lower 60% of the frame. Building edge soft
> in the background. No vehicles, no people. 24 mm wide lens, slight
> downward tilt to emphasise the parking grid. (16:10)

Drop file as: `images/projects/road-marking-fresh.jpg`

---

# SECTION 2 — Texture Collection close-ups (10 swatches)

**Findings:** every product in the Texture Collection currently uses a
generic room photo, not the texture finish itself. A product called
"Cloud Stone Texture" should lead with a close-up of the actual stone-
look surface. Generate **close-up swatch shots** for all 10.

**Shared prompt prefix for every swatch:**

> Macro architectural detail photograph. Shot directly at a flat wall
> surface from 1 metre away, lens parallel to the wall. Raking
> sidelight from the left at low angle to make the texture profile
> visible. No objects in frame, no people, no text, no furniture, no
> shadows of objects. Only the painted texture surface fills the frame
> with a clean square crop. The surface should look hand-applied with
> visible artisan character, not flat 3D-render. (1:1 square)

### 2.1. Cloud Stone Texture
> ...hand-sculpted exterior stone-look texture finish on a Kenyan
> boundary-wall plaster surface. Warm sandstone tone, primary colour
> #7a6b5c with cooler highlights of #c4a575 where the raking light hits
> the raised profile. The texture is bold and deep — visible irregular
> stone-shaped lumps and depressions, like rough hand-trowelled stone
> render. Each raised stone peak casts a small shadow to the right.

Drop file as: `images/textures/finish-cloud-stone-texture.jpg`

### 2.2. Cloud Concrete Finish
> ...polished raw-concrete look interior wall finish, primary colour
> #7d7e80 cool concrete grey, matte low-sheen surface with faint trowel
> pass marks visible across the surface in long horizontal directions.
> Subtle mottled tonal variation suggesting real concrete (lighter and
> darker patches), but the surface is overall smooth — no relief, no
> aggregate, no roughness. Modern industrial calm.

Drop file as: `images/textures/finish-cloud-concrete-finish.jpg`

### 2.3. Cloud Velvet Texture
> ...soft velvet-sheen interior accent finish on an interior wall.
> Deep moody plum, primary colour #6b5e7a. The surface shows a fine
> low-relief brush pattern — long parallel strokes running vertically
> — visible only because the raking light catches the texture and
> creates a subtle directional sheen across the wall. The velvet-like
> appearance shifts from darker plum to lighter highlights along the
> brush direction. Premium, luxurious.

Drop file as: `images/textures/finish-cloud-velvet-texture.jpg`

### 2.4. Cloud Metallic Illusion
> ...brushed-metal effect interior wall finish. Warm gold-bronze
> metallic, primary colour #9a7b3f with highlights of #e0c787. The
> surface shows visible directional trowel arcs of real metallic
> particles suspended in the paint — they catch the light and glint
> in a sweeping curved pattern across the wall, like brushed brass or
> polished bronze applied with a wide trowel. Premium hotel-grade
> shimmer finish.

Drop file as: `images/textures/finish-cloud-metallic-illusion.jpg`

### 2.5. Cloud Venetian Marble
> ...polished Venetian marble plaster interior finish, applied in
> thin layered passes and burnished to a high-polish glass-smooth
> surface. Soft cream base colour #d4c4a8 with subtle warm grey
> veining #9b8765 flowing diagonally across the surface like real
> marble veins, the burnished sheen visible as a directional gloss.
> Premium luxury surface, hotel-lobby finish.

Drop file as: `images/textures/finish-cloud-venetian-marble.jpg`

### 2.6. Cloud Rustic Texture
> ...coarse hand-rendered earthy plaster finish on an interior wall.
> Warm terracotta primary colour #9b6b48 with slightly lighter
> highlights #c69372 across the raised areas. The surface shows
> irregular hand-applied trowel strokes — visibly imperfect,
> deliberately textured with sponge and trowel passes that leave
> coarse mottled relief across the wall. Artisan, restaurant-feature
> appearance.

Drop file as: `images/textures/finish-cloud-rustic-texture.jpg`

### 2.7. Cloud Sand Finish
> ...fine sand-grain interior wall texture. Soft warm sandstone
> primary colour #c4a47c with lighter highlights #dbc4a0. The surface
> is overall smooth but has a fine granular texture across it — like
> very fine sand particles embedded in the paint, visible as a
> subtle gritty surface character when raking light catches it. Light
> build, not deep relief — only a soft tactile sandy quality.

Drop file as: `images/textures/finish-cloud-sand-finish.jpg`

### 2.8. Cloud Desert Stone
> ...heavy-build Saharan exterior stone texture on a boundary wall.
> Warm tan primary colour #b58963 with lighter highlights #d7b58a.
> The surface shows a heavy 3 mm relief stone profile — deep
> tactile lumps and crevices, similar to weathered desert rock,
> hand-sculpted with a trowel. The raking light reveals strong shadow
> contrast between raised areas and recesses. Bold, architectural.

Drop file as: `images/textures/finish-cloud-desert-stone.jpg`

### 2.9. Cloud Luxury Stucco
> ...polished plaster interior finish, broader and softer than
> Venetian marble. Soft cloud-cream primary colour #ddc9b5 with
> warmer grey shadows #b09b85. The surface shows broad burnished
> trowel arcs sweeping across the wall in wide overlapping passes,
> creating soft cloud-like depth that shifts under the light. Final
> pass burnished to a satin sheen. Contemporary luxury residential
> finish.

Drop file as: `images/textures/finish-cloud-luxury-stucco.jpg`

### 2.10. Cloud RockShield Exterior Texture
> ...heavy-duty exterior rock texture with weather-shield top coat.
> Cool grey-green primary colour #5e605e with lighter highlights
> #8b8f8b. The surface shows a heavy commercial-grade stone profile —
> deep tactile lumps as in Cloud Stone Texture but with a visibly
> sealed top-coat sheen that reads as protective. Tougher, more
> regimented stone pattern than the residential Cloud Stone Texture.
> Commercial-building façade.

Drop file as: `images/textures/finish-cloud-rockshield-exterior.jpg`

---

# SECTION 3 — Hero bucket transparent PNGs (missing)

The hero slideshow uses transparent-background bucket PNGs that overlay
on the backdrop. Several products are currently using **placeholder
buckets** (mockup-b / mockup-c / weatherguard reused). Generate proper
buckets for these:

### 3.1. Vinyl Matt 4L bucket
> Photorealistic 4-litre Cloud Paints "Vinyl Matt" plastic paint
> bucket, viewed three-quarter angle from slightly above, transparent
> background (PNG). The label is white-cream with the Cloud Paints
> wordmark across the front in deep navy #1D1E51 and red #e11f29.
> Product name "VINYL MATT" in dark bold letters. The bucket lid is
> matte cream. The plastic body has a subtle matte sheen. A soft
> realistic shadow falls below the bucket. Studio lighting, no
> environment. (square 1:1)

Drop file as: `images/buckets/hero/vinyl-matt.png` (saved as transparent PNG)

### 3.2. Iris Plastic Emulsion 4L bucket
> Photorealistic 4-litre Cloud Paints "Iris Plastic Emulsion" plastic
> paint bucket, three-quarter angle from slightly above, transparent
> background (PNG). White-cream label with Cloud Paints wordmark in
> navy + red, product name "IRIS" in elegant serif. The lid is matte
> cream. Soft shadow below. Studio lighting. (1:1)

Drop file as: `images/buckets/hero/iris-emulsion.png`

### 3.3. Roof Paint 4L bucket
> Photorealistic 4-litre Cloud Paints "Roof Paint" plastic bucket,
> three-quarter angle, transparent background. Label shows the Cloud
> Paints wordmark, product name "ROOF PAINT" prominently, with a
> tiled-roof icon detail. Deep red colour swatch panel suggesting the
> product is a red/oxide roof paint. Lid is matte cream. Soft shadow.
> (1:1)

Drop file as: `images/buckets/hero/roof-paint.png`

### 3.4. Metal Primer 4L bucket
> Photorealistic 4-litre Cloud Paints "Metal Primer" plastic bucket,
> three-quarter angle, transparent background. Label shows the Cloud
> Paints wordmark, product name "METAL PRIMER" prominently, with
> grey-blue tones suggesting metal protection. A small "RUST
> PROTECTION" callout sub-label. Soft shadow. (1:1)

Drop file as: `images/buckets/hero/metal-primer.png`

### 3.5. SuperMatt 4L bucket (replaces mockup-b placeholder)
> Photorealistic 4-litre Cloud Paints "SuperMatt" wall primer/sealer
> bucket, three-quarter angle, transparent background. White-cream
> label, Cloud Paints wordmark, product name "SUPERMATT" with a
> sub-label "Wall Primer / Sealer". Lid matte cream. Soft shadow. (1:1)

Drop file as: `images/buckets/hero/supermatt.png`

---

# SECTION 4 — Discover article heroes

The two long-form articles currently reuse inspiration photos. Replace
with dedicated article heroes:

### 4.1. "4 Signs It's Time to Call in the Experts"
> A wide architectural before-and-after split-frame photograph of a
> single Kenyan living-room wall. Left half of the frame shows the
> wall in its failed state: visibly peeling paint, hairline cracks
> running across the cream surface, a faded patch from sun exposure,
> bubbling near the skirting from moisture. Right half of the same
> wall after professional repainting: clean, smooth, fresh cream
> finish with no defects, soft sidelight catching the new finish.
> The dividing line down the centre is hard and editorial — not a
> blur, an architectural cut. Atmospheric morning light. (16:10)

Drop file as: `images/discover/signs-to-call-experts.jpg`

### 4.2. "Dual Protection Technology Paints"
> Architectural close-up of an exterior Kenyan home wall finished in
> Cloud Paints Weatherguard, photographed during heavy rain. The
> paint surface is visibly repelling water — large beads of rainwater
> sit on top of the paint and run down in clean streams without
> soaking into the surface. The wall colour is warm cream. The
> background is soft-focus blurred rain and lush wet foliage. Cool
> overcast light. The water beading on the wall is the visual
> subject — show clear water droplets on a cream-painted exterior
> wall. (16:10)

Drop file as: `images/discover/dual-protection-tech.jpg`

---

# SECTION 5 — Factory, Our Story, About

The Our Story section on the homepage and the About page would feel
more rooted with purpose-shot company photography.

### 5.1. Factory floor — manufacturing
> Wide interior view of a clean modern paint manufacturing facility
> in Industrial Area, Nairobi. Stainless steel mixing tanks lined up
> in the foreground, rows of stacked 20L Cloud Paints buckets in the
> background, warm overhead industrial lighting. Polished concrete
> floor. The space reads premium and well-run — not crowded, not
> dusty. No people. The Cloud Paints brand should be subtly visible
> on stacked buckets but no readable logos required. (16:10)

Drop file as: `images/showroom/factory-floor-new.jpg`

### 5.2. Tinting station
> Close-up of a Cloud Paints retail tinting station. A 4L white-cream
> bucket sits beneath a precision tinting machine; visible coloured
> tints in glass dispensers above. The machine is mid-mix —
> mechanical pump arms in clean motion. Warm spot light on the bucket
> from above. No people. Reads "we mix exact colour to order". (3:2)

Drop file as: `images/showroom/tinting-station.jpg`

### 5.3. KEBS Quality Mark certification
> Editorial product still life. A single 4L Cloud Paints bucket on a
> clean white surface, with a small KEBS standardization mark "S"
> badge visible on the upper-front of the label. Soft top-down
> lighting, slight golden warm side fill. The S-mark area is in
> sharp focus and slightly emphasised. Background is uncluttered
> light cream. Reads "officially certified". (4:3)

Drop file as: `images/showroom/kebs-certified-product.jpg`

---

# SECTION 6 — NEW HOMEPAGE SECTION: "Painted Walls of Kenya"

A new horizontal strip section has been added to the homepage between
Why Cloud Paints and Featured Products. It shows **8 close-up
photographs of real Kenyan walls finished in Cloud Paints quick-pick
colours**. Each image should be a tight crop showing primarily the
painted wall surface, with just enough room context (a corner of
furniture, a slice of skirting, a glimpse of frame) to ground it.

**Shared prompt prefix:**

> Close-up architectural detail of an interior or exterior wall in a
> Kenyan home, painted in the specified Cloud Paints shade, captured
> at a 50 mm lens at f/4 with a slight side light raking across the
> surface to show finish texture. A small slice of room context
> (skirting board, plant stem, side of furniture, fragment of frame)
> intrudes at one edge for grounding, but **the painted wall surface
> dominates 70-80% of the frame**. No people, no text. Photo-real.
> (Portrait 3:4)

### 6.1. Rift Cobalt navy
> ...wall painted deep navy #1D1E51 in matte interior finish. A
> single brass picture-light or a corner of a linen sofa intrudes at
> the bottom-right. Soft late-morning light from the left.

Drop file as: `images/walls/wall-rift-cobalt.jpg`

### 6.2. Kilifi Clay terracotta
> ...wall painted warm terracotta #b25a44 in matte finish. The corner
> of a Kenyan jacaranda branch or a dried pampas reed in a clay vase
> intrudes at the right edge. Late afternoon warm sidelight.

Drop file as: `images/walls/wall-kilifi-clay.jpg`

### 6.3. Savanna Gold ochre
> ...wall painted warm Savanna gold #c4870a in matte finish. The
> corner of a rattan chair or a folded linen throw intrudes at the
> bottom. Late afternoon light.

Drop file as: `images/walls/wall-savanna-gold.jpg`

### 6.4. Aberdare Forest green
> ...wall painted deep forest green #2f5d40 in matte finish. A single
> monstera leaf or fern frond intrudes at the right edge. Cool
> overcast daylight.

Drop file as: `images/walls/wall-aberdare-forest.jpg`

### 6.5. Coastal Mist soft blue
> ...wall painted soft coastal blue #8eb8c4 in matte finish. The
> corner of a white linen curtain blown softly intrudes at the left.
> Bright morning coastal light.

Drop file as: `images/walls/wall-coastal-mist.jpg`

### 6.6. Mt Kenya Snow warm white
> ...wall painted warm off-white #f1ece1 in matte finish. A small
> wooden side table corner or a vintage brass wall sconce intrudes
> at the top-right. Soft natural daylight.

Drop file as: `images/walls/wall-mt-kenya-snow.jpg`

### 6.7. Acacia Honey amber
> ...wall painted warm amber-honey #d4a93b in matte finish. The
> corner of a rust velvet pillow or a clay pot intrudes at the
> bottom-right. Late afternoon warm light.

Drop file as: `images/walls/wall-acacia-honey.jpg`

### 6.8. Sunset Rust deep terracotta
> ...wall painted deep rust #963318 in matte finish. The corner of a
> kikoi throw or a wooden frame intrudes at the bottom-left. Golden
> hour sidelight.

Drop file as: `images/walls/wall-sunset-rust.jpg`

---

# SECTION 7 — NEW: Texture Swatch Ribbon on /textures.html

A new horizontal ribbon has been added to the top of the Textures
showcase page, between the hero and the family sections. It will
display the **same 10 swatch shots from Section 2** but cropped at a
different aspect ratio for the ribbon strip.

**If Section 2 swatches are already 1:1 square**, the website code will
re-crop them automatically for the ribbon — no extra generation
required. Just save the Section 2 outputs at the filenames noted.

If you'd like dedicated wider swatches for the ribbon (optional, looks
even crisper):

> Same prompt as the matching Section 2 swatch, but at **3:2 landscape
> aspect ratio** instead of 1:1.

Drop files as: `images/textures/ribbon-{slug}.jpg` (10 files)

---

# SECTION 8 — Decorative brand assets

Useful for section dividers, hero accents, and the "splat"-style brand
decorations already used in some pages.

### 8.1. Hero paint splash on white
> A dramatic mid-air liquid paint splash photographed against a pure
> white seamless studio background. Three colour streams collide and
> burst outward — deep brand navy #1D1E51, brand red #e11f29 and
> warm gold #c4870a. The paint is glossy, viscous, with sharp
> droplets and trailing streaks suspended in motion. Cinematic
> backlit studio lighting. No people, no products, no text. Tight
> vertical composition. (2:3 portrait)

Drop file as: `images/splatter/hero-tri-splash.jpg`

### 8.2. Single navy paint drip
> A single thick stream of deep navy #1D1E51 glossy paint flowing
> downward against a pure white background, captured at the moment a
> droplet detaches at the bottom. High-contrast studio lighting. No
> text. (1:2 tall vertical)

Drop file as: `images/drips/navy-drip.png` (transparent PNG)

### 8.3. Single red paint stroke
> A single horizontal brushstroke of red #e11f29 glossy paint across
> a white background, painted with a wide flat brush — visible bristle
> marks at the trailing edge, slight texture, slight uneven build at
> the start and end. (3:1 wide)

Drop file as: `images/splatter/red-brushstroke.png`

---

# SECTION 9 — Filename reference map

Quick reference of every prompt above by destination filename, so you
can verify before sending images back.

```
images/inspiration/
  inspiration-gloss-enamel-trim.jpg          1A
  inspiration-varnished-handrail.jpg         1B

images/projects/
  road-marking-fresh.jpg                     1C

images/textures/
  finish-cloud-stone-texture.jpg             2.1
  finish-cloud-concrete-finish.jpg           2.2
  finish-cloud-velvet-texture.jpg            2.3
  finish-cloud-metallic-illusion.jpg         2.4
  finish-cloud-venetian-marble.jpg           2.5
  finish-cloud-rustic-texture.jpg            2.6
  finish-cloud-sand-finish.jpg               2.7
  finish-cloud-desert-stone.jpg              2.8
  finish-cloud-luxury-stucco.jpg             2.9
  finish-cloud-rockshield-exterior.jpg       2.10
  (optional) ribbon-{slug}.jpg               7 (10 files)

images/buckets/hero/
  vinyl-matt.png                             3.1
  iris-emulsion.png                          3.2
  roof-paint.png                             3.3
  metal-primer.png                           3.4
  supermatt.png                              3.5

images/discover/
  signs-to-call-experts.jpg                  4.1
  dual-protection-tech.jpg                   4.2

images/showroom/
  factory-floor-new.jpg                      5.1
  tinting-station.jpg                        5.2
  kebs-certified-product.jpg                 5.3

images/walls/                                (NEW FOLDER)
  wall-rift-cobalt.jpg                       6.1
  wall-kilifi-clay.jpg                       6.2
  wall-savanna-gold.jpg                      6.3
  wall-aberdare-forest.jpg                   6.4
  wall-coastal-mist.jpg                      6.5
  wall-mt-kenya-snow.jpg                     6.6
  wall-acacia-honey.jpg                      6.7
  wall-sunset-rust.jpg                       6.8

images/splatter/
  hero-tri-splash.jpg                        8.1
  red-brushstroke.png                        8.3

images/drips/
  navy-drip.png                              8.2
```

---

# Priority order

If generating in batches:

1. **Section 2** — Texture Collection close-ups (highest visibility on the
   showcase page; current photos are the most misaligned).
2. **Section 6** — Painted Walls of Kenya (new homepage section is
   already waiting for these).
3. **Section 1** — Hero slideshow corrections (Gloss Enamel, Clear
   Varnish, Road Marking).
4. **Section 4** — Discover article heroes.
5. **Section 3** — Missing hero buckets (Vinyl Matt, Iris, Roof, Metal
   Primer, SuperMatt).
6. **Section 5** — Factory + KEBS.
7. **Section 8** — Brand decorative assets.

When the images come back into the folder with the suggested filenames,
they will appear in the website automatically without any further code
changes — except the placeholder swatches in `images/walls/` and the
new texture ribbon, which the new sections will already be referencing.
