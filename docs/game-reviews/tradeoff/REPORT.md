# Tradeoff review — October 30, 2026

James's verdict: **“tradeoff is a keeper, a bit too easy.”** Keep it in the collection. No numeric rating or ordering between keepers was supplied. Inbetween is next in the review queue.

The standalone game now has 16px clues, letter controls at least 44px high, blue/teal interaction states, and explicit perfect-score criteria: five swaps, no nudges and no undos. A nudge requires confirmation; its paid advice survives reload on the same board without another charge. Keyboard focus survives a row locking, Undo and dialogs. Discarded stale actions no longer announce a solve, animate a swap or show uncharged advice.

Browser sharing exports a dated Daily or Practice result as a portrait or square PNG. The frozen snapshot contains aggregate counters and six identical abstract markers. Words, clues, letter positions, history and URLs are excluded. Native text sharing remains the first path in the iOS wrapper; browser PNG verification does not certify physical/native image sharing.

The engine, scoring, save schema, published bank and daily mapping are unchanged. All 32 daily games and the nine-board bonus remain bundled. The bank audit found 210 distinct answer sets, 252 answer words and 498 distinct start/answer/clue pairs. One answer appears 23 times. Every board starts with six distinct misplaced letters in one cycle and has an executable five-swap solution. Construction analysis plus engine execution establish these finite properties; they do not measure human difficulty or semantic uniqueness. Strong clues and one misplaced letter per word help explain James's ease reaction. Difficulty tuning and fresher vocabulary remain follow-ups, without silently replacing published puzzles.

Verification on final source:

- 873 catalog tests passed; the overlapping focused suite passed 60 tests.
- 24 Chromium/WebKit checks passed, including genuine five-swap wins, assisted wins, same-row recovery, hints/reload, Undo, stale actions, keyboard focus and actual PNG exports. Layouts were checked at 320, 390, 768 and 1440px.
- 11 offline checks passed. All 32 daily pages booted offline, and the bonus completed a human/AI turn and restored it.
- Unsigned iPhone Release build succeeded. Its 279 game runtime files exactly match the synchronized source bundle; structural project checks passed.
- Final web stage: `dist/tradeoff-review-20261030-final-v2/web`, build ID `3216008bb04376fd`, 313 files.
- Final mobile page and square result image were visually inspected. The existing preview controller was reused with one game tab; a result sample may use the second tab.

The actual Kimi, Gemini and Opus reviews, receipts and decisions are saved here. They inspected supplied source; they did not execute the game. Opus also reviewed the updated source. See [adjudication](ADJUDICATION.md) for scope and the remaining Important concurrency question: normal stale-tab guards pass, but literally simultaneous conflicting terminal writes are not an atomic transaction. This is a tested local review build, not an all-findings-cleared or launch-ready certification. Physical iPhone interaction, native image sharing and public deployment remain unverified.

Machine-readable checks, hashes and limitations: [evidence/summary.json](evidence/summary.json).
