# Alford Daily: unified, attributed game collection

## Current scope

The unified web and iOS catalogs contain **32 games with five creator labels: ChatGPT, Kimi, DeepSeek, Qwen, and Claude**. This supersedes the earlier six-game launch selection and fourteen-game Kimi integration. Existing family-portal games remain intact; the Alford Daily entry opens this collection.

The supplied packages contain different levels of implementation. Kimi supplied six completed games in Pebbles. DeepSeek supplied six concepts and a SwiftUI hub with missing gameplay screens. Qwen supplied a playable Quadra prototype and five blueprints. Claude supplied six implemented web/SwiftUI games in Foreword. The original eight games developed in this conversation retain ChatGPT credit. No exact model versions were supplied.

| Creator | Game | Visible credit | Stable ID | Prepared records |
|---|---|---|---|---:|
| ChatGPT | Ringcount | Developed by ChatGPT | `ringcount` | 180 |
| ChatGPT | Switchpath | Developed by ChatGPT | `switchpath` | 187 |
| ChatGPT | Counterpart | Developed by ChatGPT | `counterpart` | 180 |
| ChatGPT | Shortlist | Developed by ChatGPT | `shortlist` | 180 |
| ChatGPT | Second Sense | Developed by ChatGPT | `second-sense` | 180 |
| ChatGPT | Sideways | Developed by ChatGPT | `sideways` | 180 |
| ChatGPT | Tradeoff | Developed by ChatGPT | `tradeoff` | 180 |
| ChatGPT | Inbetween | Developed by ChatGPT | `inbetween` | 180 |
| Kimi | Cairn | Developed by Kimi | `kimi-cairn` | 839 |
| Kimi | Morph | Developed by Kimi | `kimi-morph` | 450 |
| Kimi | Tangle | Developed by Kimi | `kimi-tangle` | 430 |
| Kimi | Hunch | Developed by Kimi | `kimi-hunch` | 937 |
| Kimi | Circuit | Developed by Kimi | `kimi-circuit` | 286 |
| Kimi | Quartet | Developed by Kimi | `kimi-quartet` | 420 |
| DeepSeek | Twin Hive | Concept by DeepSeek · Built by ChatGPT | `deepseek-twin-hive` | 140 |
| DeepSeek | Spare | Concept by DeepSeek · Built by ChatGPT | `deepseek-spare` | 120 |
| DeepSeek | Rung | Concept by DeepSeek · Built by ChatGPT | `deepseek-rung` | 120 |
| DeepSeek | Cipher | Concept by DeepSeek · Built by ChatGPT | `deepseek-cipher` | 120 |
| DeepSeek | Trail | Concept by DeepSeek · Built by ChatGPT | `deepseek-trail` | 120 |
| DeepSeek | Split | Concept by DeepSeek · Built by ChatGPT | `deepseek-split` | 120 |
| Qwen | Quadra | Developed by Qwen | `qwen-quadra` | 120 |
| Qwen | Logic Lattice | Concept by Qwen · Built by ChatGPT | `qwen-logic-lattice` | 120 |
| Qwen | Syntax Siege | Concept by Qwen · Built by ChatGPT | `qwen-syntax-siege` | 120 |
| Qwen | Memory Maze | Concept by Qwen · Built by ChatGPT | `qwen-memory-maze` | 120 |
| Qwen | Pattern Prism | Concept by Qwen · Built by ChatGPT | `qwen-pattern-prism` | 150 |
| Qwen | Territory Tactics | Concept by Qwen · Built by ChatGPT | `qwen-territory-tactics` | 120 |
| Claude | Dovetail | Developed by Claude | `claude-dovetail` | 120 |
| Claude | Splice | Developed by Claude | `claude-splice` | 120 |
| Claude | Sprout | Developed by Claude | `claude-sprout` | 128 |
| Claude | Tangle | Developed by Claude | `claude-tangle` | 160 |
| Claude | Keystone | Developed by Claude | `claude-keystone` | 120 |
| Claude | Tumbler | Developed by Claude | `claude-tumbler` | 1,054 |

Total: **8,001 prepared daily puzzle/answer records**. Keystone contributes 120 daily sets, each containing three arches drawn from 174 curated arches. Each bank is finite and repeats independently; this total is not 8,001 fresh days in every game. Every game now has at least 120 prepared boards. Twin Hive has 140, Pattern Prism has 150, and the other ten DeepSeek/Qwen games have 120 each. See [the October 22 puzzle expansion](verification-puzzles-2026-10-22.md) for content-pool sizes, validation, and deployment status. Hunch and Quartet use familiar Wordle and Connections formats. Importing them is not a claim of new mechanics or commercial exclusivity.

