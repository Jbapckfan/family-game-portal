# Clearer gameplay direction — October 30, 2026

James requested more obvious high-versus-low indicators during gameplay.

The direction panel now uses one large arrow and bold GO HIGHER / GO LOWER wording. Higher uses a filled blue panel; lower uses a filled orange panel. A separate comparison line gives the current threshold (Greater than 9 / Less than 12). The small pair of competing up/down arrows is removed. Direction words and arrows communicate the state alongside colour. The board references the instruction and comparison in its accessible description; the existing single polite move announcer remains.

Phone instruction text measures 20–22px, desktop 24px, and arrows 42–46px. Browser-measured white-text contrast is 8.25:1 for higher and 7.44:1 for lower. Text fits at 320, 390 and 1440px; the board's existing 768px layout check also passes. Both real direction states were visually inspected. No new engine, scoring, bank or saved-game format change.

Verification: 43 Switchpath tests and 24 collection practice regressions passed. All 24 browser checks passed across Chromium and WebKit, including both direction states, actual moves, Undo, hint confirmation, reload, dead ends, complete win, terminal inspection, sharing and narrow layouts. The updated label/reload regression first failed on the old adapter, then passed. The unsigned iPhone app compiled; all 274 runtime resources match source byte for byte. Physical-device/VoiceOver checks were not performed.

The updated playable game is open in visible isolated Chrome, using current source files and a separate persistent profile. Existing play profiles are preserved. Preview launcher: `output/switchpath-directions-20261030/show-indicators.mjs`. Final staged all-games build: `dist/switchpath-directions-20261030/web`.

[Higher](direction-evidence/Chromium-higher-390.png), [lower](direction-evidence/Chromium-lower-390.png), [checks](direction-evidence/browser-results.json), [summary](direction-evidence/summary.json).
