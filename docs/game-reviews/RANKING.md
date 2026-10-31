# Preference ranking and review queue

Current preference groups from James's playtests:

- **Keepers:** Switchpath, Counterpart, Shortlist, Second Sense, Tradeoff, Inbetween, Cairn, Morph and Kimi’s Tangle — would play again. Their relative order is not yet supplied.
- **Replacement candidates:** Ringcount — “pretty easy and boring”; Sideways — “not a big fan…too easy.” Both remain available.

Inbetween is **6/10** from James. No numerical enjoyment scores were supplied for the other games. The table below is the review queue, not a forced ranking between keepers.

| Review order | Game | Creator | Status | James rating |
|---:|---|---|---|---|
| 1 | Ringcount | ChatGPT | Replacement candidate: easy, boring | Qualitative feedback |
| 2 | Switchpath | ChatGPT | Keep; spacing follow-up | Likes it; play again: yes |
| 3 | Counterpart | ChatGPT | Keep; larger words delivered | Play again: yes |
| 4 | Shortlist | ChatGPT | Keep | Play again: yes |
| 5 | Second Sense | ChatGPT | Keep | Play again: yes |
| 6 | Sideways | ChatGPT | Replacement candidate: too easy | Qualitative feedback |
| 7 | Tradeoff | ChatGPT | Keep; difficulty follow-up | Keeper; a bit too easy |
| 8 | Inbetween | ChatGPT | Keep; drag-and-drop delivered | 6/10; could have harder clues |
| 9 | Cairn | Kimi | Keep; revised finish delivered | Keeper; no numerical score |
| 10 | Morph | Kimi | Keep; revised game delivered | Keeper; no numerical score |
| 11 | Tangle | Kimi | Keep; corrected 5×5 sample open | Keeper; 5×5 verdict pending |
| 12 | Hunch | Kimi | Not yet reviewed individually | — |
| 13 | Circuit | Kimi | Not yet reviewed individually | — |
| 14 | Quartet | Kimi | Not yet reviewed individually | — |
| 15 | Twin Hive | DeepSeek | Not yet reviewed individually | — |
| 16 | Spare | DeepSeek | Not yet reviewed individually | — |
| 17 | Rung | DeepSeek | Not yet reviewed individually | — |
| 18 | Cipher | DeepSeek | Not yet reviewed individually | — |
| 19 | Trail | DeepSeek | Not yet reviewed individually | — |
| 20 | Split | DeepSeek | Not yet reviewed individually | — |
| 21 | Quadra | Qwen | Not yet reviewed individually | — |
| 22 | Logic Lattice | Qwen | Not yet reviewed individually | — |
| 23 | Syntax Siege | Qwen | Not yet reviewed individually | — |
| 24 | Memory Maze | Qwen | Not yet reviewed individually | — |
| 25 | Pattern Prism | Qwen | Not yet reviewed individually | — |
| 26 | Territory Tactics | Qwen | Not yet reviewed individually | — |
| 27 | Dovetail | Claude | Not yet reviewed individually | — |
| 28 | Splice | Claude | Not yet reviewed individually | — |
| 29 | Sprout | Claude | Not yet reviewed individually | — |
| 30 | Tangle | Claude | Not yet reviewed individually | — |
| 31 | Keystone | Claude | Not yet reviewed individually | — |
| 32 | Tumbler | Claude | Not yet reviewed individually | — |
| 33 | Tic-Tac-Toe | ChatGPT | Not yet reviewed individually | — |

Ringcount reviewer predictions before improvements: Kimi fun **4/5**, Opus **2.5/5**, Gemini **4/5**. These are not James’s ratings. See [full comparison and decisions](ringcount/ADJUDICATION.md).

Switchpath reviewer fun predictions: Kimi **2/5**, Gemini **2.5/5**, Opus **3/5**. Opus saw the updated source; Kimi/Gemini saw the baseline. James subsequently liked Switchpath and would play again; that direct feedback takes priority. [Review and gameplay-depth audit](switchpath/ADJUDICATION.md).

Counterpart reviewer fun predictions before improvements: Kimi **3/5**, Gemini **2.5/5**, Opus **3/5**. James requested larger text; he subsequently said he would play again. [Review decisions](counterpart/ADJUDICATION.md).

Shortlist reviewer fun predictions before improvements: Kimi **4/5**, Gemini **4/5**, Opus **3/5**. James subsequently said he would play again. [Review decisions](shortlist/ADJUDICATION.md).

Second Sense reviewer fun predictions before improvements: Kimi **4/5**, Gemini **4/5**, Opus **3.5/5**. James would play again; recurring meanings and possible ambiguous cross-pairs remain human-review questions. [Review decisions](second-sense/ADJUDICATION.md).

Sideways reviewer fun predictions before improvements: Kimi **3/5**, Gemini **4/5**, Opus **3/5**. James found it too easy and is not a fan; it is a replacement candidate. All 210 boards have at least one pair of exact answers that fixes the whole arrangement. [Review and depth audit](sideways/ADJUDICATION.md).

Tradeoff reviewer fun predictions before improvements: Kimi **3/5**, Gemini **3.5/5**, Opus **2/5**. James explicitly called it a keeper, a bit too easy. Difficulty tuning remains a follow-up; relative keeper order is unknown. [Review decisions and open concurrency finding](tradeoff/ADJUDICATION.md).

Inbetween reviewer fun predictions before improvements: Kimi **3/5**, Gemini **3.5/5**, Opus **2/5**. James rated it **6/10**, kept it, and asked for drag-and-drop placement visuals and harder clues. [Drag-and-drop delivered](inbetween/DRAG-PLACEMENT.md); clue tuning remains a follow-up. [Review decisions, bank recurrence and final verification](inbetween/ADJUDICATION.md).

Cairn reviewer fun predictions before improvements: Kimi **4/5**, Gemini **4/5**, Opus **3/5**. James criticized the Perfect Summit graphic; the revised version removes it. He subsequently said “keeper, go next”; Cairn is kept, without a numerical score or relative keeper rank. [Review and verified fixes](cairn/REPORT.md).

Morph reviewer fun predictions before improvements: Kimi **4/5**, Gemini **3.5/5**, Opus **3/5**. James subsequently said “keeper, next”; Morph is kept without a numerical score or relative keeper rank. [Review and verification](morph/REPORT.md).

Kimi’s Tangle reviewer fun predictions before improvements: Kimi **3/5**, Gemini **3.5/5**, Opus **3/5**. James called it a keeper and requested a 5×5 sample. His playtest exposed missing valid words; both sizes now use the [broader audited word-game lexicon](tangle-kimi/WORD-GAME-LEXICON.md), preserving his corrected round and original Gold goals. No numerical score or relative keeper rank supplied; the larger mode’s verdict remains pending. [5×5 sample](tangle-kimi/FIVE-PREVIEW.md) · [original review](tangle-kimi/REPORT.md).

Canonical data: [ranking.json](ranking.json). Keep this table in step with that file.
