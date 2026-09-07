**Lasers 3D — full review and improvement plan**

Reviewed September 6, 2026, America/Chicago. Local source: `bc5e453` on `main`.

The game has a strong central idea and a substantial, well-tested rules engine. Turning a flat-looking laser puzzle into a height puzzle gives the camera a meaningful role; climbing beams, arches, windows, and floor bounces give that reveal depth. The next improvement pass should make the game easier to understand, control, and return to. The engine is ahead of the player experience.

My recommendation is to finish a polished 23-level campaign before expanding the mechanics or building the proposed first-person mode. Preserve the large boards, pitch-as-delta physics, hidden-height reveal, proven par values, and rendering that stops when the scene settles. Concentrate the next work on reliable assistance, mobile navigation, a playable introduction, and saved attempts.

This is a review and proposed implementation plan. Game code, progression rules, and deployment were not changed.

**Scope and evidence.** The target is the new `games/lasers-3d/` project, not the older 20-level Lasers & Mirrors page or the October 2025 iOS wrapper. The latest 16 commits all concern this game. I reviewed its design amendments, source modules, level pipeline, input and persistence paths, UI, and automated checks; inspected fresh phone screenshots and WebKit phone/tablet screenshots; and exercised additional browser probes. Test hooks were used to reach later levels and set up specific failure states. Level 1 was also solved with ordinary board clicks and FIRE.

| Verification | Result and practical limit |
|---|---|
| Node tests, `node --test games/lasers-3d/test/*.test.mjs` | 411 passed; 2 existing TODO cases; 0 unexpected failures. The DOM harness within this run also reports 507/507 checks. |
| `validate-levels.mjs` | All 23 levels pass solution, par, inventory, and relevant 3D/mechanic checks. |
| `test/ui.playwright.mjs` | 209/209 checks pass in desktop-hosted WebKit, including phone/tablet interactions and additional layout sizes. |
| `test/motion.frames.mjs` | 131/131 checks pass, including motion completing and zero application frames after settling. |
| `test/render.smoke.mjs` | All checks pass, including rendering, picking, large boards, and animation termination. |
| Independent Chromium probes | Checked 320×568, 375×812, 393×852, 430×932, 844×390, 820×1180, and 1440×900; reproduced issues below. |
| GitHub | `git ls-remote` reports `2f5052c` for remote `main`; local `bc5e453` is 16 commits ahead. |
| NAS | LAN request timed out after eight seconds. Current NAS/public deployment was not established. |

Desktop WebKit with mobile emulation is not a physical iPhone. These results do not establish sustained frame rate, battery use, thermal behavior, touch comfort, or VoiceOver usability on actual devices. Audio event behavior is covered by tests; I did not perform a listening evaluation. Solvability proofs do not measure enjoyment or human difficulty.

**What already works well.** The simulation is isolated from Three.js and the DOM, piece behavior is registered as data, and rendering/input/UI are separated into modules. This is a good foundation for making targeted changes without rewriting the game. The pitch correction is implemented and explicitly tested: a normal mirror preserves climb, while WEDGE and DIP change it. Preserve that rule during every future refactor.

The level pipeline is unusually rigorous for a small game. It verifies minimal piece counts, inventory slack, required arches/windows/bounces, and 3D necessity. Levels 4–23 pass the flat-unsolvable criterion; the solver checks that new mechanics are actually needed in their intended teaching levels. The largest board is 24×24, the longest shipped solution trace is 36 steps, and the proof runs report no cap-truncated traces.

The presentation also has good fundamentals: distinct tray silhouettes, restrained dark colors, a legible bright beam, altitude badges, post-shot explanations, target feedback, keyboard support, undo/redo, a free introductory reveal, reduced-motion handling, and a visible WebGL startup fallback. Progress stores separate achievement criteria instead of conflating all two-star runs. Dark-level discoveries persist across resets and reloads. The animation registry, cancellation tokens, cached shadows, bounded effects, and measured idle shutdown deserve to be preserved.

**Findings to address first.** P1 means an issue worth fixing before broader family release; P2 is a meaningful improvement or hardening task. No P0 rules failure or unsolvable shipped level was found.

