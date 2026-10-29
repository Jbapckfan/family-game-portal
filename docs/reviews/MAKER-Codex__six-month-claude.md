# Claude-family six-month content and logic audit — October 29, 2026

Maker: Codex. Base: `553772c`; isolated branch: `codex/six-month-claude-2026-10-29`.

Five banks now contain 200 substantive boards each; Tumbler retains its 1,054 distinct answers. The six banks contain **2,054 records**, an increase of **352**. Every pre-existing record and ID is unchanged, verified against fixed SHA-256 hashes of the complete published record prefixes. Original Sprout and Tangle source bytes are also checked before regeneration. No engine, global dictionary, score, penalty, save format, app, shared schedule, catalog, inventory or native bundle changed in this worker's scope.

| Game | Before | After | Conservative substantive identity | Additional-content checks |
|---|---:|---:|---|---|
| Dovetail | 120 | 200 | Directed eight-word chain | Existing approved joins only; no five-word block repeats; at most four shared joins with any earlier chain; different endpoints/length presentation. |
| Splice | 120 | 200 | Sorted twelve-tile multiset, ignoring pair/display order | Exactly one oriented complete matching; at least eleven valid directed joins; at most two tiles with only one possible partner; at most three shared answers with any prior bin. |
| Sprout | 128 | 200 | Sorted complete eight-letter multiset, ignoring seed/anagram choices | Seventy-two entirely new letter ecosystems; complete five-growth routes; every alive/dead entry graph-verified; each new board has one to six reachable wrong turns. |
| Tangle | 160 | 200 | Sorted three-target-word set, ignoring weave | Forty new thread triples; no reused pair of threads; each has four to forty-seven valid wrong-word pulls and one to nineteen stranded duplicate-copy pulls; at least half the owner transitions switch threads. |
| Keystone | 120 | 200 | Sorted three-arch set, each arch identified by target and directed clues | Original 174 unique arches; no new day repeats an existing pair of arches; each arch used at most four times; every arch has one full-clue solution within the supplied lexicon. |
| Tumbler | 1,054 | 1,054 | Answer word | All answers unique and accepted; deterministic feedback-only solver wins every answer within four guesses, without hints. |

Every bank has exactly as many distinct conservative signatures as records. The reusable pure helper is `scripts/claude-puzzle-signatures.mjs`, exporting `claudePuzzleSignature(fullSlug, puzzle)` and `claudePuzzleSignatures`.

## Content preparation

`scripts/expand-claude-puzzles.mjs` extends the existing deterministic Dovetail/Splice/Keystone process to 200 records. Its first 120 records remain identical. Dovetail's prior overlap limits and Splice's matching/trap limits were retained. Keystone adds further distinct combinations, not new individual arches; its maximum arch reuse necessarily rises from three to four and is explicitly reported and tested.

`scripts/expand-claude-six-month.mjs` appends Sprout and Tangle records. Sprout uses explicitly selected ordinary English routes and supplementary words intersected with the unchanged supplied `COMMON` lexicon: 1,406 reviewed-pool words. It rejects a candidate without a reachable dead end. The final new boards use 29 seed words, and the full 200-board bank contains 2,374 alive and 854 dead level entries. The graph, not the authored route label, determines these classifications.

Tangle uses 420 retained source-vocabulary thread words after seventeen explicit new-content exclusions. The new words are not invented, and changing a weave alone cannot qualify a board as fresh.

The first generated editorial sample repeated the inherited Splice answer `redskins` and Tangle names such as `murphy`. Regression tests first reproduced those cases, then the generators were corrected. New Splice records exclude `midget` and `redskins`; the latter exclusion starts after record 120 so published content is preserved. The Tangle generator records its complete new-content exclusion list in `CONTENT_INFO`. Original records and the acceptance dictionaries remain untouched.

## Logic and execution evidence

All **2,054 records** completed through the real game engine and shared session, with state persisted and reconstructed after every action. Each final session retained a won state and exactly one daily win/played record. Existing tests also exercise practice separation, reveal results, hints, penalty boundaries, repeated/unlisted guesses, malformed saves and legal alternative solutions.

Sprout checks complete letter conservation on every growth, hints with surviving continuations, all supplied alive/dead entries and terminal restoration. Tangle enumerates **1,185** possible target-word first pulls across the complete bank. Of these, **480** temporarily strand another thread; the existing exhaustive test verifies either a full continuation or a successful undo restoring a complete allocation. New Tangle records must actually have such interference, rather than merely displaying shuffled letters.

The Tumbler strategy considers only the remaining answer candidates, selects a minimax feedback partition, submits through the actual engine, and reduces candidates using returned positional feedback. It does not submit the secret directly to choose its next guess. Every answer wins within four of the allowed six guesses. The separate session test uses supplied answers only to verify persistence.

No reproducible engine defect was established by this pass, so engines and scoring rules were left unchanged.

## Verification commands and results

The initial reserve tests failed for the five undersized banks. After preparation and editorial regressions:

```sh
node --test games/claude-*/engine.test.mjs \
  scripts/claude-expansion.test.mjs scripts/claude-six-month.test.mjs
node scripts/expand-claude-puzzles.mjs --check
node scripts/expand-claude-six-month.mjs --check
git diff --check
```

**67 tests passed, zero failed or skipped.** Both deterministic regeneration checks and whitespace checks passed. Scoped log: `/private/tmp/MAKER-Codex__six-month-claude-scoped-tests.log`.

The complete collection command was also run:

```sh
NODE_PATH=/Users/jamesalford/Documents/Codex/2026-10-27/task/alford-daily/packages/kimi-pebbles/node_modules \
node --test games/*/engine.test.mjs games/*/tests/*.test.mjs \
  games/daily/*.test.mjs games/deepseek-runtime/*.test.mjs scripts/*.test.mjs
```

The final run reports **625 tests: 622 passed, three failed, zero skipped**. All three failures are integration work explicitly reserved to root:

1. `prepared counts match every modular imported bank`: shared catalog still reports 120 for Dovetail instead of 200.
2. `all 32 games have at least 120 available puzzles and the deployment inventory matches the banks`: the same stale shared catalog/inventory.
3. `public staging includes all 32 games, excludes unrelated portal files, and refuses stale runtime copies before mutation`: native copies of the five expanded banks need synchronization.

Full log: `/private/tmp/MAKER-Codex__six-month-claude-full-tests.log`. Root must update shared metadata, establish the October 29–April 28 daily selection window while preserving historical assignments, sync native resources and rerun integration acceptance.

## Limits

These are substantive finite reserves, not a promise of indefinite new content. Dovetail reuses approved joins, Splice reuses fragment pairs, Keystone reuses its 174 arches, and Sprout includes related inflections among otherwise distinct letter ecosystems. The overlap and signature tests state exactly what freshness means.

The new word pools were reviewed by Codex; they are not independent human editorial or difficulty certification. Original source content still includes dated terms, proper names, uncommon words and fragments. Those records were preserved intentionally. Sprout accepts its per-board supplied word list, so dictionary words omitted from that list remain free rejected guesses under the existing rules. Broad natural-language coverage and subjective fairness require separate playtesting.

No browser, server, native build, installation, deployment, external model/provider call, download, infrastructure change or Canon write was performed by this worker.
