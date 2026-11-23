# Dots & Boxes 3D: load fonts and three.js from the repo

Your card-table and Dots drawer pass was accepted and committed. This is a small follow-up that is
part of the offline-play work James approved: `games/dots-and-boxes-3d.html` is the one page the
offline session was told not to touch, because you were editing it.

Do not open any app, window or browser; save files only. No git writes. Shared rules in `shared.md`
still apply. Report to `dots-local-deps-report.md` in this folder.

## What to do

- Replace the Google Fonts load (Orbitron and Exo 2) with
  `<link rel="stylesheet" href="fonts/fonts.css">` (the page is in `games/`; the committed file is
  `games/fonts/fonts.css`). Keep the same `font-family` names. Check that every weight the page
  uses exists in `fonts.css`; list any that do not.
- Replace the cdnjs three.js r128 tag with `vendor/three-r128/three.min.js` (committed, unmodified
  r128 build). Keep it a plain blocking script in the same position so load order is unchanged.
- Remove now-unused `preconnect`/`dns-prefetch` hints to Google or cdnjs.
- Change nothing else. Another Sol session is building `sw.js` and `tools/offline/` right now: do
  not edit those.

## Checks

- Grep showing no `fonts.googleapis.com`, `fonts.gstatic.com` or `cdnjs` left in the page.
- `node games/dots-and-boxes-3d-assets/validate-controls.mjs` passes; `node --check` on the inline
  script. Scoped `git diff --check`.

I will capture the page at four sizes, muted. Do not try the browser.
