## Tradeoff review

**Scope:** Static inspection only; I did not play or execute tests. I inspected `app.mjs`, `engine.mjs`, `index.html`, `styles.css`, `content-identity.mjs`, all four test files, the manifest, baseline JSON, audit summary/content samples, and both supplied screenshots (`before-390.png`, `before-1440.png`). The scoped bundle omits `puzzles.mjs` and imported calendar modules, so content assessment relies on `cycle-audit.json`. The supplied baseline reports 26 passing tests; that is not my execution result.

**Verdict:** Solid mechanics and considerate interaction design, but likely a light, highly scaffolded word game rather than a deep one. Fix cross-window reconciliation before adding polish.

### Five high-value fixes

1. **Make saved-game adoption abort stale action feedback.**  
   `saveGame()` can replace `game` and return early (`app.mjs:68-87`), but callers continue using their old outcome:
   - `handleTile()` can animate/announce a solve and play solve haptics for a board that was discarded (`app.mjs:189-200`).
   - `takeHint()` clears stale highlighting correctly, but still focuses the old coordinate and announces its pair using letters from the adopted board (`app.mjs:203-214`).
   - `takeUndo()` can announce an undo that never occurred.
   
   Return an explicit `{adopted, saved}` result and immediately stop local announcements, animations, haptics, and result scheduling when adopted. Clear pending timers centrally. The existing `showResult()` playing-state guard prevents one false-modal case, but timer cancellation should not rely on it.

   Also, terminal adoption returns before `recordDailyResult()`, and the storage-event path never calls it (`app.mjs:461-473`). Consequently, a tab cannot repair a missing terminal record and stats can remain stale until reload. Centralize terminal reconciliation for local saves, adoption, and storage events. Finally, propagate `writeData()` failure: currently a failed game write can still persist a completed record (`app.mjs:85-86`). Pass its success into `recordDailyResult(readable)` so partial storage failures do not create mismatched records.

2. **Make nudges deliberate and perfect eligibility truthful.**  
   Every click spends another hint, even while the identical advice remains visible (`app.mjs:203-214`). Confirm each new scored nudge, explaining that it counts and disqualifies perfect. If the same hint is already displayed, re-scroll/re-announce it without changing state. Keep the existing scoring formula. Replace the persistent “/ 5 is perfect” label once a hint or undo is used; initially state “5 swaps · 0 nudges · 0 undos is perfect.”

3. **Increase substantive variety, not merely board count.**  
   The audit proves 210 distinct answer sets and executable five-swap solutions, but only **252 distinct answers and 498 distinct start/answer pairs across 1,260 rows**, with one answer appearing 23 times. Combined with every row beginning one letter from its answer, this strongly scaffolds clue solving and limits discovery. Structural optimization is not calibrated difficulty or semantic uniqueness. Human-playtest clue ambiguity and difficulty, then append boards with fresh answer/clue pairs rather than recombinations. Preserve all published content, IDs, scoring, calendar/save identities, and catalog entries.

4. **Improve reading comfort and move to blue/teal.**  
   Both screenshots show a polished, understandable layout, and phone tiles retain approximately 44px targets. However, 11–12px clues are unnecessarily small, while the final ruby/brown palette conflicts with James’s preference. Increase clue size/contrast, preserve ≥44px tiles, and replace the hard-coded rose tile/row rules as well as the theme tokens (`styles.css:103-107`). Keyboard focus restoration, disabled solved rows, modal focus handling, and reduced-motion support are already thoughtful.

5. **Add genuinely spoiler-free PNG sharing.**  
   Existing text sharing correctly omits answers and uses the native text bridge first. Add a frozen result renderer containing only played Daily number/date or Practice, aggregate swaps/nudges/undos, honest perfect/solved/revealed, and optionally verified par. Exclude words, clues, cells, board/history/events, and URLs. Generate a real PNG; support native file sharing where verified, respect cancellation, then offer download/copy and manual-text fallbacks. No native-image capability should be claimed without verification.

Core same-row recovery, locking, no-op rejection, unlimited scoring, undo counters/history, and bad-trade hint recovery are sound. No automatic correct-letter highlighting appears outside hints and solved rows.

**Provisional predictions, separate from James:** fun **3/5**, clarity **4/5**, UI **3/5**, replay **2/5**, sharing **3/5**.
