# Puzzle expansion and NAS release preparation — October 22, 2026

> This is the initial expansion checkpoint, before the subsequent Astra gameplay and balance pass. Its 500-test count and unchanged Kimi runtime statement describe that earlier checkpoint. See [RELEASE-STATE.md](RELEASE-STATE.md) for the final candidate, updated test counts, difficulty changes, and model/deployment status. The prepared puzzle counts below remain current.

## Release result

The collection contains **32 games and 8,001 prepared puzzle or daily-set records**, an increase of **2,159** from 5,842. Every game has at least **120** available records. Full banks are accessible through Practice immediately; no date or payment gate restricts that access. The current individual game designs and creator attributions are retained.

**Source and local verification are complete. Live NAS deployment is not verified.** Desktop Commander reports the connected Mac offline; a direct request to the configured NAS address returned HTTP 503 from the workspace gateway. No NAS files, Docker containers, router settings, public routes, or access permissions were changed during preparation. A GitHub source update does not establish a NAS deployment.

The checked-in [inventory](puzzle-inventory.json) is derived from the actual puzzle modules and Kimi data files. Run `node scripts/puzzle-inventory.mjs --write` after a content update; collection tests reject stale counts and any game below 120.

## Prepared banks

| Creator | Game | Prepared records |
| --- | --- | ---: |
| ChatGPT | Ringcount | 180 |
| ChatGPT | Switchpath | 187 |
| ChatGPT | Counterpart | 180 |
| ChatGPT | Shortlist | 180 |
| ChatGPT | Second Sense | 180 |
| ChatGPT | Sideways | 180 |
| ChatGPT | Tradeoff | 180 |
| ChatGPT | Inbetween | 180 |
| Kimi | Cairn | 839 |
| Kimi | Morph | 450 |
| Kimi | Tangle | 430 |
| Kimi | Hunch | 937 |
| Kimi | Circuit | 286 |
| Kimi | Quartet | 420 |
| DeepSeek | Twin Hive | 140 |
| DeepSeek | Spare | 120 |
| DeepSeek | Rung | 120 |
| DeepSeek | Cipher | 120 |
| DeepSeek | Trail | 120 |
| DeepSeek | Split | 120 |
| Qwen | Quadra | 120 |
| Qwen | Logic Lattice | 120 |
| Qwen | Syntax Siege | 120 |
| Qwen | Memory Maze | 120 |
| Qwen | Pattern Prism | 150 |
| Qwen | Territory Tactics | 120 |
| Claude | Dovetail | 120 |
| Claude | Splice | 120 |
| Claude | Sprout | 128 |
| Claude | Tangle | 160 |
| Claude | Keystone | 120 |
| Claude | Tumbler | 1,054 |

These are finite libraries. A prepared record is not necessarily a newly authored set of words or clues, and the total is not 8,001 fresh days in every game. Daily rotations repeat independently.

## Content quality and reusable pools

The original eight games add 877 boards while preserving all 570 published puzzle objects, IDs, and order. Ringcount has 180 distinct rings after rotation/reflection checks. Switchpath has 187 boards covering 180 distinct comparison graphs; seven inherited equivalents remain intact for save compatibility. Shortlist has 180 distinct targets and certifies 2,160 candidate-answer paths. Sideways certifies all 184,320 row orientations. Tradeoff uses 473 directed transformations; Inbetween uses 174 transformations.

Counterpart's 180 boards combine 90 curated analogies; Second Sense's 180 boards combine 75 curated noun/verb pairs. Every addition changes at least three of five questions relative to preceding boards. Counterpart applies 17 overlapping editorial exclusion families to avoid the concrete ambiguous cross-matches found during review. This is a conservative editorial guard, not a proof against every possible natural-language interpretation. Second Sense spaces repeated pairs 11–19 boards apart around its cycle. Their About panels disclose the reused pools.

DeepSeek and Qwen now supply 1,490 records. Cipher has 120 different phrases, and Trail has 120 different nine-letter answers, including 90 newly authored entries in each. Rung has 120 distinct endpoint pairs with shortest paths checked against its 1,353-word lexicon; reversals are not counted again. Logic Lattice has unique solutions and distinct grids after rotations, reflections, and color inversion. Memory Maze routes are distinct after translation, rotation, reflection, and reversal. Territory additions require two moves and remain distinct under all twelve hex symmetries.

