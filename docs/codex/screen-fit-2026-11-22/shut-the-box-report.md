# Shut the Box — screen fit and wooden table

November 22, 2026. Presentation changes are left in the working tree for Claude. No git writes, visible apps, headed browsers, local servers, port binding, downloads or installs were used. Browser checks used only `node tools/screen-fit/capture.mjs`, with its audio muting intact.

## What changed

Replaced the small tile strip and miniature dice tray with a responsive Three.js wooden box: rounded rails, a recessed felt bed, metal pivot rods and hardware, engraved flip tiles, ivory dice with rounded geometry and recessed pip shading, and contact shadows. Tiles visibly hinge forward when shut. Selection and coach recommendations mark the physical tile with a restrained brass strip.

Walnut/green is the default. **Table** in setup also offers Maple/blue and Ebony/burgundy. The `THEMES` object in `table.js` contains the material, palette and lighting choices, including shared finishes. The new `table` property is stored alongside the existing settings. Missing or unknown values resolve to Walnut. The existing `shutTheBox_settings`, `shutTheBox_stats` and `shutTheBox_championships` keys remain; stats and championship formats were not changed.

The phone rotates the box so the tile bank runs vertically, with actual HTML button targets projected over the physical tiles. The standard phone's twelve targets are at least 44 × 44 CSS pixels and do not overlap. Shorter available heights, including the safe-area fixture, use two banks of six. Double Box has two independent banks of nine; Traditional and Last Tile have nine tiles. Scores, whose turn, Roll/Best Move, Undo, How to Play, theme and sound controls remain available. Menu has the highest stacking order, including over help and celebrations.

The original rules, scoring, AI, difficulties, round counts, players, championship logic, strategy coach and timer remain in the page. Both human and AI roll functions still decide the logical result before calling the renderer. The animation simulates gravity, felt/wall impacts and die-to-die separation, then aligns the physical face to that decided result. The non-writable `window.__stbDebug()` returns copied logical values, measured mesh top faces, settle state, renderer, bank/tile counts, DPR, draw count and contact counts.

Speed mode and reduced motion show the same results immediately. Resize during a throw settles the already-decided result before refitting. WebGL creation failure or context loss reveals the working flat presentation. A captured context-loss test completed another real roll using that fallback.

## Before and after, by size

Studied all three approved look-development frames and the baseline play sheet. Inspected the resulting start, play and throw sheets, the three Table looks and the diagnostic sheets.

| Size | Before | After observed |
| --- | --- | --- |
| Phone 393 × 852 | Two narrow rows of tiny flat tiles, a small dice tray, much of the lower page empty. | Tall wooden box, a readable vertical twelve-tile bank, large felt area, and separate footer controls. Safe-area fixture switches to two banks of six. Gameplay does not scroll. Setup intentionally scrolls to retain all settings and 44px controls. |
| iPad landscape 1180 × 820 | Small central tile strip and dice tray, with most of the screen unused. Setup also scrolled. | Broad box and large individual numbered tiles; dice roll inside the felt tray. Setup fits without scrolling. Double Box's near bank uses a shallower angle so its labels remain readable. |
| iPad portrait 820 × 1180 | Thin strip across the top and miniature tray. | Tall felt-lined box fills the available play region, with all tiles and footer controls visible. Double Box has a second bank at the near edge. Setup fits. |
| Laptop 1440 × 900 | Compact play cluster high on an otherwise empty page. | Large landscape box, crisp engraved labels and roomy dice area. Four-player scores occupy a separate row below the turn chip. Setup fits. |

Capture-tool measurements for the `play` shot:

| Viewport | Baseline largest panel area | After largest panel/canvas area | After horizontal overflow | After page scroll |
| --- | ---: | ---: | ---: | ---: |
| Phone | 8.2% | 74.4% | 0px | 0px |
| iPad landscape | 3.4% | 78.2% | 0px | 0px |
| Laptop | 3.2% | 80.2% | 0px | 0px |
| iPad portrait | 3.4% | 84.2% | 0px | 0px |

These are the capture tool's largest painted-panel/canvas measurements, **not a measurement of the physical wood silhouette**. Final setup scroll is 436px on the phone and 0px at the other three sizes. Every primary capture reports zero horizontal overflow.

