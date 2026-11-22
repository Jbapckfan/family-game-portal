# Shut the Box local presentation assets

Three original material images were generated with the built-in image model on November 22, 2026. Each output was 1254 × 1254 PNG; the shipping copies are 1024 × 1024 JPEG, resized and encoded with the already installed FFmpeg (`-vf scale=1024:1024 -q:v 3`). No runtime network fetches, downloaded image libraries or remote lighting maps are used.

The neutral maple and felt images are tinted by the **single `THEMES` object in table.js** to make Walnut/green, Maple/blue and Ebony/burgundy. That object also owns the engraving, hardware, dice, UI palette, material roughness and lighting. Dice pips and engraved text are composed onto local images on in-memory canvases. The dice geometry has rounded edges; the pip maps include recessed bevel/bump shading.

## Exact image prompts

### wood.jpg

> Use case: game-texture. Create one square 1024x1024 photorealistic seamless PBR albedo texture of fine straight-grained oiled maple hardwood, light warm neutral honey tan, subtle natural grain pores and delicate long grain running vertically. This will be tinted walnut and ebony in a real-time wooden Shut the Box game. Uniform sharp focus and completely flat diffuse even light with NO highlights, NO shadows, NO vignette, NO objects, NO seams, NO text or border. Fine realistic grain, not exaggerated dark stripes. Fill entire image edge-to-edge with one continuous surface. Save image asset to the current project if possible.

### felt.jpg

> Use case: game-texture. Asset type: 1024x1024 square seamless albedo texture for a close-up photorealistic wool felt-lined dice tray. One continuous neutral light grey wool felt surface, very fine tight dense matted fibers and subtle flecks, realistic material macro photograph. Color will be multiplied by deep green, blue and burgundy in the renderer, so keep the base neutral grey. Completely flat even diffuse lighting, NO shadows, NO highlights, NO vignette, NO objects, NO dice, NO text, NO border, no visible seam. Consistent micro scale across entire frame, not fluffy fur or carpet. Edge-to-edge texture only.

### ivory.jpg

> Use case: game-texture. One square 1024x1024 photorealistic seamless albedo material texture, close-up polished ivory dice resin. Barely perceptible fine cream resin grain, extremely subtle warm marbling and microscopic pores, almost uniform off-white with tiny natural imperfections, satin smooth surface. This is an unmarked dice material, pips will be modeled by the game. Completely flat even diffuse illumination. No pips, no dots, no objects, no cubes, no edges, no text, no shadow, no vignette or reflection, no frame. Edge-to-edge continuous micro texture. Ivory should be light cream and very smooth, not yellow, not coarse paper or stone.

## Code and vendor

- `table.js`: presentation only: demand renderer, responsive physical box, projected HTML tile controls, hinges, dice throw, lighting and debug output.
- `physics.js`: face orientation and time-based bounded contact simulation. Logical results always come from the game's existing roll functions.
- `table.css`: responsive screen composition and warm table UI, plus the 2D fallback styles.
- `vendor/three.min.js`: copied byte-for-byte from `games/lasers-3d/vendor/three.min.js`; its original MIT license header is retained.
- `validate.mjs`: orientation, contact and refresh-rate invariants plus rule/scoring/AI preservation against origin/main (override with STB_BASE). Run `node games/shut-the-box-assets/validate.mjs`.

The unmodified vendor prints its existing deprecated-UMD-build warning. It remains local as requested.
