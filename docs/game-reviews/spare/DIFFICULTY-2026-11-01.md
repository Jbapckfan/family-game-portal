# Spare — difficulty feedback

James, November 1, 2026:

> the game is too easy

Record **too easy**, without inventing an enjoyment score, replay answer, keeper verdict or relative rank. Retention remains undecided. The current round stays available.

## Source findings

Inspected `games/deepseek-spare/engine.mjs`, `app.mjs`, and `puzzles.mjs` at `e2f13e7b77704225a2597180ed0dc5ed33612ddd`.

- Every one of the 200 prepared boards has the same four-pair antonym task and one spare. There is no escalating reasoning mechanic.
- The bank combines 120 unique unordered pairs and 30 spare words. None of those spare spellings ever appears as a paired word. These counts are direct set comparisons, not a linguistic difficulty score.
- The source explicitly describes the spares as neutral concrete nouns. Many paired words are adjectives or verbs, which can make the unrelated spare conspicuous. This is a design assessment, not an exhaustive part-of-speech classification.
- The actual daily selector chooses `spare-040` for November 1. In its initial deterministic three-column arrangement, all four matching pairs share a row or column. The observed desktop preview matches that starting arrangement. A player-triggered shuffle can change it.
- The current hints reveal an entire pair; the strike cap does not make identifying obvious opposites more demanding.

The issue is substantive difficulty, not a failed touch/keyboard control. Both input methods passed the collection's recent browser checks. Automated solvability and calendar distinctness do not establish fun or human difficulty.

## Next decision

A possible harder sample would use plausible spare words from the same grammatical/semantic neighborhood and contextual relationship clues. It must avoid rejecting a legitimate alternative pairing; puzzle semantics and accepted matchings need deliberate review. More tiles, rarer vocabulary or a timer alone would not address this issue.

The alternative is to classify Spare as a replacement candidate and compare it with the new-game candidates. James has not chosen between these options or requested removal. No engine, published puzzle, save or gameplay rule was changed during this feedback audit.
