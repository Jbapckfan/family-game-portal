# CIRCUIT, TANGLE, QUARTET adaptation changes

Only the adapted game modules and their tests were changed. The imported source remains untouched.

## Behavior

- CIRCUIT: added Undo word and Restart chain controls. Undo restores the last submitted word for editing; restart clears the chain while preserving hint use and daily play statistics. This makes the 56 audited boards with legal dead-end openings recoverable.
- QUARTET: active hints use the board's unique word identities, persist with progress, and survive shuffle, wrong guesses, and unrelated group solves. A clue clears once its group is solved. Fourth-miss loss now stores four misses; restoration also repairs the original three-miss counter using validated guess history.
- All three: validate daily saved fields before using them. CIRCUIT verifies the legal chain and terminal coverage. TANGLE recomputes points/gold from accepted unique found words. QUARTET verifies tile/group identity, solved groups, and history consistency.
- All three: load statistics in a useState initializer and reread them on return to daily play. Help keys are `kimi:<game>:seen-help`. Game-ready markers are on rendered board wrappers, and pages call the shared unified-progress hook.
- Hint wording is neutral and retains one free hint per round. Restoring TANGLE gold no longer triggers its new-win celebration again.

## Exact content changes (one-based puzzle IDs)

`ping` → `pin`, only within `Words before "ball"`:

139, 172, 232, 239, 265, 325, 369, 386.

`Hidden animals` → `Animals` (label only):

28, 68, 89, 93, 97, 107, 124, 127, 156, 158, 173, 185, 189, 192, 207, 209, 210, 227, 279, 285, 308, 372, 417.

No other puzzle fields, board order, counts, scoring, or medal thresholds changed.

## Validation

Focused tests exercise the audited CIRCUIT `become` trap on board 2, undo/restart, malformed saves, QUARTET hint restoration after shuffle, the fourth-miss counter, exact editorial correction counts, and TANGLE score/gold reconstruction. Every bundled completed solution passes save validation (286 CIRCUIT, 430 TANGLE, 420 QUARTET). A server render regression checks fresh statistics on each hook's remount without reimporting its module.

Run all package tests with:

```sh
node --import tsx --test --test-isolation=none tests/*.test.ts tests/*.test.mjs
```

The source-inspected data audit found no mechanical solution failures or duplicate boards. TANGLE's full word-list policy remains unchanged: all 430 boards require points beyond the supplied Cairn `common.txt` subset to reach gold. For board 1 that subset yields 8 points versus gold 52; this is a dictionary-scope observation, not a claim that every excluded word is obscure.
