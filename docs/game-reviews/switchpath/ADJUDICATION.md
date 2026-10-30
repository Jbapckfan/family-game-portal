# Switchpath review decisions — October 30, 2026

James's Ringcount reaction is direct player evidence: “pretty easy and boring game, okay, next gae”. Ringcount is a replacement candidate, still present. Switchpath has no player rating yet. Reviewer scores below are predictions, not a preference ranking.

| Reviewer | Material | Fun | Clarity | UI | Replay | Sharing |
|---|---|---:|---:|---|---:|---:|
| Kimi K3.1 Pro | Baseline source and phone/desktop screenshots | 2 | 4 | 4 | 3 | 2 |
| Gemini 3.8 Flash High | Same baseline source and screenshots | 2.5 | 4 | 4 | 2.5 | 3 |
| Opus 5.5 | Updated inline source; no screenshots/CSS | 3 | 4 | Visual declined; interaction 4 | 3 | 3.5 |

These columns do not measure an improvement: the reviewers saw different revisions. None played or executed tests. Original reports and receipts are preserved alongside this document. The initial Opus file-based request returned no report; its incomplete record is preserved. The bounded inline retry returned a complete review with the actual `claude-opus-5-5` model receipt.

## Accepted and verified

- **Hint consequences:** confirmation describes +1 move/+1 hint and possible rewind. Cancel preserves the exact game; confirm uses the existing engine. Adjacent control text discloses Undo/Reset costs.
- **Dead ends:** derive the visible panel from zero locally legal moves on every render, including reload. No future-failure prediction or next-cell highlighting.
- **Phone controls:** compact header and action row immediately below the board. Chose this over a sticky overlay; it does not cover cells.
- **Terminal inspection:** ordered values, positions and higher/lower transitions in a keyboard-accessible disclosure. Played cells remain immutable. No solution list is populated during play.
- **Sharing:** frozen allowlisted result; dated daily or explicit practice, honest perfect/solved/revealed counts, square/portrait PNG, native browser file share where supported, download, copy and manual selection. Artwork is a fixed abstract array, never the played board or route. One move-announcement region.

Opus found no confirmed Critical/Important defect in the supplied source. Its two shell-dependent checks were resolved: `daily` is a stored non-null loaded-day object, not a getter that recomputes from the clock. It remains present in practice. Actual browser tests now explicitly assert the prior date after closing and reopening sharing past midnight; practice sharing also completes in both browsers.

## Gameplay depth follow-up

Opus correctly observed that checkerboard colour relative to S fixes whether a cell is a valley or peak. A separate independent audit filters adjacent edges by that comparison, then repeatedly applies degree constraints (S/E require one selected edge, all other cells two). It uses no guessing, connectivity deduction or subtour pruning. Every forced or excluded edge is cross-checked against the bank's exhaustively verified unique solution.

**58 of 217** boards resolve completely under those basic rules; **159** require something beyond them. Today's `switchpath-011` resolves in four propagation rounds. This supports a concern about mechanical puzzles for experienced players. It does **not** prove that the remaining 159 are hard, that the 58 are boring, or that any board is fun. The earlier 4–7 branch-point metric is not a difficulty rating. [Reproducible forcing audit](evidence/forcing-audit.json).

Preserve the published bank and let James compare actual play before adding modes, changing scores or replacing games. Gemini's “within two weeks” repetition prediction and both models' frustration predictions are unmeasured opinions.

## Deferred / out of scope

- Public play links in results: build remains local/private; do not expose a private URL.
- Native app image export: existing native text bridge remains. Browser image success is not physical iPhone certification. Native text has the older formatting without a calendar date.
- Minor suggestions: explicitly state that one tap can rewind multiple steps for one move; short terminal focus gap before the result dialog; simplify repeated revealed wording; varied abstract move-over-par artwork. No demonstrated major blocker.
- DeepSeek: not run because no verified free route was available; no paid route or subscription was added.
- Human fun, repeated-day interest, one-handed hardware use, actual VoiceOver/TalkBack and social-app handoff remain pending.
