# Lasers 3D — Visual Direction

## A. Art direction

Present the game as a precision optics workbench discovered in a dark family game room: the sibling game’s deep navy radial field, neon cyan beam language, hot-pink emitter accents, and clean system typography remain recognizable, but the board becomes a tactile miniature made from smoked glass, brushed gunmetal, beveled acrylic, and glowing filaments. The FLAT view must look deliberately graphic and deceptively two-dimensional—an uninterrupted blue floor divided only by thin cell outlines—while tilting transforms the same board into a warmly lit physical diorama with tall voxel sides, soft shadows, reflective panels, recessed hardware, and obvious elevation. Avoid fantasy scenery, toy-block primary colors, cyberpunk clutter, and generic glossy mobile-game plastic; every detail should suggest a real optical instrument scaled into a child-friendly tabletop puzzle.

## B. Palette

All colors are sRGB. Use these values without hue substitutions.

| Token | Hex | Use |
|---|---:|---|
| `background` | `#050817` | Outer viewport and darkest radial-gradient stop |
| `floor` | `#172544` | Board floor in both views |
| `block-top-flat` | `#172544` | Terrain tops in FLAT; deliberately identical to `floor` |
| `block-top-lit` | `#2B4777` | Terrain tops at full tilt |
| `block-side` | `#0B1530` | Vertical terrain faces |
| `grid-outline` | `#334766` | Thin outline around every cell, raised or not |
| `mirror` | `#45E7FF` | MIRROR edge filament and tray label |
| `wedge` | `#FFC857` | WEDGE edge filament and tray label |
| `dip` | `#FF4FA3` | DIP edge filament and tray label |
| `emitter` | `#FF2F92` | Emitter coil, FIRE control, source halo |
| `target-unlit` | `#6D7896` | Dormant target orb and socket |
| `target-lit` | `#78FFD8` | Energized target orb |
| `beam-level-0` | `#2CB5A8` | Lowest-altitude beam |
| `beam-level-1` | `#39D4C2` | Altitude 1 beam |
| `beam-level-2` | `#64EFDA` | Altitude 2 beam |
| `beam-level-3` | `#C4FFF5` | Highest and brightest beam |
| `ui-text` | `#F4F8FF` | Primary UI text |
| `ui-accent` | `#00FFCC` | Selected controls, focus, progress |
| `danger` | `#FF5C70` | Blocked beam, invalid placement, destructive actions |
| `success` | `#69F0AE` | Solved state and completed levels |

Supporting colors:

| Token | Value |
|---|---:|
| `background-radial-mid` | `#101A50` |
| `background-radial-light` | `#243F90` |
| `panel-fill` | `rgba(12, 20, 52, 0.78)` |
| `panel-border` | `rgba(183, 226, 255, 0.22)` |
| `metal-light` | `#A8C0CE` |
| `metal-mid` | `#7893A6` |
| `metal-dark` | `#243647` |
| `common-flat-piece` | `#B7CEDB` |
| `star` | `#FFD75A` |
| `star-empty` | `#65718E` |

The page background is:

```css
background:
  radial-gradient(circle at 20% 78%, rgba(0, 255, 204, 0.07), transparent 45%),
  radial-gradient(circle at 82% 20%, rgba(255, 47, 146, 0.07), transparent 42%),
  radial-gradient(circle at 50% 38%, #243F90 0%, #101A50 47%, #050817 100%);
```

## C. Materials

Use `THREE.SRGBColorSpace`, `THREE.ACESFilmicToneMapping`, and `toneMappingExposure = 1.05`. One grid cell equals one world unit; one altitude level also equals one world unit so pitched beam segments appear at a true 45 degrees.

