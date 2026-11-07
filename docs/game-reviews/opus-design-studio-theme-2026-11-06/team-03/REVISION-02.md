# Team 03 — Revision 2: live-home theme (Opus 5.5)

James said the first set "don't follow the basic style of the overall website". This revision re-skins all 29 existing team-03 concepts to match the live home page captured in `input/live-theme/`. The 29 compositions, controls, sample states, keyboard/touch behaviour and game rules are unchanged. No concept was regenerated, nothing was added to gameplay, and difficulty is untouched.

## What the home page measured as (and what every page now uses)
- Paper page `#f6f3ec` with no gradient. Warm-white cards `#fffefa`, fine line `#dcded8`, charcoal ink `#202c35`, muted `#5b666c`, green `#376c58`.
- DM Serif for the wordmark and headings, DM Sans for text and controls. Both load locally from `assets/fonts` through `site-theme.css`.
- Cards are flat with a 22 px radius, a 1 px line and the home's near-invisible `0 6px 0 #202c3505` shadow.

## Shared correction (applies to all 29 pages)
1. **`../assets/site-theme.css` is linked LAST in `<head>` on every page.** It sits after `studio.css` and after each page's inline `<style>`. I did not edit the shared file.
2. **`studio.css` was rewritten.** The old token names (`--bg`, `--paper`, `--ink`, `--accent`, `--line`, `--sans`, `--serif`, `--mono`…) now resolve to the shared `--ad-*` tokens, with literal fallbacks. Every inline rule that used them therefore moved from cool blue-grey and teal to paper, warm white, charcoal and green with no per-rule edit. Specific changes:
   - `--mono` now maps to DM Sans. Small labels read like the home eyebrows (uppercase, tracked, tabular figures) instead of system monospace.
   - Primary buttons are green. Secondary buttons are warm white with a line. Quiet buttons are green underlined links. Pressed chips and segments are charcoal, like the home creator filters.
   - The game title is DM Serif, 36–50 px. The kicker is a green 10 px eyebrow.
3. **Consistent game header.** The text link "← Alford Daily" is replaced on every page by a small back arrow, `assets/brand.svg` and the home wordmark "Alford **Daily**" (DM Serif, with "Daily" in green). Accessible name: "Back to Alford Daily". Below 420 px the logo and wordmark shrink. Below 350 px the wordmark is visually hidden and only the logo remains, so the Favorite/Hide chips still fit.
4. **Headings.** `site-theme.css` forces `h1`/`h2` to DM Serif, and `studio.css` adds `h3`. Each former small-caps monospace `h2`/`h3` (ledger, log, panel and rack headings) was restyled as a sentence-case DM Serif heading at 20–24 px. Their text was changed from ALL CAPS to sentence case. Clue and category headlines that were heavy system sans are now DM Serif 400. DM Serif has no bold face, so every remaining `600/800 … var(--serif)` was set to 400 to avoid synthetic bold.
5. **Materials.**
   - Removed: blue-grey trays and docks (`#dfe8ef`, `#e3ebf2`, `#d9e4ec`…), the navy window, radial-gradient "pebbles", metallic key gradients and long `rgba(14,34,50,…)` drop shadows.
   - Game pieces remain tactile but flat: warm-white tiles with a 1 px `#cfd2c9` edge and at most a 2–3 px flat bottom edge.
   - Quiet insets use `#efede5`, from the home progress-strip family.

## Semantic colour kept local (deliberately not blanket-recoloured)
- **Sprout:** every plant colour is still green (leaf `#245c48`/`#3f7d5f`, fresh soil segment `#a5d48e`). Only the backdrops, wires and pots changed. Pots are now a pale clay that echoes the home `--clay`, applied only to the pot object.
- **Memory Maze:** study route is green, retraced squares are charcoal, walls are hatched or solid ink, and wrong taps get a clay tint.
- **Trail:** legal-next is a dashed green outline, the trail is charcoal, the last step is green and unreachable tiles are dimmed. Dimming is still paired with a dashed/edge cue, not colour alone.
- **Quadra D / Tangle / Dovetail C:** misses and knots use clay (`--warn` is now the home clay `#a45b42`).
- **Tangle threads:** the three hues are now teal-green `#39766f`, violet `#7054a1` and ochre `#94701c`, taken from the home "daily collection" emblems. They stay three distinct colours, but none is the old slate or royal blue.
- **Tic-Tac-Toe:** × (you) was royal blue `#1d5fa8` and is now charcoal. ○ (AI) is home green. They differ in lightness and symbol, not only hue.

