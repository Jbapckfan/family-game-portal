# DeepSeek and Qwen preparation for individual review

**Historical isolated-worker checkpoint.** Final integrated source counts, subsequent review fixes and web/native/offline verification are in [the November 1 collection report](../../reviews/REMAINING-GAMES-2026-11-01.md). The initial 409,097-word figures and pre-fix behavior below are retained as provenance.
November 1, 2026. Isolated worktree: `/Users/jamesalford/Projects/MAKER-codex__remaining-dq-20261101`; branch `codex/remaining-dq-20261101`. No shared home/catalog/calendar, native bundle, deployment, or personal browser state was changed. This is a substantiated repair and review-preparation pass, not a rating of enjoyment or a claim of perfection.

## Reproduced issues and changes

- **Twin Hive rejected valid rack words** because its answer list was also its dictionary. It now accepts the existing pinned full-source union filtered by the existing 4–24-letter, eight-letter-rack and two-required-letter rules. For example, MARINATE and TRAINER were rejected on `twin-5-2` despite meeting its rules. The six-word goal, scoring, board records, letter reuse and save format stay intact. Familiar authored words and the earlier EARS supplement remain first in hint order.
- **Syntax Siege punished valid English rack words with damage** when they were absent from its short prepared list. Acceptance now includes every pinned 3–6-letter word spellable with the wave's actual tile multiplicities. Examples include LIT on the LISTEN rack, SIR on SPRING and RED on THREAD. Played expanded words restore correctly; repeated words still deal no further damage. Six fixed waves, HP, duration, damage, points and authored six-letter hints remain intact.
- **Rung's 1,353-word dictionary omitted ordinary words**, including AJAR, AMMO, ATOP, AVID, BRIE, CHIA, MISO, OKAY and YEAH. Its accepted set is now the exact 8,141-word pinned four-letter union. An independent substitution-based graph search agrees with the engine's shortest distances for every endpoint pair. Expanded legal paths shorten 139 of the 200 published pars. The UI now computes current shortest distances. The original first 30 pars had been recomputed from the live dictionary at module import; freezing their original values preserves every published record hash. Existing endpoints, IDs, order, saves and previously legal words remain intact. Hints break equal-distance ties in favor of the earlier familiar vocabulary.
- **The twelve games used small type and warm/purple presentation.** Each game's own CSS now opts into a cool blue/teal frame, clearer dark text, larger prompts and controls, and consistent light panels. Game motifs remain distinct: golden Hive anchors, opposite-word cards, ladder rungs, cryptogram tiles, a nine-letter trail, two clued rows, category rack, count grid, defense stage, memory path, named visual attributes and a hex position. Local icon colors match the new frame. Spare uses two columns on narrow screens so long antonyms remain readable.
- **Cipher's long mobile phrases separated the selected code from its keyboard.** The selected-code context, alphabet and erase/clear controls are now one sticky mobile unit. Completed phrases hide those input controls while retaining the decoded answer. Actual mouse/keyboard inputs still solve and restore the game.
- All twelve app configurations now supply the root-owned `assistanceCount(puzzle,state)` callback using the real hint field. Syntax Siege separately supplies `untimedAssistance(puzzle,state)`. The shared runtime is intentionally left to the root integration; the isolated branch's older runtime does not yet append these counts to copied shares. No answer-bearing summary is passed as share text.

## Word-source and acceptance boundary

The generation inputs are the already retained, checksum-pinned dwyl English, Wordnik game-word and ENABLE2K files, plus the six documented Zynga examples: **409,097 distinct entries** before game rules. No downloads, APIs or dependencies were added. All four upstream license/attribution notices are copied verbatim next to each of the three generated dictionaries and linked with `rel="license"`.

Twin Hive's 200 boards now have 292,365 board/word memberships, compared with 12,625 authored memberships. Only eight rack dictionaries are shipped; each board still enforces its own gold letters. Syntax Siege's eighteen distinct rack dictionaries contain 33–194 pinned words each. The browser loads only a game's filtered generated module, not the upstream source files.

Split and Trail remain clue-specific; Quadra remains a finite category-and-sixteen-tile puzzle. Their words are not broadened by treating any corpus entry as a correct clue or category answer. An exploratory exact-partition audit over the supplied Quadra category vocabulary found no alternative four-word partitions for its boards. That does not establish that no other English category word exists.

The upstream union includes obscure, historical, taxonomic and potentially sensitive terms. The existing closed Tangle exclusion list is explicitly game-specific; this pass does not invent or silently expand a new editorial exclusions policy. Broad acceptance is not a guarantee of human familiarity, comprehensive English coverage, or exact current Words With Friends/NASPA parity.

