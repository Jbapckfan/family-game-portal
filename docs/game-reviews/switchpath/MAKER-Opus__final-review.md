# Switchpath: independent source review (Opus 5.5)

**Scope:** I read only the supplied source: `share-card.mjs`, `app.mjs`, `engine.mjs`, `index.html`, the two test files, the browser script and DESIGN.md. I did not play, execute, render or screenshot anything. `shell.mjs`, `puzzles.mjs` and `styles.css` were not supplied. The scores are model predictions, not James's ranking.

## Critical / Important defects

**I found none in the supplied source.** I traced these paths and found them consistent:

- **Move/hint accounting:** `selectCell`, `useHint`, Reset (which runs `select(start)`) and Undo.
- **Restore validation:** `restoreGame` rejects a "won" state with fewer than 15 moves and requires hints ≤ moves.
- **Spoiler safety:** `buildShareResult` never passes values, path or puzzle ID to the renderer.
- **Daily-as-practice impersonation:** blocked.
- **Share gesture:** `navigator.share` is called synchronously inside the click handler, so the user-gesture requirement holds.
- **Share races:** the `generation` counter guards against stale renders when the format changes.

Two items depend on shell code I could not see. These are things to verify, not confirmed defects:

1. **Midnight relabel on reopen.** `openResultShare` reads `api.daily.number/dateKey` each time the dialog opens. The browser check only covers a format switch *inside one dialog* after midnight. Suppose `api.daily` recomputes from the clock rather than returning the loaded daily. Then closing and reopening the share dialog for yesterday's still-displayed win after midnight would label it with today's number and date. The second share open in `review-switchpath.mjs` happens after `setSystemTime(10-31)`, but it never asserts the date. Adding that one assertion would settle it.
2. **Practice with a null daily.** If `api.daily` can ever be null in practice mode, `api.daily.number` throws before the dialog opens.

## Mechanics and fun (opinion, not defects)

**The key structural fact:** on a 4×4 checkerboard, path-index parity equals square colour. Every cell sharing S's colour is therefore a "valley" (lower than both route neighbours), and every opposite-colour cell is a "peak", E included.

The alternation rule is equivalent to a **fixed, visible edge filter**: an edge between an S-coloured cell *a* and a neighbour *b* is usable only if *a* < *b*. Once players see this, Switchpath becomes a Hamiltonian path on a sparse static graph, solved by standard forcing:

- a degree-2 cell must use both of its edges;
- a degree-1 cell must be S or E.

This cuts two ways for James's "easy and boring" concern:

- **Players who never find it** face guess-and-backtrack. The audit's false branches run 9–14 steps, so a wrong choice can surface very late, with no signal about where it went wrong. That reads as frustration, not flow.
- **Players who find it** may find many boards mechanical, much like Ringcount. The 4–7 branch-point audit measured the *dynamic* search. It likely overstates difficulty for informed solvers.

**Recommendation:** re-audit the 217 boards with a static-prune plus degree-forcing solver, and count how many still need real lookahead. That is the closest proxy available for whether "think ahead" survives the insight. The current help text ("think a turn ahead") neither teaches the insight nor reckons with it.

## Replay

- **Weak motivators:** daily, streak, perfect count. The perfect score (15 moves) is binary, and any exploration permanently flips the label to "Keep exploring", so there is little to improve beyond "perfect or not".
- **Uncertain hook:** whether repeated play stays interesting depends on the forcing-depth finding above.

## UI, keyboard and accessibility (source-level)

**Strong:**
- Roving tabindex, arrow/Home/End focus moves that cost nothing, and native button activation for Enter/Space.
- Backspace undo; per-cell labels with row/column, step number and rewind affordance; `aria-current="step"`.
- A render-derived dead-end state that survives reload; a safe default focus in the hint dialog; an ordered terminal route list.

**Minor issues:**
- On a win, the clicked cell is re-rendered as disabled and `focus` is skipped because the game is no longer active. Focus drops to `<body>` until the delayed result dialog autofocuses.
- When `#puzzle` itself has focus (via the skip link), Enter selects the tip and produces the "You are here" notice. This is harmless.

## Sharing

**Works well:** it is honest, spoiler-free and degrades gracefully (share → download → clipboard → manual select), and it reports cancellation clearly.

**Weaknesses (opinion):**
- **Little to talk about:** every solved card shows the same 16 tiles and the same 🟩🟩🟩🟩, and only the moves/hints numbers differ. Nothing invites comparison the way a journey-revealing result does.
- **Inconsistent text:** the native-app text from `formatShare` omits the date and "Alford Daily", so it differs from the web caption.

## Minor suggestions

- **Clarify rewind cost:** the action-cost line says "Undo or reset: +1 move" but doesn't say that tapping an earlier step is also +1 at *any* depth. Repeated Undo is strictly worse than tapping back, and players should know.
- **Reduce card redundancy:** the revealed card shows "Revealed", "ANSWER SHOWN" and "Route revealed." together.
- **Consider a spoiler-free spread signal:** showing moves over 15 as an abstract bar on the card would give results some variety without changing scoring.

## Provisional scores (1–5)

| Area | Score | Basis |
|---|---|---|
| Fun | **3** (wide error bar) | Hinges on forcing depth. |
| Clarity | **4** | Rules, costs and dead-end state are explicit. |
| UI | **Visual declined**; interaction structure 4 | No screenshots supplied. |
| Replay | **3** | Binary perfect, uniform results. |
| Sharing | **3.5** | Robust and honest, but low on social differentiation. |

## Scoped verdict

From source review only, I found no confirmed Critical or Important defects. Engine accounting, restore validation, spoiler isolation and share fallbacks look correct. Two shell-dependent items should be checked: midnight relabel on reopen, and a null daily in practice mode. The main open risk is fun rather than correctness: the checkerboard valley/peak equivalence may make boards either opaque trial-and-error or mechanical. A forcing-solver audit is a better next step than more polish.
