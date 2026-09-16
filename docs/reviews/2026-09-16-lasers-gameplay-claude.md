## Lasers 3D review (Claude, HEAD 426a8fd, 2026-09-16)

### 1. What I inspected versus inferred

**Read in full:** CURRENT-RULES.md; `src/levels.js` (all 31 definitions), `sim.js`, `pieces.js`, `learning.js`, `main.js`, `main-trace.js`, `ui.js`, `input.js`, `render-camera.js`, `progress.js`, `main-camera.js`, `render-duplex.js`; `test/duplex.test.mjs`, `test/splitter.test.mjs`, `test/progress.test.mjs`; the chapter proof hooks in `validate-levels.mjs` and the solver API in `solver.mjs`. Spot-read `render.js` and `render-beam.js`/`render-pieces.js` for fog and preview handling.

**Evidence packet read:** `validation.log` (complete, 31 levels OK, per-level proof node counts), `level-audit.json` (31 entries), `runtime.json` (12 rows at read time) and `runtime.log` (24 of 31 levels won at read time), the orchestrator screenshots for levels 1, 4, 10, 13, 21, 23 plus `hint-extra-piece-bug.png`, the five recent underside/splitter captures, and the tails of the DOM (507/507), splitter browser (68) and underside (87) logs.

**Hand-traced against the engine rules:** the stored solutions of levels 28 to 31 step by step (crossing points, underside pitch conversion, target heights), level 13's empty shot, and level 21's solution route. All agree with the captures.

**Not done, and why:** my read-only solver diagnostic (minimal-solution counts, alternate routes, enumeration by depth) was blocked by the sandbox, so "shortcut" and uniqueness claims below rest on the validator's par proofs only. `git log`, `git status` and the localhost 8795 probe were also denied. I ran no tests myself and did not drive the browser. No physical device. The Kimi review file contains only a 403 quota error, so no second reviewer output exists.

### 2. Prioritized findings

**Verified logic bugs**

1. **High. HINT confirms a broken board as "the answer".** `src/main.js:840-845` treats the hint as satisfied when every stored-solution piece is present, without checking that the route works. Evidence: `screenshots/hint-extra-piece-bug.png`, level 1 with PIECES 2/1, readout "The beam left the board", toast "That is the answer. Press FIRE!". The extra mirror intercepts the beam first. Impact: the hint system lies exactly when a child is stuck. Fix: after the entry loop, diff placed pieces against the solution, focus the surplus piece and say "Remove the extra MIRROR at column 4, row 4"; do not advance the stage.

2. **Medium. Level 4's intro contradicts the current star rules.** `src/levels.js:150` says "a no-tilt solve is what earns the third star". CURRENT-RULES and the help modal say tilting costs nothing and FROM ABOVE is a separate badge. This is the first heights level, so it misinforms every new player about scoring. Fix the sentence to name the badge.

3. **Medium. RESET erases the hint penalty.** `resetAttempt()` at `src/main.js:480` clears `hintUsed`; `win()` at 757-760 reads it. Repro: press HINT three times (the toast names column, row and orientation), RESET, place from memory, FIRE. Result: all three stars and FROM ABOVE. Fix: keep a per-level assisted flag in the progress record until a clean solve, or stop clearing it on RESET within the same visit.

4. **Low. FLOOR orientation is rules-irrelevant but the hint demands it.** `pieces.js:62-65` makes both FLOOR orients identical; `main.js:843` still compares `orient`. On levels 13, 17 and 22 a correctly placed plate can be reported as the missing piece ("Move or rotate the piece already there") while the real error is elsewhere. Fix: compare orientation only when `Pieces.turnsBeam(type)` is true.

**Evidence-backed design concerns**

5. **Medium. Dark levels leak the route through the live preview.** Every edit retraces and draws the beam (`main.js:709-716`), and `render-beam.js` has no fog clipping. `screenshots/21-initial.png` shows the full route, including the fixed mirror's turn and the wall stop, at DARK 0% before any FIRE. A player can slide a piece and watch the preview to map walls without ever firing, so DARK is cosmetic. Fix: on dark boards clip the unfired preview at the first undiscovered cell so FIRE remains the expedition DESIGN 15.2 describes.

6. **Medium. Free hint stage 2 pulses the exact answer cell.** `main.js:846-847` focuses and pulses the solution cell without charging an assist. Only type and orientation are withheld. Fix: pulse a row or column band, or count stage 2 as assistance.

