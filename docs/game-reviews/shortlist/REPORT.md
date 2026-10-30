# Shortlist — fourth individual review, October 30, 2026

Shortlist is ready for James's playtest in the reused preview window. Find one secret among twelve words: choose two letters per scan, receive a presence count of zero, one or two, use at most three scans, then make one confirmed final pick. Manual pencil marks help record deductions; they are not evidence and do not change the answer-independent hint strategy.

Words and letter controls are larger. Scan evidence now sits directly above the words, with jump controls to the scanner. Hints disclose their cost before use, terminal keyboard behavior is safe, and old assisted saves no longer invent original hint advice. Added factual, spoiler-free portrait/square sharing with download and copy fallbacks. Exact scan rules, scoring, banks, calendars and save identities remain intact. All 32 daily games and the nine-board bonus remain included.

Kimi K3.1 Pro and Gemini 3.8 Flash High predicted baseline fun at 4/5; Opus 5.5 predicted 3/5. They agreed that evidence placement, readability and hint confirmation were the main opportunities. These were static reviews, not playtests. Unsupported Opus CSS claims were discarded and retracted in its final review. [Findings and decisions](ADJUDICATION.md).

## Verification

- **854/854** catalog-scoped Node tests passed, including **63** Shortlist tests.
- **24/24** real Chromium/WebKit browser checks passed: four responsive widths, safe pick/hint cancellation, scan counts and reversed-pair rejection, manual notes, hint restoration/context, actual terminal outcomes, keyboard focus, real PNG downloads, midnight identity and copy/cancel fallbacks. No page errors.
- **11/11** final offline lifecycle checks passed, including all 32 daily games cold-started offline and a restored human/AI bonus turn.
- Unsigned iPhone Release compiled. All **276** runtime game files match compiled app resources byte for byte. Structural validation passed. No device installation or physical/native sharing claim.
- **210** banks and scheduled answers are distinct. Independent traversal verifies three-scan strategies for all **2,520** possible secrets. **1,051** distinct words provide vocabulary variety; this does not establish fun or editorial fairness.

[Evidence summary](evidence/summary.json), [browser cases](evidence/browser-results.json), [phone](evidence/phone.png), [desktop](evidence/desktop.png), [scan evidence](evidence/scan-evidence.png), [portrait result](evidence/result-portrait.png), [square result](evidence/result-square.png).

The larger-type layout check caught malformed grid declarations introduced during CSS cleanup; they were repaired and the final checks rerun. Opus's final focus trigger was reproduced in a failing browser check and corrected. The final screenshots and exported cards were visually inspected. No social post or public deployment occurred.

## Continue

Ask whether James would play Shortlist again; record his actual preference without inventing a numerical rating. Second Sense is next after his verdict. Switchpath and Counterpart are keepers; their relative order remains unknown. Ringcount stays available as a replacement candidate.

Checkout: `/Users/jamesalford/Projects/MAKER-codex__alford-daily-six-months`; branch `codex/game-by-game-2026-10-29`. Final stage: `dist/shortlist-review-20261030-final/web`, build ID `32beb1a99cc574b2` (310 files). Use the existing `scripts/review-preview.mjs` PTY with `game <slug>`, `reload` and optional `sample <image>`; one window, at most two task tabs. Preserve the saved readable-profile storage. See [workflow](../WORKFLOW.md).
