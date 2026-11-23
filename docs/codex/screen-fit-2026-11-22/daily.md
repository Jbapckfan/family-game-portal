# Batch `daily`: the eight daily puzzles (layout only)

Folders under `games/`: tradeoff, inbetween, counterpart, shortlist, second-sense, sideways,
ringcount, switchpath, plus the Alford Daily hub page at `games/daily/` (id `daily-hub`).

**Scope is narrower here.** Another unmerged branch (`codex/game-by-game-2026-10-29`, 108
commits) also changes these eight games. To keep the two mergeable later, change only layout
and sizing CSS (and the minimum markup it needs) so the puzzles fill the screen properly at all
four sizes. Do not rename, restructure scripts or touch puzzle data here.

Visual polish here is limited to spacing, alignment, hierarchy, sizing and press states. Keep
each puzzle's colors, fonts and branding exactly as they are: the other branch already carries a
reviewed readability and branding pass for these games (including colors James approved), and
that is where their look will come from.

Baseline: on iPad and laptop each puzzle sits in a column about half the screen wide and the
start page scrolls by 378-818px at every size (measured on the baseline captures). Aim for the puzzle and its controls to fit without
scrolling during play wherever that is reasonable.

If these games share CSS or scripts (for example a common folder they all load), say which file
you changed and confirm all eight still render.

Capture with `--batch daily`, writing to `output/screen-fit/daily-after`. Report to
`docs/codex/screen-fit-2026-11-22/daily-report.md`.
