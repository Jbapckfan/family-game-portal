# Second Sense review decisions — October 30, 2026

Fifth individual review. James's Second Sense verdict is pending. Switchpath, Counterpart and Shortlist are keepers, without numerical ratings or a supplied relative order. Ringcount remains a replacement candidate; no removal is authorized.

| Baseline reviewer | Fun | Clarity | UI | Replay | Sharing |
|---|---:|---|---|---|---:|
| Kimi K3.1 Pro | 4 | 4 | 3 | 3 | 2 |
| Gemini 3.8 Flash High | 4 | 3.5 | 3 | 4 | 3.5 |
| Opus 5.5 | 3.5 | 3.5; 3 on flagged boards | Declined | 2.5–3 | 2.5 |

Scores are predictions about the baseline, not James's ratings or post-change measurements. Kimi/Gemini inspected source, tests, the complete meaning/co-board audit and screenshots. Opus inspected inline engine/app/shell/HTML/audit, with tools disabled and no CSS/images. None executed or played the game. Reports and receipts are preserved unchanged. Gemini produced an internal CLI planning artifact; its proposed approval step was not adopted as an instruction.

## Implemented findings

- **Readable play:** 16px clue and selected-definition text, blue noun/teal verb cues and a matching icon replace purple/brown. Touch targets remain at least 44px. All definitions remain visible in two independent columns; no bank or automatic pairing. Selecting both clues brings the composer/input into view. Choose clues and successful checks return to the remaining definitions. Short phones use natural scrolling.
- **Hints:** each new noun hint asks for confirmation, discloses one hint and assistance, and defaults to cancellation. Cancellation preserves the draft and score. Approval counts once; the persistent accessible clue name includes its first letter and length. The old announcement already spoke the hint, so Opus's “never hear” wording overstated the accessibility issue.
- **Reproduced draft race:** a correct check formerly cleared the draft before the shell could adopt a newer save. Draft clearing now follows a confirmed commit. Adoption of a different pair keeps the rejected move and input focus for Enter to retry; adoption of the same already-solved pair clears the obsolete word. Unit tests first reproduced both losses, and browser checks use a real second tab with deliberately delayed storage-event delivery.
- **Honest status and focus:** perfect goal, actual perfect, assistance, extra checks and revealed are distinct. The reveal title says Board revealed. Editing after a wrong check clears the stale second error message. Dialog return focus excludes the page body; closing a result focuses its result control. Duplicate feedback live-region semantics were removed.
- **Sharing:** frozen allowlisted score/date/outcome adapter, portrait/square PNGs, font preparation, prebuilt file gesture, generation-race guard, cancellation, download, copy and manual selection. No word, clue, ID, placement, draft, per-row error or URL enters the browser result snapshot. Five abstract identical pairs reveal no row history. Native original text sharing remains first; native image sharing is not claimed.

## Semantic findings and limits

The current bank has **210 distinct combinations**, **75 original pairs**, **1,050 appearances**, **14 per pair**. Exact-answer tests do not prove that English has no other valid interpretation. Recurring definitions also limit novelty; combinations are not newly authored meanings.

[Computed co-board membership](evidence/co-board-review.json) checks the reviewer examples. CHECK/STEM occur on 027/162/207; CONDUCT/LEAD on 070/159. These are substantive editorial concerns: CHECK can express restraint and CONDUCT can express guiding, so an individually plausible cross-pair may be rejected by the canonical table. [Merriam-Webster: check](https://www.merriam-webster.com/dictionary/check), [conduct](https://www.merriam-webster.com/dictionary/conduct).

PORT/DOCK occur on 012; the broad landing-place noun merits narrowing review, given the distinction between a port and a particular loading structure. [Merriam-Webster: dock](https://www.merriam-webster.com/dictionary/dock). CHECK/DRAFT occur on 011. MINE/QUARRY, BOLT/SWALLOW, BARK/HAWK, BAT/CLUB and PLOT/FIELD have actual co-boards recorded in the audit and remain editorial questions. Gemini's MINE/QUARRY board examples 134/165 were incorrect: actual boards are 029/146/178. Kimi's PLOT/FIELD examples omitted 210. PITCH/FIELD also raises the edition's U.S.-usage convention.

A word appearing inside another clue, such as roots/stems in PLANT, is possible misdirection; it is not by itself a proven alternative fit to both chosen definitions. Noun distinctions and the complete five-pair assignment matter. Conversely, those constraints are not a proof that every alternative is unfair. Published wording, answers, IDs and save contracts were retained in this pass; no broad synonym acceptance or covert bank rewrite was introduced. Human editorial review is still required before universal fairness or launch-readiness claims.

## Final review and verification limits

Final Opus source review found no Critical/Important bug in its supplied scope. Its two Minor adoption-focus/obsolete-word cases were corrected and verified afterward. The final response ran nothing and saw no CSS or rendered images. Actual browser verification, image inspection, offline lifecycle and native compilation are author evidence.

Gemini's baseline typography/min-height comments overlooked later CSS overrides; final baseline phone text was 14px, not its quoted 10–12px. Kimi's suggestion that terminal share squares encode row history was also overstated: a terminal win/reveal uses identical squares. The new aggregate-only design still improves clarity.

DeepSeek was not run: no verified free route. Existing subscription CLIs were used, without a paid API route, new product dependencies, public deployment or social posting. Physical iPhone keyboard, VoiceOver/TalkBack, real share recipients, human enjoyment and repeated-day interest remain unverified.
