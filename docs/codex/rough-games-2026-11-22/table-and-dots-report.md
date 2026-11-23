# Card tables and Dots controls

November 22, 2026. Saved changes only; no git writes, app/window/browser launches, capture commands, servers, installs or external messages. Read `shared.md`, `common.md`, `polish.md` and the game pitfalls. Reviewed the existing `output/screen-fit/final/` play sheets for all three games and the card-game setup sheets. **Post-change rendering and viewport measurements are pending Claude's capture.**

## ERS

The supplied captures show realistic cards on nearly black purple felt. Added a local stylesheet that exposes the existing felt through a brighter green baize treatment and a soft warm pool of light. An original photographic walnut rail, beveled edges and inset felt shadows frame the existing play area. Face Challenge, Slap Radar, counts, captions and status now use dark green/brass placards, with high-contrast text. Cards and decks have tighter contact shadows under their paper edges. The existing large orange SLAP button keeps its size and behavior, with a more physical rim and contact shadow.

Card dimensions, table grid tracks, gaps, padding, dealing, slap rules, timing and bot code are unchanged. No game JavaScript was edited. The original temporary slap/turn signals remain; contact shadows also remain on the ready deck. Labels use at least 14px in the new table styles. No continuous material animation was added.

Still to judge from the new captures: felt exposure, the perceived thickness of the narrow phone rail, and shadow strength beneath stacked cards. There is no after-image or measured fit claim from this session.

## Speed

The supplied captures show realistic cards floating over dark navy/purple baize. Added a lit blue-green felt bed with a soft cool light pool and an original cognac leather padded rail with stitching and bevel highlights. Flip, First to Zero, counts, hand headings and status are styled as matching inset table markers. Added paper/deck contact shadows without changing any card dimensions or the current layout.

Neon, Sunset and Arcade skin choices still use their existing handlers and saved values. The new felt, light pool and chip palette follow each skin: cool blue-green, wine/rose and green respectively. Existing logo/action accents remain driven by the original skin variables. The new styles add no legal-card highlighting, dimming or advance move hints; existing selection/drag feedback is retained. All Speed rules, delays, Chill behavior, deadlock timer and bot logic remain byte-for-byte unchanged.

Still to judge from the new captures: rail highlights, felt grain at phone scale, and the Sunset/Arcade appearance. The current in-play shot already makes two real moves and was left unchanged.

## Dots & Boxes 3D

The supplied phone and portrait-iPad captures have a two-row wall of secondary actions below the board, plus rotation/layer controls. At widths up to 900px, the closed layout now has only **New Game, Hint, Undo and Settings** in a four-button bottom row. Two player/score cards remain above the board. Difficulty, grid size, timer configuration, game mode, auto rotation, danger colors, Guided 2×2, Tactics, themes, sound, layer choices, rotation buttons and How to Play move into a settings sheet.

The controller moves the original DOM nodes into the sheet and restores them to marked original positions on wider screens. It does not clone buttons or replace their handlers. Laptop and landscape-iPad layouts retain their existing control arrangement. Phone and portrait-iPad reserve a larger board viewport; the existing camera fitting responds to its actual dimensions. Active player clocks remain beside the board, with extra space reserved when enabled. Guided instructions sit above the action row, with additional board clearance while active.

The sheet has 44px-or-larger controls and 14px-or-larger text, keyboard-operable choice options, a focus loop, Escape/Done/backdrop dismissal, and focus restoration. Opening another game modal closes the sheet without stealing that modal's focus. Background game panels become inert while it is open; the fixed Menu link stays usable above the sheet. Settings keyboard events do not trigger board rotation shortcuts. A brief entry transition respects reduced motion. The page remains fixed; a long settings sheet can scroll internally. **Actual page scroll, target rectangles, text wrapping and board coverage have not been measured in a browser here.**

### Preferences

The original Dots source had no `localStorage` preference record. To satisfy the requested persistence, the new UI controller uses the separate key `dots3d_controls_v1`. It stores only grid size, difficulty, game mode, theme, auto rotation, danger colors, mute, timer configuration/enabled state and layer visibility. It does not store scores, moves, edges, tutorial progress or campaign content. There is no existing save format to migrate or modify.

