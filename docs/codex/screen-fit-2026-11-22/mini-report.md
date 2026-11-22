# Mini batch: implementation and verification handoff

**Status: source pass complete; visual acceptance is pending.** The approved capture command failed before Chromium could load a page. There are no after screenshots or measured after dimensions, overflow, performance, or interaction results. Do not mark this batch visually approved until Claude runs and inspects the captures.

No app, visible window, headed browser, server, or listening port was opened. No network package installation/download or Git write was performed. The pre-existing baseline directory was read only.

## Shared implementation

- Replaced the runtime Tailwind script in all ten React games. Nine now embed CSS compiled with the already-installed Tailwind 3/PostCSS and minified with the already-installed esbuild. Spelling Bee already uses its own CSS and did not need utility generation. The laser game already had local CSS. React/ReactDOM/Babel UMD URLs and versions are unchanged. Fonts still have system fallbacks.
- Landscape uses large real boards and side controls; portrait uses a vertical layout. Native ResizeObserver callbacks refit boards after mount, control sizing, font loading, and viewport changes. They are event-driven, not a continuous animation loop.
- Added safe-area-aware page padding and a 44px Menu link above every game overlay, including the laser optics lab. Applied hover styles only inside hover-capability media queries and retained reduced-motion CSS.
- General controls have 44px minimum hit areas. **Dense-board exception remains:** full-board phone views of Minesweeper, Ultimate Tic-Tac-Toe, high custom Lights Out sizes, and wide Connect Four variants can have individual targets below 44px. A 9-column grid cannot have 44px cells within a 393px viewport. This needs a reviewed zoom/pan or alternative input design; this pass does not certify that requirement for these modes.
- Opening setup disclosures can make phone setup scroll. Normal closed-setup play is designed to fit; this still needs browser measurement.

## Checks actually run

- `node games/mini-games/validate-laser-levels.mjs`: PASS, all 20 levels on every board size the existing validator checks. This is a puzzle-path check, not browser/touch certification.
- Every nonempty inline script was locally transformed from JSX where applicable and piped into `node --check`: 34 scripts passed, zero failures. No runtime UMD was executed by these syntax checks.
- PostCSS parsed all 67 style blocks; esbuild CSS parsing returned no warnings. All 112 hover rules were inside hover-capable media conditions. These are source checks, not rendered-layout checks.
- AST comparison against HEAD: 39 pre-existing uppercase array/object configuration constants are unchanged across the eleven HTML files. The inlined MineQuest difficulty, mission, theme, and profile-key constants also match its external source.
- `games.json` parses; all eleven mini games have nonempty play steps, and other batches’ entries match HEAD. Evaluation-step JavaScript parses. The click selectors have been checked against source labels but not executed.
- `git diff --check`: PASS.

## Capture limitation

Attempted exactly the approved command:

```sh
node tools/screen-fit/capture.mjs --out output/screen-fit/mini-after --batch mini
```

Chromium failed with `bootstrap_check_in ... Permission denied (1100)` from its macOS MachPort rendezvous registration and exited with SIGTRAP. The tool completed temporary-directory cleanup. No alternative browser path or permission escalation was attempted. A concise failure receipt is in `output/screen-fit/mini-after/capture-failure.txt`.

All eleven baseline `sheet-start.png` sheets were inspected, covering phone 393×852, iPad landscape 1180×820, iPad portrait 820×1180, and laptop 1440×900. Their baseline report supplies the scroll values below. **After at all four sizes: not observed**, because browser startup failed. No improvement percentages are claimed.

## Per-game review

### 2DTicTacToe

Separated live controls, board, and actions into a responsive layout. Classic cells now fill the actual square board. Expanded modes also lose their 480/560px board caps. Setup panels gain more room on large screens. Confetti now uses elapsed time, capped DPR, resize refitting, hidden-tab suspension, and the reduced-motion preference. Touch devices no longer get the mouse-only ghost preview.

**Before, all four sizes:** Phone: the setup menu fits but has little spare width. iPad landscape and laptop: a narrow menu occupies the middle of a largely empty screen. iPad portrait: the same menu is small within the tall viewport. The baseline does not show gameplay.

Baseline vertical page scroll in pixels — phone / iPad landscape / iPad portrait / laptop: **0 / 0 / 0 / 0**.