7. **Medium. Slow taps are silently dropped.** `input.js:17` sets `tapMaxMs: 300`; a press-and-release on an empty cell that lasts longer produces nothing and no feedback (line 285). Young children press and hold. Fix: for cells without a movable piece, accept any release without movement as a tap.

8. **Medium. Level 21 is a difficulty cliff with no DARK teaching.** Proof sizes: level 20 at 2502 nodes, level 21 at 42945, level 22 at 64. Level 21 has no intro (`levels.js:733`); DARK is explained only inside HELP. Fix: give 21 an intro sentence about darkness, and consider swapping 21 and 22 so the dark chapter ramps.

9. **Medium. Both bonus chapters read as one test fixture each.** All four Splitters boards share emitter (1,3) E, receiver (10,3) and the same two block clusters; all four Both Sides boards share emitter (1,2) E and a 12x12 blank top face. Tray equals par on all eight, so the par star is automatic and there is no spare piece to experiment with. Proof sizes are 1/20/38/603 and 1/6/35/34 nodes. No puzzle has branches crossing, a splitter on raised terrain, or an underside arch or FLOOR. Fix: author two or three larger boards per chapter on campaign-style terrain, add a spare piece, and add one crossing puzzle and one underside opening puzzle.

**Suggestions**

10. The readout never says "it flew over your MIRROR at column x, row y" even though `sim.js:398-415` records overflight, underpass and glide events. Levels 4 to 8 are entirely about this. Add the sentence.
11. Intros for levels 8, 10 and 11 promise the readout "names the height your beam is flying at". It does so only on blocked shots and flyovers (`main-trace.js:93-94`, `ui.js:374-377`). A lost-edge shot names none. Always show a beam-height chip.
12. SUMMIT's NEXT LEVEL drops straight into TWO WAYS with no campaign-complete moment (`main.js:765`, `ui.js:681`).
13. Tapping a placed piece rotates it before selecting (`main.js:621`), so removing a piece by tap always spins it first.
14. Level grid chapter labels put TWO ORBS and SKIPPING STONE under OPENINGS (`ui.js:663`).
15. Below face in 2D draws north at the bottom (`laser-underside-below-flat.png`: row 10 target below the row 5 hole) while hints and the cursor use the same row numbers. A small N marker on the face would help.
16. The "NEW: Play Both Sides" button is inserted before the modal's close button (`ui.js:654`) while the Splitters button sits above the grid (`ui.js:649`). Verify the layout visually.
17. FROM ABOVE is shown only in the victory modal, never on level tiles.

### 3. Level-by-level

| # Name | Mechanic / teaching role | Difficulty / fairness | Issue or improvement |
|---|---|---|---|
| 1 FIRST BOUNCE | Place, rotate, fire; toast tutorial | Trivial, fair | Hint bug reproduces here; walls invisible in 2D so "hit a wall at height 0" points at nothing until 3D is tapped |
| 2 AROUND THE CORNER | Single mirror again | Trivial | Near-duplicate of 1; could merge or add a second bend |
| 3 DOUBLE TAKE | Two mirrors (24 nodes) | Easy, fair | None found |
| 4 OVER THE WALL | Heights, flyover, free reveal | Easy, fair | Intro text stale about third star (finding 2) |
| 5 UP THE STAIRS | WEDGE intro, free reveal | Easy | None found |
| 6 BEND THEN CLIMB | Wedge practice, no intro | Easy | None found |
| 7 LEVEL OFF | DIP intro, climb-then-level | Jump: par 3, 4 pieces, 567 nodes at the moment a piece is introduced | Insert a par-2 dip level before it |
| 8 ON STILTS | Piece on a block | Medium, fair | Intro over-promises height readout (suggestion 11) |
| 9 SECRET RAMP | Hidden wedge; empty shot goes lost-sky | Medium, fair because intro warns | None found |
| 10 UNDER THE ARCH | Arch, first 18x18 | Medium | First board that must pan on a phone; ZOOM/ALL toggle appears here without explanation |
| 11 THROUGH THE WINDOW | Window, par 2 | Easy (12 nodes), dip after 10 | Acceptable as a teaching beat |
| 12 TWO ORBS | Two targets, fixed wedge | Medium | Chapter label says OPENINGS |
| 13 SKIPPING STONE | FLOOR intro | Medium (587) | 281-char intro is a 12.6 s toast; consider two shorter toasts; chapter label wrong |
| 14 THE LOW ROAD | Fall-then-level, arch | Easy (23 nodes) | None found |
| 15 THREAD THE NEEDLE | Window at height 2, arrive at exact height | Medium | None found |
| 16 STONE BRIDGE | Arch plus climb-then-level | Medium (587) | None found |
| 17 THE SKIMMING STONE | Fixed FLOOR, spare tray FLOOR is a decoy | Medium | No intro for first fixed plate; hint FLOOR-orient issue (finding 4) |
| 18 SECRET STEPS | Second secret wedge, par 4 | Hard (2100) | None found |
| 19 THE HIGH WINDOW | Window at 2, par 4 | Hard (1596) | None found |
| 20 HIGH ROAD LOW ROAD | Two targets, two wedges | Hard (2502) | None found |
| 21 THE LONG WAY ROUND | First DARK, par 5, 24x24 | Cliff (42945) | No DARK intro; preview leak (findings 5, 8) |
| 22 STONE SKIPPING | Double bounce, DARK | Easy for its slot (64) | Swap with 21 |
| 23 SUMMIT | Two targets, secret wedge, DARK | Hard (13551), good finale | No campaign-complete moment (suggestion 12) |
| 24 TWO WAYS | Splitter intro | Forced (1 node) | Fine as tutorial |
| 25 THREE LIGHTS | Two splitters | Easy (20) | Same skeleton as 24 |
| 26 RISING FORK | Splitter keeps pitch, wedge on one branch | Easy (38) | Same skeleton |
| 27 PRISM BRIDGE | Split, climb, window | Medium (603), only real splitter puzzle | Chapter never shows branches crossing or merging |
| 28 THROUGH THE BOARD | Downward crossing, Below button | Forced (1) | Fine as tutorial; par star automatic |
| 29 RETURN TO LIGHT | Round trip through two holes | Easy (6) | Fine |
| 30 DEEP CURRENT | 3-high underside columns | Easy (35) | Tray shows WEDGE 0 and FLOOR 0 cards for pieces the chapter never uses |
| 31 PARALLEL WORLDS | Splitter feeding both faces | Easy (34) | Good capstone idea, too small a board |

