# Astra gameplay review: six Kimi games, Quadra and Syntax Siege

Date: 2026-10-22. Reviewer: GPT-6 Astra. Environment: managed Chromium preview at `http://terminal.local:4173/`, a dedicated reviewer tab. These are actual UI play sessions, not inferred wins from source or automated engine tests.

## Method and limits

I entered letters, submitted words, observed feedback and reached the visible result state in seven initial practice sessions. Tangle received a substantive initial attempt and exposed a difficulty defect; a fresh post-fix practice then reached gold, completing all eight games. Most games label the mode only “Practice round”; the numeric identities below were matched to source **after** play, unless explicitly described as source-assisted. Seven completed games were blind wins; Circuit's completed route was assisted as disclosed below.

The browser had existing first-visit help state from earlier review. I explicitly opened Cairn, Circuit and Syntax Siege help. I used screenshots to interpret Hunch colors and Circuit arc membership. I did not inject state, read hidden browser application state or programmatically award a win. Practice left visible daily statistics untouched. I did not conduct physical-device, VoiceOver/TalkBack, touch-drag, iOS lifecycle or 20-second daily-timer trials. Desktop screenshots cannot establish mobile readiness.

## Actual play log

| Game / source identity | Actions and observed outcome | Assistance | Difficulty judgment |
|---|---|---|---|
| Cairn, practice #420 | RED → REED → ELDER → LEADER → LEARNED. All five accepted; “Perfect summit!”; five green results. | Blind; zero hints or misses. | Accessible opening, satisfying growth into seven letters. Keep existing difficulty. |
| Morph, practice #109 | MASS → MARS → MARE → MAKE → WAKE. “Ladder climbed!”, four moves against target four, zero misses. Suggested route was MASS → BASS → BASE → BAKE → WAKE, proving a different valid optimal route worked. | Blind. | Medium: useful planning without a forced single answer. Keep existing difficulty. |
| Kimi Tangle, practice #395 | Grid `aostabvtukrsuebs`. BAKE, BAKER, BAKERS, OAK, KERB accepted for 8 points. Gold required 45 of 75 available points. Initial session stopped short of a win. | First four words blind; built-in hint said “KE”, followed by KERB. Source word list then inspected for difficulty analysis. | Excessive vocabulary burden: gold depended heavily on obscure dictionary entries and abbreviations. Corrected as described below. |
| Kimi Tangle, revised practice #121 | Grid `eaeisfsihwdlwnri`. SAFE, SAFES, SEA, SEAS, EASE, LID, LIDS, SLID, ASH, DIE, DIES, LIE, LIES, FAE. Visible “Gold rush!” at 15 points / 14 words; best find SAFES. | Blind, zero hints/misses; SAFE entered by keyboard activation. Source identity looked up only after the win. | Reachable family word hunt; this board previously needed 46 points. The post-win modal revealed the additional seven-letter word DISEASE, leaving further challenge after gold. |
| Hunch, practice #100 | STARE → LEMON → HONEY. “Sharp hunch!”, solved in 3/6. Interpreted yellow E, then yellow E/O/N; no source answer consulted. | Blind, no hints. | Familiar six-guess deduction. Keep difficulty. Color-only accessibility feedback was defective and corrected. |
| Circuit, practice #257 | Arcs PMT / HIL / ASU / CON. Legal PLUM was rejected as “Not in the word list”. Cleared input; route hint gave ALPHA. Played ALPHA → AMOUNT → TACTICS to cover all 12 letters in 3 words at par; visible “Circuit complete!” gold result. | Built-in first-word hint, then source-assisted remaining route. This is not a blind win. | Appropriately challenging structure, unfair word-list omission. PLUM acceptance corrected narrowly; larger dictionary editorial review still advisable. |
| Quartet, practice #388 | Grouped SHIFT/CONTROL/TAB/ENTER; PILOT/NURSE/CHEF/LAWYER; SOPRANO/LIBRETTO/ARIA/TENOR; CLAY/PLASTER/MARBLE/GRANITE. “Flawless quartet!”, all four mistakes still available. | Blind, no hints. | Easy sample, suitable family entry. One easy sample is insufficient reason to make all 420 boards harder. |
| Quadra, `quadra-15` | Category Shapes. Entered OVAL, CUBE, CONE, STAR via text input; each consumed the appropriate physical tiles. Final “That’s the one.”, 4/4 words, 0 misses, all sixteen tiles locked. | Blind, no hints. | Easy-medium category anagrams; clear constraint and useful type-or-tap choice. Keep difficulty. |
| Syntax Siege, `siege-02` | Practice Start defense, then CASTLE, BRIGHT, MARKET, FOREST, GROUND, PLAYER as six-letter attacks through all six waves. “Core secure”, 6/6 waves, 100 HP, 216 points, 0 hints / 0 misses / 0 impacts. | Blind. Practice is always untimed by design. No claim of a timed daily win. | Untimed sample is approachable; 20-second daily balance still needs human timed trials. Keep current default plus untimed assist. |

