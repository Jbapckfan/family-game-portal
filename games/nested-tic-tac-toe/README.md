# Tic-Tac-Toe · Nine boards

A self-contained Alford Daily bonus game. The human is X and starts; the local AI is O. It contributes no daily completion, streak, reward, or prepared-content record.

## Runtime files

Copy these six files together, preserving their names:

- `index.html`
- `app.mjs`
- `engine.mjs`
- `ai.mjs`
- `styles.css`
- `icon.svg`

There are no external packages, cross-game imports, fonts, network calls, or prepared puzzles. The collection link is `../daily/`. `body[data-game-creator="ChatGPT"]` and visible credit identify the creator. Initialization sets `#puzzle[data-game-ready="true"]`.

## Rules and AI

`engine.mjs` is pure and immutable. A move closes a mini board when it is won or drawn, computes the macro result, and routes the next player to the cell's matching board. A closed destination releases the routing constraint. Drawn squares never count toward a macro line.

Casual evaluates every legal move, including immediate wins, blocks, and dangerous destinations. Tactical adds a deterministic three-ply selective search with eight leading candidates at each deeper layer and a maximum of 1,600 generated positions per decision. Every root move is evaluated. The budget is shared fairly among root candidates; no clock, random values, or hardware-dependent stopping condition selects moves. Casual generates at most 81 positions (budget 180). The UI disables human squares during the AI turn.

## Restoration and interruptions

The only storage key is `alford:tic-tac-toe:v1:match`. The versioned save contains the AI level, dismissed-guide flag, and complete move history. Loading replays and validates every move from an empty X-to-play match. Invalid JSON, incompatible saves, illegal routing, repeated cells, or moves after a terminal result fail to a fresh match with a visible recovery warning. A storage exception preserves the current in-memory match and displays a warning.

A save on O's turn resumes that exact position and schedules a new local AI decision. Restart advances a generation counter and cancels the timer. Both before and after evaluation, an AI callback must match the current generation and state reference. An invalid or failed AI decision uses the first legal move as a safe deterministic fallback.

Before writing, each controller compares storage with its last accepted save snapshot. A changed save pauses the stale window, cancels its AI, disables match actions, and offers **Reload saved match**. The guard also checks before AI evaluation and immediately before committing its result. It accepts existing version 1 saves without migration. Storage read failures allow memory-only play and skip writes; quota errors keep in-memory progress. This is a stale-save guard, not live synchronization: changes become visible on the next attempted action or AI callback, and localStorage does not provide an atomic transaction for simultaneous writes.

## Web and native

The responsive overview has nine accessible board-selector buttons. Selecting a board exposes nine larger square buttons with board, cell, mark, and routing labels. Native wrapper detection accepts `window.__ALFORD_NATIVE__` or the existing WebKit `alford` bridge and adds `.native-app`. The optional bridge sends only `haptic` and user-invoked `share` messages. The shared text contains match result and AI level, with no move sequence or board geometry. The Rules and New match controls stay available inside the game when duplicate web branding is hidden.

## Verification

From the repository root:

```sh
node --test --test-concurrency=1 games/nested-tic-tac-toe/tests/*.test.mjs
node --check games/nested-tic-tac-toe/app.mjs
node --check games/nested-tic-tac-toe/ai.mjs
node --check games/nested-tic-tac-toe/engine.mjs
```

The tests cover rule edges, full-game history replay, AI tactics and legal choices, deterministic budget limits, interrupted-turn restoration, stale callback prevention, and storage failures. Browser, screenshot, collection integration, and native interaction verification are owned by the collection integration task.
