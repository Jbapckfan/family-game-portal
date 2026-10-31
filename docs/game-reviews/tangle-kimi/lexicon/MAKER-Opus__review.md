# Tangle lexicon expansion review (static, supplied files only)

**Verdict: not ready.** One proven bug can silently erase a saved daily round, and it breaks the "old valid scores remain" requirement. The fixes are small. Several evidence items you described as included are not in the payload I received.

**Method record:** Model `claude-opus-5-5` (Opus 5.5). I manually read the 8 supplied source and test files and the audit aggregate JSON. I ran nothing, read no other files, changed nothing, and inspected none of the 409k source words. No line numbers were supplied, so I counted them from the pasted text (≈).

**Declined:** UI, visual and fun scores. No screenshots or play sessions were supplied.

---

## Critical

### C1. Kept legacy edition plus a new expansion word: the round is wiped on reload (proven)

- **Where:** `engine.ts:25–28`. Effects show up at `useTangle.ts:79–80`, `useTangle.ts:117–131` and `useDailySession.ts:60`.
- **Trigger:**
  1. On day ≥ 20757, a user on a pre-Oct-30 cached client finds an excluded word, say `fag`, in the original edition.
  2. They upgrade. `keepEdition` is true, so they get `expand(original)`.
  3. They find an expansion-only word, say `tares`. The save is now `{fag, …, tares}`.
  4. On the next `startDaily` (page reload), `restoreTangleProgress(save, original)` fails because `tares` is not in `original.words`.
  5. So `legacy` is null and `keepEdition` is false. The reviewed and expanded edition lacks `fag`, so `saved` is null.
  6. The state resets to `found: []`, and the commit effect writes that empty progress over storage.
- **Same root cause, second path:** any other new-client tab's `before()` sees `validate(raw)` return null. It then overwrites storage with its own state.
- **Knock-on effect:** if Gold had been reached, re-reaching it re-runs `useTangle.ts:215–228`. That block increments `completed` again because it doesn't check `lastCompletedDay`.
- **Correction:** validate the legacy save against the edition the user is actually playing.

  ```ts
  const legacyBase = dayNumber >= TANGLE_LEXICON_START_DAY ? expandTanglePuzzle(original) : original
  const legacy = savedProgress === undefined ? null : restoreTangleProgress(savedProgress, legacyBase)
  if (legacy?.found.some(w => TANGLE_REVIEWED_EXCLUSIONS.includes(w))) return { puzzle: legacyBase, puzzleNo: idx + 1 }
  const edition = reviewTanglePuzzleForDay(original, dayNumber)
  return { puzzle: dayNumber >= TANGLE_LEXICON_START_DAY ? expandTanglePuzzle(edition) : edition, puzzleNo: idx + 1 }
  ```

- **Also fix:** guard `useTangle.ts:218` with `&& stats.lastCompletedDay !== prev.dayNumber`.
- **Regression test:** in `tangle-lexicon.test.ts:64–72`, append an expansion-only word to `save.found`. Then assert that `dailyTangle(day, save)` restores every found word with an unchanged score.

---

## Important

### I1. Runtime coverage test exercises 182 of 430 boards; a missing grid key would crash (hypothesis about the data, proven test gap)

- **Where:** `lexicon.ts:11` throws `RangeError` if a grid has no key. `tangle-lexicon.test.ts:39,64` loop only `START..START+182`. Practice samples 20 random boards.
- **Trigger:** the audit reports 2 boards with no additions. If the generator omitted those keys instead of writing `[]`, those days throw from `dailyTangle`. The throw also happens inside `validate()` during `before()`, so actions crash too. I can't see the JSON.
- **Correction:** loop over all 430 days. Also add a test that every distinct `raw[i].g` is a key in `lexicon-expansions.json`.

### I2. The extension has no runtime guard against the closed 12 exclusions (proven missing guard, data unverified)

- **Where:** `lexicon.ts:14` unions the `extension` without filtering.
- **What prevents it today:** only the generator's exclusion step, which the audit reports.
- **What the tests check:** `tangle-lexicon.test.ts:41,44` compares `dailyTangle` against `expandTanglePuzzle` itself, which is circular. No test asserts that the extension and the exclusions don't overlap.
- **Correction:**
  - Use `extension.filter(w => !excluded.has(w))` at `lexicon.ts:14`. Legacy words still survive because they arrive through `puzzle.words`.
  - Add a test asserting that no expansion list intersects `TANGLE_REVIEWED_EXCLUSIONS`.

### I3. The closed list's premise no longer matches the candidate set (hypothesis about content)

