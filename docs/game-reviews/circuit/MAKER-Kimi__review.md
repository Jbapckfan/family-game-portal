# Circuit review

**Verdict: keep Circuit, but revise it before considering it finished.** The arc-hopping, last-letter chaining, and full-coverage goal form a promising optimization game. The main weaknesses are destructive one-tap actions, incomplete input support, misleading sharing feedback, and small-phone readability—not the underlying puzzle model.

This was a read-only review of the supplied Circuit source, audit, and two 390px screenshots. I did not execute code, run tests, access the network, or modify files.

## Critical

### 1. “Reveal route” can irreversibly ruin a daily result

- **Trigger:** Tap **Reveal route**, even accidentally.
- **Evidence:** The button immediately calls `giveUp` (`CircuitBoard.tsx:189-192`). That finishes the round and resets the daily streak without confirmation (`useCircuit.ts:179-196`, `useCircuit.ts:305-310`).
- **Fix:** Require explicit confirmation explaining that revealing ends the daily round and forfeits the streak. Keep the unfinished state intact on cancel. Do not change the underlying scoring rules.

## Important

### 1. Keyboard play is absent; rapid input has a stale-state risk

- **Keyboard:** Circuit has no letter, Backspace, Escape, or Enter handler. The supplied `isNativeEnter` helper is unused (`keyboard.ts:1-7`), so mouse/touch is effectively required.
- **Rapid-input risk:** Actions read `ref.current` and write whole state objects (`useCircuit.ts:201-285`). Multiple inputs arriving before a render could overwrite one another or repeat a submission. This is a source-derived hypothesis, not runtime-reproduced.
- **Existing safeguard:** The cross-tab stale-save guard is present and wraps Circuit’s actions (`useDailySession.ts:51-101`, `useCircuit.ts:334-337`); it should not be bypassed.
- **Fix:** Add keyboard handling that ignores modifiers and editable controls, respects native Enter on buttons, and cleans up on unmount. Use functional transitions or a reducer for game input while retaining `DailySession` checks.

### 2. Restored games celebrate as though newly won

- **Trigger:** Open or return to an already-finished daily.
- **Evidence:** Restoring sets `finished` (`useCircuit.ts:75-92`), which schedules the result popup and fires confetti (`CircuitPage.tsx:32-35`, `useGameOverlays.ts:57-76`).
- **Fix:** Distinguish restoration from a fresh playing-to-finished transition. Restores should be silent and leave **See results** available; only a fresh completion should celebrate and auto-open results.

### 3. Sharing is incomplete and can report false success

- **Copy denial:** `copyText` ignores the boolean returned by fallback copying, while the modal always shows **Copied!** after resolution (`share.ts:21-33`, `CircuitWinModal.tsx:30-34`). Native sharing also produces “Copied!” even though a share sheet is not a clipboard copy.
- **Result content:** The export includes a puzzle number but omits mode, frozen date, hints, and actual coverage. Revealed games always export twelve black cells rather than their real coverage (`engine.ts:53-57`).
- **Practice/image:** Practice has no sharing action, and Circuit has no PNG sharing path (`CircuitWinModal.tsx:89-99`).
- **Fix:** Return explicit copy/share outcomes. Show **Copied** only after confirmed clipboard success; treat native cancel separately and offer a selectable manual-copy fallback after denial or failure.

### 4. The dial needs better long-word and phone-text treatment

- **Evidence:** The current word is confined to 46% of the dial and may break anywhere; route clues use 10px text within 45% of it (`index.css:196-198`). Arc numbers are only 9px (`CircuitBoard.tsx:127`), and shared CSS reduces several control labels to 11–14px (`index.css:89-90`, `index.css:226`).
- **Screenshot evidence:** The main layout fits at 390×979, but secondary labels are small.
- **Prediction:** Longer drafts will wrap awkwardly, and shorter screens or enlarged text may require repeated scrolling between the ring and controls.
- **Fix:** Scale the draft by word length without arbitrary mid-word wrapping, move expanded route clues below the dial at readable sizes, enlarge arc numbers and secondary labels, and consider safe-area-aware sticky primary controls.

### 5. The visible palette conflicts with the requested cool blue/teal direction

- **Evidence:** Circuit uses brown, olive, and purple arc colors (`CircuitBoard.tsx:5-7`), also visible in the phone screenshot. The share grid includes orange and purple (`engine.ts:55`).
- **Fix:** Use four distinguishable cool blue/teal/green identities with tested contrast. Retain and enlarge the existing arc numbers 1–4 so identity never depends solely on color; change the help wording to “four numbered arcs.”

