# Portal card art from current captured games

November 22, 2026. Replaced **20 of the 21 image-based portal thumbnails** using only real frames from Claude's `output/screen-fit/final2/` capture. Velocity Marble Run is unchanged, including its image bytes and complete image tag. The 11 CSS-based word-game/ERS/Speed/Socktopus cards are outside this image-only pass and were left untouched.

No app, window, browser, server or portal capture was started. No git writes, downloads, image generation or game changes. `index.html` changed only the refreshed images' `src`/`alt` attributes. `sw.js` changed only through the requested generated precache rebuild.

## Source and crop record

`card-art-sources.json` next to this report contains each refreshed card's exact source PNG path, source dimensions and SHA-256, crop box in source pixels (`x`, `y`, `width`, `height`), output path, alt text, JPEG quality, processing filter, byte size and output SHA-256. Velocity is explicitly listed as an unchanged exclusion with no source frame/crop.

All 20 use one frame apiece: 19 play shots and Shut the Box's settled landing shot. No gameplay pieces, scores, text, logos or interface elements were added, moved or composited. Processing is limited to an exact 16:9 crop, Lanczos resize to 800 × 450, light luma sharpening and JPEG encoding. Existing UI visible in a crop belongs to the captured game itself.

Selection highlights:

- Shut the Box now shows the real walnut tray, green felt, folded tiles and settled dice; Cube Jumper shows its actual airborne purple cube, spike, orb and city scene. Both SVG image references became JPG references.
- Close-ups emphasize Reflex Riot's stick character, the Snake/apple, Code Breaker's pegs, Connect Four's played discs, Spelling Bee's honeycomb and the Dots 3D lattice.
- Zoo Conquest and Tower Defense retain their real populated map/towers; Particle Conquest retains both colored fleets. Snowman Siege uses its captured snowy forest, target and reticle.
- Reviewed 2048's candy and wood variants as well as its play sheet; chose the colorful default play frame. Memory Match honestly shows the closed paw-print card backs present in the capture, rather than inventing exposed pairs.
- Lasers 3D uses the bright portrait play frame around the connected beam turn; the wide play frames have a dim completion overlay. Its card does not invent a different camera pose or puzzle.

Inspected every replacement JPEG directly and adjusted crops to avoid stray cut-off interface fragments where possible. Portal rendering at four sizes is left to Claude; no browser review is claimed.

## Dimensions and sizes

All 20 replacements are **800 × 450**, unique by SHA-256, and below **120,000 bytes** (largest: **117,007 bytes**). Combined replacement size: **973,755 bytes**. Velocity retains its existing 640 × 397 image because it was explicitly excluded.

| Image file | Dimensions | Bytes |
| --- | --- | ---: |
| `games/reflex-riot-thumb.jpg` | 800 × 450 | 24,900 |
| `games/zoo-conquest-thumb.jpg` | 800 × 450 | 117,007 |
| `games/particle-conquest-thumb.jpg` | 800 × 450 | 36,302 |
| `games/tower-defense-thumb.jpg` | 800 × 450 | 103,036 |
| `games/velocity-marble-run-thumb.jpg` | 640 × 397 (unchanged) | 33,504 |
| `games/dots-and-boxes-3d-thumb.jpg` | 800 × 450 | 33,704 |
| `games/snowman-siege-thumb.jpg` | 800 × 450 | 45,940 |
| `games/shut-the-box-thumb.jpg` | 800 × 450 | 46,150 |
| `games/cube-jumper-thumb.jpg` | 800 × 450 | 48,221 |
| `games/2DTicTacToe-thumb.jpg` | 800 × 450 | 46,753 |
| `games/CodeBreakerV4-thumb.jpg` | 800 × 450 | 54,931 |
| `games/lasers-3d-thumb.jpg` | 800 × 450 | 22,659 |
| `games/lasers_mirrors-thumb.jpg` | 800 × 450 | 33,199 |
| `games/LightsOut-thumb.jpg` | 800 × 450 | 48,452 |
| `games/PegJumper-thumb.jpg` | 800 × 450 | 44,412 |
| `games/SpellingBee-thumb.jpg` | 800 × 450 | 32,048 |
| `games/2048-thumb.jpg` | 800 × 450 | 46,190 |
| `games/ConnectFour-thumb.jpg` | 800 × 450 | 47,743 |
| `games/Snake-thumb.jpg` | 800 × 450 | 35,290 |
| `games/Minesweeper-thumb.jpg` | 800 × 450 | 57,169 |
| `games/MemoryMatch-thumb.jpg` | 800 × 450 | 49,649 |