Kimi's Tangle traces adjacent letters on a grid. Claude's Tangle separates interleaved words while preserving letter order. They have separate IDs, credits, saves, and native catalog entries.

## What makes it one app

- One home screen, one native Today/Record/Settings structure, and **All / ChatGPT / Kimi / DeepSeek / Qwen / Claude** filters.
- Visible **Developed by …** or **Concept by … · Built by ChatGPT** labels on cards and game screens; the native game menu also describes the game and its developer.
- One America/Chicago daily reset schedule, with date arithmetic that remains correct over daylight-saving changes and outside Central Time.
- A completion summary covering all 32 games even when a developer filter hides some cards.
- Local daily progress, practice separation, and offline iOS resources. Practice never adds a daily result. A reveal or loss does not become a solve.
- The normal app has no advertising, analytics, payment prompts, or working purchase product. The uploaded Pebbles demo toggle and Foreword commerce/entitlement screens are excluded.

The app credits original game development and supplied concepts separately from ChatGPT's completion, integration, and repair work. Neither sorting by developer nor adding a game changes its attribution.

## Source provenance and integration boundary

The original Kimi ZIP is preserved byte for byte at `sources/kimi/original/Kimi_Agent_iOS_4-Game_Monetization.zip`. Its SHA-256 is:

`fa7f26863aef94f3fc85131e587312c1ddafcf0fd2f9f053095d4b7b2a8a9c17`

`sources/kimi/provenance.json` records original filenames, sizes, individual SHA-256 hashes, the original developer, and the adapted source directory. `packages/kimi-pebbles/IMPORT_REVIEW.md` records the incoming audit and exact fixes. Unused starter components, the inspection plugin, the separate suite home, and simulated commerce controls are omitted from the maintained integration. The original archive retains them as supplied.

The DeepSeek originals, Qwen generator text, and Claude Foreword ZIP are likewise preserved under `sources/deepseek/`, `sources/qwen/`, and `sources/claude/`. Each provenance record contains original hashes and the supplied implementation status. Qwen's embedded reference files were extracted as Python AST string literals; the supplied generator was not executed. Foreword contains 55 files; its archive and per-file hashes are preserved.

Each future package should receive its own provenance entry and a developer-qualified game ID. Preserve an existing game's stable ID through later edits. Do not reuse generic names such as `morph` for another developer's imported game, and do not infer model versions from visual style or package contents. If authorship is not supplied, label it as unspecified until the user identifies it.

## Kimi integration repairs

The source audit validated all 3,362 supplied starting solutions/answer records. Recoverability and reliable restoration needed additional work:

- Cairn now saves its shuffled rack and commits completed levels atomically, preventing changed letters and duplicated levels after reload.
- Morph and Circuit provide undo and restart for submitted moves. Previously legal choices could leave the player unable to continue despite a valid starting solution.
- Morph's route target is described as a supplied-route target. Most original stated pars were not shortest under its broad accepted dictionary.
- Quartet preserves the hinted pair, records the final fourth mistake correctly, and corrects the documented PING/PIN and category-label mistakes.
- Hunch reconstructs feedback from validated guesses. Tangle reconstructs score and medals from valid unique words.
- All six validate incoming saves, reload current game statistics, and use namespaced storage. Original unqualified Pebbles keys are not automatically imported into this application's origin.
- A separate result adapter derives terminal daily statistics from completed records. Cairn skips and Morph/Circuit give-ups become revealed results; Hunch/Quartet unsuccessful rounds become losses; Tangle gold is a solve even if the player keeps finding words.
- The first terminal daily result is preserved, including when browser persistence fails and the latest value can only be retained in memory.

Mechanical validation is not a complete editorial review. The supplied dictionary contains uncommon entries and abbreviations, and all 420 Quartet category sets have not received human editorial approval. The dictionary’s origin and distribution permissions still need to be established for commercial distribution. The eight fonts identify OFL licensing; complete official notices and metadata verification are recorded in `sources/kimi/font-provenance.md`. These limitations remain visible in the import review rather than being concealed by the app's developer labels.

## Completed concepts and shared behavior

