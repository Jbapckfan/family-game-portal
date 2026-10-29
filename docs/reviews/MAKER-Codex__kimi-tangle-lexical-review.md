# Kimi Tangle lexical review and dated repair — October 29, 2026

The reported strings are a real editorial concern, but unfamiliarity alone does not establish that a word is invalid. The narrow approved repair removes twelve exact spellings from daily puzzles beginning October 30 and from newly generated practice. Historical boards, scores and runtime medal thresholds through October 29 remain unchanged. The raw 430-board JSON bank is unchanged.

Implementation commit: `dce6f4bab71c7c4b229ac17a9acc77b370ee4e8f`. Root owns wiring the two selector returns and verifying the resulting integrated app.

## Evidence and distinctions

The initial audit read the root checkout's JSON and TypeScript source as data. It did not import or execute project code. Its independent calculations use the **actual** runtime thresholds from `medalTargets`, not the obsolete thresholds stored in JSON: gold is `min(18, max(8, round(max × 0.2)))`, with bronze/silver at the rounded-up thirds.

The bank contains **430 boards, 30,688 listed word occurrences and 9,167 distinct strings**. All entries meet the engine's lowercase/length format and every stored maximum equals the sum of the displayed length-based points. The game's historical acceptance contract is membership in the per-board list; consequently the flagged entries are accepted by that contract. No supplied dictionary has lexical-class labels capable of proving every string to be an ordinary word, abbreviation, proper name or typo.

| Entry | Local evidence | Appropriate conclusion |
|---|---|---|
| `ccm`, `ccw`, `cfm`, `whf` | Present in supplied Cairn `dict.txt`; absent from its `common.txt` and local Webster `web2` list. | Reviewed abbreviation/opaque-token exclusions. Absence from another list alone is not a proof that every possible usage is invalid. |
| `icica` | Exact lowercase entry in `/usr/share/dict/web2:90729`. | Positively corroborated obscure vocabulary; retained. The review's example must not be generalized into “all unfamiliar strings are nonwords.” |
| `acinic`, `minish`, `wodge` | Exact lowercase Webster entries. | Rare/technical/regional vocabulary is distinguishable from the four reported opaque abbreviations; retained. |
| `mahmoud`, `wilhelm` | Webster stores `Mahmoud` and `Wilhelm`; `Mahmoud` is also in `/usr/share/dict/propernames`. | Clear named entries; excluded prospectively under the approved policy. |
| `nig`, `wog` | Present in the bank, including five scheduled occurrences each. | Unsuitable default-game entries; excluded prospectively. A word's presence in an old dictionary is not sufficient editorial approval. |
| `coon`, `fag`, `fags` | Present in the bank; some spellings also have other senses. | Explicit suitability exclusions, **not** a claim that all possible senses are nonwords. |

The exact approved list is:

```text
ccm ccw ccws cfm whf mahmoud wilhelm nig wog coon fag fags
```

`ccws` and `fags` are observed exact variants. `nigs`, `wogs` and `coons` are absent; no broad stemming or pattern exclusion is applied.

The local Webster list is a useful positive corroborator, not a modern game whitelist. Its README describes its historical source, and it contains rare vocabulary, names and unsuitable terms. Conversely, 27 bank words are absent even from the supplied Cairn full dictionary, including ordinary words such as `caffeine`, `efficient` and `chiefdom`. Therefore dictionary absence is not a credible automatic deletion rule.

## Six-month medal impact

The independently computed 182 dates, October 29–April 28, select board numbers **116–297** and match every index in root's existing `docs/six-month-runway.json`.

The original four reported tokens occur **21 times across 18 scheduled boards**. Removing only those four leaves every gold reachable, with a minimum remaining-point surplus of **28** above actual gold.

Restricting the game to Cairn's **3,774-word common list** would make:

- Gold unreachable on **175 of 182** boards.
- Silver unreachable on **125** boards.
- Bronze unreachable on **31** boards.

For example, February 23, board 233, retains only `rich` for one point under that filter, against actual thresholds **3/6/8**. This rejects useful vocabulary and is not a viable repair.

A broader diagnostic pool consisting of lowercase Webster entries plus Cairn common words can reach gold on all 182 boards, with a minimum surplus of four points. This is **not** a proposed production filter: it still includes rare and unsuitable words, and excludes ordinary inflections. It proves only that the named abbreviations, uncorroborated entries and capitalized-only Webster names are not collectively required for a medal in that diagnostic calculation. It does not establish child-level familiarity or human difficulty.

