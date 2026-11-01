# Focused v2 follow-up — compatible repair 2.1

Opus supplied a static follow-up. It ran nothing. The implementation agent then reproduced the eight findings in eleven isolated headless Chrome groups. Every group failed against the original v2 runtime and passed against the repaired runtime; baseline and repaired JSON evidence are retained. A duplicate editable test fixture discovered during the first repaired run was corrected in the test harness; it was not a production failure.

| Finding | Narrow repair and executed evidence |
|---|---|
| Result card disagrees with recorded first result after study/replay | The card now renders the validated `firstOutcome`, and the current board/replay is separately labeled. Candidate 06 solve→Undo→Study→re-finish retains “Solved, then studied” and first metrics. A real Candidate 09 loss→Undo→winning replay still displays “Rival won” as the recorded result, beside the winning replay. |
| Shortcuts intercept modified/IME/editable keystrokes | Ctrl, Meta, Alt, `isComposing`, legacy IME key code 229, editable elements and editable descendants return before shortcut processing. Tests verify no prevention, selected-command change or state change. |
| Disabled/replaced controls lose focus | Per-kind enabled-control fallbacks cover drafts, launch/next, wave bounds, operations, and other boards. Exhausted Undo falls back to Reset, then all kinds have a title/recorded-result fallback. Actual keyboard activation tests cover each reported path. |
| Daily practice entry destroys the selected resume pointer | Opening practice from Daily uses the explicit last-selected mix; only Next practice mix advances. The mix-6→Daily→Open-practice reproduction retains mix 6. Entering a practice board does not automatically rewrite its envelope. |
| Unchanged date sync replaces the focused banner | Date checks reuse the existing Open today button. A focused button remains the same connected node across the 30-second interval. |
| Recovery silently overwrites unreadable/render-failure data | Opening keeps the original record. Before any later recovery write, an exact quarantine record with source key/raw data/reason is written and read back. Backup failure blocks the primary write. Separate tests cover unreadable practice, simulated quota failure, and a one-time render error followed by slider input after a first win. The original result is present in the recovery copy. |
| Practice PNG uses the Daily index | The filename uses `practiceIndex`. A download from the exhausted-Daily screen, after advancing to practice 3, is named practice-3. |
| Detail panels collapse or summary focus moves to the wrong panel | Stable panel/summary IDs and a per-view open-state cache preserve independent graph/notes panels. Swapping graph nodes retains both open states and the exact focused prototype summary. |

The engine, state validator/restorer, styles and both puzzle banks are byte-identical to the prior v2 freeze. `evidence/MAKER-Codex__v2-save-compatibility.json` records those hashes. The schema and `MAKER-Codex-candidates:v2` namespace did not change; no migration or progress reset is introduced. The source delta is `evidence/MAKER-Codex__focused-repair.patch`.

The follow-up's hypotheses about Daily/practice disjointness, the persistent announcer and Candidate 06 solved starts were already covered by actual bank/DOM checks and remain covered. They were not reimplemented or presented as new defects. Future puzzle data remain readable in the offline source; the UI date gate is not an anti-cheat guarantee.

All prior Node, pointer, packing and review regressions were rerun. Exact counts are in the final metadata. Tests use private headless contexts; the visible gallery and user saves were not opened or refreshed by this subagent. The root agent owns the notified refresh. No main collection files, device installation, public deployment or keeper decision is implied.
