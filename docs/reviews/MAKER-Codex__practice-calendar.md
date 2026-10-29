# Practice calendar review fix

Date: October 29, 2026. Author: Codex. Scope: shared imported-game Practice selection and a reusable calendar helper.

## Reproduced issue

The previous shared session controller chose `(previousPracticeIndex ?? todayIndex) + 1` modulo the whole installed bank. With the new Tumbler calendar, October 30's daily index was **391** and fresh Practice selected **392**, exactly October 31's daily. A focused regression failed on the actual `tumbler-0393` record before the fix. Raw whole-bank traversal also admitted legacy Prism rule duplicates and could admit editorially held Splice records.

## Behavior after the fix

`games/deepseek-runtime/practice-calendar.mjs` exports:

```js
practiceCandidates(slug, date, count, {excludeIndices: []})
```

The helper uses the parent's generated `DAILY_RESERVATIONS` calendar to remove all boards scheduled from the supplied date through April 28, 2027, inclusive. Dates before the protected window reserve the whole window; after the window, that reservation expires. Date arithmetic uses integer calendar days, so daylight-saving offsets cannot shift the reserved slice.

When a complete bank is installed, candidates come from its canonical `FRESH_ROTATIONS` indices. That preserves duplicate-rule exclusions and editorial holds after the calendar reservation expires. Appending unpublished records does not silently add them to that canonical pool. Games without a canonical rotation use their valid installed indices and still respect a compatible reservation when one exists. Reduced test fixtures ignore production-bank reservations. A single-board fixture may replay its only board even if the caller excludes it; this exception cannot expose a production reserved board because production calendars require the full matching bank count.

Fresh shared-runtime Practice excludes today's scheduled index as well, chooses the first eligible board, and Next advances through the eligible list. Completing a Practice round still does not write a daily result. All existing state envelopes, engine scoring, hint costs, and daily selection logic are preserved.

**Saved-progress exception:** a valid unfinished saved Practice envelope continues to resume unchanged, including an already-opened round whose board is now reserved, a duplicate legacy rule, or an editorial hold. This preserves existing progress instead of deleting it during an update. A completed saved round or a request for Next uses the current safe candidate pool. Invalid envelopes retain the existing validation/fallback behavior.

## Verification

The focused Tumbler test demonstrated RED before the change and GREEN afterward. It then called Next 1,054 times and confirmed that no remaining protected daily appeared. Additional session tests cover preservation of a saved future-board draft, replacement of a completed saved future board, legacy Prism progress followed by safe Next, traversal of the entire nonreserved Prism pool, and one-board fixture play.

The helper suite checks every supplied game calendar at both boundaries, before and after the window, and across daylight-saving dates. It checks exact eligible sets, valid indices, no duplicates, reduced fixtures, malformed dates/counts, stable canonical eligibility after bank growth, the five canonical legacy Prism structures, and the two Splice editorial holds.

Existing all-bank solve tests remain engine/session proofs. The generic appended-bank Practice traversal test now expects every eligible board rather than demanding today's excluded board. No all-bank solvability checks were removed.

The parent owns `daily-rotations.mjs`, its generator, the dated selectors, original-game and Kimi integration, asset allowlists, and deployment. This worker tested a copied parent calendar/selector fixture and does not commit that data or selector change. No provider calls, browser/server sessions, downloads, or native-file changes were made.

Final integrated-fixture run: **128 tests passed, zero failures or skips**. This includes all **37** helper tests against the parent's final 202-record Splice calendar with 200 eligible records and both held indices excluded. The remaining **91** tests cover shared sessions/shell/DOM and the existing local Claude expansion/session suites. The parent's final full-repository verification remains responsible for its other concurrent content changes.

```sh
NODE_PATH=/Users/jamesalford/Documents/Codex/2026-10-27/task/alford-daily/packages/kimi-pebbles/node_modules node --test games/deepseek-runtime/core.test.mjs games/deepseek-runtime/practice-calendar.test.mjs games/deepseek-runtime/common.test.mjs games/deepseek-runtime/elite-ui.test.mjs games/qwen-quadra/elite-ui.test.mjs scripts/claude-expansion.test.mjs scripts/claude-six-month.test.mjs
```
