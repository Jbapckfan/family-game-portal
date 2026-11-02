# Spare harder sample: static review

**Verdict:** I found no Critical defects, and the engine logic holds up. The main problem is that the sense lines give away most of the puzzle, so this sample may not fix "too easy". I traced the code and tests by hand but ran nothing.

## Critical
None found in the supplied source.

## Important: verified in source
1. **A defensible alternative is rejected.** `LIGHT/HEAVY · FLAT/SHARP · BRIGHT/DARK · SOFT/LOUD`, with DULL spare, scores 3/4. Only "lustre, not colour" rules it out, and the result text never explains why DARK fails.
2. **The sense lines nearly reveal the answers.** "Weight", "pitch, not volume" and "volume, not pitch" each identify one pair directly. This conflicts with the spirit of the brief's "no automatic pair-revealing hint", though that is my interpretation.
3. **Check messages are wrong in two cases.**
   - The third wrong check says "1 checks left".
   - The fourth wrong check says "0 checks left. Which meanings could you reconsider?", even though the game has ended.
4. **Word moves are under-announced.** With a full board and FLAT in the active slot, clicking DARK announces only "DARK placed in context 2", not that FLAT returned to the bank. Swaps are just as silent. Focus stays on the word, and `#placement-guide` isn't a live region, so screen reader users don't hear the next target.
5. **Clues and word bank are separated on phones.** At ≤660px the bank is static and sits below all four contexts, and slot focus uses `preventScroll`. The guide names only "context N, space M", not the clue text, so players will probably have to scroll back and forth.
6. **Status labels are too small.** The `PLACED` and `IN BANK` labels are 8px, yet they are the text cue that backs up the colour change.

**Minor:**
- Invalid JSON in the save starts a fresh game correctly, but wrongly says saving is unavailable until the next successful save.
- `font:750 19px/1.2 inherit` on `.preview-slot` is invalid CSS, so the whole declaration is dropped.
- Collapsing check history reopens it on the next render.
- Finished boards keep "Choose a word" on empty slots and leave the right column empty on desktop.
- The test named "isolated" doesn't test storage isolation or `#daily` routing.

## Verified as correct
- **Swaps:** moves, swaps, displacement and returns never create duplicates.
- **Checks:** incomplete and repeated layouts cost nothing, pair order is ignored, and swapping pairs between rows counts as a new layout.
- **End states:** the fourth check ends the game correctly, including a win on that check.
- **Save validation:** it recomputes scores and rejects duplicates, impossible history and mismatched final layouts.
- **Keyboard:** native buttons and the dialog work, and focus moves sensibly after return, check and reveal.
- **Isolation in the supplied code:** the preview uses its own save key and state, and its code doesn't call the daily stats or streak logic.

## Semantic assessment

| Alternative layout (other rows as intended) | Spare | Score | Fairness |
|---|---|---|---|
| BRIGHT/DARK in context 3 | DULL | 3/4 | Arguable, and the only one worth fixing |
| SOFT/BRIGHT, DULL/LOUD | DARK | 2/4 | Weak: "soft" and "dull" are only loose opposites here |
| BRIGHT/DARK, DULL/LOUD | SOFT | 2/4 | Very weak |

LIGHT/DARK, SHARP/DULL and FLAT/BRIGHT are fair lures, because they leave LIGHT, FLAT or SHARP without a valid partner in another context. The weight, pitch and volume pairs are sound. The lustre row is fair only because of its sense line.

**Likely difficulty (my judgment, not measured):** probably easy to moderate, with a first-check solve likely for a fluent adult. Three rows nearly solve themselves, leaving only DULL or DARK to decide.

Four checks are also generous. A 3/4 score can only mean the spare is in the one wrong row, so the main trap should cost at most about one extra check. James's playtest still has to decide this.

## Unverified: files not supplied
`common.mjs`, `index.html` and `puzzles.mjs` weren't included, so these are risks to check rather than findings:
- `.mode-switch` may not exist when `mountOriginal` looks for it, which would throw an error and drop the preview link.
- `#app` may not exist, which `mountPreview` needs.
- `mountPreview` never sets `body[data-game-id]`. If only `mountDailyGame` sets it, the preview loses its themed background and accent colours.
- Shared code could scan `deepseek-spare:*` keys and pick up the preview save, or could use other URL hashes. Any hash except `#daily` opens the preview.

## Two improvements
1. **Replace context 3 with one where DARK has no meaning:** for example, "A teacher describes how quick a pupil is" (BRIGHT/DULL). This removes all three alternatives and adds SHARP as a lure, which the pitch row rules out. The trade-offs are that "dull pupil" is a bit unkind and dated, and DARK becomes a weaker spare.
2. **Hide the sense lines until after the first failed check:** the clues then do the work on the first attempt, and the lines become a fairness aid instead of an upfront answer. Make this change together with the first one, because without the "not colour" line BRIGHT/DARK becomes harder to reject.