Solvability is proven for all 31 by the validator with zero cap hits. Fun and clarity are not established by that. Whether alternate minimal routes exist on the 20x20 and 24x24 boards is unassessed (solver run blocked).

### 4. Gameplay systems

- **Touch and camera.** The gesture arbitration in `input.js` is sound: pinch locks to zoom, orbit needs both fingers to move, finger changes rebase, blur and capture loss release. Two-sided orbit through edge-on is guarded (`render-camera.js:98`, 0.65 floor). The rotation pivot and pan offset are kept separate as the rules require. Concern: on touch, tilt is reachable only via the 3D button or two fingers, which is fine but only documented in HELP and VIEW.
- **Placing, rotating, moving.** Works and is tested, with the rotate-on-select quirk (suggestion 13). Move via long-press drag or the arrow button then a destination tap is clear.
- **Feedback and readouts.** End texts, pitch note, altitude chips and "n of m lit" are good, and the blocked-height wording is consistent for solid and hollow walls. Missing: which piece was missed (suggestion 10) and a height on every shot (suggestion 11).
- **Goals and stars.** Criteria are independent flags, merged per criterion, migrated safely. Integrity gaps: findings 3 and 6, and automatic par in the bonus chapters.
- **Hints.** Three stages are a good shape; finding 1 is the one that breaks trust.
- **Saves.** Explicit IDs, fingerprints including underside data, attempt validation through `canPlace`, camera face persisted. `progress.test.mjs` and `duplex.test.mjs` cover renames, reorders and stale geometry. No issue found.
- **Discoverability and accessibility.** Keyboard cursor, aria labels, focus traps, numeric Z badges, reduced motion, and a cursor description that respects darkness. The first-run help does not auto-open (`main.js:106` `autoHelp: false`), so DARK and the Both Sides flip rely on in-level intros, which level 21 lacks.

### 5. Top 5 next actions

1. Fix the hint false-confirmation (finding 1) and the FLOOR-orient comparison (finding 4).
2. Close the star-integrity gaps: RESET keeps the hint penalty, stage 2 pulses a region not a cell, and update the level 4 intro copy.
3. Clip the live preview on dark boards and give level 21 an intro, then reconsider the 21/22 order.
4. Author real bonus puzzles: larger terrain, a spare piece, a branch-crossing splitter level, and an underside arch or FLOOR level.
5. Widen the tap window for empty cells and add missed-piece text to the readout, then run a human playtest with a child on the iPad once a device is available. The automated passes prove routes and rendering, not usability.
