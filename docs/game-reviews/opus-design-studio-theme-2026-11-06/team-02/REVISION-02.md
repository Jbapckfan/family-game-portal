# Team 02 · Revision 2: native to the live home page

Opus 5.5 · 2026-11-06 · design proposals only. **Not browser-verified.** I edited files only; I ran nothing, rendered nothing and inspected no screenshots of these pages. The parent owns visual QA at 393px and 1440px.

## What James asked for

> "these don't follow the basic style of the overall website, so they are distracting. follow the overall theme of the website/background and colors we are using on the main page, try again"

The authority is the captured live home page (`input/live-theme/`). It uses:
- warm paper `#f6f3ec` with no gradient;
- warm-white cards `#fffefa` with 22px corners and hairline `#dcded8` edges;
- charcoal ink `#202c35`, muted `#5b666c` and green `#376c58`;
- DM Serif for the wordmark and headings, DM Sans for text and controls.

## Shared correction (applies to all 29 pages)

**Every page links `../assets/site-theme.css` last in `<head>`.** I did not edit that shared file. All 29 pages are also edited individually: brand lockup, inline colours and a wiring note.

**`studio.css` (rewritten).**
- Defines prefixed chrome tokens. The home tokens are mirrored: `--ad-paper`, `--ad-surface`, `--ad-ink`, `--ad-muted`, `--ad-line`, `--ad-green` and `--ad-soft`. Warm derivatives are added: `--ad-ink-2`, `--ad-line-2`, `--ad-wash`, `--ad-well`, `--ad-edge`, `--ad-green-deep`, `--ad-faint`, `--ad-ok` and `--ad-bad`.
- Remaps every legacy name the pages use (`--bg`, `--paper`, `--accent`, `--line` and so on) onto those tokens. As a result, the old cool frame (`#edf3f8`), royal-blue accent (`#1c5cbc`), teal eyebrows and blue focus ring are gone everywhere at once.
- `--mono` now resolves to DM Sans with tabular figures, because the home page has no monospace. Ledgers, meta lines and labels now use the house sans.
- Headings: h1, h2 and h3 are DM Serif at weight 400. Site-theme locks h1/h2; `studio.css` sets h3.
  - Section labels that were 12px uppercase `h2`/`h3` are now real DM Serif headings (19–28px). Small labels stay DM Sans in the home "eyebrow" style: 11px, 0.14em tracking.
- Body: paper background, DM Sans, 1.5 line height. There is no panel behind the game, so the paper shows through as it does on the home page.
- Buttons:
  - secondary: warm white with a `#c9cbc2` border;
  - primary: home green with warm-white text and no drop shadow;
  - quiet: transparent.
- Other controls:
  - segmented control: a warm wash track;
  - focus ring: green;
  - dashed "Preview…" toggles: kept visibly different from product controls.
- **Brand header.** Back link, the supplied `assets/brand.svg` logo (30px, 28px at 400px and below), and "Alford **Daily**" in DM Serif with "Daily" in home green, as on the home masthead. Favourite / Hide / Help sit on the right above a hairline.
  - Below 360px the wordmark text is visually hidden but still read aloud. Back, logo and tools (about 330px) then fit a 320px screen.
  - I estimated these widths for DM Sans and DM Serif rather than measuring them in a browser.
- **Game header.** A 48px icon tile, a muted 11px uppercase eyebrow, and the game name in DM Serif at `clamp(34px, 7vw, 44px)`.

**Per-page pattern.** Each page also:
- replaced its hard-coded cool greys and blues with tokens or warm equivalents;
- flattened gradients, gloss and heavy drop shadows into flat 2–5px warm edges;
- moved large panels to 22px warm-white cards;
- reduced 800/850 weights to 700 (the bundled DM Sans maxes out at 700);
- added a factual **"Prototype wiring"** sentence to its footer.

**Semantic colours kept, and localised to the board:**
- Circuit's blue/green/gold/red arcs: exact approved hex values, untouched.
- Territory's blue stones and amber targets.
- Hunch's black and white pegs and dots.
- Twin Hive's gold.
- Pattern Prism's four signal colours.
- The Siege enemy's red outline.

No new purple, brown or blue page theme was introduced.

## Per-game changes

### Cairn (A–D)
- **A · Stairstep:**
  - Blue gradient slabs become warm wells with a hairline and a 2px edge.
  - The active stair is soft green with a green outline.
  - Status marks are green (Clean), split green (Assisted) and muted dashed (Shown).
  - Side cards use 20px DM Serif titles.