## Per-game changes

| Page | Changes |
|---|---|
| **Trail A** Survey plate | Clue is now a DM Serif headline (17ch measure). The plate is a home card. Tiles are warm white. The readout's "next" cell uses a flat green underline instead of a gradient. The rule icon is recoloured. |
| **Trail B** Ink trace | Clue strip is DM Serif. Discs are warm white with a line ring, charcoal when selected and green for the last step. The sticky dock fades to solid paper instead of a blue gradient, and the dock tray is a home card. |
| **Trail C** Chart and ledger | Clue is DM Serif. The ledger is a 22 px home card with a serif "Route ledger" heading. Selected letters are green, unreachable letters are warm grey, and the chart grid is warm. |
| **Trail D** Keyed instrument | The navy window is replaced by a paper clue window with a serif clue and warm-white readout cells. Keycaps lose the gradients and long shadows and get a 3 px flat edge. Pressed keys are charcoal and reachable keys have a green edge. Legend swatches and two help strings ("green base edge", "clue window") were updated. |
| **Split A** The fork | Clues are DM Serif. The rack is a home card. Tiles are flat warm white. The status pill no longer wraps. |
| **Split B** Facing pages | Spread is a home card. Page numbers are DM Serif 400 and clues are serif. The blue dock is now a paper inset. Rack tiles are flat, and placed tiles show a dashed outline. The page-state label is right-aligned so it can wrap. |
| **Split C** Sorting tray | The blue recessed tray is now a paper inset, with an active lane in warm white and a green ring. Grooves are warm, and the "Set aside" hatch is warm (still visibly "not checked"). Blocks are flat. Clue cards are serif with a green active eyebrow. |
| **Split D** One line, one cut | Header clues are serif. The beam and check log are home cards, and the log heading is serif ("Checks · 0"). Also fixed: the clue font rule leaked into the small label spans, which would have rendered the "LEFT · WORD 1" and "0/6" labels at clue size. The labels can now wrap. |
| **Quadra A** Category masthead | "Kitchen verbs" is a DM Serif masthead of 46–82 px under a fine line with a green eyebrow. The heavy 6 px rule is gone. The tile grid is a home card. |
| **Quadra B** Composer and dimples | The dark category bar is now a soft-green (`#e0efea`) card with a serif category. The composer is a home card. The blue field is now a paper inset. Pebbles are flat round pieces and dimples are warm. The lock-info disc is green. |
| **Quadra C** Letter inventory | Category is serif. The view toggle copies the home segmented filter. Entry cells use DM Sans instead of monospace. Stack shadows are warm. |
| **Quadra D** Type case and ledger | Ledger is a home card with a serif category, and the line numbers are serif. Miss holes are warm and fill clay. The type case is a paper inset and the sorts are flat. Side panels use serif headings (Attempts / What counts / Help). |
| **Memory Maze A** Sticky instrument bar | The sticky bar is translucent paper. Phase pills are charcoal when on. The track is warm and the clock uses tabular DM Sans. The heading is serif and the board is a home card. "Study the route" is now the green primary button. |
| **Memory Maze B** Floor plan + rail | The plan is warm white with an ink frame. The rail is a home card. The vertical track and phone dock are warm, and the dock's heavy shadow is replaced by a fine line. The study cells use soft green. The primary button is green. |
| **Memory Maze C** Perimeter clock | Heading is serif. The frame base ring is warm and the inner board is a lined card. Pegs are warm, with a green study route and charcoal retraced squares. |
| **Memory Maze D** Chart and step tape | Tape is on paper with warm step cells. The prompt is serif. The graph paper has warm lines and the hatch is warm. The "+2s" tag sits on warm white. |
| **Dovetail A** Joinery column | Rule card and rows are warm. Given rows are charcoal, and their number labels are recoloured for contrast. |
| **Dovetail B** Seven joins | Lede is serif with a DM Sans subline. Join cards are warm and carried halves are warm grey. The entry field uses DM Sans with a green focus edge. |
| **Dovetail C** Chain table + keyboard | The table is a card with a charcoal top rule, and cells use DM Sans. The given row is a paper inset. The keyboard tray is warm, with flat keys and a green "Fit" key. The heading is serif. |
| **Dovetail D** Spotlight | The spotlight is a green-edged home card. The map bars are warm. The focus label is smaller so "ROW n · n LETTERS · TAP TO TYPE" fits at 393 px. |
| **Sprout A** Espalier | The plant sits on a warm-white card with no blue gradient. Wires, anchors and the future guide are warm grey. The pot is pale clay. The panel is a card with serif rack headings. |
| **Sprout B** Rosette | The bed is warm white with a warm outer ring and no inset shadow. Ring guides are warm. The panel is a card with serif headings. |
| **Sprout C** Blade fan | The scene is a warm-white card. The pot and rim are pale clay and future blades are warm. Tray headings are serif. |
| **Sprout D** Trailing planter | The planter is pale clay with a flat edge. The soil bed is earth-toned and the pebbles are flat. The future vines are warm. The panel is a card with a serif heading. |
| **Splice A** Splicing bench | The bench is a home card with a green eyebrow. Sockets and strips are warm white, and the selected strip is charcoal. The readout uses DM Sans and can break long words. "Spliced words" is a serif heading. |
| **Tangle A** One cord, three threads | Thread hues come from the home emblem palette. The cord box is a home card with a warm cord line. Beads are flat warm white and charcoal when selected. Outcome cards are warm. The knot result is a clay card with a serif heading. |
| **Keystone A** Wedge and joins | The wedge is the brand-mark stone `#e9e3d5`. Arches use a charcoal active state. Join rows are warm and the hidden-row hatch is warm, with a serif "Hidden clue" label. The phone keyboard tray is warm with a green Enter key. |
| **Tumbler A** Range columns | The lock is a paper inset. Range bands are green and the tracks are warm white. The Fresh/After toggle uses the home segmented filter. The history and keyboard are warm, with a green "Turn" key. |
| **Tic-Tac-Toe A** Route table | The macro board is a paper inset with warm-white minis. × is charcoal and ○ is green. The detail panel is a home card with a serif heading. The AI-level toggle uses the home segmented style. |

