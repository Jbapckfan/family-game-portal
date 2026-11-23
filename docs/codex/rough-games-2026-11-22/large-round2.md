# Reflex Riot, round 2 (from Claude's muted capture)

Capture: `output/screen-fit/rough-large/reflex-riot/` (sheet-start.png, sheet-play.png, per-size
PNGs, report.json). No errors, scroll 0, no overflow, muted at all four sizes; the 14 tests pass.
The sticks read well now (lacquer, collars, contact shadow, short trails) and the console HUD
fits. Keep all of that.

Do not open any app, window or browser; save files only. No git writes. Touch only
`games/reflex-riot/*`, its shot file and your report.

1. **The floor is a grey slab.** At iPad and laptop size most of the screen is flat mid-grey
   graphite with a vignette; it lost the game's colour and reads like concrete. Keep the
   physical floor but make it feel like a lit arena: coloured light pooling onto the floor from
   the cyan/violet rails (tied to the active skin), a slightly deeper, richer base tone, and
   faint etched court markings (for example a centre ring and lane lines) at low contrast so
   they never compete with pieces, bombs or colour-word tokens. Check all four skins.
2. **iPad portrait start screen** (`tabletPortrait-start.png`, 820x1180). Pre-existing, still
   there: the tagline "CATCH. SMASH. SWIPE. SURVIVE." touches the bottom of "RIOT!"; the Records,
   Settings and How to Play buttons are short with small text; the bottom third of the screen is
   empty. Give the title and tagline clear separation, make every button at least 44 px tall
   with text at least 14 px, and let the menu use the available height (centre the whole stack
   vertically or scale it up). Check phone and the other sizes do not regress.
3. **Score popups** ("+110") draw through the stick that was just hit, so they read as a smudge
   on the piece. Draw them above pieces with a dark halo or offset them clear of the piece,
   without changing their timing or values.

Rerun the tests. Append a "Round 2" section to `large-report.md`. Do not try the browser
capture; I will run it.