## Performance and dependencies

- Device pixel ratio capped at 2; renderer refits through `ResizeObserver` when viewport dimensions change.
- On-demand rendering: changes request a frame; only a throw or tile flip schedules subsequent frames. A settled-board fixture asserted that render count stayed unchanged for 500ms.
- Tab visibility cancels the pending frame and resets timing; the hidden fixture asserted no redraws while hidden and verified the result after resume.
- Dice motion and hinge flips use elapsed seconds. The existing celebration canvas now uses elapsed time, capped DPR and resize fitting too.
- One 1024px soft shadow map plus inexpensive contact-shadow planes. No physics library or external lighting assets.
- No Tailwind dependency existed here. Removed the remote Google Fonts startup links; system fonts now supply the UI. Three.js is local, copied byte-for-byte from the requested vendor source.
- Hover effects are guarded by `(hover: hover)`. Reduced-motion CSS suppresses transitions and decorative animation.

## Assets

All shipping textures are **1024 × 1024 JPEG**, generated with the built-in image model. Exact prompts and conversion details are in `games/shut-the-box-assets/README.md`.

| File | Bytes |
| --- | ---: |
| wood.jpg | 119,396 |
| felt.jpg | 331,898 |
| ivory.jpg | 20,786 |
| **Texture total** | **472,080** |
| **Entire asset directory, including vendor, code and README** | **1,196,086** |

The whole directory is below 4 MB. The vendor copy is 669,884 bytes and matches `games/lasers-3d/vendor/three.min.js` exactly. SHA-256: `170c6789f43217c96b3170f4b42fafe135de7f7cd48497a4218f9757ee1d49fa`.

## Verification and evidence

`node games/shut-the-box-assets/validate.mjs` passed:

- 153 dice orientation, collision and refresh-rate checks, including all six faces at 24 yaw angles and equivalent integration at 30/60/120 Hz.
- Four die-to-die separation cases, including coincident positions.
- Twelve original rule/scoring/AI functions and both roll-decision blocks match HEAD.

`node --check` passed for the edited inline game script, `table.js`, `physics.js` and `validate.mjs`. `git diff --check` is included in the final handoff check. No pre-existing Shut the Box validator was present. The untouched vendor emits its existing deprecated-UMD-build warning; it does not appear as a browser error.

Primary command:

```sh
node tools/screen-fit/capture.mjs --only shut-the-box --out output/screen-fit/shut-the-box-after
```

The final `tools/screen-fit/shots/shut-the-box.json` contains **start**, **play** and **throw**. Play starts a real game and rolls; it waits for actual settle state, asserts mesh/logical agreement, DPR cap, Menu hit testing, minimum tile target sizes, target separation, visible coach and idle rendering. Throw makes a legal move, rolls again and asserts that movement is still in progress.

Evidence locations:

- `output/screen-fit/shut-the-box-after/`: 12 required captures at all four sizes and `report.json`.
- `output/screen-fit/shut-the-box-looks/`: Walnut, Maple, Ebony, help and light UI at the tablet size, plus setup; six captures and `report.json`.
- `output/screen-fit/shut-the-box-after/checks/`: 40 variant/lifecycle captures at all four sizes. Traditional, Double Box, Last Tile, four players, safe areas, all six one-die speed results, hidden pause/resume, AI and context-loss fallback. The one-die case deliberately sets a known remaining-tile state and controls randomness; it is a diagnostic fixture, not an ordinary match.
- `output/screen-fit/shut-the-box-after/safe-light/`: 28 additional captures covering safe areas, light UI, four-player header separation, resize during a throw and reduced-motion preference handling, plus setup/play.

The four recorded reports contain **86 capture rows, zero step errors and zero browser errors**. Every row reports muted audio and zero horizontal overflow; every gameplay/fixture row reports zero page scroll. The final variant refresh includes the corrected header and help styles. `output/screen-fit/shut-the-box-after/artifacts.json` records file sizes and SHA-256 hashes for the authored files and generated evidence.