**After, all four sizes:** pending the approved headless capture and visual inspection. The source changes above are implemented, not visually certified.

### CodeBreakerV4

Made guess history the dominant landscape playfield, with setup and current guess/actions beside it. Portrait uses a bounded history region between setup and fixed input/actions. Enlarged palette, pegs, difficulty selector, duplicate switch, and action hit areas. Preserved the tutorial, rules, history, notepad, feedback, and all guessing logic.

**Before, all four sizes:** All four sizes show the first tutorial panel over the narrow game. The tutorial remains readable; gameplay and the guess history cannot be assessed from these baseline screenshots.

Baseline vertical page scroll in pixels — phone / iPad landscape / iPad portrait / laptop: **0 / 0 / 0 / 0**.

**After, all four sizes:** pending the approved headless capture and visual inspection. The source changes above are implemented, not visually certified.

### lasers_mirrors_game

Reserved separate space for the HUD and mirror inventory so the board is not behind them. Tools are an explicit popover at every width, with instructions available inside it. Menu now stays above the optics lab as well as normal overlays. Capped both canvas DPRs at 2, refitted to safe-area-aware bounds, converted replay and sandbox visual time to delta time, stopped hidden-tab RAF work, suspended the underlying game rendering while the lab is open, cached lab dimensions outside its ray loop, and compacted particles in place. Level definitions and mirror budgets remain unchanged.

**Before, all four sizes:** All four sizes already have a large laser field. HUD panels sit over its upper portion; the first target is close to that HUD. The Menu link overlaps the left edge of the level information. The mirror inventory sits at the bottom.

Baseline vertical page scroll in pixels — phone / iPad landscape / iPad portrait / laptop: **2 / 2 / 2 / 2**.

**After, all four sizes:** pending the approved headless capture and visual inspection. The source changes above are implemented, not visually certified.

**Game-specific validation:** all 20 laser levels pass at the validator’s desktop, tablet, phone, small-phone, and phone-landscape board sizes. Authored level content was not edited.

### LightsOut

Expanded the grid with responsive rows/cells and separated its controls. Put theme, campaign, difficulty/custom size, and timed setup in a disclosure, initially expanded in landscape and collapsed in portrait. Undo/hint and reset remain outside that setup disclosure. The board refits after options, text, or viewport changes. Original light colors, hover patterns, hint behavior, and puzzle logic remain.

**Before, all four sizes:** Phone: the lower reset control is at the bottom edge. iPad landscape and laptop: a relatively small square grid and lower controls run beyond the captured viewport. iPad portrait: controls fit, but a small centered grid leaves substantial unused width.

Baseline vertical page scroll in pixels — phone / iPad landscape / iPad portrait / laptop: **40 / 116 / 0 / 36**.

**After, all four sizes:** pending the approved headless capture and visual inspection. The source changes above are implemented, not visually certified.

### PegJumper

Expanded every board using its real row/column aspect ratio, including the 9×5 triangle. Pegs and holes scale within actual layout cells; the existing move animation still measures those cells. Put board selection in a setup disclosure. Statistics and pause/hint/undo/reset sit alongside the board in landscape and above/below it in portrait. Hover-only path previews require a hover-capable device.

**Before, all four sizes:** Phone: the large setup/statistics stack pushes the lower controls below the viewport. iPad landscape and laptop: the triangle and its board frame are small relative to the screen. iPad portrait: the same triangle is compact in the middle of a much larger page.

Baseline vertical page scroll in pixels — phone / iPad landscape / iPad portrait / laptop: **89 / 0 / 0 / 0**.

**After, all four sizes:** pending the approved headless capture and visual inspection. The source changes above are implemented, not visually certified.

### SpellingBee

Replaced the 440px outer cap with a layout that gives the honeycomb its own large panel and puts settings/words beside it in landscape. Letter hexagons resize through their real CSS dimensions; no transformed page or blurred text. A resize observer budgets their size after current word, actions, settings, and words panel. Enlarged controls and preserved daily/free/sprint, vocabulary, practice, hints, found words, themes, and sound.

**Before, all four sizes:** Phone: the words panel is below the lower edge. iPad landscape and laptop: the narrow honeycomb column pushes lower actions off screen. iPad portrait: the complete game is visible, with a small honeycomb and substantial unused width.

