## Review result

I inspected all 32 daily games and the nine-board bonus using only file reading/search. I did not execute code, run tests, use a browser, or access the network. Runtime conclusions below are therefore **reproduced by source reasoning**, while the supplied test results remain **author-run evidence**.

### Prioritized findings

1. **P1 — Kimi daily progress can be overwritten by a stale tab**  
   **Type:** Reproduced-by-reasoning correctness defect; affects all six Kimi games.

   The hooks save daily state but only listen for date rollover, not `storage` events or write conflicts. For example, Hunch persists at `packages/kimi-pebbles/src/games/hunch/useHunch.ts:126-140`, while its only external listener is rollover at `useHunch.ts:142-155`. The same pattern appears in Cairn at `useGame.ts:214-228` and Circuit at `useCircuit.ts:115-143`.

   Concrete failure:
   - Open the same Hunch daily in tabs A and B.
   - A submits `DRAIN`; storage now contains that guess.
   - B, still holding the empty state, submits `PRIDE`; its effect writes only `PRIDE`, silently discarding A’s guess.
   - After A wins, B can still submit and overwrite the board. The unified ledger preserves the first terminal status at `shared/integration.ts:111-116`, so the home can report **won** while B’s board displays **lost**.

   **Fix:** Add cross-tab synchronization and a write-boundary snapshot check to every Kimi hook. Adopt newer valid state before mutation, make the first terminal result final for both UI and input handling, and reconcile statistics from durable day records. Add a two-controller regression test analogous to the existing original-game stale-tab tests.

2. **P1 editorial — Legacy Splice slurs remain in the new six-month schedule**  
   **Type:** Scheduled-content concern, not an engine defect.

   The expansion excludes these words only from newly generated boards, while preserving the old records (`docs/reviews/MAKER-Codex__six-month-claude.md:26`). Consequently:
   - `splice-8`, containing `midget`, is scheduled for **2027-03-06** at `docs/six-month-runway.json:30580`.
   - `splice-24`, containing `redskins`, is scheduled for **2027-03-22** at `docs/six-month-runway.json:30676`.

   Both records are visible in `games/claude-splice/puzzles.mjs:5`; the exclusion metadata at line 10 does not remove them from rotation.

   **Fix:** Preserve historical records and IDs as required, but add an editorial exclusion set when constructing `FRESH_ROTATIONS`. Replace these future selections with unused substantive boards, then regenerate the calendar evidence.

3. **P2 — Historical-preservation evidence omits all six Kimi games**  
   **Type:** Evidence gap; not proof that Kimi assignments changed.

   The baseline contains only 26 games (`docs/six-month-previous-calendar.json:5-6`). The verifier treats a missing baseline entry as success:

   ```js
   const historicalAssignmentsPreserved =
     !previous || hash(...) === previous.sha256;
   ```

   See `scripts/verify-six-months.mjs:18-22`. Thus the reported 7,852 comparisons are `26 × 302`, not all 32 games. Nevertheless, Kimi rows such as Cairn say `historicalAssignmentsPreserved: true` at `docs/six-month-runway.json:8851`.

   **Fix:** Add the six Kimi selectors and their 302 historical assignments to the baseline, and replace `!previous || …` with `assert.ok(previous)` so missing evidence cannot pass silently.

4. **P2 editorial — Kimi Tangle accepts substantial nonword/abbreviation content**  
   **Type:** Fairness and content-quality concern.

   The first board alone accepts strings including `ccm`, `ccw`, `cfm`, `whf`, `icica`, and other opaque abbreviations (`packages/kimi-pebbles/src/games/tangle/data/puzzles.json:1`). Submission checks only membership in that board’s list (`useTangle.ts:181-185`). The supplied full-bank test verifies that listed strings have legal paths and that scores recompute (`tests/six-month-logic.test.ts:65-85`); it does not establish that they are fair or recognizable words.

   **Fix:** Apply a human-reviewed allowlist to every grid, remove abbreviations/nonwords and unsuitable names, then recompute `n`, `max`, and medal reachability and rerun the path checks.

## Six-month claim assessment

The selector design is substantially sound in source:

