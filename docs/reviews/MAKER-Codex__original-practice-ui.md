# MAKER-Codex — original game Practice reservations

Verified October 29, 2026.

The original eight game UIs now use the shared `practiceCandidates` calendar:
Ringcount, Switchpath, Counterpart, Shortlist, Second Sense, Sideways, Tradeoff,
and Inbetween. New/random/Next selections exclude the remaining protected
dailies, including today's unfinished daily. The picker renders available
entries and explains that upcoming dailies stay fresh. Completing or revealing
today's daily still permits its separate Practice replay.

An explicitly selected, valid unfinished Practice save remains resumable even
when its board is now reserved. This includes a valid initial save, because an
earlier version may already have shown that board. These grandfathered saves
are not added to the random/Next pool. The UI checks the saved puzzle ID before
restoring, accepts the engine's validated/normalized progress, and rejects
malformed data whose validator falls back to a fresh state. Existing save keys,
engine rules, scoring, and hint costs are unchanged.

`scripts/original-practice-ui.test.mjs` executes all eight actual applications
and renderers with real engines and the final calendar helper in jsdom. Its 24
tests check the exact available picker contents, forged selection events,
40 random/Next selections per game, matching and mismatched saved IDs, malformed
matching-ID saves, initial saves, normalized Inbetween placements, preservation
of saved progress, and finished-daily replay. Inbetween retains its existing
Next-to-picker interaction; its random choice then uses the eligible pool.
The harness fixes the date to October 30 and injects the actual released daily
selector so it also works in this isolated checkout before parent engine
integration.

The new regression suite initially failed on the unguarded UIs. The final
combined run passed **399 tests, zero failures, zero skips**, including the
24 new cases and existing original-game engine, content, persistence, draft,
and VM tests:

```sh
NODE_PATH=/Users/jamesalford/Documents/Codex/2026-10-27/task/alford-daily/packages/kimi-pebbles/node_modules \
node --test scripts/original-practice-ui.test.mjs \
games/{ringcount,switchpath,counterpart,shortlist,second-sense,sideways,tradeoff,inbetween}/tests/*.test.mjs
```

Existing VM tests now strip the shared helper import and inject the actual
helper. No engine, puzzle-bank, calendar-data, native, or catalog edits are
included. This is an automated application/DOM verification; no browser,
server, or physical device was launched.
