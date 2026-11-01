# Ten playable replacement candidates

Built November 1, 2026 in an isolated experiment. James chooses the keepers and final names. These prototypes have not been added to the Alford Daily catalog, ranking, runtime, or iOS app. No main-checkout file was edited.

Open `index.html` directly, or serve its exact contents as an HTML response in an existing test tab. It is one self-contained file: no asset URLs, fetches, CDN, account, server, build dependency, paid service, or download is needed to play. The blue/teal UI uses native system fonts, touch buttons and ordinary keyboard-operable controls. Candidate 01 also accepts arrow keys when focus is outside controls. Reduced motion is respected.

Start with **Candidate 01, 07, 10 and 09**. They add the most different decision structures to the present collection. This is my playtest order, not a ranking supplied by James or evidence that any candidate is a keeper. Human enjoyment, first-time comprehension and comfortable difficulty remain pending.

The inspected baseline has 32 daily games plus its bonus. Its catalog, review queue, ranking and detailed Sideways/Hunch/Circuit notes were read. The new set deliberately avoids word guessing, word ladders, anagrams, synonyms and Letter Boxed-style chains. These are original implementations and combinations for this experiment; the broad genres have precedents. No first-ever mechanic, exhaustive prior-art search, trademark clearance or universal originality is claimed.

| Candidate | Distinct hook and first action | Difficulty and replay | Sharing appeal and viability |
|---|---|---|---|
| 01 | Two separate frictionless worlds receive the same arrow command. Move both discs onto their own goals simultaneously. Tap an arrow and see two different consequences. | Exact shortest paths span 7–12 commands. The player must plan interactions between wall layouts. Any move can be undone. Different geometry and goals on 182 editions. | Compare total moves and undo counts on the same edition without exporting either board or the route. Strong first test for James: little reading, substantial planning. Risk: must communicate the two-world behavior clearly. |
| 02 | Five numeric pulse strips add into one visible target skyline. Shift a strip; watch all eight column sums respond. | Every prepared edition has exactly one assignment of strip positions. Minimum shifts from the initial left alignment span 10–20. Target/current differences are visible. | Share action totals while withholding target/profile values. Feasible daily composition puzzle. Risk: number juggling and incremental shifts may feel more like work than discovery; blind testing should decide. |
| 03 | A small tangled graph changes when two anchor discs swap. Remove every crossing; shared endpoints are allowed. | All editions require exactly three swaps, proved by checking every shorter sequence. The initial embedded graph is varied, with rotational/reflection equivalents removed. | Very quick, visual before/after satisfaction; result exports no graph. Risk: a three-swap snack may still be too brief for James given his Ringcount/Sideways feedback. Do not increase a numerical claim of difficulty based on solver search alone. |
| 04 | Six arithmetic keys are consumed once each. Their order must produce one exact target, with a live calculation tape. | Exactly one legal six-operation permutation reaches each target. Whole-number intermediates must stay in 1–199. Reverse and half have explicit constraints. | Compare thinking/actions without sharing the equation. A compact numerical lane with no dictionary maintenance. Risk: mental-arithmetic preference is polarizing; operation ordering alone does not prove enjoyable difficulty. |
| 05 | Pack five tetrominoes into a daily silhouette. A dot marks the placement anchor; orientations include rotations and mirrors. Tap a piece, turn it, and place its anchor. | Constructive exact-cover certificates prove every silhouette tileable. Multiple valid tilings are accepted. Holes and piece multisets vary; symmetrical boards are deduplicated. All 182 witnesses also finish through real UI click handlers. | Tactile, readable shapes; share only finished status and attempt totals. Familiar genre, useful comparison candidate. Risk: no uniqueness promise, drag support or optimal-placement score. The original bounding-box anchor problem was fixed before handoff. |
| 06 | Order six weighted artifacts using a small set of sum and relative-position clues. Tap two artifacts to swap. | Independent enumeration of all 720 orders proves one answer on every edition. Check is explicit; it shows which clues agree. Undo remains available. | A quick deduction result without showing the order or clues. Feasible, inexpensive to generate. Risk: closest to generic ordering logic; no measured difficulty curve and some clue sets are short. |
| 07 | Three taps inject energy into a finite cascade. At four charges a cell fires into its neighbors. Wake all sixteen cells. | Every edition is solvable in exactly three pulses; no one- or two-pulse solution exists. Repeated taps are legal. Boundary energy escapes, so cascades terminate. Live charge counts, fired checkmarks and brief cascade flashes explain the reaction. | A compact chain-reaction finish that is easy to compare without revealing the tap locations. Strong candidate for a more physical daily ritual. Risk: spatial consequences may be hard to predict at first; animation is feedback, not a calibrated tutorial. |
| 08 | Set angle and power to land inside three zones under different constant wind pushes. Launch, read short/long feedback, adjust. | Turn-based discrete ballistics; every stage has a reachable solution. No motor timing or countdown. Three clean shots complete a round; retries remain possible. | Shot counts and bullseyes have obvious comparison appeal. Feasible skill practice, with a deliberately simplified physical model. Risk: binary adjustment can become routine, and 182 numeric setups do not prove six months of fresh-feeling play. |
| 09 | Draft from one shared pool against a rival that plans every remaining pick. Both sides pursue their displayed two-resource targets. Denial matters. | Exact minimax supplies the rival. Every prepared hand gives a perfect-play human winning margin of 1–5. Lower final target distance wins; a poor pick can still lose. Undo restores the complete human/rival turn. | Win/loss and action totals are spoiler-free; targets, cards and picks stay local. Strong contrast with the existing solitaire puzzles. Risk: AI is intentionally exact and can punish a first-time player; casual difficulty is not calibrated. |
| 10 | Write six commands, then execute that same program three times. Collect beacons and arrive with the right facing. | Every prepared board has exactly one successful six-slot program among all 729 possible Forward/Left/Right programs. After a run, scrub its executed commands to inspect each loop and diagnose a block. | The compact program creates an explainable aha, while sharing conceals the program/map. Strong candidate for James’s harder-game request. Risk: programming notation adds onboarding cost and needs blind testing. |

