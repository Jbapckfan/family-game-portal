# Team 03 — design notes (Opus 5.5, game UI)

These are design proposals for James's review. Nothing here has been approved, and nothing changes production.

> **Revision 2 (2026-11-06):** all 29 pages were re-skinned to the live home theme: paper, warm white, charcoal and green; DM Serif and DM Sans; the brand-mark header; and `../assets/site-theme.css` linked last. Compositions, controls and rules are unchanged. Per-game changes, colour decisions and a corrected list of unwired controls are in **`REVISION-02.md`**, which supersedes any styling statements below.

## What is in this folder
- `game-proposals.json` covers all 11 assigned games. The six keepers (Trail, Split, Quadra, Memory Maze, Dovetail, Sprout) have designs A–D each. The five others (Splice, Tangle (interleaved words), Keystone, Tumbler, Tic-Tac-Toe) have design A each.
- There are 29 standalone mockups: `trail-A…D`, `split-A…D`, `quadra-A…D`, `maze-A…D`, `dovetail-A…D`, `sprout-A…D`, `splice-A`, `tangle-A`, `keystone-A`, `tumbler-A`, `tictactoe-A`.
- `studio.css` and `studio.js` are a shared frame used only by team-03. It covers the brand/back header, local Favorite/Hide toggles, the help button and a footer that shows where feedback lives without sending anything. Since Revision 2, `studio.css` maps its tokens onto the shared `--ad-*` home tokens. Each mockup keeps its own inline composition and game-specific colour.
- Each mockup is labelled as a concept in a strip *above* the product frame. No model or provider names appear inside the product UI, so the "Developed by …" credit lines from the current pages were removed from the frames. Icons load from `../assets/icons/SLUG.svg` and the brand mark from `../assets/brand.svg`. The DM Serif and DM Sans fonts load locally from `../assets/fonts` through `../assets/site-theme.css`. There are no network requests.

## Recommendations
| Game | Pick | Why |
|---|---|---|
| Trail | **A Survey plate** | Puts the clue first, shows legal next tiles in place, and makes the 9/9 check obvious. D (keycaps, now in paper and warm white rather than a navy window) is the more tactile option. |
| Split | **A The fork** | ↑/↓ match the screen layout, and "4 stay behind" is always visible. D's check log is worth adding later if attempt history is available. |
| Quadra | **A Category masthead** | The category (the thing James liked) becomes the hero, and the duplicate text box goes away. |
| Memory Maze | **A Sticky instrument bar** | Directly fixes the scrolled-away timer. C (perimeter clock) is the most elegant alternative. |
| Dovetail | **A Joinery column** | Shows the joined word live between rows, which explains the rule without a paragraph. |
| Sprout | **A Espalier** | Each accepted word *is* a branch tier, read horizontally. The soil letter is a fresh segment, and the next word fills a dashed branch on the plant. I suggest James compare A and D live. |
| Splice | A Splicing bench | States the "every half keeps a partner" rule on the bench and explains unfamiliar accepted words. |
| Tangle (interleaved) | A One cord, three threads | Shows what remains after a pull and why PEPPY-type pulls tie a knot. |
| Keystone | A Wedge and joins | Plain-language inverse scoring, plus live before/after joins for each visible clue. |
| Tumbler | A Range columns | Makes the alphabetical range the visible identity instead of a Wordle-like grid. |
| Tic-Tac-Toe | A Route table | Brings the only dark page into the shared light frame and keeps the route preview. |

### Sprout, candidly
James rejected every option that put words *beside* or *on top of* the plant, and the recent letter-leaf and word-vine previews. All four new concepts make the accepted words the structure itself:
- **A Espalier:** horizontal tiers on trellis wires.
- **B Rosette:** concentric leaf rings seen from above.
- **C Blade fan:** upright blades read from tip to base.
- **D Trailing planter:** vines hang from a pot whose soil is the soil rack.

