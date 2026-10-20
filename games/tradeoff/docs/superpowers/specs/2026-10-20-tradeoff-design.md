# Tradeoff design

## Intent
Build a polished, playable daily word game in response to “Build the next spelling bee or wordle or connections.” Treat success as a clear, satisfying game people can play immediately on a phone. Popularity is an untested hypothesis. The working title is Tradeoff.

## Core game
Six real five-letter starting words each differ from the answer to their clue at exactly one position. The six displaced letters form a single cycle. All letters needed are on the board; five swaps suffice. Tap any two unlocked letters to trade them. Intermediate strings may be nonsense. Correct words lock and show their original-to-answer transformation. Allow swaps inside an unsolved word to prevent deadlocks after exploratory moves. Identical-letter swaps are no-ops. Unlimited moves, undo, hints, and optional reveal; no clock or lives.

Moves count actual successful swaps, including ones subsequently undone. Undo restores the board, does not remove swaps from the score, and has its own counter. A perfect trade requires a win within par, no hints, and no undo. Revealed games are distinguished from wins and cannot earn streak credit.

## Experience
Editorial cream/ink design with lime accents, warm selected tiles, and green solved words. Immediate playable board. Concise instructions, help dialog with a safe two-word example, daily/practice tabs, undo and hint controls, optional sound, result and stats dialogs. Keyboard-operable tiles and dialogs, visible focus, live announcements, reduced-motion support, and touch-friendly controls. All buttons work; no fake leaderboard or population claims.

## Daily and persistence
One fixed shared date in America/Chicago; midnight Central rollover. Number 1 is 2026-10-20. The first release has a finite collection of validated boards; daily scheduling cycles through the collection and practice exposes it. Mention the finite collection in help. Local progress and daily results persist on the same browser. Corrupt/unavailable storage fails gracefully. Practice does not affect daily streaks. Keep an in-progress board open across midnight, and offer the new daily board without losing the earlier attempt.

## Architecture
Buildless static HTML, CSS, and ES modules. `puzzles.mjs` is a static curated content collection. `engine.mjs` is pure deterministic game/date/stats logic. `app.mjs` owns DOM rendering, storage, dialogs, sound, and sharing. No accounts, backend, third-party scripts, or runtime API dependencies. Register a private Site, persist its identity, and publish through the Sites source workflow.

## Verification
Test conservation, solvability, minimum swaps, undo, lock rules, same-row recovery, hints, corrupt saves, date rollover/DST, and spoiler-free sharing. Inspect and play the game in the supported browser preview. Independent review before final publication. Verify the native deployment result before reporting a live URL.

## Competitive boundary
Waffle and Borrowed Letters are close neighbors. This is a new implementation with intact real starting words, semantic clues, free trades, and minimal-swap scoring. Do not claim the mechanic is unprecedented or its audience validated.
