# Static-review adjudication — revision 2

The parent supplied actual Kimi, Gemini and Opus static reviews. None executed the code; their words “demonstrated” or “validated” describe source reasoning, not fresh test execution. Report provenance and model labels were retained in the parent's review folders. This document records checked conclusions and implemented changes.

| Finding | Verified scope and disposition |
|---|---|
| Practice exposes future Daily; mode leaks across games | Confirmed. Practice now uses a disjoint 182-board pool per game. Daily is capped at current Chicago date. Game entry resets Daily/mode; explicit practice resume exists. Browser regressions cover each behavior. |
| Save trust, wrong-board restore, malformed state and persisted HTML | Confirmed. Schema/board/edition-bound v2 envelopes and per-kind reconstruction reject malformed counters/data/history and unsupported terminal claims. All 3,640 boards exercise validation. Actual browser tests inject malformed/XSS state in all ten kinds and verify recovery without execution. V1 remains untouched. |
| Focus/live region and change-only sliders | Confirmed. Stable control focus is restored, the announcer is outside rerenders, and ranges retain their DOM node while updating continuously. Actual keyboard and in-drag pointer checks pass. |
| Generic labeled divs, hidden graph edges and unnamed piece shapes | Confirmed. Role-bearing board descriptions, graph adjacency text/node labels and explicit piece shapes/orientations are present. This is DOM evidence, not VoiceOver certification. |
| Candidate 06 already-solved start | Generator defect was real. Actual current Daily bank contains **zero** such boards. The new-generation guard and all-bank assertion cover Daily and practice; existing Daily bytes/identities were preserved. |
| Study rewrites honest wins/losses or ongoing state as a finish | Confirmed. Study is now a confirmed reveal independent of gameplay status; first actual result and its witness remain immutable. Ongoing assistance stays in progress. Actual unaided win and actual draft loss regressions preserve the result after study. |
| Candidate 10 empty-run/study/scrub/undo crash | Confirmed unsafe indexing in the old renderer. Run positions are clamped, empty runs use the initial pose, ephemeral scrub state resets on load/undo/study, and study no longer swaps game data. Browser reproduction remains renderable. |
| Post-terminal counters and reset-as-undo | Confirmed. Status guards and disabled controls prevent post-terminal runs/checks. Reset has its own counter; first-result metrics remain frozen. |
| 01/07 study shows only final board | Confirmed. The actual arrow trace and pulse coordinates are now shown, without fabricating completed gameplay. |
| 08 success erases path; no numeric target | Confirmed. Success remains on screen until Next target. Numeric landing/bullseye text and accessible description are present; sliders remain mounted. Study never inserts pretend shots. |
| 02 accidental anchor jumps and tiny controls | Confirmed. Strip squares are noninteractive. Explicit one-beat arrows have 44px minimum targets at tested phone widths; anchors and profile values are labeled. Bars no longer cap their height. |
| Piece lifting/orientation, cascade animation repeat, hidden phone metrics | Confirmed. Collision selection is rejected, placed orientation is retained on lift, spark state is ephemeral, and metrics remain visible. Dedicated regressions cover these paths. |
| Image `roundRect` failure | Confirmed compatibility concern. Rectangle fallback and error reporting exist; actual PNG download was tested with `roundRect` removed. |
| All 03 pars equal three | True, already documented. It is a fixed-size three-swap prototype, not a varying numerical difficulty metric. No unsupported deeper difficulty claim was added. |
| Six keys/pulses/program slots are invariant | Rule/size constraints, not correctness defects. Program slots are not labeled as move par. Human difficulty remains uncalibrated. |
| Default 08 shot sometimes hits / only 99 aiming choices | Intentional discrete aiming space, not a solvability defect. No minimum miss count, depth or six-month enjoyment claim is made. |
| Provenance/model-name mismatch | The implementation is MAKER-Codex; reviewer folders label the actual reviewing model. Their different roles are intentional, not an engine bug. |
| `top` classic-script collision / concatenation | The old delivered build already isolated source in an IIFE, as verified by executed Chrome flows. Revision 2 also gives app/state explicit module imports and removes those imports only in the documented local bundler. Bundle syntax and browser execution pass. |

No unsupported universal proof was accepted from a reviewer. Main collection/catalog edits, public deployment, physical-device certification and keeper decisions remain outside this isolated repair.
