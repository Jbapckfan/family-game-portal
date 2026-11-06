# Alford Daily: creative director handoff
Opus 5.5 · 2026-11-06 · design proposals only, not live, not tested in production.

Files: `design-system.json` (four directions), `site-A.html` to `site-D.html` (homepage concepts with local-only interactive states), `all-games-review.json` (33 games, 18 keepers), `REFINEMENT.md` (corrections made after the first pass).

**Status and limits.** None of this has been reviewed or approved by James, and nothing is published. B is the director's recommendation, not a decision. The director did not run a browser. Parent Codex reports rendering all four site concepts at 393px and 1440px, with no horizontal document overflow, missing images or script errors in that check. That is a layout smoke check, not usability or accessibility testing. Game diagnoses rest on single start-of-game screenshots, visible-text extracts and partial source. End states, motion and touch feel were not observed. The Second Sense clue-ordering concern is an unconfirmed hypothesis (see the review JSON).

## Leadership decisions
1. **Recommended direction: B, "Tray".** Use molded white objects in a precise pale-blue setting. Raised means you can act, recessed means a slot or container, and latched means on. It is the only direction that answers "modern physical forms" while sharing a vocabulary with the game pieces James already likes (Tradeoff tiles, Inbetween drag pairs).
   - Borrow A's single-line index as the compact list mode.
   - Borrow C's three-line rule summary for a game's detail sheet.
   - Borrow D's verb-first "the move" line on every collection entry.
2. **One frame for every page.** Every page uses the pale blue field (`#EEF3F8`/`#E9F0F7`), white surfaces and blue-ink type. Retire the cream/beige template, the dark navy collection bar, and the dark game panels (Syntax Siege, Spare bank, Shortlist scan panel, Tic-Tac-Toe).
3. **No provider names in product UI.** Remove "Developed by …", "Concept by …" and the provider filter. The collection is grouped by how a game plays: Clues & meaning (9), Letters & words (13), Deduction (4), Logic & pattern (7).
4. **Every game appears once on the hub.** Today's Three is the only featured surface. In the catalogue, today's games get a small "Today" tag, not a second card or banner. There is no "Ready for today" and no hero tagline.
5. **Feedback receipts must be real.** The receipt slot stays empty until the server confirms; no optimistic "Thanks!". Favourites and Hidden are first-class filters with counts. Hiding a game never changes today's set or any record.
6. **Two Tangles** keep their names and are always shown with a subtitle: "Tangle · Word trails" and "Tangle · Interleaved words".
7. **Urgent game rethinks:** Sprout (answers must be the plant) and Pattern Prism (adult, fun, physical sequence machine).
   **High priority:** Switchpath, Counterpart, Hunch, Territory Tactics, Claude Tangle, Syntax Siege.

## Rules for game-design sessions
Follow these. They create cohesion without forcing one template.

**Frame and chrome**
- Keep the shared field and white working surface. No brown, beige, cream, tan, purple, violet or lavender, including hover, hint and end-cell states.
- Use one header: back to Alford Daily, game name (sans, 32–40px), a one-line "move" sentence, then Daily/Practice, the favourite and hide toggles, help and stats.
- Do not put a dark bar above the header or a profile disclosure inside the game.
- Hint and Reveal live in one quiet row inside the game surface, with their costs stated in the button label.
- The feedback box sits below the game, using the shared component with the receipt slot.

**Type and targets**
- Body text is 17px or larger on phone and 18px on desktop.
- Clue text is 19–22px. Game letters are 28px or larger on phone.
- Tap targets are at least 44px; primary game pieces are at least 52px.
- Every game must also be playable by keyboard.

**Material grammar (B)**
- Use exactly two elevations: recessed (tray, slot, well) and raised (tile, key, puck).
- Raised pieces have a 1px top highlight, a 4–6px darker bottom edge and one short shadow.
- Pressing moves a piece down 2–4px.
- No metal textures, chrome or brushed effects.
- Do not wrap plain text in a card.

**State colours**
- Blue: selected, yours, or higher.
- Teal: the second direction, lower, or confirmed.
- Gold: required or anchor letters and targets.
- Green: accepted or solved only.
- Red: errors only.
- Never signal a state with colour alone; add a glyph, a label or a shape.

**Rules in context**
- Show a rule where the decision happens, as live on-board feedback: legal-next highlights, capture forecasts, "why that cost a knot".
- A how-to paragraph is the fallback, not the main explanation.

**Respect each game's form**
- A ring stays a ring and a hex board stays hexes. Ladders, stems, arches and strings should look like what they are.
- The system decides material, type and states. It does not decide layout.
- The four alternatives per keeper must differ in composition or interaction, not palette.

**Mechanics are fixed**
- Keep the dictionary, difficulty, hint costs, completion and provenance, and saved-state semantics.
- Any harder bonus round or rule change goes in a separately labelled "optional mechanical experiment".

**Sharing**
- Share results show the real metric (scans, checks, swaps, placements, hints) and solved/unsolved marks.
- Never show letters, words, positions or board shapes that reveal answers.
- Illustrative numbers in mockups are marked ◇.

**Preserve elements James's recorded feedback endorsed** (source: games.json; this is not approval of any concept here)
- Circuit: cardinal quadrant splits and distinct blue/green/gold/red arcs.
- Morph: input control and legibility.
- Inbetween: drag/drop with the blue preview, mirrored in the side explainer.
- Switchpath: blue = higher, teal = lower.
- Hunch: grouped black/white dots.
- Territory Tactics: 37 hexes, three placements, an exact capture total, and the before/after lesson.

**Mockups**
- Use local code-native HTML/CSS/SVG only.
- Show a "Design concept" mark outside the product UI.
- Controls are local-state or clearly inert.
- Never show a fake success state.

## Five anti-patterns from the rejected work
1. **Answers pasted next to the visual instead of becoming it.** Sprout's word cards over leaves and its history chips beside the plant were rejected. If the game has a metaphor (plant, cairn, arch, string), the player's answers must physically build it.
2. **Childish primitives and pastel "educational" colour.** Pattern Prism's sage/rose/gold triangles and circles with captions on every attribute, and the earlier outline-shape icons. If a visual needs a text label for every property, the visual has failed.
3. **Recolours presented as alternatives.** The pale-metal card variants and the charcoal Prism theme changed material or colour but kept the same composition. James rejected all of them. A true alternative changes hierarchy, layout or interaction.
4. **Synthetic organic decoration.** The plant-like word ladders and decorative "growth" art had no link to the mechanic, and the cartoon Cairn summit image "looks really dumb". Use ornament only when it encodes game state.
5. **Repeated identical rounded cards and duplicated promotion.** The live hub repeats the same card style 33+ times, shows Today's games up to three times, adds promo banners, and puts every game row in its own bordered card. Use one surface with rhythm from type, rules and size contrast, and show every game once.