- **B · Monolith:**
  - The "stone" card is a warm-white 22px card with a flat stacked edge instead of a blue shadow.
  - The level number "1/5" is set in DM Serif.
  - Pebbles are flat warm discs.
  - The legend colours match A.
- **C · Carry and add:** Tray, sorts, rail and example box are warm. The active slot is soft green.
- **D · Altitude rail:**
  - Rail and nodes are warm; the current node is green.
  - Keycaps are flat warm white with a 5px edge.
  - The result card is a 22px card with a serif headline and green/pale-green/dashed bars.

### Morph (A–D)
- **A · Ladder rails:**
  - The metallic rail gradient is now a flat warm line.
  - The GOAL rung is charcoal instead of navy, and the active rung is soft green.
  - Feedback copy says "green tick" (was "blue").
- **B · Combination dials:**
  - The "brushed" plate is a plain warm-white card; the housing is a warm wash.
  - The dial windows fade warm wash to white, so there is no metal look.
  - The moved dial gains a green frame.
  - "Your ladder" is now a serif heading.
- **C · Bridge and target columns:** The selected column is outlined in **ink**, so green only ever means "matches the goal". The bridge "you are here" dot is ink.
- **D · Typed editor:** Check badges are wash, soft green and soft red. The ladder log is a 22px card with a serif heading. The giant field is slightly narrower to suit DM Sans.

### Tangle (A–D)
- **A · Engraved plate:**
  - One warm-white plate with shallow wells.
  - The trace ribbon is translucent home green.
  - The ruler fill is green, and the score uses a DM Serif numeral.
- **B · Split workspace:**
  - Ink-bordered tiles on warm white; path-order numerals are pale green on ink.
  - The medals card is 22px with a serif score; "Found by length" is a serif heading.
- **C · Keycaps and bonus board:**
  - The deck is a warm wash; keycaps are flat warm white with a 5px edge.
  - Selected keys are soft green; the wire stays green.
  - The bonus card is 22px, and its summary wraps on narrow screens.
- **D · Type to trace:**
  - The dot lattice sits on a warm 22px card.
  - The primary trail is translucent green and alternates are dashed ink (no teal).
  - Score cells use serif numerals.

### Hunch (A–D): black and white feedback preserved
- **A · Peg board:**
  - The board is a flat warm-white card; letter pegs are warm with a flat edge.
  - The key-peg well is a warm wash.
  - Black pegs are near-black `#1b2126`; white pegs are white with a 1.5px grey ring. Both are flat, with no gloss.
- **B · Ledger:**
  - The table now actually shows its 22px corners (`border-collapse: separate`).
  - Guesses use letter-spaced DM Sans, since monospace has been dropped.
  - The current row is soft green, and "Reading a row" is a serif heading.
- **C · Deduction notebook:** Guess cards, pills and the notebook card are warm. "Ruled out" keys use a warm wash with faint struck text.
- **D · Focus line:** Hero tiles are warm white with a flat edge, and the current tile has a green ring. The dock keyboard is warm with ink Enter/⌫ keys. The result card is a 22px card with a serif headline.

### Circuit (A–D): arc colours unchanged
- **A · Instrument dial:**
  - The "machined" bezel is now a flat printed dial on a warm-white face.
  - Caps are warm white with a soft flat shadow; lit caps are charcoal instead of navy.
  - The side heading is DM Serif.
- **B · String chords:**
  - Played chords are muted ink and the word being built is dashed ink. The blue chord was removed so it can't be confused with Arc 1.
  - Unlit letters now show a ring in their arc colour (previously white on white). Lit gold letters use ink text.
  - Legend tiles sit on warm white.
- **C · Quadrant keypad:**
  - Gold keys use ink letters for contrast.
  - Quadrant labels use the same darker arc shades as B's legend.
  - The map uses DM Sans and charcoal, with paper-coloured dividers.
- **D · Chain and coverage:**
  - Chain plates are charcoal.
  - The ring face says "NEXT / not Arc n" in a DM Sans label over a DM Serif line.
  - Gold matrix cells use ink text; "Coverage" is a serif heading.
  - The result card is 22px.

### Twin Hive (A–D): gold preserved
- **A · Twin cells:**
  - Neutral cells are warm white on a warm hairline; gold cells are flat (no gradient).
  - Gold entry letters are darkened to `#93700f` for contrast on white.
  - The progress line is serif.
