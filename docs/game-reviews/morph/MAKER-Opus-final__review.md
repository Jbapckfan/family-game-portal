# Morph final source review (Opus 5.5)

**Scope:** I read only the inline source: `MorphBoard`, `MorphPage`, `MorphWinModal`, `MorphSharePanel`, `share-card`, `MorphHelpModal`, `useMorph`, `progress`, `engine`, the shared `integration`, `useGameOverlays`, `useDailySession`, `stats` and `dialog`, plus `index.css`. I used no tools, ran nothing, wrote no files and played nothing.

There were no images, so I give **no visual score**. Every finding below is a prediction from source until someone reproduces it.

**Baseline adjudication:** The supplied source supports both refutations.
- The `useMorph` persist effect does list `s.hintsUsed` in its dependencies.
- The win modal shares through `nativeMessage` with an explicit `slug: 'kimi-morph'`.

## Findings

### 1. Important: a palette letter key can be applied twice under reduced motion
**Source:** `MorphBoard.tsx`, the palette `DialogContent onKeyDown` handler and the window `keydown` effect.

1. The palette handler calls `preventDefault()` and then `pickLetter`, which closes the palette.
2. The native event keeps bubbling from the portal (`body`) up to `window`.
3. The window listener's only guard is `document.querySelector('[role="dialog"]')`. It never checks `defaultPrevented`.
4. With `prefers-reduced-motion`, `index.css` forces `animation:none`. Radix Presence then unmounts the content right away instead of waiting for the exit animation.
5. React 18 flushes the discrete update in a microtask, which runs between the body listener and the window listener. So by the time the window listener runs, the dialog may already be gone.
6. `keyboardLetter` then writes the same letter at `focusCell ?? 0`, which is position 1 because `pickLetter` just cleared `focusCell`, and moves the ring.

**Result:** The player replaces position 3 and gets "2 letters changed," with position 1 overwritten as well.

**Fix:** Add `if (e.defaultPrevented) return` in the window handler, or call `event.stopPropagation()` in the palette handler. Either is one line.

**Repro:** Turn on reduced motion, open position 3 and press a letter key.

### 2. Minor: a stale share panel renders for a moment when results reopen
**Source:** the `MorphWinModal` reset effect, `if (props.open) setShareResult(null)`.

- The panel is cleared only after a render where `open` is already true. The first commit after reopening, whether from "See results" or from the timed popup for a newly loaded finished day, still renders the old `MorphSharePanel`.
- During that commit, Radix FocusScope can autofocus "Portrait." The parent effect then removes that button, so focus drops to the dialog container.
- The panel's image-preparation effect also starts and is then thrown away.
- For a timer-driven open, which is not a discrete event, this can show as a one-frame flash.

**Fix:** Clear `shareResult` when the modal closes (in `onOpenChange(false)`), or key the panel on round identity.

### 3. Minor: an assisted win hides the route live but shows it after reload
**Source:** `useMorph.finish`, which sets `showPath: gaveUp`, versus `startDaily`, which restores `showPath: saved.gaveUp || saved.hintsUsed > 0`.

- After an assisted win, the route panel disappears. After a reload, the same terminal board shows it again.
- The results modal shows the route either way, so this is only a consistency problem.

**Fix:** Pick one rule for both paths. Keeping `prev.showPath || gaveUp` in `finish` is simplest.

### 4. Minor: the help text calls the move target "goal"
**Source:** `MorphHelpModal`, the line "Match or beat the **goal** for gold."

- Everywhere else, "Goal" means the target word: the goal banner, the help intro, and the CSS identity classes.
- The medal threshold is the *suggested* move count, which the same modal's later paragraph explains correctly.

**Fix:** Change it to "Match or beat the suggested move count for gold."

### 5. Minor (prediction): the download URL is revoked after 1 second
**Source:** `MorphSharePanel.download`.

- On iOS Safari, and in a WebView fallback if `nativeMessage` returns false, the download confirmation can outlive a 1-second blob URL. The download then fails silently.
- Desktop browsers are likely fine.

**Fix:** Revoke when the panel unmounts, or after a much longer delay.

## Checked and found sound
- **Confirmations:** They are keyed by mode, day, puzzle number, puzzle object and rows reference, plus `phase === 'playing'`. They are cleared by an effect, protected by a double-confirm ref, and the underlying actions still pass the session guard. External adoption, rollover and new practice rounds all invalidate them. "View saved route" is correctly free.
- **Share privacy:**
  - The caption, canvas, aria label and filename contain no words, route, letters, per-step pattern or URL.
  - The four marks are fixed.
  - The native path sends only the caption text.
- **Share gestures:**
  - `navigator.share` and `clipboard.writeText` are called with no `await` before them, so user activation is kept.
  - `canShare` is wrapped in a try/catch.
  - AbortError has its own message.
  - The `mounted` and `current` guards cover unmount and format switches.
  - The share result is frozen when you start sharing, and the date comes from the stored day number.
- **Terminal results:**
  - Solved and revealed outcomes have separate headlines and pace text.
  - Assistance is disclosed on the result screen, caption and card.
  - Moves and misses are hidden for a give-up.
  - `buildMorphShareResult` cannot throw on any state that `restoreMorphProgress` accepts.
- **Stats and recovery:**
  - `played` is counted once through `countedPlayed`.
  - Undo and restart keep misses and hints, never count a play, and clear rows that can be replayed.
  - Giving up zeroes the streak.
  - The decay rule is display-only and Morph-only.
  - Practice never writes stats.
- **Worked example:** cold → cord → card → ward → warm changes one correctly highlighted letter at each step.
- **Focus:** Restoration falls back sensibly when the button that opened a dialog becomes disabled (restart) or unmounts (give up).

## Counts and verdict
**Critical 0 · Important 1 · Minor 4**

**Verdict: Approve conditionally.** Fix #1 (one line) before ship, and treat #2–#5 as polish. This has not been reproduced or visually reviewed. Human familiarity and difficulty, and the pending build, remain unverified.
