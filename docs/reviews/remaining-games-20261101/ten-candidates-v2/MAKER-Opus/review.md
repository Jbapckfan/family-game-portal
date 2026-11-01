# Candidate v2 static follow-up: findings

**Scope.** This is a static reading of the supplied `candidate-v2-review.patch`, `state.mjs`, `engine.mjs` and adjudication v2. I executed nothing, fetched nothing, changed nothing and printed no solutions. I did not have the BANK/PRACTICE data, `index.html`, the runtime bundle or screenshots. The 358,153 assertions and the browser, pointer and packing counts are the author's evidence, not mine. I don't certify universal English quality, originality or fun, and I give no numeric human ratings.

**Fixes that hold up in source:**
- v2 never reads or deletes v1 keys.
- Envelopes are bound to schema, kind, seed, identity and edition.
- Per-kind reconstruction rebuilds the data and drops unknown fields, so persisted HTML can't round-trip.
- Terminal guards exist on runs, checks, launches, drafts and pulses.
- Candidate 10 clamps the review index and uses the initial pose when the run is empty.
- Study no longer swaps game data.
- Undo and reset keep their counters, and resets are counted separately.
- The Daily date is capped at the current Chicago date.

## Unresolved definite bugs

**1. Important: the on-screen result ignores `firstOutcome` and later study.**
- **Mechanism:** The panel header and the `.result` card read only the current `s`. After a first finish, `study()` leaves `assisted=false` and only sets `studied`. `resultDetail()` then prints "Your own finished result."
- **Repro (Candidate 06):** Solve unaided, Undo, Study and confirm, then enter the shown order and Check. The screen shows "COMPLETE / That came together / Your own finished result", while the share text says "Solved, then studied" with the first totals.
- **Second repro (Candidate 09):** Lose, Undo, then win. The screen shows "CHALLENGE COMPLETE", while the share text says "Rival won".
- **Fix:** Render the card from `firstOutcome`, or label the current board as a replay that came after study.

**2. Important: keyboard shortcuts ignore modifier keys.**
- **Mechanism:** The `keydown` handler never checks `ctrlKey`, `metaKey` or `altKey`.
- **Repro:**
  - Candidate 10: Cmd/Ctrl+F blocks the browser's Find and selects Forward.
  - Candidate 1: Alt+Left (Back on Windows/Linux) slides both discs and suppresses navigation, which costs a move.
  - Candidate 4: Alt+1 spends key 1.
- **Fix:** Return early when any modifier is held.

**3. Important: focus restoration only covers Candidate 04 and terminal states.**
- **Mechanism:** When the focused control becomes disabled or is replaced, the fallback is `.operation:not(:disabled)` or `.result h2`. Both are null outside Candidate 04 and terminal states, so focus drops to `body`.
- **Repro:**
  - Candidate 09: every pick disables the focused card.
  - Candidate 08: a hit replaces Launch with Next target, and Next target swaps back to Launch, so the selector misses both ways.
  - Candidate 02: an arrow becomes disabled at its bound.
  - Any kind: Undo becomes disabled when history empties.
- **Fix:** Fall back to a per-kind first enabled control, then to `#game-title`.

**4. Minor: Daily "Replay mix", "Try another mix" and "Open practice" overwrite the practice resume pointer.**
- **Mechanism:** From Daily, `practiceIndex` is set to 0 and `store()` immediately writes `lastPractice:${kind}=0`.
- **Repro:** Play practice mix 6, click "Today's Daily", then click "Replay mix". The "Resume practice 6" button is gone permanently.

**5. Minor: the 30-second day sync destroys the focused banner button.**
- **Mechanism:** `syncDay()` rewrites `#date-banner.innerHTML` on every interval tick, window focus and visibility change, even when nothing changed.
- **Repro:** Leave keyboard focus on "Open today" for 30 seconds or more. The node is replaced and focus goes to `body`.

**6. Minor: the render-failure message is false.**
- **Mechanism:** The fallback replaces `s` with `freshState(p)`, which has `firstOutcome:null`, and says "saved data was not deleted". The next `store()` overwrites the save, including the recorded first result. Slider input alone triggers a store. Separately, `replay` calls `store()` right after `load()`, so an unreadable practice envelope is overwritten before the warning can matter.
- **Fix:** Don't write to the key until the user acts, or back up the save under a quarantine key first.

**7. Minor: the PNG filename uses the wrong index in Practice.**
- **Mechanism:** `shareAction('image')` builds the name with `'practice-'+(index+1)`. In Practice that is the Daily `index`, not `practiceIndex`.
- **Repro:** Open practice from the "Daily unavailable" page. The file is named `…practice-0.png`, and in other cases the number is the wrong mix.

**8. Minor: `<details>` panels collapse on every render.**
- **Mechanism:** The template never preserves the `open` attribute. `focusToken()` also maps any focused summary to the first `summary` in the document.
- **Repro (Candidate 03):** Open "Connections in text" and swap two discs. The text alternative closes after every move. Focus on "Prototype notes" can also jump to the graph summary.

## Unverified hypotheses (not counted above)

These need the bank or HTML to check:
- **Practice/Daily disjointness:** whether the 1,820 practice boards are disjoint from all Daily boards, including future ones and transformed `identity` equivalents. It is only checkable against BANK and PRACTICE.
- **Announcer:** `#lab-live` must exist in `index.html` outside `#app` and be visually hidden. Otherwise every announcement is lost, because `#live` is now `aria-hidden`.
- **Candidate 06 solved starts:** the claim of "zero solved-start Daily boards". The `make6` guard changes RNG consumption only on the identity draw, so the claim is consistent only if BANK is static and not regenerated.
- **Source exposure:** BANK is shipped in the offline file, so future Dailies are readable from source or devtools whatever the UI does. That is a design limit, not a regression.
