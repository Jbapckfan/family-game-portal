# Alford Daily continuity follow-up

Continue the local word-edition iteration from `b8336ac`, preserving its paper/ink design, all 32 daily games, the separate nine-board bonus, authored content, daily assignments, scoring and creator attribution. The existing product plan records delegated local implementation; this follow-up stays within that scope. No deployment, audience change, external model review, infrastructure change or paid service is part of this pass.

## Approach

Keep the current shared shell and game adapters. Extending the existing save guard is smaller and more compatible than adding a new save schema or synchronization service. Reuse the validated bonus move history for recent-move feedback, rather than storing duplicate match state. These are implementation choices for this pass.

## Behavior

- A delayed word-game window must not overwrite a different unfinished save. Adopt the existing engine-validated saved state and ask the player to repeat the action on that current board. Keep the first finished daily result, existing practice restart behavior, and memory-only play after failed writes.
- A storage read failure must not be treated as proof that no save exists. Keep playing in memory without writing over an unreadable save. Resume persistence only after a verified read.
- Nine-board play must identify the last move in words and on the overview, so the player can understand an AI move even when the enlarged board follows the next forced destination. A keyboard/touch control can inspect that board without changing the match. Clear this feedback on a fresh match and restore it from existing version-1 saves.
- Share text remains spoiler-free. No new daily credit, account, cloud sync, score migration or puzzle-bank changes.

## Verification

Use failing-before/passing-after real-shell save regressions, existing engine/controller tests, real Chromium and WebKit interactions, 320px/phone layout checks, source/native-resource parity and standalone packaging. Report physical-device and hosted-site limitations honestly.
