# Ten replacement candidates — compatible revision 2.1

This is the isolated, playable Alford Daily experiment. The focused 2.1 repair keeps the existing v2 schema, namespace and valid saves; no new progress reset is introduced. See [the focused adjudication](MAKER-Codex__REVIEW-ADJUDICATION-v2.1.md). James chooses the keepers and final names. The existing catalog, ranking, runtime and iOS app were not edited. `index.html` is a self-contained local gallery with no asset requests, server, accounts, telemetry or paid services.

Start with Candidate **01, 07, 10 and 09** as a subjective trial order. Human enjoyment, comfortable difficulty, originality relative to all published games, and keeper status remain unverified. The implementations are original to this experiment; the broad genres have precedents.

| Candidate | Hook |
|---|---|
| 01 | Two frictionless worlds receive the same directional command. Reach both goals simultaneously. Exact shortest paths span 7–12 moves. |
| 02 | Shift five numeric pulse strips until their sums form one exact wave. Unique assignments; explicit one-beat buttons. |
| 03 | Swap two anchors to untangle a small planar graph. Every current board has a proved three-swap solution; that constant is intentional and not a varying difficulty score. |
| 04 | Consume six arithmetic operations once each, in the only order reaching the target. A live calculation tape shows every intermediate value. |
| 05 | Pack five tetrominoes into a daily silhouette. Marked anchors, turns/mirrors, and multiple valid tilings. |
| 06 | Order six weighted artifacts using sums and positional relationships. Exactly one arrangement fits every clue. |
| 07 | Use three pulses to wake all sixteen cells through finite energy cascades. Repeated taps are allowed. |
| 08 | Set discrete angle and power to hit three landing zones under a constant wind push. No reaction timer; successful paths remain visible until Next target. |
| 09 | Draft against an exact rival from one shared pool while both sides pursue different two-resource targets. Lower final distance wins. |
| 10 | Write six commands and repeat that program three times. Collect beacons, finish at the goal and face correctly. Scrub the executed run to inspect it. |

The historical [revision-1 report](MAKER-Codex__REPORT-v1.md) preserves detailed design rationales and possible name options for James. Its old storage/study behavior and old test totals are historical, superseded below.

## Daily, practice and saved progress

The original `bank.json` remains byte-for-byte unchanged: 182 Daily editions per candidate, November 1, 2026 through May 1, 2027. None of its Candidate 06 boards starts solved. A guard now rejects already-solved Candidate 06 output for new generation; all existing Daily seeds still reproduce exactly.

`practice.json` adds 182 independently generated practice editions per candidate. Every practice substantive identity is disjoint from every prepared Daily identity for that candidate, and practice identities are unique within their own pool. There are 3,640 prepared boards across both pools. Replay cycles through a finite separate practice pool; it does not promise unlimited novelty.

Daily controls permit dates on or before the current Chicago date, within the prepared range. An invalid date is rejected and the visible picker is restored to the played edition. Opening any game from the gallery resets to today's Daily. A date outside the prepared range shows an honest unavailable screen with a practice option. An open board is retained across a date rollover, with an explicit button for the new Daily. These are UI protections: all offline puzzle data are bundled, so this is not a tamper-proof anti-cheat boundary.

Practice has an explicit Resume practice control. Opening practice from Daily returns to that selected mix instead of replacing the resume pointer with mix 1; only Next practice mix advances it. Revision 2 uses a new `MAKER-Codex-candidates:v2` storage namespace, visibly labeled in the UI. Revision-1 progress is neither read nor written; it remains available if the prior build is restored. This is deliberate prototype isolation, not a claim that old saves were migrated. No user's visible-tab storage was accessed during testing.

Revision-2 saves bind schema, kind, seed, substantive board identity, and the played daily date or practice seed. `state.mjs` validates and reconstructs each kind's data, legal coordinates, permutations, operations, masks, shots, placements and derived run records. The first terminal outcome also carries a validated board witness. Counters must be bounded integers. Histories must be arrays of at most 80 valid positions. Mismatches and malformed saves recover to a fresh board with a visible warning. The original record remains untouched on opening. Before any recovery write replaces it, an exact verified quarantine copy is stored; if that backup fails, the original is not overwritten. Render-failure recovery follows the same rule. Persisted text is not trusted as markup.

## Study, results and counters

Study requires a visible confirmation. Revealing a solution during play marks the attempt assisted, but does not install a completed board, fabricate launches, or set a winning status. Candidate 01 shows the actual sequence of arrows and both positions after each command; Candidate 07 shows the actual three pulse coordinates. All ten reveal their real starting-board certificate.