The reduced-motion fixture overrides the media-query getter to exercise the renderer's immediate-settle branch. The resize fixture narrows the canvas host during a throw. These are browser fixtures, not physical-device preference or rotation tests. The safe-area fixture uses 47px top and 34px bottom values through the same CSS variables that normally read `env(safe-area-inset-*)`.

Recipes for the additional runs are saved next to their output. To repeat an additional run, temporarily copy its recipe to `tools/screen-fit/shots/shut-the-box.json`, run the same capture tool with the appropriate output folder, then restore `output/screen-fit/shut-the-box-looks/main-recipe.json` to the shot file. The primary recipe is restored in the handoff.

The sandbox initially blocked Chromium's macOS Mach-port registration. The exact permitted headless capture command succeeded outside the sandbox. All capture contexts remained muted; no visible browser or alternate browser tool was used. Capture commands run in the foreground and close their browser in `finally`.

## Limits and differences from the frame

This is real-time shaded 3D using photographic material maps. It does **not** reproduce every photographic property of the reference: the camera is more overhead, the wood has less natural wear/variation, and cheap shadows and pip bump shading are less rich than the frame's lighting. The dice use a small bounded simulation and a final orientation blend, rather than a full rigid-body engine. These choices keep the board responsive and idle rendering stopped.

No physical iPhone/iPad/Safari, audible sound, thermal, battery or hardware 120Hz performance certification is claimed. The 120Hz evidence is the time-based simulation validator. Full tournament/statistics/celebration sequences were not replayed end to end in this visual pass; their original rule and persistence code remains intact. James's later visual judgment against the photographic frame remains pending.

## Files changed

- `games/shut-the-box.html`
- `games/shut-the-box-assets/table.css`
- `games/shut-the-box-assets/table.js`
- `games/shut-the-box-assets/physics.js`
- `games/shut-the-box-assets/validate.mjs`
- `games/shut-the-box-assets/README.md`
- `games/shut-the-box-assets/wood.jpg`
- `games/shut-the-box-assets/felt.jpg`
- `games/shut-the-box-assets/ivory.jpg`
- `games/shut-the-box-assets/vendor/three.min.js`
- `tools/screen-fit/shots/shut-the-box.json`
- `docs/codex/screen-fit-2026-11-22/shut-the-box-report.md`
- Generated captures, contact sheets, reports, recipes and artifact manifest under `output/screen-fit/shut-the-box-after/` and `output/screen-fit/shut-the-box-looks/`.

## Round 2 — small polish

November 22, 2026, following committed checkpoint `41135cf`. Only the three requested polish items were changed; no git writes.

1. **Maple plinth:** changed Maple's edge/base stain from orange-brown `#b38957` to neutral pale maple `#dfd2bc`. The plinth now reads as the same wood with a slightly darker stain. Inspected Maple beside Walnut and Ebony at phone and tablet sizes; the latter themes' material values are unchanged.
2. **Dice stay in the felt:** the shared rolling bounds now reserve the complete folded tile length, the die's full tumbling radius and a small clearance. Both tile banks are protected. The same bounds constrain animated throws, instant rolls, restored poses and final settling; the outer-rail inset is larger too. Added copied die positions and felt bounds to the read-only debug output, and capture assertions check containment during movement and after settling. The captured phone landing leaves the shut tiles exposed, and settled mesh faces still match the logical dice.
3. **Phone setup:** compact player grids and one segmented variant row reduce vertical space. Full variant names remain accessible through button labels; the phone shows compact visual labels. Start Game is at the top of the setup card and is fully visible without scrolling. The measured default phone setup scroll is **201px**, down from **436px** and below the old **308px**. In-shot assertions passed for setup text at least **14px** and button/input targets at least **44 × 44px**. All other requested viewport sizes retain zero setup scroll.

Validation:

- `node games/shut-the-box-assets/validate.mjs` passed: the existing 153 orientation/collision/refresh-rate checks and four separation cases, plus **15 new felt-corridor trajectories** covering shallow/deep trays, one/two tile banks and 30/60/120Hz integration.
- Preserved the validator's **`origin/main`** comparison (and existing `STB_BASE` override). Twelve rule/scoring/AI functions and both roll-decision blocks still match that reference.
- `node --check` passed for `table.js`, `physics.js`, `validate.mjs` and the inline game script. `git diff --check` passed.
- **16 silent captures** at all four sizes: start, play, mid-throw and the new settled landing shot. Zero step/browser errors, zero horizontal overflow, and zero gameplay page scroll.
- **10 further silent captures** at phone/tablet sizes: setup, Walnut, Maple, Ebony and Double Box. All in-shot checks passed, including two-bank dice containment and logical/mesh agreement. Every capture reports muted audio.

