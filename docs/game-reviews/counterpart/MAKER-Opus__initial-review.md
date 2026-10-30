# Counterpart review (source-only)

**Scope:** I read only the inline text of `engine.mjs`, `app.mjs`, `shell.mjs`, `index.html` and `analogy-audit.json`. I did not open `styles.css`, `puzzles.mjs`, the tests, the daily-rotation modules or either PNG, and I executed nothing. Because I did not see `puzzles.mjs`, I can't tell which analogies share a board, so every conflict below is marked **[if co-boarded]**. I give no visual scores. Layout claims come from DOM order only.

## Analogy audit (90 records)

**Interchangeable relationships.** This is the main fairness risk. The engine accepts only the exact ordered tile IDs, so a valid alternative gets the generic message "doesn't carry the same relationship." That mislabels it. **[if co-boarded]**
- **Instruments:** COMPASS→DIRECTION, SUNDIAL→TIME and SEISMOGRAPH→TREMOR all accept BAROMETER/ODOMETER/THERMOMETER answers.
- **Tool→action:** LEVER→PRY, NEEDLE→SEW, SIEVE→SIFT and OVEN→BAKE. AWL→PIERCE, CHISEL→CARVE, NET→CATCH and LOOM→WEAVE swap freely.
- **Covering→covered:** GLOVE→HAND, BARK→TREE and SHELL→TURTLE. SHEATH→BLADE, RIND→FRUIT, ARMOR→SOLDIER and HUSK→CORN all fit any of them.
- **Part→whole:** CHAPTER→BOOK, CHORUS→SONG, PETAL→FLOWER, GRAIN→SAND, DROPLET→CLOUD, SHIP→FLEET and ANT→COLONY.
- **Growth stages:** ACORN→OAK, BUD→BLOSSOM and INFANT→ADULT accept CATERPILLAR→BUTTERFLY, LARVA→ADULT or SAPLING→TREE.
- **Others:** PROLOGUE/APPETIZER (OVERTURE→OPERA vs PRELUDE→CONCERT); CANAL→BOAT vs ORBIT→PLANET (RAILWAY→TRAIN vs ITINERARY→TRAVELER); CAMOUFLAGE→VISIBILITY vs ANCHOR→DRIFT (MUFFLER→NOISE vs BRAKE→MOTION); MOLT→FEATHERS vs PLUCK→FEATHER (SHED→LEAVES vs PRUNE→BRANCH); SEED→SOW vs DEBT→REPAY vs KNIFE→SHARPEN (VOTE→CAST, RIDDLE→SOLVE and STRING→TUNE all fit "thing→action applied").

**Direction flips that create cross-row valid answers. [if co-boarded]**
- AUTHOR→NOVEL vs HONEYCOMB→BEE: SYMPHONY→COMPOSER fits the second row.
- MARBLE→STATUE vs ICICLE→WATER: POT→CLAY fits the second row.
- ORCHARD→TREES vs SHIP→FLEET: BOOKS→LIBRARY fits the second row.

**Repeated words.** If two of these meet on one board, the display shows two identical words. Picking the "wrong" one is rejected as a relationship error even though the player chose the same word.
- CLAY (POT, POTTER)
- ECHO (SOUND, HEARING)
- HEAT, FRICTION, ADULT, TREE, CHISEL, FOSSIL and DISTANCE all recur as answer words, and ANCHOR appears in two cues.

Please confirm that `puzzles.mjs` and the tests exclude these pairings.

**Weak individual records:**
- ROOT→ANCHOR is labelled "Body part → function", but a root isn't a body part.
- PRISM→SPECTRUM / KILN→CERAMICS: "separates" vs "fires" are loose parallels.
- TEACH→LEARN / TELL→HEAR has an awkward explanation.
- FILTER (a device) vs CENSOR (a person).
- SCRIBE→PEN runs person→tool, the opposite direction of the tutorial's PEN→WRITER. Reverse feedback rescues players, but it costs a check.

