# Static review: Alford Daily Candidates 01–10

**Provenance.** I reviewed by reading only the pasted `engine.mjs`, `app.mjs`, `styles.css`, `tools/audit.mjs` and `evidence/MAKER-Codex__audit.json`. I ran nothing and opened no files. I did not see the bank, the runtime HTML or any screenshots. The model was `claude-opus-5-5` (Opus 5.5). No other generation parameters are visible to me, so I report none. The working directory is named `MAKER-Opus__…`, but the code and evidence are labelled `MAKER-Codex`. That mismatch may be worth tidying for provenance. The audit counts, Chrome flows and DOM packing certificates are the author's evidence, not my execution.

Labels used below: **[Demonstrated]** means the code path is certain from reading. **[Inferred]** means a conclusion from the author's published numbers. **[Unverified]** means it depends on bank contents I don't have.

---

## Critical

### C1. Practice uses the daily pool, and future dailies are selectable [Demonstrated]
- **Mechanism:** The `replay` action sets `practice=true; index=(index+1)%182`, and `load()` then reads `BANK.games[kind][index]`. So "Practice mix N" is the same board as daily edition N. The date input also offers `max=BANK.dates.at(-1)`, so any future date can be opened directly.
- **Failure example:** On 2026-11-01, James opens Candidate 04 and taps "Replay mix".
  - He now has the 2026-11-02 daily board, and the date field even shows `2026-11-02` while the tag says "Practice mix 2".
  - Practice and daily progress are saved under different storage keys, so tomorrow's daily opens fresh.
  - It can then be shared as a clean `Solved · 6 moves · 0 undos`.
- **Spillover:** `practice` and `index` are globals that survive `home` and `openGame()`. After one "Try another mix" in Candidate 01, opening Candidate 02 from the landing page loads Practice mix 2 instead of today's daily. Nothing on the landing page shows this.
- **Fix:**
  - Generate practice boards from a separate seed space, or a held-out bank.
  - Cap the date picker at today's Chicago date.
  - Reset `practice=false` and `index=today` when opening a game from the landing page.

For James's private comparison sessions this matters less. For anything shaped like a daily product, it defeats the premise.

---

## Important

### I1. Saved state is trusted wholesale [Demonstrated]
`load()` accepts any `raw.s` that has a truthy `.data` and `.status`. This causes three problems:

- **Wrong board (date identity).** The storage key is `…:${kind}:daily:${index}`. It contains neither the date nor `p.identity` or `p.seed`.
  - If the bank is regenerated or its start date shifts, saved state for index 0 attaches to a different board.
  - That includes `status:'won'`, a Candidate 05 placement whose `cells` overlap new blocked squares, or Candidate 09 masks.
  - **Fix:** key by `BANK.dates[index]` and store `p.identity`. Discard the save on mismatch.
- **A permanently broken edition.** Suppose a saved Candidate 07 state lacks `data.pulses`. Then `board()` throws on `s.data.pulses.length` during template evaluation, `innerHTML` never updates, and every reload repeats the error. The only recovery is clearing storage by hand.
  - **Fix:** validate the shape of the saved state per kind, wrap `render()`, and fall back to `initialState`.
- **Unescaped interpolation of persisted values.** These values reach `innerHTML` raw: `s.moves` and `s.undos` in `.panel-top`, `s.data.charges[i]` in Candidate 07, and `s.data.angle`/`s.data.power` in Candidate 08 (as text and inside `value="…"`).
  - A stored value like `"moves":"<img src=x onerror=…>"` would execute.
  - Exploitability needs a same-origin writer. Pages opened via `file://` may share one storage origin in some browsers; I have not verified this.
  - **Fix:** coerce numbers with `Number.isInteger` on load, and `esc()` everything that comes from storage.

### I2. Every action destroys keyboard focus [Demonstrated]
`render()` rebuilds `#app` through `innerHTML` after every commit, selection and slider change.

- Keyboard and screen-reader users are returned to `<body>` after each action and must tab back from the top.
- The range inputs are worst affected (Candidate 08 angle/power, Candidate 10 `run-step`). A keyboard arrow press fires `change`, which re-renders and drops focus. In practice this is one step per Tab journey.
- `#live` is also recreated every render and then mutated immediately by `notify()`. Some screen readers do not announce changes to a live region that was just inserted. I have not verified which ones.
- **Fix:**
  - Patch only the affected nodes, or restore focus by `data-*` selector after rendering.
  - Keep `#live` outside the re-rendered subtree.
  - Use `input` events for scrubbing.