### 6. Help contains a scoring error and a visible title collision

- **Scoring:** Help says “beat par for gold” (`CircuitHelpModal.tsx:22`), but gold is awarded at **par or better** (`engine.ts:45-50`). Since the supplied audit verifies pars as minimal, “Match par for gold” is the accurate instruction.
- **Visual:** The supplied help screenshot shows the close button overlapping the title. The dialog’s 32px top padding and 44px close control explain the collision (`index.css:98-101`).
- **Fix:** Correct the scoring copy and reserve non-overlapping space for the close button.

### 7. Other destructive actions need proportionate safeguards

- **Route clue:** Immediately consumes the sole free clue (`useCircuit.ts:288-303`).
- **Restart chain:** Immediately erases the current chain (`useCircuit.ts:248-253`).
- **Fix:** Confirm use of the free clue, and confirm restart when progress exists. Undo needs no confirmation.

## Minor

- **Practice can immediately repeat itself.** When already in practice, `startPractice` passes no exclusion (`useCircuit.ts:312-329`). Exclude the current puzzle in both modes, with a fallback if the available calendar pool becomes empty.
- **The daily date is live rather than round-derived.** The header calls `dateLabel()` directly (`CircuitPage.tsx:45`), so the old puzzle can briefly display the new date around rollover. Format the frozen `state.dayNumber` instead.
- **The save footer overstates practice persistence.** Only daily progress is saved (`useCircuit.ts:120-136`), while the same footer appears in practice. Prefer “Daily progress is saved in this browser” unless practice persistence is deliberately added.

## Five worthwhile improvements

1. **Make play safe and input-complete:** confirm reveal/restart/free-clue consumption; add accessible keyboard controls and rapid-input-safe state transitions.
2. **Create a cool, readable phone dial:** replace brown/purple styling, enlarge arc identities and controls, handle long words cleanly, and fix the help-dialog collision.
3. **Separate fresh events from restored state:** suppress restore celebrations/popups, freeze the displayed daily date, and prevent immediate practice repeats.
4. **Clarify scoring and assistance:** say “match par,” show clue status in results, and preserve the existing hint behavior across undo/restart.
5. **Rebuild sharing around one canonical result:** native-first `kimi-circuit` text for Daily, Practice, and revealed rounds; truthful copy/cancel outcomes; manual fallback; and optional locally generated PNG sharing with feature-detected file share or download.

Shared exports should contain the frozen mode, word count, par, hints used, and actual **x/12 letters lit**. Use twelve generic coverage marks rather than answer information. Exclude letters, chains, routes, puzzle IDs, and URLs. Daily dates should derive from the round; Practice must be labeled explicitly.

## Evidence worth preserving

- The supplied audit reports **286 unique layouts, 44,957 word entries, 56 par-two and 230 par-three boards**, with bounds and canonical witnesses supporting the published pars. It also reports 598 canonical words in the supplied common list and 182 distinct dated selections (`audit.json:2-14`). I did not independently rerun it.
- Daily hints and revealed clues are saved and restored; undo and restart retain them (`useCircuit.ts:121-136`, `useCircuit.ts:241-253`). Practice is ephemeral.
- Arc numbers already exist visually and in accessibility labels (`CircuitBoard.tsx:106-127`).
- The central daily-date helper, practice calendar, disabled premium commerce, and stale-session protection are present.

Common-list membership establishes neither human familiarity nor fun. Do not alter puzzles, pars, dictionary entries, arc/chain rules, scoring, or save formats without independent proof and backward-compatible migration. Any implementation must also preserve the existing 32 daily games plus bonus and Circuit’s dated selections and saves.

## Static model predictions

- **Fun: 4/5** — complementary constraints and short optimization routes are appealing; mostly two/three-word pars limit score variety.
- **Clarity: 3/5** — the core instructions are understandable, but scoring copy and small route/readout text need correction.
- **UI: 3/5** — attractive dial and generally sound phone layout, weakened by palette, tiny labels, and the help overlap.
- **Replay: 3/5** — 286 layouts and practice help, but immediate repeats and shallow par variety reduce the prediction.
- **Share: 2/5** — basic Daily text exists, but truthfulness, Practice, revealed coverage, and image support are lacking.

These are subjective static predictions, not measured fun, human-testing results, or population data. Interactive behavior, native sharing, clipboard denial, accessibility, and smaller viewport layouts remain unverified.
