### Static Code & Design Review: Harder Contextual Spare Preview

> [!NOTE]
> **Review Basis**: Static source inspection of `engine.mjs`, `app.mjs`, `styles.css`, `scripts/spare-preview.test.mjs`, and `HARDER-PREVIEW.md`. Per instructions, this is a read-only review without tool executions, network actions, human playtesting claims, or screenshot assertions. "DeepSeek" is acknowledged strictly as concept attribution.

---

### 1. Defects & Vulnerabilities

#### Critical Defects
None identified that cause unhandled data corruption, infinite loops, or game-breaking crashes under intended use.

#### Important Defects

1. **Rapid Double-Tap / Double-Click Word Displacement & Slot Eviction**
   - **Source**: `app.mjs` (lines 66–72)
   - **Exact Trigger**: 
     1. Slot 0 is active (`active = 0`).
     2. A user double-clicks or double-taps a word button in the bank (e.g. `LIGHT` / word 0).
     3. On the first click event: Word 0 is placed in slot 0; `active` advances to the next empty slot (`active = 1`).
     4. On the rapid second click event: Word 0 is clicked again while `active === 1`. `placePreview(s, 1, 0)` detects Word 0 at `previous = 0`, swaps `slots[0]` with `slots[1]` (which is `null`), and places Word 0 into slot 1.
     5. **Observed Behavior**: Word 0 jumps to slot 1, leaving slot 0 unexpectedly vacant (`null`). This frequently affects mobile/touch users attempting to tap firmly to select.

2. **Uncaught `TypeError` in `mountOriginal()` if `.mode-switch` is Missing**
   - **Source**: `app.mjs` (line 25)
   - **Exact Trigger**:
     ```javascript
     document.querySelector('.mode-switch').after(link);
     ```
     When navigating to `#daily`, if `mountDailyGame` renders a layout where `.mode-switch` is omitted, delayed, or renamed, `querySelector` returns `null`. Accessing `.after()` immediately throws an uncaught `TypeError: Cannot read properties of null (reading 'after')`, halting further script execution.
   - **Fix**: Use optional chaining or check existence before calling `.after()`.

3. **Pluralization Grammar Defect and Post-Loss Prompt in Feedback Message**
   - **Source**: `engine.mjs` (line 38)
   - **Exact Trigger**:
     ```javascript
     `${correct} of 4 pairs fit their contexts. ${4-checks.length} checks left. Which meanings could you reconsider?`
     ```
     - **Trigger A (Grammar)**: On the 3rd incorrect check (`checks.length === 3`), `4 - checks.length === 1`. The status message outputs `"1 checks left."` instead of `"1 check left."`.
     - **Trigger B (Post-Loss State)**: On the 4th incorrect check (`checks.length === 4`), `4 - checks.length === 0`. The message displays `"0 checks left. Which meanings could you reconsider?"` even though the player has exhausted all checks, the round is lost, and the solution explanations are shown.

---

### 2. Semantic Assessment of the PREVIEW Board

* **The 9 Words**: `LIGHT`, `HEAVY`, `FLAT`, `SHARP`, `DULL`, `BRIGHT`, `SOFT`, `LOUD`, `DARK`
* **The 4 Clues**:
  1. *Porter lifts a suitcase* (`Sense: Think about weight`) $\rightarrow$ **`LIGHT` ↔ `HEAVY`**
  2. *Singer misses the intended note* (`Sense: Think about pitch, not volume`) $\rightarrow$ **`FLAT` ↔ `SHARP`**
  3. *Polished gem catches the light* (`Sense: Think about lustre, not colour`) $\rightarrow$ **`DULL` ↔ `BRIGHT`**
  4. *Radio plays in the next room* (`Sense: Think about volume, not pitch`) $\rightarrow$ **`SOFT` ↔ `LOUD`**
* **The Intended Spare**: **`DARK`**

#### Alternative Matchings & Code Rejection Analysis
- **Uncontextualized Antonym Trap (`LIGHT` ↔ `DARK`)**:
  In a clue-less game, `LIGHT` naturally pairs with `DARK`. However, doing so isolates `HEAVY`, which has no other partner in the word bank (none of the other 7 words describe weight). The clue for Context 1 strictly forces `LIGHT` ↔ `HEAVY`.
- **Lustre vs. Colour Trap (`BRIGHT` ↔ `DARK`)**:
  A player might casually think a gem catching light can be "bright" or "dark". However:
  1. The clue specifically states: `Sense: Think about lustre, not colour`. Lustre refers to shine/reflectance (dull vs. bright), whereas dark refers to tone/hue.
  2. If `BRIGHT` and `DARK` were paired in Context 3, the remaining word would be `DULL`, which cannot pair with any remaining context.
- **Pitch vs. Volume Distractors**:
  `FLAT`/`SHARP` and `SOFT`/`LOUD` are cross-domain acoustic pairs. Contexts 2 and 4 explicitly negate the opposing domain (`not volume` / `not pitch`), preventing ambiguity.