Possible final names are only suggestions for James to choose, never product names assigned by this prototype:

| Candidate | Name options |
|---|---|
| 01 | Tandem / Dual Drift / In Step |
| 02 | Waveform / Counterwave / Overlap |
| 03 | Clearline / Uncross / Anchor Swap |
| 04 | Aftermath / Order of Operations / Six Keys |
| 05 | Inset / Silhouette / Exact Fit |
| 06 | Weighted Order / Relic Row / Between |
| 07 | Afterglow / Cascade / Three Sparks |
| 08 | Windline / Landing Zone / Loft |
| 09 | Shared Reserve / Denial / Counterdraft |
| 10 | Loopcraft / Repeat Route / Six Commands |

## Reproducible content and evidence

`bank.json` contains 182 prepared boards per candidate, 1,820 total, for consecutive dates **November 1, 2026 through May 1, 2027**. This exceeds six complete calendar months by one edition. Each record includes its seed, substantive identity and a concrete solution witness. `tools/generate-bank.mjs` regenerates the entire bank from local deterministic code. Existing editions are data in this artifact; adding future dates is intentionally separate from the main product’s dated schedule.

Freshness keys ignore display labels and IDs. They remove relevant equivalent presentations: common board symmetries/board swap for 01, time reversal and strip reordering for 02, circle dihedral symmetries and vertex labels for 03, shape/board symmetries for 05, artifact relabeling/order of clues and reversed positions for 06, grid symmetries for 07, card ordering for 09, and common grid/facing symmetries for 10. Arithmetic inputs/operation magnitudes, ballistic target/wind triples, and draft target/card multisets are gameplay data rather than cosmetic IDs. This is an engineering freshness definition, not proof that people will find every edition equally fresh or fun.

The full-bank audit passed **136,711 assertions**. Twenty Chrome pointer cases and 182 additional packing-handler cases passed. The independent audit checks all certificates and all promised uniqueness/minimum claims. It uses a separate slide BFS, geometric segment intersection test, arithmetic permutation evaluator, weighted-clue evaluator, deterministic ballistics formula, toppling order and program executor. Packing shape geometry and playable anchors are checked. Draft search is recomputed with the production exact minimax; legality, stored optimal continuation and final scoring are checked separately, but there is no independent second minimax implementation.

