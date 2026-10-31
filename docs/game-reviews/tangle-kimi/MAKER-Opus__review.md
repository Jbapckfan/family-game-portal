# Tangle (Kimi): eleventh individual review, by Opus 5.5

Tangle's authorship stays with Kimi (`integration.ts:1`). I read only the supplied source and audit aggregates. I did not play, run, or test anything. These are not James's ratings.

## Actual scope

- **Board:** untimed 4×4 board with eight-way paths. Each cell is used once per word. Words need 3+ letters.
- **Scoring:** 3–4 letters = 1, 5 = 2, 6 = 3, 7 = 5, 8+ = 11 (`progress.ts:30`).
- **Gold:** about 20% of max, clamped to 8–18 (`progress.ts:5`). Gold completes stats once, and hunting continues afterwards.
- **Clue:** one free 2-letter prefix, which persists.
- **Share:** a text-only snapshot after gold, in Daily only.
- **Editions:** the 12-word reviewed exclusion applies from day 20756 (Oct 30), and legacy editions are kept (`engine.ts:24-27`).

Supplied modules I could not inspect: `useUnifiedProgress`, `isNativeEnter`, `isPremium`, `publishedDailyIndex`, `SimpleStatsModal`, and the HTML shell. I make no claims about them.

## Provisional predictions (1–5)

| | Score | Basis |
|---|---|---|
| Fun | 3 | Solid hunting loop. Rare-word dependence will likely cause misses. |
| Clarity | 3 | The help never explains what the hint reveals, or that misses count. |
| UI | Visual score declined | No screenshots. A source-only note is in finding 3. |
| Replay | 3 | 430 boards, random practice. Practice has no share or result variety. |
| Sharing | 2 | Text only, no date, no assistance flag, gold-only, false "Copied!". |

## Material findings

**1. The result modal reveals the best word and makes it farmable.**
`TangleWinModal.tsx:66-68` always renders `puzzle.best`, found or not, then says "You can keep hunting." That best word is usually an 8+ letter word worth 11 points. A player can close the modal, enter it, and raise a score that the share then reports. This is a spoiler and score-integrity problem. Because `best` comes straight from the bank, it is also a tone and privacy risk: today's word, per the brief, is shown unprompted. The "best find" tile (`:55`) is fine, since the player found it.

**2. Sharing is incomplete and can report success falsely.**
- `buildTangleShare` (`engine.ts:50-58`) emits `TANGLE No.${puzzleNo}` only. It has no Daily label or date, no gold target, no misses, and no clue assistance; `hintsUsed` is never passed.
- `copy()` sets "Copied!" after any return from `copyText` (`TangleWinModal.tsx:36-39`). That includes the native bridge path, which posts a share rather than a copy, and the `execCommand` fallback, whose result is ignored (`share.ts:30`).
- Sharing exists only when `goldReached` (`TanglePage.tsx:47`, `:62`), and practice has no share at all (`TangleWinModal.tsx:92-102`).
- Native routing is real: `copyText` calls `nativeMessage` with `data-game-id`. I am not asserting any native defect beyond the label.

**3. Pointer handling ignores pointer identity and release position.**
- `handleDown` (`TangleBoard.tsx:61`) has no `pointerId` or `isPrimary` check and no button filter. A second finger can restart the path to a non-adjacent cell, or submit, via `selectCell`. A right-click starts a drag.
- `handleUp` (`:91`) submits whatever path exists on any pointerup. That includes release outside the grid, because capture is on the container, and a lift by a different finger. An accidental drag release can therefore cost a miss (`useTangle.ts:228`).
- `lostpointercapture` is not handled. `pointercancel` correctly preserves the path without charging.
- Letter cells have no `onClick`; activation comes only from `onPointerDown` and `onKeyDown` (`:216-222`). Assistive-technology activation that dispatches only `click` would do nothing, so this needs device verification.
- Because `submitPath` reads `ref.current` (`useTangle.ts:205`), the last letter may be dropped when move and up land in one render frame. This is a risk worth reproducing, not a confirmed defect.

**4. The clue is unconfirmed, not reported as assistance, and can go stale.**
- `hint()` spends the single clue on one click with no confirmation (`useTangle.ts:268`).
- The saved clue persists after the player finds every word with that prefix. `restoreTangleProgress` (`progress.ts:44`) checks `puzzle.words`, not unfound words, so the clue can point at nothing left.
- The help text ("One free hint per round") never says a prefix is revealed (`TangleHelpModal.tsx:24`).
- The `isPremium()` "Hint · ∞" branch exists (`TangleBoard.tsx:258`). I cannot see whether it is reachable.

**5. Readability and palette conflict with James's stated likes.**
- The tier label uses `TIER_META` colours on the cream stage. Gold is hsl(45 95% 52%), roughly 1.7:1 contrast. "No medal yet" is roughly 2.7:1. Both fail for small text (`engine.ts:43-48`).
- Tick labels are 10px, path-order numerals are 10px, and found-word chips are 11px (`index.css` `.tangle-found`).
- The identity colour is olive green. The end tile is brown, #9a782d (`.tile-new`). The live word is orange-brown, hsl(20 85% 43%). None of this is blue or teal.
- The path polyline sits at 0.38 opacity over green selected tiles, so the order rests mostly on the 10px numerals.

## Verified non-findings

- **No repeated celebration.** Confetti and the auto-result require `goldReached && winShownOnce`. `startDaily` resets `winShownOnce: false` (`useTangle.ts:116`), so reloading neither re-celebrates nor reopens the result.
- **Session guard works.** All six actions are wrapped by `dailySession.actions`, and persistence goes through `commit`. Tangle deliberately lacks `finished`, so play after gold still saves.
- **Legacy restore is consistent.** The guard's validator and `startDaily` both resolve the edition through `dailyTangle(day, raw)`.

## Content and six-month view (from aggregates only)

- Audit totals: 430 distinct grids and 9,155 accepted words, with 28–80 words per board.
- Only 14 of 430 boards reach gold from the bundled common list. The list is incomplete, but this suggests most golds depend on less familiar words. Expect frequent "Not in the word list" misses and occasional names or archaic forms. Common-list membership does not establish difficulty.
- The highest word recurrence is 60 boards, which will feel repetitive over months.
- I cannot see the cycle length because `publishedDailyIndex` was not supplied.
- None of this shows that the puzzles were human-approved.
