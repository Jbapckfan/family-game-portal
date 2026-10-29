# Claude-family six-month content and logic audit — October 29, 2026

Maker: Codex. Base: `553772c`; isolated branch: `codex/six-month-claude-2026-10-29`.

Three banks contain 200 substantive boards each; Splice contains 202 so that excluding two legacy boards leaves 200 eligible records; Sprout contains 211 so that eleven reviewed legacy holds leave 200 eligible records; Tumbler retains its 1,054 distinct answers. The six banks contain **2,067 records**, an increase of **365** from `553772c`. Every record and ID present at that baseline is unchanged, verified against fixed SHA-256 hashes of the complete published record prefixes. All first 200 prepared Sprout and Splice records also remain unchanged. Original Sprout and Tangle source bytes are checked before regeneration. No engine, global dictionary, score, penalty, save format, app, shared schedule, catalog, inventory or native bundle changed in this worker's Claude-family scope.

| Game | Before | After | Conservative substantive identity | Additional-content checks |
|---|---:|---:|---|---|
| Dovetail | 120 | 200 | Directed eight-word chain | Existing approved joins only; no five-word block repeats; at most four shared joins with any earlier chain; different endpoints/length presentation. |
| Splice | 120 | 202 | Sorted twelve-tile multiset, ignoring pair/display order | Exactly one oriented complete matching; at least eleven valid directed joins; at most two tiles with only one possible partner; at most three shared answers with any prior bin; 200 eligible after two legacy exclusions. |
| Sprout | 128 | 211 | Sorted complete eight-letter multiset, ignoring seed/anagram choices | Eighty-three entirely new letter ecosystems; complete five-growth routes; every alive/dead entry graph-verified; eighty-one new boards have one to fifteen reachable wrong turns; two explicitly easy boards have none; 200 eligible after eleven reviewed legacy holds. |
| Tangle | 160 | 200 | Sorted three-target-word set, ignoring weave | Forty new thread triples; no reused pair of threads; each has four to forty-seven valid wrong-word pulls and one to nineteen stranded duplicate-copy pulls; at least half the owner transitions switch threads. |
| Keystone | 120 | 200 | Sorted three-arch set, each arch identified by target and directed clues | Original 174 unique arches; no new day repeats an existing pair of arches; each arch used at most four times; every arch has one full-clue solution within the supplied lexicon. |
| Tumbler | 1,054 | 1,054 | Answer word | All answers unique and accepted; deterministic feedback-only solver wins every answer within four guesses, without hints. |

Every bank has exactly as many distinct conservative signatures as records. The reusable pure helper is `scripts/claude-puzzle-signatures.mjs`, exporting `claudePuzzleSignature(fullSlug, puzzle)` and `claudePuzzleSignatures`.

## Content preparation

`scripts/expand-claude-puzzles.mjs` extends Dovetail/Keystone to 200 records and Splice to 202. Their first 120 records remain identical; an additional hash verifies all first 200 Splice records remain identical in the follow-up. Dovetail's prior overlap limits and Splice's matching/trap limits were retained. Keystone adds further distinct combinations, not new individual arches; its maximum arch reuse necessarily rises from three to four and is explicitly reported and tested.

`scripts/expand-claude-six-month.mjs` appends Sprout and Tangle records. Sprout selects the first 200 letter ecosystems using 1,406 reviewed route/pool words; eleven later reserves use an extended 1,420-word selection pool. It then constructs the complete graph from the unchanged supplied `COMMON` vocabulary, apart from explicit editorial exclusions described below. The final new boards use 42 seed words, and the full 211-board bank contains 6,893 alive and 2,377 dead level entries. The graph, not the authored route label, determines these classifications. Two explicitly easy ecosystems have no dead ends; valid vocabulary is not restricted to manufacture traps.

Tangle uses 420 retained source-vocabulary thread words after seventeen explicit new-content exclusions. The new words are not invented, and changing a weave alone cannot qualify a board as fresh.

The first generated editorial sample repeated the inherited Splice answer `redskins` and Tangle names such as `murphy`. Regression tests first reproduced those cases, then the generators were corrected. New Splice records exclude `midget` and `redskins`; the latter exclusion starts after record 120 so published content is preserved. The Tangle generator records its complete new-content exclusion list in `CONTENT_INFO`. Original records and the acceptance dictionaries remain untouched.

## Logic and execution evidence

All **2,056 records** completed through the real game engine and shared session, with state persisted and reconstructed after every action. Each final session retained a won state and exactly one daily win/played record. Existing tests also exercise practice separation, reveal results, hints, penalty boundaries, repeated/unlisted guesses, malformed saves and legal alternative solutions.

Sprout checks complete letter conservation on every growth, hints with surviving continuations, all supplied alive/dead entries and terminal restoration. Tangle enumerates **1,185** possible target-word first pulls across the complete bank. Of these, **480** temporarily strand another thread; the existing exhaustive test verifies either a full continuation or a successful undo restoring a complete allocation. New Tangle records must actually have such interference, rather than merely displaying shuffled letters.