## Text wrapping with the real fonts
DM Serif Display is narrower than the old 800-weight system sans, so large headlines generally gain room. I made the following changes for the actual fonts. They are calculated by hand, not measured in a browser.
- Small labels that used monospace now use tracked DM Sans and were reduced to 10 px where they shared a row. Affected: Split D headers, Dovetail D focus label, Maze A phase pills, Quadra C misses.
- Flex rows with two labels got `gap` plus `flex-wrap` or right-alignment so they wrap cleanly rather than overflow. Affected: Split B page state, Split C lane head, Split D headers, Trail D readout meta, Maze D tape.
- `.row-actions .btn` is now `flex:1 1 auto` with 14 px side padding, so long labels like "Check · 6 to go" get width instead of overflowing equal thirds.
- Quiet link-buttons in Sprout, Quadra and Dovetail have reduced side padding so their three links fit on two lines at 393 px.
- Segmented toggles use `white-space:nowrap`. Splice's readout and the game title allow `overflow-wrap:anywhere` as a last resort.

## Prototype controls that are not wired
These are visual placeholders and do nothing when pressed. The earlier NOTES said such buttons "only show prototype messages", which is wrong for these:
- **Every page:** the "?" How-to-play button and the brand/back link (`href="#"`).
- **Trail A, Trail D, Quadra A, Maze A, Dovetail A:** "Reveal solution…".
- **Quadra A:** "A little hint". **Quadra D:** "A little hint". **Dovetail A:** "Reveal a letter".
- **Sprout A–D:** "Undo growth", "Restart" and "Which letter? · 1 wilt".
- **Splice A:** "Show a safe splice". **Tangle A:** "Loose end hint".
- **Favorite / Hide:** toggle locally in the page only. Nothing is stored. Feedback buttons only reveal an explanatory note and send nothing.

## Status
- I did **not** open, render, screenshot or measure any page. All values above come from reading the CSS. The parent owns browser verification, in particular:
  - computed body background `rgb(246,243,236)` and DM Sans;
  - computed DM Serif on headings;
  - 393 px and 1440 px layouts.
- No production files, shared assets, network requests, commands or new dependencies were involved.
