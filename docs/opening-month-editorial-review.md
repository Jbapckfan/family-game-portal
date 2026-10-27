# Opening-month quality and provenance review

Window: **2026-10-20 through 2026-11-18**, using the existing America/Chicago calendar and epoch. This is a bounded source/editorial audit, not a claim of blind human playtesting or legal clearance.

## What was reviewed

The actual selectors for all **32 games** executed for all 30 dates: **960 selections**, with 30 distinct puzzle IDs per game. `daily-runway.json` records every selected ID. Existing complete bank tests check the mathematical/content invariants; IDs alone do not certify novelty or difficulty.

The four featured games were inspected over all **120 featured selections**. `opening-month-audit.json` includes the selected IDs, difficulty labels, content fingerprints, all **90 distinct Counterpart analogies** appearing in 150 rows, and all 30 Shortlist candidate sets and answers. All four featured games have 30 distinct board/content-set fingerprints. Shortlist has 30 distinct answers and 354 distinct candidate words across 360 appearances.

## Editorial findings

- **Ringcount:** compact arithmetic and a unique-cut rule make a clear entry point. Existing exhaustive solution tests support mechanical fairness. The first board is labeled Sharp; the collection should not promise beginner difficulty or a measured completion time. Keep the no-timer, editable-cut and hint behavior.
- **Switchpath:** a clear alternating rule, numbered tiles and reversible path suit a second logic option. Unique mathematical paths and valid adjacency are tested. Planning a full route is harder than understanding the rule; retain the existing help and hints. Human difficulty calibration remains open.
- **Counterpart:** the 90 reviewed relations have supporting explanations and no required external dictionary lookup. Repeated source analogies account for **60 of the 150 row appearances**; later distinct boards recombine known material. This is a novelty limit, not a new-content pipeline. Potential editorial discussion items: #4 EMBER/FIRE versus ECHO/SOUND uses a broad “lingering trace” relation; #34 CENSOR/OBSCENITY and #88 ARMOR/SOLDIER need audience/tone review; #56 CONFIDENCE/ARROGANCE and CAUTION/TIMIDITY are interpretive rather than exact equivalences; #87 PRISM/SPECTRUM and KILN/CERAMICS use a broad “helps create” relation. Explanations make the intended reading explicit; no authored answers or save identities were changed.
- **Shortlist:** all 30 answer words appear among their 12 displayed candidates. The answer set is distinct across the month, with only six repeated candidate words. The visible finite list makes vocabulary recognition less exclusionary than a free-text dictionary game. FJORD and PLUMB on the first board may slow younger/non-native readers; US spellings such as FIBER, VIGOR, RUMOR, FAVOR and LABOR need a clearly chosen editorial locale. TRAMP, SCREW and PUNCH have multiple senses; audience review should consider the words as displayed, without inventing an offensive intended meaning. No words were silently replaced.

Today's Three rotates three of these four existing games. It is a small suggested ritual, not an additional score or reward system. All 32 games remain available.

## Distribution rights are a separate release gate

- Original game source labels and import manifests document development/receipt history, not a legal grant for every embedded word list, clue or asset.
- `sources/kimi/provenance.json` identifies the supplied package and its archive hash. The bundled broad dictionary at `packages/kimi-pebbles/src/games/cairn/data/dict.txt` needs documented upstream origin and redistribution terms. Its semantic/audience suitability also remains broader than the tested corrections.
- `sources/claude/provenance.json` identifies the Foreword archive and the existing review already flags broad/generated word material. Obtain/record the origin and terms for its dictionaries and content pools before commercial distribution.
- DeepSeek and Qwen manifests preserve concept/import attribution. They do not establish ownership or redistribution permission for all content. Font license files/provenance are retained; their presence does not clear unrelated dictionaries or artwork.
- The four featured source pools are described as curated/original in source, but that description is not independent clearance. Owner review of source agreements and asset/content provenance is still required.

## Remaining launch gates

- Human opening-month play/edit pass for ambiguity, locale, age suitability and difficulty; review the flagged items above before marketing a family-oriented paid release.
- Physical iPhone/iPad interaction, VoiceOver and large-text acceptance, sustained low-end performance.
- Rights/provenance records and owner approval of distribution metadata. Commerce stays disabled; any prices remain proposed tests.

Reproduce: `node scripts/verify-30-days.mjs 2026-10-20 --write`, `node scripts/audit-opening-month.mjs`, then the complete game test suites. The generated audit is internal evidence and may contain answers; the share feature never reads or serializes it.
