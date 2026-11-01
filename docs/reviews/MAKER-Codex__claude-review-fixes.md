# Claude review adjudication and duplicate-bead repair

November 1, 2026. Actual review read: root `output/remaining-games-20261101/remaining-games/MAKER-Opus/review.md`. Worktree created from `0deb0ea` at `/Users/jamesalford/Projects/MAKER-codex__claude-review-fixes-20261101`, branch `codex/claude-review-fixes-20261101`.

The root's current three `vocabulary.mjs` files were copied solely as QA inputs. Their `WORD_GAME_INFO.sourceUnion` is 410,592; exact byte counts/checksums are retained in the evidence receipt. These data copies are intentionally **not committed**. No generator, shared runtime, Kimi file, puzzle bank, identity, target, calendar, service, visible tab or deployment was changed.

## Findings and decisions

| Finding | Verified result | Action |
|---|---|---|
| Claude Tangle charges a knot for a correct word selected with blocking duplicate copies | Reproduced on real board `tangle-001` | Fixed in the submission path; added current-word-class feedback and Help wording |
| Keystone v2 accepts different concatenation orders from the authored `fused()` directions | True difference, intentionally allowed by the actual v2 rules | No semantic change; verified all 174 arch maps against the documented either-order predicate |
| Splice keeps a now-impossible disjoint pending hint | The situation exists, but its cleanup is already implemented in `0deb0ea` | No production change; added exhaustive reachable-tile-set coverage |

## Tangle reproduction and repair

Board `tangle-001` is `fbriainguanescetn`; its authored threads are GUEST, BRAIN and FINANCE. With vocabulary 2, BRAIN selected at zero-based indices **[1,2,4,5,6]** formerly recorded a knot. BRAIN at **[1,2,4,5,16]** leaves a valid complete partition. This is a duplicate-N choice problem, not a wrong word.

Submission now tests other *currently available* ordered-bead paths spelling that same listed word. If one leaves a complete partition, the engine returns free "Try other copies" feedback. It leaves the selected beads, pulled beads, history, hints and knot count untouched. It does not identify the good copies or automatically pull the word. A real BRING trap on this board still costs a knot because none of its placements leaves a complete continuation. Tests also cover the same BRAIN retry after pulling GUEST, and a case where a globally possible alternative would improperly reuse already-pulled beads.

The replay function is unchanged. Previously saved vocabulary-2 knot events on the bad BRAIN path remain accepted as historical knots, and later valid pulls retain that history. Markerless/classic behavior is unchanged. New submissions create no extra event type or save field. Help now explains the word-level trap rule, and the trap message states that no available placement works.

An independent two-mask complement oracle classified **all 29,346 dictionary paths over all 200 boards**:

- **1,135** immediately safe paths, which still pull normally.
- **739** blocking-copy paths with another valid placement of the same word, which now get free feedback.
- **27,472** genuine trap paths, which still charge one knot.

Every resulting state restores. The test also replays each previously valid unsafe-path knot event to ensure this submission fix does not discard existing histories.

## Keystone adjudication

The current generator, independent audit and visible instructions consistently allow a solution to go before **or** after each clue. `WORD_GAME_ALTERNATIVES` is generated with that same predicate. Treating authored `clue.d` as a binding constraint for vocabulary 2 would narrow its stated rules and reject already accepted solutions.

Example: `keystone-003` has WALK's arch with OUT, MAN, BOARD, WAYS and CROSS. FOOT is intentionally accepted. BOARD's original direction makes BOARDWALK for the prepared word; the alternative instead uses FOOTBOARD, which is permitted by the current v2 text. The previous real UI regression also explicitly expects FOOT and its actual joins to survive review/reload.

For all **174** distinct arches, the current alternatives map equals exactly the eligible dictionary words joining every clue in either order, including hidden clues. All **308** mapped answers actually win. All examined non-answer fit arrays agree with that same predicate. There are **62** accepted arch/word combinations that differ from an authored-direction-only predicate; this is the intended broadening. All 600 round instances were checked for differing-direction reuse of a key: **zero actual direction-key collisions**. Therefore the claimed v2 all-five-fit-but-rejected condition was not reproduced and no Keystone rule or key was changed.

## Splice adjudication

The reported scenario is real. In `splice-1`, the pending hint HIGH + LAND uses tiles **[0,1]**. Accepting HEAD + WARD at **[2,7]** is disjoint and leaves a valid alternative matching, but invalidates the pending HIGH + LAND matching.

The existing `submitPair` already checks both overlap and `!canPair(...)` after the accepted pair, clears the stale `hintPair`, and retains `hinted` history. The review's conditional concern was based on an unshown function tail. No additional fix was necessary.

Coverage now enumerates every reachable used-tile set in all **202** current bins: **34,892** tile sets and **88,646** disjoint accepted transitions. It observes **2,815** stale-hint cases and verifies that each clears the pending pair, retains assistance, restores its saved state and permits another hint. Still-viable pending pairs remain intact.

## Validation and integration

**45 scoped tests passed, zero failures or skips**, including the three existing engine suites, the existing remaining-CQ regression suite and the new focused review-fix suite. The real Tangle app was exercised through jsdom: the bad BRAIN selection announces the free feedback without persisting a knot; the player then manually changes N copies, pulls BRAIN and reloads the actual saved round successfully. This proves event/feedback behavior, not physical touch or visual rendering.

```sh
NODE_PATH=/Users/jamesalford/Projects/MAKER-codex__alford-daily-six-months/packages/kimi-pebbles/node_modules node --test games/claude-{tangle,keystone,splice}/engine.test.mjs scripts/MAKER-Codex__claude-review-fixes.test.mjs scripts/MAKER-Codex__remaining-cq.test.mjs
```

The red log captures the real BRAIN regression before the engine edit. The same run already passed Keystone/Splice adjudication tests. Logs and QA input hashes are in `MAKER-Codex__claude-review-fixes-evidence/`.

Root integration follow-through: the earlier `docs/reviews/MAKER-Codex__remaining-cq-audit.mjs` assumes every unsafe *specific Tangle path* must add a knot, both for first and second pulls. Those two expectations need the new whole-word distinction: a path is free if another placement of the same word among current remaining beads has a complete continuation. Its path/pull expectations remain the same. Root still owns vocabulary pinning/frozen editions and calendar/data work; this repair intentionally does not change them. No English-completeness, semantic-familiarity, full-project, native or hardware claim is made.
