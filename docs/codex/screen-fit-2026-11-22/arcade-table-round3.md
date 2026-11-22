# Arcade-table, round 3 (small, from Claude's real-browser captures)

Round 2 is committed on the branch as 6dec559 after my capture
(`output/screen-fit/arcade-verify2/<id>/sheet-start.png`, `sheet-play.png`, per-size PNGs,
`report.json`). No page or step errors, page scroll 0, no horizontal overflow, audio muted at
every size. Verified fixed: ERS pile clear of SLAP and the side panels, Speed phone hand and
labels fit, real-looking cards, Particle Conquest HUD bands, Cube Jumper title/score, Dots & Boxes
phone controls, Nexus Defense portrait cards, Zoo and Speed play shots. ERS, Speed and Cube
Jumper validators pass. Keep all of that.

Do not open any app, window or browser; save files only. No git writes. Touch only these three
games, their shot files and your report.

1. **Snowman Siege: the play column shows its edges.** On iPad landscape and laptop
   (`laptop-play.png`) the panorama is lovely, but the play column is still visible as a
   rectangle: the sky inside it is darker than the sides, and the snow at the bottom is a lighter
   box with hard vertical edges at about x=383 and x=1057 on laptop. iPad portrait shows the same
   lighter ground box. Make the field part of one continuous scene: no hard edges and no change in
   sky or ground tone at the column boundary (a very soft edge is fine if the field needs to read
   as the aim area). Keep the field's playable width, aim and difficulty exactly as they are.
2. **Zoo Conquest: map labels collide (iPad landscape and laptop).** In `laptop-play.png`:
   "KANGAROO OUTBACK +2" is covered by the "Koala Grove" label; "Hedgehog Thicket" is hidden
   under a node ("Hedgeh…cket"); "Wolf Den" is clipped to "olf Den"; "Macaw Canopy" runs under
   the Toucan Forest node; "Snow Leopard Pass" touches the Lynx Woods badge. Every territory name
   and region title should be fully legible at these sizes (label placement, a dark halo or
   backing, region titles moved clear of nodes). Do not change adjacency or rules; move node
   positions only slightly if there is no other way. On phone the map is dense; make sure the
   tapped or selected territory's full name is always shown somewhere readable.
3. **Particle Conquest: planets overlap on phone.** In `phone-play.png` the red AI planet
   overlaps the green 22 and touches the cyan YOU planet and the grey 18, while the bands above
   and below the cluster are empty. Lay the map out over the whole available field with a clear
   minimum gap between planet edges at every size (check iPad portrait too, where the planets
   sit in a narrow column). Keep planet count, relative sizes, production, starting owners and
   difficulty unchanged.

Rerun any checks you have for these games. Append a "Round 3" section to
`arcade-table-report.md`. Do not try the browser capture; I will run it.