## Verification

`MAKER-Codex__all-bank-and-dates.json` records every actual date selection and full-bank hash. The audit executes each engine's real input transitions and restores JSON after every transition.

| Game | Stored records | Substantive configurations | Distinct Nov 1–May 1 selections |
|---|---:|---:|---:|
| Twin Hive | 200 | 200 | 182 |
| Spare | 200 | 200 | 182 |
| Rung | 200 | 200 | 182 |
| Cipher | 200 | 200 | 182 |
| Trail | 200 | 200 | 182 |
| Split | 200 | 200 | 182 |
| Quadra | 200 | 200 | 182 |
| Logic Lattice | 200 | 200 | 182 |
| Syntax Siege | 200 | 200 | 182 |
| Memory Maze | 200 | 200 | 182 |
| Pattern Prism | 225 | 200 | 182 |
| Territory Tactics | 200 | 200 | 182 |

The total is **2,425 stored records**, **2,184 date selections**, and **34,960 restorable transitions**, with normal wins and distinct revealed outcomes on every record. The independent checks include a cell-by-cell Lattice constraint solver, a direct-substitution Rung graph, a Trail path DFS, Prism's visible-cycle ambiguity check, and a separate axial-coordinate capture solver. Memory paths are independently checked for orthogonal adjacency, no repeats and clear route cells. Central midnight checks cover both ends of the tested interval. None of these selections repeats a challenge scheduled October 20–31.

- **244 scoped engine/runtime/imported-bank tests passed, zero failures/skips.** These also cover existing daily/practice persistence, malformed saves, hint/reveal behavior, loss conditions, timer damage, and immutable published records. The independent corpus tests parse all three pinned source formats themselves and compare complete rule-filtered accepted sets, rather than reusing the generation helper.
- **36 isolated headless Chrome flows passed:** all twelve games at 320, 393 and 1280 pixels. Every flow checks readable intro/buttons, no horizontal page overflow, help, hint/reload, reveal/reload, spoiler-free sharing and separate Practice. Actual button/keyboard inputs solve all twelve in the 393-pixel context; the resulting Practice states remain valid wins after reload while Daily retains its revealed result. Reload opens Daily, matching existing session semantics.
- Phone screenshots of all twelve games were inspected. Layout assertions cover all three widths; these are headless browser checks, not physical-device certification.
- `git diff --check` passed.

Commands:

```sh
NODE_PATH=/Users/jamesalford/Projects/MAKER-codex__alford-daily-six-months/packages/kimi-pebbles/node_modules node --test games/deepseek-*/engine.test.mjs games/qwen-*/engine.test.mjs games/deepseek-runtime/*.test.mjs games/qwen-quadra/elite-ui.test.mjs scripts/imported*.test.mjs scripts/MAKER-Codex__dq-lexicon.test.mjs
node scripts/MAKER-Codex__audit-dq.mjs
node scripts/MAKER-Codex__dq-browser.mjs
node scripts/MAKER-Codex__generate-dq-lexicon.mjs
```

The browser harness uses the existing Chrome Playwright installation, isolated contexts and intercepted filesystem responses at a test-only origin. It starts no service, opens no visible tab and touches no personal save. Chrome startup required the sandbox's approved headless execution escalation. Evidence includes the meaningful lexical and readability red/green regressions. The initial expanded-dictionary run also exposed the original Rung import-time par mutation; its immutable-record regression now passes unchanged.

## Integration and remaining gates

The root must add `word-acceptance.mjs` and `word-lists-LICENSE.txt` to `SHARED_GAME_OPTIONAL_FILES` in `scripts/sync-ios-web.mjs`, then regenerate/stage the native and web bundle. That packaging allowlist currently omits these new files. Root also owns the shared-runtime assisted-share callbacks and their integrated tests. This branch intentionally does not edit those shared/native surfaces.

Freshness means different whole-board configurations under the existing substantive signatures. Racks, words, clues, category ingredients and patterns can recur in different combinations. The next 182 dates are verified, not a perpetual freshness promise. Human word/clue/category/antonym familiarity, ambiguity outside the supplied semantic vocabulary, challenge balance, enjoyment, screen readers, physical touch, timing, audio/haptics, thermal behavior, native packaging and Safari/WebKit remain review or hardware gates. The full project/native suite and external individual panel reviews belong to root integration; the 244-test result is scoped to this group and its shared runtime regressions.
