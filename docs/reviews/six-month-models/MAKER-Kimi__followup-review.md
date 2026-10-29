## Review result

**No new demonstrated correctness blocker** in this focused, read-only static review. Most corrective changes are present and appropriately wired. One original editorial finding remains only partially addressed, and one evidence reference is inaccurate.

### Remaining issues

1. **P2 editorial — Tangle’s lexicon cleanup is narrower than the original finding.**  
   `packages/kimi-pebbles/src/games/tangle/reviewed-words.ts:9-13` excludes only twelve spellings. The first board still accepts `icica` after October 30 and in new practice: submission accepts any retained list member at `useTangle.ts:191-200`, and the regression explicitly requires `icica` to remain at `tests/tangle-reviewed-words.test.ts:48-53`. Other opaque entries also remain.  
   **Adjudication:** the dated exclusions, score/max/target recomputation, historical behavior, and practice filtering are implemented correctly, but the broader original lexicon concern is **not fully resolved**. This is a bounded editorial repair, not a reviewed allowlist or dictionary-quality certification.

2. **Low — the referenced dedicated Tangle lexical report is absent.**  
   `docs/reviews/MAKER-Codex__six-month-review-adjudication.md:14` says to see that report, but no such file exists under `docs/reviews/`. The implementation and tests are present; the claimed additional editorial rationale is not available here.

## Fix adjudication

- **Practice reservation filtering — confirmed in source across all 32 games.**  
  `games/deepseek-runtime/practice-calendar.mjs:16-32` removes the remaining dated reservations and restricts complete imported banks to canonical rotations. The 18 shared-runtime games use it at `core.mjs:153-169`; the eight original UIs use it for picker/random/Next, for example `games/ringcount/shell.mjs:261-294`; all six Kimi selectors route through `packages/kimi-pebbles/src/games/shared/practice.ts:4-11`, including Cairn’s generated boards and bounded fallback at `cairn/engine.ts:93-133`.

- **Existing practice progress — preserved deliberately.**  
  Valid unfinished shared-runtime saves resume at `core.mjs:157-163`; original UIs separately admit validated unfinished saves at `shell.mjs:246-284`. New selection after that round uses the protected pool. Malformed saves cannot unlock reserved boards. Finished-daily replay remains limited to UIs that already support it. The one-board bypass is confined to reduced fixtures, not production banks.

- **Kimi stale-tab guard — no new stale-write case demonstrated statically.**  
  `useDailySession.ts:47-79` rechecks storage before actions and persistence, validates and adopts changed records, and suppresses stale terminal writes; `useDailySession.ts:81-95` wraps exposed actions. All six hooks use it, including Cairn’s delayed advance and Hunch’s nested first-play checkpoint. Read failures use memory-only persistence.  
  The two-controller/effect-race/delayed-callback scenarios are **author-run tests**, not results I reproduced. The guard remains a read/check/write mechanism, not an atomic cross-process transaction; simultaneous instruction-level races and the separate progress/stats keys remain explicit limits.

- **Morph assistance disclosure — confirmed.**  
  Assisted medal labels and share suffixes are added at `morph/engine.ts:38-58`; the actual result modal receives `hintsUsed` and displays “Assisted · route shown during play” at `MorphWinModal.tsx:26-50`. A hint-assisted route can still earn Gold and extend streaks, but it is no longer presented as unassisted.

- **Frozen daily selection and historical baseline — implementation evidence confirmed.**  
  All six Kimi selectors use published bank sizes through `shared/daily.ts:4-7`; the baseline now contains all six at `docs/six-month-previous-calendar.json:189-236`. Missing baselines now fail at `scripts/verify-six-months.mjs:20-26`. The checked-in report records 32 games, 302 historical days, and 182 runway days at `docs/six-month-runway.json:2-17`.  
  The **9,664 historical assignments, 5,824 selections, uniqueness results, and append-bank test outcomes are author-run evidence**; I did not recompute hashes or execute selectors.

- **Launch-week replay and legacy duplicate filtering — confirmed structurally.**  
  Recent challenges are deferred during rotation construction at `scripts/build-six-month-calendar.mjs:18-29`, and the verifier rejects launch-week replays. Canonical practice eligibility also excludes legacy Prism and Switchpath equivalents; Prism’s post-window pool is covered at `practice-calendar.test.mjs:38-43`.

- **Splice editorial holds — confirmed.**  
  The holds are recorded in `docs/daily-editorial-holds.json:2-8` and applied during rotation construction at `build-six-month-calendar.mjs:15-23`. The resulting canonical list omits indices 7 and 23 (`splice-8`/`splice-24`), leaving 200 eligible boards from 202. The holds also remain effective in practice after the dated reservation expires.

- **Sprout COMMON coverage — confirmed with stated exclusions.**  
  New graphs enumerate the existing COMMON vocabulary at `scripts/expand-claude-six-month.mjs:195-235`, excluding the documented 77-term list. The audit visits reachable states and checks actual selection/submission at `scripts/audit-claude-sprout-lexicon.mjs:16-63`; the regression requires zero unexplained omissions. ROBE/TEAR/EATER routes and the two honestly marked no-dead-end boards are covered. Original 128-board preservation and reported audit totals remain author-run evidence.

- **Tradeoff/Inbetween future-stat filtering — confirmed.**  
  Both engines exclude records later than a valid `todayKey` at `games/tradeoff/engine.mjs:170-177` and `games/inbetween/engine.mjs:154-162`, without deleting stored records. Each has a future-record regression comparing against a current-only ledger.

## Remaining claim limits

“182 distinct challenges per game” means **182 distinct whole-board configurations under mechanic-specific canonical signatures**, not 182 independently authored concepts. Counterpart and Second Sense recombine finite pools; arches, fragments, categories, clues, racks, and vocabulary recur elsewhere. Twin Hive’s changed required letters can change accepted answers while reusing a rack. These remain content-variety limits, not newly demonstrated selector defects.

Protection is specifically through **April 28, 2027**. Canonical duplicate/editorial exclusions persist afterward, but future-daily reservation expires. Browser/device behavior, human difficulty, physical touch/audio/haptics, exhaustive editorial quality, and all reported test totals remain unverified by this static follow-up.