The Tumbler strategy considers only the remaining answer candidates, selects a minimax feedback partition, submits through the actual engine, and reduces candidates using returned positional feedback. It does not submit the secret directly to choose its next guess. Every answer wins within four of the allowed six guesses. The separate session test uses supplied answers only to verify persistence.

The provider follow-up demonstrated and repaired a new-content Sprout omission. No engine change was necessary; scoring and penalties remain unchanged.

## Provider-review follow-up

Kimi identified retained legacy Splice boards `splice-8` and `splice-24`, containing the dated answers excluded from new content. Root owns excluding those IDs from future daily/default practice while retaining historical access. `splice-201` and `splice-202` provide two further distinct bins, under all existing matching/trap/overlap checks, leaving 200 eligible boards. They solve to ORIGINATE/PALACE/CARROT/LEGALLY/EXPRESSION/PASSPORT and SOUTHEASTERN/HIGHLAND/WATERFALL/ROADWAY/FRESHMAN/HOMEOWNER. The reserve regression first failed at 198 eligible boards, then passed at 200.

Gemini's Sprout concern was reproduced concretely: `sprout-129` initially rejected ROE + B → ROBE, although the existing graph already supplied ROBE → BORER → ROBBER → ROBBERS → ABSORBER. `sprout-130` similarly rejected ART → TEAR and RATE → EATER. Before repair, an exhaustive actual-reachable-state scan found 1,365 omitted COMMON transitions across the new 72 boards, of which 944 already had surviving continuations through the restricted graph. Original 128-board coverage had zero omissions. Regressions reproduced the rejection before graph regeneration, then completed all three named routes with no wilts and valid restored states.

The repair regenerates only the 72 new level graphs against the existing COMMON vocabulary. Their IDs and final letter ecosystems are fixed by a SHA-256 regression. All original 128 records/source bytes remain unchanged. Restoring legitimate continuations removed artificial dead ends: sixteen boards received familiar replacement seeds within their same ecosystems, recorded in `CONTENT_INFO.seedRepairs`. `sprout-131` (ADMIRERS ecosystem) and `sprout-161` (ARRESTED ecosystem) have no dead entries at all and are expressly marked easy exceptions in metadata and tests. This difficulty exception was explicitly accepted by root; no invented traps or dictionary restrictions were introduced to force it.

The supplementary-word audit examined 2,116 words absent from the earlier curated new-board lists. A closed **77-entry** suitability list is recorded with categories in `scripts/claude-sprout-editorial-exclusions.json`: inherited exclusions, identified dated slurs/explicit terms, clear abbreviations/organizations, and identified names/places/brands. It applies only to new boards. Ordinary dictionary senses are retained where appropriate; for example BRAD (nail), DEGAS (remove gas), SABIN (acoustic unit) and TESLA (SI unit) are not excluded merely because a named use exists.

Reproduce the complete coverage audit:

```sh
node scripts/audit-claude-sprout-lexicon.mjs
```

The initial dictionary repair produced **200 boards, 3,077 reachable word states, 10,378 COMMON-valid transitions, zero unexplained omissions**. Original 128 boards account for 1,637 states/4,625 transitions and no exclusions. New 72 boards account for 1,440 states/5,753 transitions; 62 transitions involving sixteen explicitly excluded terms remain unlisted. They are ARDS, ARLES, COATES, ELISA, LANDES, MRNA, NARA, OREO, OREOS, RACIST, RETARDS, RNAS, SABINE, TONGA, TRNA and TUES. All other reachable valid COMMON additions appear in the alive/dead graph. The audit recomputes real reachable states and validates omissions through actual selection/submission, rather than inspecting only the generator's chosen answer path.

## Sprout legacy-content follow-up

Opus identified CLIT on original `sprout-61` and HEROIN on `sprout-86`. A complete scan of all 128 original boards against the same closed 77-term list found the eleven records below. Root approved consistent future holds for these exact IDs, preserving historical data and saves. Root owns the actual selector, calendar, catalog and native-copy changes.

| Original ID | Listed term | Graph status | Reachable from seed |
|---|---|---|---|
| sprout-7 | TRNA | Alive | Yes |
| sprout-12 | IVER | Dead | Yes |
| sprout-54 | LIAO | Dead | Yes |
| sprout-58 | MRNA | Alive | Yes |
| sprout-61 | CLIT | Dead | Yes |
| sprout-62 | TRNA | Dead | Yes |
| sprout-86 | HEROIN | Dead | **No** |
| sprout-88 | ELISA | Dead | Yes |
| sprout-116 | MRNA | Alive | Yes |
| sprout-124 | IVER | Dead | Yes |
| sprout-128 | OLED | Alive | Yes |

These are existing suitability decisions: identified abbreviations, named entries, explicit terminology, and the inherited exclusion of HEROIN. The HEROIN finding concerns an unreachable source-list entry; it is **not** evidence that a legal played route accepts HEROIN. No additional original record contains one of the 77 exact exclusions.

