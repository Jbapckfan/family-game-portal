# Alford Daily: creative director handoff
Opus 5.5 · 2026-11-06 · Revision 2 · design proposals only, not live, not tested in production.

Files: `design-system.json` (one home style, four layouts), `site-A.html` to `site-D.html` (homepage concepts with local-only interactive states), `all-games-review.json` (33 games, 18 keepers), `REFINEMENT.md` (first correction pass), `REVISION-02.md` (this theme correction).

**Status and limits.** James rejected the first set because it didn't follow the main site's style. This revision replaces the old pale-blue frame with the live home theme. Nothing here is approved or published, and B is a recommendation, not a decision. The director did not run a browser and has not inspected these revised pages rendered. Browser QA at 393px and 1440px is the parent session's job. Earlier smoke-check results apply to the old files only. Game diagnoses rest on single start-of-game screenshots, visible-text extracts and partial source.

## Leadership decisions
1. **The live home page is the design system.** Use paper `#f6f3ec` with no gradient, warm-white `#fffefa` cards with 22px corners, a 1px `#dcded8` line and the home's faint `0 6px 0` shadow. Ink is `#202c35`, muted text `#5b666c`, and green `#376c58`. Use DM Serif for the wordmark, headings and game names, and DM Sans for everything else, including board letters. Link `../assets/site-theme.css` **last** in every page head and use its `--ad-*` tokens. The brand is `assets/brand.svg` plus "Alford **Daily**" with "Daily" in green.
2. **A–D are four layouts in one style.** They share brand, type, controls and colours; only hierarchy and interaction differ.
3. **Recommended: B, "Tray".** It uses the home's own cards, shows each game once, and puts Today's Three in a quiet `#eeeee6` well. Borrow A's ruled list as the List mode, C's three-line rule summary for a detail sheet, and D's verb-first move line on every card.
4. **No provider names in product UI.** Group the collection by how a game plays: Clues & meaning (9), Letters & words (13), Deduction (4), Logic & pattern (7).
5. **Every game appears once on the hub.** Today's Three is the only featured surface; the catalogue marks today's games with a small "Today" tag.
6. **Feedback receipts must be real.** The receipt slot stays empty until the server confirms. Favorites and Hidden are first-class filters with counts. Hiding a game never changes today's set or any record.
7. **Two Tangles** always carry subtitles: "Tangle · Word trails" and "Tangle · Interleaved words".
8. **Game priorities are unchanged.** Urgent: Sprout and Pattern Prism. High: Switchpath, Counterpart, Hunch, Territory Tactics, Claude Tangle and Syntax Siege.

## Rules for game-design sessions
**Frame and chrome**
- The body stays on paper. Don't put a full-width opaque panel (blue, navy or white) over the centre of the page. Boards sit in home cards or directly on paper.
- Use one header: the brand, a back link to the collection, the game name in DM Serif (32–44px), a one-line move sentence, then Daily/Practice, the Favorite and Hide toggles, help and stats.
- No dark bar above the header, and no profile disclosure inside a game.
- Hint and Reveal go in one quiet row of secondary buttons, with their costs in the labels.
- The feedback box sits below the game, using the shared form and receipt slot.

**Controls (identical across games)**
- **Primary:** an ink pill, 44px tall.
- **Play/continue:** green bold text with a green-wash ↗ chip.
- **Secondary:** warm-white, 1px line, 8px radius, 44px tall, 13px semibold.
- **Filters:** a home segment with the pressed segment in ink.
- **Pressed toggles:** green wash, green border, and text that changes (☆/★ Favorite, Hide/Unhide).
- **Focus:** a 3px green ring.
- **Eyebrows:** DM Sans 700, 11px, uppercase, tracked.

**Type and targets**
- Body is 15–16px, clue text 17–20px, and game letters 24px or larger on phone (28px or larger where the board allows).
- Tap targets are at least 44px; primary game pieces are at least 48px.
- Every game is keyboard playable. Check 393px and 1440px with the real DM fonts, because DM Serif sets wider than Georgia.

**Material**
- Pieces are warm-white tiles with a 1px line and a flat 2–4px bottom edge in a line colour.
- A pressed piece moves down 2px. A selected piece takes a green border or wash.
- Avoid metal, neon, inset "hardware" wells, gradients and strong drop shadows. Don't wrap plain text in a card.

**Colour roles**
- **Chrome:** ink, muted and green only. Green means act, selected or solved.
- **Identity:** a game's home identity colour appears only on its category eyebrow and icon.
- **Board semantics stay local and are never recoloured in bulk.** Circuit's four quadrant colours, Territory's blue stones and amber targets, Hunch's black/white pegs, Switchpath's blue higher and teal lower, Inbetween's blue drag preview, and Sprout's green plant.
- **Errors:** a muted red (the home uses `#972f3d`).
- Never signal a state with colour alone.
- No purple or brown page themes. Warm paper is required, not banned.

**Rules in context**
- Show rules where the decision happens: legal-next highlights, capture forecasts, "why that cost a knot".

**Respect each game's form.** A ring stays a ring and a hex board stays hexes. The system decides surface, type and controls; it doesn't decide layout. The four keeper alternatives must differ in composition or interaction, not palette.

**Mechanics are fixed.** Keep the dictionary, difficulty, hint costs, completion, provenance and saved-state behaviour. Propose no difficulty changes in this revision.

**Sharing.** Share real metrics and ✓ marks only. Never share letters, words or positions. Mark illustrative numbers ◇.

**Preserve what James's recorded feedback endorsed** (element-level, not approval of any concept)
- Circuit's cardinal quadrants and four distinct arc colours.
- Morph's input and legibility.
- Inbetween's blue drag preview and the side explainer that mirrors it.
- Switchpath's blue higher and teal lower.
- Hunch's grouped black/white dots.
- Territory: 37 hexes, three placements, an exact total, and the before/after lesson.

**Mockups.** Local HTML/CSS/SVG only. Put the "Design concept" mark outside the product UI. Controls are local-state or labelled inert. No fake success states.

## Anti-patterns from rejected work
1. **An off-theme frame.** Revision 1 put the games on a pale-blue field with system fonts, navy panels and molded hardware. James: "these don't follow the basic style of the overall website." Every page must look like a page of the home.
2. **Answers pasted next to the visual instead of becoming it.** For example, Sprout's word cards sitting over the leaves.
3. **Childish primitives and pastel "educational" colour.** If every property needs a caption, the visual has failed.
4. **Recolours presented as alternatives.** A true alternative changes hierarchy, layout or interaction.
5. **Synthetic decoration, and duplicated promotion.** Ornament must encode state. Show each game once, and don't add promo banners.
