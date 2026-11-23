# Rough games — Reflex Riot

2026-11-22. Read the rough-games shared rules and the existing screen-fit/polish requirements. Inspected the supplied final play captures at phone 393×852, iPad landscape 1180×820, iPad portrait 820×1180 and laptop 1440×900. Those captures show flat colored rods, triangular motion marks and a faint grid behind a plain HUD. They are the before evidence; **no browser or capture was run for this pass**.

## Visual work

Reflex Riot now renders a physical arena instead of the moving grid/star background. An original generated graphite floor supplies satin grain, recessed seams, machined metal, corner lighting and inset rails. The floor is cached at the viewport's capped DPR. Corner artwork retains its proportions; straight rails extend to fit the screen, while the central material is proportionally cropped. Cyan/violet, candy, space and gold accent choices remain connected to the existing skin setting. A local procedural floor remains drawable while the image loads or if it fails.

Added a separate, state-free material renderer in `arena.js`:

- Sticks have lacquered cylindrical surfaces, metal collars, rolled edges, softbox reflections and soft contact shadows. Their existing faces and body dimensions remain.
- Orbs, bombs, freeze/reaction targets, color/number tokens and hold buttons use lit beveled puck surfaces. Bombs keep their fuse and a clear red warning ring. Color-match hues/words, number-order cues, hold progress and expiry presentation remain tied to the existing values.
- Arrows and stars receive a matching material finish and contact shadow without changing their paths or hit regions.
- Moving sticks and freeze targets leave short, tapered light traces aligned to their actual velocity. The trail length comes from speed, not frame count; there is no per-frame history buffer or trail timer.
- New trails are omitted for reduced motion and Reduce flashes. Decorative pulse is static under reduced motion. Idle scheduling and background-tab cancellation remain in place.

The HUD, Menu/sound controls and overlay panels now share the arena's metal-console finish: dark opaque wells, beveled edges, inset fasteners, a recessed fever gauge and raised control surfaces. Existing positions, safe-area spacing, type sizes and control bounds were retained. Reflection overlays sit behind the text rather than bleaching it. No continuous decorative animation was added.

## Asset

- `games/reflex-riot/assets/arena-floor.jpg`: **1024×1024, 164,454 bytes**, below the 300 KB target and 600 KB cap.
- `games/reflex-riot/assets/arena-floor.prompt.txt`: full original prompt and compression settings.

Generated with the built-in image tool, then compressed with installed macOS `sips` at JPEG quality 65 and a 1024px longest edge. Inspected the generated original and the final JPEG. No downloaded artwork, logos, new dependency or duplicate image alias was used.

## Preserved behavior and cache

Compared `game.js` with HEAD: gameplay, spawning, timing, scoring, input handlers and sound code are identical after excluding renderer setup and the obsolete gradient setup. The drawing code does not write to entity/gameplay data. Existing movement, hit thresholds, difficulty values, timing windows, controls, saves, help and sound toggles remain.

The existing gameplay shot retains its real start/tap/positive-score assertion. Its final settle is now 120ms to favor a clear moving-piece frame before a later miss message obscures it. This capture timing adjustment has not been browser verified.

Service-worker cache bumped to `reflex-riot-v6-arena`; all **8 precache entries** exist, including the renderer and floor image. Cache cleanup remains limited to Reflex Riot's namespace.

## Checks

- `node --test games/reflex-riot/test/*.test.mjs`: **14 passed, 0 failed, 0 skipped**. Tests are muted and use a Node VM/canvas stub, with no browser, network, server or audio implementation.
- Coverage includes all four viewport backing sizes at DPR 2; stable warmed material/floor caches; image success/failure; all four skins; velocity trails and reduced-motion suppression; painting all eleven entity kinds without mutation; actual pointer hit thresholds and scoring; bomb penalty; hold releases at 499/500/950/951ms; equal elapsed movement at 60/120 updates; and idle/background scheduling.
- The warmed render test repeats 120 draws without creating additional canvases or gradients. This is a cache-allocation assertion, not a measured browser frame-rate result.
- `node --check` passed for `arena.js`, `game.js`, `sw.js` and the new test file.
- HTML nesting/unique IDs, renderer-before-game script order, CSS block balance, shot JSON, precache paths and scoped `git diff --check` passed. CSS block balance is not browser layout validation.
- Computed sRGB contrast on the named opaque HUD/control colors: label **6.27:1**, score digits **7.86:1**, Menu/sound text **9.15:1**, disabled skin label **9.80:1**. These checks do not certify every rendered pixel or skin.

## Remaining visual review

