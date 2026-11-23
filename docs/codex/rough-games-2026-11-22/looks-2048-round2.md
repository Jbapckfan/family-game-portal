# 2048 round 2: make the default skin neon again

Claude reviewed your 2048 pass in `output/screen-fit/looks-r1/2048/` and compared it with the
before frame `output/screen-fit/final/2048/laptop-play.png`. Lights Out and Spelling Bee were
accepted and committed. 2048 was not committed. Here is the problem:

- The default skin is still labelled **Neon Tiles**, but it now shows ivory, sand, amber and
  copper tiles on the ebony board. Put next to `looks-r1/2048/laptop-wood.png`, it is almost the
  same as **Classic Wood**: same warm palette, same board image
  (`PegJumper-assets/ebony-board-r3.jpg` is also Classic Wood's board, at line 381 of
  `2048.html`). Players now have two nearly identical skins, and the label no longer describes
  the look.

## What to do

Keep what worked: low tiles that stand out from the board, numerals at **4.5:1 or better on every
value**, the physical edge and bevel treatment, a ladder that visibly changes as values grow, and
the 24-move shot in `tools/screen-fit/shots/2048.json`.

Change the default `neon` skin so it reads as **neon at a glance**: physical lit acrylic or glass
tiles with an inner glow in cool electric hues, the low values bright and luminous rather than
navy, the ladder stepping through the neon range (for example cyan to teal to violet to magenta to
hot amber), and the biggest values the brightest. Do not use the ebony wood board for this skin;
use a dark smoked-glass or dark metal well. You may reuse
`LightsOut-assets/brushed-metal.jpg` by its original URL, or no image. Do not generate a new image
unless nothing else gets to the photoreal bar.

Leave **Classic Wood** and **Candy** as they are now. The three skins must be clearly different
from one another at phone size.

Shared rules in `shared.md` still apply. Do not open any app, window or browser. No git writes.

## Checks

- Contrast table for every value the neon skin can show (including Fibonacci/Threes values and
  obstacles), computed from the actual colours, in `2048-assets/contrast-checks.json`.
- `node --check` on anything you change that is a script. Scoped `git diff --check`.

Append a **Round 2** section to `looks-2048-lights-bee-report.md`: what changed, the contrast
results, and what Claude should look at in the next capture.
