# MAKER-Codex · Qwen six-game quality pass

Base: `cf2af19`. Branch: `codex/daily-elite-qwen-2026-10-28`.
Scope: six `games/qwen-*` folders and this report/its root-requested QA module.
No shared runtime, published puzzle bank, catalog, native resource, deployment, service, device, model, or infrastructure changes.

## Individual findings and choices

| Game | Concrete change | Preserved behavior and reason |
| --- | --- | --- |
| Quadra | Editing in the middle of a typed word retains the insertion/selection positions after the renderer replaces the input. Uppercase/filter normalization maps the caret to the displayed letters. A rejected unavailable letter retains the valid selection, with the existing precise message and no submission penalty. | Separate duplicate-letter tiles, four misses, category membership, four-word target, tile locking, hint assistance and persisted tile IDs already have strong engine checks. Retained them. |
| Logic Lattice | Focused squares accept B black / W white / U unknown as a single undoable mark. The usual tap cycle stays available. Row/column clues show a visible ✓ or !; diagonal clues also name complete/impossible, so color is not the only visual status signal. On-board instructions explain the controls and symbols. | All squares still require explicit black or white; matching a black total does not auto-fill whites. Givens, clue totals, unique solutions, history limit, hint cost and assistance persistence stay unchanged. Direct marking cannot edit a given or terminal board. |
| Syntax Siege | A real timer expiry announces the 20-HP impact, selection clearing, and same-wave clock restart once. Restoring a state does not invent a new impact. Selected rack tiles show their order, including duplicate letters. Fire labels name damage; fired-word receipts distinguish damage from squared-length score. Visible keyboard directions explain typing, Backspace and Enter. | Six fixed waves, prepared word lists, 20 seconds, 100 HP, 10-HP miss/20-HP timeout, score formula, repeat-word behavior and assist/practice timing remain. Shared help/hidden pauses already work and were regression tested; no timer/difficulty changes. |
| Memory Maze | The actual study→recall transition announces recall and focuses the already-known start, or the last correctly retraced cell after replay. Arrow keys navigate the visible board independently of the solution, skip blocked cells, and stop at row edges. Enter retains normal button activation. | The entire six-second study and assisted replay, correct-prefix preservation, +2-second mistakes, recall score, obstacles and all route IDs remain. Navigation does not select a square or add misses, and it does not expose the next unknown route cell. |
| Pattern Prism | A–D shortcuts activate the four labeled choices. Held-key repeats are ignored to prevent answering a second prediction inadvertently. A rejected choice leads focus to the next enabled option; an accepted answer leads to the new numbered prompt, which labels its group. | Four independently cycling attributes, named color/size/direction, exact example order, distinct-miss counting, two hint stages and terminal rule explanation remain. No extra hint or answer exposure was added. |
| Territory Tactics | After two unsuccessful placements, empty hexes become disabled and focus moves to Undo placement. The existing explicit retry note stays visible. Undo re-enables placements. This removes controls that appear usable after the move budget is exhausted while preserving unlimited investigation. | Two-placement capture objective, whole-group liberties/captures, self-capture restriction, prepared boards, free Undo/Restart, hint recovery and nonterminal dead ends remain. There is still no arbitrary timer or loss penalty. |

## Verification and limits

The new renderer/engine DOM tests first failed against the original source for each missing behavior. The first eight showed the caret jump, absent direct marking/symbols, absent expiry announcement, missing recall handoff, missing Prism focus/shortcuts and active exhausted hexes. A ninth regression then reproduced held-key advancement before the repeat guard was added.

The harness captures only `mountDailyGame`, then executes the actual game renderer with its real puzzle and engine, a real jsdom document, restorable commits, clicks, keyboard events and input selections. It does not start a browser, shell timer, server or storage. Existing shared-runtime tests cover the actual timer shell pause/disposal contract and first-terminal/storage safeguards.

Final relevant suite command (dependency already installed; no download):

```sh
NODE_PATH=/Users/jamesalford/Documents/Codex/2026-10-27/task/alford-daily/packages/kimi-pebbles/node_modules \
node --test games/qwen-*/*.test.mjs games/deepseek-runtime/*.test.mjs \
  scripts/imported-expansion.test.mjs scripts/collection.test.mjs
```

Final relevant result: 92 tests, zero failed/skipped. The suite covers all prepared Qwen boards, compatible intermediate saves, terminal/reveal distinction, original-bank hashes, deterministic daily assignments, interruption pauses, first-terminal persistence and catalog/creator preservation. JavaScript syntax and Git whitespace checks also passed before commit.

