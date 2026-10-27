# Alford Daily launch-quality candidate

Local branch `codex/daily-launch-quality-2026-10-27`, based on `db8c554` (preserving the documentation investigation after `5a9d9a9`). No shared portal or Lasers changes.

## Result

Today's Three provides three distinct available games from four featured entries: Ringcount, Switchpath, Counterpart and Shortlist. Selection is deterministic by the existing Central date and October 20 epoch, with matching web/Swift fixtures across DST and clock rollback. If an entry is absent, selection fills from remaining catalog games. All 32 original games, creators, identities and practice modes remain accessible; creator filtering affects the full catalog without emptying the suggested shelves.

The existing paper/ink home now has compact phone picks, four featured cards and a clear browse-all path. Same-day background refresh updates badges without replacing focused links. Native Today uses the same selection and retains Dynamic Type layouts.

Home sharing contains only date, catalog game names and allowlisted public result labels. It never reads puzzle answers, cuts, paths, dictionaries or the editorial audit. Canceled shares write no progress. Manual-copy text clears on rollover; delayed share/clipboard failures cannot restore a stale summary. Native payloads are built at button activation, independently of the view's 30-second date pulse.

No game engine, save key, scoring rule, reward system, app identity or commerce configuration changed. The home reads existing terminal records and does not award extra completion credit.

## Verification

- **485/485** full JavaScript game/integration tests pass, including late asynchronous share failures and old terminal-save/write-failure protections.
- **56/56** Kimi tests and the pinned Kimi build pass. Its existing 685 KB dictionary chunk produces a size advisory; no dependency or dictionary expansion was added.
- Chrome and WebKit real-browser flows pass: three distinct available picks; four featured cards; all-32 access/filtering; Central midnight, DST and clock rollback; existing records; canceled sharing and blocked writes; manual-copy rollover; same-day keyboard focus; reload; 320px/reduced-motion layouts. Actual screenshots were inspected.
- Final **32/32 native tests pass**, including trusted initialization of **all 32 actual bundled game runtimes with HTTP(S) blocked** and shared persistent-origin checks. Web/native selection and share-date regressions pass.
- Final **unsigned iPhone Release build succeeds**. All **264 bundled runtime files** are byte-identical to source. An earlier sandboxed Release attempt blocked Swift macro plugins and caused cascading compile errors; the authorized build outside the shell sandbox passed without source workarounds.
- Standalone export stages **32 games, 8,001 puzzles and 294 runtime files**. It excludes the surrounding Family Portal, tests and internal editorial reports. No publication occurred.
- Opening-month audit executes **960 actual daily selections** and reviews **120 featured boards**. See `opening-month-editorial-review.md` and `opening-month-audit.json` for facts, source limitations, semantic flags and provenance blockers.
- One independent reviewer found two Important rollover cases. Both were reproduced before their fixes; JSDOM/Swift regressions and the final full suites pass. No Critical or minor findings; no second review or recursive cascade.

Logs, screenshots and verification metadata are under ignored `output/launch-quality/`. The standalone candidate is under ignored `dist/launch-quality-reviewed-20261027/`.

## Release checklist

- [x] Preserve all 32 identities, credits, saves, date-keyed terminal records, practice and disabled commerce.
- [x] Browser, native offline, full test suites, final unsigned build and standalone staging verified locally.
- [x] Bounded independent review and one fix pass completed.
- [x] Opening-month source/editorial audit saved; no content silently rewritten.
- [ ] Physical iPhone/iPad touch, VoiceOver, accessibility-size interaction and low-end sustained performance.
- [ ] Human audience/locale/ambiguity review of the opening month and the documented repeated analogy pool.
- [ ] Document dictionary/content/asset distribution rights. Provenance records and machine solvability do not establish permission.
- [ ] Owner review of release metadata, distribution and any proposed price test. Nothing was published, installed on a phone or activated for payment.
