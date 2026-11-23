# Looks pass — 2048, Lights Out, Spelling Bee

2026-11-22. Implemented on `codex/rough-games-2026-11-22`; changes left for Claude to review and commit. Read `shared.md`, `common.md`, `polish.md` and the existing do-not-repeat guidance. No app/window/browser, browser capture, server, git write, installation or external asset download. Original texture generation used the built-in image-generation tool as requested.

## 2048

Inspected `output/screen-fit/final/2048/sheet-play.png` at all four sizes. The low-value navy tiles blend into the dark board, particularly on phone. The existing enlarged board/layout is retained.

Added a value-based physical material ladder to the default `neon` skin: ivory 2s, sand 4s, amber 8s, apricot, copper, bronze, brass and gold as values increase, then deep green enamel with gold numerals for 2048 and larger values. Included the Fibonacci/Threes low/intermediate values and a distinct slate obstacle treatment. Added beveled glaze, edge highlights, contact shadows and a restrained static glow on 2048/4096/8192. Large values without an explicit palette retain the enamel fallback.

The default skin now uses the **existing** ebony board image through its original URL; `PegJumper-assets/ebony-board-r3.jpg` was neither copied nor modified. Classic Wood and Candy keep their existing color derivation and runtime text-contrast helper, with the same physical edge treatment. No theme names, defaults, option values or storage keys changed. The only JSX change is `data-value={tile.value}` on the tile face, for CSS selection. Slide, merge, spawn and input-lock timing remain byte-for-byte unchanged; no new merge animation.

The new 2048 shot file uses 24 ordinary directional key presses, separated by 180ms so they clear the existing 100ms input lock/160ms merge indication. This replaces the old rapid sequence that showed little progression. Further shots select Candy and Classic Wood through the existing theme control and check the resulting board theme attribute. No tiles, scores or records are fabricated. Exact tile values after those moves depend on the game's existing random spawning.

After appearance is **unverified**. Claude should inspect all four sizes, the default 2/4/8 progression, larger copper/gold/enamel values, both alternate skins, obstacles and long numeric labels. In particular check that glaze does not wash out the numerals and that the ebony surface remains visible between the tiles.

## Lights Out

Inspected `output/screen-fit/final/LightsOut/sheet-play.png` at all four sizes. The bright cyan state is clear but reads as a flat filled square; the housing needs material detail.

Added an original fine brushed-metal housing texture, a machined edge and two small recessed fastener details. On buttons now have backlit glass, curved reflections, a bright lower indicator and light spill onto the housing. Off buttons have dark smoked-glass gradients, a visible rim and an unlit indicator. The state distinction relies on brightness and glow, not hue alone. All four existing theme colors still drive the on glass and spill through `--lo-primary`; theme locks, selection, logic, levels, hints and ripple timing are unchanged.

The existing gameplay shot already shows a real move and mixed on/off cells, so no Lights Out shot override was needed. No dimensions, grid sizing or tap-target rules were changed. Effects are static paint layers with the existing interaction transitions; no idle animation or new frame loop.

After appearance is **unverified**. Claude should inspect the on/off distinction at phone size, light spill between adjacent keys, hints/focus/ripples and all available themes. Check that off keys remain readable as buttons and that reflections do not make them look illuminated.

## Spelling Bee

Inspected `output/screen-fit/final/SpellingBee/sheet-play.png` at all four sizes. The flat purple hexagons dominate an otherwise dark panel; they do not resemble wax cells.

Replaced the letter-cell surfaces with pale wax floors, thick highlighted wax rims and recessed inner edges. The required center letter has a richer honey/amber material and dark crisp lettering. An original photographed-style beeswax texture supplies fine pores and crystalline grain; an ivory wash keeps the outer cells pale. The play panel has a warm surface with subtle grain and lighting. Dark/light page themes still work; the light play panel uses lighter warm tones and darker label colors. Kept the existing controls, their geometry and wording, word list and modes. The practice-mode center remains an outer-style cell, following its existing class logic.

No script edits at all: letter positions, shuffle transforms, press feedback, Delete/Shuffle/Enter/Hint handlers, scoring, vocabulary, modes and saved data are unchanged. Added a light-theme shot using the real theme-toggle button after the existing two-letter play shot.

After appearance is **unverified**. Claude should inspect wax-rim depth and texture at phone/tablet/laptop sizes, both themes, typed center-letter emphasis, practice, shuffle and the action buttons. Check the pseudo-elements stay behind letters and do not interfere with taps. Fine-tune the rim/shadow only after seeing those captures.

## Generated assets

