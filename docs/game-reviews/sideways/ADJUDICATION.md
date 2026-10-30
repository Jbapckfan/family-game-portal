# Sideways review decisions — October 30, 2026

James said “not a big fan of this game, it's too easy.” Sideways is a **replacement candidate**, alongside Ringcount. It remains available. No numerical enjoyment score, explicit replay answer, removal or harder redesign was supplied. His direct feedback takes priority over model predictions.

| Baseline reviewer | Fun | Clarity | UI | Replay | Sharing |
|---|---:|---:|---|---:|---:|
| Kimi K3.1 Pro | 3 | 3 | 3 | 4 | 3 |
| Gemini 3.8 Flash High | 4 | 3 | 3 | 4 | 3 |
| Opus 5.5 | 3 | 3 | Declined | 3 | 3 |

These are baseline predictions, not measured post-change enjoyment or James's ratings. Kimi/Gemini inspected scoped source/tests, the exhaustive audit and phone/desktop images. Opus inspected inline engine/app/shell/HTML/audit with tools disabled, no CSS/images. None played or executed the game. Final Opus also received CSS and the updated sources; it ran nothing and viewed no images. Original reports and receipts are preserved.

## The difficulty concern

James asked whether three correct columns force the fourth. **Yes, when correct simultaneously:** each row retains the same four-letter multiset. Once three positions contain their target letters, the remaining letter is fixed.

The independent [depth audit](evidence/depth-audit.json) enumerates every orientation with exact intended answers as constraints:

- All **840** three-clue cases fix the complete arrangement.
- **855 of 1,260** two-clue cases fix it too. Every one of the **210** boards has at least one such pair; **42** have all six pairs unique.
- None of the **840** single-clue cases fixes the whole board.

This measures constraint redundancy after answers are known, not human clue-solving time or fun. It gives a concrete basis for the limited challenge James noticed. Four clues are not four independent orientation constraints. The original uniqueness audit covers **215,040** orientations, **210** distinct answer sets and **546** words, at most two appearances each. No harder mode or bank rewrite was added.

## Implemented improvements

- Larger 16px clue/current-word text, blue/teal rails and a matching icon. Readable two-column phone clues retain A–D badges and follow guidance. Gemini's proposed four-column phone clues were declined because they would narrow text significantly.
- Clear current/checked/expired feedback and goal/assisted/solved/revealed labels. Moves includes nudges; a nudge costs one move and one hint, with no refund on Undo. Only a successful Check wins; correct columns remain movable. Copy now says rows contribute to all columns, since repeated letters can leave individual strings unchanged after a shift.
- Every nudge requires explicit confirmation with cancellation as default. A reproduced double activation initially charged twice; synchronously disabling the approval fixed it. A second reproduced race delivered newer saved progress between approval and its frame. Capturing the approved game object now cancels that stale nudge as well as preserving the existing write-boundary protection.
- Follow can be toggled off. Check/Undo/redraw/adoption keep useful row focus. The misleading Enter glyph was removed; normal button Enter remains. Follow/movement uses the game announcer rather than a second column-reader live region. Named generic containers now have group roles. Toast remains a separate legacy status region; physical screen-reader behavior is unverified.
- Frozen aggregate-only browser sharing: played Daily number/date or Practice, checks/moves/nudges and factual outcome. The abstract markers carry no letters, orientations, history or correctness pattern. Real portrait/square PNGs, midnight identity, cancellation and manual-copy paths were checked. Perfect means one check and no nudges, regardless moves.

## Claims qualified

Failure to toggle Follow was a usability choice, not a broken engine mode. The legacy `formatShare` API can output in-progress correctness or a caller URL, but the actual share UI rejects non-terminal games and passes no URL. Gemini's “sharing leak” framing overstated reachability. Native text is retained first and still uses its legacy hints terminology/number-only identity; native image sharing is not certified. Opus's proposed shell action hook was unnecessary because the app's own dialog listener handles approval.

Final Opus found no Critical/Important source regression. Its concrete frame-race finding was reproduced in both engines and fixed afterward; group naming, badge sizing, finished-state wording and the marker comment were also corrected. Broad clue wording still needs human editorial judgment; an exact accepted table is not semantic proof. DeepSeek was not run because no verified free route was available. No paid API route, deployment, social send or new product dependency was introduced.
