# Rough games pass (shared rules) - 2026-11-22

The screen-fit branch is merged and live on main (5ef8b7a). You are now on a new branch,
`codex/rough-games-2026-11-22`, in the same worktree. Everything from
`docs/codex/screen-fit-2026-11-22/common.md` and `polish.md` still applies.

James asked for the games that still look too rough to get real visual work. I compared every
game's laptop and phone captures (`output/screen-fit/final/<id>/`). The bar is what Shut the Box
(walnut box, felt, real dice), Snowman Siege (painted winter panorama), Socktopus, Speed/ERS
(real cards) and Peg Jumper (ebony board, glossy pegs) now look like: physical materials, depth,
light and shadow, a believable surface or scene. James's standing bar for game visuals is
photoreal. The games below still read as flat CSS boxes or bare lines on a dark background.

Rules for every game:
- Keep rules, controls, level content, difficulty, scoring, timing, AI and saved data exactly as
  they are. Existing validators must still pass. Visual and layout changes only.
- Keep the current screen fit: no new page scroll, no horizontal overflow, phone tap targets at
  least 44 px, text at least 14 px, contrast at least 4.5:1 for text.
- Generated art: original, no logos or real brands, saved next to the game with its prompt in a
  `.prompt.txt` file, JPEG or WebP at sensible size (aim under 300 KB each, hard cap 600 KB).
  Do not reuse one image under two names.
- Keep performance smooth on an iPad: no per-frame layout thrash, cache static layers, use
  devicePixelRatio for canvases, keep delta-time movement.
- Keep any existing theme or skin choices working; make the default look the best one.
- Sound stays as it is. Do not open any app, window or browser; save files only. No git writes.
- Add or update per-game shot files in `tools/screen-fit/shots/<id>.json` only if a capture
  needs a better in-play moment.

Write your report to `docs/codex/rough-games-2026-11-22/<your-batch>-report.md`: per game what
changed, assets with sizes, checks run. Do not try the browser capture; I will run it.
