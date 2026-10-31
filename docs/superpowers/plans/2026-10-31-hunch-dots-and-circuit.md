# Hunch dots and Circuit review

> Execute inline with the existing game-by-game workflow. James selected black/white Mastermind-style dots, kept Hunch, and explicitly requested the next game. No further design-question round is needed for this selected change. Preserve all games and saved rounds; no infrastructure, dependency, paid-service or deployment changes.

**Goal:** Complete Hunch’s chosen dot presentation, then deliver Circuit for James’s next individual playtest.

**Design:** Group black exact-match dots and white misplaced-match dots beside each Hunch guess. Neutral letters and keyboard reveal no individual-letter feedback. Empty markers mean no additional match. Explain that dots do not correspond to letter positions; use the same grouped feedback in results, captions and PNGs. Retain five letters, six guesses, answer calendar, duplicate evaluator and save schema. With aggregate feedback, clue candidates must exclude revealed clue letters only, rather than treating hidden per-letter evaluations as known information. No wholly-original-mechanic claim.

Circuit keeps its ring, alternating-arc and chained-word rules, bank/selector and scores. Audit the full bank, obtain actual Kimi/Gemini/Opus reviews, improve verified gameplay/UI/sharing defects using the established blue/teal/readability preferences, and keep its disposition pending James. DeepSeek is conditional on a verified free route, currently unavailable. Reuse the one owned visible tab.

- [x] Add failing Hunch regressions for grouped dots, no per-letter feedback leakage, duplicate counts, aggregate-safe clues and canonical dot exports. Implement and verify.
- [x] Independently audit Circuit’s full bank, dated selections and routes; capture baseline; obtain the requested static panel reviews.
- [x] Add regressions for confirmed Circuit defects; implement focused UI, safe actions, fresh/restored completion and frozen aggregate sharing. Preserve its actual gameplay.
- [x] Run package/catalog tests, TypeScript/build, Chrome/WebKit flows, all-games offline checks and native Web parity. Inspect actual UI and cards, adjudicate reviewers, record Hunch’s exact verdict and Circuit’s pending verdict.
- [ ] Open Circuit in the existing tab, commit/push/verify the feature checkpoint and package the all-games build. No deployment or hardware certification.
