# Static review: Alford Daily remaining games, Circuit/source acceptance, shared sharing/calendar

**Scope:** I only read the supplied patch, helpers and excerpts. I ran nothing and validated nothing myself. This review does not certify UI/visuals, rights, semantic quality, payload membership or devices. Kimi Tangle v3 is excluded.

### 1. Important: Claude games probably omit hint counts from shares
- **Mechanism:** All six `games/claude-*/app.mjs` excerpts import `assistanceCount`, but no excerpted config line passes it. The DeepSeek and Qwen excerpts do show `assistanceCount:`. `common.mjs` treats the field as optional, so leaving it out fails silently. A three-hint Dovetail solve then shares exactly like a clean solve.
- **Fix:** Pass `assistanceCount` in each Claude config. Make `mountDailyGame` throw at mount when `config.hint` exists without `assistanceCount`.
- **Quartet:** `QuartetPage` passes `state.hintsUsed`, but the `useQuartet` diff neither adds nor persists it. Confirm it exists and is restored from storage. Otherwise a player who reloads and then finishes gets a share with no hint line and the "no misses" title.
- **Memory Maze:** It maps `replays` to the "Hints:" label. Confirm that wording is intended.

### 2. Important: `vocabulary:2` is tied to a payload that can change
- **Mechanism:** The marker records no payload generation, and replay recomputes outcomes from whatever `vocabulary.mjs` is current. Any regeneration, including the planned rerun after this supplement, can change the result of an already-stored v2 event:
  - **Tangle:** a recorded knot whose beads now form a viable partition gives `target!==undefined`, so `replay` returns null.
  - **Splice:** a recorded mistake that now passes `canPair` becomes a pair, so later attempts on those tiles are invalid.
  - **Keystone:** a new alternative turns a recorded strike into a win, so the next event hits `r.status!=='playing'` and returns null.
  - **Dovetail:** a recorded miss becomes a solve.
- **Effect:** `restoreState` returns null and the save is discarded.
- **When it's safe:** Only if no v2 save exists before the final payload ships.
- **Fix:** Export a payload hash from each `vocabulary.mjs` and test it against frozen v2 fixture saves. Any future regeneration should become `vocabulary:3`, with the v2 payload kept.

### 3. Important: Tangle v2 charges a knot for the correct word on the wrong duplicate beads
- **v1 behaviour:** The authored word with blocking copies became a pull plus a free "Undo pull to choose different beads".
- **v2 behaviour:** The same selection is listed and has a slot, but `wordPartition` returns null, so it becomes a knot.
- **Repro shape:** Use a board where a needed letter appears twice and only one copy leaves a valid cover. Select the word using the other copy. The player loses one of their 4 knots.
- **Side effect:** The "copies block another thread" message branch can no longer be reached in v2.
- **Fix:** When the selection isn't viable, enumerate other unremoved-bead paths that spell the same word. If any of them is viable, return a no-knot message (or substitute that path). Charge a knot only when no placement of that word works. Land this before any v2 saves exist (see #2).

### 4. Important: Keystone feedback and acceptance use different predicates
- **Mechanism:** A win comes from the precomputed `WORD_GAME_ALTERNATIVES[roundKey]` lookup. Feedback comes from `joins()`, which accepts either concatenation order, while `fused()` is directional. With all 5 clues visible, a word can read "joins 5 of 5 visible clues… It must fit all five" and still take a strike.
- **History:** This already existed in v1, but the broader v2 joins make it much more frequent.
- **Related:** `roundKey` ignores clue direction.
- **Fix:** Compute acceptance at runtime as `WORD_GAME_WORDS.has(w)&&round.clues.every(c=>WORD_GAME_JOINS.has(fused(w,c)))`, or add a test asserting the alternatives map equals exactly that for every round. Use `fused` for the fit counts too.

### 5. Important (depends on unshown code): Splice hint pair can go stale
- **Mechanism:** `restoreState` requires `hintPair` to stay `canPair`-viable. Under v1's unique matchings, any accepted pair kept the hint viable unless it used the hint's tiles. Broader v2 joins can create several perfect matchings. A player can then accept a different valid pair that makes the hinted pair non-viable without touching its tiles.
- **Effect:** Unless the unshown tail of `submitPair` clears `hintPair` on lost viability (not just on tile overlap), the persisted state fails restore. Meanwhile `hint()` stays blocked because `s.hintPair` is still set.
- **Fix:** After each accepted pair, keep `hintPair` only if `canPair(p,after.used,...hintPair)` holds.

### 6. Minor: missing per-puzzle payloads fail inconsistently
- **Sprout:** `puzzleForState` throws inside `analyze`, so `restoreState` throws instead of returning null.
- **Tangle:** `paths()` throws the same way.
- **Twin Hive and Syntax Siege:** `WORDS_BY_RACK[...]||[]` silently drops the expansion. They also use different key conventions: Twin Hive uses raw `puzzle.letters`, Siege uses the sorted rack.
- **Fix:** Add a build test that every `PUZZLES` id or rack, daily and practice, has a payload entry under the key convention that game uses. Have `createExpandedState(p)` mark v2 only when that entry exists.

### 7. Minor: one word source is unpinned
- **Mechanism:** `loadTangleLexicon` has no pin for `zynga-disclosed-words.json`. Also, `if(pins[file])` turns any missing or undefined pin, such as a manifest key typo, into a silent skip. `pinVerified:false` is recorded but never asserted.
- **Fix:** Throw when any loaded file has no pin.

### 8. Conditional: Rung pars and route consistency
- **Possible load failure:** `puzzles.mjs` no longer imports `findRoute`. If the unsupplied expansion block still calls it to compute pars, the module throws a ReferenceError on load.
- **Consistency:** The instructions say the target shown is the shortest route, so confirm win, share and stats all use `shortestSteps` rather than `p.par`.
- **Saves:** Confirm `restoreState` doesn't check a saved `hintWord` against the current shortest route. Lexicon growth would make that reject old saves.

### Also check
- **Practice protection:** `fresh-reserve` only evaluates `practiceCandidates` at `dates[0]`. If candidates depend on the date, a later date could expose future reserves. Add per-date checks, plus a check that none of the 182 was published or offered in Practice before 2026‑11‑01.
- **Circuit:** `PUZZLES` is now raw, and only `dailyCircuit`/`practiceCircuit` go through `puzzleAt`. Any other `PUZZLES[i]` use, such as an archive or restore by number, would lose PLUM and the additions. Search the file for other references.
- **Markerless broadening:** Tumbler, Rung, Twin Hive, Siege and Circuit broaden acceptance without a marker. That is superset-only, so legacy saves still replay, but in-progress markerless rounds do get the new rules. Confirm this exception to "old markerless rounds keep old rules" is intended.
