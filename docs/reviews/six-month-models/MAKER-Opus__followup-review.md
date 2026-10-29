I found no new blocker in what I read. Most of the fixes hold up on static review, but some report claims go further than the code proves. I found one editorial gap in the scheduled window, one possible data-loss path in Kimi Tangle, and the practice protection ends on a fixed date.

**How I did this:** I only read files in this folder. I ran nothing and didn't open a browser. Every test count, audit total and "passed" result quoted below is the authors' own run, not mine. Where I say a fix is confirmed, I checked the logic, not a result.

## Issues, most important first

**1. Medium: Practice protection stops at a fixed date, so the original practice problem returns over time.**
- `practice-calendar.mjs:24` applies the reserved-board list only while `date <= '2027-04-28'`, and `:26` protects just the days left before that date. Protection shrinks from 182 days to zero; it doesn't roll forward.
- **Example:** on 2026-10-29, Ringcount (and any of these games) practice already offers index 191. That is the 2027-04-29 daily (rotation start index 10, plus 181 days, `daily-rotations.mjs:17-216`).
- On 2027-04-20, practice offers the dailies for Apr 29 to early May. From Apr 29 there is no protection at all. In the 18 games using the shared runtime, practice then steps through the rotation in order (`core.mjs:167-168`) and reaches upcoming dailies again.
- The authors' test treats this as correct: `practice-calendar.test.mjs:13` expects no protected boards on 2027-04-29. Nothing will fail as the date approaches.
- This is disclosed ("through April 28"), but it's a scheduled return of the original problem. The fix is to protect a rolling window computed from the rotation, not a frozen list.

**2. Low to medium (editorial): two original Sprout boards in the window still accept terms the new policy excludes.**
- `sprout-61` (index 60) lists `clit` as a dead-end word (`claude-sprout/puzzles.mjs:5`). It is the daily on **2026-12-10** (`daily-rotations.mjs:4670`, 41 days after the Oct 30 start).
- `sprout-86` lists `heroin`. It is the daily on **2027-01-04** (`:4695`).
- Typing either word costs a wilt, and the game replies with "CLIT is a dead end". The same words are in `claude-sprout-editorial-exclusions.json:3-4` as inherited exclusions and "dated slurs and explicit terms".
- Splice got date-based holds for the equivalent problem; Sprout didn't. The report's sentence "Original 128 boards … no exclusions" is true but sidesteps this. It's an editorial call, but the two games are treated inconsistently.

**3. Low to medium, conditional: the Kimi Tangle word review can wipe a same-day save made by an older client.**
- From day 20756 (Oct 30), the daily uses the reviewed word list (`reviewed-words.ts:29-30`).
- `restoreTangleProgress` rejects the whole save if any found word isn't in that list (`progress.ts:37-40`). `useTangle.ts:78,95-100` then starts fresh, and the save effect (`:116-128`) writes the empty board over the old save.
- **Trigger:** a cached web build or older native bundle saves Oct 30+ progress that includes one of the 12 removed words, then the updated client opens the same day.
- The authors' own test shows the rejection: `tangle-reviewed-words.test.ts:97` expects `null`. It only checks the historical-day case, not this one.
- I couldn't tell from source which boards in the window contain those words, because the data is one long JSON line. The fix is to drop removed words from `found` (and rescore) on reviewed days instead of rejecting the save.

**4. Low, possible but not shown: the Kimi tab guard has a short gap between adopting another tab's save and re-rendering.**
- When a `storage` event triggers adoption, `reload()` (for example `useMorph.ts:75-125`) only queues a state update; `ref.current` stays stale until React re-renders.
- An input landing in that gap passes `before()`, because storage now matches the acknowledged copy (`useDailySession.ts:52`). It then calls `setS({...ref.current})` with the stale state, which overrides the adopted one, and the save effect writes it.
- The author's "event" scenario (`stale-hook-dom.mjs:244-247`) wraps the event in `act()`, which forces the re-render, so it can't catch this.
- The window is milliseconds, and I haven't shown it actually happens. The report's own limit ("not atomic") should explicitly include this render gap.

**5. Low: some test evidence claims more than it shows.**
- **Cairn fallback:** the "bounded fallback" check (`daily-preservation.test.mjs:66`) sets `Math.random=()=>0`. That doesn't force the fallback at `cairn/engine.ts:133`; if the fixed chain completes and isn't reserved, it returns at `:130`. Reading `:133`, the fallback is filtered correctly, but the test doesn't prove that branch ran.
- **Reservation tests:** `practice-calendar.test.mjs:12-18` builds its expected values from `DAILY_RESERVATIONS` itself. For the 26 non-Kimi games, reservations come from the rotation formula (`build-six-month-calendar.mjs:40-42`), not the live selector. That's the same formula as `releasedDailyIndex`, so they match by construction. I spot-checked three values: Morph Oct 29 = 55 = 20755 % 450, Cairn = 619, Ringcount = 9 (matches the historical baseline).
- **Historical fingerprints:** they hash puzzle IDs and indices (`verify-six-months.mjs:22`), not puzzle content. Kimi IDs are just `slug:number`, so the hash proves the selector didn't change, not that the bank's content didn't.