## Changes justified by play

### Tangle: reachable medals rather than exhaustive obscure vocabulary

The original #395 bank includes entries such as `abv`, `bvt`, `krs`, `obv`, `vss`, `tss`, `tst`, `trs` and `abstr`. These remain accepted bonus discoveries, but requiring 45 points on this board is unsuitable as the ordinary daily completion gate.

All 430 boards now derive targets at load time from the existing maximum score:

```
gold = min(18, max(8, round(maximumScore * 0.2)))
bronze = ceil(gold / 3)
silver = ceil(gold * 2 / 3)
```

Original gold minimum / median / maximum: **22 / 52 / 71** points. Revised: **8 / 17 / 18**. The reviewed board changes from bronze/silver/gold 15/30/45 to **5/10/15**. Word lists, scoring per word, grids, puzzle order, IDs and the ability to continue after gold are unchanged.

An offline word-frequency analysis provided corroborating evidence, not a shipped dictionary: at Zipf frequency ≥3, only 3/430 original gold thresholds were reachable, versus 430/430 revised thresholds; at ≥3.5, the revised formula was reachable on 346/430. Frequency is a rough proxy: it includes some proper names/abbreviations and can omit familiar inflections. These figures do **not** prove editorially common-word solvability on every board. No frequency corpus or derived lexicon was added to the game.

Saved words are revalidated and their score recomputed. A saved round newly qualifying for gold receives completion credit once, with same-day guards against repeat counting and continuation of a previous-day streak. Existing counters for misses and hints are retained. Existing old-threshold wins still qualify because every revised gold target is lower. Tests cover the migration and repeated reconciliation.

Tangle cells also gain row/column and selection-position accessible names. Source inspection following the UI review showed pointer-only letter activation; Enter or Space now selects a focused cell using the same path logic, including adjacency, backtracking and submit-on-last-letter behavior. The ordinary global Escape/Backspace controls remain available.

### Circuit: fix a demonstrated false rejection

Added the independently reviewed word **PLUM** to the effective word list only when its letters exist and each consecutive letter crosses arcs. This affects 17 of 286 boards. It does not edit the banks, alter their solutions, relax arc/chain rules, accept repeated submissions or bypass saved-progress validation. Effective word counts are updated. Exhaustive two-word pair inspection of the 17 affected boards found no new two-word complete chain; their existing par-three routes remain valid.

Circuit letter accessible names now state the arc number as well as the lit state, making the central arc rule available without color perception. The broader dictionary still includes proper names and omits some ordinary words. Fixing PLUM does not establish that all possible common words are now accepted.

### Hunch: announce letter feedback

Guess cells now expose their position, letter and evaluation: correct position, present in a different position, or absent/no additional copy. Keyboard names expose their best-known result as well. Group labels preserve guess numbers. This resolves the observed need to inspect screenshots to obtain letter feedback. It is a semantic improvement verified in rendered markup; a screen-reader user trial is still outstanding.

## Onboarding, feedback and interaction observations