- **Where:** `reviewed-words.ts:5` says CCWS/FAGS are "the exact additional variants present in the supplied bank."
- **The problem:** ENABLE, Wordnik and dwyl now add 2,907 four-by-four words and 1,671 preview words that the editorial pass never saw. This could include inflections of the excluded slur roots or other offensive terms, if any board can spell them. I can't check, because the added words weren't supplied.
- **Your decision stands:** keeping the 12 unchanged is not reopened here.
- **Correction:**
  - Have the audit emit the added words that intersect (excluded root plus s/es/ed/ing/er) and a standard offensive-terms list, for explicit sign-off.
  - Update the comment at `reviewed-words.ts:5` so it no longer claims exactness.

### I4. Four-by-four completeness evidence is aggregate-only; the independent audit isn't in the payload (evidence gap)

- **What exists:** only the preview has an in-repo independent DFS against the full union (`tangle-five.test.ts:33–43`).
- **What's missing for four-by-four:** the 33,506 / 2,907 figures come from an audit script that wasn't supplied. Nothing in the supplied tests ties `lexicon-expansions.json` to the sources.
- **Correction:**
  - **No false accepts (cheap):** check every expansion word with the test's own `pathExists` on its 4×4 grid, plus `/^[a-z]{3,16}$/`.
  - **No false rejects (slow):** commit the word-centric audit as an opt-in test.
  - Record per-board accepted-set hashes in the audit output.

### I5. Provenance and license evidence was described as included but is absent (evidence gap; can't mark ready without it)

What's required:
- Pinned commit and SHA-256 for each of `english-words-alpha.txt`, `wordnik-game-words.txt`, `enable2k.txt.gz` and `zynga-disclosed-words.json`, matched to the repo copies.
- dwyl's license from the pinned commit's LICENSE file (the brief gives no license for dwyl).
- Wordnik's MIT copyright and permission notice kept next to the redistributed file, and in third-party notices if derived words ship.
- A source for ENABLE's public-domain statement.
- A note that `wordnik-game-words.txt` is JSON-per-line, i.e. quotes stripped via `JSON.parse`, and how it was transformed from upstream.
- The Zynga terms: the brief names only 4 of the 6, and the tests assert only 3 (`bff`, `bookclub`, `buzzworthy`). List all six with URL and retrieval date. Keep product copy free of any Words With Friends parity or endorsement claim.
- A build manifest showing `data/*.txt` and `data/*.gz` are absent from `dist`. The supplied `src` imports only per-board JSON, so the browser-payload claim holds for source code but is unproven for build and publish config.

---

## Minor

- **M1. Unreconciled candidate count (evidence):** the union is 409,097 but `sourceCandidates` is 408,617, a difference of 480. This is probably 1–2-letter entries plus the 12 exclusions, but it isn't stated. Emit the breakdown, along with per-source counts dropped by the `/^[a-z]+$/` filter (`tangle-lexicon.test.ts:18`). Parsing is shared by the generator and the tests, so it is not independently checked.
- **M2. Hints now point at expansion and obscure entries (proven behavior):** `useTangle.ts:258` draws hints from all `puzzle.words`. `five-preview.ts:6` mentions a "familiarity list used for clues", but the hint code doesn't use one. Either carry a `hintWords` field (for example, the reviewed original words) or fix the comment.
- **M3. Path rules aren't enforced in the supplied engine (hypothesis; UI excluded):** `setPath` and `submitPath` (`useTangle.ts:180,189`) accept any index array. Adjacency and no-reuse depend on unseen UI code. Validate in `submitPath` with `isAdjacent(a, b, Math.sqrt(g.length))` and a uniqueness check.
- **M4. Older-client tabs can overwrite new expansion progress (limitation):** an old cached tab validates foreign saves against its own word list and treats them as invalid (`useDailySession.ts:60`). Its next write then drops the newer save's expansion words. This can't be fixed in old code; document it, or consider a versioned key.

---

## Checked and holding

- Day 20757 is 2026-10-31 UTC (20454 + 303) and 20756 is Oct 30. Historical days stay on prior editions, structurally, via the `>=` gates.
- `expandTanglePuzzle` keeps `targets` and `best`, so Gold is unchanged while `n` and `max` grow. Gold stays ≤ `max`.
- No inflections are synthesized at runtime; acceptance comes only from source lists.
- There is no length cap, and 8+ letters score 11.
- The preview restore fixture sums to 28, below the Gold target of 30, which is consistent.
- `src` imports only board-specific JSON, never the source lists.
- This is completeness against the pinned sources only. It says nothing about familiarity, semantic freshness, correctness of individual source entries, or current Words With Friends parity, which remains unverified.
