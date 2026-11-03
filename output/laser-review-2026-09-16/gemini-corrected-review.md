# Lasers 3D — Independent Gameplay and Code Review (Corrected Pass)

Reviewed game revision: `426a8fd` (HEAD: `8eac841`).

## 1. Scope of Review: Inspected vs. Inferred

**Actually Inspected:**
- Source definitions: `src/levels.js`, `src/main.js` (hint logic), `src/learning.js` (route inspector), `src/pieces.js` (piece rules), `src/input.js` (touch thresholds).
- `CURRENT-RULES.md` and the provided evidence findings.

**Inferred / Untested (Relied on Evidence Packet):**
- Game is fully solvable; all 31 stored minimum par solutions pass execution validation without JS errors. This is execution evidence, not proof of human discoverability or usability.
- I did not conduct human playtesting on physical devices. Therefore, I treat human difficulty, fairness, and UI usability (e.g., disorientation) as hypotheses anchored in the actual board features and teaching demands, rather than proven facts. 
- Verified bugs are documented based on parent browser evidence and confirmed in the source code; I did not personally reproduce them dynamically.

## 2. Prioritized Findings

| Priority | Finding & Impact | Evidence (File:Line) | Specific Improvement |
| :--- | :--- | :--- | :--- |
| **1 (Logic Bug)** | **Hints endorse a broken route.** If a player places the correct solution pieces but *also* places an extra interfering piece, HINT declares success, leaving the player stuck with a failing route. | `src/main.js:834-845`. Line 834 correctly tests the route with `sim.trace` and exits if successful. However, if it fails, line 845 issues a success toast based solely on inventory matching (`!entry`), ignoring the failure. | Remove the false-success fallback at line 845. Since the trace already failed at 834, instruct the player to remove interfering pieces instead of endorsing the failed route. |
| **2 (Logic Bug)** | **Route inspector strands camera on underside.** When inspecting a beam that crosses from the underside back *above* the floor, the camera incorrectly remains flipped underneath. | `src/learning.js:42`. Uses `if (ev.z < 0) cell.side = 'below';`. Upward crossing intersections occur at `z = -0.5`, causing this check to force the camera below even when moving above. | Use the crossing event's explicit destination `side` property instead of inferring the camera face via `ev.z < 0`. |
| **3 (Design Issue)** | **Obsolete scoring rules in tutorials.** The level 4 intro explicitly discourages tilting by claiming it costs a star, contradicting current mechanics. | `src/levels.js:150` claims "a no-tilt solve is what earns the third star". The third campaign star is actually awarded for unassisted solves regardless of tilt. "FROM ABOVE" is a distinct badge. | Rewrite the intro to separate the unassisted third campaign star from the optional FROM ABOVE no-manual-tilt mastery badge. |
| **4 (Logic Bug)** | **Rotated FLOOR plates trigger useless hints.** Placing a correct FLOOR plate but with the alternative visual orientation causes the hint system to demand a rotation, wasting an assist. | `src/main.js:843` strictly compares `p.orient === e.orient`. However, `src/pieces.js:59-65` establishes that FLOOR orientations are behaviorally identical. | Implement an equivalence check for pieces that ignore orientation (like FLOOR) so hints guide players toward genuinely incorrect or missing routes. |
| **5 (Interaction Concern)** | **Stationary slower taps are dropped.** A player who taps an empty cell deliberately (between 300ms and 500ms) gets no placement action and no explanation. | `src/input.js:17, 281-288` enforces `held < cfg.tapMaxMs` (300ms). Inputs over 300ms on empty cells fail to trigger long-press (which targets pieces) and drop silently. | Accept stationary releases on empty cells over a more forgiving duration (e.g., 500ms) before treating them as dead gestures. |

*If no other issues are found, say so:* No other logical bugs were identified in the source files reviewed.

## 3. Level-by-Level Assessment

