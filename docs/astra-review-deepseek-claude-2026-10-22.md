# GPT-6 Astra gameplay review: DeepSeek and Claude games

Review date: 2026-10-22. Reviewer: GPT-6 Astra gameplay subagent. Repo: `family-game-portal`. Live preview: `http://terminal.local:4173/`. Browser: isolated cloud Chrome tab 7. Scope: six DeepSeek and six Claude games.

## Outcome and limits

**All twelve games were actually played through their normal visible controls to a verified win in Practice.** Eleven wins were blind and unhinted. Dovetail used one in-game letter hint after one plausible but incorrect guess. No source-derived answer or solver output was used to obtain any of these wins. Puzzle IDs were matched from local modules only after all twelve wins. Source inspection during Twin Hive happened after that game's win and concerned its rejected word, not later puzzle answers.

This is a complete functional gameplay pass on one selected practice puzzle per game, plus source/test review. It is not a human difficulty study, exhaustive editorial review, screen-reader certification, mobile-device run, or App Store readiness certification. The games vary usefully in difficulty; no blanket difficulty increase is warranted from these samples. Dovetail supplies the hardest sampled reasoning; Spare, Trail, and Split supply approachable warmups. Tumbler's two-turn result benefited from luck and must not be interpreted as evidence that its whole bank is too easy.

One concrete fairness defect was found and fixed: Twin Hive rejected **EARS** despite all four letters being present and both gold letters A/E being included. The narrowly reviewed supplemental acceptance now covers EARS while retaining all original puzzle records and IDs. Other dictionary omissions remain possible.

## Actual gameplay evidence

Practice is visibly labeled, but the interface does not display the internal puzzle ID or a practice sequence number. IDs below were matched afterward using each game's module and the shared date-selection function, and confirmed against the letters/clues actually played. All twelve results continued to show `0 daily played · 0 solved · 0 day streak`, consistent with separate practice statistics.

