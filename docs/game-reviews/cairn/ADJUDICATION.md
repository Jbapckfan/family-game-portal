# Cairn review decisions

| Finding | Decision and verification |
|---|---|
| All three: result graphic clashes with the collection | Replaced the flag, mixed pebble colors, sway, oversized emoji and confetti with quiet blue marks and clear text. Actual final screen and exported images inspected. James has not yet approved the replacement. |
| All three: hints/skips need informed confirmation | Implemented round/level/phase-bound confirmation and a duplicate-action guard. Unit and real-browser cancel/apply checks pass. Final Opus’s Important finding was verified: a skip ends, rather than merely pauses, a daily streak. Wording corrected. |
| All three: previous word/new letter disappears | Persistent previous **accepted** word plus exact multiset added letter now displays after advancement/reload/shuffle. An actual ARC→CHAR browser transition verifies an alternate answer and the added H. Equivalent duplicate-letter tiles do not create distinct logical letters; no scoring/index rewrite needed. |
| All three: sharing misses date/Practice/native support and can claim false copy | Frozen aggregate result, native text first, browser portrait/square PNG, direct-gesture sharing, cancellation, download and truthful copy/manual fallback implemented. Actual PNGs and mocked platform boundaries tested. |
| Final Opus: closing dialog can flip from hint to skip copy | Retain the last confirmation kind during exit. Retain share view on close until reopening/reset. Focused tests remain green. |
| Final Opus: inaccessible progress/status mismatch | Added a role and full per-level spoken summary, aligned shown/dashed treatment and legend. |
| Opus: stale streak display after a missed day | Fixed display-only decay with explicit today/yesterday/missed-day/no-completion checks; saved counters and best streak preserved. |
| Final Opus predicts focus falls to body after disabled opener | Not reproduced. Shared Dialog already checks disabled openers and focuses results or the game main. Real Chrome/WebKit checks after last hint and skips confirm useful focus. No duplicate focus mechanism added. |
| Kimi/Gemini: rare vocabulary and recurring components | Recorded the audit (839 distinct chains but only133 final signatures,553 words,max recurrence88). Human editorial concern retained; dictionary membership/common-list alternatives are not semantic certification. Published bank and calendar remain unchanged. |
| Gemini: old shared caption leaks answer words | Rejected. Actual old `buildShareText` includes number, status emojis and headline, not words. Its missing date, per-level pattern and false-copy findings were valid. New share explicitly excludes words and patterns. |
| Gemini: defer automatic rollover during play | Not adopted. Existing six-game daily rollover is an explicit tested contract; this pass preserves it. The new header and share snapshot use the played state’s day. No claim that an unfinished game survives into a different daily is made. |
| Premium hint branch | `isPremium()` is always false in the current product; no purchasable route exists. Cairn UI now states the actual finite cap. Engine behavior/schema are preserved. |
| Gemini’s plan/approval request | Its response referenced an external application plan and asked approval despite the read-only brief. We did not treat that as an instruction or execute its plan. Review reports are evidence, not authority. |

The final Opus source snapshot had **0 Critical,1 Important,4 Minor** predictions. Its material copy finding and three applicable minor issues were corrected; focus was independently checked. It did not see the subsequent fixes or play the final build. There is no three-model final-playtest endorsement.

James’s graphic criticism is the only personal Cairn judgment in the ranking. Its fun, replay and keeper decision remain pending. No paid model route, deployment, social post or physical share was performed.