- **B · Six-slot ledger:** Warm keycaps with gold first. Check chips are wash or soft green. The ledger is a 22px card with a serif "2 / 6"; the next slot is soft green.
- **C · The collection is the comb:** Warm empty cells, flat gold filled cells, and a green "next" cell. Round keys are flat. The heading is serif.
- **D · Split-core flower:**
  - Petals are warm white; the split core is flat gold with ink letters.
  - The collection heading is serif with a sans points count.
  - The footer now says "ink" (not "grey") for the first three ticks.

### Cipher · A · Typeset message
- The message sits in a warm 22px card, and the clue is DM Serif.
- The **selected** code is ink, its other occurrences are soft home green, and givens are printed in green. The rule text now says "Green letters are given" (was "Teal").
- The assignment panel and alphabet are warm.

### Logic Lattice · A · Line counters (parked)
- Warm cells and lesson strip; black squares stay charcoal.
- Fixed-given diamonds are green; the selected-line band is translucent green.
- The guide card is 22px with a serif title and serif tally numerals.

### Syntax Siege · A · Light firing range
- The range is a warm 22px card.
- The core is a flat warm well with a solid home-green centre (previously a glossy blue orb).
- The enemy diamond's facets are warm charcoal instead of navy, with the red outline kept. The drop shadow was removed.
- HUD numbers are DM Serif, and the rack and word tray are warm.

### Pattern Prism · A · Signal decoder
- The "anodised machined" pucks are now **flat, matte pucks**: one solid signal colour, a darker rim, a printed warm-white shape and a warm-white notch, with no radial gloss or highlight ring.
- The rail is a warm-white 22px card with shallow wells.
- Section headings are serif. The decoder table, choice cards and the "06" prediction column are warm or soft green.

### Territory Tactics · A · Survey table
- The goal card is 22px, with a DM Serif headline and the italic green "exactly 3" in serif.
- The board frame is warm white.
- Hexes are warm well and white on a warm hairline. Blue stones and amber targets are flattened, with no gloss.
- The inspected group is charcoal and openings are home green.
- The mini lesson uses the same green openings and warm hexes.

## Unsupported prototype controls (stated honestly)

Every page footer now ends with a "Prototype wiring" sentence. The manifest's `interaction` text has been corrected where it claimed more than the HTML does.

Not wired on any page:
- Daily/Practice (Today/Practice) switch
- Favourite/Hide only toggle their pressed state
- How to play
- Hints and reveals

Main gaps per game:

| Game | What is not wired |
|---|---|
| Cairn | Physical typing, Enter, Shuffle, Delete, Skip |
| Morph | Typing a word (A–C), arrow keys on a dial (B), Check/Undo/Restart |
| Tangle | Dragging (A–C), Check, Clue, Enter/Esc shortcuts (D) |
| Hunch | All guess entry, on-screen and physical (C's notes do work) |
| Circuit | Typing letters, Play word, Undo/Restart |
| Twin Hive | Physical typing (A, C, D), Add word |
| Siege | Damage, waves, HP, clock countdown, untimed assist |
| Territory | Hints and reveal only; the capture preview itself is local logic, not the shipped engine |

## Manifest edits (`game-proposals.json`)

All keys, slugs, ids, titles and `mockup` filenames are unchanged. I edited summary and interaction text that described old materials or overstated wiring:
- Cairn: B, C and D summaries; A and D interaction and motion.
- Morph: A summary and interaction; B summary, layout, interaction and motion; C interaction.
- Tangle: A summary and interaction; B interaction; C summary and motion; D interaction.
- Hunch: interaction for A, B, C and D.
- Circuit: A summary and interaction; B interaction; C accessibility.
- Twin Hive: A interaction; D summary and interaction.
- Siege: summary and interaction.
- Prism: summary.

Recommendations are unchanged.

## Known limits
- Nothing was rendered. Wrapping fixes rely on font-width estimates for DM Sans and DM Serif:
  - flex-wrap was added on card headers, `.await`, `.stones` and the bonus summary;
  - `min-width: 0` was added on matrix, legend and score cells;
  - the header hides the wordmark text below 360px.
- Light-on-colour pairs that were not changed and should be checked in QA:
  - Circuit A's gold "ARC 3" ring label on the white face;
  - white letters on Circuit's green arc keys.
- Hover and press motions remain small transforms with flat edges; reduced-motion users get none.