Baseline vertical page scroll in pixels — phone / iPad landscape / iPad portrait / laptop: **86 / 184 / 0 / 104**.

**After, all four sizes:** pending the approved headless capture and visual inspection. The source changes above are implemented, not visually certified.

### 2048

Removed the narrow board cap and placed game controls/records beside the board in landscape. Portrait keeps the board between controls and records. Tiles, numbers, and gaps scale with the board; the fit observer accounts for the controls actually rendered. Variant, theme, undo, achievements, help, touch gestures, and storage keys remain.

**Before, all four sizes:** Phone: the new-game control falls below the captured view. iPad landscape and laptop: the narrow board stays centered, with records and the reset action extending below the viewport. iPad portrait: the board is small within the tall page.

Baseline vertical page scroll in pixels — phone / iPad landscape / iPad portrait / laptop: **89 / 182 / 0 / 102**.

**After, all four sizes:** pending the approved headless capture and visual inspection. The source changes above are implemented, not visually certified.

### ConnectFour

Expanded the actual board and separated the in-round turn status from match setup. Player names, AI/series, and variants live in a disclosure so portrait play can give the board more room. Landscape starts with setup expanded. Reset and family records remain below/beside the board. Existing disc positioning, aspect-ratio changes, AI, and match rules remain.

**Before, all four sizes:** Phone: the reset action is below the captured view. iPad landscape and laptop: a narrow board leaves large empty side areas and lower controls extend below the viewport. iPad portrait: the centered board and controls fit but leave large margins.

Baseline vertical page scroll in pixels — phone / iPad landscape / iPad portrait / laptop: **76 / 143 / 0 / 63**.

**After, all four sizes:** pending the approved headless capture and visual inspection. The source changes above are implemented, not visually certified.

### Snake

Removed the old height-minus-390px width cap and gave the board a responsive landscape/portrait layout. Kept mode/mission/skin, score, pause, reset, and help accessible. Movement remains on the existing millisecond tick interval; hidden tabs skip movement and time-attack countdown ticks. The DOM board needs no canvas DPR scaling.

**Before, all four sizes:** Phone: the board and reset action fit. iPad landscape and laptop: the board is narrow, with the reset action near the lower edge and page scroll reported. iPad portrait: the existing height-based cap already produces a much larger board.

Baseline vertical page scroll in pixels — phone / iPad landscape / iPad portrait / laptop: **0 / 41 / 0 / 41**.

**After, all four sizes:** pending the approved headless capture and visual inspection. The source changes above are implemented, not visually certified.

### Minesweeper

Inlined the existing MineQuest JSX and local CSS into the allowed HTML, leaving both external source files untouched. This makes the HTML the active self-contained copy for this pass. Moved settings and family records into disclosures; board, live status, and mark mode remain outside. Added the already-present focus-trapped help modal to the active renderer and a sound toggle that gates future tones. Expanded the real field and added observer-based fitting. Difficulty/mission/theme constants, profile key, generation, solver, scores, and profile format remain unchanged.

**Before, all four sizes:** Phone: only the top portion of the field appears after the large settings/achievement stack. iPad landscape and laptop: much of the field and its lower rows fall below the viewport. iPad portrait: the lower part of the board also extends beyond the viewport.

Baseline vertical page scroll in pixels — phone / iPad landscape / iPad portrait / laptop: **323 / 437 / 72 / 357**.

**After, all four sizes:** pending the approved headless capture and visual inspection. The source changes above are implemented, not visually certified.

### MemoryMatch

Removed the landscape rule that held cards at a small fixed size. Cards now fill flexible rows; the board uses its selected row/column ratio for Junior, Standard, Expert, and Huge. Controls/stats and reset surround the board in portrait and sit beside it in landscape. Card faces and emoji remain sharp DOM elements, with existing flip, matching, modes, and records retained.

**Before, all four sizes:** Phone: the standard board and new-game action fit. iPad landscape: the old landscape override makes the cards particularly small. Laptop: cards remain in a central column and the report records a small amount of page scroll. iPad portrait: the standard board fits but uses only part of the available width.

Baseline vertical page scroll in pixels — phone / iPad landscape / iPad portrait / laptop: **0 / 0 / 0 / 8**.