Evidence: `output/screen-fit/shut-the-box-round-2-after/` and its `looks/` subfolder, each with `report.json` and contact sheets. The extra look recipe is saved alongside its captures; the primary start/play/throw/landing recipe is restored in `tools/screen-fit/shots/shut-the-box.json`. Captures used the same previously approved muted headless tool outside the macOS sandbox; no visible window or server was opened. All capture commands completed and closed their browser. No new textures or vendor changes; physical-device limits from Round 1 remain.

Round 2 files changed:

- `games/shut-the-box.html`
- `games/shut-the-box-assets/table.css`
- `games/shut-the-box-assets/table.js`
- `games/shut-the-box-assets/physics.js`
- `games/shut-the-box-assets/validate.mjs`
- `tools/screen-fit/shots/shut-the-box.json`
- `docs/codex/screen-fit-2026-11-22/shut-the-box-report.md`
- Generated captures, reports and recipes under `output/screen-fit/shut-the-box-round-2-after/`.

## Round 3 — rolling hint and phone Start visibility

Following committed checkpoint `6c23535`. No app, window, browser or capture command was started. No git writes.

**Rolling hint:** `updateSelectionInfo()` previously checked the logical phase and AI player, but did not independently check whether a dice presentation was still pending. The human `rolling` flag is not used by `aiRoll()`. The shared `animateThrow()` entry point now clears the hint and holds a presentation-only `diceInFlight` flag for the existing animation promise, including AI, one-die, speed-mode and fallback paths. Hint and coach rendering refuse to display selection instructions during that interval. Unavailable/nonpositive totals also leave the hint empty. The existing human selection prompt is restored by `afterRoll()` once the animation finishes; AI turns retain no human tap instructions.

Removed the legacy 350ms fade/scale animation from the playing total badge, so its numeral is immediately visible when the settled hint appears. The tile-close pipeline still clears its Closing message on returning to the roll phase. No delays or gameplay transitions were added: source comparison against `6c23535` confirmed that the original animation body (now named `animateDicePresentation`), `rollDice`, `afterRoll`, `aiRoll` and `autoConfirmSelection` are unchanged.

**Phone setup:** Start Game is already first visually in the phone setup card through `.setup-box > .start-btn { order: -1; }`. The Round 2 capture recorded it fully visible without scrolling; its **201px** page scroll belongs to the remaining settings and help. The existing start-shot assertion already requires Start Game's complete rectangle inside the viewport, along with setup text at least 14px and button/input targets at least 44 × 44px. Retained this layout and these assertions. No new phone measurement or claim that the entire settings page fits was made in this round.

Validation:

- `node games/shut-the-box-assets/validate.mjs` passed, preserving the **`origin/main`** rules comparison and existing numerical checks.
- New Node-only regressions execute the page's actual roll, hint, animation-wrapper and close functions with controlled renderer promises and timers. Four human/AI one/two-die paths verify clearing old hints, suppressing delayed selection refreshes while a throw is pending, showing the correct settled human total, and keeping AI hints empty. They also check invalid totals and the real tile-close → roll → settled-selection handoff. The in-flight assertion failed before the presentation guard was added, then passed after the fix.
- `node --check` passed for the inline game script, `validate.mjs` and `validate-hints.mjs`; `git diff --check` passed.
- Added future capture assertions for an empty hint/no badge during the throw and the correct visible total after settling. **These browser assertions have not been run in Round 3; Claude will run the capture.**

Round 3 files changed:

- `games/shut-the-box.html`
- `games/shut-the-box-assets/table.css`
- `games/shut-the-box-assets/validate-hints.mjs`
- `games/shut-the-box-assets/validate.mjs`
- `tools/screen-fit/shots/shut-the-box.json`
- `docs/codex/screen-fit-2026-11-22/shut-the-box-report.md`
