# Alford Daily: independent review of the 32 daily games, the bonus, and the six-month claim

**Bottom line:** I found no blocker in engine correctness or in the calendar harness. Two issues weaken what "six months of fresh dailies" means:

- **Practice serves upcoming dailies early** in the 18 games that share the DeepSeek runtime.
- **Several games count recombined or re-parameterised content as new.**

There is also one scoring defect (Morph) and one unverified preservation claim (all six Kimi games).

**How this was done.** I only read source and data in this folder. I did not run any code, run the authors' tests or play anything in a browser. The authors' numbers (375/139/67 passing tests, 5,824 selections, 7,852 prior assignments, the Hunch and Tumbler solver trees) are their own runs, not mine. Where I confirm an author claim, I confirmed the logic, not the result.

## 1. Findings, most important first

### A. Defects I reproduced by reasoning through the code

**F1 (High): Practice plays tomorrow's daily, and the days after, in 18 games.** These are the six DeepSeek, six Qwen and six Claude games, which all use the shared runtime.
- **Where:**
  - `games/deepseek-runtime/core.mjs:165`: Practice picks `((previous ?? dailyIndex(...)) + 1) % length`.
  - `games/deepseek-runtime/daily-rotations.mjs`: the new rotations mostly list consecutive bank positions.
- **Example (Tumbler):** Oct 29 served position 390 (`six-month-previous-calendar.json:182-187`). The rotation then runs 391, 392, … (`daily-rotations.mjs:5246-5250`).
  - On Oct 30 the daily is 391. Opening Practice gives 392, which is Oct 31's daily. Each "Next practice" moves one day further ahead.
  - Next day, Practice resumes from the saved practice position (`core.mjs:155-165`), so a regular practiser keeps meeting dailies they have already played.
- **Why it matters:** the harness checks that dailies are distinct (`verify-six-months.mjs:16-17`) but never checks practice. Nothing in `scripts/` mentions practice.
- **Fix:** pick practice boards from positions outside the remaining rotation window, for example boards already served or kept back for practice. Add a test that practice never overlaps the next 181 dailies.

**F2 (Medium): Morph's hint shows the whole route, but the medal, share text and streak ignore it.**
- **Where:**
  - The hint just sets `showPath` (`packages/kimi-pebbles/src/games/morph/useMorph.ts:295-300`).
  - The board then prints every rung of the supplied route (`MorphBoard.tsx:179-201`).
  - `medalFor` and `buildMorphShare` take no hint input (`morph/engine.ts:39-57`, `MorphWinModal.tsx:24-29`).
  - `finish` counts the day as completed and extends the streak (`useMorph.ts:191-201`), and `resultStatus` reports it as a win (`shared/integration.ts:61`).
- **Example:** press "Show a route", type the shown rungs, and you get "🥇 Gold — target met", share text "🥇 N moves · target N", and a streak increase. Hunch, by contrast, marks hinted shares with 💡 (`hunch/engine.ts:50`).
- **Fix:** have the hint reveal only the next rung, or cap hinted results below Gold and add 💡 to the share text.

**F3 (Medium): For all six Kimi games, "historical assignments preserved" is never actually checked, and the selectors are fragile.**
- **Selectors:** every Kimi daily is simply `day % bankLength`:
  - `cairn/engine.ts:26-29`, `morph/engine.ts:13-16`, `tangle/engine.ts:16-19`
  - `hunch/engine.ts:11-14`, `circuit/engine.ts:26-29`, `quartet/engine.ts:26-29`
- **Baseline:** the historical baseline lists only 26 games (26 × 302 days = 7,852). It has no Kimi entries.
- **Harness:** `verify-six-months.mjs:19` passes whenever a game has no baseline (`!previous || …`). That is why `six-month-runway.json` shows `historicalAssignmentsPreserved: true` for every `kimi-*` game without any comparison. No Kimi test pins past dates either.
- **Risk:** appending to any Kimi bank would re-map every past and future date. Saved progress would then be rejected and reset by the restore checks (for example `restoreCairnProgress`).
- **Fix:** add Kimi hashes to the baseline and move Kimi to frozen rotations like the other games.

