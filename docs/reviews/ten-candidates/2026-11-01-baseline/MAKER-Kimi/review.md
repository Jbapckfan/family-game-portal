Static review only; nothing was executed, changed, or fetched. The bank and runtime HTML were not supplied, so the audit totals, pointer flows, and DOM packing certificates remain author-reported evidence.

## Critical

No critical gameplay or generation defect is demonstrated by the supplied code.

## Important

1. **Saved state is trusted without schema or puzzle-state validation.**  
   `app.mjs:22` accepts any parsed `s` with truthy `data` and `status`, and assigns `history` without checking it is an array.
   - A saved `status:"won"` can produce a solved/shared result without a completed board.
   - Candidate 08 with a negative saved `stage` reaches `stage.wind` with `stage === undefined` at `app.mjs:50`, breaking rendering.
   - This also creates a **stored HTML-injection path**: `s.moves` and `s.undos` are interpolated unescaped into `innerHTML` at `app.mjs:38`; Candidate 08’s saved angle/power are similarly interpolated at `app.mjs:50`. A crafted same-origin local-storage value can therefore inject markup/event handlers. Ordinary play and shared text do not themselves provide that input, so exploitation requires another mechanism capable of writing the save.

2. **Assisted in-progress games are shared as “Assisted finish.”**  
   `study()` marks the state assisted (`app.mjs:66`), while undo and reset preserve that flag but restore/create a playing state (`app.mjs:27-28`). `shareText()` checks `s.assisted` before `s.status` (`engine.mjs:71`).  
   Concrete sequence: study a solution, then undo or reset. The panel returns to “YOUR TURN,” but sharing says “Assisted finish” despite no finished position. The outcome should reflect both dimensions independently rather than letting assistance override status.

3. **Reset is falsely counted as an undo.**  
   `reset()` increments `n.undos` at `app.mjs:28`. Consequently, a player’s first “Reset board” produces “1 undo” in the UI and shared result without any undo action. Move/check retention is separately implemented as advertised; the undo total is the inaccurate part.

4. **Daily date identity fails outside the prepared range.**  
   At startup, `Math.max(0, BANK.dates.indexOf(initialDate))` (`app.mjs:17-18`) maps every unknown date to index zero. Thus, after the final prepared day, “Daily edition” silently opens the first day rather than reporting that no current edition exists.  
   Additionally, an out-of-range date-picker change only calls `notify()` (`app.mjs:70`): it neither restores the input nor re-renders. The picker can therefore display one date while the board and share payload still use another.

5. **Whole-app rendering repeatedly discards keyboard focus.**  
   `render()` replaces all of `#app.innerHTML` (`app.mjs:34-38`), and ordinary actions call it through `commit()` (`app.mjs:26`) and numerous selection/change handlers. No focus restoration exists.  
   For example, activating an arithmetic operation removes the focused button, forcing keyboard users to relocate their position for the next key. Candidate 08’s aim sliders and Candidate 10’s run-review slider are also recreated on `change` (`app.mjs:70`), disrupting sequential keyboard adjustment.

6. **Several phone-width controls become too narrow for reliable touch input.**  
   Under the 430px rules in `styles.css:5`, Candidate 02 uses eight flexible strip columns plus fixed columns. At a 320px viewport, its strip buttons calculate to roughly **21px wide**, with arrow buttons explicitly only **28×37px**. Candidate 06’s six artifact buttons and Candidate 10’s six program slots are roughly **40px wide** at the same viewport. These are core, repeatedly used controls, not incidental targets.

7. **Candidate 08 lacks a legible nonvisual/numeric target readout.**  
   The target distance exists only as SVG geometry (`app.mjs:50`); the heading shows target number and wind, not `stage.target`. The SVG’s accessible label merely says “Trajectory course and landing zone.” On a narrow phone, the 740-unit viewBox scales its 19-unit axis labels to roughly 7px, while the bullseye stripe becomes about 1px wide. This makes precise aiming unnecessarily visual and leaves screen-reader users without the current target distance.

## Minor

- **Post-finish actions can inflate totals.** Candidate 06’s “Check order” and Candidate 10’s “Run program” remain actionable after victory; their handlers at `app.mjs:69` lack a playing-status guard. Checks or runs performed after completion therefore increase the shared attempt totals.
- **Candidate 08’s assisted display contradicts itself.** Studying from a fresh board installs three solution shots but preserves zero moves (`app.mjs:66`). The panel consequently says “0 shots,” while `resultDetail()` reports “3 launches” (`app.mjs:38,40`).
- **Practice progress is saved but not directly resumed.** Every reload initializes `practice=false` and the daily index (`app.mjs:16-18`); returning to a saved practice mix requires cycling through “Replay mix.” Daily/practice storage keys themselves are correctly separated (`app.mjs:20`).

The core shortest-solution, uniqueness, exact-cover, cascade, minimax, and exhaustive-program mechanisms are consistent with their advertised claims on static inspection. Sharing also uses an allowlist and does not include boards, picks, or solutions (`engine.mjs:71`). These code-level observations do not independently validate the supplied whole-bank audit counts.