Twin Hive's 140 challenges use five letter banks with distinct gold-letter pairs, each supporting at least 22 accepted answers. Spare recombines 120 approved antonym pairs, Split recombines 60 approved word/clue entries, and Syntax Siege makes 120 schedules from 18 wave banks. Quadra's 90 additions draw from 30 category pools containing 237 distinct words, with one complete partition per added rack within its category pool. Pattern Prism has 150 boards covering 125 distinct rule structures after ignoring label changes and cycle phase; all three predictions are unambiguous for the disclosed cycles of at most four elements.

Claude's three smaller banks reach 120 each. Dovetail uses 261 approved words and 330 directed joins, without repeating a five-word run in an added chain. Splice uses 380 approved fragment pairs representing 379 words; every added board has one oriented complete matching and meaningful alternate joins. Keystone offers 120 three-arch daily sets drawn from 174 distinct, uniquely solvable arches; a new set never repeats two arches together, and each arch occurs at most three times. Sprout (128), Claude Tangle (160), and Tumbler (1,054) are unchanged.

The Kimi banks already contain 3,362 puzzles and remain unchanged, including order, daily mapping, and compiled runtime assets. No recolored or shuffled copy was added just to increase their totals.

## Saved games and daily rollout

Published puzzle prefixes and IDs are preserved. Shared-runtime daily saves now resolve the saved puzzle ID before restoring its state, so adding boards cannot silently replace an in-progress daily board. Invalid saved state still falls back to the scheduled puzzle. Terminal results remain final, and Practice remains separate from daily records.

An explicit release schedule preserves all earlier imported-game daily assignments. The expanded banks begin their new daily rotations on **October 23, 2026, at midnight America/Chicago**, starting with their first added board. Later unpublished additions cannot change that established rotation. Full practice banks are available immediately. Original games' October 20–22 daily identities remain unchanged; future extensions after their old rotations have wrapped require a new scheduling assessment.

## Verification performed

- **471 tests passed across 54 JavaScript test files** in the final integrated source: game engines, content, persistence, shared runtime, collection metadata, expansion guards, and offline-bundle fixtures.
- **24 Kimi tests passed** in the independent content audit. Its source data remains unchanged.
- **Five HTTP verifier regression tests passed**, covering exact assets, incorrect MIME types, stale HTTP-200 responses, redirected assets, and directory-route fallbacks. Total: **500 automated checks**, with no failures.
- All eight original content generators and both imported-bank generators passed deterministic `--check` runs. Every published puzzle prefix passed its integrity check. The independent runtime review compared 4,425 historical daily assignments with the previous implementation and found no differences.
- All **32 game pages opened in the managed browser preview**, rendered gameplay controls, and exposed Practice. A complete Pattern Prism practice board was solved through visible controls; daily played/solved remained zero.
- The collection home displayed **32 games · 8,001 puzzles · 5 creators**. See the [browser screenshot](ui-review/nas-puzzles-8001-1792678638518.jpg).
- The iOS bundle contains **263 runtime files**, matching canonical source by SHA-256. Native catalog counts and fixtures were updated. Structural validation covers 24 Swift source files, two targets, two shared schemes, and 29 XCTest methods.
- Local Linux validation does not compile Swift or run WebKit/XCTest. The repository's macOS workflow supplies native build verification for the pushed revision; consult that revision's workflow result separately.

Key commands:

```sh
node --test --test-isolation=none games/*/tests/*.test.mjs games/*/*.test.mjs scripts/*.test.mjs
node scripts/expand-imported-puzzles.mjs --check
node scripts/expand-claude-puzzles.mjs --check
node scripts/sync-ios-web.mjs --check
python3 ios/scripts/validate_project.py
python3 scripts/verify-nas.test.py
bash -n scripts/deploy-nas.sh
```

Each original game also exposes `npm --prefix games/GAME run verify:content` and `npm --prefix games/GAME run check`.

## NAS handoff

The configured destination is `Jbapckfan@192.168.1.155:/volume1/docker/family-game-portal`, Compose service `game-portal`, with the collection at `http://192.168.1.155:8080/games/daily/` on the home network.

The [deployment helper](../scripts/deploy-nas.sh) validates the repository origin, clean main branch, running Docker daemon, target inventory, and fast-forward ancestry before changing files. It recreates only the portal service and invokes the [HTTP verifier](../scripts/verify-nas.py). The verifier checks **311 exact assets and launch routes**, including root, the collection URL, and all 32 directory URLs. Redirected, wrong-type, missing, stale, or fallback content cannot pass. Independent review found no remaining actionable helper issue after redirect and directory-route checks were added.

The helper is prepared and verified locally; it has not been run on the disconnected NAS. See [deployment instructions](integration.md#nas-deployment). Remote testers also need a verified existing public HTTPS route; the LAN address alone is not an Internet sharing link. No public route has been inferred or created.
