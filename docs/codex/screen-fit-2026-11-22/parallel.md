
# Running alongside other batches (overrides rule 4 and Evidence step 1 above)

Other Sol jobs are working in this same folder at the same time, on other games.

- Do **not** edit `tools/screen-fit/games.json`. Put your games' shots in
  `tools/screen-fit/shots/<id>.json` as `{ "shots": [ ... ] }` (same shot format, `start` first,
  then your `play` shot). `capture.mjs` uses that file instead of the games.json shots for that id.
- `git status` and `git diff` will show changes to other games. They are not yours: never edit,
  revert, format or check them. When you compare against HEAD, compare only your own files.
- Write captures only to your own `output/screen-fit/<batch>-after` folder.
- Chromium cannot start inside your sandbox (`bootstrap_check_in ... Permission denied (1100)`).
  Do not try the capture more than once. Do your source checks, write your shots file, and say in
  the report what Claude should look at; Claude runs the captures and sends findings back.
