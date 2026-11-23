# Arcade-table, round 2 (from Claude's real-browser captures) + visual polish

I ran your capture outside the sandbox: `output/screen-fit/arcade-verify/<id>/sheet-start.png`,
`sheet-play.png` and `report.json`. Open the sheets and look. Each sheet shows, left to right,
phone 393x852, iPad landscape 1180x820, laptop 1440x900, iPad portrait 820x1180 (the portrait
one is drawn smaller). Same rules as round 1; other Sol jobs are still editing other games in
this folder, so touch only your eight games, their shot files and your report.

Good: no page errors anywhere, no horizontal overflow, page scroll 0 at every size, audio muted,
Menu visible. ERS, Speed, Zoo Conquest, Dots & Boxes 3D and Nexus Defense now give the play area
most of the screen on iPad and laptop.

## Fix first (layout bugs visible in the captures)

1. **ERS (play):** on iPad landscape, laptop and iPad portrait the face-up pile card sits on top
   of the SLAP! button and covers its label; on phone and iPad portrait the pile card also
   overlaps the "Slap radar" box. The pile, the SLAP! button and the side panels must never
   overlap; SLAP! must be fully visible and tappable at every size.
2. **Speed (play, phone):** the fifth hand card and the "First to ZERO" label are cut off at the
   right edge, and the cards are small with a large empty band above the hand. Fit all five hand
   cards and both side labels inside the phone width, larger.
3. **Particle Conquest (play, phone and iPad portrait):** the planet legend, the ability buttons,
   the 25/50/75/ALL buttons, the minimap and the help text are stacked on top of each other at
   the bottom; "Level 1 · EASY · CLASSIC" overlaps a planet; there is a small icon jammed against
   the Menu link. Give the HUD its own non-overlapping bands (collapse the legend behind a small
   toggle on phone) and keep planets out from under it.
4. **Cube Jumper (play):** the level title card ("City 09 · Neon Metro / AWAKENING") collides
   with the score/attempt/music text at top right on phone, and the pause and skin buttons cover
   the score digits on iPad and laptop. On iPad portrait the playfield is a thin band with a large
   empty area below; frame the run so it uses the portrait height (camera zoom or vertical
   framing), and keep the progress readout readable (it is tiny).
5. **Snowman Siege (play):** on phone the playfield ends around 60% of the way down with empty
   space below; on iPad landscape and laptop it is a narrow portrait column with flat dark
   bars either side. Fill the phone height. On landscape, either widen the field or make the side
   areas part of the winter scene (not flat fill), keeping the game's aim and difficulty fair.
6. **Dots & Boxes 3D (phone):** the last control button ("Sound ON") is cut off at the right
   edge. Fit the control rows inside the width.
7. **Nexus Defense (start, iPad portrait):** the map cards are small with a large empty area
   below them. Use the height.

## Fix your shot steps

- **Zoo Conquest play:** `clickText: "🐢 Turtles"` times out at all four sizes, so no play capture
  exists. Use a selector that matches the real button.
- **Speed play:** the iPad landscape run failed your check with `No human card played` (no
  playable card within your retry window). Make the step reliable, for example by waiting until
  a card is playable or by flipping, without changing the game's rules.

## Then polish

After the fixes, apply `polish.md` (the next section of this brief) to all eight games. Cards in
ERS and Speed should read as real playing cards (card stock, crisp printed indices, a real-looking
back); keep the neon table identity.

Append a "Round 2" section to `arcade-table-report.md`: what you fixed, what you polished per
game, and what you would still change. Do not try the browser capture again; I will run it.