### I3. Four candidates are not playable without sight [Demonstrated]
- **Candidates 01 and 10:** board cells are role-less `<div aria-label>`. ARIA 1.2 prohibits `aria-label` on generic elements, so walls, targets and beacons are typically not announced.
- **Candidate 03:** the edge SVG is `aria-hidden`. Nodes announce "Disc v, anchor i" but never which discs are connected, so only the crossing count is perceivable.
- **Candidate 05:** piece shapes are `aria-hidden` SVGs, and buttons read only "A Select". The shape type (I/O/T/L/S) is never stated.
- **Fix:**
  - Add `role="img"` or a grid/row/gridcell structure.
  - Give Candidate 03 a text adjacency list ("Disc 3 connects to 1, 5, 6").
  - Name each shape and its orientation in labels.

### I4. Candidate 03's "shortest solution" is 3 on every board [Inferred]
- **Mechanism:** The audit's kind-3 frontier loop asserts `Σ 21^d` for d < par, which is 463 when par = 3. Recomputing every per-board assertion from `tools/audit.mjs` gives:
  - 181 + 10 + 20 + 1820×5 + 182×(3+2+465+2+30+3+160+9+23+3) = **136,711**.
  - That exactly matches the evidence file.
- **What it means:** Any single board with par 4 would add 9,261 more assertions. So, assuming the shown audit is what produced that JSON, all 182 Candidate 03 boards have par exactly 3. With 7 anchors and 14 dihedral targets, almost nothing is farther than 3 swaps, and the generator rejects anything below 3.
- **Impact:**
  - The metric never varies.
  - Day-to-day difficulty comes only from finding which 3 swaps work.
  - Combined with constant values elsewhere (Candidate 04 is always 6 keys, Candidate 07 always 3 pulses, Candidate 10 always 6 slots), the sidebar stat carries little information for those games.

### I5. Candidate 06 can start already solved, and the audit doesn't check for it [Unverified]
- **Mechanism:** `initialState` always starts at `[0,1,2,3,4,5]`. `make6` draws `solution` uniformly at random and never compares it with that start.
- **Probability:** Each board has a 1/720 chance of starting solved, which is about a 22% chance that at least one of the 182 does.
- **Failure example:** If one does, the board resolves on the first "Check order" and shares as `Solved · 0 moves · 1 check`.
- **Fix:** Reject `solution` equal to the identity, or near it, and add a one-line audit assertion.

### I6. Assistance labelling can misstate an honest result [Demonstrated]
`study()` has no status guard and no confirmation. It also forces `status='won'` and sets `assisted=true`. `undo()` and `reset()` both preserve `assisted` permanently.

- **Example 1:** James solves Candidate 01 unaided, then opens "Study a solution" out of curiosity. His share permanently changes from `Solved` to `Assisted finish`.
- **Example 2:** After losing Candidate 09, studying replaces `Rival won` with `Assisted finish`, so the loss disappears from the share.
- The toast "Undo to return to your previous position" implies undo reverts everything. It restores the board but not the label.
- **Fix:**
  - Show a confirm step that states the label is permanent.
  - Record `firstOutcome` (solved, lost) before assistance and share both, e.g. "Solved, then studied".

---

## Minor

1. **Counters keep rising after the game ends [Demonstrated].**
   - Candidate 10's "Run program" has no `status` guard: each post-win run adds 1 move and calls `done()` again.
   - Candidate 06's `check-order` has no guard either: each post-win check adds 1 check.
   - Candidates 07 and 08 are guarded correctly.
2. **Resets are shared as undos [Demonstrated].** `reset()` increments `undos`, so three resets share as "3 undos". Either rename the counter ("rewinds") or count resets separately.
3. **Candidate 10 can render-crash after a specific sequence [Demonstrated].** `runStep` is not reset by `undo()` or `study()`. Repro:
   1. Run a program that crashes on its first command (`steps=[]`).
   2. Tap "Study a solution".
   3. Drag the review slider to 7.
   4. Tap Undo.

   `pose = run.steps[-1]` is `undefined`, and `pose.cell` throws. The DOM stays stale until the next commit or reload. Separately, scrubbing only updates on release.
