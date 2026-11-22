# Batch large — screen fit and polish

2026-11-22. Source changes are ready for Claude's visual review. **After screenshots and real browser gameplay remain unverified.** No git writes, installs, downloads, headed browsers, apps, servers, ports or iOS builds were used. Other batches and `games.json` were left alone.

## Evidence and verification boundary

I inspected all three supplied `sheet-start.png` baseline contact sheets, covering phone 393×852, iPad landscape 1180×820, iPad portrait 820×1180 and laptop 1440×900. Those sheets show starting states; they do not establish gameplay or frame-rate performance.

The one permitted capture attempt was:

```sh
node tools/screen-fit/capture.mjs --out output/screen-fit/large-after --batch large
```

It exited 1 before any page opened. Chromium reported `bootstrap_check_in ... Permission denied (1100)` and exited with SIGTRAP. It was not retried. `output/screen-fit/large-after/capture-attempt.log` preserves the error. There are no after PNGs or measured after fill/overflow values to report. The proposed layouts below are source changes, not observed after results.

Each game has an independent shot file with `start` first and `play` second. Socktopus starts a mission and deploys into two lanes. Reflex Riot uses a deterministic random value during the opening, catches a falling stick through an actual tap, restores randomness and asserts a positive score. Lasers 3D chooses a tray mirror, sends a board tap to its projected cell, asserts placement and fires. These shot sequences still need their first successful browser run; assertions deliberately fail if gameplay was not reached.

## Socktopus

Preserved the purple laundry fantasy, character sheets, campaign, counter system, co-op, powers, difficulty and authored missions.

Changes:

- Replaced the capped shell and phone's short fixed-ratio battle strip with a viewport-height grid: header, status, flexible battlefield, controls. The shell uses the full available width and safe-area padding.
- Reworked the setup into story/mission and configuration sections. Wide screens use two columns; portrait iPad uses a broad stacked composition with a two-column mission header. Battle mode and player setup share a row on larger screens. Phone setup remains an explicitly scrollable panel, with readable options rather than the old tiny labels.
- The battlefield adapts to its rectangle. Narrow layouts recompose three carpet lanes using proportional crops of the existing background, with proportional drawer/washer crops. Characters and base labels receive a uniform local scale instead of inheriting the canvas's unequal horizontal/vertical scaling. World coordinates, lane picking, movement distances and combat calculations remain intact. This is responsive scene composition, not a stretched screenshot.
- Retained the character identity and added a cached background layer rebuilt only for size/asset readiness changes. HUD markup is reused when unchanged, and battle HUD refreshes are limited to one per 0.1 seconds. This cadence is a code setting, not a measured performance result.
- Menu is now a labeled, fixed top-left link above every overlay. Main controls and setup navigation have at least 44px minimum targets in CSS. The compact phone header also shows the wave/timer. Help, sound and voice controls remain present.
- Hover styling is gated behind `(hover: hover)`; keyboard focus remains visible. Reduced motion also suppresses character idle bobbing. The capped DPR 2 backing canvas and ResizeObserver remain. Hiding the document cancels the frame loop; returning schedules one loop and preserves the existing manual pause/resume behavior.

| Size | Before: observed in baseline | After: pending capture review |
|---|---|---|
| Phone | Setup fills most of the page, with very small options; the home control is hidden behind the full-screen overlay. | Check Menu above setup, setup scroll to Start, readable options, full-height portrait lanes and all solo/co-op play controls without page scroll. |
| iPad landscape | Battlefield is substantial, but setup is constrained inside it; its lower configuration and Start controls are clipped from the initial view. | Check both setup columns fit without needing tablet setup scrolling; inspect the larger battlefield, sprite proportions and card labels. |
| iPad portrait | Setup is visible but its controls and secondary labels are small relative to the display. | Check the broad mission header, configuration spacing, expanded battlefield lanes and seven-card co-op layout. |
| Laptop | Capped shell leaves side margins; setup bottom is clipped inside the battlefield. | Check the full-width scene, complete two-column setup, proportional art, readable role labels and no overlap with Menu. |