| Surface | Material | Color | Metalness | Roughness | Emissive | Intensity | Opacity | Additional parameters |
|---|---|---:|---:|---:|---:|---:|---:|---|
| Floor | `MeshPhysicalMaterial` | `floor` | `0.15` | `0.78` | `#050817` | `0.08` | `1.00` | Clearcoat `0.12`, clearcoat roughness `0.75` |
| Block top, lit | `MeshPhysicalMaterial` | `block-top-lit` | `0.22` | `0.56` | `#08152B` | `0.10` | `1.00` | Clearcoat `0.20`, clearcoat roughness `0.62` |
| Block side | `MeshStandardMaterial` | `block-side` | `0.38` | `0.48` | `#000000` | `0.00` | `1.00` | Receives shadows |
| Piece housing | `MeshPhysicalMaterial` | `metal-mid` | `0.82` | `0.27` | `#06131C` | `0.05` | `1.00` | Clearcoat `0.55`, clearcoat roughness `0.30` |
| Common FLAT piece glyph | `MeshBasicMaterial` | `common-flat-piece` | — | — | — | — | `1.00` | Tone mapping disabled |
| MIRROR face | `MeshPhysicalMaterial` | `mirror` | `0.28` | `0.08` | `#0D7C8A` | `0.42` | `0.84` | Transmission `0.48`, IOR `1.46`, clearcoat `1.00`, double-sided |
| WEDGE face | `MeshPhysicalMaterial` | `wedge` | `0.46` | `0.19` | `#6B3C00` | `0.34` | `0.94` | Clearcoat `0.90`, double-sided |
| DIP face | `MeshPhysicalMaterial` | `dip` | `0.42` | `0.22` | `#67123D` | `0.38` | `0.94` | Clearcoat `0.85`, double-sided |
| Emitter body | `MeshPhysicalMaterial` | `metal-light` | `0.88` | `0.22` | `#140715` | `0.05` | `1.00` | Clearcoat `0.60` |
| Emitter filament | `MeshStandardMaterial` | `emitter` | `0.05` | `0.25` | `emitter` | `4.80` | `1.00` | Add a transparent additive halo |
| Target orb, unlit | `MeshPhysicalMaterial` | `target-unlit` | `0.00` | `0.16` | `#18213C` | `0.25` | `0.58` | Transmission `0.52`, IOR `1.42`, clearcoat `1.00` |
| Target orb, lit | `MeshPhysicalMaterial` | `target-lit` | `0.05` | `0.10` | `target-lit` | `5.50` | `0.82` | Transmission `0.25`, IOR `1.42`, clearcoat `1.00` |
| Beam core | `MeshStandardMaterial` | Per altitude | `0.00` | `0.30` | Same as color | Per Section G | `1.00` | Tone-mapped emissive |
| Beam glow | `MeshBasicMaterial` | Per altitude | — | — | — | — | Per Section G | Transparent, additive blending, depth write off |

Generate the brushed-metal grain locally with a `64 × 2` `CanvasTexture`: alternating one-pixel vertical bands of `metal-light` and `metal-mid` at no more than 8% luminance contrast, repeated 12 times across each housing. Do not load texture files.

Terrain construction:

- Each cell top is a `0.96 × 0.96` square centered on the integer cell coordinate.
- Terrain sides extend from world `z = 0` to `z = t`.
- Place the top surface at `z = t`.
- Draw the same `0.012`-world-unit grid strips around every cell, including floor cells. The outline follows the cell’s actual top but projects to the same square in FLAT.
- Do not add special rims, bevel highlights, decals, different grain, or color variations to raised terrain tops.

Piece construction:

- Every piece uses the same `0.72 × 0.72 × 0.10` chamfered square housing.
- At exactly FLAT, hide all physical face meshes and show one common top glyph: a `0.64 × 0.085` diagonal strip centered in the housing. Rotate this strip only between `/` and `\`.
- Fixed and player-placed pieces use the same common glyph color in FLAT. Piece identity must not be encoded by color, width, animation, highlight, or shadow on the board.
- MIRROR’s tilted model is a vertical `0.66 × 0.66` glass panel rising from the diagonal slot, from `z + 0.12` to `z + 0.78`.
- WEDGE’s tilted model is a broad reflective face whose low edge is at `z + 0.12` and high edge at `z + 0.78`, forming an upward 45-degree ramp across the diagonal housing.
- DIP uses the inverse face: its near lip begins at `z + 0.78` and slopes down to a recessed edge at `z + 0.12`.
- Give each tilted face a `0.025`-unit emissive edge filament in its assigned accent color. The accent becomes visible only as the physical model is revealed.
- Tray icons always display the physical model at 35-degree elevation and include the colored label, so MIRROR, WEDGE, and DIP remain identifiable before placement.

Flat terrain uniformity is non-negotiable. Implement the floor and terrain top shaders with a shared `uReveal` uniform. After normal PBR shading is calculated, mix the fragment output with the exact unlit flat color:

```glsl
finalColor = mix(vec4(0.0902, 0.1451, 0.2667, 1.0), pbrColor, uReveal);
```

The RGB value above is `#172544`. At `uReveal = 0`, disable shadows, ambient occlusion, specular response, procedural grain, and all top-face variation. `block-top-flat` and `floor` must therefore produce identical pixels except where the universal grid outline crosses them.

## D. Light rig

### FLAT