**After, all four sizes:** pending the approved headless capture and visual inspection. The source changes above are implemented, not visually certified.

## What Claude should verify next

1. Re-run the approved capture command outside this sandbox. Inspect every start and play sheet at all four sizes; confirm that every play step reaches a real move.
2. Measure default-play page overflow and control visibility after the observer settles, then rotate and resize without losing the run. Check long status text, open/closed setup, end-of-round overlays, and every variant’s board shape.
3. Check Menu pointer access above help, pause, victory, tutorial, and optics-lab overlays. Exercise the retained sound toggles, Minesweeper’s newly exposed help/sound controls, and keyboard focus restoration.
4. Verify hidden-tab suspension and 60/120Hz animation behavior in an actual browser. No frame-time, FPS, device thermal, or hardware-touch measurements were possible here.
5. Resolve the dense-board touch-target exception before claiming full compliance. Review the inlined MineQuest maintenance choice when reconciling future edits to its external JSX/CSS.

## Concurrent working-tree note

The final status check also showed a separate edit to `tools/screen-fit/capture.mjs`, adding optional per-game shot overrides under `tools/screen-fit/shots/`. This pass did not write that file and left the edit untouched. No override files were found at the final check, so the mini play definitions currently remain in `games.json`. Recheck this before capturing if work continues concurrently.

## Files changed by this pass

- `games/mini-games/2DTicTacToe.html`
- `games/mini-games/CodeBreakerV4.html`
- `games/mini-games/lasers_mirrors_game.html`
- `games/mini-games/LightsOut.html`
- `games/mini-games/PegJumper.html`
- `games/mini-games/SpellingBee.html`
- `games/mini-games/2048.html`
- `games/mini-games/ConnectFour.html`
- `games/mini-games/Snake.html`
- `games/mini-games/Minesweeper.html`
- `games/mini-games/MemoryMatch.html`
- `tools/screen-fit/games.json` (mini entries only)
- `docs/codex/screen-fit-2026-11-22/mini-report.md`
- `output/screen-fit/mini-after/capture-failure.txt`

## Round 2 — fixes from Claude's real-browser review

Inspected the start and play sheets in `output/screen-fit/mini-verify/` for Peg Jumper, 2048, Minesweeper, Tic Tac Toe, Connect Four, and Spelling Bee, at all four sizes. These are **before Round 2** screenshots. No browser or capture command was launched during this round, as requested; the revised layouts await Claude's recapture.

### Peg Jumper crash

The Round 1 sizing expression read `board[0].length` during the initial render. Its state starts as `[]`; `initializeBoard(0)` runs in an effect afterward. The sizing expression therefore crashed before that effect could initialize the game. This was a regression introduced by the layout pass.

Board dimensions now come from the selected level's authored layout, which exists on the first render. Board state, initialization, move validation, levels, scoring, and timing were not changed.

A Node server-render test reproduced the exact undefined-length error before the fix and passed afterward. A separate in-memory hook harness exercised the real level-selection handlers and component render for all six shapes:

| Board | Rows × columns | Pegs after initialization | Empty holes |
| --- | --- | --- | --- |
| Triangle | 5 × 9 | 14 | 1 |
| Cross | 7 × 7 | 32 | 1 |
| Triple Triangle | 5 × 9 | 16 | 1 |
| Rectangle | 4 × 5 | 19 | 1 |
| Compact Square | 4 × 4 | 15 | 1 |
| Long Board | 3 × 5 | 14 | 1 |

These are component/runtime checks, using an installed React package in Node, not browser or visual certification. Claude should confirm the restored board and its animations in the next captures.

### Phone board space