Claude should capture start/play at all four sizes, inspect the actual object highlights and velocity trails against the photographed floor, and confirm the hardware borders remain clear of Menu, score/time, shields and sound. Check all eight modes and alternate skins, especially color-word legibility and bomb recognition. If needed, I would adjust only reflection strength, trail opacity or floor light balance after those captures. Browser smoothness, visual acceptance and listening checks remain unverified.

No app, window, browser or local server was opened. No ports were bound, no git writes were made, and no process was left running.

## Files changed

- `games/reflex-riot/arena.js`
- `games/reflex-riot/game.js`
- `games/reflex-riot/index.html`
- `games/reflex-riot/styles.css`
- `games/reflex-riot/sw.js`
- `games/reflex-riot/assets/arena-floor.jpg`
- `games/reflex-riot/assets/arena-floor.prompt.txt`
- `games/reflex-riot/test/arena.test.mjs`
- `tools/screen-fit/shots/reflex-riot.json`
- `docs/codex/rough-games-2026-11-22/large-report.md`

# Round 2 — lit court, portrait menu and clear score popups

Inspected Claude's `rough-large/reflex-riot` start/play sheets and the full-size portrait iPad start image. Claude reports zero errors, scroll and overflow, with muted audio at all four sizes. Those are the before captures for this round; no new browser/capture was run here.

## Changes

**Floor:** Kept the existing photographic material and accepted piece/HUD rendering. The playing well now receives a translucent, richer skin-specific base tint, plus four broad coloured light pools originating beside the rail segments. Neon uses cyan/violet; Candy pink/blue; Space violet/mint; Gold amber/cream. Fine, recessed court outlines, a centre ring, cross-court line and dashed longitudinal markings sit underneath the light. Their light edge is a low-opacity stroke, keeping the surface detail secondary to pieces and colour-word tokens. All of this is painted into the existing floor cache when its size, skin or image readiness changes; no moving lights or additional frame loop was added.

**Portrait menu:** Reserved explicit space between the rotated title's visible ink and the tagline. For tall portrait tablets (including 820×1180), the menu grid uses the safe-area-adjusted available height and centres its complete stack. Records, Settings and How to Play are now 64px tall with 18px text there. At other sizes secondary controls have at least 48px height (How to Play 56px) and at least 14px text. Phone caption spacing is separate, and the existing phone/wide title sizes and two-column landscape composition remain. These are source/layout changes; fresh captures must confirm actual fit and visible ink spacing.

**Score popups:** Positive score text is rendered 72px above its simulation position, with edge/header protection and a dark rounded outline/halo. It remains in the effects layer above pieces. Text values, floaters' stored positions, movement, lifespan and fade are unchanged. The dark separator also improves other floater text without moving those labels.

Bumped the service-worker cache to `reflex-riot-v7-arena-light`; its eight precache paths still exist. The original floor JPEG remains **164,454 bytes**; no new image asset or prompt was needed. The lacquered sticks, collars, shadows, trails and console HUD finish were retained.

## Verification

- Added three regression checks before implementation. The original 14 tests passed, while the new floor-pool, etched-court and popup-outline checks failed for the expected missing behavior. After implementation, **17 tests passed, 0 failed, 0 skipped** with `node --test games/reflex-riot/test/*.test.mjs`.
- The new floor check exercises all four skin palettes with the photographic image marked loaded, verifying the colours reach the floor through radial light gradients. The etched-court check verifies fine low-opacity paths. The popup check verifies the offset/outline and unchanged value/lifetime data. These are instrumented canvas/VM checks, not pixel or browser evidence.
- Existing checks still cover warmed cache reuse, all four viewport backing sizes/DPR, all eleven entity kinds, hit thresholds, scoring/penalties, hold-window boundaries, elapsed movement and idle/hidden scheduling.
- Compared **15 gameplay, timing, input and scheduler functions** with HEAD: identical, including score creation and floater updates. Rendering does not write to game entities or floaters.
- `node --check` passed for `arena.js`, `game.js`, `sw.js` and the test file. CSS block balance, eight precache paths and scoped `git diff --check` passed. CSS block balance does not establish browser fit.

Claude's next capture should confirm the colour/light balance in every skin, faintness of the court markings, title/tagline gap and taller secondary actions at 820×1180, unchanged phone/landscape fit, and readable `+110` over moving pieces. The remaining limit is fresh visual/browser verification. No app, window, browser or server was opened, no git writes were made, and no process was left running.

## Round 2 files changed

- `games/reflex-riot/arena.js`
- `games/reflex-riot/game.js`
- `games/reflex-riot/styles.css`
- `games/reflex-riot/sw.js`
- `games/reflex-riot/test/arena.test.mjs`
- `docs/codex/rough-games-2026-11-22/large-report.md`
