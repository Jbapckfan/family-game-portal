# Inbetween panel decisions

At this initial panel's time, James had not supplied a preference verdict. He subsequently rated Inbetween **6/10**, said **keep it**, and requested drag-and-drop visuals and harder clues. See [the interaction follow-up](DRAG-PLACEMENT.md); model predictions below remain separate from his rating.

| Reviewer | Actual model argument | Fun /5 | Clarity /5 | UI /5 | Replay /5 | Sharing /5 |
|---|---|---:|---:|---:|---:|---:|
| Kimi | kimi-code/k3.1-pro | 3 | 4 | 3* | 2 | 2 |
| Gemini | gemini-3.8-flash-high | 3.5 | 4.2 | 3.6* | 3.2 | 3.4 |
| Opus | claude-opus-5-5 | 2 | 4 | — | 2 | 2 |

These are baseline predictions at `32a56b9873f8a71e72d582032737c7b0dcc4a5ee`, not James's scores. Kimi/Gemini received source, CSS, tests and the insertion audit. *Their UI scores are source-based predictions: the snapshot lacked screenshots after the initial sandboxed browser launch failed. Opus received inline engine/app/HTML/audit with tools disabled and declined a visual score. No reviewer executed the game. The author separately rendered and played the updated app in Chromium and WebKit. Reports and receipts are preserved verbatim, including unsupported or overbroad claims; this document supplies the rulings.

Existing subscription CLIs were used without a new paid API route. No verified free DeepSeek route was available; no DeepSeek review is claimed.

## Accepted findings

All three flagged unconfirmed/repeated nudges, lost paid preview after reload, optimistic placement feedback, small gap controls and limited sharing. Six focused app failures were reproduced before correction. Nudge confirmation now defaults to cancel, and a visible paid preview disables repeat spending. An optional session UI snapshot restores only the same placements, hint count and deterministic advice; missing legacy snapshots show nothing. Placing, clearing or choosing another pair clears that snapshot. The explicit confirmation explains this lifetime.

External progress adoption now cancels discarded success animation, speech, haptics and result timers. A valid terminal game repairs its record. Memory-only play and recovery remain covered; a failed game write cannot independently persist its record. A completed daily resists an older unfinished save/event. Normal sequential first-finished behavior, including a first revealed daily against a stale winning placement, remains verified. Literally simultaneous conflicting terminal writes are still an acknowledged localStorage architecture limitation, with no atomicity claim.

Clues are 16px; five separate 44px insertion buttons align below the four seed letters. The pair bank remains visible during phone scrolling. Blue/teal states replace visible lavender details. Perfect/assisted/solved/revealed labels are explicit, empty win-average is a dash, and footer defaults are local collection links. The misleading Enter glyph was removed: ordinary button activation, arrow/Home/End movement and free Space preview remain. Roving tabindex was deferred; no automatic placement shortcut was introduced.

Sharing uses a frozen allowlist of played date/number or Practice and aggregate attempts/nudges/outcome. Six identical abstract markers encode no placements or gaps. Real portrait/square PNG downloads, midnight identity, mocked cancellation and manual-copy fallback were exercised. Native text remains first; no physical/native PNG certification or external send is claimed.

## Claims narrowed

Gemini generalized pre-save haptics to `takeHint`; that function did not emit a haptic. Its stale advice announcement was a genuine separate defect and was reproduced. The actual baseline final phone clue size was 12px, rather than every smaller value found in earlier overridden CSS rules. Updated computed layout, not static selectors alone, determines the final sizes.

The bank has 210 distinct answer sets but only 174 transformations/answer words, 100 seeds and 96 pairs. An answer appears up to nine times. Unique insertion-gap counts are 44 before the seed, 32/45/23 internal and 30 after it: 74 of 174 are edge insertions. Every intended row has exactly one tile/gap home; all 13,440 solved-subset states completed with the real engine. These finite results do not prove semantic uniqueness, human difficulty or replay value.

The final remaining pair is forced after five placements; the player still chooses its gap. The sole intended gap and free previews can make that finish easy, but ease is a human judgment. Reviewers' lower replay/fun predictions and recurrence concerns are retained for James's playtest. No bank or scoring rewrite was made to preempt his verdict.

## Final Opus findings and verified follow-through

Opus's updated source review found no Critical defect and two Important issues. Both were reproduced and corrected afterward:

- Stats/Daily reconciliation could persist a win record while its daily game save still failed. The write boundary now refuses to flush the shared records object while any daily game key is dirty. The guard-disabled control reproduced an actual persisted win versus the expected absent record; restoring the guard passed the regression. The test's initial Stats-close selector was corrected before this controlled red/green check.
- At desktop widths, post-placement pair focus could sit above the viewport. Both browser engines reproduced this with the focused pair roughly 370px above the window. Pair focus now scrolls into view, and arrow navigation brings its gap into view. Final browser checks passed at 1366×768 as well as the phone flows.

Additional follow-ups: a wrong fit immediately shows loss of perfect eligibility; advice lifetime is covered for Clear, Escape, another pair and a wrong placement. A wrong placement retains valid paid advice because placements did not change; only a correct placement consumes it. Dialog close returns to an actionable control rather than a page container, verified by a failing regression and real browser checks. Minor focus/palette refinements made after the review snapshot were covered by final tests.

Bundled font files and their compiled/staged bytes were verified and rendered. No universal guarantee is inferred from `fonts.load()` alone. Older browsers without Canvas `roundRect` retain the caption fallback; they are not certified for PNG export. Native legacy text still says “hints,” while the browser UI/card says “nudges.” No engine change or native image claim was made.

Final verification is recorded in [evidence/summary.json](evidence/summary.json). One exploratory test discovery included the unrelated Lasers project and failed on its missing Playwright dependency; that project was left untouched. The final catalog run used the existing catalog's test-file list plus the new Inbetween tests. The initial command-sandbox iPhone build could not run Swift macro plugins; the authorized retry succeeded. Neither harness/environment failure is presented as a game-logic failure or a passed check.