- **2048:** Claude's report recorded a phone panel-area fraction of 0.246, compared with 0.389 in the baseline. The sheets show setup and achievement rows consuming the vertical budget. Variant/theme choices now share a setup disclosure, and family records have their own disclosure. Undo, score/best, and New Game remain outside them. Records and New Game share a compact phone row. Larger screens start with the disclosure content expanded. The observer can allocate the remaining width to the square board instead of shrinking it around the optional rows.
- **Minesweeper:** The sheets show a narrow phone field underneath a tall heading/options/status stack. The title and help/sound controls now share a phone row, while Game options and Mark mode share another. Live stats, objective, and status remain visible. Duplicate introductory copy and the static tip leave the phone play stack; How to Play remains available. The existing field fitter now has substantially less non-board content to budget around.
- **Tic Tac Toe / Connect Four:** Reduced phone side gutters and board padding. Tic Tac Toe's extra outer-panel padding/border is removed on phone, leaving its board as the main framed surface. Both games retain their board aspect ratios and the existing controls; larger-screen layouts keep their existing rules.
- **Spelling Bee:** Claude measured 18px of phone scroll. The fitting code previously imposed a 62px hex minimum even when the remaining height could not accommodate it. The lower bound is now 48px, with a small rounding allowance, and the phone subtitle is removed to preserve more honeycomb space. The three main sections no longer flex-shrink before their measured sizes are budgeted. The next capture must confirm zero page scroll; no after-scroll number is claimed here.

### MineQuest source restored

This supersedes the Round 1 decision to inline MineQuest. The active renderer and its fitting code are back in `Minesweeper-pro.jsx`; its presentation and responsive rules are back in `Minesweeper-pro.css`. The HTML loads those files once each, as before, and no longer contains an inlined MineQuest renderer or its duplicated stylesheet. The retained help and sound controls moved with the renderer.

### Verification

- All 33 nonempty inline/external game scripts passed local JSX conversion where needed and `node --check`.
- All 67 inline/external style sources parsed without esbuild CSS warnings; all 112 hover rules remain scoped to hover-capable media conditions.
- Peg Jumper's initial-render regression test and all six board-selection checks passed after the fix.
- Node server-render checks passed for 2048's initial board, closed phone setup and retained Undo, and MineQuest's external renderer with its 81-cell initial field and single JSX/CSS source links.
- AST comparison confirmed 20 original uppercase configuration arrays/objects in the six affected HTML games remain unchanged. MineQuest's authored configurations, profile key, and nine core functions also match the original external source.
- Targeted `git diff --check` passed.
- Lasers & Mirrors and `tools/screen-fit/capture.mjs` match their hashes from the start of Round 2. The laser validator was not rerun because the laser file was not touched. No Git write was performed.
- `games.json` changed concurrently during this round; this pass did not write it. Other jobs' work was left alone.

**Pending:** Claude's next real-browser capture, including phone board widths, Spelling Bee's scroll measurement, Peg Jumper's visible board/animation, and the external MineQuest load. The earlier dense-grid touch-target limitation remains documented; this round does not claim it was resolved.

### Files changed in Round 2

- `games/mini-games/PegJumper.html`
- `games/mini-games/2048.html`
- `games/mini-games/Minesweeper.html`
- `games/mini-games/Minesweeper-pro.jsx`
- `games/mini-games/Minesweeper-pro.css`
- `games/mini-games/2DTicTacToe.html`
- `games/mini-games/ConnectFour.html`
- `games/mini-games/SpellingBee.html`
- `docs/codex/screen-fit-2026-11-22/mini-report.md`

## Round 3 — visual polish across all eleven mini games

**Source pass ready for Claude's next capture.** Rounds 1–2 are the accepted base at `e51d161`. Inspected all 22 start/play sheets in `output/screen-fit/mini-verify2/`, each showing phone, iPad landscape, laptop, and iPad portrait. Those screenshots predate this pass. No browser, window, capture command, local server, network install, or Git write was used for Round 3. No new after-layout, overflow, FPS, or battery measurements are claimed.

### Shared finish

- Removed vertical centering from the normal phone game shells, putting the title shortly below the safe-area-aware Menu clearance. Portrait tablet layouts start at the top as well. The existing board fit observers still budget around the actual controls.
- Gave secondary controls a consistent dark, opaque surface; clear active states; a restrained radius family; visible keyboard focus; and short press feedback. Primary reset/new-round/submit actions use each game's accent. Labels and secondary text use 14px rules, primary actions 16px, and scores remain larger. Display headings retain the games' established fonts; body/control typography has consistent roles and fallbacks.
- Static vignette lighting replaces the decorative scanline/floating-particle/pulsing effects where applicable. Selection markers remain visible without blinking. Win/hint effects are bounded; reduced-motion rules remain. This is a source/performance hygiene change, not a device battery certification.
- Retained Menu layering, help, sound controls, game rules, authored content, difficulty settings, timers, and storage formats. No runtime Tailwind, new CDN, or library was introduced.