| ID | Priority | Finding | Evidence |
|---|---|---|---|
| F1 | P1 | A hint can consume par eligibility while its ghost is off-screen. | Reproduced on level 4 at 393×852. |
| F2 | P1 | Phone controls conceal essential actions in an unmarked horizontal scroller. | More starts beyond the visible row at 375 and 393px; Hint also falls beyond it at 320px. |
| F3 | P1 | Space, the desktop pan modifier, also changes the puzzle. | A placed mirror rotates immediately on Space keydown. |
| F4 | P1 | Unfinished placements are discarded when the page reloads. | One placed solution mirror became zero after reload; only progress metadata was stored. |
| F5 | P2 | Dark-level interaction text reveals undiscovered fixed pieces. | An unknown mirror on level 21 responds “That piece is bolted down.” |
| F6 | P2 | Level state is keyed mainly by array index; discovery fingerprints omit some puzzle semantics. | `stars`, intros, reveals, and known cells use index keys; fingerprint omits fixed pieces/openings. |
| F7 | P1 release task | The current build is absent from both portal indexes and remote main. | No `lasers-3d` link in either index; remote comparison above. NAS remains unverified. |

**F1 — make hints visible and understandable before charging for them.** In level 4, place the first stored solution piece at `(7,2)` and press HINT. The next ghost is at `(0,2)`, projected to x = −24.5 CSS pixels. `hintUsed` becomes true and par eligibility becomes false even though the player sees no ghost. At the default 393px working view, later solution placements extend off-screen on levels 4, 7, 15, 16, 19, and 20. This is not just a theoretical camera concern.

