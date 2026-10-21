# Expanded collection verification — October 20–21, 2026

## Scope and current gate

Target: 32 playable daily games with five creator labels. Eight ChatGPT games and six Kimi games retain their original IDs. Six DeepSeek concepts are completed by ChatGPT. Quadra retains Qwen development credit; five other Qwen concepts receive separate ChatGPT completion credit. Six implemented Claude games retain Claude development credit.

The 32-game implementation is complete and has passed the web, engine, source-preservation, and native resource checks below. The older fourteen-game native pass is a baseline only. It is not evidence for the expanded native build. Publication and exact-commit native CI are recorded separately below.

## Completed new rule and runtime checks

- 31 named DeepSeek tests passed across all six games. Every starting puzzle was checked for a valid solution, including Rung BFS pars, Cipher substitutions, Trail paths, and duplicate-safe Split allocations.
- 33 named Qwen tests passed across all six games. All thirty Logic Lattice boards have exactly one solution under their real clues; every Territory position is solvable within two moves and every legal opening can recover through undo/hints. All Maze paths are orthogonal, nonrepeating, and unobstructed. Siege tests cover its final-impact loss and real time/health validation.
- 16 shared-runtime tests passed, covering Central midnight and DST, first-terminal records, quota fallback, practice isolation and resumption, corrupt saves, stale-day moves, timer pauses, back/forward-cache restoration, focus/caret retention, visible native credits, and spoiler-free share payloads.
- The clock focus regression was observed failing before the correction and passing afterward.
- Practice now resumes an unfinished saved board, including after reload and across a new Central date. Next practice deliberately starts another board. Both new regression cases failed before the correction and passed afterward.
- 40 named Claude engine/shared-session tests passed. All 77 Dovetail, 73 Splice, 128 Sprout, 160 Tangle, 58 Keystone daily sets, and 1,054 Tumbler answers were checked. Tests cover valid paths, alternative pairings, duplicate bead identities, persistent penalties, real saves, and terminal outcomes.
- The original fourteen-game native build passed 24 tests with zero failures at commit `8e31a6d066008e5bfe30164c80f9422f1f33414f`; see the historical `verification-unified-2026-10-20.md`.

## Browser observations

All twelve DeepSeek/Qwen screens loaded in 320-pixel frames. Their document scroll width equaled their available viewport width, with no horizontal document overflow. Visible labels distinguish supplied development from concept completion.

- Twin Hive accepted CRATE and persisted the found word.
- Spare was played to a four-pair win, correctly identified WINDOW as the spare, and restored the daily win after reload.
- Rung accepted POOR → DOOR; Undo restored POOR.
- Cipher's hint confirmed a letter and preserved its hint count.
- Trail was played through PAPERCLIP using all nine adjacent cells.
- Split allocated distinct duplicate E tiles to BRAVE and QUIET, recorded a win, and restored it after reload.
- Split's keyboard Enter action respects focused buttons. Enter on Word 2 selects that row; Enter on its R tile adds that tile. Returning from Today to Practice retained the unfinished board and announced that practice resumed.
- Quadra accepted JAZZ, ROCK, SOUL, and FUNK with distinct repeated-letter tiles, recorded a win, and restored it after reload.
- Logic Lattice cycled an unknown square, undid the edit, and applied a correct fixed-cell hint.
- Syntax Siege remained at 20 seconds and full core health while Help stayed open during other interactions. After closing Help, untimed assistance paused the clock. STREAM dealt 60 damage, completed wave one, and advanced to wave two with 36 points. Reload retained the wave, score, and assistance state.
- Memory Maze displayed its eleven-square study route, transitioned to recall, accepted the complete route, and recorded a win.
- Pattern Prism accepted three correct successive choices and displayed completion.
- Territory Tactics applied one hinted placement, accepted the second manual placement, captured all three target stones, and recorded an assisted win.

All six Claude screens also fit the 320-pixel frames without horizontal document overflow. Each showed Developed by Claude.

The unified home also fit a 320-pixel frame without horizontal overflow. Its five creator filters showed 8, 6, 6, 6, and 6 visible cards; All showed 32. The hero, daily progress denominator, filter summary, and About copy agree. A browser screenshot of the completed Claude collection is preserved in `images/unified-claude-2026-10-20.jpg`.