No service worker or runtime Tailwind dependency exists in this game. No asset files were changed. Portrait crop composition is the principal visual risk and must be reviewed before claiming this game is finished.

## Reflex Riot

Kept the loud yellow/pink/cyan arcade identity and the existing full-viewport gameplay canvas.

Changes:

- Replaced the fixed-width menu stack with a large two-column arcade composition on landscape tablets/laptops: title/record information at left, a framed action panel at right. Portrait layouts use a broader single stack with viewport-based title sizing and larger controls. The phone composition remains compact enough to reserve space for the portal and sound controls.
- Broadened help/results/settings panels; help uses four columns on wide screens and two in portrait. Setup toggles, records controls and the inline sound button have at least 44px targets. The inline sound indicator is now a keyboard-operable button with its current state announced.
- Changed the existing EXIT link to Menu, fixed it above all screens, and retained it for disk-served checks. Safe-area spacing, focus outlines, hover-only feedback and reduced-motion styling are explicit.
- Stopped JavaScript frames and CSS background motion while hidden. Existing game deadlines, including reaction/hold timestamps, shift over the hidden interval so background time is excluded. Countdown completion while hidden also leaves the new round paused until return.
- Particle shrink now uses elapsed time rather than applying the same shrink once per frame. Background gradients are reused across frames. Target/effect positions retain their normalized location on resize; the existing DPR cap remains 2. Resize handling also listens to visual viewport changes.
- Reduced motion suppresses decorative particles, background drift/grid travel and camera shake; gameplay cue movement and scoring remain intact.
- Bumped the service-worker cache to `reflex-riot-v4-screen-fit`. All six existing precache paths exist and still cover the actual runtime files. Activation now removes only older Reflex Riot caches, preserving other games' caches on the shared origin. Manifest and icon are unchanged.

| Size | Before: observed in baseline | After: pending capture review |
|---|---|---|
| Phone | Most menu controls fit; the menu is a single centered stack. | Check every menu button and sound/Menu control is reachable; then verify HUD, mode label and falling sticks during play. |
| iPad landscape | A narrow menu stack leaves broad empty sides. | Check the two-column title/action composition, complete action panel, help panel and unclipped labels. |
| iPad portrait | The stack occupies a small central portion of the tall page. | Check the larger title and broad action panel fit vertically with both safe-area control corners clear. |
| Laptop | The same narrow stack leaves large side margins. | Check balanced title/action columns, large but sharp type, hover/focus states, and genuine gameplay in `sheet-play.png`. |

No runtime Tailwind or other CDN scripts were present or changed. Scoring constants, mode order, difficulty values and stored-data formats were retained. Browser resize/rotation while a target is active, all eight modes, reaction timing across backgrounding, and service-worker upgrade behavior still require real browser review. No FPS, hardware or listening claims are made.

## Lasers 3D

Read its current rules, visual/motion direction and the shared laser-board pitfall. **No game source, camera framing, puzzle, asset or iOS wrapper was changed.** Only a gameplay shot file was added.

| Size | Before: observed in baseline | Decision / after status |
|---|---|---|
| Phone | Board dominates the upper area, with a working-view crop and a compact lower control dock; Menu is visible. | Preserve deliberate minimum-cell working framing, pan and ALL overview. A cropped working board is not grounds to shrink every cell. Gameplay shot pending. |
| iPad landscape | Large board plus distinct right control rail; Menu and sound remain visible. | No demonstrated layout defect to justify changes. Gameplay shot pending. |
| iPad portrait | Large square board above a broad bottom dock. | Preserve this composition. Gameplay shot pending. |
| Laptop | Large board and a right control rail; controls fit the visible page. | Preserve this composition. Gameplay shot pending. |

The existing source already supplies an on-demand scheduler, background settling, stage resize handling and capped DPR. The one-floor, back-to-back Both Sides construction and its original flat opening remain untouched.

The iOS offline directory `ios/Lasers3D/Game` is absent in this checkout, so there is no bundled browser copy to compare. This pass did not change Lasers browser source or introduce a newer source version for that wrapper. No packaging or build was run.

