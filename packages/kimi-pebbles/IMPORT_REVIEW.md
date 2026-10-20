# Kimi Pebbles import review and adaptation record

Reviewed 2026-10-20. Original developer attribution: **Kimi**. Original collection name: **Pebbles**. The original user-supplied archive and its provenance are preserved separately under `sources/kimi/original`; changes below affect only this adapted package.

## Scope and method

The supplied ZIP contains six React games despite its four-game filename. The review inspected engines, hooks, data, storage, routing, shared utilities, build configuration, and premium UI. Independent standard-library Python/Node validators checked puzzle data. The original package was not installed or executed during the read-only audit. Subsequent adaptation and tests use Alford Daily's minimal reviewed package dependencies.

These are supplied games being organized and preserved. Hunch uses familiar Wordle rules; Quartet uses the familiar Connections grouping format. This review makes no claim that their mechanics are newly invented or unique.

## Rules and data validation

| Game | Rules in the supplied package | Records | Audit result |
| --- | --- | ---: | --- |
| Cairn | Five anagram racks grow from three letters to seven, adding one letter at each level. Any accepted word using the entire rack counts. | 839 | Every chain has lengths 3–7, exact add-one-letter transitions, and dictionary-valid answers. All letter-multiset chains are distinct. |
| Morph | Four-letter word ladder: change one letter at a time, with no repeated submitted words. | 450 | Every supplied route has legal edges, valid words, correct endpoints, and the stated move count. 357 supplied route lengths are not shortest in the actual accepted dictionary. |
| Tangle | Trace words through a 4×4 grid with eight-way adjacency and no cell reuse; score toward bronze, silver, and gold. | 430 | All 30,688 listed word instances are traceable. All featured words, word counts, maximum points, and medal thresholds agree. No repeated grid under rotation/reflection. |
| Hunch | Five-letter hidden word, six guesses, correct/present/absent feedback. | 937 | All answers are distinct five-letter lowercase dictionary words. Evaluation uses two-pass duplicate-letter accounting. |
| Circuit | Chain words through 12 letters on four arcs. Consecutive letters use different arcs; each word starts with the previous word's last letter. Cover all letters. | 286 | All 44,940 listed word instances and every supplied covering chain obey the rules. All stated pars are minimal: 56 two-word boards, 230 three-word boards. |
| Quartet | Find four fixed groups of four among 16 words, with four allowed mistakes. | 420 | All boards have 16 unique tiles and tiers 1–4. No duplicate grouping. Structural validity is not a certification of every semantic category. |

Total: **3,362 puzzle/answer records**. All supplied starting solutions validate. Circuit minimums were proved by enumerating every one-word and legal two-word covering chain; the remaining supplied three-word solutions establish their minimum of three.

## Original findings and implemented game fixes

### Recoverable legal play

Morph's original no-repeat rule and missing undo could strand a player. Puzzle 1 admits `shaw → scaw → scam → scfm → scfh`; the final word's only dictionary neighbor is the already-used `scfm`, while the target is `cold`. Circuit had 440 accepted dead-end opening words across 56 boards. On board 2 (`erusodbgcwmi`), `become` covers only five letters and requires an E-starting continuation, but none is accepted.

**Adaptation:** Morph now exposes Undo rung and Restart ladder. Circuit exposes Undo word and Restart chain. These recover the same unfinished puzzle, preserve hint use and mistakes/statistics, and make the validated initial solution reachable again. Terminal rounds remain terminal.

### Cairn rack and transition persistence

The original shuffle reordered the rack but saved only slot indices, so refresh could change the letters already entered. The original level transition saved the completed result and advanced the level in separate delayed updates, allowing duplicate results if refreshed between them.

**Adaptation:** progress now stores and validates the actual rack alongside slot indices. A pure `completeCairnLevel` transition updates the completed result, next level, next rack, and slots atomically. Animation delays do not save a completed result beside the preceding level. Starting another mode cancels pending advancement timers. Already-used letter-prefix hints remain visible after restoration. Skipping a level now consistently marks a daily round as played.

### Validated saves

Original hooks largely trusted parsed JSON. Missing arrays, wrong types, impossible routes, and stale feedback could crash rendering or misstate results.

**Adaptation:** game-local progress validators bound array sizes and counts, validate used fields, and reject inconsistent states. Cairn checks rack/answer multisets and unique slot indices. Morph checks word membership, one-letter edges, repeat prohibition, and terminal endpoints. Hunch validates guesses and hint letters, then recomputes evaluation and terminal state. Circuit validates chain membership, arc rules, and coverage. Tangle reconstructs score/gold from accepted unique found words. Quartet validates tile identity, solved groups, and guess history. Boolean daily-play markers are normalized rather than trusting truthy malformed values.

### Fresh statistics on navigation

All six original hooks loaded statistics into a module-level initial object. SPA remounts reused those stale totals.

**Adaptation:** statistics load in each hook's state initializer and reload when returning to daily play. Per-game help keys are developer qualified. Cairn's private storage uses `kimi:cairn:v1:*`; the shared storage namespace is provided by the Alford Daily integration.

### Quartet hint and fourth-miss fixes

The original free-hint counter persisted while the highlighted pair disappeared after reload. Its fourth wrong guess ended the round but retained a counter of three.

**Adaptation:** the clue persists by unique word identity and survives shuffle, unrelated group solves, and wrong guesses; it clears when its group is solved. The fourth miss is stored as four. Restoration derives misses from validated history, also repairing the original stale count.

### Fair Morph target wording

The supplied `par` field often overstates the shortest route under the actual dictionary. For example, board 141 gives SAND→SOFT a six-move route, but `sand → sant → saft → soft` is accepted in three moves.