Restoration calls the existing game methods. The existing 500ms initial AI-mode delay is retained when restoring AI-vs-AI, with a guard against a stale callback after switching modes. Saved mute is applied before settings that can reset a match. Invalid/corrupt data falls back safely; blocked/full storage leaves the game usable with session-only settings. Moving controls or resizing does not reset their current state. Opening Settings does not pause bots or clocks.

Still to judge from Claude's capture: the closed phone and portrait-iPad board composition, long option labels, theme submenus, clock-on layout, guided overlay clearance, and focus/touch behavior on a physical device. The Node tests cover controller behavior, not CSS rendering or WebGL interaction.

## Assets and prompts

Two distinct original assets were generated with the built-in image tool; neither is a renamed copy of the other. Shipping images are **768 × 768 JPEG**, converted with the already-installed FFmpeg (`scale=768:768`, JPEG `-q:v 4`). No runtime image downloads or new libraries.

| Asset | Bytes | Exact prompt |
| --- | ---: | --- |
| `games/ers/walnut-rail.jpg` | 108,704 | `games/ers/walnut-rail.prompt.txt` |
| `games/speed-card-game/leather-rail.jpg` | 140,746 | `games/speed-card-game/leather-rail.prompt.txt` |
| **New image total** | **249,450** | Both under the 300KB aim and 600KB cap |

Walnut prompt requests an evenly lit overhead satin walnut material, fine horizontal grain, no objects, borders or branding. Leather prompt requests overhead fine-grained cognac leather, no objects, stitching, edges or branding; stitching and lighting are supplied in CSS. The `.prompt.txt` files preserve the complete requests and conversion details.

Both pre-existing `felt.jpg` files are unchanged, each 114,935 bytes. They were already identical shared material files before this pass; no new duplicate felt asset was created. Dots needs no new bitmap art for its controls.

## Checks run

- `node games/validate-ers.mjs` **passed**: 52 unique cards, six slap patterns, face challenges, 240 complete simulated matches including 20 full-deck games, card conservation and portal navigation.
- `node games/validate-speed-card-game.mjs` **passed**: 52 unique cards, 300 simulated races including 43 recycling races, three AI speeds and the existing timing/input safeguards.
- `node games/dots-and-boxes-3d-assets/validate-controls.mjs` **passed**: valid/invalid/corrupt/blocked storage; field restoration; stale AI callback guard; repeated original-node relocation; actual controller open/close, inert background, focus, keyboard isolation, Escape, backdrop and modal handoff; preference writes; live-clock placement; resize/disposal handling. This uses a small Node DOM/event fixture, not a browser.
- `node --check` **passed** for both new `.mjs` files and each game's existing inline script.
- Static checks **passed** for unique IDs, controller ID references, drawer placement outside the inert game container, and live clocks outside timer configuration.
- Byte comparisons against this checkout's HEAD confirmed all three existing inline game scripts and their outside dependency tags are unchanged. The three.js and Google Fonts tags were not modified.
- Shipping image dimensions verified by `ffprobe`; new CSS delimiters and shot JSON checked. `git diff --check` passed for this batch's files.
- New solid HUD/sheet text color pairs were calculated at **8.01:1 or higher**, above 4.5:1. This checks the specified opaque color pairs, not every final rendered/composited pixel or legacy menu state.

No browser capture was attempted. Dots' shot file now adds Settings-open and save/close shots on phone and portrait-iPad, including future Menu/target/font/page-overflow checks. Those assertions are prepared for Claude and have **not** run here. Speed and ERS shot files are unchanged.

Suggested capture for Claude (not executed):

```sh
node tools/screen-fit/capture.mjs --only ers,speed-card-game,dots-and-boxes-3d --out output/screen-fit/table-and-dots-after
```

## Files changed

- `games/ers.html`
- `games/ers/table.css`
- `games/ers/walnut-rail.jpg`
- `games/ers/walnut-rail.prompt.txt`
- `games/speed-card-game.html`
- `games/speed-card-game/table.css`
- `games/speed-card-game/leather-rail.jpg`
- `games/speed-card-game/leather-rail.prompt.txt`
- `games/dots-and-boxes-3d.html`
- `games/dots-and-boxes-3d-assets/controls.css`
- `games/dots-and-boxes-3d-assets/controls.mjs`
- `games/dots-and-boxes-3d-assets/validate-controls.mjs`
- `tools/screen-fit/shots/dots-and-boxes-3d.json`
- `docs/codex/rough-games-2026-11-22/table-and-dots-report.md`
