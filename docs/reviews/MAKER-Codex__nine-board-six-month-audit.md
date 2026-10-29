# Nine-board Tic-Tac-Toe: independent engine and AI audit

Date: October 29, 2026. This follow-up adds only `games/nested-tic-tac-toe/tests/six-month-audit.test.mjs` and this report. No production files changed.

The game is an unrestricted-play bonus game, not a dated puzzle bank. This audit checks rules, AI legality and bounded search, match completion, and history persistence.

## Independent oracle

The new test oracle stores a flat array of 81 marks and calculates lines from row/column coordinates. It does not import the engine's line table, result functions, move legality, move application, or history replay.

- Enumerated all **19,683** mini-board assignments over empty/X/O. Compared **19,371** assignments; excluded **312** assignments with simultaneous X and O lines, which cannot occur when a board closes on its first win.
- Enumerated all **262,144** macro assignments over open/X/O/draw. Compared **261,388** assignments; excluded **756** simultaneous-X/O-winner assignments. The oracle identified **11,125** terminal draws. Drawn macro cells never contribute to an X/O winning line.
- The resolver enumeration intentionally also covers some assignments that cannot arise under alternating play; it is a broader utility-function check, not a count of reachable matches.

## Every opening, both skills

For every one of the 81 opening cells, a seeded legal human policy played a complete match against each AI level: **162 matches** and **6,415 plies**.

At every ply, the test:

1. Compares the complete legal move list with the independent oracle.
2. Tries and rejects every forbidden coordinate, including occupied squares, closed boards, and routing violations.
3. Applies the selected move to the engine and oracle, then compares cells, mini-board claims, turn, routing, status, and history.
4. Freezes production input objects and confirms immutability.
5. Serializes a version-1 save through JSON, restores it, and compares the complete result against the oracle, including both guide-dismissed flag values.
6. Rejects a corrupted history suffix that attempts to replay the now-occupied move.
7. Checks that AI decisions are legal, within their reported node budgets, and take any available immediate match win. Initial AI decisions and every free-routing AI decision must reproduce exactly from a restored state.

Every terminal position rejects all 81 attempted moves, exposes no legal moves, and makes the AI return no move with zero searched nodes.

| Observed metric | Casual | Tactical |
| --- | ---: | ---: |
| Complete matches | 81 | 81 |
| Plies / per-ply save round-trips | 3,187 | 3,228 |
| Primary AI decisions | 1,592 | 1,614 |
| Maximum reported nodes in a primary decision | 68 | 1,414 |
| Match length, plies | 28–55 | 30–58 |
| Forced-routing positions checked | 2,442 | 2,839 |
| Free-routing positions checked | 745 | 389 |
| Nonterminal moves sent to a closed destination | 664 | 308 |
| Drawn mini boards across terminal positions | 3 | 1 |
| Available immediate AI match wins taken | 77 | 80 |
| Avoidable immediate-loss threats encountered and avoided | 76 | 0 |
| Human X wins / AI O wins / draws | 1 / 77 / 3 | 0 / 80 / 1 |

These outcomes describe this reproducible, nonstrategic human policy. They are not a calibrated difficulty comparison or an optimal-play claim.

## Defensive coverage

The tactical trajectories above did not encounter positions with both an immediately losing move and a safe alternative. The first audit run correctly failed a test-corpus coverage assertion; it did not expose an engine or AI failure.

A separate test now generates legal trajectories using only the independent oracle and deterministic moves by both players. It found **24 reachable defensive positions** after examining **16 games**. Each position has:

- At least one move allowing an immediate human macro win.
- At least one safe alternative.
- No immediate AI macro win that would bypass the defensive problem.

Production history replay independently confirms each position is reachable. Both AI levels choose a safe move in all 24 positions: **48 checked defensive decisions**.

## Reproduction and result

```sh
node --test --test-concurrency=1 games/nested-tic-tac-toe/tests/*.test.mjs
```

Result: **46 passed, 0 failed, 0 skipped**. This includes all existing engine, AI, and app-controller tests plus the five new audit tests. Observed full-suite runtime on this run: **15.7 seconds**.

No production defect was demonstrated, so no production change was made. The tests establish agreement with the stated rules across resolver enumerations and the sampled complete trajectories. They do not exhaust the full nine-board game tree, prove optimal AI play, benchmark UI response latency, or constitute browser/physical-device interaction testing.
