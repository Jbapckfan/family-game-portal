### 1. Clue Fairness & Wrongly Rejected Answer Pairs
* **Clue Mismatch:** *"Sharp without a blade"* relies on a figurative idiom ("sharp tongue") rather than the clued noun itself, clashing with the literal anatomical definition (*"The organ in your mouth..."*).
* **Plausible Wrongly Rejected Pair:** The rack (`R A O E L G T C N R S U E I D O`) fully supports **GENIUS** (`G-E-N-I-U-S`) alongside **RECORD** (`R-E-C-O-R-D`), leaving exactly four decoys (`A, L, O, T`). "Genius" (a keen/sharp person without a blade) and "Record" (*"Broken at someone’s best"*) fit the clues and rack multiplicities, but [engine.mjs](file:///games/deepseek-split/engine.mjs) strictly hardcodes `p.words[row] === 'TONGUE'`, wrongly rejecting this valid solution.

### 2. Touch & Keyboard Focus Defects
* **Focus Stealing & DOM Trashing:** In [app.mjs](file:///games/deepseek-split/app.mjs), `update()` wipes and rebuilds `board.innerHTML` on every keystroke, slot click, and tile placement, then forcibly executes `board.focus()`. Tabbing through rack tiles or action buttons (`#preview-undo`, `#preview-clear`, `#preview-check`) loses keyboard focus on every press.
* **Touch Side-Effects:** Re-instantiating all interactive elements during active touches causes tap stutter and draws container outline focus rings on mobile.
* **Asymmetric Announcements:** Typing `Backspace` calls `update(E.undo(p,s))` with an empty message, wiping `#preview-message`, whereas clicking the "Undo" button displays `"Letter returned."` Arrow key navigation switches rows silently without updating status or announcing row selection.

### 3. Save & Terminal State Validity
* **Schema Coupling:** [restorePreview()](file:///games/deepseek-split/engine.mjs#L73-L77) delegates to `restoreState()`, which rejects any saved state where `raw.hints` is missing or not an integer (`!integer(raw.hints)`). Because the harder preview replaces hints with `definitions`, `hints: 0` remains dead baggage required purely to pass validation.
* **Storage Isolation & Terminal Lock:** Isolation is correct (`deepseek-split:harder-preview:v1` does not collide with daily storage). `getStatus !== 'playing'` properly locks further mutation once solved or revealed.

### 4. Share Spoilers & Clipboard Handling
* **Spoiler-Free:** `previewShare()` leaks no solution words, placed letters, or decoy identities; it outputs only completion status, check counts, and definitions used.
* **Fallback Defect:** When `navigator.clipboard.writeText` rejects (unfocused document, denied permissions, or non-secure context), `catch` dumps the entire multi-line share payload into `#preview-message` (`class="status-note"`), overflowing an inline status element rather than presenting a selectable text area.
