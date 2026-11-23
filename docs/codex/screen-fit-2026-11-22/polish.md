
# Visual polish (James, 2026-11-22: "make sure all games get a solid visual polish as needed")

Every game in your batch should look finished and premium at all four sizes, not just fit the
screen. Keep each game's identity (a neon game stays neon, a cartoon game stays cartoon), but
raise the finish:

- **Hierarchy.** The board/playfield is the hero. Secondary controls (settings, records, variant
  pickers) are quieter and grouped; the one primary action per state stands out. No large dead
  areas: backgrounds get a subtle vignette, texture or lighting instead of flat fill.
- **Consistency.** One spacing scale, one corner-radius family, one button style family per game.
  Aligned edges. No mixed font stacks. No clipped, overlapping or wrapping-mid-word labels.
- **Type and contrast.** Body/label text at least 14 CSS px on phone (primary actions and scores
  larger); text contrast at least 4.5:1 against what is actually behind it. Nothing tiny or grey
  on grey.
- **Physical objects look physical.** Where a game shows real-world things (cards, dice, felt,
  wooden or plastic boards, pegs, discs, tiles), give them believable material: edges, subtle
  gradients, highlights, contact shadows, and real-looking card faces and backs. James's bar for
  game art is photo-real; where a texture clearly lifts it (felt, wood, card stock), make one with
  your built-in image generation (no downloads), compressed WebP/JPEG in the game's own folder,
  and record the prompt beside it.
- **Feel.** Press states on every tappable thing, short eased transitions (about 150-250 ms) for
  state changes, a satisfying but brief moment for wins, clears and merges. Respect
  `prefers-reduced-motion`. No continuous animation that burns battery while idle.
- **Don't.** Change rules, content, difficulty or saved data; add a CDN or library; add Speed
  playable-card highlighting (see do-not-repeat); trade away tap-target size or readability for
  looks.

You cannot open a browser here, so judge from Claude's captures (the sheets named in your brief;
you can view PNGs) and from the source. In your report, list per game what you polished and what
you would still change.
