# Switchpath player follow-up — October 30, 2026

James answered “yes, i like it” when asked whether he would play again. Switchpath is now a keeper and provisionally first among the two played games; Ringcount is second and remains a replacement candidate. These are an ordering of his qualitative reactions, not fabricated numeric enjoyment scores.

James then requested closer numbers and consideration of a possible 5×5 grid. The existing board expanded across a wider desktop play region; reduce the actual board to at most 304px and the surrounding play region to 360px. Preserve the current numeral sizes and minimum 44px hit targets. Phone boards shrink only when room allows; at small widths they remain fluid. Verify measured centers, hit targets, no overflow and route-line alignment.

A 5×5 option would have 25 cells and a minimum of 24 moves. It is a proposal for an optional longer practice challenge. A visual sizing study, clearly labelled as a non-playable concept, will let James compare its density before integrating a new mode. Its example must be independently checked for one solution; quantity of cells does not establish fun or difficulty.

The shipped engine, rendering, hints, restoration, result text, stats and share cards currently assume 4×4 / 16 cells / 15 moves. Production 5×5 support requires size-aware rules and labels, separately keyed saves and scores, a verified puzzle bank, keyboard/phone checks and updated bundle/native tests. Do not merely restyle the current 16-cell engine. The existing daily bank stays fixed during this layout follow-up.

Chosen approach for this pass: apply the requested compact 4×4 layout and show a separate 5×5 sizing concept. A permanent size selector and full 5×5 content are not yet implemented. No extra daily-game catalog entry is needed for an optional size mode.

## Verified result

The playable compact board measures 304px wide at 390px and 1440px viewports, with neighboring number centers 75px apart. At a 320px viewport it measures 268px wide with 62px cell targets. Numeral sizes are unchanged. The route overlay stays within 2.13px of cell centers, and all tested widths have no horizontal overflow.

The separate 5×5 concept has 56px tiles at 390px/1440px and at least 51px at 320px. Its example has one solution under independent exhaustive enumeration, but the concept is explicitly non-playable and makes no daily freshness or human difficulty claim.

All 20 existing Chromium/WebKit interaction checks pass against the compact source. The unsigned iPhone bundle compiled and all 274 game/runtime resources match the current source. No physical phone or new assistive-technology certification. CSS/layout only; the prior 845 engine/content tests were not rerun because the engine, bank and save code are unchanged.

The compact game and side-by-side sizing concept were opened in visible isolated Chrome tabs; screenshots were visually inspected. Existing play profiles remain intact. Final web stage: `dist/switchpath-compact-20261030/web`. Preview launcher: `output/switchpath-spacing-20261030/show-spacing-study.mjs`. [Comparison](spacing-evidence/sizing-study-1440.png), [compact phone](spacing-evidence/Chromium-390.png), [measurements](spacing-evidence/layout-measurements.json).