| Game and record | Inputs/actions actually performed | Verified result | Assistance and judgment |
|---|---|---|---|
| Twin Hive, `twin-4-2` | Rack AEGILNRS, required A+E. Submitted EARS (rejected), then GEARS, RANGE, LARGE, ANGLE, ANGER, SNARE. | `6 of 6 words · 12 points`, “That's the one.” | Blind, no hints. Easy to medium vocabulary warmup. Several anagrams can provide quick success; omission of an obvious valid word undermined fairness and was fixed. |
| Rung, `rung-14` | SAFE → SALE → PALE → PILE → MILE → MILD → WILD. Also submitted an accidental five-letter WSALE and premature WILE/WILD attempts; rejected inputs did not inflate the ladder. | `6 steps · shortest route 5`, target reached. | Blind, no hints. Medium. A reachable target without a failure clock encourages exploration; optimization supplies replay challenge. WILE was not accepted by the supplied finite lexicon. |
| Spare, `spare-19` | Matched COMPULSORY/OPTIONAL, INHALE/EXHALE, FOLLOWER/LEADER, SECURE/VULNERABLE. | `4 of 4 pairs found · 0 misses. The spare was MARBLE.` | Blind. Easy for a fluent adult; COMPULSORY/VULNERABLE add vocabulary load for children. Keep as a warmup. |
| Cipher, `cipher-11` | Used phrase clue and visible word grouping to infer A SHARED LAUGH LIGHTENS THE LOAD. Selected coded letters and assigned J→S, F→R, Z→E, B→D, A→L, T→U, X→G, Y→I, K→T, R→N, S→O; A/H were given. | `13/13 letters · 0 hints`, whole phrase displayed. | Blind. Medium, helped substantially by the semantic clue. Repeated-code propagation is satisfying. No penalty for experimenting reduces frustration. |
| Trail, `trail-24` | Solved marine sedimentary-rock clue as LIMESTONE. Clicked cells in row/column order (3,2),(2,3),(1,3),(1,2),(1,1),(2,1),(3,1),(2,2),(3,3), then Check trail. | `9/9 letters · 0 hints`, every step led to the answer. | Blind. Easy once clue is known; adjacency and duplicate E locations add a small path check. Diagonal adjacency worked. |
| Split, `split-04` | Deduced NIGHT and LIGHT, then placed all ten individual tiles and pressed Check words. Row advanced automatically after the fifth tile. | `2/2 words · 0 hints`, all letters placed correctly. | Blind. Very easy sample: both clues almost directly define the answers and the words share four letters. Appropriate beginner level; should not represent a challenging daily slot every day. |
| Dovetail, `dovetail-28` | ARROW and PING given. Entered HEAD, tried TOP above PING, received TOPPING fits below but does not complete chain. Requested one row-3 letter hint (S). Entered SHOT, GUN, FIRE, WORKS, HOP. | ARROW–HEAD–SHOT–GUN–FIRE–WORKS–HOP–PING. `6 of 6 missing words placed · 2 of 6 misses used (1 from letter hints)`. | In-game hint assisted; no source answer. Medium-hard. The hint unlocked a satisfying cascade. The spelling split WORKS+HOP and HOP+PING makes the explicit help essential. |
| Splice, `splice-6` | Selected paired tile halves and pressed Splice for SHOW/CASE, SUIT/ABLE, INTER/ACTION, PLAY/BOOK, LAW/LESS, SOME/TIME. | `6 of 6 words spliced · 0 of 4 mistakes`. | Blind. Easy-medium. Need to preserve partners differentiates it from simple word finding; this sample's intended pairings were clear. |
| Sprout, `sprout-13` | Seed TEA, soil G/R/S/T/Y. Typed RATE → STARE → TREATS → TARGETS → STRATEGY, pressing Grow each time. | `Eight letters, in bloom · 0 of 5 wilts used`. | Blind. Medium. Planning the final anagram before committing creates useful depth; valid alternative intermediate anagrams were accepted. |
| Claude Tangle, `tangle-067` | Visible string BHIVOGHRLOCAKLYE. Pulled BROKE with bead numbers 1,8,10,13,16; HIGHLY with 2,3,6,7,9,15; VOCAL with 4,5,11,12,14. | `3/3 threads · 0/4 knots · 0 hints`. | Blind. Medium. Duplicate L choice matters: used bead9 for HIGHLY so bead14 remains after A for VOCAL. Numbered beads make that decision legible. |
| Keystone, `keystone-014` | Arch1 TIME/WILD → LIFE. Arch2 AGE/HAND → OUT; game confirmed OUTAGE and HANDOUT but opened STOP as third clue. Then SHORT. Arch3 WAR/RID → DEN. | All three arches stand; LIFE/SHORT/DEN; `score 7 (6 is perfect) · 0 hints`. | Blind; one guess-driven extra clue, not a hint action. Medium. Particularly good feedback acknowledges a valid alternative instead of calling it nonsense. Lower-is-better scoring is stated but may merit an explicit phrase. |
| Tumbler, `tumbler-0385` | Submitted POINT. Feedback: P exact; second/third later; fourth/fifth earlier. Chose PUNCH from those ranges and submitted. | `2/6 guesses · 5/5 dials locked · 0 hints`, lock open. | Blind and fortunate. Positional alphabet ranges are clear. Cannot infer easy overall difficulty from this lucky two-guess result. |

## Onboarding, feedback, and accessibility observations

Every game has a visible title, brief premise, Today/Practice choice, help button, statistics button, hint control, reveal control, device-local persistence notice, and explicit prepared-puzzle count. The same completion panel makes completion unambiguous. Practice is available without sign-in or purchase. No game presented a blocking functional failure during the completed attempt.

