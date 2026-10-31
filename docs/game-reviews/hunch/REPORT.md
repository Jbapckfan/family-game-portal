# Hunch review — October 31, 2026

Hunch is game 12, created by Kimi. James said “great, next game” after the Tangle vocabulary correction; Tangle remains a keeper. Hunch’s enjoyment, replay preference and disposition await his playtest. Circuit follows after that verdict. No numerical score or relative keeper rank is inferred.

The five-letter, six-guess game now has a blue/teal board, larger letters and keys, consistent status symbols, a visible saved-clue outline, and interactive repeated-letter instructions. The separate APPLE/ALLEY example explains why an extra copy can be gray. Narrow phones scroll vertically; the keyboard does not overflow horizontally. Measured text/background contrast pairs and viewport measurements are saved with the evidence; this is not a full accessibility certification.

Repeated accepted words now give explicit feedback without spending a guess. Older saves containing repeated guesses still load. A clue asks for confirmation, cancellation is free, and stale or double confirmation cannot spend it again. It reveals an unknown letter’s membership, not its position or multiplicity, and skips letters already known from green or gold feedback. Immediate Practice repeats are excluded. Physical typing, virtual keys, rapid input, focused controls, and composition handling received targeted regressions. Restored results no longer replay confetti or force a popup; a newly earned win still celebrates. Played dates stay attached to the round; displayed expired streaks do not rewrite saved counters.

A Hunch-only generated dictionary accepts **17,946** five-letter guesses, including all **15,921** older accepted guesses and every published answer. Its sources are the existing pinned English, Wordnik and ENABLE sources plus the documented Zynga examples. The **2,025** additions are union-source vocabulary, not a claim that these are all WWF words. Exact current Words With Friends/NASPA parity is unverified. Other games’ validation dictionaries are unchanged.

Completed Daily and Practice results offer frozen portrait/square PNGs and captions, honest n/6 or X/6, played identity and clue use. Export contains status marks only; answer, guess letters, clue letters and URLs are excluded. Text sharing uses the canonical native bridge first. Browser sharing prepares the image before the direct gesture; real downloads, cancellation, copy success and denied/manual fallback were checked. No social post or physical-device share sheet was sent during testing.

## Reviews and content

Actual subscription CLI reviews: [Kimi](MAKER-Kimi__review.md), [Gemini](MAKER-Gemini__review.md), [Opus](MAKER-Opus__review.md), and [final Opus review](MAKER-Opus-final__review.md). Receipts, input manifests and the longer Gemini artifact are retained. These are static reviews; none played the game or ran the tests. Baseline fun predictions were 3/5, 3.5/5 and 3/5, separate from James’s opinion. Kimi and Gemini inspected supplied phone images; Opus declined a visual UI score. The CLI model arguments are recorded in receipts; Kimi’s response did not expose a more specific served model identifier. No verified free DeepSeek route was used.

The final Opus review found a real mixed pointer/keyboard focus defect after Delete, clue, and header controls. A baseline browser reproduction and hook regression failed before the fix. Physical letter/backspace input now returns focus to the board, while deliberate keyboard activation of focused controls remains native. That fix followed the review and was independently tested; no second provider sign-off is claimed. [Adjudication](ADJUDICATION.md) distinguishes confirmed issues from rejected hypotheses.

All **937** answers are unique, five letters, and covered by both dictionaries and the supplied common list. **182** actual dated selections are distinct. The original answer bytes, selector dependencies and two-pass evaluator are unchanged. An independent per-letter quota oracle agreed on **59,049** pairs. These checks establish construction and calendar coverage, not human familiarity, difficulty or fun. Full vocabulary remains an editorial consideration.

## Verification and limits

The [evidence summary](evidence/summary.json) records final suite totals, browser checks, source preservation, native Web parity and staged asset hashes. The package suite passed **212/212**, the catalog suite **899/899**, and the real offline worker suite **11 checks**, including cold boots of every daily game and a completed/restored bonus AI turn. App/node TypeScript and the production Vite build passed. No fresh Hunch native compilation, simulator or hardware playtest is claimed.

Chrome and WebKit cover phone/desktop layout, free invalid/repeated guesses, mixed input and native keyboard activation, clue consent/persistence, wins/losses/restores, fresh-only celebration, Practice isolation, actual PNG downloads, truthful copy failures, mocked share cancellation and native text priority, no next-answer modal flash, shared tabs, Central midnight and the other five shared-runtime pages. File-share APIs and native text messages are mocked contract checks; PNG download and browser play are real.

The first cross-tab harness asserted a terminal state before its writer committed. It now waits for persisted completion before stale input. A second harness assertion incorrectly required MAIN focus after a pointer blur, where BODY is also valid; it now verifies submission and permits either. WebKit’s second-page clock installation was corrected to install once per context. Raw failed runs remain local; those harness problems are not counted as game defects.

The current all-games build preserves all 32 daily games and the nine-board bonus. Compiled entrypoints were regenerated and the iOS Web files synchronized with exact byte parity. Existing runtime backups and raw test outputs remain in ignored output folders. The owned visible preview reuses one tab, showing Hunch’s independent help example without solving James’s Daily. No deployment or access change was made.

Minor follow-ups: the unused legacy share formatter remains for compatibility; key absent labels reuse the more verbose tile wording; fast repeated invalid guesses may show toast feedback without replaying the shake animation. Human fun, answer familiarity, physical touch/audio, native image export and sustained device performance remain unverified.

[Delivery receipt](evidence/delivery.json) identifies the remotely verified implementation checkpoint and the exact all-games archive hash. A following documentation-only commit records delivery; the ZIP intentionally freezes the named implementation checkpoint.

## James’s verdict and identity constraint

James subsequently said **“hunch is good, make sure it's not too similar to words with friends.”** Hunch is retained as a keeper. No numerical score, relative keeper rank or explicit replay answer was supplied. The [identity check](SIMILARITY.md) compares current source/presentation with Zynga’s official classic rules, records the distinct-identity constraint, and flags that Hunch’s core is much closer to Wordle. This supersedes pending verdict statements in the review-time report above. No gameplay or visual change was needed for the WWF comparison; the tested build remains unchanged. Circuit is next in the review queue.