- Orthographic elevation: exactly `90deg`.
- All terrain and floor tops resolve through the unlit side of the material blend.
- Directional, hemisphere, and rim-light intensities are multiplied by zero.
- Disable shadow-map rendering.
- Keep only emissive gameplay objects visible: emitter filament, beam, target state, and the common piece glyph.
- Do not use screen-space ambient occlusion, fog, a vignette over the board, or contact shadows.

### TILTED

| Light | Color | Position or direction | Full intensity | Shadows |
|---|---:|---|---:|---|
| Hemisphere | Sky `#B7EEFF`, ground `#071020` | World up | `0.75` | No |
| Key directional | `#D8F7FF` | Position `(-5, -7, 10)` aimed at board center | `2.80` | Yes |
| Pink rim directional | `#FF4FA3` | Position `(6, 4, 5)` aimed at board center | `0.55` | No |
| Cyan fill point | `#45E7FF` | Position `(-3, 5, 3)` | `7.00`, distance `16`, decay `2` | No |
| Ambient | `#152B50` | Global | `0.18` | No |

Use `PCFSoftShadowMap`. The key-light shadow map is `2048 × 2048` on devices with device memory above 4 GB and `1024 × 1024` otherwise. Its orthographic shadow camera must fit the board plus one cell. Use bias `-0.0004`, normal bias `0.025`.

Derive the reveal blend from camera elevation `e` in degrees:

```js
const q = THREE.MathUtils.clamp((90 - e - 2) / 32, 0, 1);
const reveal = q * q * (3 - 2 * q);
```

Apply `reveal` as follows:

- `uReveal = reveal` for floor and terrain-top shading.
- Multiply all tilted-view light intensities by `reveal`.
- Physical piece opacity is `reveal`; common FLAT glyph opacity is `1 - reveal`.
- Vertical sides use opacity `reveal` until `reveal = 0.35`, then remain fully opaque.
- Key shadow opacity is `smoothstep(0.25, 0.65, reveal)`.
- Enable shadow-map updates only once `reveal > 0.15`.
- At elevations from `90deg` through `88deg`, the board remains a perfect flat lie. Full physical rendering is reached by `56deg`.

## E. Camera presets

| Preset | Azimuth | Elevation | Framing |
|---|---:|---:|---|
| FLAT | `0deg`, north at screen top | `90deg` | Projected board bounds plus `0.65` cell on every side |
| TILT | `-45deg` | `35deg` | Project all board corners at heights `0` and `4`, then add `1.10` cells of padding |

Use an orthographic camera only. Fit with a contain calculation: compute the zoom needed for both the available width and height and select the smaller zoom. The available rectangle is the stage area between the HUD and tray, after safe-area insets. Preserve the board center during transitions.

Camera motion:

- FLAT to TILT: `720ms`.
- TILT to FLAT: `620ms`.
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)`.
- Interpolate the camera on a spherical orbit around the board center; do not linearly interpolate Cartesian position.
- Manual orbit range: elevation `25–90deg`; azimuth unrestricted.
- Pinch zoom range: `0.82–1.35` times the preset fit.
- `prefers-reduced-motion: reduce`: use `140ms` linear transitions and omit overshoot, particles, and camera holds longer than `500ms`.

First-failure reveal for Levels 4 and 5:

1. Finish the failed beam trace and display its end cap and altitude badge.
2. Hold for `280ms`.
3. Animate from FLAT to the TILT preset over `900ms`.
4. Over the same interval, reveal sides, physical piece faces, shadows, and lighting through the elevation blend.
5. Hold at TILT for `1300ms`; pulse the newly revealed relevant block or sloped face once with a `500ms` cyan outline.
6. Animate back to FLAT over `650ms`.
7. Restore player input and leave the failed beam visible.

The automatic reveal does not consume the blind-solve star eligibility. Run it once per applicable level, not once per attempt.

## F. UI

Use only this system font stack:

```css
--font-ui: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
--font-data: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
```

Core custom properties:

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-pill: 999px;

  --type-xs: 11px;
  --type-sm: 13px;
  --type-md: 15px;
  --type-lg: 18px;
  --type-xl: 24px;
  --type-2xl: 32px;

  --line-tight: 1.15;
  --line-body: 1.45;

  --color-bg: #050817;
  --color-floor: #172544;
  --color-text: #F4F8FF;
  --color-text-muted: #A9B5CE;
  --color-accent: #00FFCC;
  --color-emitter: #FF2F92;
  --color-danger: #FF5C70;
  --color-success: #69F0AE;
  --color-panel: rgba(12, 20, 52, 0.78);
  --color-panel-strong: rgba(8, 14, 38, 0.94);
  --color-panel-border: rgba(183, 226, 255, 0.22);

  --touch-min: 44px;
  --shadow-panel:
    0 12px 32px rgba(0, 0, 0, 0.38),
    inset 0 1px 0 rgba(255, 255, 255, 0.13);
  --shadow-raised:
    0 6px 16px rgba(0, 0, 0, 0.32),
    inset 0 1px 0 rgba(255, 255, 255, 0.16);
  --shadow-focus: 0 0 0 3px rgba(0, 255, 204, 0.42);
  --shadow-cyan-glow: 0 0 18px rgba(0, 255, 204, 0.30);
  --shadow-pink-glow: 0 0 18px rgba(255, 47, 146, 0.34);
}
```