In each one the next word is built in place as a dashed piece of plant, and the soil letter stays visibly marked after growth.

I have not seen the rejected "B and C" previews, only their descriptions. Espalier is related to "letter branches", although it is symmetric, wire-guided and uses solid segments, so James should compare it directly. Rosette is the boldest form but the hardest to read.

### Optional mechanical or difficulty experiments (separate from the core UI)
- **Trail A/B/D:** highlighting legal next tiles lowers the adjacency bookkeeping. It could become a setting if difficulty slips.
- **Split C:** the "Set aside" shelf is a planning aid that is never checked.
- **Split D / Quadra D:** both need stored attempt history.
- **Quadra C:** A–Z stacks may make the puzzle easier, so keep board order as the default.
- **Dovetail A/B/D and Keystone:** the live join previews are plain concatenation, not validation.
- **Tangle:** "highlight the other copies that work" needs engine output.
- **Harder bonus rounds:** if wanted, these should be optional extras after the daily solve, such as a second Trail board or a Quadra round with one decoy tile, and never mandatory. I have not designed or built them here.

## Facts I could not establish from the supplied source
- No `puzzles.mjs` or `engine.mjs` was supplied, so I do not know today's answers. The mockups avoid showing them:
  - **Trail:** the sample path F→A→T is only a partial path chosen for illustration.
  - **Split:** starts empty.
  - **Quadra:** shows partial selections only.
  - **Dovetail:** starts empty.
  - **Splice:** starts with FRESH selected as the first half.
- **Memory Maze:** the 8-square route and blocked squares are illustrative. They match the screenshot's S and ◇ positions; nothing else about them comes from the game.
- **Sprout:** the grown words ALLY and RALLY come from my reading of the seed ALL and the soil M N O R Y. I did not check them against the game's dictionary, and the rest of the path is not shown.
- **Tumbler:** the "after 1 guess" state uses an invented hidden word (MOIST) to compute the arrows. It is labelled as illustrative.
- **Tic-Tac-Toe:** the sample position is four legal moves I constructed. The AI is not simulated.
- **Tangle:** the PEPPY knot message restates the BRIEF's description. It is not computed by the prototype.
- **Quadra:** I could not confirm whether unlisted words cost a miss. **Split:** I could not confirm whether attempt history is stored. **Splice:** I could not confirm whether the engine can explain *why* a word was accepted.
- `director/design-system.json` and `HANDOFF.md` did not exist when I worked, so these concepts follow the BRIEF's frame rules directly.

## Testing and inspection status
- I did **not** render these files in a browser, take screenshots, or run any checks.
- Phone widths of 320 and 393 px were checked by hand-calculating grid widths and adding narrow-width rules. Visual verification is still needed.
- Known exceptions to the 44 px target:
  - **Memory Maze:** 7×7 cells are about 38–41 px at 320 px wide, although the whole cell is the hit area.
  - **On-screen keyboards** (Dovetail C, Keystone, Tumbler): QWERTY keys are narrower than 44 px at 320 px wide, though 50 px tall.
  - **Tic-Tac-Toe:** mini-board cells on phones are display-only. Play happens in the large detail grid.
- None of the boards use pan or pinch-zoom. Tic-Tac-Toe uses selection-zoom (tap a board to open its detail view).
- Prototype buttons (Check, Grow, Lock, Splice, Pull, Place keystone, Turn) only show "prototype" messages. They never claim success. Feedback buttons explain where the real form lives and send nothing.
- **Correction (Revision 2):** several secondary controls are not wired at all and do nothing when pressed. These include the "?" help button, Reveal solution, some hint buttons, and Sprout's Undo growth / Restart / Which letter?. The full list is in `REVISION-02.md`.
- Revision 2 was also not rendered or inspected in a browser.

## Naming
The interleaved-bead game and the kept grid-word game are both called "Tangle". In the product frame I added the kicker "Interleaved words · three threads on one cord". A rename or subtitle is James's decision.
