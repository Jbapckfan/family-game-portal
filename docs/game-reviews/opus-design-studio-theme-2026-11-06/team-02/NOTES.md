# Team 02: design notes

Opus 5.5 · 2026-11-06 · design proposals only. Nothing here is live, approved or tested.

> **Revision 2 (same day).** All 29 mockups were re-themed to the live home page (warm paper, warm white, charcoal, home green, DM Serif / DM Sans), and every page now links `../assets/site-theme.css` last. Compositions, controls and game rules are unchanged. See `REVISION-02.md` for the per-game changes and the honest list of which prototype controls are wired. The text below is the original Revision 1 note, with wording updated where it described the old materials.

**Scope.** 11 games: six keepers with four concepts each (Cairn, Morph, Tangle, Hunch, Circuit, Twin Hive) and five other games with one direction each (Cipher, Logic Lattice, Syntax Siege, Pattern Prism, Territory Tactics). That makes 29 HTML mockups in this folder, sharing `studio.css`.

**How this file was finished.** An earlier session wrote `game-proposals.json` and all 29 mockups, then hit its time limit before writing this file. In this pass I checked the following and changed nothing in the manifest or mockups:
- The manifest has exactly the 11 slugs in `assigned.json`.
- Keepers have designs A–D and other games have A only.
- All 29 `mockup` filenames match files in this folder.
- Every mockup's `<title>` matches its manifest title.
- Every mockup carries a "Design concept" mark.

I did not open a browser or run anything. The parent owns rendering QA.

## Recommendations (from the manifest)

| Game | Pick | Why, briefly | Borrow |
|---|---|---|---|
| Cairn | **A · Stairstep** | The board is the climb: five slabs widen from 3 to 7 letters, and solved words stay on their stair. | D's five-bar result card in place of the summit picture James disliked |
| Morph | **A · Ladder rails** | A literal ladder with GOAL at the top and START at the bottom. The editable rung is explicit, and readability and input are preserved as James asked. | D's live "exactly one change" check under the active rung |
| Tangle (word trails) | **A · Engraved plate** | Shallow wells on one warm-white plate and a thick translucent green trace ribbon make path order unmistakable. Medal goals sit on a tick ruler. | B's split workspace above 820px; C's 5×5 board as an optional bonus after Gold |
| Hunch | **A · Peg board** | Grouped black/white key pegs sit in a well beside neutral letter pegs, with no per-letter colour anywhere. This is the clearest break from the per-letter colour-grid silhouette James compared it to. | B's numerals in screen-reader labels |
| Circuit | **A · Instrument dial** | Keeps the cardinal quadrants and the distinct blue/green/gold/red arcs. The forbidden arc dims with a stated reason. | C's quadrant keypad as the layout below about 360px |
| Twin Hive | **D · Split-core flower** | A + M become one split gold core in a fixed-size seven-cell flower, which fixes both the twin-letter reading and the stretching. | B's six-slot ledger |
| Cipher | A · Typeset message | Type-set phrase without tile frames. Selecting a code tints every occurrence. | — |
| Logic Lattice | A · Line counters | Removes the Minesweeper-like "?" squares, adds live per-line counters, and moves diagonal totals to their diagonals. The game stays parked. | — |
| Syntax Siege | A · Light firing range | Moves the dark arena onto the home page's warm paper. The enemy physically travels the lane. | — |
| Pattern Prism | A · Signal decoder | A rethink, not a recolour: flat matte pucks with direction notches, plus a decoder table that separates the four cycles. | — |
| Territory Tactics | A · Survey table | Exact target as the headline, inspect-a-group with openings marked, and the before/after lesson kept in context. Keeps 37 hexes, three placements and exact capture. | — |

## Mechanic and product experiments, kept separate
- **Tangle C:** a 5×5 board as an optional bonus after Gold. This is a placement decision, not a rule change.
- **Tangle D:** type-to-trace is an input-method change, separate from the core UI.
- **Hunch C:** the note mode is player-only marking; nothing is auto-marked.
- **Pattern Prism A:** the cycle-tuning rows are off by default and would lower difficulty.
- **Territory A:** inspect shows only facts already visible on the board, but it may make the game feel easier. Its capture preview is local, not the shipped engine.

## Facts I could not establish, and known limits
- **Manifest wording (resolved in Revision 2).** Morph B's summary used to call the goal plate "brushed". The plate is now a plain warm-white card, and the manifest wording has been corrected.
- **Prototype wiring.** Many buttons in these mockups are visual only (for example Enter/Check, hints, reveals, the Daily/Practice switch and most physical-keyboard shortcuts). Revision 2 states exactly what is wired at the foot of each page and in `REVISION-02.md`, and the manifest's interaction text no longer claims unwired typing or dragging.
- **Illustrative content.** Several mockups contain states marked illustrative, invented or not checked:
  - Cairn D: result statuses.
  - Hunch A–D: practice states.
  - Hunch D: card rows 4–5, which are invented.
  - Circuit A–D: played states.
  - Circuit D: the finish.
  - Tangle B: found words, which were not checked against the word list.
  - Twin Hive A–D: entries and collections.
  - Morph A: the illustrative BAND rung.
  - Syntax Siege: Fire previews damage without checking the word.

  None of these is a supplied route, score or answer.
- **Engine parity.** The local logic in Circuit, Territory, Lattice, Cipher and Tangle path-finding is prototype logic. Parity with the live engines is unverified.
- **Touch targets.** Per the manifest, these are at or near the 44px limit on 320px phones:
  - Circuit A's ring caps.
  - Circuit C's keys (about 40px wide at 320px).
  - Morph C's QWERTY keys.
  - Territory's hexes (about 35px unzoomed). Territory's "Zoom board" pans inside the board frame, not the page.
- **Observation limits.** Diagnoses rest on start-of-game screenshots and partial source. End states, motion feel and touch feel were not observed. No owner approval is implied for any concept.