Both images are original, opaque, 768×768 JPEGs. Generated with built-in `image_gen`, then resized/encoded locally using `sips -Z 768 -s format jpeg -s formatOptions 82`. Personally inspected both delivered JPEGs: subdued directional metal grain; pale natural wax grain without letters, logos or baked-in hexagons. Each is below the 300KB target and 600KB hard cap. No image was duplicated under another name.

| Asset | Exact bytes | Prompt |
| --- | ---: | --- |
| `games/mini-games/LightsOut-assets/brushed-metal.jpg` | 88,751 | `brushed-metal.prompt.txt` beside it |
| `games/mini-games/SpellingBee-assets/beeswax.jpg` | 103,356 | `beeswax.prompt.txt` beside it |

The metal prompt requests a straight-overhead, continuous dark anodized-aluminum texture, fine horizontal machining grain, restrained scratches and even lighting, without hardware, lettering or logos. The wax prompt requests a straight-overhead macro material with natural pores and crystalline satin grain, without bees, drips, cells, symbols or lettering. Full exact prompts are saved in the adjacent `.prompt.txt` files. 2048 adds no raster image; it references the existing ebony asset in place.

## Checks run

- **Strict source-preservation guard passed for all three HTML files.** Removing only the new local stylesheet link and, for 2048, the new `data-value` attribute exactly reproduces each starting file's SHA-256. Thus all prior inline CSS/layout/fit code, gameplay, timing, controls, records and data survive unchanged. Original `<script>` tags, React/Babel URLs and Google Fonts links are unchanged. The ebony asset's SHA-256 still matches the starting value.
- **11 inline script blocks passed `node --check`.** The three existing JSX blocks were first transpiled in memory using the already-installed TypeScript 5.9.3 compiler; the other eight were checked directly. This is offline syntax validation, not a new shipped dependency, browser execution or gameplay test.
- Three new CSS files have balanced delimiters and all referenced local assets exist. Existing sizing/fit logic is unchanged. `git diff --check` on the owned paths passed.
- The two shot JSON files parse and their embedded evaluation expressions compile. Actual shot execution is pending Claude's captures. The base Lights Out shots in `games.json` were not edited.
- **2048 static color calculation:** 12 material palettes, including fallback/obstacle, checked against all three opaque gradient endpoints; minimum numeral contrast **4.628:1**. Edge-only glaze/shadow excluded. Alternate skins retain the existing contrast helper.
- **Spelling Bee texture calculation:** locally decoded all **589,824** JPEG pixels, evaluated each distinct RGB sample against both wax-floor gradient endpoints using the CSS normal/multiply blends. Minimum dark-letter contrast: **10.374:1 outer**, **4.846:1 center**. Selected panel text/background endpoints have a minimum of **4.774:1**. These are material-color calculations; they exclude the brightening reflection and edge-only shadow and do **not** certify rendered pixels or every pre-existing UI label. The calculation found weak center/light-emphasis colors during the pass; those were darkened and rechecked.
- **Lights Out state brightness calculation:** existing theme on-base colors against the brightest off-glass gradient endpoint give luminance ratios **5.644 cyan, 5.853 green, 6.110 amber, 3.860 purple**. This is an on/off brightness comparison, not a text-contrast or color-blind user-test claim; glass reflections and edge shadows are excluded.
- Evidence is saved in `2048-assets/source-baseline.json`, `2048-assets/verification.json` and each game's `contrast-checks.json`. No dedicated validator for these three games is named in the brief or was found among the mini-game validator files. No unrelated game validator was run.

No after capture was attempted, as instructed. **Rendered polish, no-overflow behavior after the new paint layers, theme interactions, Menu-over-overlay hit testing and physical-iPad smoothness remain pending Claude's verification.** No process started by this work remains running.

## Files changed

- `games/mini-games/2048.html`
- `games/mini-games/LightsOut.html`
- `games/mini-games/SpellingBee.html`
- `games/mini-games/2048-assets/materials.css`
- `games/mini-games/2048-assets/source-baseline.json`
- `games/mini-games/2048-assets/verification.json`
- `games/mini-games/2048-assets/contrast-checks.json`
- `games/mini-games/LightsOut-assets/materials.css`
- `games/mini-games/LightsOut-assets/brushed-metal.jpg`
- `games/mini-games/LightsOut-assets/brushed-metal.prompt.txt`
- `games/mini-games/LightsOut-assets/contrast-checks.json`
- `games/mini-games/SpellingBee-assets/materials.css`
- `games/mini-games/SpellingBee-assets/beeswax.jpg`
- `games/mini-games/SpellingBee-assets/beeswax.prompt.txt`
- `games/mini-games/SpellingBee-assets/contrast-checks.json`
- `tools/screen-fit/shots/2048.json`
- `tools/screen-fit/shots/SpellingBee.json`
- `docs/codex/rough-games-2026-11-22/looks-2048-lights-bee-report.md`