| Game | Onboarding and feedback | Accessibility / mobile-specific review observations |
|---|---|---|
| Twin Hive | Gold-letter requirement, minimum length, repeat-letter permission, goal, and points are visible. Help discloses authored rather than complete dictionary. | Input has a name; letter buttons identify required letters; progressbar exposes numeric progress. Touch tiles have generous source CSS dimensions. A finite lexicon still needs editorial sampling. |
| Rung | Current word and target remain visible, with shortest-route length. Invalid transformation feedback is explicit. | Labeled textbox; current rung and step counts exposed as text. Chain scrolls in a bounded area; nested scrolling needs device evaluation. |
| Spare | Four-opposite-pairs rule and spare concept require little explanation. Matched pairs stay readable; remaining chances explicit. | Tile words available as accessible button names; selected state exposed. Source CSS uses responsive tile grids. No screen-reader interaction trial performed. |
| Cipher | Selected code and keyboard are clear. Semantic clue plus two given letters support an approachable entry. | Each code button exposes code, guess, and confirmed state. **Word boundaries are visually clear but not named in the flattened accessible phrase**, so a screen-reader user may have to infer where words split. Source CSS reduces code cells to 25px wide below 400px; real touch accuracy and target spacing need checking. |
| Trail | Clue and nine-step target are explicit; step numbers appear after selection. | Every cell names letter, row, column, and selected step. That is strong nonvisual information. Real small-screen path entry still needs touch testing. |
| Split | Two clues, required lengths, current row, rack count, and explicit submit make the task clear. | Slot controls identify word, slot, letter, and return action. Duplicate letters have tile numbers. Source CSS stacks word rows below 580px. |
| Dovetail | Read How to play during this attempt. It explicitly explains compound words, spelling splits, prepared chain, alternative acceptance, and hint cost. | Rows expose length and completion; valid-neighbor arrows have text in accessible feedback. Onboarding must retain the spelling-split explanation or PING feels arbitrary. |
| Splice | Two-selection preview, Flip, and explicit Splice separate selection from submission. “Leave a partner” rule is visible. | Each repeated fragment is identified by tile number. Three-column tiles use minmax and wrap long fragments; mobile fit not directly verified. |
| Sprout | Seed, current word, soil pool, next length, and five-step tower communicate growth well. | Textbox labels adapt to length; tile buttons identify source and number. Undo/restart explicitly retain wilts. Large tower can require scrolling on a phone. |
| Tangle | Numbered bead order, target lengths, knots, and pull control communicate the mechanism. | Numbers distinguish identical letters; full label names each bead. Color alone is not needed to identify source bead. Source includes narrow-screen styling; not a device test. |
| Keystone | Success reveals all five fused words, making the relationship educational. Partial guess feedback is excellent. | Named textbox and keyboard; clue words and scoring available as text. Need to preserve readable text sizing on the five-stone arch at phone width. |
| Tumbler | Arrows say earlier/later; each position shows remaining range and count. Correct letters stay explicit. | Feedback names each position and relation; symbols and text supplement color. Screenshot confirms an unclipped desktop completed layout. Virtual keyboard needs actual phone testing. |

The cloud browser was used at its supplied desktop viewport. No viewport-resizing API was advertised in this session, and no hidden state or alternative automation driver was used. Responsive CSS review is **not** represented as mobile verification. Also untested: keyboard-only traversal across every control, VoiceOver/TalkBack, large text, contrast measurements, switch input, device rotation, and reduced-motion behavior beyond the source's declarations.

## Stock and difficulty calibration

Every assigned game exceeds 30 prepared daily records. These are deterministic rotating banks rather than an unlimited content service.

| Game | Prepared records | Diversity and difficulty qualification |
|---|---:|---|
| Twin Hive | 140 | Five distinct eight-letter racks; gold-pair variation changes legal words. Original authored answer pools range 22–123 words per board. Six-word completion can be reached by related inflections/anagrams. 140 records do not mean 140 unrelated letter sets. |
| Rung | 120 | Measured shortest-route distribution: 3 steps ×20, 4 ×25, 5 ×25, 6 ×31, 7 ×14, 8 ×2, 9 ×2, 10 ×1. This is a useful spread, but a 9–10-step day can feel substantially harder than this five-step sample. |
| Spare | 120 | Four pairs and one spare per record. Editorial relationship clarity and vocabulary, rather than number of moves, control difficulty. |
| Cipher | 120 | Complete phrase puzzles with clue and confirmed letters. Clue directness and repetition patterns influence difficulty more than phrase length alone. |
| Trail | 120 | Nine-letter clue/path puzzles. A known answer can make the path straightforward. Avoid treating all nine-letter words as equal difficulty. |
| Split | 120 | Two clued five-letter words. Strongly overlapping pairs like NIGHT/LIGHT are particularly easy. Retain them as approachable content, with human trials to establish desired daily mix. |
| Dovetail | 120 | First 77 original chains retained; additions recombine approved words/joins. Recorded expansion constraints cap shared consecutive words and joins. No claim of completely new vocabulary each day. |
| Splice | 120 | First 73 original bins retained; additions recombine approved fragment pairs. Content metadata says new bins have one oriented complete matching. Ambiguous partial choices provide the challenge. |
| Sprout | 128 | Full original seeds/routes preserved, with branching alive/dead alternatives. Valid-route verification does not establish word familiarity for family audiences. |
| Claude Tangle | 160 | Distinct prepared interleavings/word triples. Numbered duplicate-letter placement is a real reasoning challenge. |
| Keystone | 120 | Three arches per day drawn from 174 unique approved arches. Arch reuse occurs in different day combinations; 360 daily arch slots are not 360 unique arches. |
| Tumbler | 1,054 | 1,054 unique accepted answer words; 3,700 allowed guesses per existing tests. Six turns remain a reasonable hypothesis, to validate with people. |

