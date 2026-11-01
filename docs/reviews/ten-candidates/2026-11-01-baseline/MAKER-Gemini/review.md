# Static Review: Alford Daily Candidates (01–10)

**Provenance & Review Context:**
- **Evaluator Model**: Gemini 3.8 Flash (High)
- **Source Files Reviewed**: [`engine.mjs`](file:///private/tmp/MAKER-Gemini__ten-candidates-20261101/engine.mjs), [`app.mjs`](file:///private/tmp/MAKER-Gemini__ten-candidates-20261101/app.mjs), [`styles.css`](file:///private/tmp/MAKER-Gemini__ten-candidates-20261101/styles.css), [`tools/audit.mjs`](file:///private/tmp/MAKER-Gemini__ten-candidates-20261101/tools/audit.mjs), [`manifest.json`](file:///private/tmp/MAKER-Gemini__ten-candidates-20261101/manifest.json)
- **Supplied Evidence**: [`evidence/MAKER-Codex__audit.json`](file:///private/tmp/MAKER-Gemini__ten-candidates-20261101/evidence/MAKER-Codex__audit.json) (182 prepared editions each, 1,820 boards, 136,711 assertions). *Treated as author evidence, not independently executed.*
- **Scope & Constraints**: 100% static analysis. No code execution, runtime mutation, network access, or solution leakage.

---

## 1. Executive Summary & Verification of Author Claims

1. **Solvability & Uniqueness Claims**:
   - **Candidate 01 (Twin Glider)**: Guaranteed solvable via BFS; claims par as shortest solution (7–12 moves). Validated.
   - **Candidate 02 (Skyline Wave)**: Exact decomposition verified via exhaustive recursive search; exactly 1 unique shift combination. Validated.
   - **Candidate 03 (Untangle)**: Outerplanar polygon triangulation guarantees a 0-crossing circular layout exists. Shortest swap sequence verified via BFS. Validated.
   - **Candidate 04 (Arithmetic Sequencing)**: Filtered for exactly 1 permutation out of 720 ($6!$) reaching the target within $[1, 199]$. Uniqueness is mathematically proven.
   - **Candidate 05 (Exact Cover Tetrominoes)**: Exact cover search validates at least one tiling. Correctly claims no par and open/multiple solutions.
   - **Candidate 06 (Relational Deduction)**: Clue filtering guarantees 1 unique permutation. *However, generator lacks a non-identity start check (see Finding 1).*
   - **Candidate 07 (Sandpile Cascade)**: Abelian property guarantees confluence. Oracle verification confirms no 1- or 2-pulse solution exists; par 3 is the true minimum. Multiple 3-pulse solutions permitted (up to 35). Validated.
   - **Candidate 08 (Discrete Ballistics)**: Analytical discrete trajectory equations. Solutions are pre-calculated to land within $\le 0.05\text{m}$ of target. Validated.
   - **Candidate 09 (Alternating Draft)**: Full zero-sum minimax tree ($3^{10} = 59,049$ states). Generator filters for margin $\ge 1$, guaranteeing the player has a forced win under perfect play. Validated.
   - **Candidate 10 (Loop Programming)**: Exhaustive search across all $3^6 = 729$ programs confirms exactly 1 unique program satisfies all constraints. Validated.

2. **Honesty & Integrity**:
   - **Move & Undo Counting**: Truthful. `undo()` and `reset()` increment cumulative move and undo metrics rather than erasing attempts.
   - **Assistance**: Irreversible taint. Invoking `study()` sets `assisted = true`, which persists even if the user clicks `undo()`. Shared text reflects `Assisted finish`.
   - **Share Data**: Completely spoiler-free. Contains only Candidate ID, edition/date, status, moves, checks, and undos. No board states, coordinates, or inputs leaked.
   - **Dynamic HTML Safety**: Dynamic strings (`edition()`, `lastToast`, `resultDetail()`, `shareText`) are escaped via `esc()` or assigned via `textContent`. Board cells render trusted numeric/coordinate markup.

---

## 2. Categorized Findings

### Critical Findings
*None identified that would cause runtime crashes in an unaltered bank or allow remote code injection.*

---

### Important Findings

#### 1. Candidate 06: Missing guard allows puzzles to generate in an already-solved starting state
- **Mechanism**: [`engine.mjs#L47`](file:///private/tmp/MAKER-Gemini__ten-candidates-20261101/engine.mjs#L47) (`make6`) and [`engine.mjs#L70`](file:///private/tmp/MAKER-Gemini__ten-candidates-20261101/engine.mjs#L70) (`initialState`).
- **Demonstrated Issue**: In [`make6(r)`](file:///private/tmp/MAKER-Gemini__ten-candidates-20261101/engine.mjs#L47), `solution = shuffle(r, [0,1,2,3,4,5])`, and [`initialState`](file:///private/tmp/MAKER-Gemini__ten-candidates-20261101/engine.mjs#L70) initializes `s.data = [0,1,2,3,4,5]`. While Candidate 01 (`JSON.parse(s).every((c,i)=>c!==start[i])`), Candidate 03 (`crossings >= 7`), and Candidate 04 (`v !== p.start`) explicitly reject starting states identical to the solution, Candidate 06 contains no check verifying `key(solution) !== key([0,1,2,3,4,5])`.
- **Concrete Failure Scenario**: With a uniform random shuffle across 720 permutations, there is a $\approx 1/720$ probability per board ($\approx 22.4\%$ chance across 182 daily editions) that `solution` equals `[0,1,2,3,4,5]`. In this event, a player opens the daily edition, presses "Check order" on move 0 without making a single swap, and immediately triggers `status = 'won'`.

#### 2. Candidates 01 and 07: "Study a solution" fails to reveal the actual solution route
- **Mechanism**: [`app.mjs#L66`](file:///private/tmp/MAKER-Gemini__ten-candidates-20261101/app.mjs#L66) (`study()`), [`app.mjs#L43`](file:///private/tmp/MAKER-Gemini__ten-candidates-20261101/app.mjs#L43) (`board()` kind 1), and [`app.mjs#L49`](file:///private/tmp/MAKER-Gemini__ten-candidates-20261101/app.mjs#L49) (`board()` kind 7).
- **Demonstrated Issue**:
  - In Candidate 01 (Twin Glider), `study()` sets `n.data = [...p.goal]`. The board renders discs A and B sitting on their targets, but does not display or animate the 7–12 direction vector path stored in `p.solution`. The user cannot see what moves reach that state.
  - In Candidate 07 (Sandpile Cascade), `study()` simulates the 3 pulses, setting charges and `n.data.fired = 65535`. However, [`board()`](file:///private/tmp/MAKER-Gemini__ten-candidates-20261101/app.mjs#L49) contains no UI element or visual indicator representing `s.data.pulses`. The board displays 16 awake squares, but leaves the player completely blind as to which 3 coordinates triggered the cascade.
- **Concrete Failure Scenario**: A player unable to solve Candidate 01 clicks "Study a solution". The prompt states "A route worth studying", but no directional arrows or moves appear on screen. Undoing leaves the player with no learned information.

#### 3. Candidate 08: Trajectory curve disappears instantly upon hitting a target
- **Mechanism**: [`app.mjs#L50`](file:///private/tmp/MAKER-Gemini__ten-candidates-20261101/app.mjs#L50) (`board()` kind 8) and [`app.mjs#L64`](file:///private/tmp/MAKER-Gemini__ten-candidates-20261101/app.mjs#L64) (`launch()`).
- **Demonstrated Issue**: In [`board()`](file:///private/tmp/MAKER-Gemini__ten-candidates-20261101/app.mjs#L50):
  ```javascript
  const stage = p.stages[Math.min(2, s.data.stage)],
        shot = s.data.shots.at(-1),
        path = shot && shot.stage === Math.min(2, s.data.stage) ? trajectory(shot.angle, shot.power, stage.wind) : null;
  ```
  When a launch hits Target 1 or Target 2, [`launch()`](file:///private/tmp/MAKER-Gemini__ten-candidates-20261101/app.mjs#L64) records `shot.stage = 0` (or `1`) and immediately increments `n.data.stage` to `1` (or `2`). When [`render()`](file:///private/tmp/MAKER-Gemini__ten-candidates-20261101/app.mjs#L34) runs, `shot.stage === Math.min(2, s.data.stage)` evaluates to `0 === 1` (false). Thus `path` becomes `null`.
- **Concrete Failure Scenario**: Whenever the player lands a successful shot on Target 1 or 2, the trajectory line is wiped from the canvas instantly, jumping immediately to a blank sky for the next target. The trajectory arc is only displayed when the player *misses*.

#### 4. Candidates 08 and 10: Sliders listen only to `change`, freezing visual feedback during touch drag
- **Mechanism**: [`app.mjs#L70`](file:///private/tmp/MAKER-Gemini__ten-candidates-20261101/app.mjs#L70).
- **Demonstrated Issue**: Global range inputs (`angle`, `power`, `run-step`) are bound exclusively to the `change` event:
  ```javascript
  document.addEventListener('change', e => {
    if (e.target.id === 'run-step') { runStep = Number(e.target.value); render(); return; }
    if (e.target.id === 'angle' || e.target.id === 'power') { s.data[e.target.id] = Number(e.target.value); store(); render(); }
  });
  ```
  In standard browser DOM specifications, `<input type="range">` fires `input` continuously while dragging, but `change` fires only after pointer release.
- **Concrete Failure Scenario**:
  - In Candidate 08, dragging the angle or power slider leaves the displayed readout (`<strong>${s.data.angle}°</strong>`) completely static; it updates only after releasing the finger/cursor.
  - In Candidate 10, the loop review slider does not scrub the robot along the path while dragging; the robot jumps only after release.

#### 5. Storage: Saved states lack schema validation and identity verification
- **Mechanism**: [`app.mjs#L20-L22`](file:///private/tmp/MAKER-Gemini__ten-candidates-20261101/app.mjs#L20-L22) (`storageKey()`, `load()`).
- **Demonstrated Issue**:
  1. The key is ``MAKER-Codex-candidates:v1:${kind}:${practice?'practice':'daily'}:${index}``. It does not record `p.identity` or seed. If the game bank is reordered or re-seeded, saved games are loaded into mismatched board geometries.
  2. [`load()`](file:///private/tmp/MAKER-Gemini__ten-candidates-20261101/app.mjs#L22) validates only `if (raw && raw.s?.data && raw.s.status)`. There is no schema validation for inner properties (`s.data.shots`, `s.data.pulses`, `s.data.human`).
- **Concrete Failure Scenario**: If a player's `localStorage` contains an older or corrupted structure where `s.data.shots` is undefined, loading Candidate 08 causes [`board()`](file:///private/tmp/MAKER-Gemini__ten-candidates-20261101/app.mjs#L50) to crash with an unhandled `TypeError: s.data.shots.at is not a function`, rendering the page blank for that edition until manually cleared.

---

### Minor Findings

#### 6. Candidate 02: Tight mobile touch targets and ambiguous column-tap mechanics
- **Mechanism**: [`app.mjs#L44`](file:///private/tmp/MAKER-Gemini__ten-candidates-20261101/app.mjs#L44) and [`styles.css#L5`](file:///private/tmp/MAKER-Gemini__ten-candidates-20261101/styles.css#L5).
- **Demonstrated Issue**: On viewports $\le 430\text{px}$ (e.g., iPhone standard 375px), `.strip-row` compresses 8 strip cells into $\approx 27.8\text{px}$ width and the shift buttons into $28\text{px}$ width (below the standard 44px touch recommendation). Additionally, tapping column $j$ jumps the strip's *left anchor* to column $j$ via `waveShift(i, Math.min(j, 8 - a.length))`. Tapping the right half of an already-placed strip unexpectedly shifts it right and deducts moves.

#### 7. Missing keyboard accessibility on desktop for Candidates 02, 04, and 10
- **Mechanism**: [`app.mjs#L71`](file:///private/tmp/MAKER-Gemini__ten-candidates-20261101/app.mjs#L71).
- **Demonstrated Issue**: Keyboard listeners are implemented only for Candidate 01 (`if (kind === 1 ... ArrowUp/Down/Left/Right)`). Candidates with clear, discrete keyboard equivalents—Candidate 04 (number keys 1–6 for operations) and Candidate 10 (`F`, `L`, `R` for commands)—require manual pointer clicks.

#### 8. Toast notification rendering order desynchronization
- **Mechanism**: [`app.mjs#L26`](file:///private/tmp/MAKER-Gemini__ten-candidates-20261101/app.mjs#L26) (`commit`) and action event handlers.
- **Demonstrated Issue**: In handlers such as `selectSwap`, `commit()` is called first (triggering [`render()`](file:///private/tmp/MAKER-Gemini__ten-candidates-20261101/app.mjs#L34), which binds `${esc(lastToast || m.first)}`), and only afterwards is `notify(message)` executed. Although `notify()` updates `#live.textContent` directly, `lastToast` is one lifecycle step out of phase with HTML template rendering.

---

## 3. Recommended Playable Trial Order

> [!NOTE]
> **Subjective Evaluation Order Prediction** (Structured by mechanic variety, cognitive ramp, and tactile feedback; does not reflect any operator ranking).

1. **Candidate 04 (Arithmetic Sequencing)**: Immediate mental feedback; calculation tape makes the chain of thought visible.
2. **Candidate 01 (Twin Glider)**: Intuitive spatial puzzle with instant frictionless sliding feedback.
3. **Candidate 07 (Abelian Sandpile Cascade)**: Highly engaging chain-reaction mechanics; satisfying energy toppling within a tight 3-tap budget.
4. **Candidate 05 (Exact Cover Tetrominoes)**: Classical polyomino packing; intuitive piece placement and orientation adjustments.
5. **Candidate 03 (Untangle)**: Visual planar knot untangling; live crossing count and pink collision highlighting provide steady progress.
6. **Candidate 09 (Alternating Draft)**: Distinct competitive dynamic; dueling an exact minimax AI creates strong tactical engagement.
7. **Candidate 10 (Loop Programming)**: Algorithmic route planning; watching the loop repeat three times to hit all beacons is very rewarding.
8. **Candidate 06 (Relational Deduction)**: Methodical logic-grid deduction with weights and relational positioning.
9. **Candidate 02 (Skyline Wave)**: Interesting additive wave math, though mobile touch controls are slightly cramped.
10. **Candidate 08 (Discrete Ballistics)**: Physics-based trajectory estimation; best experienced after benchmarking the pure discrete logic titles.

