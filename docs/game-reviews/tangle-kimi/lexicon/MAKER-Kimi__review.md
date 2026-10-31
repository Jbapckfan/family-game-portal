## Critical

None found.

## Important

1. **Proven: legacy daily progress is lost after finding an expanded word.**
   `packages/kimi-pebbles/src/games/tangle/engine.ts:25-28`

   `legacy` is validated only against the unexpanded original puzzle. Consider this sequence on or after day 20757:

   - An old-client save contains an excluded legacy word, so the first load correctly selects the original edition and expands it.
   - The player then finds a newly added word.
   - On reload, that save no longer validates against `original`, making `keepEdition` false.
   - The reviewed edition excludes the legacy word, so the final restore also fails; `useTangle.ts:78-99` resets the round’s found words and score.

   **Correction:** when evaluating a possible legacy save at or after the expansion cutoff, validate against the **expanded original edition**, and retain that edition when the valid save contains an excluded word. Add a regression containing both an excluded original word and an extension-only word; the existing test at `tests/tangle-lexicon.test.ts:64-72` covers only original words.

2. **Evidence gap: the claimed pinned-source and license provenance is incomplete and not enforced.**
   `packages/kimi-pebbles/data/word-game-sources.json:1-38`
   `scripts/tangle-lexicon.mjs:9-17`

   The dwyl source is loaded and counted, but its repository, pinned revision, upstream filename, and license evidence are absent. The other entries provide license-file hashes, not the license texts needed to assess redistribution obligations. Additionally, generation merely records current input hashes; it never checks them against the claimed pins, so generator, tests, and audit could all accept a substituted local source.

   **Correction:** add the dwyl pin and license provenance, supply the required license notices, and verify expected input hashes during generation/audit. This is not proof that the current words or licenses are wrong—only that the supplied evidence does not establish those claims.

## Minor

1. **The all-430-board audit does not directly verify grid or calendar identity.**
   `scripts/audit-tangle-lexicon.mjs:31-36`

   The audit compares words, goals, totals, and score restoration, but never asserts `actual.g === p.g` or `actual.puzzleNo === i + 1`. The unit test checks those fields for only 182 days at `tests/tangle-lexicon.test.ts:39-44`.

   **Correction:** add grid and puzzle-number assertions to the 430-board audit. This is an audit-coverage gap, not a demonstrated calendar defect.

**Verdict: not ready** until the legacy-save data-loss bug is fixed and regression-tested, and the provenance requirements are resolved. Review was static only; nothing was executed or modified, and the 409k source entries were not individually inspected.