| Level | Mechanic / Teaching Role | Human Difficulty Hypothesis | Concrete Issue / Improvement |
| :--- | :--- | :--- | :--- |
| 1. FIRST BOUNCE | MIRROR placement and rotation | Low (Introductory) | Hint bug: Endorses route if extra pieces are added. |
| 2. AROUND THE CORNER | Single mirror placement on a larger path | Low | No particular issue found. |
| 3. DOUBLE TAKE | Two-mirror solution with three available | Low (Introduces par efficiency) | No particular issue found. |
| 4. OVER THE WALL | Overflight, beam height | Moderate | **Issue:** Intro teaches obsolete "no-tilt" star rule. |
| 5. UP THE STAIRS | WEDGE (bend and climb) | Low/Moderate | No particular issue found. |
| 6. BEND THEN CLIMB | WEDGE placement over terrain | Moderate | No particular issue found. |
| 7. LEVEL OFF | DIP (bend and drop) introduced | Moderate | No particular issue found. |
| 8. ON STILTS | Elevated routing | Moderate | Identifying missed targets in readouts could assist here. |
| 9. SECRET RAMP | Finding hidden fixed optics | Moderate (Requires observation) | No particular issue found. |
| 10. UNDER THE ARCH | Arch mechanic (beam below ground) | Moderate | No particular issue found. |
| 11. THROUGH THE WINDOW | Mid-air holes | Moderate | No particular issue found. |
| 12. TWO ORBS | Multi-target routing | Moderate | No particular issue found. |
| 13. SKIPPING STONE | FLOOR reflection | Moderate | **Issue:** Correct rotated FLOOR triggers useless hint. |
| 14. THE LOW ROAD | Routing under arches | Moderate | No particular issue found. |
| 15. THREAD THE NEEDLE | Precise height targeting | High (Complex z-routing) | No particular issue found. |
| 16. STONE BRIDGE | Elevated arches | Moderate | No particular issue found. |
| 17. THE SKIMMING STONE | Fixed FLOOR and bounce reflection | High | No particular issue found. |
| 18. SECRET STEPS | Hidden terrain, high par | High (Requires exploration) | No particular issue found. |
| 19. THE HIGH WINDOW | High routing | High | No particular issue found. |
| 20. HIGH ROAD LOW ROAD | Branching physical paths | High (High cognitive load) | No particular issue found. |
| 21. THE LONG WAY ROUND | Introduces darkness | Moderate | **Issue:** Intro is empty; needs explicit darkness tutorial. |
| 22. STONE SKIPPING | Two floor bounces | High | No particular issue found. |
| 23. SUMMIT | Culminating campaign puzzle | High | **Issue:** Lacks campaign-complete feedback before bonus. |
| 24. TWO WAYS | Splitter introduction | Low/Moderate | No particular issue found. |
| 25. THREE LIGHTS | Multi-branch splitter | Moderate | No particular issue found. |
| 26. RISING FORK | Splitter with elevation | Moderate | No particular issue found. |
| 27. PRISM BRIDGE | Window and split/climb/level routing | High | Recommend expanding chapter to include raised splitters. |
| 28. THROUGH THE BOARD | Crossing to underside | Moderate | No particular issue found. |
| 29. RETURN TO LIGHT | Round trip crossing | Moderate | **Issue:** Inspector strands camera below on upward cross. |
| 30. DEEP CURRENT | Underside pillars | Moderate | No particular issue found. |
| 31. PARALLEL WORLDS | Splitter crossing faces | High (Complex bi-facial routing) | No particular issue found. |

## 4. Gameplay-System Review

- **Touch & Camera Mechanics:** The codebase implements multi-touch input and unified 2D/3D transitions. While the pivot logic is mathematically designed to retain board centering, the 300ms stationary tap threshold (`cfg.tapMaxMs`) poses a documented interaction gap for deliberate empty-cell taps.
- **Placing, Rotating, & Moving:** Tap-to-place and hold-to-drag gestures are distinctly separated.
- **Feedback & Readouts:** Post-shot text currently describes height. Evolving this to identify specific missed receivers or unlit branches could reduce cognitive load on levels 4–8.
- **Goals & Stars:** Scoring logic successfully separates par completion from unassisted solves. The third campaign star evaluates unassisted solves regardless of tilt. "FROM ABOVE" is structurally distinct and correctly enforces unassisted, no-manual-tilt solves. However, the game's intro text conflates these rules.
- **Hint Quality:** The regional focus mechanic isolates assistance, but the strict deterministic array-matching implementation (`!entry` array matching and exact `orient` matching) directly causes the verified Priority 1 (broken route endorsement) and Priority 4 (FLOOR orientation) bugs.
- **Saves & Progression:** Immutable level IDs properly serialize state and isolate bonus chapters from the original campaign.
- **Discoverability:** All 31 levels are immediately selectable per design, permitting broad testing access.

## 5. Top 5 Next Actions (Ordered)

1. **Correct Hint Route Validation (Bug Fix):** In `src/main.js:845`, remove the false-success fallback. Since `sim.trace` already checked for a winning trace at line 834, line 845 should instruct the player to remove interfering pieces rather than endorsing a failing route.
2. **Correct Face Tracking in Inspector (Bug Fix):** Update `src/learning.js:42` to read the explicit destination `side` of crossing events, ensuring upward floor crossings correctly return the camera to the top face.
3. **Patch FLOOR Equivalence (Bug Fix):** Update `src/main.js` to assess behavioral equivalence for piece orientations, ensuring visually rotated but mechanically identical FLOOR plates do not consume hints.
4. **Scrub Obsolete Instructions (Design):** Update Level 4's intro text to clarify that the third campaign star tracks unassisted solves, while the FROM ABOVE badge demands no-tilt solves. Add an explicit text intro for Level 21's darkness mechanic.
5. **Adjust Touch Thresholds (Interaction):** Expand `tapMaxMs` in `src/input.js` to register stationary releases on empty cells up to 500ms, accommodating slower deliberate touch inputs.

