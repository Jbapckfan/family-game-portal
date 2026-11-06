# Team 01: design notes

Opus 5.5 · 2026-11-06 · design proposals only. Nothing here is live, approved or tested.

**Scope.** 11 games: six keepers with four concepts each (Switchpath, Counterpart, Shortlist, Second Sense, Tradeoff, Inbetween) and five other games with one direction each (Ringcount, Sideways, Quartet, Spare, Rung). That makes 29 HTML mockups in this folder, sharing `studio.css`.

**How this catalogue was finished.** The mockups were built in an earlier session that hit its time limit before writing metadata. In this pass I read all 29 HTML files and wrote `game-proposals.json` and this file from what the markup and scripts actually do. Diagnoses draw on the director's `all-games-review.json` and the owner feedback in `assigned.json`. I did not re-inspect the source screenshots in this pass, and I did not open a browser. The parent reports rendering the mockups; that is a layout check, not usability testing.

## Recommendations

| Game | Pick | Why, briefly | Borrow |
|---|---|---|---|
| Switchpath | **A · Signal Board** | The rule colour wraps the board. Legal neighbours get a matching outline and ↑/↓ badge, so the cue is where the tap is. | C's arrow keys (A lists keys but doesn't wire them); D's share card |
| Counterpart | **B · Relationship Bridge** | Given pair and your pair are stacked as parallel arrows, so direction becomes geometry. Words up to 34px, which answers James's readability request. | D's 1–0 / R / Enter shortcuts; A's ledger as overview |
| Shortlist | **A · Pinned Evidence** | Scans stay pinned while scrolling. Cross-off and pick are separate controls. The final pick needs explicit confirmation, with a "Not yet" escape. | C's sorting trays as an optional Practice tool; D's growing type |
| Second Sense | **A · Two-Faced Plate** | The chosen noun and verb become two faces of one plate with the word between them. | B's dictionary-entry ledger for solved words |
| Tradeoff | **C · Blocks & Rails** | Strongest physical version of the tile James likes. Grooves, a lifted block, partner outlines and a par-5 meter. | B's two-word swap preview; D's unpinned-clue bonus as a separate experiment |
| Inbetween | **A · Insertion Rail** | Real gaps between letters turn blue when a pair is held, with the approved blue preview and a mirrored side guide. | B's spreading-letter animation; C's harder clues as a separate content/bonus task |
| Ringcount | A · Cut Ring | Only direction. Cutting becomes the main act, and sums sit on their arcs. | Sealed-totals experiment is the real lever for "boring" |
| Sideways | A · Drum Lock | Only direction. Column reading windows, and green only after Check. | Spare-letter-drum experiment for the forced fourth column |
| Quartet | A · Assembly Tray | Only direction. A four-socket tray replaces in-place highlighting. | Remove or reword the near-miss line (see risks) |
| Spare | A · Opposite Axes | Only direction. Light bank and a physical opposite axis. | Show all four contexts at once in a follow-up |
| Rung | A · The Climb | Only direction. Empty rungs make the shortest route visible. | Share Morph's ladder component if both stay |

## Mechanic experiments, kept separate from the UI proposals
- **Tradeoff D:** an unpinned-clue bonus. It reuses today's words for illustration; real boards need validation. Daily score and streak are unaffected.
- **Inbetween C:** a harder-clue toggle. The clues are editorial samples, not validated content.
- **Ringcount A:** sealed totals with three checks. Not part of the current rules.
- **Sideways A:** spare letter drums (five letters, four shown). Needs new validated boards; not playable in the mockup.
- **Shortlist B:** the letter lens is an assist. The mockup proposes it off by default in the Daily.
- **Not addressed:** Switchpath's requested closer numbers and 5×5 board. None of the four concepts implements them. They would be a separate bonus board.

## Facts I could not establish, and known limits
- **Engine behaviour is described, not verified.** Several mockups describe live-engine behaviour I could not confirm from supplied source in this pass:
  - Counterpart B's "right words, wrong direction" message.
  - Second Sense A's "fits the noun/verb only" message.
  - Spare's check feedback ("how many pairs are right, not which") and its Clarify notes.
  - Shortlist's strategy-hint wording.

  All of these appear in the mockups only as messages ending "Not wired in this prototype". Confirm against the engine before adopting.
- **Spare contexts 2–4** were not in the supplied source, so the mockup shows placeholders.
- **Rung** validates against a small demo word list only.
- **Quartet:**
  - The group names are the designer's reading of the words.
  - The near-miss line ("Three of these four connect…") echoes the "one away" convention that the director flagged as an originality risk.
- **Second Sense ordering:** the sample's noun/verb lists put HAWK, CLUB and MATCH at matching positions. That fits the director's unconfirmed clue-ordering hypothesis but doesn't prove it. Check the generator.
- **Keyboard gaps:**
  - Switchpath A and Inbetween A state keyboard paths (arrow keys) that are not wired.
  - Second Sense A and C show "Check ↵" but don't bind Enter.
  - Switchpath D's stroke preview is hover-only.
  - Counterpart C's drag uses HTML drag-and-drop (mouse); tap-to-place is the touch path.
  - Tradeoff C's drag is mouse-only by design.
- **Palette:** Tradeoff C's over-par meter uses amber, which sits outside the handoff's state palette. Second Sense C uses a dark ink hub, which the handoff discourages in game surfaces.
- **Sharing:** only Switchpath D shows a share card (marked illustrative). Every other design gives a proposed share line in the JSON that is not drawn.
- **Scores and counts:** every sample score, scan result and count in the mockups is either from the supplied sample board or marked illustrative. No owner approval is implied for any concept.
