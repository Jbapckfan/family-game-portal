# New portal card art from the games' current looks

James approved this. Most portal card images date from February–September 2026 and show the old
looks (Shut the Box and Cube Jumper are flat SVG drawings). Replace them with images that show each
game as it looks now, so the portal is honest and inviting.

Do not open any app, window or browser; save files only. No git writes. Shared rules in `shared.md`
still apply. Report to `card-art-report.md` in this folder.

## Source

Claude's final all-games capture: `output/screen-fit/final2/<game>/` (start and play frames at
phone, iPad landscape, iPad portrait and laptop; `report.json` lists them). It was taken after every
commit on this branch through `6a9f7c7`; 32 games, 320 frames, no page errors. 2048's extra shots are
named `candy` and `wood`. Image tools on this Mac: `sips` (crop, resize, JPEG quality) and `ffmpeg`;
there is no ImageMagick or `cwebp`, and Python has no PIL. JPG output is fine. Every card image must be
made from a real frame of that game (crop, reframe, light grading, sharpening are fine). Do not
invent gameplay that is not in the frames, and do not add text, logos or UI that the game does not
show: the portal card already prints the title and description.

## Cards

Every `<img class="game-thumb">` in `index.html`. Keep each file's current name and format where
practical (the SVGs for Shut the Box and Cube Jumper become JPG or WebP; update their `src` and
`alt`). Velocity Marble Run is not part of this capture: leave its card alone.

- Shape: the card shows the image at 16:9 with `object-fit: cover` in a grid column at least 280 px
  wide; make 800×450 images.
- Choose the frame that best shows the game being played (pieces in play, the board mid-game), not a
  menu, unless the menu is the most attractive honest view.
- Aim under 120 KB each; never over 300 KB. No two files with the same bytes.
- `alt` text describes what the image shows.
- Save each card's source frame path and crop box in one `card-art-sources.json` next to the report.

## Checks

- Every `game-thumb` `src` in `index.html` exists; dimensions and bytes per file (table).
- Rerun `node tools/offline/build-precache.mjs` (it now follows `<img src>`, so new card images are
  picked up and replaced ones drop out), then `--check`; report the new file count and bytes (limit
  25,000,000), and `node --test tools/offline/test/*.test.mjs`.
- Scoped `git diff --check`.

I will capture the portal page at four sizes and review the cards. Do not try the browser.