## Validator results

- `node --check` passed for Reflex Riot `game.js` and `sw.js`, the extracted Socktopus inline script, and the source-only smoke harness.
- Source checks passed: HTML nesting/unique IDs for the two edited pages; balanced CSS blocks; six valid Reflex Riot precache entries; unchanged authored Socktopus rules/configuration and Reflex Riot difficulty/mode-order sections compared with HEAD. CSS block balance is not a browser CSS parse.
- `node output/screen-fit/large-after/source-smoke.mjs`: **9 source-only checks passed**. These use a Node VM with stub DOM/canvas APIs, covering single-loop hidden/resume behavior for both games, frozen solo/reaction deadlines, 60/120-update particle shrink equivalence, normalized resize/DPR behavior, reused Socktopus HUD markup, and cache cleanup isolation. They do not establish pixel layout, hit testing or browser performance.
- Requested `cd games/lasers-3d && node --test test/*.test.mjs`: **484 passed; 1 file failed** because `test/ui.dom.test.mjs` could not resolve the local `playwright` package. That file would launch WebKit and bind a server if its dependency were supplied, which conflicts with this batch's rules. It failed at import before either action. No dependency installation or retry of that file was attempted.
- The **11 browser-free test files**, run with Node's test runner and `ui.dom.test.mjs` excluded: **484 passed, 0 failed, 0 skipped**, exit 0.
- `cd games/lasers-3d && node validate-levels.mjs`: **31 levels OK**, exit 0.
- Scoped `git diff --check` passed. No game-rule, level-content or save-schema edit is intended; no full browser certification is claimed.

Logs and the rerunnable source-only harness are in `output/screen-fit/large-after/`. The capture process exited, both validator processes completed, and no task process was left running.

## Claude's next visual review

Run the permitted capture command outside the sandbox, then inspect every `sheet-start.png` and `sheet-play.png` at all four sizes. Prioritize Socktopus's portrait lane/background crops, proportional character art, complete tablet setup and co-op controls; Reflex Riot's portrait height, wide title fit, positive-score gameplay shot and help panels; Lasers' successful mirror placement and FIRE shot without changing its camera design. Check Menu above pause, help, collection, upgrade, result and settings overlays, and test orientation changes during play. After metrics and visual acceptance are still pending.

## Files changed

Product, shots and handoff:

- `games/socktopus/index.html`
- `games/socktopus/screen-fit.css`
- `games/reflex-riot/index.html`
- `games/reflex-riot/styles.css`
- `games/reflex-riot/game.js`
- `games/reflex-riot/sw.js`
- `tools/screen-fit/shots/socktopus.json`
- `tools/screen-fit/shots/reflex-riot.json`
- `tools/screen-fit/shots/lasers-3d.json`
- `docs/codex/screen-fit-2026-11-22/large-report.md`

Local evidence artifacts (not baseline changes):

- `output/screen-fit/large-after/capture-attempt.log`
- `output/screen-fit/large-after/lasers-tests.log`
- `output/screen-fit/large-after/lasers-unit-only.log`
- `output/screen-fit/large-after/lasers-levels.log`
- `output/screen-fit/large-after/source-checks.log`
- `output/screen-fit/large-after/source-smoke.mjs`
- `output/screen-fit/large-after/source-smoke.log`
- `output/screen-fit/large-after/socktopus-inline-check.js`

# Round 2 — Claude's captures, camera repair and visual polish

2026-11-22. I inspected all six `large-verify` contact sheets, the portrait iPad Reflex Riot start image, the phone Socktopus play image, and the generated portrait artwork at full size. The supplied capture report contains **24 rows, zero page/step errors, zero horizontal overflow and zero page scrolling**. These describe the version Claude captured before Round 2. **No browser or capture command was run in Round 2; the changes below still need Claude's next visual pass.**

## Lasers 3D

Fixed the automatic focus path rather than hiding the symptom in the shot. The old `render.focusCell` always centred the requested cell, and the free-pan clamp permitted much of the board to leave view. Automatic focus now has its own tested clamp:

