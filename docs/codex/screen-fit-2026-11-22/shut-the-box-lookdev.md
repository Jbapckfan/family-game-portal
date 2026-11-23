# Shut the Box look-dev frames (pictures only, no code)

James wants Shut the Box rebuilt with "an actual shut the box visual" that shows "the dice being
thrown into it", filling the screen. Before anything is built, he picks a direction from
image-model frames. Your job here is only those frames.

Current game for reference: `games/shut-the-box.html` (flat dark-neon UI; default variant
"Modern 1-12": tiles 1-12, two dice, 1-4 players, AI opponents). Baseline screenshot:
`output/screen-fit/baseline/shut-the-box/sheet-play.png`.

## Make three frames with your built-in image generation

Each frame is a landscape full-screen game view as it would look on an iPad in the middle of
play. His bar is photo-real, like a real object photographed on a table, not clip art:

- A real wooden Shut the Box: a hinged-lid or open tray box with a row of numbered flip tiles
  1-12 along the back edge, some tiles already flipped down, felt-lined rolling tray in front.
- Two real dice caught mid-throw, tumbling into the felt tray with slight motion blur and soft
  contact shadows.
- Minimal game UI layered on top, small and tasteful: a "Menu" button top-left, whose-turn chip,
  player score chips, a "Roll" button. No other text, no logos, no brand names.
- The box should fill most of the screen.

Three distinct directions:
1. `frame-1-walnut-green.png`: classic walnut box, green felt, warm pub-table lighting.
2. `frame-2-maple-blue.png`: light maple, deep blue felt, bright family-game-night daylight.
3. `frame-3-ebony-burgundy.png`: dark ebony with brass numerals, burgundy felt, dramatic
   low-key lighting.

## Output

- Save the three PNGs in `output/look-dev/shut-the-box-2026-11-22/`, plus `README.md` there with
  the exact prompt used for each frame and the image's pixel size.
- **Do not open any app, window or browser. Save files only.**
- Do not edit, create or delete any other file in the repo. No git commands that write.
- If image generation is unavailable to you, write that in the README and stop; do not
  substitute code-drawn or SVG art.