- The window is correctly 182 days, 2026-10-29 through 2027-04-28.
- Non-Kimi rotations preserve the current board, skip already-seen substantive identities from 2026-10-30, and retain historical modulo behavior (`scripts/build-six-month-calendar.mjs:13-22`, `games/deepseek-runtime/daily-rotations.mjs:6305-6318`).
- The audit loads the real non-Kimi selectors and bundles the TypeScript Kimi selectors (`scripts/daily-audit-lib.mjs:39-60`).
- The checked-in report claims 182 distinct scheduled identities for every game and 5,824 total selections.

Important qualifications:

- I did **not** independently execute those selectors or recompute the hashes.
- Kimi historical preservation is unproven for the reason above.
- “Substantive uniqueness” is mechanic-level fingerprinting, not independent authorship. Counterpart recombines 90 analogies, Second Sense 75 word pairs, Keystone 174 arches, and Splice/Dovetail reuse fragments and joins. Prism has 225 records but 200 rule structures; Switchpath has 217 records but 210 comparison challenges.
- The identity functions appropriately reject many rotations, mirrors, recolors, shuffles, and parameter-only changes. They do not establish semantic quality, difficulty, or independently authored ideas.

## Coverage

Legend: **E** engine plus UI/progress; **D** actual bank data/metadata; **I** identity and dated selector; **T** relevant supplied tests/reports. “Unverified” means not independently executed or human-playtested here.

| Game | Inspected | Unverified aspect |
|---|---|---|
| ringcount | E, D, I, T | Runtime; no independent enumeration |
| switchpath | E, D, I, T | Runtime; human difficulty |
| counterpart | E, D, I, T | Semantic uniqueness/fairness |
| shortlist | E, D, I, T | Runtime decision-tree execution |
| second-sense | E, D, I, T | Clue quality; multi-meaning fairness |
| sideways | E, D, I, T | Runtime exhaustive enumeration |
| tradeoff | E, D, I, T | Runtime; human difficulty |
| inbetween | E, D, I, T | Runtime; clue fairness |
| kimi-cairn | E, D, I, T | Multi-tab fix absent; dictionary fairness |
| kimi-morph | E, D, I, T | Multi-tab fix absent; obscure rungs |
| kimi-tangle | E, D, I, T | Multi-tab fix absent; lexicon concern above |
| kimi-hunch | E, D, I, T | Multi-tab fix absent; solver not run |
| kimi-circuit | E, D, I, T | Multi-tab fix absent; route quality |
| kimi-quartet | E, D, I, T | Multi-tab fix absent; category ambiguity |
| deepseek-twin-hive | E, D, I, T | Runtime; finite word-list fairness |
| deepseek-spare | E, D, I, T | Runtime; antonym editorial review |
| deepseek-rung | E, D, I, T | Runtime shortest-path checks |
| deepseek-cipher | E, D, I, T | Runtime; phrase/clue quality |
| deepseek-trail | E, D, I, T | Runtime path enumeration |
| deepseek-split | E, D, I, T | Runtime; clue fairness |
| qwen-quadra | E, D, I, T | Runtime; category-pool ambiguity |
| qwen-logic-lattice | E, D, I, T | Runtime uniqueness solver |
| qwen-syntax-siege | E, D, I, T | Real timer/browser behavior |
| qwen-memory-maze | E, D, I, T | Real timer/browser behavior |
| qwen-pattern-prism | E, D, I, T | Runtime; visual usability |
| qwen-territory-tactics | E, D, I, T | Runtime solver; tactical difficulty |
| claude-dovetail | E, D, I, T | Runtime; compound-word fairness |
| claude-splice | E, D, I, T | Runtime; editorial finding above |
| claude-sprout | E, D, I, T | Runtime graph search; word fairness |
| claude-tangle | E, D, I, T | Runtime allocation search; names/editorial |
| claude-keystone | E, D, I, T | Runtime; compound ambiguity |
| claude-tumbler | E, D, I, T | Solver not run; word-list fairness |
| nested-tic-tac-toe bonus | E, D, T | Browser play and AI strength; no daily rotation; no hint/undo feature |

**Assessment:** There is a demonstrated multi-tab save-integrity blocker across the six Kimi games. I found no demonstrated single-player engine or solvability blocker by source inspection, but that is not blanket certification: tests were not rerun, browser play was not performed, Kimi historical evidence is incomplete, and the scheduled-content concerns remain.
