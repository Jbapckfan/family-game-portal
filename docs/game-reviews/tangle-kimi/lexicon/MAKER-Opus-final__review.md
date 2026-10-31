# Static review: Tangle lexicon expansion (final pass)

**Basis:** This is a static read of the inline sources, pins, license texts and audit aggregates only. I executed nothing. I did not inspect the 409k word rows, the actual source bytes, or `useDailySession`/`stats`/`daily` internals beyond their call sites. I treated the trailing Python runner as context, not product code.

## Critical / Important blockers

**None found.**

The items you asked me to re-check hold up statically:

- **C1 fix (`engine.ts` `dailyTangle`).** For days ≥ 20757, a legacy save is validated against `expandTanglePuzzle(original)`. That puzzle contains both the original excluded words and the extension words. A save of `[removed, extension, …]` therefore restores, `keepEdition` becomes true, and `startDaily` re-validates against the same returned puzzle.
  - Targets come from `medalTargets(original.max)`, and expansion keeps them, so score and Gold are unchanged.
  - Fresh players get `expand(review(original))`, which still excludes the 12 words.
  - Day 20756 correctly falls back to the unexpanded original.
- **Double completion (`useTangle.ts` `submitPath`).** It is guarded by `stats.lastCompletedDay !== prev.dayNumber`. `reconcileTangleCompletion` uses the same key. `markPlayed` short-circuits on a stored `countedPlayed`. The counted-gold DOM test exercises exactly the previously-counted path.
- **Generator vs. audit.** Both pin the same three files to the same hashes, including the dwyl `20f5cc9b…` pin in both JSON indexes. They also use the same tokenisation, which handles dwyl's CRLF via `\s+`.
  - Both drop non-`[a-z]` rows rather than case-folding them, so they agree with each other.
  - The audit's word-centric DFS shares no code with the trie solver. It checks every board against `lexicon-expansions.json` and the real `dailyTangle` entry point.
  - Day mapping: `20757 % 430 = 117`, so the formula hits each index exactly once.
- **Exclusions.** These are enforced in three places: the trie, `expandTanglePuzzle`, and the audit candidate filter. The test asserts that no expansion entry contains an excluded word.
- **Staging (`stage.mjs`).** The notice goes into `prepared-assets` before the atomic rename. `.txt` is allowed by the asset filter, and rollback restores the prior assets. The notice credits ENABLE's originators, as its README requests, and disclaims NASPA/WWF.

## Minor limitations (non-blocking)

1. **Notice bytes aren't verified against the pins.** `stage.mjs` only does substring checks on two of the four license files. The pins exist, but the file names differ: pinned `README-enable2k.txt` / `LICENSE.txt` / `LICENSE.md` versus local `enable2k-README.txt` / `enable2k-mirror-LICENSE.txt` / `english-words-LICENSE.md`. A one-line sha256 assertion per notice would back up the "verbatim" claim.
2. **`zynga-disclosed-words.json` is unpinned** (`pinVerified:false`). It is in-repo, authored data, covered only by your review manifest hash.
3. **Cross-tab adoption without an edition switch.** The `dailySession.configure` restore validates incoming saves against `dailyTangle(day, raw).puzzle`. A save from an old-client tab containing an excluded word is therefore accepted, but `state.puzzle` stays on the reviewed edition until reload. This requires an old client, so it falls under the acknowledged stale-tab limitation.
4. **Today's mid-round players see a different `max`/`n`.** Anyone who started Oct 31 (day 20757) on the previous client will see changed totals. Share lines will differ between clients for the same day, but medals and targets are unaffected.
5. **Hints may point at obscure dwyl entries.** The random pick is from all unfound 4+ letter words. Separately, dwyl's own README notes its list derives from an older infochimps list. The Unlicense applies, but upstream provenance is only as good as dwyl's.
6. **Bundle size.** `lexicon-expansions.json` stores the full solved list per grid, not just the additions, so it duplicates `puzzles.json` words. The cost is size only.
7. **Shared policy inputs in the audit.** The audit imports the runtime `TANGLE_REVIEWED_EXCLUSIONS`, `pointsFor` and `medalTargets`. The solver is independent; the policy inputs are shared by design.
8. **Unused scaffolding in the DOM helpers.** `blockReads`, `writes`, `advanceTimers` and the cairn timer branch are unused. This is cosmetic.
9. **The 5×5 preview targets `[10,20,30]` are still provisional,** as the code comment says.

## Verdict

**Ready**, on static grounds for the stated scope, subject to your separate package/browser/offline checks. Item 1 is the only one I'd consider fixing before ship, and it's a few lines.