- A non-zoom focus leaves a fitted, visible board exactly still. It does not latch manual framing or expose a spurious FIT control.
- A necessary pan targets the visible stage centre. The facade intersects the canvas and stage clipping rectangles, excluding the separate HUD/tray/side-panel grid areas.
- A fitted axis keeps both board edges visible. An oversized working axis stays within the board's extent, allowing the existing phone pan behavior without panning into empty space. Manual drag limits remain intact.
- Focusing does not change zoom; the real phone camera regression retains the 34 CSS px cell floor. Levels, simulation and solver files match HEAD byte-for-byte.

Added `test/camera-focus.test.mjs`: eight DOM-free checks using the actual vendored Three.js camera math. They cover no-op tutorial focus, visible-area centring, side/bottom space, oversized phone panning, repeated focus and real tablet/phone rigs. All eight failed on the missing bounded-focus implementation before the repair and passed afterwards. Logs: `round2-camera-red.log` and `round2-camera-green.log` in `output/screen-fit/large-after/`.

The gameplay shot now starts by choosing MIRROR in the actual tutorial, taps the solution cell, rotates it through another board tap when needed, verifies the route, presses FIRE and waits for the fired beam to finish. It makes **no explicit focus call**. On phone it then uses the actual ALL button to show the entire board; the opening still uses James's working zoom. A short shot settle avoids the subsequent victory dialog covering the completed beam. This sequence is syntax checked but has not been browser run.

Chrome polish: readable opaque HUD backing; 14px small labels, tray labels, tutorial, cursor description and level names; a full-width phone HUD below the two corner controls; a four-column phone action dock to recover vertical space; legible dashed disabled controls; matching short press transitions. The tutorial checks the actual tray position and says “on the right” or “below”; its wording updates through the existing viewport callback. The lesson itself and its placement focus remain unchanged. Existing finite win presentation and reduced-motion behavior are preserved.

Still to review: emitter/ring/edges after tutorial and keyboard focus at all sizes, completed-beam timing in the new shot, advanced multi-piece phone trays with the larger labels, and Both Sides/3D framing. I would adjust chrome spacing only if those captures show crowding. No puzzle or optical-art redesign is proposed. Browser source changed in this round, so the native wrapper needs packaging before it can include these fixes; `ios/Lasers3D/Game` is absent here and no iOS copy/build was produced.

## Socktopus

The HUD now reads **REVENGE OF THE** above **MISSING SOCK**. Phone unit cards use whole-word compact display labels (Sock, Hamster, Wizard, Troll, Bunnies), while full names/costs remain in accessible labels and in the larger layouts. The counter button shows the unit and “Not in loadout” as separate readable lines. Mid-word breaking is disabled.

Replaced the repeated purple strips and boxed lane-end crops with one continuous, generated portrait laundry room: three rugs, warm wooden drawers, cool washer castles, room lighting and contact shadows. The art was generated with the built-in image tool using the landscape room as a reference. The selected compressed asset is:

- `games/socktopus/assets/battlefield-portrait.jpg`: **1122×1402, 683,822 bytes**.
- Full prompt and method: `games/socktopus/assets/battlefield-portrait.prompt.md`.

JPEG follows the polish brief's permitted JPEG/WebP formats. Pillow is absent and the installed FFmpeg lacks a WebP encoder, so I used installed `sips` at quality 85 without resizing, installing dependencies or downloading anything. I inspected the final JPEG. The generated source remains in the image tool's default output directory.

The new art uses proportional cover cropping. A matching vertical drawing projection aligns the units with its rugs, and lane taps use the inverse projection. The 960×430 simulation, horizontal travel, lane assignments, unit speeds, costs, health and authored missions remain unchanged. Portrait art loads only when a narrow playfield needs it; landscape retains the existing room. The background remains cached between size/asset changes.

Other polish: phone labels at least 14px, stronger disabled-card text with only the illustration dimmed, opaque readable lane-name capsules, inset card edges/contact shadows, short press states for cards and MOM VOICE, clear counter-button hierarchy and visible focus on help. Idle menu/pause/upgrade scenes now stop requesting frames. Asset loads, resize and wave/resume actions wake one scheduler; the perpetual title bob was removed.

