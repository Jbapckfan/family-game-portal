# Lasers 3D — gameplay and all-level review

Reviewed game revision: `426a8fd`, September 16, 2026. Review only; no game changes were made.

**Claude completed a source and evidence review covering all 31 levels. Kimi did not run:** its local OAuth CLI returned HTTP 403 because the account had exhausted its monthly usage. There is no Kimi opinion or two-model consensus to report. Its prompt and quota error are saved for a later retry.

The game has a sound solvability baseline: every level and minimum par passes the validator, and every stored solution wins in the running WebKit game. The strongest immediate improvements are trustworthy hints, correct instructions and a route inspector that follows the right board face. The new chapters provide a useful introduction to splitters and underside routing; extending their variety is a design opportunity, rather than evidence that the existing puzzles are broken.

- [Claude's full review, including one row for each of the 31 levels](2026-09-16-lasers-gameplay-claude.md). This is the unedited model output; the qualifications below take precedence over its overstatements.
- [Actual game gallery: all 31 initial and solved views](../../output/laser-review-2026-09-16/gallery.html).
- [Detailed verified reproductions](../../output/laser-review-2026-09-16/verified-findings.md).

## Findings verified after the review

| Priority | Finding and player impact | Evidence | Recommended change |
|---|---|---|---|
| 1 — fix first | **Hints can endorse a broken route.** When every stored solution piece is present, an extra legal piece may still intercept the beam. HINT then says “That is the answer. Press FIRE!” despite a failed route. | `src/main.js:843–845`; reproduced in the WebKit UI on FIRST BOUNCE. Legal failing fixtures exist on 22 campaign levels: 1–16 and 18–23. [Reproduction data](../../output/laser-review-2026-09-16/confirmed-probes.json), [screenshot](../../output/laser-review-2026-09-16/screenshots/hint-extra-piece-bug.png). | Require a successful trace before giving success advice. Otherwise diagnose an interfering extra and provide a removal hint, preserving the free/regional versus exact/assisted hint distinction. |
| 2 | **The route inspector follows an upward floor crossing on the wrong face.** In RETURN TO LIGHT, the crossing back above leaves the camera below. | `src/learning.js:40–42`; actual VIEW → Next event 19 has destination `above` but active face `below`. Both directions have internal `z = -0.5`, which the inspector incorrectly treats as a side. [Probe](../../output/laser-review-2026-09-16/confirmed-probes.json). | Use the event's explicit `side`. Describe “through the opening to Above/Below” rather than fractional row numbers and internal height `-0.5`. |
| 3 | **The first height lesson teaches an obsolete scoring rule.** OVER THE WALL says a no-tilt solve earns the third star, discouraging the camera controls the player should learn. | `src/levels.js:150` still has that sentence. Current scoring at `src/main.js:83–85` awards the third star for an unassisted solve; no-tilt is a separate mastery badge. | Rewrite the intro to encourage exploration and identify FROM ABOVE as optional mastery. Audit the other authored intros for promises the readout no longer matches. |
| 4 | **A correct FLOOR plate can attract a useless rotation hint.** Rotating a FLOOR changes no beam rule, but hint matching treats the orientation as incorrect. | `src/main.js:843`, `src/pieces.js:59–65`. On level 13, two correct pieces with the FLOOR visually rotated cause the third hint to demand rotating that plate, instead of placing the missing DIP. The full route with the rotated plate wins. [WebKit probe](../../output/laser-review-2026-09-16/followup-probes.json). | Compare behavioral equivalence for FLOOR pieces; guide the player to the genuinely missing part of the route. |
| 5 — interaction improvement | **Stationary slower taps do nothing.** A player can press an empty square without moving and get no placement or explanation. | `src/input.js:17,281–288` accepts releases only below 300 ms. In browser Pointer Events, a 450 ms press placed nothing; a subsequent 80 ms press at the same location placed the mirror. [Probe](../../output/laser-review-2026-09-16/followup-probes.json). | Accept a stationary release on an empty cell over a more forgiving duration. Retain movement thresholds and the existing long-press-to-move behavior on pieces. Validate with real touch play. |

The first four are concrete correctness/communication defects. The fifth is a confirmed input behavior whose usability impact needs a human touch session; the present cutoff is intentional code, not an intermittent device failure.

## Level design and feedback recommendations

1. **Introduce darkness explicitly on level 21.** Its intro is empty. A short playable explanation can show that firing reveals cells and that discovery survives RESET. It simultaneously introduces darkness, a 24×24 board and a five-piece solution. Reconsider its position after observing players, rather than treating solver search counts as a difficulty score.
2. **Add variety after the new chapter tutorials.** Levels 24–27 reuse a compact split-route layout; levels 28–31 introduce increasingly involved crossings on a compact board. Preserve those teaching levels and add later puzzles featuring a raised splitter, crossing branches, a more intricate round trip, or an underside arch/FLOOR. Keep the user's one opaque shared-floor design and real holes.
3. **Explain missed optics and failed branches.** The engine already records overflight/underpass events. Translate them into useful readouts such as which mirror the beam passed above, and identify which branch or receiver remains unresolved. Always-present meaningful height information could make levels 4–8 easier to reason about.
4. **Give the campaign a finish and the bonus chapters an entrance.** Solving SUMMIT currently advances directly into TWO WAYS. Add a brief campaign-complete moment and clearly label the optional chapters. Store/show FROM ABOVE badges in the level picker if they are intended to motivate repeat play.
5. **Improve orientation cues on the underside.** Keep the actual flipped camera. Small orientation cues and named face transitions would help relate the two views while retaining the opaque floor and proper occlusion.

These are design recommendations, not proof that people find the current levels unfair or uninteresting. Every level has a valid proven solution. Claude's per-level table provides teaching-role and pacing hypotheses to take into a playtest.

## Important qualifications to Claude's raw review

- **RESET and assistance:** resetting currently starts a fresh attempt, including clearing `hintUsed`. That permits solving from memory after seeing an answer. The behavior is real, but calling it a scoring bug assumes assistance must persist across attempts; that policy has not been established. Do not add a permanent per-level penalty without deciding how a player can subsequently earn unassisted credit.
- **Free second hint:** focusing/pulsing a solution cell is the current free regional hint implementation. Making it a wider region is a reasonable balancing option. Charging for it would change the current hint contract, rather than repair a proven regression.
- **FLOOR scope:** the rotated-plate hint defect is reproduced on level 13. Claude also named 17 and 22, but neither authored solution places a FLOOR, so those levels do not demonstrate that particular hint comparison problem.
- **Dark live preview:** the level 21 capture does show an unfired beam revealing its path at DARK 0%. This is evidence of information exposure through the live route, not proof that darkness is wholly cosmetic. Live retracing is an existing gameplay rule. Clipping it at unknown cells is a product choice that should retain useful feedback for known terrain and player edits.
- **Difficulty estimates:** search-node counts are an algorithm's workload. They do not establish human difficulty, and they alone do not justify swapping levels 21 and 22. Likewise, the claim that level 10 is the first phone board requiring pan is not supported: the validator's 393px calculation reports initial zoom for all 23 campaign boards.
- **Underside geometry:** the bonus top faces are not literally blank; they contain raised terrain. Expanding later puzzles need not enlarge or replace the current teaching boards. Tray-equals-par makes the par award automatic when solved, which may be acceptable for tutorials.

## What actually ran

- Local `ask-claude`, exit 0: full 31-level source/evidence review. Claude read the shared evidence, including the hint bug capture. It did not independently run tests or drive a browser: its own diagnostic shell actions were denied. Its report explicitly states those limits.
- Local `ask-kimi`, exit 1: monthly-quota HTTP 403; no review produced. No alternative paid provider was used. [Saved error](../../output/laser-review-2026-09-16/kimi-review.md).
- `node validate-levels.mjs`, exit 0: all 31 solutions, minimum par proofs and chapter-specific invariants. [Log](../../output/laser-review-2026-09-16/validation.log).
- Isolated WebKit runtime capture, exit 0: all 31 levels loaded; empty boards fired; stored solutions injected and fired; every level reached `won` with all receivers lit; zero JavaScript errors. 66 level screenshots plus one bug screenshot. [Runtime data](../../output/laser-review-2026-09-16/runtime.json).
- Two targeted browser probes, exit 0: false hint success, wrong crossing face, FLOOR hint equivalence and slow-touch behavior. The captures use synthetic Pointer Events and a fresh context, preserving the user's actual saves.

Automated stored-solution runs establish execution coverage, not that a human can discover each solution. Physical iPad play, blind puzzle solves, VoiceOver playability, listening checks and sustained performance remain untested here. Game code, earned progress and the installed app were unchanged. Kimi remains outstanding until its account can run requests.
