# Hunch identity check — October 31, 2026

## Corrected comparison: Wordle

James clarified **“i meant wordle.”** His previous request must therefore be read as: Hunch is good, but should not be too similar to **Wordle**. The Words With Friends comparison below is historical and does not satisfy that corrected request.

The current build is **too close to Wordle to call this constraint resolved**: the hidden five-letter answer, six accepted guesses, per-letter exact/present/absent feedback, best-known keyboard colors, daily format and colored status-grid sharing all overlap. The custom title, blue/teal presentation, membership clue and Practice mode differentiate presentation and assistance, but leave that central deduction loop intact. This assessment follows the inspected source, including the engine’s explicit standard-Wordle evaluation comment; no new successful live NYT inspection is claimed.

Hunch stays a keeper from James’s positive reaction, with gameplay differentiation now an open follow-up before moving the review on to Circuit. Do not change its rating or claim it is already distinct from Wordle. Preserve the current implementation and existing rounds while settling the new gameplay direction with James; no gameplay changes have been made by this correction.

## Historical comparison: Words With Friends

James’s verdict: **“hunch is good, make sure it's not too similar to words with friends.”** Record Hunch as a keeper from this response to the keeper/improve/pass prompt. He supplied no numerical score, relative keeper rank or explicit replay answer. Preserve the request for a distinct identity in future work.

The current Hunch implementation is materially different from Words With Friends’ classic rules. Zynga’s [official rulebook](https://zyngasupport.helpshift.com/hc/en/63-words-with-friends-2/faq/10552-words-with-friends-rule-book/) was checked on October 31, 2026.

| Aspect | Hunch, inspected implementation | Words With Friends, official classic rules |
|---|---|---|
| Goal | Deduce one hidden five-letter word | Form connected words for points |
| Turn | Enter a complete guess and read position/membership feedback | Place letters horizontally or vertically on a shared board |
| Resources | Alphabet keyboard; up to six accepted guesses | Letter rack, tile bag, blank tiles and swaps |
| Outcome | Solved or unsolved, guesses used and clue disclosure | Letter values, word/letter multipliers and opponent score |
| Board | Guess history, with status marks | Intersecting words and bonus spaces |
| Identity | Hunch title, Alford Daily branding, own icon and blue/teal status presentation | Zynga’s Words With Friends branding and scored tile-board presentation |

Inspected `HunchHelpModal.tsx`, `engine.ts`, `HunchWinModal.tsx`, `share-card.ts`, the icon and the already verified visible help/board captures. The Hunch UI has no WWF name or logo, point values on letters, bonus squares, tile rack or opponent board. Shared ordinary vocabulary does not make these play loops the same. Hunch’s generated dictionary uses the previously documented pinned word-source union; it is not represented as a licensed or exact WWF/NASPA dictionary.

**The closer gameplay comparison is Wordle.** Hunch has its five-letter/six-guess position-feedback format; the engine itself identifies the evaluation as standard Wordle evaluation. Its palette, symbols, optional membership clue, Practice and export presentation do not make that core mechanic original. Do not describe Hunch as a wholly original deduction mechanic or claim it is distinct from every other word game. The attempted official NYT rules pages were inaccessible to the research tool; no live NYT inspection is claimed.

No gameplay or visual changes were needed to meet the stated Words With Friends distinction, and no approved mechanics were replaced. Future Hunch changes should preserve its own branding, instructions, icon and share-card presentation, and avoid importing WWF’s scored connected-board/rack mechanics or branded material. A more substantial departure from Wordle would be a separate gameplay design decision with James. This is a product comparison of the inspected build and classic rules, not an exhaustive audit of every mode or a legal clearance.

Hunch remains open in the same preview tab. Circuit was not opened by this documentation-only update. The existing verified Hunch build is unchanged, so its test results remain the implementation evidence for that build, not evidence of Wordle differentiation.
