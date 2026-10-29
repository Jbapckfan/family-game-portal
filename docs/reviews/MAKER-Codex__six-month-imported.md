# DeepSeek and Qwen six-month content / engine audit

Date: October 29, 2026. Author: Codex. Isolated branch: `codex/six-month-imported-2026-10-29`, based on `553772c`.

The twelve imported games contain **2,425 stored boards and 200 substantive challenges per game**. All **1,490 previously published records** retain their exact values, stable IDs, and ordering. The generator appends **935 records**. Engine implementations, scoring, hint costs, save formats, and existing accepted content are unchanged.

This report proves content and engine behavior. The parent task owns the dated selector, October 29 compatibility, October 30 release, calendar coverage, deployment, and browser/native verification. Stored bank size alone is not a claim that the live selector serves six months without repetition.

| Game | Published before | Stored now | Substantive now | What makes an added challenge different |
|---|---:|---:|---:|---|
| Twin Hive | 140 | 200 | 200 | Three new eight-letter racks, twenty gold-pair constraints each, distinct accepted-answer sets |
| Spare | 120 | 200 | 200 | Different four-pair sets; at least two pairs differ from every earlier expansion board |
| Rung | 120 | 200 | 200 | Different unordered ladder endpoints; reversing a ladder is not counted as new |
| Cipher | 120 | 200 | 200 | Eighty additional original phrases and clues, not substitution-key changes alone |
| Trail | 120 | 200 | 200 | Eighty additional distinct nine-letter clued answers, not remapped paths alone |
| Split | 120 | 200 | 200 | Different unordered two-answer combinations with retained curated clues |
| Logic Lattice | 120 | 200 | 200 | Unique constraint solutions distinct under square symmetry and black/white inversion |
| Memory Maze | 120 | 200 | 200 | Different route shapes, ignoring translation, reversal, rotation, and reflection |
| Pattern Prism | 150 | 225 | 200 | Different attribute cycle structures, ignoring recoloring/renaming and cycle phase |
| Quadra | 120 | 200 | 200 | Different four-answer sets with unique complete rack partitions within the declared category pool |
| Syntax Siege | 120 | 200 | 200 | Different six-wave bank sets with at least two changed waves, ignoring order/rack shuffles |
| Territory Tactics | 120 | 200 | 200 | Positions distinct under all hex symmetries; expanded enemy configurations also differ without friendly stones |

## Content decisions and limits

Twin Hive uses new rack blends `AEINORST`, `ADEINRST`, and `AEILORST`. Their vocabulary is filtered from the five existing authored common-word banks, rather than importing an unchecked dictionary. Every gold pair has at least twelve valid accepted words for the unchanged six-word target. Equal accepted-answer sets are excluded even if rack or gold labels differ. The finite editorial word list remains finite; this does not promise every English word is accepted.

Cipher adds eighty authored phrases. Trail adds eighty newly playable clued answers, including `NEWSPAPER`, `NIGHTFALL`, and `ORCHESTRA`, which were present in unused earlier editorial source rows. All new Trail words are exactly nine letters, are unique across the full bank, and have a valid path through all nine tiles. Authored clues were reviewed in source; a successful engine solve is not an independent human editorial review.

Spare, Split, Quadra, and Siege combine existing vetted vocabulary. Their novelty measures are answer/pair/bank combinations, not mere tile order changes. Spare keeps the existing semantic-family exclusion when combining antonyms. Quadra's uniqueness guarantee is explicitly within its declared editorial category pool, not every possible English word. Difficulty balance and delight across a six-month human play session remain editorial judgments, not proven by a solver.

Prism preserves an important legacy constraint: the original thirty boards contain five normalized rules, repeated six times with different labels or phases. Removing them would break stable IDs. The bank therefore has 225 records to supply 200 actual rule structures. New additions are structurally unique. Each attribute's five visible examples determines all three requested predictions across every supported cycle length from one through four.

The zero-based Prism duplicate groups are:

- `[0, 5, 10, 15, 20, 25]`
- `[1, 6, 11, 16, 21, 26]`
- `[2, 7, 12, 17, 22, 27]`
- `[3, 8, 13, 18, 23, 28]`
- `[4, 9, 14, 19, 24, 29]`

The pure browser-compatible exports in `scripts/imported-content-signatures.mjs` provide `substantiveSignature(slug, puzzle)`, `prismSignature(puzzle)`, and `duplicateGroups(slug, puzzles)` for the parent's schedule and coverage checks. All other imported banks have no duplicate substantive signatures.

## Logic verification

The existing twelve engine suites passed before changes: 91 tests including the earlier expansion invariants. No new runtime engine defect was reproduced in this scoped audit. Existing full-bank checks solve every board through actual input APIs, including shortest legal Rung paths, complete Cipher mappings, legal Trail paths, exact tile use, unique Lattice solutions, and real Territory captures.

The new `scripts/imported-six-month.test.mjs` adds full-published-prefix SHA-256 contracts, the 200-challenge floor, canonical novelty checks, and assisted end-to-end play of every stored board. It serializes and restores every intermediate reachable assistance state. All boards finish through the engine as `won`; revealing an unfinished board stays `revealed` and restores correctly; a completed game cannot be converted into a reveal. Territory tests also enumerate recoverable wrong first moves, real smaller decoy captures, full two-move solutions, and restoration of legal partial captures. All expanded positions retain two live enemy groups and no decorative friendly stones.

Fresh final results:

- **139 engine, bank, preservation, novelty, assistance, and save tests passed**, zero failures/skips.
- **9 focused Qwen DOM renderer tests passed**, zero failures/skips. These used the existing local jsdom installation and did not launch a browser or server.
- `node scripts/expand-imported-puzzles.mjs --check` reproduced every generated file exactly.
- `git diff --check` passed.

Commands:

```sh
node scripts/expand-imported-puzzles.mjs --check
node --test scripts/imported-six-month.test.mjs scripts/imported-expansion.test.mjs games/deepseek-{twin-hive,spare,rung,cipher,trail,split}/engine.test.mjs games/qwen-*/engine.test.mjs
NODE_PATH=/Users/jamesalford/Documents/Codex/2026-10-27/task/alford-daily/packages/kimi-pebbles/node_modules node --test games/qwen-quadra/elite-ui.test.mjs
```

The tests do not certify physical-device rendering, live date selection, human difficulty, or complete dictionary coverage. No downloads, model calls, browser sessions, servers, infrastructure changes, runtime selector edits, catalog edits, iOS bundle edits, or Canon writes were made by this worker.