The cause is in [main.js](../../games/lasers-3d/src/main.js#L781): `hint()` chooses the first unmatched stored solution placement, sets the penalty, and schedules its short lifetime without checking visibility. Add a camera operation that brings the hinted cell into the current view without tilting. Begin the display lifetime after framing settles; show the piece name and orientation beside it. Only consume assistance eligibility once the hint is presented. Do not silently remove or replace the player's existing piece if the suggested square is occupied.

Acceptance: the second hint on level 4 is visible without additional gestures at every supported viewport, remains visible long enough to read, and does not consume the no-tilt condition. A failed or cancelled hint presentation does not cost an achievement. Any later upgrade to contextual hints should accept alternative valid solutions rather than forcing the authored route.

**F2 — keep the main phone actions in view.** At 393px, More begins around x = 381 and ends at x = 425. Its center is off-screen; Undo, Redo, Levels, and Help live behind that button. At 320px, Hint is also outside the visible action area. The row intentionally supports horizontal scrolling, and scrolling 47px at 393px brings More into view. This is a discoverability problem, not a permanently unreachable control. The scrollbar is hidden, there is no visible instruction or edge cue, and ALL/ZOOM adds width exactly where space is tight.

The relevant layout is [index.html](../../games/lasers-3d/index.html#L177) and the More relocation logic is [ui.js](../../games/lasers-3d/src/ui.js#L228). Keep FIRE, TILT/FLAT, the overview control, Undo, and More visible in a fixed layout. Move Reset and Hint into a clearly labeled secondary area if needed, or use a compact two-row layout. Preserve minimum control sizes instead of shrinking text until everything fits.

Acceptance: no primary control requires undisclosed horizontal scrolling at 320, 375, 393, or 430px. Verify the entire button rectangle and its actual hit target, not just its CSS width. The existing suite verifies FIRE and minimum sizes but can pass while another action is outside the visible row.

**F3 — separate panning from activation.** With a keyboard cursor on a placed mirror, pressing Space changes a slash-oriented mirror to its opposite orientation immediately. Space is in the Enter/activate key map and independently arms Space-drag panning. A user trying to move the camera can therefore rotate or place a piece and add an undo entry before dragging.

See [input.js](../../games/lasers-3d/src/input.js#L29), its `onKeyDown()` handler, and `onKeyDownSpace()` near line 311. The simplest repair is to use Enter for activation and reserve Space for pan. Alternatively, interpret a short un-dragged Space press on keyup, cancelling activation if a drag occurs. Whichever mapping is chosen, explain pan and zoom in Help; the current key legend explains board actions but omits these camera gestures.

Acceptance: Space-down, drag, and release change camera framing only; placements, orientation, history, and achievements stay identical. Enter still places/rotates. Long Space holds do not repeat actions.

**F4 — restore unfinished attempts.** [main.js](../../games/lasers-3d/src/main.js#L398) loads every level through `resetAttempt()`, which clears placements, fires, hints, and tilt usage. [ui.js](../../games/lasers-3d/src/ui.js#L662) persists progression and discovery data, but there is no attempt snapshot. This is an omitted capability rather than corrupt saving of the fields the game currently promises. It will matter more as puzzles get longer and mobile tabs are reloaded or discarded.

Save a versioned attempt after committed edits and achievement-affecting actions. Include a stable level identity/fingerprint, legal placements, fire count, assistance/tilt flags, and enough camera state to return to a useful view. Restore through the normal simulation and validation path, never by trusting stored render objects. Keep manual Reset distinct from Resume. Completed stars must survive corrupt attempt data, and reload must not erase hint/tilt penalties while retaining the solution.

Acceptance: place two pieces, rotate one, tilt, request a hint, reload, and recover the same legal attempt and eligibility. Invalid/obsolete saved placements reset the attempt gracefully while preserving valid achievements. Test failure of storage as well as successful storage.

**F5 — enforce darkness at the interaction boundary.** In a fresh level 21, fixed MIRROR `(14,20)` is absent from `knownList()`. Clicking its projected square still displays “That piece is bolted down.” The early `fixedAt(cell)` branch in [main.js](../../games/lasers-3d/src/main.js#L574) identifies the hidden object before considering whether the player knows it.

Use the same knowledge predicate for rendering, pointer feedback, keyboard previews, accessibility descriptions, and hints. Unknown cells may provide the generic response allowed by the rules, but should not identify a fixed mirror through text or a special animation. Inspect the `invalid` ghost path too: it currently derives from placement legality and needs a deliberate rule for unknown cells.

Acceptance: tapping or hovering unknown cells cannot distinguish a hidden fixed mirror from another unknown obstruction through object-specific copy or preview color. After the beam discovers the mirror, the normal fixed-piece message is available. This concerns puzzle fairness, not a security vulnerability.

**F6 — give level progress stable identities.** The current fingerprint in [main.js](../../games/lasers-3d/src/main.js#L291) includes dimensions, terrain, emitter, and targets. Changing a fixed mirror or opening without changing those fields can preserve an old discovery record. Earned stars and teaching flags are keyed by array index, so inserting or reordering levels can apply them to a different puzzle.

Add stable `id` values and a semantic revision/fingerprint covering terrain, openings, emitter, targets, fixed pieces, and rules-relevant data. Migrate the existing 23 index entries explicitly. Archive an outdated attempt rather than misapplying it. Distinguish cosmetic changes from changes that invalidate par or discovery. Add a reorder/migration test before extending the campaign.

**F7 — complete the release path after fixes.** The existing 2D game is linked from the portal; the new one is not. Its new thumbnail exists. Add its own card to both indexes and retain the existing game. Use a provisional label until the game name is chosen. Push/deploy only as part of the eventual implementation/release task; this review did not publish anything. Verify local, GitHub-served if applicable, NAS-served, and public content against a release manifest. The NAS timeout here is an access limitation, not evidence that the game is down.

**The learning experience needs the largest design improvement.** Visible Help contains approximately 481 words and occupies 1,908px of scroll content inside a 778px-high phone modal. It covers four pieces, pitch changes, altitude, arches, windows, darkness, and keyboard controls before the first simple bounce. The initial screenshot also shows three unavailable piece types. The underlying explanations are useful reference material, but this is too much to make the first interaction depend on reading.

Replace the automatic manual with a playable three-action introduction: choose the mirror, place it in a marked cell, rotate it and FIRE. Leave the full manual available under Help. Reveal other tray types as they are introduced, or present locked silhouettes without full instructions. Anchor one sentence near the relevant piece or failed beam. Let players replay each mechanic lesson. Apple similarly recommends contextual, playable learning and short optional onboarding. [Apple onboarding guidance](https://developer.apple.com/design/human-interface-guidelines/onboarding), [designing for games](https://developer.apple.com/design/human-interface-guidelines/designing-for-games).

The large-board preference should remain intact. Use a focused teaching area within the first 12×12 board and guide the eye; do not solve this by shrinking the entire campaign back to 6×6. Teach overview, zoom, and pan explicitly when they first become necessary. The first free tilt reveal should ask the player to notice a specific height relationship and then act on it, so it becomes an understood rule rather than a cinematic interruption.

**Reconsider how the stars reward the signature mechanic.** The third criterion currently requires zero tilts. This is implemented as designed, but it tells a completion-minded player that using the game's most interesting feature is a lesser performance. Resetting after inspecting the board turns much of that challenge into remembering a solution. Free hints can also coexist with the blind criterion, so “blind” is not the same as unaided reasoning.

My preferred progression is: campaign completion, efficient solution, and unassisted solution, with a separate optional “solve from above” mastery badge unlocked after the first clear. Tilt remains free during normal learning. Keep existing earned criteria during migration; do not delete players' accomplishments. If the current three-star model is retained, make each criterion's state explicit and frame no-tilt as an advanced replay challenge. This is a product recommendation, not a physics fix.

**Make failure teach one fact.** The existing readout already distinguishes wall, floor, edge, sky, target flyover, and altitude mismatch; build on it. Highlight the actual terminal event and offer a short causal explanation such as “The beam is still climbing; a DIP can level it.” Keep the full route inspectable after failure. A small step-through beam inspector with previous/next event controls would help players understand a compound route, and the existing trace-event stream provides the data. It should describe only information the player has earned on dark boards.

Use a graduated hint sequence: identify the failed concept, highlight the relevant part of the route, then offer an explicit placement. The last stage may affect the assistance achievement. Repeatedly flashing an exact answer for two seconds helps completion more than learning, particularly when the user has built a different route.

**Visual review.** The tilted board has a coherent dark miniature-world style, and the reflective tray pieces communicate their differences well. The phone can switch between a useful full-board overview and large editing cells. Preserve the compact effects; additional bloom, particles, or permanent motion are not the highest-value next work.

Two visual tradeoffs need deliberate attention. First, the flat view makes floor and raised block tops effectively identical, including the first three levels. The screenshot reads as a uniform grid with a small target and a beam that stops at an unseen obstacle. This matches the visual contract, so it is not a rendering bug. Consider making wall *footprints* readable in the teaching levels while continuing to hide height, or teach explicitly that tracing discovers obstacles. Choose this intentionally because showing footprints changes the present information design.

Second, the tilted phone overview leaves substantial vertical space while individual targets and pieces are small. That is partly the correct consequence of fitting a wide isometric board. Improve orientation with a clearly named overview/edit control and tap-to-focus on a region; avoid simply increasing zoom and clipping the goal again. Increase emitter/goal emphasis using outlines or screen-sized markers that do not disclose hidden height. Make altitude readable through number and shape as well as hue.

Level selection currently displays numbers and stars; names are present in accessible labels but not visibly on the tiles. Add chapter names, short visible level names, and the introduced mechanic. This gives players a recognizable place to resume and turns a grid of numbers into a campaign.

**Content and pacing.** The current authored progression is a good base:

| Levels | Existing focus | Recommended curation pass |
|---|---|---|
| 1–3 | Basic reflection | Teach placement/rotation through action; provide a clear first success. |
| 4–6 | Height, raised targets, WEDGE | Make the reveal and the difference between turning and climbing unmistakable. |
| 7–9 | DIP, stilts, secret ramp | Add a short predict-then-fire exercise for preserving versus changing pitch. |
| 10–12 | Arches, windows, multiple targets | Teach exact altitude at an opening; check whether the first two-target objective is obvious. |
| 13–17 | Floor bounces and combinations | Give each bounce rule a simple practice puzzle before a combined route. |
| 18–20 | Longer combined routes | Tune for reasoning complexity rather than empty board area. |
| 21–23 | Dark 24×24 puzzles | Verify that surveying produces useful deductions instead of blind scanning. |

Par varies from 1 to 5, but piece count is not a sufficient difficulty measure. A level needing five pieces can be obvious; a two-piece height puzzle can require a new insight. Track which reasoning step players fail to infer, how often they pan or undo accidentally, whether they can explain a failed shot, and whether the next attempt is informed. Keep solver guarantees while changing layouts. Add new levels only to fill observed teaching gaps or to explore a distinct idea.

**Accessibility and input completeness.** Keep the existing reduced-motion support, labeled controls, focus traps, and keyboard mappings. Add visible single-pointer alternatives for camera pan/zoom and tap-select/tap-destination movement. Keyboard controls alone do not replace the need for alternatives to complex pointer gestures. [W3C pointer gestures](https://www.w3.org/WAI/WCAG22/Understanding/pointer-gestures), [dragging movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html).

The canvas is exposed as a single “Laser board” image, so current labels do not provide a usable description of individual cells or the active cursor. Add a concise cursor/selection readout with coordinates, piece type/orientation, and only currently available height knowledge; announce meaningful actions and trace outcomes. Review the disabled browser-zoom meta setting, small readout text, contrast, and non-color altitude cues with real accessibility tools. Full screen-reader gameplay is a larger follow-up, and has not been verified in this review.

**Engineering and quality plan.** Keep the present architecture and avoid a framework migration. The strongest improvement is to turn the existing scripts into a reproducible release command with portable dependencies. The browser suites currently require an absolute Playwright path under `/Users/jamesalford/.npm-global/...` and default screenshots to an old scratch directory. Add a small project manifest or documented tool bootstrap, a pinned browser/tool version, relative output paths, and one command for unit tests, level validation, UI, render, and motion checks. Keep expensive proof checks separate from fast local feedback if necessary.

The two existing TODO cases concern non-array `placed` input throwing in the simulator and a page exposing `module.exports` without `require`. They are robustness debt, not demonstrated normal-player crashes. Give them explicit disposition and do not describe the test run as having zero outstanding cases.

Distill the design amendments into one current rules reference. The beginning of DESIGN.md still says 6×6–9×9 boards, a 400-step cap, and pieces setting pitch; later sections replace those rules. It also contains the older stop-at-target statement. Current code and tests should be the basis for the corrected document. Preserve historical decisions separately so a future builder does not accidentally restore superseded rules.

Add behavioral regressions for F1–F6. Broaden browser assertions to check visible control bounds, not only size or successful programmatic clicks. Test mid-attempt reload, resize during a hint, keyboard cursor movement to off-screen cells, unknown-cell feedback, and valid alternative solutions. Exercise WebGL loss/restoration and background-tab recovery as release hardening; a startup fallback alone does not prove context-loss recovery. Retain all existing zero-idle-frame assertions.

**Implementation order and acceptance gates.**

| Pass | Concrete work | Gate before moving on |
|---|---|---|
| 1. Reliability | Repair off-screen hints, the Space conflict, phone action layout, and darkness feedback. Add attempt persistence with stable level IDs and migration. | New reproductions pass; existing rules, level, browser, render, and motion suites remain green. No earned progress is lost. |
| 2. Learning | Playable opening; contextual piece lessons; explicit camera instruction; clearer failure explanation; graduated hints. Decide and implement the achievement model. | New players can complete level 1 without the manual and explain a WEDGE/DIP failure after the teaching sequence. |
| 3. Campaign polish | Visible level names/chapters; stronger goal/source markers; region focus; review the first arch/window/bounce/dark puzzles. | Each new mechanic has a teach/practice/combine progression and every edited puzzle retains its solver guarantees. |
| 4. Release | Portable test command, current rules document, real-device checks, both portal cards, reviewed commit/push/deploy, content verification. | iPhone portrait/landscape, small phone, iPad, and desktop flows succeed; deployed assets match the chosen revision; all controls and resume work from the family portal. |

Before calling the campaign finished, observe a small mixed-age family playtest with fresh saves. Do not coach the first bounce. Ask the player to explain why one shot failed, show how they reach an off-screen square, leave and resume a partially solved level, and find Help/Undo independently. Record observations locally, distinguish deliberate experimentation from interface mistakes, and fix repeated misunderstandings. Suggested success criteria are goals for that study, not results already measured.

After this campaign is clear and dependable, the most promising additions are curated challenge packs, a replayable beam inspector, and an Architect/Solver pass-and-play mode. A daily puzzle should come from a validated curated pool before attempting unrestricted generation. Device-local family profiles can add replay value without requiring accounts. Cross-device sync is optional until there is a demonstrated need.

The proposed INSIDE mode is an interesting separate expansion, but it adds walking, camera look, reach, traversal, occlusion, and another tutorial to the same optics system. Keep its specification; prototype one chamber after the core campaign's controls and learning are validated. More optics types, online competition, monetization, and a native wrapper can wait until there is evidence the existing loop holds attention.

**Review artifacts.** [Evidence directory](../../output/playwright/laser-review-2026-09-06/), [independent viewport/state probes](../../output/playwright/laser-review-2026-09-06/browser-probes.json), [targeted reproductions](../../output/playwright/laser-review-2026-09-06/targeted-probes.log), [unit output](../../output/playwright/laser-review-2026-09-06/unit-tests.log), [WebKit UI output](../../output/playwright/laser-review-2026-09-06/ui-tests.log), [motion output](../../output/playwright/laser-review-2026-09-06/motion-tests.log), [render output](../../output/playwright/laser-review-2026-09-06/render-tests.log).

Visual evidence: [first phone board](../../output/playwright/laser-review-2026-09-06/phone-level1.png), [level 5 flat](../../output/playwright/laser-review-2026-09-06/phone-level5-flat.png), [level 5 tilted](../../output/playwright/laser-review-2026-09-06/phone-level5-tilt.png), [off-screen level 4 hint](../../output/playwright/laser-review-2026-09-06/offscreen-hint-level4.png), [phone Help](../../output/playwright/laser-review-2026-09-06/help-phone.png).