**6. Low: one wrap-around to note.** Kimi Circuit (286 boards) is the only Kimi game that wraps inside the window. From 2027-03-01 to 2027-04-28 it serves indices 0–58, which the same selector assigned to 2026-05-19 through 2026-07-16. The launch-week check only covers Oct 20–28. These are repeats only if Kimi Circuit was live last summer, and I couldn't establish its launch date.

## Adjudication of each fix

| Finding | Verdict |
|---|---|
| **Opus F1/F4: practice served future dailies** | **Confirmed through Apr 28** (see issue 1 for after). <br>• The shared runtime (`core.mjs:167`), all 8 original UIs (6 shells at `:263`, `tradeoff/app.mjs:271`, `inbetween/app.mjs:229`) and all 6 Kimi games (`shared/practice.ts`, plus Cairn's generated towers and fallback) all go through `practiceCandidates`. <br>• Saved-round preservation is sound: only a restored save in progress reopens a protected board (`core.mjs:158-163`, `ringcount/shell.mjs:246-259`). Validator fallbacks don't count (`:254-255`), and Next leaves the save alone (`original-practice-ui.test.mjs:66`, author-run). |
| **Kimi P1: stale tab overwrote progress** | **Confirmed for the defect shown** (two tabs, stale input and stale save, both checked against storage). Remaining: the render gap in issue 4, mixed-version tabs, and no atomic transaction (disclosed). |
| **Opus F2: Morph hint not disclosed** | **Confirmed.** The medal label (`engine.ts:44`), the result dialog line (`MorphWinModal.tsx:50`), the 💡 share line (`engine.ts:58`) and the data flow (`MorphPage.tsx:89`) are all in place. Gold, streak and win status are deliberately unchanged, so this is disclosure only. |
| **Opus F3 / Kimi P2: Kimi selectors and missing baseline** | **Confirmed.** <br>• All six selectors are pinned to their published bank sizes (`shared/daily.ts`). <br>• The verifier now fails on a missing baseline (`verify-six-months.mjs:21`). <br>• Total checked: 302 days × 32 games = 9,664. <br>• The append-a-record test (`daily-preservation.test.mjs:9-32`) is a sound design; the run is author-run. |
| **Opus C3: launch-week puzzles replayed** | **Confirmed for Oct 20–28 only** (`build-six-month-calendar.mjs:18-29`, `verify-six-months.mjs:18-25`). See issue 6 for Circuit. |
| **182-day selector evidence** | **The wiring is right:** the audit library calls the real selectors (`daily-audit-lib.mjs:41-58`), with Kimi bundled from the actual TypeScript. The results themselves are author-run. |
| **Kimi P1: Splice slurs in the schedule** | **Confirmed, and stronger than claimed.** <br>• Indices 7 and 23 appear in neither the Splice rotation (`daily-rotations.mjs:4419-4624`) nor its reservations. <br>• I also checked that `get` and `skins` occur only in the held boards, so MIDGET and REDSKINS can't be formed on any eligible board, even though both are in the accepted-word list. |
| **Kimi P2: Tangle nonwords** | **Confirmed as a narrow 12-word list**, applied from Oct 30 and to new practice. Historical days are unchanged. It is not a full lexical review, as stated. See issue 3. |
| **Gemini: Sprout rejected valid words** | **Confirmed on the new 72 boards.** Read statically, the audit logic (`audit-claude-sprout-lexicon.mjs`) is correct: the current word fixes the remaining letters, so walking states by word is complete. The "0 unexplained omissions" figure is author-run. See issue 2 for the original boards. |
| **Gemini: Prism/Switchpath duplicates in practice** | **Confirmed.** The eligible set is now the deduplicated rotation (`practice-calendar.mjs:21`). |
| **Gemini: Twin Hive missing words** | **Not addressed** by the adjudication. No concrete example exists either way. |
| **Opus minor: future-dated stats** | **Confirmed.** `tradeoff/engine.mjs:174` and `inbetween/engine.mjs:158` now ignore future dates, and both apps pass `getDateKey()`. |

## Remaining limits

- **"New" means a different whole board.** "182 distinct" means 182 different board configurations per game under each game's identity key. It doesn't mean new editorial material. These reuse a fixed pool:
  - Counterpart and Second Sense pieces repeat every 2–3 weeks.
  - Keystone arches are used up to 4 times each.
  - Twin Hive letter racks recur.
  - Quartet groups and Cairn levels recur.
  - A generated Cairn practice tower can share 4 of its 5 levels with an upcoming daily, because only whole towers are compared.
- **Practice protection** is index-based and ends 2027-04-28 (issue 1). For the Kimi games it relies on the authors' run showing every bank fully distinct.
- **Editorial:** what's been done is narrow exclusion lists, not a human pass. Original Sprout and Tangle content in the window is still unreviewed.
- **Not verified by me:** every test count and audit total, browser play, real multi-tab behaviour, the native bundle, and iPhone touch, audio and haptics.