Panels use `backdrop-filter: blur(18px) saturate(145%)`, the panel shadow, and a one-pixel border. The fallback without backdrop-filter is `#0C1434` at full opacity. Use a static diagonal highlight in the upper-left corner; do not run a perpetual shimmer animation.

### HUD

- Keep the portal Menu link fixed at top-left, at least `64 × 44px`, with `z-index: 9999`.
- Center the HUD at the top inside safe-area insets. On screens below `600px`, set `left: 76px`, `right: 68px`, and `min-height: 52px`.
- First line: level number in `13px/600`, level name in `18px/700`.
- Second line: earned stars at left, `PIECES used/par` in `11px/700` monospace at right.
- Put a `48 × 44px` sound button at top-right.
- HUD `z-index: 100`; no game overlay may use a value of `9999` or greater.

### Tray

- Position bottom-center above `env(safe-area-inset-bottom)`, with `12px` padding and an `8px` gap.
- Each piece card is `72 × 72px`; never shrink below `64 × 64px`.
- The upper `44px` contains the physical 35-degree miniature. The lower line contains the uppercase label at `11px/800` and the count in `11px` monospace.
- MIRROR uses `mirror`, WEDGE uses `wedge`, and DIP uses `dip` for its label, top accent strip, and selected glow.
- Selected cards have a `2px` accent border, `translateY(-3px)`, and a `0 0 18px` glow at 35% opacity.
- A zero-count card remains visible at `0.38` opacity and is non-interactive.
- FIRE is a `72 × 56px` button using the emitter color. TILT, RESET, and HINT are at least `56 × 44px`.
- At widths below `390px`, put the piece cards on the first row and FIRE/TILT/RESET/HINT on a second horizontally scrollable row. Do not reduce touch targets.

### Buttons

- Default: panel fill, one-pixel `rgba(255,255,255,0.20)` border, `15px/700` text, `12px` radius.
- Primary/FIRE: `rgba(255,47,146,0.18)` background, `emitter` border and text, pink glow.
- Selected/TILT-active: `rgba(0,255,204,0.16)` background, `ui-accent` border and text.
- Fine-pointer hover only: `translateY(-1px)` and increase the relevant glow opacity to 45%.
- Active: `translateY(1px) scale(0.97)` for `90ms`.
- Keyboard focus: `outline: none; box-shadow: var(--shadow-focus), var(--shadow-raised)`.
- Disabled: opacity `0.38`, no glow, no transform.
- Invalid placement: two `70ms` horizontal movements of `4px`, danger border for `400ms`.
- Apply hover rules only inside `@media (hover: hover) and (pointer: fine)` to prevent sticky touch states.
- Every button, card, close control, level tile, and floating rotate/delete control must have both dimensions at least `44px`.

### Modal and level select

- Backdrop: `rgba(2,5,17,0.74)`, `z-index: 900`.
- Modal: `z-index: 910`, width `min(520px, calc(100vw - 32px))`, maximum height `calc(100dvh - 32px)`, `24px` padding, `16px` radius, strong panel fill.
- Close button: `44 × 44px`, top-right.
- Heading: `24px/750`; body: `15px/1.45`; captions: `13px/1.45`.
- How-to-play diagrams use the actual rendered piece icons and beam colors, never emoji.
- Level select uses a grid of `repeat(auto-fit, minmax(64px, 1fr))`, with `8px` gaps.
- Level tiles are at least `64 × 64px`. Completed tiles use a cyan top edge; current tile has a `2px` cyan border; locked tiles use `star-empty`, 45% opacity, and a small metal padlock.

### Stars and victory

Stars are five-point inline SVGs, `24 × 24px`, with a `1.5px` stroke. Earned stars use a vertical gradient from `#FFF1A6` to `#FFD75A`, stroke `#FFE28A`, and `0 0 8px rgba(255,215,90,0.45)`. Empty stars use `#0B1330` fill and `star-empty` stroke. The third, blind-solve star has a centered `4px` cyan glass dot so its special condition is recognizable without changing the outer silhouette.

