# Kimi Tangle v3 dictionary transition

**Historical isolated-worker checkpoint.** Final integrated source counts, subsequent review fixes and web/native/offline verification are in [the November 1 collection report](REMAINING-GAMES-2026-11-01.md). The initial 409,097-word figures and pre-fix behavior below are retained as provenance.
Maker: Codex. November 1, 2026. This is a separate compatibility checkpoint atop `de120622096cb7547887110f5a59d266c9b79156`. It does not regenerate dictionary data or modify root's source parsing, shared dictionary, calendars, compiled runtime or native resources.

## Frozen source contract

The previously published files are copied byte-for-byte and must stay immutable:

| Frozen v2 file | SHA-256 |
|---|---|
| `packages/kimi-pebbles/src/games/tangle/data/lexicon-expansions-v2.json` | `5aefff209f5b14e11b781c5e5b123a2d16a797e707a3165ac3d1a212b95a8e2b` |
| `packages/kimi-pebbles/src/games/tangle/data/five-preview-v2.json` | `48ba85ef81a7439ddab6c4a9743a08289a19c003792e761455251eb8ba34b498` |

Root continues to regenerate the existing `lexicon-expansions.json` and `five-preview.json` as v3. Those current files remain unchanged in this worker's commit. **The compatibility checkpoint alone is not the new English corpus release.** Generate v3 data before publishing a build that creates v3 rounds. After a v3 release, another dictionary expansion requires another frozen edition and marker, rather than changing published v3 pools in place.

## Runtime behavior and APIs

- `TANGLE_LEXICON_START_DAY` remains 20757. New `TANGLE_LEXICON_V3_START_DAY` is 20758, November 1. New current/future Daily rounds and new Practice rounds carry `vocabulary: 3`.
- `expandTanglePuzzle(puzzle, vocabulary=3)` uses current data; explicit `2` uses frozen v2. Original word retention, exclusion handling, points and medal targets are unchanged.
- `dailyTangle(day, saved)` returns `{puzzle,puzzleNo,vocabulary?,unsupported?}`. Valid markerless saves retain the original dated edition: pre-expansion or frozen v2 as appropriate. Their marker stays absent. Known explicit 1/2/3 markers select the corresponding edition. Existing old-client exclusions and previously earned scores are retained. Fresh October 31 and earlier Daily selectors keep their earlier behavior.
- `TangleProgress.vocabulary` is optional. Pure validation rejects unsupported markers. The hook persists a known marker, preserves absence for old saves, and pairs restored progress with its actual edition's puzzle. Score, maximum, word count, targets, Gold state, hint use and share snapshots stay coherent.
- `TANGLE_FIVE_PREVIEW` is current v3; `TANGLE_FIVE_PREVIEW_V2` is frozen. New `fivePreviewRound(saved?)` returns the matching puzzle, restored progress and optional marker. Markerless/v2 preview sessions keep **1,671 words / 4,384 points / goals 10–20–30**. New/restarted samples use v3. The existing `kimi:tangle:5x5-preview:v1` key remains unchanged.
- An unsupported Daily/sample marker enters `phase: 'unavailable'`. Its raw save and statistics are preserved, inputs are hidden, and the page explains how to use Practice or explicitly restart the sample. The hook also protects an open round when another writer replaces its save with an unsupported marker. It emits no misleading progress snapshot for the unavailable phase.
- Restored earlier editions show a plain notice in gameplay and Help: the earlier word list, points and goals are retained; new Practice uses the expanded game dictionary. There is no implementation provenance in the player instructions.

## Verification and fixtures

The first three marker/tag tests failed against pre-change code. A real-hook regression separately reproduced the unsupported-save overwrite, including an external writer changing an open round. The corrected code passes those cases.

- **234/234 Kimi package checks passed**, including the six new compatibility checks and real React hook execution.
- TypeScript app checking and whitespace checking passed.
- Frozen byte hashes and every selected grid across 430 dates are tested for markerless and explicit-v2 save invariants. V3/current membership is checked separately. The preview test checks the actual share/medal snapshot, not only found-word points.
- **Three isolated headless Chrome flows passed** with no page errors: old Daily totals, clue, Gold, Help, share and reload; v3 VAPE acceptance/reload plus old 5×5 totals/results and explicit restart; unknown Daily/sample preservation, visible guidance and safe Practice. Captures were inspected. No server, visible browser tab, download, external send or native build/install was used.

Before root regenerates, current and frozen pools are intentionally identical. The hook/browser fixtures create an observable difference only in memory: add the real VAPE path on grid 335 (`apwovewbeuvmircl`, indices 4→0→1→5), and remove one unfound legal preview word from the current fixture while recomputing its honest totals. Frozen imports are never intercepted. This demonstrates compatibility before the ESDB generation; it does not claim the production files already contain the new corpus.

After generation, run the new test with the release guard:

```sh
TANGLE_REQUIRE_V3_DATA=1 node --import tsx --test tests/MAKER-Codex__tangle-v3.test.ts
```

Run from `packages/kimi-pebbles`. The same test computes real differences between regenerated current data and frozen v2 and requires those differences to exist under this flag. It then proves each new word is accepted by the current edition and rejected by a preserved earlier round. The test reports zero real difference days in this pre-generation checkpoint, as expected.

[Evidence](MAKER-Codex__kimi-tangle-v3-evidence/) includes the executed package and focused logs, browser results and inspected captures. [Browser driver](MAKER-Codex__kimi-tangle-v3-browser.mjs) and `tests/helpers/MAKER-Codex__tangle-v3-dom.mjs` reproduce the compatibility fixtures.

## Root integration notes

The two existing dictionary tests were left untouched, since root owns their ESDB source-reader updates. After regeneration, `tangle-lexicon.test.ts` should expect `expand(...,2)` for October 31 and preserved markerless/v2 saves, and current `expand(...,3)` for fresh November 1+ rounds. Its helper `helpers/tangle-expanded-legacy-dom.mjs` should read `lexicon-expansions-v2.json` and compare `expand(...,2)` when constructing an old-client fixture. Otherwise it could accidentally choose a newly added v3 word and call that a v2 save. Current-data completeness and `tangle-five.test.ts` should continue testing regenerated v3 against root's independent source reader.

No physical device or final integrated/offline/native certification is claimed. An already-running older client can still write using its older code; the new client cannot modify that old program. Root owns corpus generation, its exact source coverage, final full suites and publication readiness.
