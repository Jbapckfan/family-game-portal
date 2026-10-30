# Inbetween review — October 30, 2026

Inbetween is ready for James's individual playtest. **His verdict remains pending.** No enjoyment score, keeper status or relative ranking was inferred. Cairn is next after this playtest.

The game now has 16px clues and five separate insertion buttons at least 44×44px, aligned below the four seed letters. Letters are larger, interaction states use blue/teal, and the pair bank stays visible during phone scrolling. Keyboard movement and placement keep their focused control visible; dialogs return to a useful control. A wrong fit immediately shows that a perfect round is no longer possible.

Nudges require confirmation. Cancel spends nothing; approval previews a pair/gap without spending an attempt. Visible paid advice cannot be charged twice, and the same advice restores after reload only if its board and hint count still match. Missing legacy advice is not invented. Clear, Escape, another pair or a correct placement discards the view snapshot; a wrong placement retains still-valid advice. The engine save schema is unchanged.

Stale placements and nudges adopt changed progress before emitting false solve animation, speech, haptics or result timers. A valid completed daily repairs its record; an older unfinished save cannot roll it back. Stats and Daily reconciliation cannot persist a terminal record while its game save is still unsaved. Literal simultaneous conflicting finishes in separate tabs remain a localStorage architecture limitation; no atomic finalization guarantee is claimed.

Browser sharing exports a frozen Daily number/date or Practice result in portrait and square PNGs, with attempts, nudges and honest perfect/solved/revealed status. Six identical abstract markers reveal no seeds, pairs, words, clues, gaps or placement history. Cancellation, download and caption/manual-copy fallback were exercised. The native text bridge remains first; physical/native image sharing is unverified.

The pure engine, scoring, published bank, daily/practice mapping and IDs are unchanged. All 32 daily games and the nine-board bonus remain included. The audit found 210 distinct answer sets, 174 transformations/answer words, 100 seeds and 96 pairs, with one answer appearing nine times. All 13,440 solved-row subsets can finish with the actual engine. These establish finite construction/recurrence facts, not semantic uniqueness or measured difficulty. Kimi, Gemini and Opus agreed that constrained insertions, recurring vocabulary and a forced last pair can limit depth; their predictions remain separate from James's eventual preference.

Final source verification:

- 888 catalog tests passed; the overlapping focused suite passed 82 tests.
- 26 Chromium/WebKit checks passed: layout at 320/390/768/1440px, desktop focus at 1366×768, free previews, wrong fits, hints/reload, actual perfect and assisted wins, restore/records, real PNGs, played-date identity, mocked cancellation/manual copy and actual second-tab stale actions.
- 11 offline checks passed, including all 32 daily pages and a completed/restored human/AI bonus turn.
- Unsigned iPhone Release build succeeded; its 280 game runtime files exactly match synchronized source. Structural checks passed. No physical-device or native XCTest result is claimed.
- Final stage: `dist/inbetween-review-20261030-final-v3/web`, build ID `5dc7e74858a77d49`, 314 files. Its manifest asset bytes were verified.
- Phone/desktop pages and actual portrait/square result PNGs were visually inspected. The existing preview was reloaded, leaving one game tab for James.

Actual model reports, receipts and [adjudication](ADJUDICATION.md) are saved here. Opus's two Important findings were reproduced and corrected after its final source snapshot; final automated/browser checks cover those fixes. There is no public deployment or launch-ready claim. Details and file hashes: [evidence/summary.json](evidence/summary.json).