The victory modal rises `12px` and fades in over `360ms`. Show “Beam Connected” at `28px/800`, then award stars one at a time at `0ms`, `180ms`, and `360ms`. Each earned star scales from `0.72` to `1.12` to `1.00`. Behind them, send one cyan light ring across the modal; do not use confetti. The primary Next Level control uses `success`; Replay and Levels are neutral glass buttons.

## G. Beam rendering

Draw the beam centerline exactly from cell center to cell center at world height `z + 0.5`. Use merged six-sided tube geometry for the core and a second merged transparent tube for glow. Rebuild both after every trace.

| Altitude | Color | Core diameter | Glow diameter | Core emissive intensity | Glow opacity |
|---:|---:|---:|---:|---:|---:|
| `0` | `beam-level-0` | `0.055` cell | `0.150` cell | `2.0` | `0.16` |
| `1` | `beam-level-1` | `0.072` cell | `0.195` cell | `3.0` | `0.21` |
| `2` | `beam-level-2` | `0.092` cell | `0.250` cell | `4.5` | `0.28` |
| `3` | `beam-level-3` | `0.118` cell | `0.315` cell | `6.5` | `0.36` |

This width-and-luminance ramp must remain active in both views. Do not normalize widths in screen space. The widening is the fair altitude tell in FLAT and must survive at the minimum 34px cell size.

Additional beam rules:

- Add a white-hot inner filament at 35% of the core diameter and `65%` opacity for levels 2 and 3 only.
- Use `AdditiveBlending`, `depthTest: true`, and `depthWrite: false` for glow so terrain still occludes the beam correctly.
- During FIRE, reveal the beam at `5.5` cells per second with delta-time-based interpolation. A live retrace after editing uses `140ms`.
- Place a screen-facing altitude badge at every pitch change and at the final endpoint after FIRE. The badge reads `Z0`, `Z1`, `Z2`, or `Z3`.
- Badges are `28 × 22px`, pill-shaped, use `11px/800` `--font-data`, have the corresponding beam color as a two-pixel border, `#071020` at 88% opacity as fill, and a four-pixel matching glow.
- Offset badges `10px` above the projected beam point so they do not cover the filament.

End states:

- **Blocked:** stop at the cell boundary. Add a solid octagonal `danger` cap perpendicular to the beam, diameter `0.18` cell, plus three `0.08`-cell sparks that fade over `260ms`.
- **Lost at edge:** taper the final `0.22` cell of beam to zero and place a hollow `danger` ring at the exit point, diameter `0.20` cell with `0.025`-cell stroke.
- **Lost into floor:** use the same ring laid flat on the floor, with one downward triangular notch.
- **Lost into sky:** use a screen-facing ring with one upward triangular notch.
- **Loop:** use a `wedge`-colored double ring rotating once over `500ms`.
- **Target hit:** change the orb to its lit material over `160ms`; expand two target-lit rings from `0.18` to `0.75` cell over `420ms`; emit eight short glass-like radial streaks; then hold a soft halo at `0.42` cell diameter and `22%` opacity.
- For multiple targets, each orb performs its burst when reached. Play the victory treatment only after the final required target lights.

## H. Thumbnail image-generation prompt

```text
Create a polished 640x397 landscape thumbnail for a premium kids-and-family 3D browser puzzle game. Show one miniature square laser puzzle board during its dramatic hidden-height reveal, divided compositionally on a clean diagonal: the left half is a perfectly flat orthographic top-down view where every terrain-block top is exactly the same deep slate-blue as the floor, height is completely invisible, and only thin blue-gray square cell outlines can be seen; the right half is the same board tilted to a 35-degree isometric view, revealing stepped voxel terrain with dark navy sides, soft shadows, beveled edges, and tactile physical depth. A hot-pink brushed-metal laser emitter sends a glowing cyan beam across the board. At the center, the beam strikes a square metal-housed WEDGE with a gold reflective face; the face is visibly tilted upward in the tilted half and the beam turns ninety degrees while climbing one altitude level at a true 45-degree slope. End the beam in a glowing mint glass target orb on a raised plateau. Materials are smoked glass, brushed gunmetal, beveled acrylic, and glowing filament. Background is a deep navy radial gradient with restrained cyan and pink ambient bloom, matching an elegant neon optics game. Crisp readable silhouettes, child-friendly but sophisticated, high-end game key art, physically based lighting on the tilted half, graphic unlit clarity on the flat half. No people, no characters, no text, no letters, no logo, no UI buttons, no watermark, no fantasy scenery, no primary-color toy blocks, no generic mobile-game plastic. Exact aspect ratio 640:397.
```
