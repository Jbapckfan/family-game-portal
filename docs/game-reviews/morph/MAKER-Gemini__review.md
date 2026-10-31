# Morph Review (Gemini)

### Actual Scope
Morph is a four-letter word-ladder game (original authorship Kimi) featuring 450 verified daily puzzles (suggested par: 4–7 moves) and infinite practice mode. Gameplay permits single-letter dictionary substitutions without repeated words. Recovery mechanisms include free undo, ladder restart, and a full-route hint marking the session assisted. The route audit confirms all 450 supplied paths are strictly valid within the bundled 7,186-word dictionary; 357 boards contain shorter breadth-first search dictionary paths (due to 391 canonical words falling outside the 747 common list, reflecting vocabulary curation rather than algorithmic failure). Inspected code includes engine mechanics, local persistence, daily session concurrency boundaries, keyboard/touch input, dialog accessibility, CSS theming, and share integration.

---

### Provisional Predictions (1–5 Scale)
*(Provisional model predictions based on source inspection; source inspection is not play; NOT James's ratings.)*

* **Fun — 3.5 / 5:** Engaging word-ladder mechanic with smooth move mechanics, though par friction arises when obscure dictionary BFS shortcuts contrast with supplied human routes.
* **Clarity — 3.0 / 5:** Overloaded terminology ("target" denotes both the destination word and the move par) and unannounced full-route reveals create cognitive friction.
* **Visual & UI — 2.5 / 5:** Dominated by a heavy violet/purple palette (`--identity: #7054a1`) conflicting with player preference for clean blue/teal. Moving goal tile row drifts downward as rungs accumulate.
* **Replayability — 4.0 / 5:** Strong 450-puzzle daily sequence with distinct start/target pairs, good canonical distribution, and seamless practice mode switching.
* **Social & Sharing — 2.0 / 5:** Share text omits the calendar date and practice support; native bridge fails due to missing attributes; clipboard failures report false success.

---

### Material Findings with Source Evidence

#### 1. Keyboard Palette Lockout and Missing Backspace Navigation
* **Source:** [`MorphBoard.tsx`](file:///private/tmp/MAKER-Gemini__morph-review-20261030/packages/kimi-pebbles/src/games/morph/MorphBoard.tsx#L79) (L79, L91–93) & [`useMorph.ts`](file:///private/tmp/MAKER-Gemini__morph-review-20261030/packages/kimi-pebbles/src/games/morph/useMorph.ts#L252-L260) (L252–260).
* **Evidence:** The global keydown listener aborts if any dialog is open (`if (document.querySelector('[role="dialog"]')) return`). Tapping an edit cell opens the letter palette (`paletteOpen: true`), which mounts a Radix dialog and completely disables physical keyboard typing. When the palette is closed, typing blindly cycles focus forward (`(focus + 1) % edit.length`). Keydown rejects non-letters (`/^[a-z]$/`), providing zero Backspace or Delete handling to correct mistyped letters without wrapping through all four positions.

#### 2. Unconfirmed Destructive Actions: Instant Give-Up and Full-Route Spoilers
* **Source:** [`MorphBoard.tsx`](file:///private/tmp/MAKER-Gemini__morph-review-20261030/packages/kimi-pebbles/src/games/morph/MorphBoard.tsx#L219-L235) (L219–235) & [`useMorph.ts`](file:///private/tmp/MAKER-Gemini__morph-review-20261030/packages/kimi-pebbles/src/games/morph/useMorph.ts#L303-L328) (L303–308, L322–328).
* **Evidence:** Tapping "Give up" immediately ends the game and resets the daily streak (`stats = { ...stats, currentStreak: 0 }`) without a confirmation prompt. Similarly, "Show a route" irreversibly exposes the full solution path and marks the solve assisted (`hintsUsed: 1`) on the first click without a warning dialog. "Restart ladder" also wipes ladder progress instantly without confirmation.

#### 3. Broken Native Share Bridge and Phantom Clipboard Success
* **Source:** [`MorphWinModal.tsx`](file:///private/tmp/MAKER-Gemini__morph-review-20261030/packages/kimi-pebbles/src/games/morph/MorphWinModal.tsx#L33-L37) (L33–37), [`share.ts`](file:///private/tmp/MAKER-Gemini__morph-review-20261030/packages/kimi-pebbles/src/games/shared/share.ts#L21-L33) (L21–33), and [`MorphPage.tsx`](file:///private/tmp/MAKER-Gemini__morph-review-20261030/packages/kimi-pebbles/src/games/morph/MorphPage.tsx#L37) (L37).
* **Evidence:** `copyText` passes `document.documentElement.dataset.gameId` to `nativeMessage()`, but `MorphPage` never assigns `data-game-id` to `<html>` (only a CSS class `kimi-morph`), causing `slug` to be `undefined`. Furthermore, `copy()` calls `await copyText()` and unconditionally sets `setCopied(true)`. Because `copyText` swallows exceptions in its fallback `execCommand`, the UI reports "Copied!" even when clipboard permissions fail or when a native share sheet is invoked. Practice mode completely omits sharing, and Daily share text omits the played date.

#### 4. Repeated Confetti Discharge on Restored Daily State
* **Source:** [`MorphPage.tsx`](file:///private/tmp/MAKER-Gemini__morph-review-20261030/packages/kimi-pebbles/src/games/morph/MorphPage.tsx#L31-L34) (L31–34) & [`useMorph.ts`](file:///private/tmp/MAKER-Gemini__morph-review-20261030/packages/kimi-pebbles/src/games/morph/useMorph.ts#L81-L103) (L81–103).
* **Evidence:** `MorphPage` executes `useEffect(() => { if (!state.finished) return; if (!state.gaveUp) fireConfetti() }, [state.finished, state.gaveUp])`. When an already-completed daily session is rehydrated via `startDaily()` (`saved.finished === true`), this effect runs unconditionally. Confetti blasts upon every page reload, revisit, or return navigation from Practice mode back to the completed Daily.

#### 5. Drifting Goal Anchor and Dual "Target" Nomenclature
* **Source:** [`MorphBoard.tsx`](file:///private/tmp/MAKER-Gemini__morph-review-20261030/packages/kimi-pebbles/src/games/morph/MorphBoard.tsx#L108) (L108, L166–175) & [`MorphHelpModal.tsx`](file:///private/tmp/MAKER-Gemini__morph-review-20261030/packages/kimi-pebbles/src/games/morph/MorphHelpModal.tsx#L13-L24) (L13–24).
* **Evidence:** The ladder places the goal word at the bottom of the stack (`morph-ladder`). As steps accumulate toward par (up to 7 rungs), the static target row gets pushed downward away from the editing row, breaking the visual comparison anchor. Furthermore, "target" is used ambiguously for both the destination word ("target: cold") and the par benchmark ("Moves 3 · target 5"), creating unnecessary player confusion.

