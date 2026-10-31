# Hunch Review Implementation Plan

> **For agentic workers:** Execute inline using superpowers:executing-plans. Obtain the requested Kimi/Gemini/Opus static reviews and a focused final review; verify material findings before changes.

**Goal:** Deliver a readable, polished and shareable five-letter deduction game for James’s individual playtest, preserving its answer calendar, duplicate-letter evaluation and saved rounds.

**Architecture:** Keep five letters/six guesses and all 937 published answers. Add a pinned, generated five-letter guess lexicon using the existing full word-game sources. Use an ephemeral fresh-finish flag for celebration/results, safe clue confirmation, explicit duplicate-letter instructions and a frozen aggregate-only share snapshot/PNG panel.

**Tech Stack:** Existing React/TypeScript/Vite, Node/tsx/JSDOM and Chrome/WebKit; no new dependencies or services.

**Spec:** Existing game-by-game review instructions and James’s latest “great, next game.” Apply established blue/teal/readability preferences, full gameplay/UI/sharing review and durable ranking. No new design-approval round is needed for this established review flow; no new puzzle rules or hard mode are added. Duplicate guesses will receive free, explicit feedback; historical repeats remain restorable.

## Constraints and review focus

- Keep five letters, six accepted guesses, bank/calendars, original author credit and Daily/Practice statistics separation.
- Broaden accepted guesses without invalidating older saves; no exact current Words With Friends parity claim.
- Preserve fresh-earned celebration; no restore celebration or forced result popup. Freeze played date and clear stale share state between rounds.
- A clue reveals membership, not position. Confirmation/cancel, stale rounds and repeated clicks must not spend an extra clue; assistance is disclosed.
- Native sharing first, truthful cancellation/copy/manual fallback, actual portrait/square PNGs for win/loss and Practice. No answer, guess letters, clue letters or URL in exported data.
- Use one owned visible window and at most two tabs; headless QA has separate data. Preserve all other games and Tangle changes.
- No paid API/license, public deployment, infrastructure or model changes.

## Tasks

1. [x] Baseline independent duplicate oracle, answer/guess coverage, 182 dated answers and phone/desktop screenshots; requested panel reviews.
2. [x] Failing regressions for dictionary completeness, fresh/restored finish, free duplicate submissions, safe clue confirmation, keyboard ownership and spoiler-free sharing.
3. [x] Implement Hunch-only dictionary, targeted hook/UI fixes, cool readable board/keyboard, interactive rules and completed-result export.
4. [x] Focused tests, full package/catalog suites, independent audit, Chrome/WebKit win/loss/Practice/restore/share flows, offline all-games and native Web byte parity; fresh source review and adjudication.
5. [x] Reuse the current tab for Hunch; save exact Tangle feedback and Hunch’s pending verdict. Commit/push/verify feature branch and package the current all-games build.

## Initial evidence

Baseline: 937 unique five-letter answers, all present in the supplied common list and current dictionary. 182 selected days are distinct. Duplicate evaluation agrees with an independent per-letter quota oracle in 59,049 cases. The expanded pinned sources contain 17,946 five-letter guesses versus 15,921 now accepted. These figures establish construction and coverage, not human familiarity or fun.

## Final verification

212 package tests, 899 catalog tests, 54 Chrome/WebKit checks and 11 offline-worker checks passed. App/node TypeScript and Vite passed. Native Web parity: 285 exact runtime files. Stage 0b4709d7e8cd3871 has 319 files and 317 hash-verified manifest entries. No fresh native compile or hardware play. Hunch is open in the one existing game tab, with its help inspected; verdict pending. Commit/push/package complete this delivery.

Implementation checkpoint `f44770a0fbc067db7e6817ed4a9953f0dc41932f` was pushed to the existing private feature branch and verified via GitHub API. The all-games ZIP was hash-verified by the packaging tool; see `docs/game-reviews/hunch/evidence/delivery.json`. Hunch remains open for James’s verdict.