Eleven appended records, `sprout-201` through `sprout-211`, provide distinct ecosystems ending in CANTEENS, CAPTIONS, CAPTURED, CARELESS, CAROUSEL, CARPETED, CARTOONS, CASHMERE, PARADISE, PAINTERS and the STRAINER/RESTRAIN ecosystem. Every reserve has at least one complete five-growth route and between one and thirteen reachable wrong turns. Every fitting COMMON entry remains graph-classified, except the existing explicit exclusions. No further easy-board exception was introduced.

The reserve regression failed at **189 eligible boards** before generation, then passed at **200 distinct eligible boards**, each free of the 77 excluded terms in its level lists. All first 200 records retain SHA-256 `28eac2883970646c4b32de08875921fa6ec0350c29045872831531a00993f334`. The original 128 source bytes remain intact, and the earlier 72 ecosystem identities and graphs are unchanged.

The complete current audit reports **211 boards, 3,381 reachable word states, 11,669 COMMON-valid transitions and zero unexplained omissions**. The eleven reserves account for **304 states / 1,291 transitions**; fourteen deliberately omitted transitions all involve ARLES. Across the whole bank there are 76 deliberately omitted transitions and the same sixteen excluded terms recorded above. Full-bank engine tests classify all **6,893 alive / 2,377 dead entries**, and actual sessions solve and reload all 211 boards without score, penalty or save-format changes.

## Verification commands and results

The initial reserve tests failed for the five undersized banks. After preparation and editorial regressions:

```sh
node --test games/claude-*/engine.test.mjs \
  scripts/claude-expansion.test.mjs scripts/claude-six-month.test.mjs
node scripts/expand-claude-puzzles.mjs --check
node scripts/expand-claude-six-month.mjs --check
git diff --check
```

Initial preparation: 67 tests passed. Final provider-follow-up: **71 tests passed, zero failed or skipped.** Both deterministic regeneration checks and whitespace checks passed. Follow-up log: `/private/tmp/MAKER-Codex__six-month-claude-followup-tests.log`.

The subsequent eleven-reserve Sprout follow-up passes **72 tests, zero failed or skipped**, including every board's actual constructor/session completion and reload. Both deterministic generator checks pass. Its first run exposed one old exact-count assertion (`211 !== 200`); that test now checks the minimum reserve while the separate eligibility/preservation regression asserts the exact reviewed capacity. Final log: `/private/tmp/MAKER-Codex__sprout-reserve-tests.log`.

The complete collection command was also run:

```sh
NODE_PATH=/Users/jamesalford/Documents/Codex/2026-10-27/task/alford-daily/packages/kimi-pebbles/node_modules \
node --test games/*/engine.test.mjs games/*/tests/*.test.mjs \
  games/daily/*.test.mjs games/deepseek-runtime/*.test.mjs scripts/*.test.mjs
```

The initial preparation run reported 625 tests: 622 passed and three integration failures. The final provider-follow-up run reports **629 tests: 626 passed, three failed, zero skipped**, recorded in `/private/tmp/MAKER-Codex__six-month-claude-followup-full-tests.log`. The same catalog/native integration changes remain explicitly reserved to root:

1. `prepared counts match every modular imported bank`: shared catalog still reports 120 for Dovetail instead of 200.
2. `all 32 games have at least 120 available puzzles and the deployment inventory matches the banks`: the same stale shared catalog/inventory.
3. `public staging includes all 32 games, excludes unrelated portal files, and refuses stale runtime copies before mutation`: native copies of the five expanded banks need synchronization.

The eleven-reserve follow-up reran the complete command: **630 tests, 627 passed, the same three integration failures, zero skipped**, recorded in `/private/tmp/MAKER-Codex__sprout-reserve-full-tests.log`. No source-engine, solver or save-restoration failure remains. This isolated worker intentionally retains the old shared catalog/native copies; root's integrated checkout must rerun those checks after incorporating Sprout 211 and the eleven future holds.

Initial full log: `/private/tmp/MAKER-Codex__six-month-claude-full-tests.log`. Root must update shared metadata and Splice exclusions, establish the October 29–April 28 daily selection window while preserving historical assignments, sync native resources and rerun integration acceptance.

## Limits

These are substantive finite reserves, not a promise of indefinite new content. Dovetail reuses approved joins, Splice reuses fragment pairs, Keystone reuses its 174 arches, and Sprout includes related inflections among otherwise distinct letter ecosystems. The overlap and signature tests state exactly what freshness means.

The new word pools were reviewed by Codex; they are not independent human editorial or difficulty certification. Original source content still includes dated terms, proper names, uncommon words and fragments. Those records were preserved intentionally. The supplied COMMON vocabulary itself includes rare, regional, technical and inflected entries; the closed new-content exclusions are not a claim of perfect editorial classification or exhaustive real-world English coverage. Excluded Sprout words remain free rejected guesses under existing rules. Subjective fairness and difficulty require separate playtesting.

No browser, server, native build, installation, deployment, external model/provider call, download, infrastructure change or Canon write was performed by this worker.
