# Circuit vocabulary fix: static review (baseline `67886a6` to working tree)

**No Critical findings.** The bitmask and arc filter are correct, and the runtime output provably matches what the generator produced. Old saves stay valid because the new list is a superset of the old one. Two Important items concern load cost and mixed-version tabs. The rest are Minor.

## What checks out

- **Bitmask prefilter** (`engine.ts:22-23`, `:35`):
  - Masks use 26 bits.
  - `WORD_MASKS[i] & ~allowed` gives a signed int32, and comparing it with `=== 0` is sound.
  - Non-`a-z` characters wrap the shift count and can falsely pass the mask. For example, `'A'` lands on bit 0. The `arc===undefined||arc<0` guard at `:31` then rejects them, and the generator's regex excludes them before that.
- **Arc rule** (`:31`): rejects same-arc adjacency, including doubled letters. This matches `tapLetter`'s rule.
  - The test oracle `[xyz]{2}` independently encodes the same rule.
- **Generator and runtime agree.** For each board B, the runtime computes the pool's words that pass B's filter, minus B's original words. This equals the generator's `additions[B]`:
  - Every word in `additions[B]` is in the pool.
  - Every pool word comes from the lexicon.
  - Adding PLUM and deduplicating through the `Set` keeps the result exact.
  - The output is sorted with the default UTF-16 sort, so it is deterministic.
  - Calling `withReviewedWords` a second time on the same board returns the input unchanged, so it is idempotent.
- **Cache identity** (`:39-44`): the cache is keyed by puzzle index, so the same index returns the same object. Effect dependencies on `s.puzzle` therefore behave as they did with the old raw `PUZZLES[idx]` references.
- **Unchanged identity values:** the day-to-index mapping (`publishedDailyIndex(..., 286)`), practice selection, save keys, `sol`, `par`, and `l` are all untouched.
- **Restoring saves** (`progress.ts:37-38`): old `played` and `current` drafts validate against the superset. `revealed`, `hintsUsed` and `countedPlayed` pass through unchanged, so the clues a player already revealed carry over.
- **Medal and share text:** `wordsUsed <= par` earns Gold with the label "target met". Over-target labels are accurate. Nothing claims the target is a minimum.
- **Supplied aggregates are internally consistent** (I read these; I did not run anything):
  - 44957 previous + 904316 added = 949273 accepted entries.
  - The `minimumCounts` values add up to 286 boards.
  - There are 182 dated selections and 182 unique dated layouts.
  - Distinct accepted words minus pool words = 148986 − 146027 = 2959 original-only words. That is plausible, but I can't verify it.

## Important

1. **The 1.56 MB pool and its masks load as soon as the module is imported, not when a puzzle is chosen** (`engine.ts:4`, `:21-23`).
   - Only the per-board filtering is lazy.
   - The pool's JSON import and the mask pass over all 146k words run when `engine.ts` is first evaluated. That pass is roughly 1.2M character iterations.
   - The strings stay resident, which I estimate at several MB of heap.
   - If any shared shell imports `engine.ts` (a game hub, previews, route preloads), every page pays this cost.
   - Three things to do:
     - Confirm the Circuit chunk is code-split.
     - Move the `WORD_MASKS` computation into the first `puzzleAt` call.
     - Check whether Tangle already ships an overlapping lexicon, in which case these bytes are duplicated.

2. **A tab still running the old bundle can overwrite saves and stats from a tab running the new one** (`useDailySession.ts:59`, together with `progress.ts:38`).
   - The old bundle's `restoreCircuitProgress` rejects new-vocabulary words such as `morn`, so `validate` fails.
   - When validation fails, `before()` returns `true`, the stale input proceeds, and `commit` writes the old tab's `played` list and its `s.stats` over the newer save.
   - This was possible before, but a vocabulary superset now triggers it from normal play during any deploy window.
   - The window is short-lived and lasts until that tab reloads. If you want to close it, a "newer or unknown save means reload and refuse to write" path in `before()` would do it. Otherwise, document it as accepted risk.

## Minor

3. **Vocabulary quality.** Test 4 requires every eligible source word to be accepted, which means Circuit applies no denylist.
   - `english-words-alpha` is known to be noisy: abbreviations, Roman numerals, and offensive terms.
   - The effect is limited to which words are accepted, since `sol` is unchanged. Still, confirm this matches Tangle's policy for the same sources.
4. **The cache never evicts entries** (`engine.ts:39`). If a player keeps cycling practice puzzles, it can eventually hold all 949k references, roughly 7–8 MB of pointer arrays. Consider keeping the daily puzzle plus one practice puzzle, with the daily one pinned.
5. **`words` order and the meaning of `n` changed.**
   - The merged list is re-sorted, and `n` now counts the expanded vocabulary.
   - Check any UI that displays `n` or `words`, such as a "N words possible" label or a list of missed words.
   - Also check for code that reads `puzzles.json` directly and so bypasses `withReviewedWords`.
6. **`words.includes` is a linear scan** in `submit` and `restore`, over about 3.3k words per board on average. That is acceptable, but a cached `Set` would be cheap to add.
7. **Test 4 cost.** It runs about 409k words × 286 boards × 2 regexes, roughly 234M regex tests. Prefiltering by the 12-letter class first would cut CI time.
8. **`generate-circuit-words.mjs --check` is not shown as wired into CI.** Test 4 effectively covers it while the sources stay pinned, so this matters little.

## Limits

- **Model:** `claude-opus-5-5` (Opus 5.5). No separate model argument was passed beyond the environment.
- **Method:** I reviewed only the excerpts you pasted. I ran no tools, commands, tests or generation, and fetched nothing.
- **Not read:**
  - the word-pool payload (I only saw your supplied hash and counts)
  - `puzzles.json` or any daily solution
  - `tangle-lexicon.mjs`, `shared/daily`, `practice`, `stats` and `integration`
  - the UI components
  - the Vite or bundling config
- **Audit figures** are your aggregates, taken as given. I did not reproduce them.
- **Performance and memory** figures are static estimates, not measurements.
- **Visual UI:** no screenshots were supplied, so I give no visual score.