**F4 (Low): Practice can also hit future dailies in the ChatGPT and Kimi games, but only if the player chooses it.**
- The ChatGPT shell keeps back only today's board (`ringcount/shell.mjs:245-250`).
- Kimi practice picks at random and excludes only today's board (for example `morph/engine.ts:18-24`).

**Minor inconsistencies:**
- **Repeated wrong guesses cost again** in Quartet and Quadra (`useQuartet.ts:305-325`, `qwen-quadra/engine.mjs:33-39`). Spare, Splice and Keystone don't charge repeats (`deepseek-spare/engine.mjs:26`).
- **Future-dated records count in stats** for Tradeoff and Inbetween, which skip the "on or before today" filter the other games apply (`tradeoff/engine.mjs:173-176`, `inbetween/engine.mjs:157-161`).

**Speculative risks:**
- **Pattern Prism:** `hintText` would crash if a puzzle had every attribute constant (`qwen-pattern-prism/engine.mjs:36`).
- **Syntax Siege:** after a wave is cleared or times out, the timer resets to 20 s regardless of that wave's own duration (`qwen-syntax-siege/engine.mjs:51,59`).
- **Sideways:** a save without `lastCheck` resets the board (`sideways/engine.mjs:164`); this matters only for older saves.
- **Claude Tangle:** the 2,000-event replay cap could lock play after about 1,000 pull/undo cycles (`claude-tangle/engine.mjs:33`).

### B. Content-identity concerns (the six-month claim)

**C1: Whole-board keys let the same small puzzles come back inside "new" boards.**
- **Counterpart:** the key is the set of five analogies (`counterpart/content-identity.mjs:2-7`). 210 boards are built from 90 fixed analogies (`counterpart/puzzles.mjs:164-181`), so each analogy and its single answer appears about 10 times in the window.
- **Second Sense:**
  - 75 fixed word-plus-clue entries are recombined (`second-sense/puzzles.mjs:133-149`), and each repeats about 12 times in the window.
  - The added boards only mix entries within blocks of 25 (line 3).
  - The collection note says meanings recur "beside different clues", but each word's noun and verb clues are fixed (lines 137-140, 156).
- **Shared up to the reports' own limits:**
  - Tradeoff and Inbetween boards may share 3 of 6 rows.
  - Syntax Siege boards may share 4 of 6 waves.
  - Spare boards may share 2 of 4 pairs.
  - Keystone reuses its 174 arches up to 4 times each.

**C2: Changes to one parameter count as fresh, which the README excludes.**
- **Twin Hive:** all 200 boards come from about 8 letter racks.
  - Expanded boards reuse a rack (for example `ACENORST`, `deepseek-twin-hive/puzzles.mjs:31-38`) and change only the two gold letters.
  - The key is the accepted-word set (`imported-content-signatures.mjs:43-46`), and those sets overlap heavily for the same rack.
- **Quartet:** individual groups repeat across boards. There are 18 "Planets" groups in `quartet/data/puzzles.json`, and {earth, mars, uranus, venus} appears three times. The key only requires the four-group set to differ (`kimi-content-signatures.mjs:21`).
- **Cairn:** towers share levels. For example, `est/rest/tires` starts two towers, and `charts/scratch` ends two others. The game accepts any valid word from each level's letters (`cairn/useGame.ts:374-375`), so matching levels are the same challenge; the key still counts the towers as distinct (`kimi-content-signatures.mjs:16`).

**C3: "Distinct" means distinct within Oct 29 – Apr 28 only (speculative).** By April the imported rotations wrap back to early positions (Twin Hive reaches positions 0–17). Those boards may have been served before Oct 23 under the old hash selector (`core.mjs:54-55`), depending on launch date. Nothing checks this.

**What does hold up:**
- **The harness:**
  - It uses each game's real selector (`daily-audit-lib.mjs:41-58`).
  - It covers 182 days (`verify-six-months.mjs:8`).
  - Repeated Switchpath and Prism records are skipped when building the rotations (`build-six-month-calendar.mjs:14-19`).
- **Content keys that are suitably strict:**
  - Ringcount and Switchpath keys ignore rotations and mirrors.
  - Lattice, Maze, Territory and Prism keys ignore symmetry and relabelling.
  - Shortlist doesn't count a reused word bank as new.

## 2. Coverage table

