# Spare — harder review sample

James approved the contextual-clue proposal with “try that” on November 1, 2026.

Build one isolated sample: nine familiar words, four contextual pairs, one plausible spare. Arrange all four pairs before checking. A check reports only the number of correct rows; it does not lock or identify them. Allow four distinct checks, with repeated equivalent layouts costing nothing. Pair order is irrelevant. No timer, obscure-word difficulty or automatic pair-revealing hint.

Use the existing blue/teal visual language, readable words and explicit selected-slot/selected-word states. Both touch and keyboard can select and place words. Placed words can be moved or returned to the bank. Show checked layouts and counts so the challenge does not depend on remembering previous guesses.

The sample has its own versioned save and spoiler-free result text. It cannot change daily scores or streaks. The existing 200 boards and daily engine stay intact. During this review the sample opens first; “Original daily” returns to the existing game in the same tab. The sample is not a replacement six-month content bank.

Before showing: check the contextual meanings and alternatives with the requested subscription reviewers, test moves/checks/restoration, and play complete rounds in isolated Chrome and WebKit contexts. Human difficulty and enjoyment remain James's decision.


## Delivered sample and verification

The review sample opens at Spare's normal entry URL during this review. `#daily` opens the original daily game, and its preview link returns to the sample in the same tab. The original 200 puzzle records and daily engine exports are preserved; the three changed runtime files also match the native web resources. No native binary was built or installed, and no production site was deployed in this pass.

Additional context clues are optional, persist per row, and appear in the spoiler-free result's clue count. The brightness context accepts both defensible pairings; the unused word and result explanation follow the actual winning arrangement. This is deliberately not a claim that the board has only one solution. Four distinct checks are allowed, repeated equivalent layouts cost nothing, and previous layouts remain visible. Phone context tabs bring the selected clue together with its word bank. Repeating a word activation after automatic advancement is a no-op until the player deliberately selects a target or chooses another word.

Fresh verification:

- **972 collection tests passed**, zero failed/skipped, including the original daily save behavior and staging checks.
- **20 Chrome/WebKit browser checks passed**: full touch/keyboard solves, loss, swaps/returns, duplicate checks, reloads, reveal cancellation, original daily-save preservation, unavailable storage, optional clues, alternative solutions, copy-denial fallback, repeated taps, and layouts at 320/393/1200 CSS pixels.
- **304 portable/native web runtime files matched** by SHA-256 and file sets; 33 game entries plus two shared runtimes.
- Actual Chromium screenshots inspected at phone and desktop sizes. The already-open Spare tab was identified and refreshed without adding a tab or replacing the candidate gallery. Native browser-control host was unavailable; Chrome's JavaScript-through-AppleScript setting was disabled and left unchanged. Visible-tab verification was limited to its URL/title/loading state; interactive DOM verification and screenshots used the isolated browsers.

The first collection run exposed two test fixtures still opening the old daily at the default URL and the expected stale native copies. The fixtures now use `#daily`, the runtime copies were synchronized, and the full suite passed. The original preview isolation test had a navigation-wait error; waiting for the daily controls fixed the harness. Gemini's repeated-tap finding was reproduced as a failing browser regression in both engines before the fix. Raw intermediate logs remain in `output/spare-harder-20261101/`.

See [browser results](evidence/results.json), [collection results](evidence/collection-tests.log), and the captured [phone](evidence/chromium-393.png) / [desktop](evidence/chromium-1200.png) layouts. These checks establish functionality, not human enjoyment, calibrated difficulty, physical iPhone behavior, or a six-month bank for this new mechanic. James's playtest is next.

## Independent review and decisions

These were authenticated subscription CLI reviews of a supplied source snapshot, not browser playtests. The snapshot hashes and invocation/model arguments are in each receipt. They assessed the initial sample before the following fixes; no blanket final-build certification is implied.

- **Opus 5.5:** no critical engine defect found. Flagged the defensible alternative brightness pairing, overly explicit sense lines, incomplete move announcements, cramped phone flow and tiny state labels. Addressed by accepting the alternative, making clues optional, announcing displacement and the next target, using mobile context tabs, and enlarging labels. Also fixed feedback grammar/terminal wording, malformed-JSON messaging, invalid CSS font shorthand and the empty finished-board area. Opus still predicted an adult may find the sample easy; human difficulty remains unresolved. [Review](MAKER-Opus__review.md).
- **Gemini 3.8 Flash High:** flagged repeated bank activation after auto-advance. Reproduced, then fixed with explicit retargeting required for repeating that word; deliberate swaps remain available. Its grammar finding is fixed. The missing-mode-switch scenario was hypothetical: the supplied shared renderer creates the switch synchronously and actual daily transitions passed. Gemini considered the original context semantics uniquely fair; we did not adopt its claim, because accepting the defensible alternative is more player-friendly. [Review](MAKER-Gemini__review.md).
- **Kimi k3.1:** the requested CLI invocation timed out at 600 seconds, returning no review. Record an attempted review, not a pass. [Receipt](evidence/MAKER-Kimi__receipt.json).
- **DeepSeek:** no newly verified free reviewer route was used. Its name remains the original concept attribution only.

No numerical reviewer fun ratings or James preference scores were invented. Spare retention is still undecided.
