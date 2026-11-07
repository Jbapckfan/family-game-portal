# Team 01 · Revision 2: fit the live home theme

Opus 5.5 · 2026-11-06. James's feedback: *"these don't follow the basic style of the overall website… follow the overall theme of the website/background and colors we are using on the main page."*

**What I worked from:**
- `input/REVISION-02.md`
- `input/live-theme/home-top-1440.png` and `home-top-393.png` (I viewed both)
- `computed.json`, `0-styles.css` and `1-identities.css` (live identity accents)

**What this pass did and did not do:**
- It edited the 29 existing concepts in place. Nothing was regenerated.
- No game rules, difficulty, controls, keyboard/touch handlers or filenames changed.
- I did not open a browser or run anything. Rendering and 393/1440 QA are the parent's job.

## Shared changes (every page)

### Linking and header
- **Stylesheet order.** `../assets/site-theme.css` is linked **last** in `<head>` on all 29 pages, after `studio.css` and the inline style. I did not edit that shared file. Its rules supply:
  - body `#f6f3ec` with no gradient, and DM Sans text;
  - DM Serif on `h1`/`h2`/`.brand`;
  - green focus rings.
- **Header.** All 29 pages now share the same restrained masthead:
  - back chevron, then the supplied `assets/brand.svg` logo, then the wordmark "Alford **Daily**" in DM Serif with *Daily* in home green;
  - icon buttons on the right;
  - a hairline rule underneath, like the home masthead.
- **Favorite star.** It fills green instead of yellow.

### `studio.css` (rewritten)
- **Old tokens remapped onto `--ad-*`:**
  - paper `--bg`/`--frame`;
  - warm white `--surface`;
  - charcoal `--ink`, `--muted`, `--line`.
- **New warm neutrals:** `--well`, `--well2`, `--edge`, `--dash`, `--faint`.
- **Page frame removed.** The old blue-grey `.app` frame (`#e8eef4`/`#f5f8fb` with a bordered card) is gone. The game sits directly on paper, like the home page.
- **Type.** `--sans`, `--display` and `--mono` now all resolve to DM Sans, so system and monospace fonts are gone. Board letters and numerals stay sans; headings are DM Serif.
- **Header and labels:**
  - Game `h1` is DM Serif at 30–42px.
  - Meta lines and kickers use the home's small tracked-caps label style.
- **Controls follow the home's pill vocabulary:**
  - `.btn` is a warm-white pill.
  - `.btn.pri` is an ink pill with paper text, like the home's primary action.
  - The legacy `.btn.blue` (royal-blue Scan) is now the home green.
  - The Daily/Practice segment is a paper pill.
- **Semantic colours are kept but localized:**
  - Blue is now the live Switchpath identity blue `#355fa7`, not royal `#1c5fc4`.
  - Teal is the live Inbetween teal `#247a7e`.
  - Green is the home green `#376c58`; it marks solved states.
  - Red and amber stay for errors and experiments.
- **Blue across the set** means "higher" (Switchpath), "noun" (Second Sense), or "the piece you are holding" (other games). This keeps James's approved Switchpath blue/teal and Inbetween blue drag preview.
- **Lighter materials.** Cards and panels are warm white with a 1px `--line` edge, 16–22px corners and the flat `--ad-shadow`. Big blurred navy shadows, metallic gradients and thick stacked edges are gone. Tactile tiles keep a 2–3px warm edge.
- **Wrapping fixes for the real fonts:**
  - Large DM Sans uppercase sizes and tracking are trimmed in places where long words (APPEARANCE, LIMESTONE, SANDSTONE) would overflow narrow slots at 393px.
  - Weights of 750, 780 and 800 are normalised to 700, the bundled bold.
  - DM Serif is set at 400 everywhere; it has no bold, so this avoids faux-bold rendering.

## Per-game changes