Every active `<img class="game-thumb">` source exists. All 21 active image files, including Velocity, have different bytes. The unused Shut the Box and Cube Jumper SVG files remain on disk; neither is referenced by the portal or included in the rebuilt precache.

## Offline checks

- `node tools/offline/build-precache.mjs`: passed; regenerated only the marked precache block.
- `node tools/offline/build-precache.mjs --check`: passed, block current.
- New precache: **423 files, 23,551,005 bytes**, version **`95626b48ea476b8fdf72472f`**.
- Budget: below **25,000,000 bytes** by **1,448,995 bytes**.
- Cache membership adds `games/shut-the-box-thumb.jpg` and `games/cube-jumper-thumb.jpg`, and removes their old `.svg` URLs. Same-name JPEG replacements are included with their new content in the cache version hash.
- `node --test tools/offline/test/*.test.mjs`: **20 passed, zero failed/skipped**.
- Source/provenance audit: image dimensions and bytes verified with `ffprobe`/filesystem reads; crop bounds and 16:9 ratios checked; output/source hashes match the JSON; all alt text matches its source record. Velocity's bytes and image tag match HEAD.
- Scoped `git diff --check`: passed. No non-image portal markup or service-worker logic changed. Offline tools and tests were not edited.

## Files changed

- `index.html` — refreshed image alt text; two SVG-to-JPG source replacements.
- The 20 refreshed JPEG files listed above (all except Velocity Marble Run).
- `sw.js` — generated precache version/list only.
- `docs/codex/rough-games-2026-11-22/card-art-sources.json`.
- `docs/codex/rough-games-2026-11-22/card-art-report.md`.

## Round 2 — three card revisions

- **Particle Conquest:** now uses `final2/particle-conquest/phone-play.png`. Cropped the dense planet field at `(4,344,384,288)`, excluding the HUD and buttons. Both complete player planets, their YOU/AI labels and the cyan fleet cannot fit in a direct 384×216 crop, so the allowed reframing uses plain dark side margins (64px each on a 512×288 canvas), then resizes to 800×450. Planet positions and circular proportions are unchanged; no gameplay was added.
- **Reflex Riot:** now uses `final2/reflex-riot/laptop-start.png`, crop `(16,108,1408,792)`, showing the complete large REFLEX RIOT! logo and mode buttons.
- **Lasers 3D:** restored the exact `HEAD:games/lasers-3d-thumb.jpg` bytes and previous alt text, **“Lasers 3D”**. Source commit: `6a9f7c72071c718fc1f15c83405c4f646a034d0c`; SHA-256: `7edb6b61884a685027412a002a3c6e9048bde2530721af6040cd885eba20e9cf`. The source record is explicitly `restored_earlier_image`, with no capture path or crop. Its original 640×397 dimensions are retained as required by exact restoration.

These rows supersede the corresponding Round 1 entries:

| Image | Dimensions | New bytes |
| --- | --- | ---: |
| `games/particle-conquest-thumb.jpg` | 800 × 450 | 33,920 |
| `games/reflex-riot-thumb.jpg` | 800 × 450 | 57,476 |
| `games/lasers-3d-thumb.jpg` | 640 × 397, exact earlier image | 83,682 |

Updated source/crop/processing records and alt text in `card-art-sources.json` and `index.html`. The other 17 refreshed images and Velocity Marble Run are byte-for-byte unchanged from Round 1. All 21 active card files exist, are unique and remain below 120,000 bytes. The revised JPEGs were inspected directly; no app, window, browser or portal capture was started. No git writes.

Rebuilt and checked precache: **423 files / 23,642,224 bytes**, version **`b6a920ef26f1fe64f39f6ed8`**, below the 25,000,000-byte limit. `node --test tools/offline/test/*.test.mjs`: **20 passed, zero failed/skipped**. Scoped `git diff --check` passed. Lasers' image bytes and alt text were separately checked against HEAD for exact equality.