The first honest terminal result and its metrics are retained. Studying after an unaided win reports **Solved, then studied**; studying after an actual loss reports **Rival won, then studied**. Reopening/resetting a finished board does not rewrite that first result. The on-screen result card and shared text both label the retained first result. The current board is labeled separately as a replay after an undo/reset or later finish, including a loss followed by a winning replay. Ongoing assisted play says **In progress**, including after undo/reset; it never says Assisted finish.

Undo and reset have separate counters. Both retain cumulative attempted moves and checks. Post-terminal Check/Run actions are visibly disabled and guarded. Candidate 10's move count combines slot edits and runs; its six-slot metric describes program size, not a move par. Share text and PNG use a result allowlist and include no routes, clues, targets, picks, placements or programs. The actual PNG export works with or without Canvas `roundRect`; practice filenames use the played practice mix. No external share/send or clipboard write was performed by QA.

## Input, accessibility and feedback

A persistent live region survives rendering. Stable controls retain focus after changes, with per-kind fallbacks when a control is disabled or replaced; independent detail panels retain open state and summary focus; unchanged date checks retain the existing banner button; aim sliders and the program scrubber update continuously on `input` while keeping the same range element mounted. Actual pointer-drag feedback and keyboard focus were tested. Candidate 01 arrow shortcuts work even while a board button has focus. Shortcuts ignore Ctrl/Meta/Alt, IME composition and editable contexts. Arithmetic supports keys 1–6; programming supports F/L/R and slot keys 1–6. Ordinary native button keyboard access remains available.

Boards have role-bearing labels, the graph exposes adjacency in both node labels and a text list, and packing pieces expose their shape and oriented cell coordinates. Candidate 08 states the numeric landing zone and bullseye distance in text and in the SVG's accessible description. These changes were checked in the DOM; no physical screen reader or assistive-technology certification is claimed.

Candidate 02 strips are now noninteractive visuals; only large explicit one-beat arrows shift them. The arrows meet 44×44px at tested widths 320, 375 and 390px. Profile anchors are labeled, bar heights remain proportional, and phone metrics stay visible. At narrower widths, artifact and program controls wrap to preserve usable targets. Lifting a packing piece preserves its placed orientation; selecting a different piece does not accidentally lift an occupied one. Cascade sparks occur for the current pulse and do not replay on undo or unrelated rendering. Successful aiming paths remain visible until the player advances.

## Verification and reproducibility

Machine-readable results are the source of exact totals:

- `evidence/MAKER-Codex__audit.json`: full unchanged Daily-bank solvability, uniqueness/minimum, freshness and **every-seed** deterministic reproduction checks.
- `evidence/MAKER-Codex__practice-audit.json`: the same checks for all practice boards.
- `evidence/MAKER-Codex__state-qa-v2.json`: per-kind save validation, malformed/XSS values, identity/date mismatches, first-outcome semantics, disjoint pools and unchanged Daily-bank digest.
- `evidence/MAKER-Codex__focused-review-baseline.json` and `...focused-review-repaired.json`: all eleven focused follow-up groups were observed failing against v2, then passing after repair. They cover eight review findings plus separate recovery/quota branches. `...v2-save-compatibility.json` records the unchanged schema/engine/bank hashes.
- `evidence/MAKER-Codex__review-regressions-v2.json`: actual headless Chrome regressions for the demonstrated review issues, including real pointer dragging, an actual draft loss, old-save preservation, piece lifting and ephemeral cascades.
- `evidence/MAKER-Codex__browser-qa.json`: ten completed pointer flows at desktop and ten at phone size, including reload, undo, confirmed study with first-result retention, separate practice and real PNG export.
- `evidence/MAKER-Codex__packing-ui-qa.json`: all 182 original Daily packing certificates through the actual DOM handlers; the test clock is set after the prepared dates instead of bypassing the date gate.

The content audit uses separate slide BFS, geometric crossing checks, arithmetic and order enumeration, shape geometry, toppling order, ballistics formula and program executor. The drafting audit still recomputes production minimax rather than using a second independent minimax implementation; that limitation remains explicit. Assertions and static reviews do not prove universal fun, calibrated difficulty or first-time comprehension.

```sh
node tools/generate-practice.mjs
node tools/build.mjs
node tools/audit.mjs
node tools/audit.mjs practice.json
node tools/state-qa.mjs
node tools/review-regressions.mjs
node tools/focused-v2-qa.mjs
node tools/browser-qa.mjs
node tools/packing-ui-qa.mjs
```

The browser scripts use only the already installed Playwright specified by the parent task. They launch headless Chrome in isolated contexts; no listener, visible tab, existing browser profile or user save is opened by this subagent. The root agent owns refresh of the existing visible second tab, after notifying James.

Physical phone, Safari/Firefox, VoiceOver, long sessions, production multi-tab synchronization, native iOS integration, public deployment and blind play remain pending. The main catalog is untouched.
