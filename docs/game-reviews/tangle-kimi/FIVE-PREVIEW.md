# Optional 5×5 playable sample — October 31, 2026

James kept Kimi’s Tangle and asked to see an optional larger board. The existing 4×4 Daily remains the default. The size picker opens one 5×5 practice sample with the same eight-way adjacency, no cell reuse, word-length scoring, single confirmed clue, free duplicate/short submissions, continuing play after Gold and spoiler-free sharing. This is not a six-month 5×5 daily bank. Goals of 10/20/30 are provisional, awaiting James’s judgment.

The blue/teal board has 25 tiles; phone checks measured a minimum 47.59px tile at 320px and 60.80px at 390px, with 24px letters and no horizontal overflow in Chrome/WebKit. The whole desktop grid fits at 1440×1000. Sample results and PNGs explicitly say 5×5 Preview. They export aggregate results and identical marks, without letters, words or paths. Existing four-wide sharing retains its identity.

## Word-list failure and correction

The first sample incorrectly used a common-word subset plus selected longer words: 157 accepted words. Tests established legal paths for those entries but did not establish that other valid words would be accepted. James immediately exposed this gap with STONED, TREAD, CORES, PORES, PORE, TARE and TARES. Every reported word has a legal path and exists in the original bundled dictionary. The rejections were a content-generation error, not invalid moves.

The original bundled dictionary itself stops at seven letters. The corrected generator uses the pinned full-length [370,105-word source](../../../../packages/kimi-pebbles/data/README.md), which contains every original bundled entry. It exhaustively enumerates matching board paths under the existing closed 12-word exclusion policy. The corrected sample accepts **1,576** words with **4,197** available points, including all seven reported omissions and longer forms such as STRAIGHTER. An independently implemented word-by-word solver now checks the entire source for omissions, as well as validating every accepted path and point/count total. No claim is made that every possible English word is in this source. The bank includes uncommon vocabulary; human editorial and difficulty review remain open.

Failing regressions reproduced the omitted STONED and incomplete accepted set before the generator replacement. The first attempted full bundled-dictionary pass also correctly failed the existing STRAIGHT assertion, exposing its seven-letter limit; using the full-length source resolved that failure. No length cap was added below the board’s physical 25-cell limit.

James’s eight visible successful finds were preserved. His seven explicitly reported valid attempts were credited and the corresponding seven false misses removed: the validated restored round has 15 found words, 28 points and zero misses. No daily achievements or scores were fabricated or changed. Preview progress now uses a board-validated session-only key, separate from Daily storage; points are recalculated from found words on restore. Switching to Daily, reloading and returning to Preview preserves sample progress for that tab when storage is available. Restart clears the sample. Restoring Gold does not replay a fresh celebration.

## Verification and scope

- **190/190 package tests**, including full-source dictionary completeness, all accepted paths, seven reported omissions, variable geometry, board-validated score restoration and existing hook/save regressions. Nine focused dictionary/share tests overlap that suite.
- **899/899 catalog tests** passed after the final dictionary and preview-progress changes.
- **28 Chrome/WebKit sample checks** cover actual pointer drag and keyboard paths, all seven omissions through gameplay, no row wrapping, free outside release/duplicates, invalid moves, clue consent, reachable Gold, continuing play, real PNG download, sample identity, reload/restore, restart and phone/desktop layout.
- **42 existing Chrome/WebKit checks** pass for the original Daily/Practice game, legacy save, sharing, pointer safety and the other five shared-runtime games. Sample play, clue use and Gold leave the played Daily save/stat strings byte-for-byte unchanged.
- App/node TypeScript checks and the fresh Vite build passed. The synchronized iOS Web bundle matches all 284 source runtime files by SHA-256 and file set. No fresh native compilation, physical touch, screen-reader or hardware sharing claim is made for this sample.

Evidence is in `evidence/five-preview/`; raw logs, original failed versions, browser harnesses, captures, restored-round checkpoint and recoverable prior compiled/iOS directories remain in `output/tangle-five-preview-20261031/`. No public deployment, paid service or model download occurred. One owned visible game tab is left on the corrected sample.

Kimi/Gemini/Opus reports in the parent review describe the earlier four-wide version. They do not certify this new mode or dictionary correction. James’s 5×5 verdict, full content-bank generation, difficulty calibration and a new panel review remain future work if he wants this mode kept.