| Game | Onboarding / feedback | Accessibility / mobile observations |
|---|---|---|
| Cairn | Help clearly explains 3→7 letters and accepts any valid anagram; level progress and final per-word results are clear. New-letter highlight useful. | Large letter buttons and named controls observed. Short temporary disabled state while advancing is an animation, not a dead end. Mobile hardware not tested. |
| Morph | Visible move target, editable rung, undo/restart and suggested route support learning. Selecting a letter then choosing replacement is easy to understand. | Repeated identical-letter buttons have identical names; position-specific labels would further help screen readers. Actual tile interaction passed. Mobile hardware not tested. |
| Tangle | Scoring, bronze/silver/gold markers, accepted-word toast and found list are legible. Prefix hint is weaker than a full-word reveal. | Four-by-four layout is clear visually; new positional names and keyboard cell selection address concrete semantic gaps. Touch dragging and screen-reader behavior still need device trials. |
| Hunch | Familiar six-guess grid; final 3/6 result concise. | Formerly color-only clue information corrected. Physical keyboard advertised; review used on-screen keys. Small-screen keyboard/tap accuracy remains to be validated on devices. |
| Circuit | Help explains arc hopping, chaining and par. Automatic seeding of the previous final letter works. Hint route is visible. | Arc colors were visually subtle; accessible arc labels added. Large circular letter targets worked in desktop review. Mobile reachability and color-vision testing still outstanding. |
| Quartet | Selection counter, groups solved and mistakes remaining clear; found categories affirm reasoning. | Semantic pressed/selected state visible. Long-word overflow not sampled across full bank on mobile. |
| Quadra | Category and four-word goal visible from first screen. Typing highlights exactly matched tiles; solved words lock their tiles. | Tile names include identity and selection position, and text field is labeled. Dynamic rerender moves focus to page after submit; no blocking effect in review, but keyboard-only return-to-input could be improved. |
| Syntax Siege | Start gate prevents surprise countdown; help explicitly explains prepared-word-list restriction, damage, misses and untimed option. | Wave enemy health, core meter and letter identities are announced. Practice timer-free setting is useful. No physical-keyboard entry/timed/mobile trial performed. |

## Stock and verification

All eight banks exceed the requested 30-day inventory, even at one unique entry each day:

| Cairn | Morph | Tangle | Hunch | Circuit | Quartet | Quadra | Syntax Siege |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 839 | 450 | 430 | 937 | 286 | 420 | 120 | 120 |

These are puzzle-bank entries, not a promise that every entry contains wholly new vocabulary. Morph par distribution is 104 four-step, 133 five-step, 137 six-step, 76 seven-step ladders. Circuit has 56 par-two and 230 par-three boards, preserving a meaningful challenge range.

- Package test suite: **28/28 pass**, including four added gameplay regression tests covering all 430 Tangle target/data invariants, save migration, all Circuit supplemental-word legality, and rendered Hunch feedback labels.
- Quadra and Syntax Siege engine tests: **14/14 pass**, including full-bank solution/save checks, tile-use restrictions and Siege damage/timer/hint invariants.
- Independent offline traversal: **30,688 Tangle listed words across 430 boards** all have a legal non-repeating, eight-neighbor path.
- Production TypeScript/Vite build passes and stages all six canonical Kimi HTML entries and shared assets.
- Build retains an advisory for the 685 KB raw shared dictionary chunk. It is not a build failure, but low-end/mobile loading remains a performance review item.
- No puzzle banks, generators, portal catalog, deployment or iOS source were modified by this reviewer. The parent coordinates native synchronization and staging.

## Commercial-readiness judgment

The reviewed paths demonstrate usable games and actual completion flows. The changes address an unjustified completion burden, a real valid-word rejection and nonvisual feedback gaps. They do not justify an unconditional commercial-ready claim. Remaining release checks include broader editorial dictionary/category review, physical mobile and screen-reader play, a human timed Syntax Siege trial, supported-device performance, and deployment/native verification handled by the main reviewer.

## Post-build UI verification

Verified after the parent restarted the managed preview on final entry `index-HWQChMyM.js`. A plain restage initially left the service serving its prior snapshot; this was resolved by the preview restart, with no further source changes.

- **Tangle actual completion:** fresh practice #121, grid `eaeisfsihwdlwnri`, 5/10/15 targets. Reached bronze at 5, silver at 10 and gold at 15 using the fourteen listed words. The visible “Gold rush!” modal reported 15/76 points, 14/65 words and SAFES as best find. No hints or misses. All eight assigned games now have a completed UI win; the Circuit win remains explicitly assisted.
- **Tangle keyboard:** focused letter controls were activated with Enter to construct SAFE, then the Submit word control was activated with Enter. It earned the expected one point. The accessibility tree exposed row/column names and selection order while building the word. Remaining words used ordinary clicks.
- **Hunch feedback:** a fresh practice STARE submission exposed per-position S/R/E absent and T/A present descriptions in the actual accessibility tree, and corresponding best-known keyboard names. This verifies the shipped UI, not only server-rendered markup. That follow-up round was an accessibility regression check, not claimed as another completed game.
- **Circuit PLUM:** naturally sampled seven additional practice draws after the first ineligible board until the displayed arcs were WMP / SLE / IOU / BRC (source-matched practice #97). Typed PLUM through the visible letter buttons. It was accepted: Words 1, Letters lit 4/12, PLUM in the played-word list and M automatically seeded for the next word. Arc numbers and lit state were present in the accessibility tree. No hidden-state injection or fixture replacement was used. This follow-up was a regression check rather than a second full Circuit completion.
