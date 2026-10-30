### Shortlist: Fourth Individual Game Review

#### Disclosures & Inspection Scope
Inspected files in this workspace: [app.mjs](file:///private/tmp/MAKER-Gemini__shortlist-review-20261030/games/shortlist/app.mjs), [engine.mjs](file:///private/tmp/MAKER-Gemini__shortlist-review-20261030/games/shortlist/engine.mjs), [shell.mjs](file:///private/tmp/MAKER-Gemini__shortlist-review-20261030/games/shortlist/shell.mjs), [content-identity.mjs](file:///private/tmp/MAKER-Gemini__shortlist-review-20261030/games/shortlist/content-identity.mjs), [index.html](file:///private/tmp/MAKER-Gemini__shortlist-review-20261030/games/shortlist/index.html), [styles.css](file:///private/tmp/MAKER-Gemini__shortlist-review-20261030/games/shortlist/styles.css), [manifest.json](file:///private/tmp/MAKER-Gemini__shortlist-review-20261030/manifest.json), and [strategy-audit.json](file:///private/tmp/MAKER-Gemini__shortlist-review-20261030/output/shortlist-review-20261030/strategy-audit.json). Examined both desktop ([before-1440.png](file:///private/tmp/MAKER-Gemini__shortlist-review-20261030/output/shortlist-review-20261030/before-1440.png)) and mobile ([before-390.png](file:///private/tmp/MAKER-Gemini__shortlist-review-20261030/output/shortlist-review-20261030/before-390.png)) screenshots via image inspection. In accordance with user standing rules and instructions, this review is strictly read-only: no code was written, and no tests or scripts were executed.

---

#### Provisional Scores (Predictions, 1–5 Scale)
- **Fun: 4/5** — High-caliber deductive tension. Asking *which* two letters partition the 12 candidate words avoids the rote feel of Ringcount and rewards disciplined elimination.
- **Clarity: 3/5** — Ternary count feedback (0, 1, or 2) is conceptually crisp, but onboarding is hurt by stale instruction copy and an ambiguous pencil-mark toggle.
- **UI: 3/5** — Elegant desktop sidebar presentation, but on mobile candidate words are small (13–14px) and separated from scan evidence by a large 26-letter keyboard.
- **Replay: 4/5** — 210 distinct banks with guaranteed $\le 3$-scan solvability provide strong daily engagement.
- **Sharing: 2.5/5** — Text-only block lacks a date or visual canvas; results flatter zero-scan lucky picks ("An eye for the answer.") instead of staying neutral.

*What requires human playtesting:*
Cognitive friction of mentally comparing 0/1/2 counts across 12 words without automated assistance; whether the global pencil mode toggle feels natural on touch screens; and player emotional response when poor early scans leave an unresolvable 50/50 endgame guess.

---

#### Audit Findings: Proven Bugs vs. Hypotheses

##### 1. Proven Bugs
- **Stale Help Copy ([`app.mjs#L10`](file:///private/tmp/MAKER-Gemini__shortlist-review-20261030/games/shortlist/app.mjs#L10)):** The rules modal states: *"The little × lets you cross words off; tap it again to restore them."* Individual card `×` buttons were refactored into a global `#notes-mode` button, but the copy was not updated. Players hunt for a non-existent button on each card.
- **Stale Container Focus on Scan 3 ([`app.mjs#L89`](file:///private/tmp/MAKER-Gemini__shortlist-review-20261030/games/shortlist/app.mjs#L89)):** Submitting the third scan executes `$('puzzle').focus({preventScroll:true})`. `#puzzle` is an inert container (`tabindex="-1"`), trapping keyboard focus rather than selecting the first valid candidate button as [`scan`](file:///private/tmp/MAKER-Gemini__shortlist-review-20261030/games/shortlist/app.mjs#L78-L91) line 81 does.
- **Letter Selection Overwrite Trap ([`app.mjs#L73-L74`](file:///private/tmp/MAKER-Gemini__shortlist-review-20261030/games/shortlist/app.mjs#L73-L74)):** In [`chooseLetter`](file:///private/tmp/MAKER-Gemini__shortlist-review-20261030/games/shortlist/app.mjs#L70-L77), when two letters are selected, selecting another executes `selected = [selected[0], letter]`. `selected[0]` is permanently locked until Backspace/Escape is pressed; typing a fresh pair (e.g. "T" then "P") erroneously yields `[selected[0], "P"]`.
- **Zero-Confirmation Hint Consumption ([`app.mjs#L119`](file:///private/tmp/MAKER-Gemini__shortlist-review-20261030/games/shortlist/app.mjs#L119)):** Clicking `✦ Suggest a scan` immediately calls [`useHint`](file:///private/tmp/MAKER-Gemini__shortlist-review-20261030/games/shortlist/engine.mjs#L163-L166), permanently burning assistance and marking the daily save as assisted without confirmation. On mobile, this button sits directly next to the `•••` overflow trigger.

##### 2. Hypotheses & UX Friction
- **Mobile Yo-Yo Scrolling:** Layout order is Candidates $\rightarrow$ Letter Bank $\rightarrow$ Scan History. After scanning, players must scroll down past 26 keys to read the count, then scroll all the way back up to cross off candidate words, then scroll back down to scan again.
- **Ambiguous Mode Toggle:** `#notes-mode` displays its current state ("Pencil marks off") rather than the action. Tapping candidates while off opens the modal confirmation dialogue (`ONE WORD. ONE FINAL PICK`), creating alarm during casual inspection.

##### 3. Soundness Verifications (No Flaws Found)
- **Hint Logic ([`engine.mjs#L140-L161`](file:///private/tmp/MAKER-Gemini__shortlist-review-20261030/games/shortlist/engine.mjs#L140-L161)):** [`findHint`](file:///private/tmp/MAKER-Gemini__shortlist-review-20261030/games/shortlist/engine.mjs#L140-L161) operates purely on visible words consistent with prior scans; it never accesses `puzzle.answer`.
- **Scan Counting ([`engine.mjs#L45-L63`](file:///private/tmp/MAKER-Gemini__shortlist-review-20261030/games/shortlist/engine.mjs#L45-L63)):** Normalized pair sorting ensures letter presence is counted accurately, repeated letters in 5-letter words count once, and reversed pairs (e.g., EA after AE) are safely blocked.
- **Payload Privacy ([`engine.mjs#L248-L254`](file:///private/tmp/MAKER-Gemini__shortlist-review-20261030/games/shortlist/engine.mjs#L248-L254)):** [`formatShare`](file:///private/tmp/MAKER-Gemini__shortlist-review-20261030/games/shortlist/engine.mjs#L248-L254) strictly excludes words, secrets, banks, and letters; no private URLs are appended.

---

#### 4 Concrete High-Value Fixes

1. **Gate Hint Consumption Behind Confirmation**
   - *Trigger & Function:* In [`hint`](file:///private/tmp/MAKER-Gemini__shortlist-review-20261030/games/shortlist/app.mjs#L109-L115) ([app.mjs](file:///private/tmp/MAKER-Gemini__shortlist-review-20261030/games/shortlist/app.mjs#L109-L115)), wrap [`useHint`](file:///private/tmp/MAKER-Gemini__shortlist-review-20261030/games/shortlist/engine.mjs#L163-L166) in an `app.openDialog()` prompt explaining that using a hint permanently marks the game as assisted in daily stats.
2. **Fix Post-Scan Candidate Focus**
   - *Trigger & Function:* In [`scan`](file:///private/tmp/MAKER-Gemini__shortlist-review-20261030/games/shortlist/app.mjs#L78-L91) ([app.mjs#L89](file:///private/tmp/MAKER-Gemini__shortlist-review-20261030/games/shortlist/app.mjs#L89)), replace `$('puzzle').focus(...)` with `$('puzzle').querySelector('button:not(:disabled)')?.focus({preventScroll:true})`.
3. **Reset Letter Selection on Third Input**
   - *Trigger & Function:* In [`chooseLetter`](file:///private/tmp/MAKER-Gemini__shortlist-review-20261030/games/shortlist/app.mjs#L70-L77) ([app.mjs#L73-L74](file:///private/tmp/MAKER-Gemini__shortlist-review-20261030/games/shortlist/app.mjs#L73-L74)), when `selected.length === 2`, start a new selection `selected = [letter]` rather than locking the first letter.
4. **Correct Help Text and Invert Mobile Scan Results Position**
   - *Trigger & Function:* Update `help` in [`app.mjs#L10`](file:///private/tmp/MAKER-Gemini__shortlist-review-20261030/games/shortlist/app.mjs#L10) to reference the pencil marks toggle. In [index.html](file:///private/tmp/MAKER-Gemini__shortlist-review-20261030/games/shortlist/index.html) and [styles.css](file:///private/tmp/MAKER-Gemini__shortlist-review-20261030/games/shortlist/styles.css), relocate `#scan-history` directly below the candidates (or stick it above the letter bank) to eliminate mobile yo-yo scrolling.

---

#### Alignment with James's Preferences
- **Palette & Typography:** Replace dark navy (`#20344b`) and lime (`#d8ee99`) with James's preferred blue/teal tones. Increase candidate word font size on mobile from 13–14px to $\ge 16$px for legible reading.
- **Spoiler-Free Result Card:** Expand sharing beyond plain text by generating a spoiler-free, dated square image card showing scan count dots and unassisted status.

