# Kimi Tangle review — October 30, 2026

Morph is now a **keeper**, from James’s exact “keeper, next,” with no numeric score or relative rank supplied. Kimi’s Tangle is game11, distinct from Claude’s later Tangle. James’s enjoyment/replay/rating/disposition remain pending; Hunch follows.

The untimed4×4 hunt now has readable blue/teal letters, ordered selection marks, a clear endpoint, larger found words and a sticky selection/Check bar. The progress meter follows the **Gold goal**, with the total points still explicit. Gold completes the daily achievement once, while further hunting remains playable and saved.

Pointer handling now accepts one primary pointer, rejects secondary/mismatched pointers, preserves a free preview on outside release/cancel, handles lost capture/blur and invalidates changed-board gestures. Path changes commit synchronously, so a move immediately followed by release checks every selected letter. Native button activation supports keyboard and assistive clicks. The grid suppresses its native context menu: a WebKit right-click menu was intercepting subsequent page clicks, demonstrated by a no-menu control and corrected with a regression test.

The single clue requires confirmation. Cancelling costs nothing; duplicate/stale approval cannot spend another clue. The saved prefix remains visible; when all matching4+letter words are found it says the clue is found. Assistance is disclosed without changing points. Rules explain misses, free short/duplicate submissions, input methods and continuation afterGold. The result no longer automatically reveals an unfound “hidden gem.” Existing fresh-Gold celebration is preserved; restoredGold neither celebrates nor automatically reopens results. The header uses the played day, and Tangle’s displayed streak expires after a missed day without rewriting saved counters.

Sharing works for nonempty progress beforeGold and continuing progress afterward, including Practice. A frozen snapshot contains Daily#playeddate orPractice, actual score/max, Goldgoal, found/total, misses and clue usage. Portrait/square PNGs use sixteen identical marks and aggregate results: no grid, words, bestfind, prefix, path/order, word-length pattern orURL. Native text comes first; browser sharing supports direct-gesture file share, cancellation, real PNG downloads and truthful copy/manual fallback. Download URLs stay alive until panel unmount. No social post, physical share sheet or native image share was performed.

Engine, hook, points, medals, progress schema,430rawbank, exact12-word dated review/legacy policy and calendar/practice selectors are unchanged. Old compiled and iOS directories were moved into recoverable ignored backups. The shared six-game runtime was regenerated and all six games booted. All32daily games plus the nine-board bonus remain included.

## Reviews and content

Actual subscription CLI reports/receipts: [KimiK3.1](MAKER-Kimi__review.md), [Gemini](MAKER-Gemini__review.md), [Opus5.5 baseline](MAKER-Opus__review.md), [final Opus source review](MAKER-Opus-final__review.md). Kimi inspected source, audit and phone images; Gemini had source/audit/images supplied; Opus received inline source/aggregate text without images. None played or executed tests. Fun predictions were3/5,3.5/5,3/5, separate from James’s preference. No verified free DeepSeek route was used. [Adjudication](ADJUDICATION.md) includes unsupported claims.

Independent enumeration verified all **30,688 raw** and **30,599 default-reviewed** accepted word paths across **430 distinct grids up to rotation/reflection**, with no cell reuse. Reviewed content has9,155distinct accepted words, maximum recurrence60boards;28–80words per board,35–119maximum points andGold8–18. All listed points and Gold goals are reachable. The existing dated182day and legacy-save tests pass.

Vocabulary is the main editorial concern: only14of430boards have enough Gold points from the supplied common-word list. That list is incomplete; this does **not** prove the other416are impossible or require obscure words. Path/list membership, grid uniqueness and score arithmetic are not human familiarity, semantic freshness, fun or measured difficulty. Published vocabulary and medal thresholds were preserved for James’s judgment.

## Verification

- **899/899 catalog**, **184/184 package**, **32 overlapping focused tests** passed on final source. Real React DOM pointer fixtures replace the old extracted-callback checks. Move→up burst, completed-clue and context-menu regressions failed before fixes and passed afterward. The existing SSR fixture now supplies the word list needed to calculate clue availability.
- **42 Chrome/WebKit checks**:320/390/768/1440px, rapid real pointer word submission, outside free preview, right-click recovery, assistive click, keyboard paths, duplicate/free versus invalid/miss behavior, pre-Gold sharing, clue consent/reload/limit, actualGold, postGold continuation with one completion, restored no-celebration, actual portrait/square PNGs, truthful copy/denial/manual fallback, mocked gesture cancellation/native priority, realPractice share, valid older-client edition/score restoration, and the other five runtime boots.
- **11 real offline-worker checks**, including all32cold offline pages and a completed/restored human/AI bonus turn, passed.
- App/node TypeScript checks and isolated Vite build passed. Unsigned iPhone Release build succeeded. All **284 compiled game runtime files** exactly match synchronized source. Project structure passed. No native XCTest, physical touch, assistive-technology or hardware export certification is claimed.
- Stage `dist/tangle-review-20261030-final/web`, build **1663e82dac1ed8df**: **318 files**, all **316 manifest asset entries** hash-verified. Phone, fresh desktop, result and actual PNG captures inspected. The fresh desktop capture replaces an old-driver resize/compositor artifact and confirms one header/main. Existing visible preview reused; one game tab left open. No deployment.

[Summary/hashes](evidence/summary.json), [browser results](evidence/browser-results.json), [word-path audit](evidence/word-path-audit.json). Captured author harnesses retain paths relative to their original `output/tangle-review-20261030/` location.

Remaining minor: current-word live-region timing/verbosity needs screen-reader validation. Human vocabulary/difficulty/fun and physical input/share behavior remain open. Existing localStorage concurrency and daily-midnight rollover are preserved. Older Canvas without roundRect can use captions.
