# Large batch, round 2 (from Claude's real-browser captures) + visual polish

I ran your shots outside the sandbox: `output/screen-fit/large-verify/<id>/sheet-start.png`,
`sheet-play.png`, the per-size PNGs and `report.json`. Each sheet shows, left to right, phone
393x852, iPad landscape 1180x820, laptop 1440x900, iPad portrait 820x1180 (drawn smaller); open
the per-size PNG when you need detail. Same rules as round 1: other Sol jobs are editing other
games in this folder, so touch only your three games, their shot files and your report.

Good: no page errors, no step errors, page scroll 0 and no horizontal overflow at every size,
audio muted, Menu visible. Reflex Riot's start menu now fills the screen (largest panel 0.03 ->
0.22 on laptop, 0.06 -> 0.34 on phone) and its play screen is clean. Socktopus now fills iPad
landscape and laptop with the illustrated room scene, and its five unit cards fit at every size.

## Fix first

1. **Lasers 3D: the camera slides the board under the side panel.** In `play`, on iPad
   landscape and iPad portrait the board is shifted right and cut off at the right edge, so the
   laser emitter and the target ring are off screen; on laptop the ring is off screen too. The
   `start` capture frames the whole board correctly, so this happens after the shot calls
   `focusCell(solution[0], false)`. The game does the same thing for real players: the level-1
   tutorial calls `app.focusCell(a.solution[0], false)` at its `place` step
   (`src/learning.js:63`), and keyboard cursor moves call it too (`src/main.js:698`).
   `render.focusCell` (`src/render.js:470`) always pans the cell to the centre of the whole
   canvas rect, which includes the area under the side panel and the bottom tray, even when no
   zoom was requested and the whole board already fits. Fix it so that:
   - a non-zoom focus never moves a board that already fits (the cell is already visible), and
   - any pan centres within the visible board area (excluding the panel and tray) and is
     clamped so the emitter, target and board edges do not leave the view without a reason.
   Keep the phone behaviour James chose (cells never below 34 CSS px; the board starts zoomed
   and pans). Add a unit or DOM-free test for the clamp if the existing test setup allows it,
   and rerun `node validate-levels.mjs` and the node tests you can run.
2. **Lasers 3D play shot:** after the fix, the play shot should go through the real tutorial
   path (choose MIRROR in the tray, place it on the solution cell) and wait long enough after
   FIRE for the beam to finish, so the capture shows the whole board, the placed mirror and
   the fired beam. Do not call `focusCell` from the shot unless the game does.
3. **Socktopus title reads backwards in the HUD.** At every size the top bar shows the big
   "MISSING SOCK" with the small "REVENGE OF THE" underneath it, so it reads "Missing Sock,
   Revenge of the". The start card has it the right way round. Put "REVENGE OF THE" above
   "MISSING SOCK" in the HUD too.
4. **Socktopus mid-word wraps (phone):** the unit card label wraps as "Underpant / s Wizard",
   and the disabled "NOT LOADED TOWEL TROLL" button wraps awkwardly. No mid-word breaks: use a
   shorter display form, a smaller but still at least 14 px size, or allow the card to wrap at
   the space only.
5. **Socktopus portrait playfield (phone and iPad portrait):** landscape gets the full
   illustrated room behind the lanes, but phone and iPad portrait show a flat purple field with
   the drawer and washer art as hard-edged rectangular crops at each lane end. On iPad portrait
   most of the screen is that flat purple. Make portrait as finished as landscape: a portrait
   composition of the room scene (you may generate a portrait background with your built-in
   image generation, WebP, in the game's folder, prompt recorded beside it), with the lane-end
   art blended into the scene instead of cut out as boxes. Keep lane lengths and unit speeds
   fair (do not change difficulty).

## Then polish

Apply `polish.md` (next section of this brief) to all three games. Specific things I saw:

- **Reflex Riot:** on phone the falling sticks pass over the SCORE/TIME boxes; keep the HUD
  readable above the play objects (HUD drawn on top with its own backing). On iPad portrait the
  menu sits high with an empty lower third; centre the title and menu block vertically as a
  group. Records/Settings/How to play are much smaller than the three mode buttons on iPad
  portrait; keep them secondary but at least 14 px text.
- **Lasers 3D:** chrome and HUD only (do not change levels, rules or the solver). The tutorial
  line says "Choose MIRROR in the tray below." on iPad landscape and laptop where the tray is
  to the right; make the wording match where the tray actually is, without changing what the
  tutorial teaches. Disabled buttons (HINT, undo, redo, VIEW) are low contrast; keep them
  clearly disabled but legible.
- **Socktopus:** cards and lane art should keep the illustrated, finished look of the
  landscape scene; check press states on the unit cards and the MOM VOICE button.

Append a "Round 2" section to `large-report.md`: what you fixed, what you polished per game,
test and validator results, and what you would still change. Do not try the browser capture; I
will run it.
