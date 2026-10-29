# Original eight games: six-month bank audit

Date: October 29, 2026. Base: `553772c`. Scope: the eight original game folders, their offline generators, tests, and this report. Root integration owns the dated schedule and the other games.

The banks now contain **210 substantive challenges per game**. Switchpath contains **217 records**, because seven previously published equivalent challenges remain preserved. There are 1,687 records in total, including 240 appended records. No published puzzle record, ID, tile ID, title, answer, or array position changed. SHA-256 assertions cover the entire prior bank, in addition to the older prefix assertions.

## Content and verification

| Game | Before → after records | Freshness rule | Full-bank logic evidence |
| --- | --- | --- | --- |
| Ringcount | 180 → 210 | Numeric rings distinct under rotation and reflection | Independent enumeration of 103,950 four-cut sets proves exactly one solution per board. Every complete cut arrangement can recover through hints and an explicit winning check. |
| Switchpath | 187 → 217 | 210 distinct neighboring-inequality challenges under all grid symmetries; changing magnitudes alone does not count | Independent search visits 59,693 legal partial paths, proves one full solution per board, and exercises actual rewind/recovery plus hint behavior from every partial path. 63 route shapes; every board has at least four branching choices. |
| Counterpart | 180 → 210 | New boards share at most two of five analogies with any earlier board; related relationship families cannot occur together in additions | All 6,720 solved-row subsets restore and finish. All 94,500 ordered row/bank pair submissions have exactly one encoded acceptance per row. Ten distinct bank words per board. All hints/reveals checked. |
| Shortlist | 180 → 210 | 210 different answer words and twelve-word banks; each new bank shares at most three words with any earlier bank | All 2,520 possible answer paths finish through the real engine within three scans. 1,051 authored displayed words; no more than four uses per word. Answer positions occur 17 or 18 times each. |
| Second Sense | 180 → 210 | New quadratic families share at most two of five words with earlier boards | All 6,720 solved-pair subsets restore and finish; 393,750 noun/verb/word combinations checked against encoded acceptance. Each of the 75 authored words appears fourteen times, with gaps of 11–19 boards including wrap. All hints/reveals checked. |
| Sideways | 180 → 210 | Different four-answer sets; each new board shares at most two answers with any earlier board | All 215,040 orientations enumerated for uniqueness, then exercised through actual row rotations and explicit completion. 546 distinct answers; each appears at most twice. |
| Tradeoff | 180 → 210 | Different six-transformation sets; each addition replaces at least three rows versus every earlier board | Every board conserves letters and forms one six-letter cycle with a five-swap solution. Actual engine recovery passes on 630 seeded exploratory runs, each starting with up to 80 attempted trades. |
| Inbetween | 180 → 210 | Different six-transformation sets; no pair of boards shares more than three rows | Independent row/tile assignment checks prove a unique usable bank tile per answer. All 13,440 solved-row subsets restore and finish through hints and real placement actions. No transformation recurs within six board positions, including wrap. |

The word games append combinations of the existing source-authored vocabulary and clues. They do not claim hundreds of new individually authored meanings. Counterpart and Inbetween reconstruct the prior edition's seam constraints before extending; changing the target alone would have rewritten existing boards. Counterpart's extension searches its reviewed pool without the exhausted least-used-first restriction, retaining repeat-gap, family-exclusion, distinct-word, and overlap checks.

The thirty new Counterpart boards were inspected as full cue/answer sets. The additions retain the original explanations and avoid the existing broad interchangeable-family groups. Engine tests establish exact encoded acceptance, not a mathematical proof that every natural-language analogy has only one conceivable reading.

## Practice restart correction

Counterpart and Second Sense had a reproducible state bug: `restart()` created a fresh engine state, but `resetView()` discarded the in-memory draft key, so the next render reloaded the previous unsent draft from `sessionStorage`.

