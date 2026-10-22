# Astra gameplay review: eight originals and four Qwen games

Date: 22 October 2026. Reviewer: GPT-6 Astra. Preview: `http://terminal.local:4173/` (managed QA build). Independent browser tab 5.

## Scope and evidence standard

I played all twelve assigned games through their real rendered controls to an observed successful result. Every attempt used Practice; daily statistics remained separate. The eight originals used their visible Practice 01 boards. The four Qwen games select a practice board directly; the UI showed “Practice” without a board number. Their IDs below were matched to source data **after** the playthroughs from the observed board, not used to obtain solutions.

Eleven solutions were reasoned from the rendered clues without source answers, solvers, reveals, or game hints. “Blind” here means no answer assistance for this AI reviewer; it is not a claim of a representative human usability study. Memory Maze is separately classified as **UI-transcript-assisted** because the study snapshot preserved its numbered path in conversation. Its zero misses and elapsed time verify the interaction, not human memory difficulty. No hidden browser state, injected answers, or network inspection was used. All moves were real UI clicks/text entries.

This is one complete board per game, with supplemental whole-bank structural checks. It does not claim every puzzle has been played by a human. The live browser was a desktop viewport; no physical iPhone, mobile viewport, VoiceOver, or full keyboard-only audit was performed. Accessible labels were inspected and used throughout. Mobile conclusions below are risks to verify, not device certification.

## Results and difficulty decisions

| Game | Played board | Observed completion | Judgment and decision |
|---|---|---|---|
| Ringcount | `ringcount-001`, Practice 01, Circle 001 | Cuts after positions 3, 5, 9, 12; four totals of 15; 4 moves, 0 hints, 1 check | Gentle arithmetic with a useful wraparound insight. Suitable quick opening game. Keep rules and assistance unchanged. “Sharp” is stronger than this sample felt. |
| Switchpath | `switchpath-001`, Practice 01 | Route 1→5→2→13→10→11→6→15→4→8→3→12→9→14→7→16; 15 moves, 0 hints; “Perfect flow” | Moderate planning. Rejected several candidate branches mentally before entering the route. Good compact challenge; no easier/harder adjustment justified. |
| Counterpart | `counterpart-001`, Practice 01 | Five pairs in five checks, no hints | Easy-to-moderate vocabulary and relationship matching. EMBER:FIRE / ECHO:SOUND requires a less literal connection; explanation makes the intent fair. Keep. |
| Shortlist | `shortlist-001`, Practice 01 | C+R=0; G+S=0; A+E=2; MAPLE confirmed; 3 scans, no hints | Most interesting information-selection task among originals. Manually crossed off incompatible candidates; final confirmation prevented an accidental irreversible pick. Moderate; keep three scans. |
| Second Sense | `second-sense-001`, Practice 01 | WIND, TENDER, COURT, FENCE, BARK; 5 checks, no hints | Easy-to-moderate for an experienced English speaker; TENDER is less common. Clue pairing plus definitions adds interest. Keep; human vocabulary testing remains useful. |
| Sideways | `sideways-001`, Practice 01 | CRANE/BREAD/STORE/PLANT; 7 shifts, 1 check, no nudges | Easy-to-moderate. Once one or two clue answers are known, row rotations are fairly mechanical. “Tricky” overstates this first sample. Keep mechanics; calibrate labels with human samples. |
| Tradeoff | `p001`, Practice 01, The first trade | CRATE, SHARE, CATCH, BROWN, ROUND, CHAIN; 5 swaps, no nudge | Appropriately Gentle. Holding one displaced N while completing rows makes the cycle clear. Good onboarding board; no harder adjustment. |
| Inbetween | `inbetween-001`, Practice 01, A little room | CARPET, PLANET, STRAND, NOTICE, FORMAT, PASTRY; 6 attempts, no nudges | Appropriately Gentle. Preview then Place pair gives safe learning. Some solutions append letters, correctly allowed by the rules. Keep. |
| Logic Lattice | `lattice-24`, first selected practice | All 25 squares and 12 counting clues agree; solved without hints | Moderate deductive logic, with a useful short case analysis. More demanding than Prism/Territory. Keep current assistance and no timer. |
| Memory Maze | `maze-14`, first selected practice | 14-square route; 0 misses, 0 hint replays; UI reported 24 seconds | Interaction passed. Six-second study of 8–14 cells cannot be fairly calibrated from transcript-assisted AI play. Retain timing until real human tests; do not make it faster based on this result. |
| Pattern Prism | `prism-10`, first selected practice | Choices D, C, B; 3/3 predictions, 0 misses, 0 hints | Gentle recognition of shape/color alternation plus rotating direction. Clear, approachable short game; keep as an easy option. |
| Territory Tactics | `territory-19`, first selected practice | Place row 2 column 2, then row 4 column 1; captured 4 stones in 2 moves, 0 hints | Very easy once liberties are understood. Whole-bank analysis confirms this is a structural limitation, not just an easy sample. Keep solvable budgets; position commercially as introductory until deeper content is added. |