No browser was launched by this worker. Actual Chromium/WebKit phone layout, hit targets, focus behavior under the integrated shared shell, reload/offline/native parity and visual inspection belong to root's serial acceptance run. In particular, a dense 7×7 Memory Maze remains a compact grid on narrow phones; jsdom provides no layout/hit-target certification. These tests are source-assisted QA, not blind human difficulty/editorial acceptance, physical-device testing or content-rights clearance.

## Fixed-date real-control QA

Executable recipe: `docs/reviews/MAKER-Codex__elite-qwen-qa.mjs`, exporting `playGame(page,slug,{checkpoint})`. Root supplies a fresh isolated daily at `2026-10-28T18:00:00Z` (Central date October 28), navigates to `/games/<slug>/`, and owns the browser/clock. The function derives the exact dated puzzle and solution from the unchanged source, performs actual locator clicks/fills, calls `checkpoint()` after useful unfinished progress, then continues through fresh locators. No hidden-state injection or evaluation is used to make moves. Memory study uses `page.clock.runFor(6000)`.

Root installs and pauses its clock at `2026-10-28T18:00:01Z` before play, advancing it only with explicit `runFor` calls. This keeps timed save/reload comparisons deterministic. The Siege win uses the normal timed daily without selecting untimed assist. Test its expiry separately with the same visible controls and explicit clock advancement.

All six dated puzzles are source-bank index 35 (zero-based):

| Game / dated puzzle ID | Real-control success recipe | Checkpoint and terminal evidence |
| --- | --- | --- |
| Quadra / `quadra-036` | Fill `#quadra-word` and click `#quadra-form button[type="submit"]` for HORN, AXLE, GEAR, RIMS. For a duplicate-entry check, type `RI`, insert R in the middle to get `RRI`, and inspect three distinct selected tiles/caret before Clear; do not submit this draft. | Reload after HORN: one found word, its four tiles locked, three words unsolved. Finish: four found words, zero misses; `#result` visible and all board input disabled. |
| Logic Lattice / `lattice-036` | Solution rows: `10101 / 01110 / 11000 / 01001 / 10100`, where 1 black and 0 white. Givens: indices 0,5,9,19. For every other `[data-cell="i"]`, one click marks black and a second white; alternatively focus then B/W. | Reload after first non-given mark. Undo should clear that one action. Finish all 25 cells: all 12 clues satisfied, ✓ markers and saved win. Verify that black totals alone leave unknown squares unfinished. |
| Syntax Siege / `siege-036` | Click `#siege-start`. Rack indices by wave: SPRING `2,4,0,5,1,3`; RESCUE `4,0,5,1,2,3`; BRIGHT `3,4,1,2,0,5`; LISTEN `2,0,1,4,3,5`; FOREST `1,4,0,5,2,3`; MARKET `3,1,4,2,5,0`. Click each `[data-letter="i"]`, then `#siege-fire`. Keyboard typing each word followed by Enter is also supported after Start. | Reload after wave 1: wave 2 active, SPRING recorded once, 100 HP and remaining clock retained. Finish: 6/6 waves, 100 HP, 216 points. Separate timed check: Start without assist, open Help and advance clock, close Help, then expire the clock; core becomes 80 HP, same wave returns to 20 seconds and announces the impact once. |
| Memory Maze / `maze-036` | Click `#maze-start`, advance clock six seconds, then click `[data-cell="i"]` in order: `37,36,35,28,21,22,29,30,31,38,39,40,33`. | Reload after 37,36: correct prefix and recall time retained; no route numbers on unseen cells. During study, Help/hidden time must not spend study seconds. Finish: 13 squares remembered, no misses. A wrong clear cell adds exactly +2 seconds and leaves the prefix intact; replay pauses recall and shows the path for the full six seconds with assistance recorded. |
| Pattern Prism / `prism-036` | Click `[data-choice="3"]`, then 2, then 1 (D,C,B). Letters D,C,B are equivalent while a board control/prompt is focused. | Reload after D: prediction 6 completed, prompt 7 pending. For recovery, A on the first step is wrong and disabled; its miss remains after reload. Accepted choices focus the next prompt. Finish: three predictions and the full rule explanation. |
| Territory Tactics / `territory-036` | Click `[data-hex="-1,1"]` then `[data-hex="-1,2"]`, equivalent to `#territory-hex-4-2` then `#territory-hex-5-2`. | Reload after first placement: 1/2 moves, still unfinished. Finish: at least four captured stones in two placements. For dead-end recovery before solving, place `0,-2` then `1,-2`; empty hexes disable, Undo receives focus, no loss is recorded. Undo or Restart restores investigation. |

Every completed recipe returns `{puzzleId,terminalSelector:'#result:not([hidden])',terminalText,assistance:'source-assisted'}`. After a terminal result, reload must retain it, support hint/reveal must stay disabled, and `#game-share` must be visible. Shared reveal safeguards should be exercised on fresh isolated games so source-assisted wins are not overwritten.