The restart now requests draft deletion only after the save is accepted. Board switching continues to restore unsent drafts. When a stale tab discovers newer saved progress, the restart is canceled and its draft remains intact. Scoring, penalties, engine formats, storage keys, and daily records are unchanged.

Six tests execute each game's actual app and shell in a Node VM with DOM/storage stand-ins:

- Restart clears the visible draft, survives an app reload, and preserves the daily draft.
- Switching practice boards retains their unsent drafts.
- A stale restart adopts newer progress without deleting its draft; a subsequent explicit restart clears it.

The two restart regressions were first observed failing against the prior implementation, then passed after the fix. No browser or device playback/UI certification is implied.

## Canonical identity API

Each game exports `substantiveKey(puzzle)` from `games/<slug>/content-identity.mjs`. These dependency-free functions are available to the root schedule harness. They ignore puzzle IDs, titles, difficulty labels, row order, and relevant equivalent presentations. Switchpath additionally ignores magnitude-only relabeling and canonicalizes neighboring inequalities with start/end over all eight grid symmetries. Shortlist conservatively treats a reused candidate bank with a different designated answer as the same challenge. Counterpart resolves target words from tile IDs before fingerprinting, so renamed tile/source IDs cannot create false novelty.

Twenty-four identity regressions check all records against metadata changes and equivalent presentations, then require 210 substantive keys per game.

## Historical preservation

The following digests cover `JSON.stringify(PUZZLES)` at the base checkpoint. Each is asserted against the identical-length prefix of the expanded bank:

| Game | Preserved records | SHA-256 |
| --- | --- | --- |
| Ringcount | 180 | `dfbe0bdda409342a29b77753d2588d814f4603ccc1be17c1826193a3031d3639` |
| Switchpath | 187 | `6be9368a99f036f8951b77079c0ff0812320a80801c6387fbab24975ea15d6b1` |
| Counterpart | 180 | `08076f67e777dd47c48c357aef787c812732444ceaf8d0b2b882bd4cb1350ba4` |
| Shortlist | 180 | `e729d5db5e4b52814132de72cc2b2c743a620a98129fef241c09643bf82e98da` |
| Second Sense | 180 | `e2638ed99f67565b77d2bc15795eba10599afb4207052c4a3c282a05f8d5f81d` |
| Sideways | 180 | `28bc96322667405707f90dc6fa475fcd38b0b2d4b856bbca9bed7ea42e13ffe0` |
| Tradeoff | 180 | `128c2beacff6faa6b108f910910bdeea475e902e0d99fb519c2d6553b63e92d3` |
| Inbetween | 180 | `eee07e7e22fdced4c94de06754a04f19dd51eefa426668505d23be1d69b27750` |

Preserved Switchpath equivalents are `020 = 017`, `022 = 012`, `029 = 012`, `052 = 042`, `059 = 043`, `066 = 015`, and `078 = 009` (all IDs prefixed `switchpath-`). They must remain accessible for historical saves, but the integrated fresh-day schedule must skip their repeated challenge identities. This branch does not change `getDaily` or claim that raw bank modulo selection alone provides a consecutive fresh six-month schedule.

## Reproduction and limits

```sh
node --test games/{ringcount,switchpath,counterpart,shortlist,second-sense,sideways,tradeoff,inbetween}/tests/*.test.mjs
# 375 passed, 0 failed, 0 skipped.

# In each of the eight game directories:
node scripts/generate-puzzles.mjs --check
npm run check
```

All eight offline generators reproduce the checked-in banks exactly. All eight syntax-check commands pass. The scope's full test suite passes, covering engine rules, persistence, hints, reveal, recovery, daily/practice separation, historical content, and novelty.

Remaining integration work: preserve dated assignments and validate 182 consecutive fresh days from October 29, 2026 through April 28, 2027 in the final schedule. External model review and whole-collection integration belong to the root task. Natural-language clue quality and human difficulty remain editorial judgments; these checks do not establish calibrated difficulty or universal semantic uniqueness.