### Per-game polish and what I would still change

| Game | Polished in Round 3 | Remaining / next visual refinement |
| --- | --- | --- |
| Tic Tac Toe | Top-aligned phone play, quiet theme controls, consistent setup buttons, a framed stats strip, beveled acrylic-looking cells, and a softer neon treatment. Selected themes and X/O identity remain. | Check long player names and all win/draw overlays in the new shots. Ultimate's dense phone grid still needs the previously noted precision-input design; visual polish does not solve that constraint. |
| Code Breaker | Kept Duplicates, its switch, and On/Off together as one unbreakable group; the switch retains a full touch area around a smaller visual track. Identical combo/status text is rendered once. Palette/guess pegs have edge light and contact shadow. History has a ruled tray surface. Portrait tablet puts the input above the history instead of pinning it to the bottom; records have an explicit grid position. | Review a full history, an expanded notepad and Code Maker on phone. If the maker's extra controls remain crowded, a dedicated setup disclosure would be the next layout change. |
| Lasers & Mirrors | Replaced the desktop white Tools button with matching dark chrome, made Fire the clear primary action, raised HUD labels to 14px, and finished the inventory, tool, help, level/victory and lab controls with consistent edges and press states. Removed the decorative DOM-star emitter and ambient HUD shimmer. | Check the longest late-level names and open Tools at phone size. Further idle-power work on the canvas renderer would be separate from this chrome-only scope. No optics, canvas fitting, level coordinates or mirror budgets changed. |
| Lights Out | Added molded-cap edges, highlights, inset seams and contact shadows over the existing on/off colors. The frame has a physical lip; hint markers remain explicit but stop pulsing continuously. Controls are quieter and labels larger. | Tune bloom strength from the actual new captures across all four color themes. Large custom grids retain the earlier dense-target limitation. |
| Peg Jumper | Added a generated dark hardwood surface, rounded glass-like pegs and recessed wells. Staggered nine-column triangle layouts now have equilateral-style row spacing rather than a squat triangle, using more portrait height; board indices and legal moves are unchanged. The moving peg uses its measured displayed diameter at both endpoints, with the existing jump timing retained. | Inspect all six shapes and a jump on each device. I would tune grain strength and the glass rim only from those captures; wide rectangular boards remain constrained by their shape rather than being stretched. |
| Spelling Bee | Added enamel-like purple/gold hexes with edge light, stronger text contrast in dark/light themes, a consistent control family, clearer current-word type, and 14px secondary labels. Retained the honeycomb fit calculation and its 48px minimum hex width. | Check long accepted words, an expanded word list, light theme and definition tooltips. Those are the next places I would adjust spacing if the new captures show crowding. |
| 2048 | Wrapped all six mode chips instead of clipping the strip. Portrait tablet uses the same quiet setup/records disclosures as phone so the board can take more width/height. Added raised tile edges, recessed slots and contact shadows; Classic Wood gets the generated wood texture. Rendering now selects a contrasting number color without changing tile values or background colors. | Review five-digit tiles, all six modes, and Classic Wood on a physical iPad. I would adjust the wood's tint only after seeing the new material in the browser. |
| Connect Four | Added a molded blue chassis, dark recessed holes, raised discs with concentric ridges, edge light and contact shadows. Winning discs keep a persistent outline after a brief animation. Turn status and setup share the quieter control style. | Check the wider variants and long names in the next shots. An optional embossed player symbol on discs would be a separate accessibility/art refinement. |
| Snake | Added a glass-like grid frame, restrained pixel highlights and food sheen. Grouped mode/mission/skin setup into a portrait disclosure while keeping effects, score and pause visible. Removed the idle scanline animation. | The supplied play sheets are paused, so inspect active play in every skin next. Head/food edge definition is the material detail I would tune from those shots. |
| Minesweeper | Added tactile field caps, a machined-looking frame and distinct inset revealed cells. Labels are 14px; cell numbers have a 16px minimum. Extended the compact title/options/mark layout to portrait tablets and top-aligned the shell. Help/sound and the single external JSX/CSS sources remain. | Dense late adventure boards still need precision navigation or zoom to meet the earlier touch-target goal. Check the power-up row and large score values at phone width. |
| Memory Match | Added generated card-stock texture, printed-back borders/patterning, brighter paw emblems, paper-like fronts, card edges and contact shadows. Flip presentation is 220ms; matching timers and rules are unchanged. | A dedicated animal-art pass could replace the existing emoji faces with printed illustrations; that content/art substitution is not included here. Check face-up recognition in Expert/Huge and the final-win overlay. |