### Exact play details

Ringcount's groups were 9+6, 7+2+5+1, 8+3+4, and 5+4+6. Live totals updated after every cut, and the check action changed to “Bring it full circle” once balanced. Success disabled the board and offered another puzzle and result.

Counterpart pairs were CATERPILLAR→BUTTERFLY; SHEATH→BLADE; BAROMETER→PRESSURE; ECHO→SOUND; COMPOSER→SYMPHONY. Correct checks automatically advanced to the next analogy and displayed a clear explanation. Second Sense similarly retained definitions for all five discovered words, including the pronunciation difference in WIND.

Sideways actions were row 1 left; row 2 left twice; row 3 left; row 4 right; row 5 left twice. All four words were displayed as text below the board, so the vertical reading mechanic did not depend solely on visual letter alignment.

Tradeoff swaps were CRANE's N with STARE's T; SNARE's N with HATCH's H; NATCH's N with CROWN's C; NROWN's N with BOUND's B; NOUND's N with CHAIR's R. Correct rows locked as intended. Inbetween used PE after CAR, ET after PLAN, TR after S, IC after NOT, AT after FORM, and RY after PAST, with explicit placement confirmation each time.

Logic Lattice's observed row totals were 3,3,2,4,4; column totals 3,3,3,4,3; diagonals 3 and 4. Given white cells were r2c5 and r5c1. Solved rows (1=black, 0=white): `01011 / 10110 / 10100 / 11011 / 01111`. The anti-diagonal and last-row forced fills give a starting point; the interaction correctly required explicit white marks. A tool timeout interrupted entry with only r5c5 still unknown; reconnecting showed all previous marks intact and the final click completed the board. This was a tool timeout, not an app failure.

Memory Maze's studied route was r6c7→r7c7→r7c6→r7c5→r6c5→r5c5→r4c5→r4c4→r4c3→r3c3→r3c2→r3c1→r2c1→r1c1. Study labels identified each numbered square; recall removed those labels except for already retraced squares and start/finish. The game correctly ended after the final square.

Prism alternated large rose squares and large leaf circles, while direction cycled north/east/south/west. The three answers were large leaf circle east, large rose square south, large leaf circle west. Text descriptions exposed every visual attribute, making color-only interpretation unnecessary.

Territory's four-stone enemy group had two empty neighboring liberties. Filling both removed the enemy stones and displayed the capture result. The screenshot clearly distinguished round blue friendly stones from diamond amber enemies, so team identity was not color-only.

## Onboarding, feedback, accessibility, and mobile risks

| Game | What worked in the live UI | Remaining verification or polish |
|---|---|---|
| Ringcount | Rules beside board, numeric arc totals, complete cut labels, success controls | Physical touch accuracy around the ring and narrow-width totals need device testing. |
| Switchpath | Explicit current higher/lower instruction, labeled row/column numbers, documented arrow/Enter/Backspace controls | Full keyboard-only path and undo/restart error paths were not exercised in this attempt. |
| Counterpart | Direction matters cue, first/second word labels, automatic next row, explanations | Long bank words and explanations need narrow-screen review. Practice picker is a long undifferentiated list. |
| Shortlist | Clear 0/1/2 semantics, manual crossing-off, named final-pick controls, confirmation dialog | Three-scan strategic guarantee is not obvious to every beginner; suggested scan exists. Letter bank and small cross-off targets deserve touch testing. |
| Second Sense | Noun/verb categories, descriptive controls, labeled input, retained definitions | Vocabulary range may dominate difficulty for children/non-native speakers. Long clues plus software keyboard need physical-phone review. |
| Sideways | Named left/right row controls, current words written out, one-check feedback | Vertical column alignment and arrow targets require narrow viewport verification. |
| Tradeoff | Complete letter/word/clue labels, solved-row locks, reassuring no-lives copy | Long clue/tile rows and focus after locked rows need mobile/keyboard checks. |
| Inbetween | Explicit pair labels and gap descriptions, safe preview, Place pair action | Many gap controls create a long screen-reader sequence; phone spacing needs validation. |
| Logic Lattice | Row/column/state labels, fixed-given labels, text clue totals and satisfaction, help explains white marking | Click cycle means white needs two actions. Full keyboard flow and contrast checks remain. Practice lacks a visible puzzle identifier. |
| Memory Maze | Numbered study labels, correct-prefix retention, replay support, no-loss retry model | Human memory timing and screen-reader six-second study access need testing. Fixed misleading study status noted below. Practice lacks a visible puzzle identifier. |
| Pattern Prism | Every image and answer describes shape, named color, size, direction; text rule explanation at completion | Five examples plus three predictions need narrow-screen inspection. Easy difficulty should be made clear in positioning. |
| Territory Tactics | Rules explain liberties and no opponent, distinct stone shapes, named row/column controls, free retries | Row/column labels alone do not explain staggered hex adjacency to a nonvisual player. Screen-reader adjacency guidance is a meaningful accessibility improvement. |