- Dovetail was solved through HAND → GUN → FIRE → FLY → WHEEL → CHAIR → PERSON → HOOD. A plausible wrong join showed useful feedback; a letter hint charged one miss. The solved chain and two total misses survived reload.
- Splice paired all twelve fragments into six words, including PARTNERSHIP, SPACECRAFT, and PASSIONS, and restored its zero-mistake win after reload.
- Sprout was solved through DIP → DIPS → SPIED → DISPEL → SPINDLE → SPLENDID. A word absent from the supplied list used no wilt; the complete eight-letter bloom survived reload.
- Dovetail and Sprout accepted a physical-keyboard edit inside the word without moving the caret to the end; the selection was read back from the actual input after the edit.
- Tangle was solved as CLIMB, FORTH, and PULLING using the exact numbered bead copies. All three pulls and the daily win survived reload.
- Keystone solved LET, POWER, and TEN across all three arches. An incorrect guess opened another clue; explicit Next arch advancement preserved the preceding score. The app recorded the daily win only after the third arch, with total score 8.
- Tumbler narrowed its alphabet ranges through CRANE and DIZZY, persisted its history and one hinted dial, and unlocked RAZOR on the third accepted guess. An unlisted word used no guess.

## Claude source findings

The unchanged Foreword ZIP contains 55 files. Its SHA-256 is `312ff2309fd09d9f342b4352b0d2dc59c0f8f48fcd4a619d23843ed66868ad29`.

Dovetail contains 64 eight-word chains and 13 seven-word chains. All 77 are retained with their actual missing-word counts. Splice contains seventy uniquely oriented perfect matchings and three boards with two valid orientations; the adapted engine accepts those valid alternatives. Sprout's 128 seeds all have a route to eight letters. Its supplied levels classify 1,706 continuing entries and 399 dead-end entries; some dictionary entries are not reachable from their individual seed and do not create extra playable paths.

## Final integration checks

- 423 distinct named JavaScript/TypeScript checks passed: original eight games 258; Kimi 24; DeepSeek 31; Qwen 33; Claude 40; shared runtime 16; catalog/provenance 6; resource-bundling/security fixtures 15. The main 44-file run passed 398 tests before the final added validator regression; the final fixture rerun passed all 15. No failures or skipped tests.
- Two independent bounded reviews found no remaining critical or important mechanics/save blocker. Additional mixed-action checks round-tripped 54,838 DeepSeek/Qwen outputs and 22,865 Claude reachable states without rejecting a legitimate saved state.
- The Claude review independently compared all six adapted banks to the original JSON, excluding only added identifiers. All records and ordering matched.
- The shared review's practice-resumption issue and minor Split keyboard issue were fixed and verified. The Claude review's two minor caret issues were fixed and reproduced successfully in the browser.
- `node scripts/sync-ios-web.mjs --check` verified all 32 game entries, two shared runtimes, and 241 bundled runtime files with matching file sets and SHA-256 hashes. Tests and development documents are excluded from the app bundle.
- `python3 ios/scripts/validate_project.py` passed: 24 Swift files, two targets, two shared schemes, and 29 XCTest methods. A dictionary containing the word import exposed an overly broad dependency regular expression; the corrected scanner treats strings/comments as data and retains static, re-export, dynamic, remote, missing-file, and cross-game dependency validation. Its regression failed before the fix and passed afterward.
- The portable-source inventory verified the preserved Kimi archive's 144 files, both DeepSeek originals, Qwen's original plus six extracted references, and Claude's archive with all 55 files. The repository-backed source is not duplicated into another storage system.

## Private GitHub and Site publication

The existing owner-private Site was successfully updated to all 32 games. Its audience remains the sole owner, with no groups or external visitors. Deployment evidence:

- URL: https://alford-daily.jbapckfan.chatgpt.site
- Site source commit: `c733b8e3c3b6fb2fc19584ac745404fc9e2af9e0`
- Deployment: `appgdep_6ad81661fbfc81919b7c910a74224a62`
- Saved version: `appgprj_6ad77f0216348191a061da38c4a431c4~appgver_a82f89d6765c819199406cf3f2381606`
- Terminal result: succeeded, October 20, 2026 at 8:33 p.m. Central.

The expanded private GitHub implementation commit is being finalized. The live NAS has not been updated through the currently offline local Mac connection.

## Expanded native CI

Pending the exact-source 32-game macOS workflow. The expected suite contains 29 XCTest methods, including a real offline WKWebView pass across all 32 game documents, exact creator credit checks, native progress validation, and preserved fourteen-game saved records.

## Release boundaries

An unsigned simulator build does not install on a physical iPhone or establish TestFlight/App Store distribution. Signing and Apple account/product configuration remain separate release steps. Advertising and live purchases are disabled. Prepared banks are finite; dictionary provenance and full human editorial review remain commercial-release work. The current monetization recommendation is in `monetization-unified.md`.