### Generated local material assets

Used the built-in `image_gen` tool, not the API/CLI fallback. Generated two original texture images: dark hardwood and ivory card stock. Reused the hardwood image for Peg Jumper and 2048 Classic Wood. Converted project copies with macOS `sips` to 768×768 JPEG at quality 75; inspected the compressed images. Original generated PNGs remain in the tool's default generated-images directory.

| Saved project asset | Bytes | Exact prompt / provenance |
| --- | ---: | --- |
| `games/mini-games/PegJumper-assets/ebony-board-r3.jpg` | 101533 | `games/mini-games/PegJumper-assets/ebony-board-r3.prompt.txt` |
| `games/mini-games/2048-assets/classic-wood-r3.jpg` | 101533 | `games/mini-games/2048-assets/classic-wood-r3.prompt.txt` |
| `games/mini-games/MemoryMatch-assets/card-stock-r3.jpg` | 105630 | `games/mini-games/MemoryMatch-assets/card-stock-r3.prompt.txt` |

The three project images total **308696 bytes**. Each prompt file preserves the full generation prompt and conversion settings. Textures are local CSS backgrounds with solid-color fallbacks; game initialization does not wait for them.

### Verification actually run

- Local JSX conversion where required followed by `node --check`: **33 scripts passed**.
- esbuild/PostCSS source checks: **81 style sources parsed without warnings; 123 hover rules are media-scoped**.
- `node games/mini-games/validate-laser-levels.mjs`: **all 20 levels passed** at every board size it checks.
- AST comparison: **39 authored configuration arrays/objects unchanged**. Laser scripts match HEAD after excluding only the decorative DOM-star emitter, confirming that optics, fitting and interactions were left alone.
- Node React first-render checks passed for Peg Jumper, 2048 and the external MineQuest renderer. All six Peg Jumper level-selection checks passed with the expected row/column counts, peg counts and one empty hole. A rendering check confirmed that a measured 72px moving peg stays 72px at both centered endpoints. These are runtime/component checks, not browser animation verification.
- Code Breaker status reproduction: HEAD rendered identical “Good Guess!” text twice; this source renders it once. Different combo and status messages are still both retained. The reducer and feedback calculations were not changed.
- Independent Python WCAG calculations against 42 actual 2048 tile/theme render samples found **15 below 4.5:1 before** the foreground fix and **zero afterward**. Fourteen declared normal/primary control text pairs also passed, with a minimum ratio of **5.53:1**. These checks cover the declared colors, not every composited pixel, theme state, hover state or disabled element in a screenshot; a full rendered contrast audit is still pending.
- Material paths resolve, compressed dimensions were checked, and targeted `git diff --check` passed. `capture.mjs`, `games.json`, MineQuest's HTML loader and its JSX are unchanged in this round. Other batches' files were left alone.

**Next capture priorities:** phone title clearance and 14px label wrapping; iPad portrait Peg Jumper/2048 board height and Code Breaker's reordered input/history; six uncut 2048 chips in landscape; physical pieces and light-theme contrast; and Menu access above every overlay. No new rendered measurements are supplied in this report.

### Files changed in Round 3

- `games/mini-games/2DTicTacToe.html`
- `games/mini-games/CodeBreakerV4.html`
- `games/mini-games/lasers_mirrors_game.html`
- `games/mini-games/LightsOut.html`
- `games/mini-games/PegJumper.html`
- `games/mini-games/SpellingBee.html`
- `games/mini-games/2048.html`
- `games/mini-games/ConnectFour.html`
- `games/mini-games/Snake.html`
- `games/mini-games/MemoryMatch.html`
- `games/mini-games/Minesweeper-pro.css`
- The three JPEGs and three prompt files listed above.
- `docs/codex/screen-fit-2026-11-22/mini-report.md`