The originals' large practice lists are usable but grow cumbersome at 180/187 entries. A fresh-puzzle action mitigates this. Qwen practice is quicker but has the opposite problem: no visible practice number or ID, making support reports and repeatable sharing difficult. Neither blocked this playthrough.

## Content runway and supplemental difficulty metrics

Direct imports of the current puzzle modules confirmed Ringcount 180, Switchpath 187, Counterpart 180, Shortlist 180, Second Sense 180, Sideways 180, Tradeoff 180, Inbetween 180, Logic Lattice 120, Memory Maze 120, Pattern Prism 150, and Territory Tactics 120. Each exceeds thirty daily records. These are finite rotating banks, as disclosed in the UI. Record count is not a promise of wholly new vocabulary or mechanics every day.

Whole-bank structural checks, performed after gameplay:

- Ringcount: 150 boards report two decoy arcs, 28 report three, and two report four. Labels are 178 Sharp and two Deep; there is little labeled entry-level range.
- Switchpath: branch-point metadata ranges from four to seven (89/75/22/1 boards respectively). This supports real planning variety, although branch count alone does not measure human difficulty.
- Tradeoff: 83 Gentle, 68 Clever, 29 Tricky. Inbetween: 45 Gentle, 90 Medium, 45 Tricky.
- Logic Lattice: 66 boards have two givens; 33 have three; 12 have four; four have five; five have six. Fewer givens do not automatically mean harder, but there is structural variation.
- Memory Maze: path lengths 8 through 14 occur 18,18,17,17,17,17,16 times. This is a balanced span; the six-second study duration is constant.
- Prism: 49 boards change two attributes and 101 change three. The sampled three-attribute board remained approachable because all cycles were simple.
- **Territory: all 120 boards have exactly one enemy group, exactly two initial liberties, and minimum winning length two.** The strategic task therefore reduces to identifying and occupying those two liberties; added friendly stones/rotations vary appearance more than core reasoning. Tightening the move budget is not a sensible difficulty fix. A later content expansion should introduce multiple groups or order-sensitive captures and retest every position for fairness. This review did not alter banks.

## Targeted fix

Changed only `games/qwen-memory-maze/app.mjs`: the start announcement now says “Study the numbered route. When it disappears, begin at S.” Previously it said “The route is visible for six seconds.” The shared runtime preserves the last status message during timer-driven renders, so the old statement remained visible during recall after the route had disappeared. This was directly observed. The new wording is accurate during both phases, without changing timing, state persistence, scoring, or shared runtime.

No broad difficulty adjustments were made: the evidence supports preserving gentle games in the collection, and one AI solve is insufficient to calibrate human difficulty. Territory's limited depth is explicitly reported rather than disguised by an unfair move limit.

## Verification