The approved twelve-spelling policy affects **72 practice boards**, removes **89 occurrences / 97 points** from the complete bank, and replaces one excluded `best` word: board 5's `wilhelm` becomes the retained word `pilule`. Among the dated selections it affects **29 boards**, removes **35 occurrences**, and leaves at least **27 points** above actual gold on every board when considering all remaining accepted words. No board identity or calendar index changes.

## Implementation and integration

`packages/kimi-pebbles/src/games/tangle/reviewed-words.ts` exposes:

- `reviewTanglePuzzle(puzzle)` for newly generated practice.
- `reviewTanglePuzzleForDay(puzzle, dayNumber)` for dated daily selection.

The daily wrapper returns the original object for day numbers through **20755** (October 29). Starting **20756** (October 30), the helper filters exactly the reviewed set, recomputes `n`, `max` and `targets` with the existing scoring functions, and replaces `best` only if it was removed. The helper never mutates the supplied object or arrays. No hook, progress validator, save schema or original puzzle data changed.

Root must preserve the existing `PUZZLES` normalization that already calls `medalTargets(puzzle.max)`, then add this import to `engine.ts`:

```ts
import { reviewTanglePuzzle, reviewTanglePuzzleForDay } from './reviewed-words'
```

Only the two existing return objects change:

```ts
// dailyTangle: retain existing publishedDailyIndex selection.
return { puzzle: reviewTanglePuzzleForDay(PUZZLES[idx], dayNumber), puzzleNo: idx + 1 }

// practiceTangle: retain existing choosePracticeIndex selection.
return { puzzle: reviewTanglePuzzle(PUZZLES[idx]), puzzleNo: idx + 1 }
```

This avoids silently regrading or rejecting historical saves containing an excluded word. The tests restore a historical 17-point gold save containing `ccm` with identical points, found words, penalties and gold status. A fresh reviewed round rejects those removed words through the unchanged existing membership validator. Existing dated daily storage keys keep the policies separate.

## Verification

With the helper initially returning unchanged puzzles, two regressions failed for the intended missing filtering/history separation. After implementation:

- **6 new tests pass.**
- **430 reviewed practice boards / 30,599 remaining word paths** have legal eight-way, non-reusing paths and enough points for actual gold.
- **182 dated selections / 12,909 retained word paths** pass path checks, incremental real `restoreTangleProgress` validation, score recomputation and final gold.
- Every historical normalized puzzle remains the same object, including its actual old runtime thresholds. Raw data immutability passes.
- Actual package `npm test`: **77 tests passed, zero failures or skips**, including its spawned DOM suites.
- `tsc -p tsconfig.app.json --noEmit --incremental false` passed.

The initial broader test attempt could not resolve ESM dependencies through `NODE_PATH`; linking the already-installed dependency directory into this isolated worker's ignored `node_modules` fixed resolution. No packages were installed or downloaded. Final package log: `/private/tmp/MAKER-Codex__kimi-tangle-reviewed-full-tests.log`.

This worker tested the real review/progress functions and independently derived the same dated indices. Root's actual selector wiring, full integrated engine suite and browser flows remain root's verification responsibility.

## Audit artifacts and limits

Reproduce the data-only analysis without executing project modules:

```sh
node docs/reviews/MAKER-Codex__kimi-tangle-lexicon-audit.mjs \
  /Users/jamesalford/Projects/MAKER-codex__alford-daily-six-months --json
```

`MAKER-Codex__kimi-tangle-lexicon-audit.json` preserves input hashes, every dated selection, exact token occurrences, comparison-pool word lists and the approved-policy impact. No audited input's mtime changed during the audit. Raw Tangle JSON SHA-256:

```text
b38de268f0a4257de77877fb3fa58a0a2595899d95f59532b744fa1b82939f3e
```

This is a deliberately bounded repair, not full editorial certification. Other abbreviations, rare vocabulary and names remain. For example `hugh` is a capitalized Webster/propernames entry on two scheduled boards; it is outside the expressly approved twelve-word scope. There are **2,956** distinct bank strings not corroborated by the auxiliary Webster/common union, but this count includes valid vocabulary and cannot be relabeled as a count of invalid words. Any broader cleanup should review explicit candidates, retain dated compatibility, and rerun medal-path evidence rather than apply a blanket “common” filter.