- **Code Acceptance Verdict**:
  `correctRows` strictly checks `Math.floor(slots[2*i]/2) === i` for both slots in each context row. Reversing word order within a pair (e.g. `HEAVY` ↔ `LIGHT`) is fully accepted.
- **Semantics Fairness**:
  **Fair and uniquely solvable.** There is no alternative global matching across all 4 contexts that the code incorrectly rejects. The sense sub-clues provide clear domain boundaries without giving away the exact answer.

---

### 3. Qualitative Difficulty Assessment

- **Cognitive Paradigm Shift**:
  The original Spare game was a direct 1-to-1 surface antonym matching puzzle with low friction (players could pair `LIGHT` with `DARK` immediately on sight). The contextual revision elevates difficulty by introducing **polysemy and constraint satisfaction**:
  - `LIGHT` spans weight vs. illumination.
  - `SHARP` spans cutting edge vs. musical pitch.
  - `DULL` spans blunted edge vs. lack of lustre.
  - `SOFT` spans physical texture vs. acoustic volume.
- **Deductive Pressure**:
  Feedback provides aggregate counts only ($0–4$ correct rows) rather than row-by-row confirmation. A solver who pairs `LIGHT` ↔ `DARK` will see at most 2 correct rows (pitch and volume), forcing them to analyze which pair to break over their 4 allowed checks.
- **Qualitative Level**:
  Noticeably harder than the original game, but well-calibrated for daily puzzle solvers. It replaces speed-matching with deductive elimination without relying on obscure vocabulary.

---

### 4. Technical Engine, State & Storage Verification

#### Verified Source Findings
1. **Save Validation (`restorePreview`)**:
   - Recomputes `correctRows` on every check in history to verify score integrity against tampering (`c.correct === correctRows(c.slots)`).
   - Verifies that all checked layouts contain 8 non-null unique tiles, have unique keys (no duplicate historical layout records), and that checks do not exceed 4.
   - Enforces terminal state consistency: once `won` or `lost`, `layoutKey(r.slots)` must match the final check key `keys.at(-1)`, and `revealed` must be `false`.
2. **Tile Swaps & Rack Logic (`placePreview`)**:
   - Accurately swaps tiles if an already placed word is placed into another space (`slots[previous] = slots[slot]; slots[slot] = word`).
   - Correctly clears slots when `word === null`.
   - Freezes mutations as soon as `previewStatus !== 'playing'`.
3. **Four-Check & Repeated Layout Logic (`checkPreview`)**:
   - Normalizes pairs within each row using numerical sorting (`slots.slice(i, i+2).sort((a,b)=>a-b)`). Reversing words within any row yields an identical layout key.
   - Checks `s.checks.some(c => layoutKey(c.slots) === key)` and consumes 0 checks on equivalent resubmissions.
   - Transitions to `won` on 4 correct rows and `lost` on the 4th distinct check.
4. **Interface, Accessibility & Touch**:
   - Accessible labels on slots and word tiles convey context number, space number, word, and placement state.
   - Word tile focus is preserved after selection via `replacement.focus({preventScroll:true})`, enabling rapid sequential keyboard placement.
   - Minimum target dimensions meet touch criteria: slots $\ge 47\text{px}$, words $\ge 59\text{px}$, buttons $\ge 44\text{px}$.
5. **Daily Isolation**:
   - Storage key is isolated: `deepseek-spare:context-preview:v1` vs. daily runtime store.
   - Schema is separate: Preview `{sampleId, slots, checks, revealed}` vs. Daily `{solved, mistakes, selected, order, shuffles, hintPair, hinted, revealed}`.
   - Routing: `#daily` loads the original game; default loads the preview sample.

#### Inferences & Unverified Guesses (Reported Separately)
- *Guess*: In mobile viewports $\le 660\text{px}$, `.preview-rack` switches from `position: sticky` to `position: static` below the 4 context rows. On smaller mobile screens (e.g. 667px height), players who want to adjust earlier rows may experience vertical scroll fatigue, though the auto-advance mechanism partially mitigates this during initial entry.

---

### 5. Two Useful Improvements

1. **Guard Against Rapid Double-Tap Move-Back**:
   In `app.mjs` line 67, verify whether `word` is already placed in another slot before auto-advancing `active`. If a word was moved rather than freshly placed from the bank, do not advance `active` to the next empty slot; instead, set `active` to the slot that was just vacated or keep focus stable, preventing accidental multi-placement from fast clicking.

2. **Grammar & Terminal Feedback Cleanup in `checkPreview`**:
   Adjust the check return string to handle singular/plural and terminal states cleanly:
   ```javascript
   const remaining = 4 - checks.length;
   const message = correct === 4
     ? 'All four contexts matched.'
     : remaining === 0
       ? 'Four checks used. Here is how the contextual pairs fit.'
       : `${correct} of 4 pairs fit their contexts. ${remaining} ${remaining === 1 ? 'check' : 'checks'} left. Which meanings could you reconsider?`;
   ```

