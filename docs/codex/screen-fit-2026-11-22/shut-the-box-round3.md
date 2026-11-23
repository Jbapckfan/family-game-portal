# Shut the Box, round 3 (two small items from Claude's final capture)

Round 2 is committed (6c23535) and still holds in my final all-games capture
(`output/screen-fit/final/shut-the-box/`): no errors, muted, dice stay in the felt, settled dice
match the badge total, and the walnut box fills the screen at every size. Keep all of that.

Do not open any app, window or browser; save files only. No git writes. Touch only
`games/shut-the-box.html`, `games/shut-the-box-assets/*`, the shot file if needed, and your report.

1. **Hint bar while the dice are in the air.** In `laptop-throw.png` (captured about 150 ms after
   Roll Dice, dice still tumbling) the bar under the box reads "Tap tiles that add up to" with an
   empty badge circle. During a throw that hint is wrong (nothing can be tapped yet) and the empty
   badge looks broken. Find where that text survives into the rolling phase (rollDice/afterRoll/
   updateSelectionInfo and the tile-close path) and show nothing, or a short "Rolling…", until
   the dice settle; then the existing "Tap tiles that add up to [total]" appears as now. Check
   the AI turn and the one-die variant paths too. Do not change rules, timing of settle, or AI.
2. **Phone setup screen.** It still scrolls 201 px on phone (393x852). Get Start Game visible
   without scrolling on phone if you can do it without tap targets under 44 px or text under
   14 px (compact player rows, segmented rounds/variant). If it cannot fit, say why.

Rerun `node games/shut-the-box-assets/validate.mjs`. Append a "Round 3" section to
`shut-the-box-report.md`. Do not try the browser capture; I will run it.