4. **Candidate 05 lifts pieces unexpectedly [Demonstrated].** With piece B selected, tapping a cell occupied by piece A lifts A instead of rejecting the tap. This costs a move and changes the selection. Lifting also resets orientation to view 1 rather than the piece's placed orientation.
5. **Candidate 02 controls [Demonstrated].**
   - Tapping any beat, including one inside the strip, moves the strip's start to that beat and charges |Δ| moves without warning.
   - Arrow aria-labels say "strip 1–5" while the visible labels are A–E.
   - Bar heights cap at 105px, so totals of 10–15 look identical. Only the numbers distinguish them.
6. **Phone width [Demonstrated].**
   - At ≤780px, `.guide>.metrics` is hidden, so the par target for Candidates 01–03 is invisible on phones.
   - Candidate 02 strip cells and arrows are about 28px wide at 375px, about 26px at 360px and about 21px at 320px. That last size is below WCAG 2.5.8's 24px minimum.
   - Candidate 08's SVG axis labels render around 8px.
7. **Date handling [Demonstrated].**
   - A date outside the bank silently falls back to index 0 (`Math.max(0,-1)`).
   - There is no midnight rollover for a page left open.
   - The timezone is fixed to America/Chicago for everyone. That may be intended.
8. **Candidate 08 [Unverified/subjective].** The default 45°/12 lands at roughly 11.7–17.7m depending on wind. The tip recommends that exact shot, so some targets may be hit without any aiming, and the audit doesn't check for it. The aiming space is also only 11×9 = 99 discrete combinations.
9. **Candidate 10 move counting [Demonstrated].** Moves combine slot edits and runs, and the sidebar's "6 program slots" reads like a par next to the move counter.
10. **Bundle fragility [Uncertain].**
    - `app.mjs` has no imports and calls `key()`, which `engine.mjs` does not export. It therefore depends on concatenation into a shared scope.
    - Under classic-script concatenation, `function top()` would collide with the non-configurable `window.top` and likely throw. The author's Chrome flows suggest the real bundle avoids this, but I can't see it.
    - Dead code: `animation`, `stopAnimation`'s interval and `hash`.
11. **Candidate 07 animation replays [Demonstrated].** The stale `lastCascade` replays the spark animation on every re-render and on undo.
12. **Audit coverage gaps [Demonstrated].**
    - The share-spoiler test passes trivially because `shareText` never reads `s.data`.
    - Determinism is checked only for boards 0 and 181.
    - The Candidate 09 audit is circular, which the evidence file discloses.
    - No audit covers `commit`, `undo`, `load` or `study`. That coverage rests on the author's Chrome flows.
13. **Unhandled share-image failure.** `imageBlob()` uses `roundRect`. On browsers without it, the promise rejects and `shareAction` never updates the status.
14. **Wording.** The header pill says "10 replacement candidates", but the scope text says the existing collection is unchanged.

---

## Checked and consistent with the engine

- **Candidates 01 and 03:** par comes from a BFS shortest path and is independently re-verified.
- **Candidate 02:** "minimum shifts" equals the sum of starts. That is correct because the solution is unique and play starts from all zeros.
- **Candidate 07:**
  - Restricting the search to non-decreasing pulse orders is sound. Sandpile odometers are abelian, so the fired set is order-independent.
  - The audit's pair check (b ≥ a) is therefore exhaustive.
- **Uniqueness:** Candidates 04, 06 and 10 have unique solutions, checked by independent brute force.
- **Candidate 05:** the UI makes no uniqueness claim, and the evidence file says multiple tilings are possible.
- **Candidate 08:** solutions lie inside the slider ranges and land within 0.05m, so "every target is reachable" holds.
- **Candidate 09:**
  - The rival is exact minimax with a fixed tie-break.
  - The stored margin of 1–5 guarantees a winning line exists.
  - Undo rewinds a full turn, as documented.
- **Share payload:** an allowlist of kind, edition, outcome, moves, checks and undos. It contains no board data, picks or solution.
- **Counters:** moves, checks and undos never decrease through undo or reset.
- **Escaping:** `esc()` is applied to toasts, result detail and the share textarea.

---

## Suggested trial order (my subjective prediction, not a rating)

Based only on how much decision space each mechanic seems to offer:

1. **10, 1, 9, 7** first. These look like the deepest planning loops.
2. **6, 2, 5** next.
3. **4, 8, 3** last. Candidate 04 is always 6 keys with a single valid order, Candidate 08 is a small lookup space, and Candidate 03 appears to be par 3 every day.

Your play will override this. The keeper decision and the fun ranking are yours.