**Adaptation:** original data and medal thresholds are preserved. UI, help, results, shares, and code comments call this the **supplied route target**, with an explicit explanation that shorter routes can exist. The reveal is labeled one suggested route, not an optimal route. A previously consumed route hint can be reopened without another charge and is visible after reload.

### Other adaptation details

- Each of the six game pages calls the shared `useUnifiedProgress` bridge and adds `data-game-ready="true"` to its rendered board wrapper after loading.
- Game-specific Pebbles+ promises were replaced with neutral per-round hint wording. The integrated shared policy supplies no demo premium purchase controls.
- Restoring Tangle at gold no longer replays its fresh-win celebration.
- Cairn re-exports the shared calendar/date helpers so it follows the same Alford Daily day boundary as the other games. All six hooks also check their existing visibility callback every 30 seconds, advancing a visible daily across midnight while preserving hidden tabs and practice rounds; cleanup removes both the timer and visibility listener.

## Exact editorial changes

Puzzle IDs below are one-based positions in `src/games/quartet/data/puzzles.json`; board ordering is unchanged.

**`ping` → `pin`, only in the category `Words before "ball"`:**

139, 172, 232, 239, 265, 325, 369, 386.

**`Hidden animals` → `Animals`, label only:**

28, 68, 89, 93, 97, 107, 124, 127, 156, 158, 173, 185, 189, 192, 207, 209, 210, 227, 279, 285, 308, 372, 417.

No broad vocabulary removal, puzzle regeneration, board reordering, score changes, or medal-threshold changes were performed.

## Shared integration observations from the original audit

The original daily helper floored the timestamp of local midnight. Under Europe/London it assigned both 2026-03-29 and 2026-03-30 to day 20541, and jumped from 20750 to 20752 on October 25–26. This affected puzzle selection, saves, and streaks. The integrated shared date layer owns the Chicago calendar convention and regression cases for both DST boundaries.

Original storage keys such as `morph:stats` and `morph:day:<number>` were distinct within this package, but unversioned and not developer-qualified. The adapted namespace prevents collisions with other supplied packages. Unqualified old keys are not migrated because their origin is unknown.

The original package assumed ownership of the web root through BrowserRouter routes, root fonts/icons, back links, and a root-scoped PWA manifest. Alford Daily owns the unified routes, asset staging, navigation, native bridge, and attributed collection shell.

The only original game-source fetch loaded a bundled dictionary through a Vite asset URL. No game API, analytics endpoint, remote script injection, eval, or new Function was found in the inspected game source. The original loader neither checked response status nor recovered from a rejected loading promise. The adapted shared dictionary is bundled as text, removing that runtime fetch.

The original package had no custom install script. Its lockfile contained install hooks for esbuild/fsevents and resolved 127 packages through npm.mirrors.msh.team, with 407 through registry.npmjs.org. Its Vite configuration enabled kimi-plugin-inspect-react. The read-only audit did not install or inspect that dependency implementation. Alford Daily uses its own minimal dependency/build configuration.

## Monetization and attribution

The original Pebbles+ screen was explicitly a demo: displayed prices, demo messages for plan buttons, a localStorage premium toggle, and a restore-purchase stub. It implemented no payment SDK, ad SDK, rewarded-ad flow, archive, theme system, or deep statistics despite advertising some of these. The integration omits this demo sales flow.

Keep visible **Original developer: Kimi** attribution on every imported game and preserve the Pebbles collection provenance. Integration and maintenance changes do not reassign original authorship.

## Remaining limitations

- The original dictionary has 97,109 entries, including abbreviations, proper names, and unusual strings. Tangle accepts examples such as CCW, CFS, CFM, and III. This policy has been preserved rather than described as a fully edited production word list.
- Restricting Tangle to the supplied 3,774-word Cairn `common.txt` subset leaves all 430 boards below gold. Board 1 yields eight points from that subset versus a gold target of 52. This measures dictionary scope; it does not imply every excluded word is obscure.
- Quartet's known category errors were corrected, but all 420 semantic groupings have not received a human editorial review.
- The original package supplied no dictionary provenance or bundled font/license notice files. Record and resolve distribution provenance for those third-party assets before a public commercial release; this does not block the authorized private integration.
- This implementation pass does not claim browser, native-device, App Store, or production-publication verification. The parent integration workflow owns those checks.

## Verification

Run all focused game and shared-integration tests with `npm test`. The configured runner uses `node --import tsx --test --test-isolation=none tests/*.test.mjs tests/*.test.ts`, which resolves the TypeScript hooks and prints individual assertion cases. A disposable intentionally failing TypeScript assertion was run through that exact setup; it exited nonzero and reported the expected mismatch, confirming assertions execute.

The regression suite covers the audited Morph/Circuit dead ends, undo/restart, Cairn shuffled-rack preservation and every level transition, malformed saves, Hunch feedback reconstruction, Quartet clue persistence and fourth-miss repair, Tangle score reconstruction, exact content correction counts, and hook remount statistics. Across the game tests, **all 3,362 bundled completed solutions pass their new save validators**. Shared-integration tests additionally cover Chicago DST dates, truthful outcomes, practice isolation, first-terminal finality, and streak handling.

The full package TypeScript check passed after these changes. Focused test details for Circuit/Tangle/Quartet are also recorded in `tests/kimi-path-changes.md`.

## Subsequent font-provenance resolution

The original archive did not contain full font notices. Its eight font files identify OFL licensing in their metadata. Complete matching official notices are now in `public/fonts/`, with source URLs and byte/hash checks in `sources/kimi/font-provenance.md`. Font binaries remain unchanged. Dictionary origin and distribution rights are still unresolved.
