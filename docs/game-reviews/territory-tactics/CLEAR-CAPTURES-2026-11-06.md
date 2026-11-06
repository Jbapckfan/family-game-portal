# Territory Tactics — clearer capture instructions

James: “the territory tactics is a little confusing even though I am getting past levels, can you put more clear instructions on that one”. Successful progress is self-reported; no keeper decision, numerical score or relative rank is inferred. The earlier UI style choice remains deferred.

Add a visible goal sentence, then an initially open, collapsible capture guide: find a connected amber group; identify all empty hexes sharing a side with it; fill the openings to remove the group. A separate before/after diagram shows a one-stone group with one opening and its removal after that opening is filled. The example is illustrative and does not expose the current puzzle’s route.

Explain that board edges are closed, existing blue stones help, a small capture may not meet the goal, and no opponent takes turns. Rename placements to “New stones used”. Revise the full rules and replace the misleading hint phrase “in time” with the actual two-placement budget. The guide’s collapsed state persists through moves within the visit. Puzzle logic and saved-state rules are unchanged.

Chrome and WebKit checked the guide, example, goal and full solve at 320, 393 and 1280 pixels; collapsing the guide stayed respected through placements. No horizontal overflow or page errors. The phone guide was visually inspected. The seven Territory core tests passed as part of the 15-test combined run. No physical-device certification or new external-model review is claimed.

Published privately from Site source `ae405e555392d1d528c9636257ea09f65f2bcafc`; deployment `appgdep_6aede49728d881919ba9847f0be3f91c` succeeded. The native web assets are copied and hash-checked; this does not install a new native binary.

Hosted release checks at 393 and 1280 pixels verified the exact app/CSS source hashes, visible updated UI, no horizontal overflow and no page errors. The offline worker intentionally pins an open offline edition until all collection tabs close; a simple refresh may retain that edition. Close and reopen the Alford Daily tabs to activate a downloaded update when necessary. No skip-waiting behavior or vocabulary migration rule was changed.
