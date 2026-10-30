# Second Sense engine and editorial contract

Second Sense matches two meanings of the same spelling. Five noun-definition cards and five verb-definition cards are shuffled separately. The player selects one of each and types the word that fits both. A correct pairing and word locks both cards. A wrong valid check scores one attempt but consumes nothing. Draft selections and typing are free. Five checks without hints is perfect. There is no timer or loss limit.

The opening board includes FENCE, BARK, and WIND as requested, plus TENDER and COURT. Pronunciation can change between meanings: WIND as moving air and WIND as wrapping thread have the same spelling. Noun and verb senses must both be established English usage. Clues are original prose, not copied dictionary definitions.

Each noun card has one optional counted hint: the canonical answer's first letter and length. It does not identify the matching verb. Repeating that hint adds no cost. Revealing all remaining pairs is a terminal `revealed` result, never a win or streak.

## Stable data and state

Puzzle: `{id,title,difficulty,nouns:[{id,clue}],verbs:[{id,clue}],pairs:[{nounId,verbId,word,answers:[word,...aliases],explanation,sourceId}]}`. Each published board contains five noun cards, five verb cards and five answer pairs. Alternative accepted spellings or words may be explicitly supplied when both definitions genuinely allow them. There is no fuzzy semantic scorer.

State: `{puzzleId,placements:[],attempts:0,hintedNouns:[],status:'playing'}`. Each completed placement is `{nounId,verbId,word}`. Placement order is solving order; either column can therefore be displayed in its own shuffled order. Status is `playing`, `won`, or `revealed`.

## API

- `EPOCH`, `getDateKey(now)`, `getDayNumber(dateKey)`, `getDaily(puzzles,now)`.
- `createGame(puzzle)`.
- `normalizeWord(value)` returns trimmed uppercase English letters, or null for anything other than a single word of 2–18 letters.
- `submitPair(puzzle,state,{nounId,verbId,word})` returns `{state,accepted,changed,reason,word}`. Invalid IDs, incomplete selections, malformed words, reused cards, and terminal actions are unscored. A valid incorrect answer or pairing returns `no-match` and costs one check.
- `useHint(puzzle,state,nounId)` returns `{state,hint:{nounId,firstLetter,length}|null,changed}`. Repeated hints return the same hint with `changed:false`.
- `revealGame(puzzle,state)`, `restoreGame(puzzle,raw)`, `isPerfect(state)`.
- `getStats(records,todayKey)` accepts date-keyed records `{status,attempts,hints}` and returns `{played,won,streak,bestStreak,perfect,averageAttempts}`. Use `hintedNouns.length` for the record's hint count.
- `formatShare(puzzle,state,{number,mode,url})` produces spoiler-free text.

Chicago midnight controls the daily puzzle. The release epoch is October 20, 2026. The finite collection repeats after 210 days. Each of 75 original noun/verb pairs appears fourteen times, in distinct composed boards.

## Validation

Tests cover immutable scoring, normalization, pairing and spelling, reused cards, hints, reveal/win separation, save corruption, statistics, calendar boundaries, sharing, all solved-pair subsets and all encoded matching alternatives. Semantic review is a separate editorial task: a stored answer table does not prove that English has no other interpretation.

The final collection was reviewed as 75 individual pairs; the expanded edition has 210 complete clue boards. Each source pair appears exactly fourteen times, in different neighboring sets, with 11–19 daily positions between appearances. The independent noun and verb ordering never presents the entire answer mapping already aligned.

Potential overlaps were considered in composing the sets: MATCH and CONTEST do not share a board; neither do COACH and BUS, nor COACH and TRAIN. These would create broad noun or verb definitions that could become interchangeable. SOLE was rejected from the fish group because its fish sense would overlap the FLOUNDER clue. The retained noun clues distinguish bony flatfish from ray-related fish. No published board currently needs a second accepted word, but the engine supports explicit alternatives and tests that they survive saving and revealing.

The edition uses American English. TABLE explicitly labels the U.S. sense because British usage can point in the opposite direction. CAN and TANK identify their informal verb senses. WIND, LEAD, SOW, TEAR, BOW and BUFFET explanations describe the pronunciation change; several other noun/verb pairs explain their changed stress. Difficulty labels are editorial, not calibrated with external play-test data.

Verification passed: 24 engine tests and seven collection tests, including all 6,720 puzzle/solved-pair-subset states and 393,750 noun/verb/known-word combinations. After UI integration, ten shared-shell regressions also pass with the actual Second Sense engine and record adapter. They cover failed storage, terminal-save reconciliation, stale tabs, practice separation, restart restrictions, and Central-day changes. The complete project `npm test` and `npm run check` both pass.

## Lexical verification

Clues and explanations are original wording. Less-common senses and regional distinctions were checked against these primary dictionary entries on October 20, 2026:

- [Tender](https://www.merriam-webster.com/dictionary/tender): service boat and formal offer.
- [Quail](https://www.merriam-webster.com/dictionary/quail): game bird and recoiling in fear.
- [Carp](https://www.merriam-webster.com/dictionary/carp): fish and persistent fault-finding.
- [Smelt](https://www.merriam-webster.com/dictionary/smelt): small fish and processing ore with heat.
- [Fox](https://www.merriam-webster.com/dictionary/fox): canine and baffling/outwitting.
- [Quarry](https://www.merriam-webster.com/dictionary/quarry): hunted animal and extracting stone.
- [Port](https://www.merriam-webster.com/dictionary/port): wine and adapting software.
- [Buffet](https://www.merriam-webster.com/dictionary/buffet): self-service meal and repeated blows.
- [Content](https://www.merriam-webster.com/dictionary/content): published material and satisfying someone.
- [Table](https://www.merriam-webster.com/dictionary/table): furniture and U.S. postponement sense, with different British usage.

Searches for the exact game title did not surface an existing daily word game titled Second Sense. This was a brief collision check, not trademark clearance or a claim that double-definition puzzles are new. The user specifically requested the noun/verb relationship mechanic.