**Difficulty.** Many answer pairs are strong collocations: THIRST/WATER, DAWN/DUSK, SPRINT/SPEED, SOPRANO/HIGH, WOLF/PACK. Players can pair the bank by association and ignore the cues entirely, and reverse feedback then confirms membership. This is close to the Ringcount "easy" profile.

**Replay.** Each analogy appears on 10–14 of the 210 boards. After a few weeks, practice will mostly re-serve memorized answers.

## Concrete defects

1. **Bank-to-active-row distance.** Trigger: correct check (`checkPair`). Focus goes to the first bank tile with `preventScroll`, then `scrollIntoView` puts the active row at the top. Keyboard focus ends up off-screen above the visible row. On a phone, rows 4–5 sit below the bank and hero, so every pick needs a scroll. *(Whether the bank is sticky is unverified because I didn't read the CSS.)*
2. **Stale slot after auto-advance.** `checkPair` sets `slotIndex=0`, and `renderGame` then jumps to the first unsolved row without recomputing the slot. If that row has a saved first word, the next tap overwrites it. The jump can also go backwards, e.g. solving row 4 returns to row 1.
3. **Hint has no confirmation and sits next to Check.** In `renderGame`'s action row, one mis-tap permanently records a hint and ends a perfect run. The label "✦ Hint" doesn't say it is scored.
4. **Misleading Esc message.** The global `keydown` handler announces "Draft cleared. Every unused word is available." even on a won or revealed board.
5. **"Check pair ↵" implies an Enter shortcut.** No Enter handler exists; Enter only works when the button itself has focus.
6. **Unclear row state.** The same tile can be drafted in several rows, but the bank marks only the active row's draft. "N words left" counts only locked words.
7. **Minor issues:**
   - The `row-state` text "as…" is cryptic.
   - "Tap to work" shows on desktop.
   - `#feedback` (role=status) and `#announcer` probably double-announce *(speculative)*.
   - Shell copy for `status==='lost'` is unreachable.

Draft restoration (sessionStorage per date/puzzle, validated, cleared on restart) looks sound in source.

## Scoped improvements

1. **Compact phone flow:** keep the bank sticky, or mirror the active row's two slots directly under the bank. After a solve, focus the next row's first empty slot. On phones, collapse the hero and sidebar.
2. **Fix slot and row advance:** recompute `slotIndex` from the draft and advance to the *next* unsolved row.
3. **Hint guard:** label it "✦ Hint (counts)" and require a second tap ("Tap again to show"). Keep it out of the Check button's thumb zone.
4. **Content gate:** add a test that rejects boards containing duplicate words or relationships from the same cluster above. This changes how boards are built, not scoring.
5. **Small fixes:** make Esc a no-op on finished boards, drop the "↵" or add an Enter handler, and shade other-row drafts in the bank.

## Share image

Use a square card with the date or practice number, then "Solved", "Perfect" or "Revealed", plus the honest check and hint counts. Show no word, pair, cue, row grid or URL. The current text squares are always 5🟩 or 5🟨, so they carry nothing and can be dropped.

## Provisional scores (predictions, not James's rating)

| Area | Score | Reason |
|---|---|---|
| Fun | 3 | Satisfying "aha" moments, but association-solvable |
| Clarity | 3 | Rules are clear; valid alternatives get mislabelled |
| UI | — | No visual score; interaction flow is 3 from source |
| Replay | 2 | Analogy reuse is high and answers are memorable |
| Sharing | 3 | Honest counts, but a low-information grid |

## Needs human playtest

- Whether James solves by reading the cues or by pairing bank words.
- How often the bank→row scroll annoys him on a 390-px phone.
- Accidental hint taps.
- Whether a rejected-but-valid alternative feels unfair.
- Whether practice feels repetitive within a week.
- Whether the palette is brown or teal. I can't tell: `theme-color` is cream and I didn't read the CSS.
