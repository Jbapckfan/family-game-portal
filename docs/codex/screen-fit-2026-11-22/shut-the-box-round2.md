# Shut the Box, round 2 (small polish)

Your build is committed on the branch as 41135cf after my own capture
(`output/screen-fit/stb-verify/shut-the-box/sheet-{start,play,throw}.png`): no errors, every
in-shot check passed, play area went from about 3% of the screen to 74-84%, and the three Table
looks read as real boxes. `validate.mjs` now compares against `origin/main` instead of `HEAD`
(so it stays meaningful after commits); keep that.

Three small things, then stop:

1. **Maple plinth.** In the Maple look the box sits on a darker orange base board that reads as
   a different, mismatched wood. Make the base belong to the Maple theme (same maple, slightly
   darker stain, or a clearly deliberate contrasting plinth that fits the palette). Check that
   Walnut and Ebony still look right.
2. **Phone: dice landing on the tile column.** In the phone `throw` capture one die comes to
   rest over the shut "1" tile and the other touches the tile column at the top. Keep thrown
   dice inside the felt bed on every layout (bounds or a wall at the tile column), so shut
   tiles are never hidden. Logical dice must still match the settled faces.
3. **Phone setup scroll.** The setup screen now scrolls 436 px on phone (it was 308 before).
   Bring it back to at most the old amount, ideally with Start Game visible without scrolling,
   without shrinking tap targets below 44 px or text below 14 px (for example a more compact
   player row, or rounds and variant as compact segmented rows).

Rerun `node games/shut-the-box-assets/validate.mjs` and your silent capture if it works in your
sandbox. Append a "Round 2" section to `shut-the-box-report.md`. No git writes.