| Page | Changes |
|---|---|
| **Switchpath A** | Rule-coloured frame kept (blue/teal), with a flat shadow. Cell faces moved from cold grey to warm `--well`. Side panels are warm-white 22px cards with DM Serif headings. The rules panel now says arrow and ⌫ shortcuts are **not wired** (Tab and Enter work). |
| Switchpath B | Trace and fact cards are warm white. Plot labels and dots are warm grey. Board cells are warm white with paper for visited cells. Current cell stays charcoal. |
| Switchpath C | Board has rounded 14px corners. Pad keys have a 3px warm edge instead of a 4px blue-grey one. The core's glow is replaced by a flat wash ring. |
| Switchpath D | Switch moved to a paper pill track. Sheet is a warm-white card with warm dot grid. Numerals in DM Serif 400; the 600/700 faux-bold is gone. |
| Counterpart A | Slots and bank tiles are warm. Sticky tray is paper with no heavy shadow. "as" is in DM Serif italic. |
| **Counterpart B** | Bridge card is warm white. Word size runs 18–34px, with the slot font trimmed so APPEARANCE fits at 393px. Word bank heading is DM Serif. |
| Counterpart C | Blue-grey bank panel is now a paper well. Labels have a warm grip. Table is a warm-white card. Per-row Check is an ink pill. |
| Counterpart D | Sentence in DM Serif 400; keys in DM Sans 700 at .9em. Rail and keys are warm. The Enter chip on the ink Check pill is restyled. |
| **Shortlist A** | Evidence cards and dock are warm white. Keyboard keys are paper. Confirm bar stays ink, with paper text. Scan button is green. |
| Shortlist B | Letter cells use DM Sans; lens stays blue (1st letter) and teal (2nd). Lens toggle is green because it is a setting. Evidence panel is a warm card. |
| Shortlist C | Trays are warm-white cards; the KEEP chip is an ink pill. The navy drop shadow is removed. Tray headings wrap cleanly at 393px. |
| Shortlist D | Timeline and letter inputs are warm; input focus is green. Shelf has a warm edge. The pick slot is a 22px card. The **Show letter grid** link already says it is not wired; unchanged. |
| **Second Sense A** | Column headings are DM Serif ("Noun meanings") with n./v. badges in DM Serif italic. Plate is a warm card. Word-field focus is green so it is not confused with the noun blue. **"Check ↵" relabelled "Check"** because Enter is not bound. |
| Second Sense B | Page is a warm-white 22px card instead of a thin white sheet with a navy shadow. Headword and solved entries in DM Serif 400. Column headings are DM Serif. |
| Second Sense C | **Dark ink hub replaced** by a warm-white hub with a 2px ink rule and an ink Check pill. Wires and blue/teal chips kept. **"Check ↵" relabelled "Check"**. |
| Second Sense D | Word field is a warm card that gets a green rule on focus. Tags, steps and radio list are warm. Group headings are DM Serif. |
| Tradeoff A | Raised tile kept, as a warm-white tile with a 3px warm edge instead of a blue-grey gradient. Lifted tile is blue with a soft shadow. |
| Tradeoff B | Tiles warm. Sticky trade tray is paper, with no heavy shadow. Blue lift block kept. |
| **Tradeoff C** | Five-layer metallic block stack replaced with a two-step warm edge. Groove is a soft paper inset. Lift is 6px (was 9px). Solved blocks seat flat in green. Amber over-par segments unchanged; still an open decision. |
| Tradeoff D | Mode pills: ink when on, warm white when off. Rail and tiles warm; rail focus is green. Bonus note uses the warm amber card. |
| **Inbetween A** | Pairs, gaps and guide are warm; the approved blue held/drag state and the mirrored guide are kept. Guide text now says arrow-key gap movement is **proposed, not wired**. |
| Inbetween B | Letter tiles and pair tiles warm. Sticky dock is paper. Blue spread-in preview kept. |
| Inbetween C | Focus card warm. Clue strength toggle is a paper pill with ink selection. Clue is DM Serif. Gaps are warm dashed outlines. |
| Inbetween D | Blue-grey domino tray is now a warm inset. Dominoes are warm with a flat edge. Slabs are warm cards. **Engraving reduced** so letters are full charcoal on a recessed paper line, a readability gain. |
| Ringcount A | Arc colours are now four live identity accents: blue `#355fa7`, teal `#247a7e`, ochre `#996519`, clay `#b2573f`. They replace the royal blue, navy and dark teal set and stay mutually distinct. The "16" target is in DM Serif. SVG sums use DM Sans. Cuts are charcoal. |
| Sideways A | Metal cylinder gradient became a soft paper roll. Reading window is teal. Turn keys warm. Green still appears only after Check. |
| Quartet A | Navy/teal solved slabs became light identity washes (blue, teal, ochre, clay) with a coloured rule and dark text. Socket tray is a warm inset. |
| Spare A | Axis card warm; context sentence in DM Serif. Placed words are ink pills. Bank, bay and check card warm. |
| Rung A | Ladder rails warm. Rungs are warm-white cards. The START rung stays charcoal. Tag column widened to 42px so "TARGET" no longer breaks in DM Sans at 393px. |

## Honest limits
- **Not visually verified.** I edited CSS by reading the markup, without rendering. The likeliest places to check at 393px:
  - Counterpart B's slots with APPEARANCE;
  - Quartet's sockets with LIMESTONE or SANDSTONE;
  - Inbetween D's slab line at 640–899px. Two slabs per row are tight; this was pre-existing.
- **Still unwired prototype controls.** These remain message-only and are labelled "Not wired in this prototype" on the page:
  - Hints and Nudges everywhere;
  - Check in Counterpart, Second Sense and Spare;
  - Scan and Final pick in Shortlist;
  - Clarify in Spare;
  - Switchpath A and Inbetween A arrow keys;
  - Shortlist D letter grid.
- **Heading sizes.** `site-theme.css` forces every `h2` to DM Serif 400. Small uppercase label `h2`s were converted to sentence-case serif headings, so a few headings are now larger than before.
- **Blue as a selection colour.** Using the Switchpath identity blue for "held/selected" outside Switchpath and Inbetween is my call, for consistency across the set. If James wants each game's own identity accent for selection, swap `--blue` per page.
- **Sharing.** Switchpath D's share card is the only drawn one, restyled and still marked illustrative.
