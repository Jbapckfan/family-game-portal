# Counterpart engine and editorial contract

Counterpart is a daily meaning puzzle for the Alford family games collection. Five visible word pairs each demonstrate a relationship. The player chooses an ordered pair from ten shared word tiles to reproduce that relationship. Every tile is used once. The challenge is identifying the relationship and its direction, not spelling obscure answers.

There is no timer or loss limit. A deliberate valid check costs one attempt. Correct pairs lock and leave the bank; incorrect pairs consume nothing. Incomplete, duplicate, already-used, locked-row, and terminal actions do not count. Five checks without hints is perfect. Each row can reveal its relationship label once as a counted hint. A full reveal is a separate terminal state and never earns a win or streak.

## Data

Each puzzle has `{id,title,difficulty,rows,tiles}`. Every row is `{id,sourceId,cue:[A,B],answer:[tileIdA,tileIdB],relationship,explanation}`. Every tile is `{id,word}`. The collection contains 30 explicitly authored five-row boards, drawn from 90 original analogies for 150 row appearances. Each analogy appears once or twice, separated by at least six daily board positions including the cycle boundary. The content uses directional relationships; reversing the correct pair is not accepted. Related words must match the most specific relationship shown, not merely belong to a common topic. Explanations appear after solving or revealing; a hint reveals only the relationship.

All ten bank words are distinct within a board. Each answer pair uses two distinct tiles. No answer tile occurs in two rows. The collection is finite and repeats after 30 days. The release epoch is October 20, 2026, and the daily boundary is midnight in America/Chicago.

## API

- `EPOCH`, `getDateKey(now)`, `getDayNumber(dateKey)`, `getDaily(puzzles,now)`.
- `createGame(puzzle)` returns `{puzzleId,placements:[null,...],attempts:0,hintedRows:[],status:'playing'}`.
- `submitPair(puzzle,state,{row,tileIds:[a,b]})` returns `{state,accepted,changed,reason}`. Rejection reasons are `finished`, `invalid`, `locked`, `used`, or scored `no-match`.
- `useHint(puzzle,state,row)` returns `{state,hint:{row,relationship}|null,changed}`. Repeated hints are returned but not counted again.
- `revealGame(puzzle,state)` fills answers and marks `revealed`.
- `restoreGame(puzzle,raw)` validates persisted data and returns a fresh game on malformed input. The placements determine whether a non-revealed save is won.
- `isPerfect(state)` means won in five checks with zero hinted rows.
- `getStats(records,todayKey)` accepts records keyed by date with `{status,attempts,hints}` and returns `{played,won,streak,bestStreak,perfect,averageAttempts}`. Reveals count as played but not won. Future records are excluded when a valid today key is supplied.
- `formatShare(puzzle,state,{number,mode,url})` returns a spoiler-free text result.

## Validation plan

Tests cover scoring, immutable transitions, invalid/used actions, direction, hints, reveal semantics, corrupted saves, stats, Central-time midnight and DST, share spoilers, and completing every puzzle from every solved-row subset. Content is explicitly authored and reviewed for natural directional relations and competing bank combinations. Structural tests cannot prove semantic uniqueness; the editorial review remains necessary.

## Related mechanics

Analogies are an established verbal-reasoning format. Related daily products include Daily Analogy (https://dailyanalogy.com/) and Analogees (http://analogees.com/). Creator posts describe Analogees as grouping 24 words into six complete analogies; its site could not be fetched during this review. Counterpart makes no claim to invent analogies or be the first analogy game. Its distinguishing product rules within this family collection are the five visible reference pairs, ten shared answer words, two ordered selections per row, finite authored boards, per-row relationship hints, and unlimited counted checks.

## Editorial audit, October 20, 2026

All 90 entries and all 30 composed banks were read for natural usage, direction, and competing alternatives. The final remix pass removed a second generic part/whole answer from board 20, an introductory-part answer beside a physical outer layer from board 23, a harm/remedy answer beside a need/remedy answer from board 25, and a second reversed causal pair from board 29. Such collisions can be linguistically plausible even when the stored answer IDs are unique, so passing structural tests is not described as semantic proof.

The relationships are deliberately more specific than "associated with," "related to," or "part of." For example, bark/tree is an outer covering and its organism, while chapter/book is a narrative section and its complete work. The player-facing instructions should ask for the most specific matching relationship. Every accepted pair has an original explanatory sentence available on completion and reveal. No answer depends on a current event, a celebrity, a proprietary embedding score, a homophone spelling trick, or external API access.

Difficulty labels are editorial descriptions, not play-test calibration. The longest bank word is PALEONTOLOGIST. The first board contains relatively accessible words while still requiring a two-word ordered inference. Vocabulary familiarity and semantic judgment vary by player; a production daily editorial process should continue to record and review credible alternative answers reported by players.

Verification: 23 pure-engine tests and six collection tests pass. Collection checks include every one of the 960 puzzle/solved-row-subset states, every one of the 13,500 valid ordered bank-pair checks, all hints, all reveals, and save restoration. The complete project `npm test` and `npm run check` passed after integration with the shared shell tests.
