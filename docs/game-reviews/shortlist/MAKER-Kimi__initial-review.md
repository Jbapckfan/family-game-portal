## Shortlist review

**Verdict:** a promising keeper candidate. Its meaningful question choice should suit James better than Ringcount’s simplicity, although the manual comparison work could make it feel slower than Counterpart. The exact solver establishes solvability—not enjoyment or human difficulty.

**Provisional predictions:** Fun **4/5** · Clarity **4/5** · UI **4/5** · Replay **4/5** · Sharing **3/5**.

### What works

- Rules are implemented cleanly: distinct-letter presence counting, normalized repeated-scan rejection, three-scan budget, and immediate win/loss on the confirmed pick (`engine.mjs:39-75`).
- Hints use only words consistent with visible scans. Pencil marks are explicitly excluded from `possibleWords`, and saved hints retain their original scan context (`engine.mjs:84-165`, `engine.mjs:175-209`).
- Final-pick confirmation is good: it names the word, warns about unused scans, and defaults focus to “Keep thinking” (`app.mjs:97-107`).
- Pencil mode is reversible and visually explicit. Keeping crossed-off words disabled as picks avoids accidental contradiction without letting notes affect evidence.
- The 210 distinct banks and 2,520 independently audited secret paths provide substantial replay content. Current text sharing is honestly won/lost/revealed and spoiler-free.

### Highest-value fixes

1. **Keep scan evidence beside the candidates.**  
   In the 390px screenshot, the four-row letter console separates the words from their results; comparison will require repeated scrolling. Change the layout driven by `renderGame()`/`scan()` (`app.mjs:30-53`, `app.mjs:78-90`): after scanning, collapse the composer into a compact “Scan again” control and place a concise, persistent result summary directly above or below the word grid. Preserve manual deduction—no automatic crossing-out or candidate indicators.

2. **Increase gameplay typography, not just touch targets.**  
   Candidate words are ultimately only **14px** on phone/desktop, and phone letter labels are **13px** (`styles.css:100-110`). Target roughly **18–20px words**, **16px letters**, and 52–56px word controls while retaining three word columns at 390px. This directly addresses James’s readability preference without adding windows or tabs.

3. **Make the hint’s irreversible cost explicit before tapping.**  
   `hint()` immediately consumes the only hint (`app.mjs:109-115`), while the button merely says “Suggest a scan.” Use “Use my 1 hint” plus “Doesn’t spend a scan · can’t undo,” ideally with a cancel-default confirmation. The current behavior is not a rules bug, but it is an avoidable accidental-assistance risk.

4. **Fix focus after deduction-only hints — source-confirmed defect.**  
   Rendering disables the clicked hint button after use. `hint()` moves focus only when `result.hint.letters` exists, so a hint after three scans—or when one candidate remains—can leave focus on that disabled button (`app.mjs:63-64`, `app.mjs:109-115`). Always focus the scan button when scans remain, otherwise the candidate grid. Browser confirmation is still needed for the resulting keyboard experience.

5. **Add a dated visual result while retaining the safe text payload.**  
   Sharing currently copies text only (`shell.mjs:326-334`). Add portrait/square image generation with Daily number/date or Practice identity, total scans, assistance count, and honest Solved/Missed/Revealed status. Exclude every word, pick, bank, scan pair/count, private URL, and skill/“perfect” claim—especially for zero-scan lucky wins.

### Requires human playtesting

Whether pair selection feels deductive or clerical; evidence-to-word scrolling on phones; comprehension of 0/1/2 and pencil-versus-pick modes; accidental hint/final-pick taps; keyboard and screen-reader focus; whether difficulty labels feel accurate; and whether finished results are worth sharing.

**Review basis:** inspected the supplied application, engine, shell, HTML/CSS, identity module, all five test files, audit/baseline JSON, and both phone/desktop screenshots. No code was executed and source inspection is not play. Imported puzzle/runtime implementation files were not present in the supplied folder.