Key: **E** = engine/rules read in full, **H** = hook/app/save logic read, **I** = content-identity key read, **D** = puzzle data sampled. "Shell" means the ChatGPT `shell.mjs` I read via Ringcount; the same file ships with Switchpath, Shortlist and Sideways. "Core" means the shared `core.mjs`/`common.mjs` runtime.

| Game | Read | Not verified |
|---|---|---|
| ringcount | E, H (app+shell), I, D | test files, generator |
| switchpath | E, I; shell | app.mjs, data |
| counterpart | E, I, D (how boards are built) | its own shell (different file), app, natural-language ambiguity |
| shortlist | E, I; shell | app, data |
| second-sense | E, I, D (how boards are built) | its own shell/app |
| sideways | E, I; shell | app, data |
| tradeoff | E, I | app.mjs (32 KB), data |
| inbetween | E, I | app.mjs (29 KB), data |
| kimi-cairn | E, H, progress, storage, I, D | UI components |
| kimi-morph | E, H, progress, Board/WinModal, I | data |
| kimi-tangle | E, H, progress, I; Board (adjacency only) | data |
| kimi-hunch | E, H, progress, I | solver result (author-run) |
| kimi-circuit | E, H, progress, I | data |
| kimi-quartet | E, H, progress, I, D (labels) | full group-reuse count |
| deepseek-twin-hive | E, I, D (racks); core | app |
| deepseek-spare | E, I; core | data, semantic ambiguity |
| deepseek-rung | E (incl. word list), I; core | data |
| deepseek-cipher | E, I; core | phrase data |
| deepseek-trail | E, I; core | data |
| deepseek-split | E, I; core | data, how often answers repeat |
| qwen-quadra | E, I; core | data |
| qwen-logic-lattice | E (incl. solver), I; core | data |
| qwen-syntax-siege | E, I; core | 736 KB data |
| qwen-memory-maze | E, I; core | data |
| qwen-pattern-prism | E, I; core | data |
| qwen-territory-tactics | E, I; core | data |
| claude-dovetail | E, I; core | data |
| claude-splice | E, I; core | data |
| claude-sprout | E, I; core | data |
| claude-tangle | E, I; core | data |
| claude-keystone | E, I; core | data |
| claude-tumbler | E, I; core | solver result (author-run) |
| nested-tic-tac-toe (bonus) | engine, AI, match controller (app 1-126) | rendering, tests; it has no hint or undo |

Also read: `catalog.mjs`, `daily-rotations.mjs` (structure plus the Tumbler entries), the calendar, verify and audit scripts, the runway summary rows, the Kimi `six-month-logic.test.ts`, and all three family reports. I did not read most other test files or the native staging. The stale-catalog failures in the Claude report appear fixed in the catalog (`catalog.mjs:49` shows Dovetail at 200 boards).

## 3. How much of the six months is actually new

Three kinds of "distinct" are mixed together in the claim:

- **Separately written or generated new puzzles:**
  - Cipher's 80 new phrases and Trail's 80 new answers.
  - Tumbler's 1,054 answers and Hunch's 937 answers.
  - Logic puzzles that are distinct after symmetry: Ringcount, Switchpath, Lattice, Maze, Territory, Prism.
- **Recombinations of a fixed pool:**
  - Counterpart, Second Sense, Tradeoff, Inbetween, Spare, Split, Quadra, Siege.
  - Keystone, Dovetail and Splice.
  - These boards are distinct as sets, but the small puzzles inside them come back every one to three weeks.
- **One parameter changed:** Twin Hive (gold letters), Quartet (groups reused across boards), and Cairn in part (shared tower levels).

The 5,824 distinct selections claim holds for whole boards under the authors' keys. It does not show six months of fresh content for the second and third groups, and under F1 it doesn't hold for anyone who uses Practice in 18 of the games.

## 4. Assessment

- **Engines:** no blocker shown. Win/lose handling, illegal-move rejection and save validation look careful throughout.
- **Calendar:** the harness is sound for what it checks.
- **What I'd fix before claiming six fresh months:** F1 practice overlap, F2 Morph scoring, F3 the missing Kimi baseline, and a stricter identity rule for C1/C2.

This is not a certification: it rests on reading source, not on running the tests or playing the games.
