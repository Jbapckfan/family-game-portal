# Territory Tactics: original playable UI directions

James asked for several UI choices with a much higher standard of polish. The prototypes are original Alford Daily interfaces, retaining the collection’s pale blue background, white surfaces, restrained navy/amber palette and readable sans-serif type.

- **A — Clean graphic:** minimal board, flat crisp pieces, few visual layers.
- **B — Sculpted board:** shallow relief, satin pieces and restrained contact shadows.
- **C — Tactical field:** the same hex adjacency shown as connections between positions, with a more open technical presentation.

Open `index.html` directly in a browser. All three use real practice position `territory-032`, with a four-stone goal and two-placement budget. There are no external dependencies, network requests, persistent storage or changes to daily saves. Each prototype has independent in-memory progress. Restart clears that preview, including after completion. This sample is for design review, not a production publication.

`build.mjs` embeds the current unmodified game engine and one prepared puzzle into the HTML template. Rebuild from the repository root with `node docs/game-reviews/territory-tactics/ui-options-2026-11-05/build.mjs`. The graph in C uses the engine’s exact neighbor relation, not an invented alternate board. Rules copy in C names linked positions rather than hex tiles. The board does not reveal legal or winning moves in advance; Hint deliberately places a solver-proven move as in the existing game.

Verification results and initial render evidence accompany the review. No subjective quality certification or keeper ranking is implied.

Validation: Chrome passed real solves, undo, restart and both hints for all three designs; 320/393/1600-pixel layout checks found no horizontal overflow and board targets remained at least 44 pixels. WebKit passed keyboard-first/touch completion, restart, rules expansion and phone overflow checks for all three. Initial desktop comparison and phone C were visually inspected. Browser checks used isolated demo state. No live user moves were made.