Still to review: generated rug/castle alignment against moving units at phone and portrait iPad sizes, the cover crop after rotation, and co-op's larger text/control dock. I would refine the crop anchor or visual baseline only if Claude's next captures show a mismatch. Long phone setup still scrolls intentionally; the new 14px setup labels also need a fresh tablet fit check.

## Reflex Riot

Score/time now have opaque dark panels above the canvas, so falling sticks cannot wash out the labels. A single menu layout wrapper centres the complete title/action group in portrait. Records, Settings, How to Play and other small labels have a 14px minimum; mode buttons remain primary. Purple and cyan button gradients were adjusted to support readable text, with consistent short press transitions.

Removed the perpetual CSS grid animation and changed the canvas scheduler to settle after idle menus/effects finish. Starting play, showing a screen, resizing or returning from background wakes it. Active gameplay timing and the previous hidden-tab protections remain. The service-worker cache is now `reflex-riot-v5-polish`; its six precache paths still exist, and other games' caches remain protected.

Still to review: the portrait group's vertical balance, HUD backing over moving sticks, secondary-action type, all eight modes after resize, and sound/settings/record interaction in a real browser. I would adjust title/action spacing if the next portrait capture still feels top heavy; no further gameplay changes are intended.

## Round 2 validation and limits

- **492/492 tests passed**, zero failed/skipped, across the **12 browser-free Lasers test files**. This includes the eight new focus regressions. `ui.dom.test.mjs` remains excluded because it starts WebKit and a server; no browser-based verifier was invoked.
- `node validate-levels.mjs`: **31 levels OK**, exit 0.
- **13 source-only smoke checks passed**: prior lifecycle/timing/DPR/cache checks, both idle schedulers settling, and portrait phone/iPad rug taps selecting the original logical lanes. These are VM checks with stub DOM/canvas APIs, not pixel or performance measurements.
- Edited JavaScript, extracted inline scripts and shot expressions passed syntax checks. HTML nesting/unique IDs, CSS block balance, precache paths and unchanged authored rule sections were checked. CSS balance is not browser layout validation.
- Computed WCAG sRGB contrast for the named opaque UI pairs: Lasers disabled **10.03:1**, Lasers HUD **11.04:1**, Reflex HUD **10.04:1**, Reflex purple-button endpoints **6.46:1 / 8.16:1**, cyan-button endpoints **12.00:1 / 8.83:1**, Sock normal/disabled cards **13.57:1 / 12.25:1**, disabled coach **10.70:1**. These measurements cover the stated colors, not every rendered pixel or theme.
- Scoped `git diff --check` passed. No git writes, browser launches, server/port starts, installs or iOS builds were performed. All validator processes completed.

Evidence is under `output/screen-fit/large-after/round2-*`; `source-smoke.mjs` contains the rerunnable source checks. Claude should run the capture tool and inspect both shots at all four sizes before accepting the new layout/art. The absence of fresh browser evidence is the remaining verification limit, not a claim of visual completion.

## Round 2 files changed

- `games/lasers-3d/index.html`
- `games/lasers-3d/src/render-camera.js`
- `games/lasers-3d/src/render.js`
- `games/lasers-3d/src/learning.js`
- `games/lasers-3d/test/camera-focus.test.mjs`
- `games/socktopus/index.html`
- `games/socktopus/screen-fit.css`
- `games/socktopus/assets/battlefield-portrait.jpg`
- `games/socktopus/assets/battlefield-portrait.prompt.md`
- `games/reflex-riot/index.html`
- `games/reflex-riot/styles.css`
- `games/reflex-riot/game.js`
- `games/reflex-riot/sw.js`
- `tools/screen-fit/shots/lasers-3d.json`
- `docs/codex/screen-fit-2026-11-22/large-report.md`
- Local verification artifacts in `output/screen-fit/large-after/round2-*` and the updated `output/screen-fit/large-after/source-smoke.mjs`.
