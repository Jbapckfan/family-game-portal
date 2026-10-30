# Shortlist: fourth review (Opus 5.5)

**What I inspected:** the pasted `engine.mjs`, `app.mjs`, `shell.mjs`, `index.html` and `strategy-audit.json`. I also grepped `styles.css` for palette, sizes and layout order, and listed the folder. I did not open `puzzles.mjs`, the tests, `daily-rotations.mjs` or `practice-calendar.mjs`. I ran nothing. I did not see any screenshots, so there are no visual scores. Source inspection is not play.

## Proven bugs (from code)

1. **Legacy hint restores give a fresh hint and a false label.** In `restoreGame`, when `hints===1 && hint==null`, the hint is recomputed for the *current* scans and labelled `after scan N`. Suppose an old save used a hint before scan 1 and now has 2 scans. The player gets new, never-received advice for their current position, labelled with the wrong timing. `renderGame` then preselects those letters. This breaks the "saved hint context must remain honest" rule. **Fix:** for legacy saves, set `hint = {type:'legacy', letters:null, message:'Hint used (original timing not saved).'}` and never recompute.

2. **Save compatibility depends on exact wording.** Non-legacy restore requires `raw.hint.message === expected.message` and the same `letters`. Any later change to hint text in `findHint`, or to the `rankedPartitions` tie-break, sends every hinted save to `fresh()`. That includes finished dailies, which would come back as `playing`. Records keep the result, but the board reappears unplayed. **Fix:** check only `type` and `scanCount`, then regenerate the message, or store the hint verbatim and trust it.

3. **The hint can be spent on nothing.** Once `scans.length >= MAX_SCANS`, `findHint` returns a generic rules sentence but still sets `hints=1`. The result is marked "assisted" without the player learning anything. **Fix:** hide or disable `hint-button` after scan 3, or make that reminder free.

4. **Backspace/Escape lose focus.** The keydown handler calls `app.render()` with no `opts`. That rebuilds `#puzzle` and `#letter-bank`, so a focused word or key is destroyed. It also overwrites feedback with "Letter selection updated" on finished boards or when nothing was selected. **Fix:** do nothing if `!selected.length || status!=='playing'`, and pass `{letter: removed}` to render.

5. **Zero-scan wins get skill praise.** In `result()`, `scans<3` gives "An eye for the answer." and "A few good questions", even with 0 scans. The share text itself is honest. **Fix:** for 0 scans, show something like "A bold first pick." with no skill claim.

## Hypotheses (need play or screenshots)

- **Scan evidence is far from the words on phones.** `#scan-history` sits after the 26-key `letter-bank` in the DOM. CSS has no reordering, stickiness or grid-area for it. On a single-column phone layout, comparing words against results likely means scrolling past the keyboard each time. This is probably the biggest usability problem.
- **Tapping a word is risky.** The default mode is pick mode, so a player who wants to cross a word off gets the final-pick dialog. "Keep thinking" is autofocused, which is good, but the mode toggle is easy to miss. Crossed-off words are also unpickable until you change mode.
- **Touch targets are small.** Letter keys are `min-height:38px` in 9 columns, about 33px wide on a 360px phone, below the 44px guideline. Words are only `1rem` in 3 columns.

## Subjective / James's preferences

- The palette is cream and terracotta (`--paper:#f6f3ec`, `--accent:#c4552f`), not blue/teal.
- Words are not "large" at 1rem.
- The hint cost is never stated on the button itself.

## Top fixes (in priority order)

1. **Evidence strip next to the words.** Add a compact, sticky row above `#puzzle`, such as `AE→1 · RT→0 · ?`, rendered in `renderGame`. Move the full `#scan-history` above `.scan-panel`. This adds no automatic elimination.
2. **Make tapping a word a note, and picking explicit.** A tap toggles the cross-off (`toggleElimination`). A separate "Make final pick…" button enters a one-shot pick mode, and the existing confirmation dialog stays. This removes the pencil/pick confusion and the accidental-pick risk.
3. **Honest, explicit hint.** The button should read "✦ Suggest a scan (uses your 1 hint)" with a one-step confirm. Disable it after scan 3. Apply fixes 1–3 above.
4. **Bigger controls in teal/blue.** Words at about `1.35rem`, at least 52px tall. Letter keys at least 44px, in 7 columns. Change the CSS variables to a blue/teal accent and keep sufficient contrast.
5. **Spoiler-free result image.** Draw a 1080×1350 or 1080×1080 canvas from `formatShare` inputs only. It should show "Shortlist Daily No. 011 · Oct 30 2026" or "Practice", scans used as X/3, hints as 0/1, and Solved/Missed/Revealed. Include no words, letters, counts or URL, and no rating. The current `formatShare` already meets this content rule and never passes `url`. Add the date to the text version.

## Other checks (no defects found)

- `submitScan` normalizes pairs, so a reversed pair counts as a repeat. It checks for repeats before the budget, and rejected scans are not counted.
- `possibleWords` ignores pencil marks, as required.
- The answer is shown only when `!active`.
- Restore checks each scan count against the answer.
- Finishing a daily in another tab is handled by `save()`.

One small note: `index.html` has a fallback `family-link` pointing to a LAN IP (`192.168.1.155`), so it should not be shipped publicly.

## Provisional scores (predictions; James's ratings override them)

| | Score | Basis |
|---|---|---|
| Fun | 3 | Real information-design choices; expected about 2.5 scans means it ends quickly |
| Clarity | 3 | Good help and lesson; pick/pencil modes and hint cost are muddy |
| UI | — | No screenshots; code suggests small targets and split evidence |
| Replay | 3 | 210 banks; puzzles may feel samey (all are "Sharp" with the same title) |
| Sharing | 3 | Clean, honest text; no date and no image |

**Needs human playtesting:**
- Whether three scans are tense or trivial for James (he found Ringcount boring).
- How much phone scrolling there is.
- How often players open the pick dialog by accident.
- Whether checking candidates mentally against the counts is fun or a chore.