DeepSeek's six implementations now include actual gameplay, at least 120 prepared records per game, explicit hints and reveal states, validated saves, and finite daily rotations. Rung computes shortest pars against its actual 1,353-word curated lexicon. Trail and Split preserve distinct physical letter identities. Cipher enforces a one-to-one substitution alphabet. Spare records three distinct failed pairs as a loss.

Qwen's Quadra preserves its first thirty boards (including all sixteen supplied category boards) and adds ninety prepared boards. The other five games implement the supplied blueprints: uniquely solvable binary grids, timed anagram defense, path recall, multidimensional pattern prediction, and two-move hex captures. Syntax Siege starts only when the player chooses Start; practice is untimed and daily play offers a recorded untimed assist. The common clock pauses while hidden or in a help/reveal dialog and resumes correctly after back/forward-cache restoration.

All eighteen new modular games share the same Central-date, record, storage-fallback, practice, hint/reveal, spoiler-free sharing, and native-progress contract. A native resource namespace retains the internal name `deepseek-runtime` because it was introduced for that first import; it does not determine the visible creator credit. Game rules and prepared content remain in separate creator-qualified directories.

Claude's original game mechanics and prepared banks are adapted into this contract. Dovetail preserves 64 eight-word and 13 seven-word chains and adds 43 distinct eight-word chains from approved joins. Splice preserves seventy uniquely oriented matchings and three boards with a second valid orientation, then adds 47 uniquely matched boards; both are accepted, so the UI does not promise one unique orientation on every board. Imported SwiftUI hubs and duplicated subscriptions are retained in the preserved source only. Repair details and verification for the expanded release are recorded in `verification-expanded-2026-10-20.md`.

## Web and iOS packaging

The original eight games keep their existing directories and save prefixes. The imported games use six canonical documents under `games/kimi-<name>/` and one shared compiled bundle at `games/kimi-runtime/assets/`. No client-side router can silently change the active native game's identity. The shared dictionary is compiled into a local module, so the native app retains `connect-src 'none'`.

The native resolver allows exact game documents plus constrained, non-navigable Kimi and shared-module resource namespaces. New modular games use only their own runtime files and the three approved shared modules/styles. Path traversal, encoded separators, and symlink checks remain in place. Existing native v1 preferences/results continue to decode with their original identifiers and application bundle ID.

To rebuild imported games and refresh native resources from the repository root:

```sh
npm ci --prefix packages/kimi-pebbles --ignore-scripts
npm test --prefix packages/kimi-pebbles
npm run build --prefix packages/kimi-pebbles
node scripts/sync-ios-web.mjs
node scripts/sync-ios-web.mjs --check
python3 ios/scripts/validate_project.py
```

The normal Xcode scheme is `AlfordDaily`. Simulator verification uses the private repository's iOS workflow. The separate StoreKit scheme remains a local commerce test harness. Signing, device installation, TestFlight, App Store distribution, and live purchases still require their own account configuration and release steps.

## Monetization implications

Keep the existing collection-wide model: free daily play with a future permanent Remove Ads entitlement covering the entire app. Adding creators should not add separate paywalls or entitlements. Developer credit should remain visible in both free and paid versions.

The integration does not activate advertising or accept payments. Before a commercial launch, finish editorial review, confirm or replace imported third-party assets and dictionary data, configure the Apple account and product, and validate the real purchase/restore flow. The earlier pricing and revenue scenarios remain hypotheses, not forecasts; see `ios-launch-and-monetization.md` for the original strategy and this document for the expanded scope.

## Adding future game packages

Preserve each incoming archive before adapting it. Record its original developer, supplied model version if known, archive SHA-256, and per-file hashes under `sources/<developer>/`. Keep the original development credit when integration or repairs are performed by another model, and record those contributions separately.

Each imported game receives a permanent developer-prefixed ID, independent save keys, a canonical local document, and a catalog entry with visible attribution. Add its creator to the web and native filters, connect daily results through the existing adapter contract, and include its assets in the constrained native resource allowlist. Existing game IDs and progress keys must remain unchanged.

Before enabling a new game, validate every supplied puzzle against its rules, inspect semantic content and third-party asset provenance, test save/restore and daily/practice separation, and include the real game document in the native offline smoke test. The shared home and collection-wide monetization remain common across all creators.

## Verification status

`verification-expanded-2026-10-20.md` records checks and release status for the expanded collection. `verification-unified-2026-10-20.md` retains the completed fourteen-game baseline, including its 24-test native pass; it is historical evidence and is not substituted for verification of the expanded app.
