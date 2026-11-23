# Dots & Boxes 3D — local dependencies

November 22, 2026. Changed only the dependency tags in `games/dots-and-boxes-3d.html` and added this report. No browser, app or window was opened; no git writes. `sw.js`, `tools/offline/`, shared fonts, vendor files and game behavior were left untouched.

## Changes

- Replaced the Google Fonts stylesheet with `<link rel="stylesheet" href="fonts/fonts.css">`.
- Replaced the cdnjs r128 tag with `<script src="vendor/three-r128/three.min.js"></script>` in the same position, immediately before the existing style block. It remains a plain blocking script, with no `async`, `defer` or module conversion.
- Removed the two now-unused Google preconnect links. No Google/cdnjs DNS-prefetch hints remain.

## Font audit

The current page actually uses **Inter**, not Orbitron or Exo 2. Preserved its existing `'Inter', sans-serif`, `'Inter', monospace` and generic `monospace` declarations.

| Family | Page/drawer weights used | Local weights declared | Missing used weights |
| --- | --- | --- | --- |
| Inter | 400 (normal), 500, 600, 700, 800, 900 | 300, 400, 500, 600, 700, 800, 900 | None |

The requested local stylesheet also provides Orbitron 400–900 and Exo 2 300–700. Neither family is declared by this page, so no additional family or weight was substituted. Verified that `fonts.css`, its Inter WOFF2 file and the r128 vendor file exist at the resolved local paths.

## Checks

- `rg -n 'fonts\.googleapis\.com|fonts\.gstatic\.com|cdnjs' games/dots-and-boxes-3d.html`: no matches.
- `node games/dots-and-boxes-3d-assets/validate-controls.mjs`: passed both preference/storage and drawer/controller groups.
- `node --check` on the extracted inline script: passed.
- Compared inline game code against HEAD: unchanged. Scoped diff contains only the dependency/hint replacements.
- Scoped `git diff --check`: passed.

No browser capture or offline-cache certification was attempted; four-size muted capture and service-worker verification remain with their owners.

Files changed:

- `games/dots-and-boxes-3d.html`
- `docs/codex/rough-games-2026-11-22/dots-local-deps-report.md`
