
# Batch `shut-the-box`: rebuild the board as a real 3D wooden box with thrown dice

James: "shutbox did not take up enough of the screen. make an actual shutbox visual and show the
dice being thrown into it." His visual bar is photo-real. He cannot review looks today, so build
it fully; he will judge it later on the branch.

## Look

The approved direction is the image-model frame
`output/look-dev/shut-the-box-2026-11-22/frame-1-walnut-green.png` (walnut box, green felt, warm
pub-table light). Study it and the other two frames in that folder (`frame-2-maple-blue.png`,
`frame-3-ebony-burgundy.png`); their prompts are in the README there.

- Build walnut/green as the default. Put every material and lighting choice in one theme object,
  and offer all three looks as a "Table" choice in the existing settings (Walnut, Maple, Ebony),
  saved with the other settings. Missing or unknown saved value = Walnut.
- The box fills the screen at all four capture sizes: the play view is the box, like the frame,
  with the small UI chips on top (Menu, whose turn, player scores, Roll). Keep the 🏠 Menu link
  tappable above everything (house rule).
- Tiles: real hinged wooden flip tiles with carved/engraved numerals. Shut tiles flip down on
  their hinge (animated); selected tiles are clearly marked in a tasteful, legible way. Every
  open tile must stay tappable with a hit area at least 44 CSS px in both directions at every
  size. 12 tiles do not fit across a 393px phone at 44px each (12 x 44 = 528), so on narrow
  portrait screens change the camera/box orientation (for example tiles running down one side)
  rather than shrinking the targets. Support all four variants (Traditional 1-9, Modern 1-12,
  Double Box, Last Tile) with the right tile count and layout for each.
- Dice: two real-looking dice (rounded edges, inset pips) thrown into the felt tray from the
  player's side, tumbling, bouncing off the box walls and settling, with soft contact shadows.
  When a turn uses one die, throw one.
- Textures: make wood, felt and dice textures with your built-in image generation (no downloads,
  no network fetches at runtime). Save them under `games/shut-the-box-assets/` as WebP or JPEG,
  at most 2048px on a side, all assets together under 4 MB. Record each texture's image prompt in
  `games/shut-the-box-assets/README.md`.
- three.js: copy `games/lasers-3d/vendor/three.min.js` into `games/shut-the-box-assets/vendor/`
  and load it from there. No CDN. No physics library download; write a small dice simulation.

## Rules that must not change

- The game rules, scoring, AI, variants, rounds, players, stats, championships, timer, speed mode,
  How-to-Play, strategy coach, celebrations, sound toggle and saved data keys/formats all stay as
  they are. Change presentation only. Keep the page at `games/shut-the-box.html` (the portal links
  there; do not touch `index.html` or `games/shut-the-box-thumb.svg`).
- **The game's roll decides the result, never the animation.** Get the values from the existing
  roll logic first, then animate so each die comes to rest showing exactly that value (for
  example simulate, then orient the die so the right face ends on top). Expose a read-only
  `window.__stbDebug()` that returns the logical dice values and the face each die mesh shows on
  top after settling, and use it in your `play` shot (an `eval` step that throws if they differ).
- Speed mode and reduced motion: shorten or skip the throw (dice appear settled) with the same
  result. AI turns use the same throw.
- If WebGL is unavailable, fall back to a working 2D presentation of the same game (the current
  flat board is acceptable as the fallback).

## Performance

Cap device pixel ratio, size the renderer to the screen on resize/rotate, render only while
something is moving (idle board = no continuous redraw), pause when the page is hidden, and keep
shadows soft but cheap.

## Evidence

Shots in `tools/screen-fit/shots/shut-the-box.json`: `start`, `play` (start a game and roll,
captured after the dice settle, with the `__stbDebug` check), and `throw` (captured mid-throw).
Capture with `--only shut-the-box`, writing to `output/screen-fit/shut-the-box-after`. Also
capture the three Table looks at the tablet size into `output/screen-fit/shut-the-box-looks`.
Report to `docs/codex/screen-fit-2026-11-22/shut-the-box-report.md`, including the total asset
size and anything that does not yet match the frame.
