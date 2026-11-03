# Lasers 3D — Independent Gameplay and Code Review

Reviewed game revision: `426a8fd` (HEAD: `8eac841`).

## 1. Scope of Review: Inspected vs. Inferred

**Actually Inspected:**
- Current code files for logic verification: `src/main.js` (hint system), `src/learning.js` (route inspector), `src/levels.js` (level configuration and text), `src/pieces.js` (FLOOR properties), `src/input.js` (touch thresholds).
- `CURRENT-RULES.md` and previously compiled reports/evidence logs.
- Extracted and verified specific lines of code that correspond to reported bugs.

**Inferred / Untested (Relied on Evidence Packet):**
- Game is fully solvable (all 31 minimum par solutions pass validation).
- 507 DOM checks and 68 WebKit checks pass.
- Browser captures, runtime event logs, and all visual aesthetics (shadows, cinematic rendering) are functioning as provided in the prompt's screenshots.
- Did not physically playtest on an iPad or verify VoiceOver usability, battery profiling, or human search-node difficulty. 

## 2. Prioritized Findings

| Priority | Finding & Impact | Evidence (File:Line) | Specific Improvement |
| :--- | :--- | :--- | :--- |
| **1 (Logic Bug)** | **Hints endorse a broken route.** If a player places all correct pieces but *also* places an extra interfering piece, HINT declares success, leaving the player stuck with a failing route. | `src/main.js:843-845` checks `!entry` (meaning all solution pieces are present) and immediately shows the "That is the answer" toast without running a simulation check. | Run an actual trace simulation before returning the success advice. If the trace fails, provide a hint to remove the interfering extra piece. |
| **2 (Logic Bug)** | **Route inspector strands camera on underside.** When inspecting a beam that crosses from the underside back *above* the floor, the camera incorrectly remains flipped underneath. | `src/learning.js:42` uses `if (ev.z < 0) cell.side = 'below';`. Upward crossing intersections occur at `z = -0.5`, causing this check to incorrectly force the camera to the underside. | Use the crossing event's explicit `side` destination property instead of inferring the camera face via `ev.z < 0`. |
| **3 (Logic Bug)** | **Rotated FLOOR plates trigger useless hints.** Placing a correct FLOOR plate but with a different visual orientation causes the hint system to demand a rotation, wasting an assist. | `src/main.js:843` strictly compares `p.orient === e.orient`. However, `src/pieces.js:59-65` establishes that both FLOOR orientations are behaviorally identical. | Implement an equivalence check for pieces that ignore orientation (like FLOOR) so hints guide players toward genuinely incorrect or missing routing. |
| **4 (Design Issue)** | **Obsolete scoring rules in tutorials.** The level 4 intro explicitly discourages tilting by claiming it costs a star, contradicting current mechanics. | `src/levels.js:150` ("a no-tilt solve is what earns the third star"). Current rules decoupled tilting from campaign stars entirely. | Rewrite the intro to encourage 3D exploration and identify "FROM ABOVE" as a separate, optional mastery badge. |
| **5 (Interaction Bug)** | **Stationary slower taps are dropped.** A player who taps an empty cell deliberately (between 300ms and 500ms) gets no placement action and no explanation. | `src/input.js:17, 281-288` enforces `held < cfg.tapMaxMs` (300ms). Inputs over 300ms on empty cells fail to trigger long-press (which targets pieces) and drop silently. | Accept stationary releases on empty cells over a more forgiving duration (e.g., 500ms) before treating them as dead gestures. |

## 3. Level-by-Level Assessment

