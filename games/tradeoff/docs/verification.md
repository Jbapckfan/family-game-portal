# Tradeoff verification — 2026-10-20

This record describes the original standalone game. The family portal package retains it as development history; its browser checks do not establish that the NAS copy is live. In the portal package, runtime files are at the game-folder root instead of `dist/`. See the portal's `docs/integration.md` for integration checks and deployment instructions.

## Automated checks

- `node tests/engine.test.mjs`: 13 tests passed, zero failed.
- `node tests/puzzles.test.mjs`: 4 tests passed, zero failed.
- `npm run check`: application, engine, and puzzle modules passed syntax checks.
- The 90-board content checks prove conservation, exactly one initial changed letter per row, a single six-letter cycle, and a reachable five-swap solution.
- Recovery stress test: all 90 boards, three seeded scenarios each, 80 exploratory trade attempts per scenario followed by hint-guided recovery. Every scenario finishes with conserved letters.

## Browser checks

- Completed the opening daily through the interface in five swaps; the final trade solved two words and displayed a perfect result.
- Correct rows locked and the next active tile received focus.
- A second open tab received game progress and the completed result automatically.
- Daily statistics showed one win, one perfect trade, a one-day streak, and a 5.0-swap average.
- Sharing used the selectable-text fallback when the test browser denied clipboard access. The result contained six squares and the score without clue answers.
- A practice nudge identified exact letters and positions. Trading and undoing restored the board while preserving the swap, hint, and undo counters.
- Revealing a practice produced a revealed result. After reload, reopening that practice retained the revealed status and all counters.
- Finished practice options exposed restart. Restart restored the initial board and zero counters, with focus on the board.
- Phone preview widths 320, 390, and 480 pixels had no horizontal overflow. Their document content widths equaled their available client widths.
- Desktop and phone layouts were visually inspected. Assets and fonts are hosted locally.

## Independent review

The review found and the implementation corrected an initial missing control ID, stale-tab terminal-result overwrites, missing completed-practice replay access, inaccessible result-dialog focus return, and ambiguous repeated-letter hints. A browser check subsequently found and corrected restart focus after the finished options button became hidden.

## Limits

- Browser checks used the supported Chromium preview, including phone-width frames. No physical iPhone or Safari device test was performed.
- No public playtest or retention measurement has been performed.
- The first 90-board collection repeats until more boards are added. Difficulty levels are editorial estimates.
- Progress is per browser. There is no account or cross-device synchronization.
- Source deployment starts owner-private.