Current machine-readable results are in:

- `evidence/MAKER-Codex__generation.json` — bank counts, identity counts, par ranges and actual generator timings.
- `evidence/MAKER-Codex__audit.json` — full-bank assertion count and per-candidate results.
- `evidence/MAKER-Codex__browser-qa.json` — 20 Chrome cases: ten at 1440×1000 and ten at 390×844. Each completes using the actual pointer controls, reloads the result, undoes, checks sharing, studies an assisted solution and starts separate practice.
- `evidence/MAKER-Codex__packing-ui-qa.json` — all 182 packing certificates through actual DOM button handlers, with explicit checks against disabled anchors. The separate phone/desktop pointer cases cover geometry.
- `evidence/MAKER-Codex__candidate-01-phone.png` through `...-10-phone.png`, equivalent desktop captures, two gallery captures and the actual downloaded `MAKER-Codex__share-result.png`.

All tests use local files. Headless Chrome was authorized and run without visible tabs or a local listener. The initial restricted launch failed at the OS boundary; the authorized headless run completed. An early classic-script global collision (`top`) was reproduced in Chrome and corrected by isolating the bundle in an IIFE. No unrelated Chrome window or process was closed.

Reproduce from this folder:

```sh
node tools/generate-bank.mjs
node tools/build.mjs
node tools/audit.mjs
node tools/browser-qa.mjs
node tools/packing-ui-qa.mjs
```

The two browser scripts use the already installed Playwright module specified in the task. Nothing is installed. Node checks and the builder have no package dependencies.

## State, reversibility and sharing

Progress, the latest 80 saved undo positions and results stay in local browser storage under an experimental namespace. Daily and practice keys differ. Ordinary undo keeps cumulative move/check totals and increments the undo count. Reset restores the board while retaining attempt totals; it is itself undoable. Study a solution marks assistance permanently for that attempt and exposes that label in every result. Practice starts separately on the next prepared mix. A schema migration, concurrent-tab conflict resolution and production calendar integration are not implemented in this spike.

Share text and 1080×1350 PNG are created from a status allowlist: candidate label, edition, completion/assistance, move/check totals and undo count. Board, clues, targets, route, cards, program and solution data are excluded. Copy has an explicit manual-selection fallback when clipboard permission is unavailable. Native sharing is offered when the browser supports it. The actual PNG download was verified; no external message, Photos save, clipboard copy or native share send was performed during QA. There is no public URL or public deployment, so this demonstrates shareable results, not a hosted friend challenge.

## Handoff for the root agent

Runtime root: this directory. Runtime file: `index.html`. It has no required assets. Existing-tab routing can fulfill this file as `text/html` with no server. Keep it in the second existing visible tab if James wants to try it; do not add the candidates to the main catalog.

Start selectors: `[data-open="1"]` through `[data-open="10"]`; `#date` chooses any prepared edition; `[data-action="replay"]` starts a practice mix. `window.candidateLab.snapshot()` exposes only current visible state, kind/index/mode and undo-history length. It does not expose hidden bank solutions. The source-assisted QA reads its certificates from `bank.json` outside the browser.

Control selectors are documented concretely in `tools/browser-qa.mjs`: `data-action="dirN"`, `data-action="shiftROW:DELTA"`, `data-node`, `data-op`, `data-piece`/`data-cell`/`orient1`, `data-artifact`/`check-order`, `data-cell` for cascades, `#angle`/`#power`/`launch`, `data-draft`, and `data-command`/`data-slot`/`run`. Program run review is `#run-step`. Share opens `[data-action="share"]`, displays `#share-text`, downloads through `[data-action="image"]`, and closes with `[data-action="close-share"]`.

No physical phone, VoiceOver, touch hardware, long-session performance, Safari, Firefox, native iOS integration, public deployment or blind playtest is certified. Screenshots were inspected for rendering and readability; the root agent owns the requested visible-tab presentation. Whether these become keepers remains entirely James’s call.