| Level | Mechanic / Teaching Role | Difficulty & Fairness | Concrete Issue / Improvement |
| :--- | :--- | :--- | :--- |
| 1. FIRST BOUNCE | MIRROR placement and rotation | Fair, easy intro | Hint bug: Endorses route if extra pieces are added. |
| 2. AROUND THE CORNER | Multi-mirror routing | Fair, easy | No particular issue found. |
| 3. DOUBLE TAKE | Three mirrors (shortcuts) | Fair, introduces par | No particular issue found. |
| 4. OVER THE WALL | Overflight, heights | Fair challenge | **Issue:** Intro teaches obsolete "no-tilt" star rule. |
| 5. UP THE STAIRS | WEDGE (bend and climb) | Fair | No particular issue found. |
| 6. BEND THEN CLIMB | DIP (bend and drop) | Fair | No particular issue found. |
| 7. LEVEL OFF | Height manipulation combo | Fair, cognitive load rises | No particular issue found. |
| 8. ON STILTS | Elevated routing | Fair | Identifying missed targets in readouts could assist here. |
| 9. SECRET RAMP | Finding hidden fixed optics | Fair, rewards observation | No particular issue found. |
| 10. UNDER THE ARCH | Arch mechanic (ground level) | Fair, good use of 3D | No particular issue found. |
| 11. THROUGH THE WINDOW | Mid-air holes | Fair | No particular issue found. |
| 12. TWO ORBS | Multi-target routing | Fair | No particular issue found. |
| 13. SKIPPING STONE | FLOOR reflection | Fair | **Issue:** Correct rotated FLOOR triggers useless hint. |
| 14. THE LOW ROAD | Routing under arches | Fair | No particular issue found. |
| 15. THREAD THE NEEDLE | Precise height targeting | Fair, high complexity | No particular issue found. |
| 16. STONE BRIDGE | Elevated arches | Fair | No particular issue found. |
| 17. THE SKIMMING STONE | FLOOR and arches combined | Fair, higher difficulty | No particular issue found. |
| 18. SECRET STEPS | Hidden terrain, high par | Fair, requires exploration | No particular issue found. |
| 19. THE HIGH WINDOW | High routing | Fair | No particular issue found. |
| 20. HIGH ROAD LOW ROAD | Branching physical paths | Fair, heavy cognitive load | No particular issue found. |
| 21. THE LONG WAY ROUND | Introduces darkness | Fair | **Issue:** Intro is empty; needs explicit darkness tutorial. |
| 22. STONE SKIPPING | Darkness + arches | Fair | No particular issue found. |
| 23. SUMMIT | Culminating campaign puzzle | Fair | **Issue:** Lacks campaign-complete feedback before bonus. |
| 24. TWO WAYS | Splitter introduction | Fair, straightforward | No particular issue found. |
| 25. THREE LIGHTS | Multi-branch splitter | Fair | No particular issue found. |
| 26. RISING FORK | Splitter with elevation | Fair | No particular issue found. |
| 27. PRISM BRIDGE | Splitters over gaps | Fair | Recommend future levels with raised splitters. |
| 28. THROUGH THE BOARD | Crossing to underside | Fair, clear intro | No particular issue found. |
| 29. RETURN TO LIGHT | Round trip crossing | Fair | **Issue:** Inspector strands camera below on the way back up. |
| 30. DEEP CURRENT | Underside pillars | Fair | No particular issue found. |
| 31. PARALLEL WORLDS | Splitter crossing faces | Fair, highly complex | No particular issue found. |

## 4. Gameplay-System Review

- **Touch & Camera Mechanics:** The robust 2D/3D camera transitions and multi-touch controls successfully center the pivot without disorientation. The flip mechanism for Both Sides is elegant and cleanly preserves occlusion. However, the 300ms hard cutoff on stationary taps creates an accidental dead zone for deliberate players. 
- **Placing, Rotating, & Moving:** Direct and clear. Hold-to-drag works flawlessly on pieces. 
- **Feedback & Readouts:** Post-shot text is critical for 3D spatial awareness. To improve levels 4–8, the readout could specifically identify missed receivers or unlit splitter branches rather than just the final height. 
- **Goals & Stars:** Unlocking all 31 levels explicitly supports testing. Removing the "no-tilt" star in favor of the unassisted "FROM ABOVE" badge is a substantial fairness upgrade—the legacy text in Level 4 simply needs to catch up. 
- **Hint Quality:** The regional focus mechanic is fair, but the strict deterministic array-matching implementation is severely brittle, directly causing the Priority 1 (broken route endorsement) and Priority 3 (FLOOR orientation) bugs. 
- **Saves & Progression:** Immutable level IDs ensure high resilience, properly isolating campaign progress from bonus chapter experiments.

## 5. Top 5 Next Actions (Ordered)

1. **Fix Route Endorsement Bug (Bug Fix):** Refactor `src/main.js` hint generation to execute an engine trace against the current board state to prevent false success toasts when extraneous blocks are placed.
2. **Correct Face Tracking in Inspector (Bug Fix):** Update `src/learning.js` to read the explicit destination `side` of crossing events, properly returning the camera to the upper face when the beam routes back up.
3. **Patch FLOOR Equivalence (Bug Fix):** Update `src/main.js` to consider behavioral equivalence for piece matching, ensuring visually rotated but mechanically identical FLOOR plates do not waste user hints.
4. **Scrub Obsolete Instructions (Design):** Update Level 4's intro to correctly identify "FROM ABOVE" as optional mastery, and write a functional tutorial for Level 21 to formally introduce the darkness mechanic. 
5. **Adjust Touch Thresholds (Interaction):** Expand `tapMaxMs` in `src/input.js` to register stationary releases on empty cells up to 500ms, recovering slower but deliberate taps.
