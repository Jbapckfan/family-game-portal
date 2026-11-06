# Refinement pass: director outputs
Opus 5.5 · 2026-11-06 · targeted corrections only; the four concepts are not redesigned.

## 1. Territory Tactics board count: 240
The current edition (37 hexes, up to 3 placements, exact capture total) has 240 validated boards (`input/games.json`, `currentEditionNote`).
- `site-C.html`: Territory's catalogue row count changed from 200 to **240**. This is the only per-game count column in the four concepts.
- `site-A.html`, `site-B.html`, `site-D.html`: the "prepared daily puzzles" total is the sum of every game's `boards`. Recomputed from the corrected games.json, it is **9,581**, up from 9,541. The old figure equals the same sum with Territory at 200, which confirms the cause.
- Sites A, B and D have no per-game count. Their Territory rows already describe the current rule (exact total, three stones).
- `all-games-review.json` already said 240. No change was needed there.

## 2. Kimi reviews completed from corrected captures
I viewed the six replaced 393px screenshots and read each `visible-text.txt` (board plus full help text). The earlier "partial / help overlay" wording is gone. The translucent overlay is recorded as a capture-timing artifact, not a UI defect. Changes in `all-games-review.json`:
- **Cairn:** a full start-state diagnosis. The faint slab glyph already in the card is the seed for the stacked-slab direction. The summit image is an end state and is not in the capture.
- **Morph:** ladder-history display is still unobserved. The "empty region looks like a layout bug" wording is softened (see the cross-game note below).
- **Tangle:** new findings are the five competing numbers before the board and "0/84 words" against a Gold-in-points goal. 5×5 already exists as an equal "Preview" segment, so the recommendation is now to demote it, not add it.
- **Hunch:** start state confirmed. Dot rendering isn't visible before a guess. Keys are about 30px wide. The peg block can use the column the layout already reserves.
- **Circuit: factual correction.** The earlier "1·CPS, 2·AOE" came from the help example. Today's arcs are K B C / U S H / A I R / W M E. New findings: the dead dark-navy centre disc, duplicate arc cards and a seven-control stack. The geometry and colours James's feedback endorsed are preserved.
- **Quartet:** Shuffle/Clear labels look crowded or clipped at 393px (to verify live). The help text's "One away…" and tiers 1–4 raise the originality risk.
- **Cross-game:** the "translucent help dialog" bullet was replaced with a Kimi-template note covering beige secondary buttons and an outlined game frame with an empty band below the card. The supplied markup doesn't reveal the frame's cause. It may be a focus outline from the Escape step, so it is flagged for live verification, not asserted as a bug.

## 3. Second Sense ordering: still a hypothesis
- **Evidence restated accurately.** In No. 018, by my reading of the clues, nouns 1, 2 and 4 share positions with their verbs, and the other two are swapped. The earlier text wrongly said "correspond exactly" appeared in both lists. It is only a verb clue.
- **Source.** `app.mjs` renders `puzzle.nouns` and `puzzle.verbs` in the order supplied, with no client-side shuffle. The files that set that order (`puzzles.mjs`, `engine.mjs`) are not in the input, so neither a bug nor an independent shuffle can be confirmed.
- **Odds.** Under independent uniform shuffles, three or more aligned pairs out of five happen on about 9% of boards (11/120). One board is weak evidence.
- **To settle it,** inspect the generator, or count aligned positions across many boards (independent shuffling averages about one per board).

## 4. Handoff
- `HANDOFF.md` had no "unusable screenshots" limitation, so there was nothing to remove.
- Added a short **Status and limits** paragraph: not approved by James; not published; B is a recommendation; the director did not run a browser; the 393/1440 render check was reported by parent Codex (no horizontal overflow, missing images or script errors) and is a smoke check, not usability testing; diagnoses rest on single start-state captures.
- Renamed "Preserve what James approved" to make clear these are element-level endorsements from his recorded feedback, not approval of any concept.

## Limits maintained
- No live browser use, gameplay or production testing by the director. All screenshot observations come from viewing the supplied images.
- No numeric taste scores. The only number is Inbetween 6/10, quoted from the source.
- No claims of user approval or production publishing. These are design proposals only.
- Team folders were not touched. Only files in `director/` changed.
