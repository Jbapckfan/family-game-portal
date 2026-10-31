# Static review: Circuit and Hunch working tree vs `6c9f1be`

I only read the pasted manifest. I executed, mutated and fetched nothing. I didn't run the 212+ tests; that count is your metadata. I can't give a visual UI score because no screenshots were supplied. No answers or routes appear below.

## Critical

None found.

## Important

**1. The confirm dialogs never record their opener, so focus doesn't return to it.**
- **Where:** `dialog.tsx:63`, plus the `autoFocus` on "Keep playing" (`CircuitBoard.tsx:212`) and "Keep guessing" (the HunchBoard clue dialog).
- **Cause:** React focuses an `autoFocus` button as soon as it mounts, which is before Radix FocusScope's mount effect runs. That effect only fires `onMountAutoFocus` if focus is still outside the dialog. Here it's already inside, so `onOpenAutoFocus` is skipped and `opener.current` stays `null`.
- **Trigger:** Keyboard-activate Circuit "Route clue", "Reveal route" or "Restart chain", or Hunch "Reveal letter". Then press Escape or "Keep playing". Focus lands on the `<main data-game-focus>` fallback instead of the button you came from.
  - After a give-up, the `[data-game-results]` fallback happens to be correct.
  - After a Circuit clue, the clue button still exists, but focus doesn't go back to it.
- **Confidence:** High, from how Radix FocusScope and React `autoFocus` behave. I haven't executed it. A focus test on cancel would confirm it.
- **Fix:** Drop `autoFocus`. Pass `onOpenAutoFocus={e=>{e.preventDefault();cancelRef.current?.focus()}}` instead. The wrapper records the opener before it calls the prop handler, so that capture still works.

## Minor (verified in code)

2. **Circuit clue button stays enabled after the free clue is used** (`CircuitBoard.tsx:201`).
   - The button says "Route clue · used" but still opens a dialog asking "Use your route clue?… records assistance".
   - Confirming only shows a "free hint … used" toast. Nothing is recorded or leaked, but the dialog asks consent for something that won't happen.
   - Hunch disables its button in the same situation. Circuit should too, when the clue is used and the player isn't premium.

3. **Circuit Erase and Undo keep focus after a mouse click** (`CircuitBoard.tsx:167`, `:188`). Delete and Play word blur after a click; these two don't.
   - **Trigger:** In desktop Chrome or Firefox, click "Undo word". The undone word comes back as the current word. Pressing Enter to resubmit it instead clicks Undo again, which removes another accepted word.
   - This is recoverable, and no stats change.

4. **The Circuit PNG says "1 words played"** (`circuit/share-card.ts:15`). The caption handles singular correctly; the canvas text doesn't.

5. **Hunch clue button: accessible name doesn't match visible label** (`HunchBoard.tsx:85`).
   - `aria-label="Reveal a letter"` is not a substring-compatible match for the visible "Reveal letter" (WCAG 2.5.3, label in name). Voice-control users saying the visible text may miss it.
   - When used, the visible text is "Clue used" but the name stays "Reveal a letter".

6. **Holding Enter repeats the submit** (`CircuitBoard.tsx:51`, `HunchBoard.tsx:57`). There's no `e.repeat` guard.
   - A held Enter fires an error shake, toast and sound right after a successful submit: "Words need 3+ letters" in Circuit, "Not enough letters" in Hunch.
   - Ignoring repeats for Enter only would fix it.

7. **The Hunch hinted key looks focused.** The `[data-hint=true]` outline (3px `#315dc2`) is identical to `.hunch-keyboard button:focus-visible`, so the hinted key and the focused key can't be told apart.

8. **ARIA semantics on the Circuit board:**
   - `aria-label` sits on plain divs: the coverage meter (`:83`) and "Words played" (`:151`). Screen readers won't announce those names. Add a role (for example `role="img"` or `role="list"`) or visible text.
   - `aria-pressed` on ring nodes (`:120`) implies a toggle. Pressing a selected node again appends a letter rather than un-pressing it.

9. **Typing is blocked briefly after a dialog closes.** The keyboard guard matches any `[role="dialog"]`, including one that's still in its ~200 ms `data-state="closed"` exit animation, so keys pressed in that window are dropped.

## Hypotheses (need execution or screenshots)

- **Circuit ring at narrow widths:** The ring size is `min(320px, 100vw−80px)` and nodes are 48px. Neighbouring nodes are about 49.7px apart at a 320px viewport, so they nearly touch, and they overlap below 320px.
- **Hunch row at 280px minimum width:** The `minmax(0,1fr) 76px` grid leaves roughly 21px per letter cell for 25px glyphs.
- **Blocked Circuit nodes:** `opacity: .58` on an operable control over `#142c3f` may fall below 4.5:1 contrast.
- **Font failure blocks the PNG:** If `document.fonts.load` rejects, the share panel skips drawing entirely. It could draw with the fallback fonts instead.
- **Safari IME Enter:** Safari can fire the composition-ending Enter with `isComposing=false`. A `keyCode===229` guard would cover it.
- **Legacy per-position emoji share:** `buildHunchShare` (🟩🟨 per position) and `buildCircuitShare` are still exported from the unchanged engines. Grep to confirm nothing calls them, because per-position emoji would contradict the grouped-dot design.
- **Day-number schemes:** The streak-expiry display compares `lastCompletedDay` (from `todayDayNumber`) with `centralDayNumber()`. `shared/share` isn't in the manifest, so I couldn't confirm they use the same numbering. `makeProgress`'s 2026-01-01 floor suggests they do.

## Checked and consistent

- **Consent gating:** Circuit and Hunch confirms are tied to identity, the played/guesses/current references and phase, with a consumed-ref guard against double confirms. Cancel changes nothing. Toast and shake timers preserve those references, so they don't close the dialog by accident. Storage adoption, midnight rollover and leaving practice all close it.
- **Played count:** `markPlayed` relies on `countedPlayed` plus `DailySession` interrupts. I found no double-count path, and Practice doesn't touch stats.
- **Stats commits:** A finished save refuses further writes. Restore sets `freshFinish=false`; only `finish()` sets it true. Confetti fires only on a fresh win.
- **Overlays:** The win modal only mounts when open and finished, and is keyed by round, so nothing carries across rounds.
- **Practice:** It excludes the current puzzle number.
- **Clue leaks:** None before consent. The route clue appears outside the ring and is labelled as starting from scratch. Hunch hint candidates exclude only earlier clue letters, as intended.
- **Hunch feedback:** Dots are grouped as correct, then present, then a dash for absent. The 76px dot column fits five 12px dots with gaps exactly. Labels give only counts, with no per-letter ARIA, and the help-example math checks out.
- **Share results:** These are frozen and stable while the countdown ticks. Captions cover no-solve and revealed rounds. The preview canvas is the same canvas the PNG comes from. In both formats the card text doesn't overlap; Hunch square is tightest, with about 4px between legend and score.
- **Sharing actions:**
  - `navigator.share` is called synchronously within the click, so the user gesture is preserved.
  - AbortError is reported as a cancel.
  - The copy fallback focuses and selects the manual-caption textarea.
  - Native share sends the canonical caption text first.