After the copy change, all 34 targeted test files for these twelve games passed (`node --test` over each original's `tests/*.test.mjs` and the four Qwen `engine.test.mjs` files). No failure, cancellation, or skip was reported. These include existing puzzle validation, restoration, and expansion contracts; they are supplemental to the twelve live UI wins.

The browser verified the pre-change start/recall discrepancy. Post-change live-copy verification is recorded in the follow-up below once the parent restages the managed preview. Source inspection confirms the new announcement. No puzzle banks, generators, shared runtime, native copies, catalog, deployment, or git commits were changed by this reviewer.

## Commercial-readiness assessment

The sampled core loops work and are coherent enough for a public beta. No completion blocker was found in these twelve games. A paid-product readiness claim would still need physical-device and assistive-technology testing, vocabulary/content editorial review across the larger banks, real-player difficulty data, and stronger variety if Territory is marketed as a substantial strategy game. Those are product validation limits, not reasons to rewrite working mechanics based on AI speed.

## Follow-up: authorized Territory difficulty adjustment

The initial report above describes the reviewed bank before adjustment. After the structural finding, the parent explicitly authorized replacing only Territory's ninety unpublished additions while preserving the original thirty records, IDs, ordering, and the 120-board total. This supersedes the earlier “no bank changes” statement for Territory alone.

The deterministic `territory()` generator now creates exactly two disconnected enemy groups. One has three or four stones and meets the capture goal; the smaller one has one or two stones and is a legally capturable but insufficient alternative. Players must select the useful capture instead of merely filling the only group's two openings. The two-placement rule remains unchanged. All initial friendly groups have liberties; all friendly stones touch an enemy group, so none are decorative padding. There are at least five empty hexes on every board.

The ninety additions contain 45 target-three and 45 target-four positions. Group-size distributions are 15 boards of 1+3, 30 of 2+3, 15 of 1+4, and 30 of 2+4. All ninety require exactly two legal winning moves. Eighty-eight have both orders available; two have one winning order. This is a modest increase in choosing and evaluating a target, not a claim of deep adversarial strategy.

Full-bank tests now require: unchanged published-first-thirty SHA-256; exactly 120 records; full-board uniqueness under all twelve hex rotations/reflections; ninety distinct enemy configurations even after ignoring friendly stones; exactly two living enemy groups for each addition; a legal smaller capture that does not win; exactly-two-move winning routes; restoration of partial captures; hint recovery from decoy captures; and no decorative friendly stones. The scoped deterministic regeneration `--check` matched the saved Territory module byte for byte. Existing imported-expansion symmetry tests also passed.

The new content exposed a feedback defect: after a two-move smaller capture, the engine could say “No capture yet.” The engine now reports the actual count and goal, for example “1 stone captured; 3 needed. Undo or restart to investigate another route.” The added full-bank decoy test checks this message against simulated captures for every two-move decoy route.

Changed files for this follow-up: only the `territory()` section of `scripts/expand-imported-puzzles.mjs`, `games/qwen-territory-tactics/puzzles.mjs`, `games/qwen-territory-tactics/engine.mjs`, `games/qwen-territory-tactics/engine.test.mjs`, and this report. The prior Memory Maze one-line copy change remains. Parent owns preview restaging and native synchronization.

### Live verification of revised content

After the parent restarted the managed preview service (restaging files alone had initially left the old served build active), the updated help wording and bank were verified through rendered UI. Three new boards were played without inspecting their answers, using the visible grid and capture goal. IDs were matched afterward by enemy positions:

| Board | UI actions | Verified outcome |
|---|---|---|
| `territory-031` | Deliberate negative-path check: r1c2 captured the one-stone decoy; r2c1 used the second move. Then Restart, r3c3, r5c3. | First route correctly remained unsolved at 1/3 captured, 2/2 placements, with “1 stone captured; 3 needed.” Restart restored the board. Correct route captured 3 in 2 moves, 0 hints. |
| `territory-032` | r1c1 then r5c2 | Four-stone target captured, 4/4 goal, 2/2 placements, 0 hints. Two enemy groups shared a liberty, making the choice of second placement meaningful. |
| `territory-033` | r4c3 then r1c2 | Shared final liberty closed both groups: 5 captured against goal 3, 2/2 placements, 0 hints. Completion and disabled controls confirmed. |

These samples support a **modest and fair** difficulty increase. They remain approachable for an experienced player; the improvement adds group selection, goal counting, and shared-liberty reasoning rather than arbitrary penalties. The first thirty warmup boards remain intact. No further rebalance is warranted without human play data.

The Territory help now says to capture at least the displayed goal, correcting its earlier fixed-three wording. This adds `games/qwen-territory-tactics/app.mjs` to the changed-file list. Both modified app modules passed `node --check`.

Memory Maze was reopened in Practice on the refreshed preview. During “Study · 6 seconds,” the status read “Study the numbered route. When it disappears, begin at S.” After the automatic transition to “Retrace the route,” the same phase-safe text remained accurate. This verifies the copy fix live; this second short session was a phase-transition retest, not another complete memory assessment.

Final targeted Territory and imported-expansion tests passed after the capture-message change. All twelve initially assigned games have at least one complete UI win; Territory additionally has three revised-board wins and a verified negative/recovery path. Daily statistics were still 0 played / 0 solved in these practice sessions.