Recommended calibration work is a small human study across beginner, fluent casual, and experienced word-game players, measuring completion, hint use, abandonment, misunderstood rules, and perceived unfair rejections. Record puzzle IDs with those observations. Do not change numerical limits just because a language model solved one sample quickly. The main commercial quality priority is editorial fairness and clarity; adding more generated record combinations alone does not resolve that.

## Corrective change and verification

Changed only:

- `games/deepseek-twin-hive/engine.mjs`: `acceptedWords` combines authored answers with the single directly reviewed common word EARS, only when rack and both gold letters permit it. Submission, hints, and saved-state restoration share this acceptance list.
- `games/deepseek-twin-hive/app.mjs`: revealed accepted-word list uses the same helper.
- `games/deepseek-twin-hive/engine.test.mjs`: regression checks EARS submission, serialization/restoration, hinted EARS, duplicate exclusion, and rejection with illegal rack/gold requirements.
- This report and `docs/ui-review/astra-deepseek-claude-2026-10-22.jpg`.

No puzzle bank, generator, shared runtime, catalog, native wrapper, deployment file, or original record was edited by this reviewer. No commit or push performed.

Focused direct test execution (`node games/deepseek-twin-hive/engine.test.mjs`) reported **9 tests, 9 pass, 0 fail**, including the original-30-record SHA-256 compatibility check. Running all twelve assigned `engine.test.mjs` files through Node's test runner reported **12 file suites passed, 0 failed**. The latter runner output summarized files rather than individual assertions; it must not be reported as twelve total assertions. A first test execution correctly failed before `acceptedWords` was implemented.

**Live verification of the supplemental EARS behavior passed after root restaged and restarted the managed preview service.** Opened next practice `twin-5-2` (AEIMNRST, gold E/R), submitted EARS, observed `1 / 6 words` and `EARS · +1 point`, reloaded the page, reopened Practice, and observed `Practice resumed` with EARS and its point retained. The first attempt after static promotion still served the old rejection; normal reload did not fix that. Root restarted the managed preview service, after which the same UI input succeeded. This verifies why post-promotion live behavior matters in addition to files on disk. The original all-twelve-game success screenshot remains unchanged. Minor cosmetic followup: the progress pill says `1 points` at a score of one, although the submission status correctly says `+1 point`. Root owns native sync and staging, so this is preview verification, not a public deployment claim.

## Evidence artifact

`docs/ui-review/astra-deepseek-claude-2026-10-22.jpg` is an actual full-page browser screenshot of the completed Tumbler game. It shows game identity, Practice mode, POINT/PUNCH guesses, all five locked dials, the completion panel, zero hints, and unchanged daily statistics. Full page was used to keep identity and terminal result in the same evidence image. Bytes were saved through the advertised browser/main-container shared-files mapping and verified present (86,340 bytes).

## Commercial readiness conclusion

These twelve games are functionally playable and complete a coherent collection. Their sampled interfaces explain their goals well and give explicit success states. Stock exceeds 30 days by record count, with the reuse qualifications above. The review found one fixable lexicon fairness issue and several worthwhile validation targets, not a reason to remove any game or harden the entire set.

Commercial release should still depend on wider editorial review, actual human difficulty trials, real-device mobile/accessibility testing, and the root review's deployment, ownership, privacy, store, and operational work. This gameplay pass does not establish those external requirements. In particular, preserve original source provenance and inspect family-audience vocabulary separately; some original finite dictionaries include specialist or mature terms, and blanket source preservation is not a substitute for an editorial policy.

## Additional read-only deployment review

At root's request, reviewed `scripts/stage-site.mjs`, its regression test, `scripts/verify-nas.py`, and the beta Caddy/Compose configuration. Identified the original filesystem-root containment bug, occupied-output leftovers, descendant symlink overwrite risk, insufficient source-directory protection, and reliance on an already-clean native bundle. Root corrected these: path-relative containment, fresh/empty destination only, in-repo output restricted to dist, exclusive-create writes, strict native sync validation, and explicit daily source checks. Reviewed the revised code and found no remaining concrete blocker in that scoped staging change. The default loopback port and read-only serving configuration are appropriate. A real hosted custom-prefix smoke test remains separate from this code review. No deployment files were edited by this reviewer.
