# Alford Daily: unified, attributed game collection

## Current scope

The web collection and iOS catalog now contain **14 games from two credited developers**. This supersedes the earlier six-game iOS launch selection. The existing family portal's unrelated games remain intact; its Alford Daily entry opens this unified daily collection.

The user supplied one package named `Kimi_Agent_iOS 4-Game Monetization.zip`. It actually contains six games. Its original suite name is Pebbles. No exact Kimi model version was supplied, so the credit is **Kimi**, without an invented version. The eight games developed in this conversation retain **ChatGPT** credit.

| Original developer | Game | Stable ID | Mechanic | Prepared records |
|---|---|---|---|---:|
| ChatGPT | Ringcount | `ringcount` | Four cuts divide a numbered ring into equal sums | 90 |
| ChatGPT | Switchpath | `switchpath` | One complete route alternates higher and lower | 90 |
| ChatGPT | Counterpart | `counterpart` | Match ordered semantic relationships | 30 |
| ChatGPT | Shortlist | `shortlist` | Three letter scans, then one final word choice | 90 |
| ChatGPT | Second Sense | `second-sense` | One word answers a noun clue and a verb clue | 30 |
| ChatGPT | Sideways | `sideways` | Rotate letter rows to form clued vertical words | 90 |
| ChatGPT | Tradeoff | `tradeoff` | Swap letters between six clued words | 90 |
| ChatGPT | Inbetween | `inbetween` | Insert two-letter pairs to make larger words | 60 |
| Kimi | Cairn | `kimi-cairn` | Five growing anagrams, three to seven letters | 839 |
| Kimi | Morph | `kimi-morph` | Change one letter per step in a word ladder | 450 |
| Kimi | Tangle | `kimi-tangle` | Trace adjacent letters and earn points toward gold | 430 |
| Kimi | Hunch | `kimi-hunch` | Five-letter deduction with six guesses | 937 |
| Kimi | Circuit | `kimi-circuit` | Chain words across four letter arcs and cover every letter | 286 |
| Kimi | Quartet | `kimi-quartet` | Find four meaning-based groups among sixteen words | 420 |

Total: **3,932 prepared puzzle/answer records**. Each individual collection is finite and repeats independently; this total is not 3,932 days of fresh content in every game. Hunch and Quartet use familiar Wordle and Connections formats, respectively. Importing them is not a claim of new mechanics or commercial exclusivity.

## What makes it one app

- One home screen, one native Today/Record/Settings structure, and **All / ChatGPT / Kimi** filters.
- Visible **Developed by …** labels on cards and game screens; the native game menu also describes the game and its developer.
- One America/Chicago daily reset schedule, with date arithmetic that remains correct over daylight-saving changes and outside Central Time.
- A completion summary covering all 14 games even when a developer filter hides some cards.
- Local daily progress, practice separation, and offline iOS resources. Practice never adds a daily result. A reveal or loss does not become a solve.
- The normal app has no advertising, analytics, payment prompts, or working purchase product. The uploaded Pebbles demo purchase toggle is excluded.

The app credits original game development separately from ChatGPT's integration and repair work. Neither sorting by developer nor adding a game changes its attribution.

## Source provenance and integration boundary

The original Kimi ZIP is preserved byte for byte at `sources/kimi/original/Kimi_Agent_iOS_4-Game_Monetization.zip`. Its SHA-256 is:

`fa7f26863aef94f3fc85131e587312c1ddafcf0fd2f9f053095d4b7b2a8a9c17`

`sources/kimi/provenance.json` records original filenames, sizes, individual SHA-256 hashes, the original developer, and the adapted source directory. `packages/kimi-pebbles/IMPORT_REVIEW.md` records the incoming audit and exact fixes. Unused starter components, the inspection plugin, the separate suite home, and simulated commerce controls are omitted from the maintained integration. The original archive retains them as supplied.

Each future package should receive its own provenance entry and a developer-qualified game ID. Preserve an existing game's stable ID through later edits. Do not reuse generic names such as `morph` for another developer's imported game, and do not infer model versions from visual style or package contents. If authorship is not supplied, label it as unspecified until the user identifies it.

## Repairs made during this import

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

## Web and iOS packaging

The original eight games keep their existing directories and save prefixes. The imported games use six canonical documents under `games/kimi-<name>/` and one shared compiled bundle at `games/kimi-runtime/assets/`. No client-side router can silently change the active native game's identity. The shared dictionary is compiled into a local module, so the native app retains `connect-src 'none'`.

The native resolver allows exact game documents plus a constrained, non-navigable shared resource namespace. Path traversal, encoded separators, and symlink checks remain in place. Existing native v1 preferences/results continue to decode with their original identifiers and application bundle ID.

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

## Verification status

`verification-unified-2026-10-20.md` records the final source checks, browser results, and actual native workflow outcome for this integration. The prior six-game verification report remains historical evidence and is not used to imply that these new fourteen-game resources have passed until their own workflow completes.
