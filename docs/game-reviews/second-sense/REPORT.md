# Second Sense — fifth individual review, October 30, 2026

Second Sense is ready in the reused preview window. Choose a noun definition and a verb definition, then type the single word that fits both. Five correct checks with no hints is perfect; wrong valid checks cost one but leave clues available. First-letter hints disclose their cost, and reveal stays separate from a win.

Definitions are larger, with blue/teal cues. Selecting both clues brings typing into view; successful checks return to the clue board. Fixed a reproduced cross-tab draft loss, accessible hint labels, stale error feedback and dialog focus. Added spoiler-free image sharing. Exact engine rules, scoring, published content, calendar/save identities and all 32 daily games plus the bonus are retained.

Kimi K3.1 Pro and Gemini 3.8 Flash High predicted baseline fun at 4/5; Opus 5.5 predicted 3.5/5. They agreed about hint safety, phone navigation and image sharing. Those are static predictions. Some definitions have plausible overlapping meanings; the exact-answer table does not prove editorial fairness. [Review decisions and open semantic questions](ADJUDICATION.md).

## Verification

- **860/860** catalog-scoped Node tests passed; **71** Second Sense tests cover engine/content, persistence, the two draft races, confirmed hints and sharing allowlists.
- **20/20** actual Chromium/WebKit browser checks passed: four widths, readable text/touch cells, free invalid spelling, counted wrong/correct checks, hints/cancel/reload, a real second-tab race with delayed storage events, keyboard retry, full perfect solve, reveal separation, actual portrait/square PNGs, midnight identity and mocked share cancellation/manual copy.
- **11/11** final offline lifecycle checks passed, including cold offline boot of all 32 daily games and playing/restoring the AI bonus.
- Unsigned iPhone Release compiled. All **277** runtime files match compiled app resources byte for byte. No physical install or native image-sharing claim.
- Content audit confirms **210** combinations from **75** recurring pairs. No claim of 1,050 new meanings or guaranteed six-month enjoyment.

[Evidence summary](evidence/summary.json), [browser cases](evidence/browser-results.json), [phone](evidence/phone.png), [desktop](evidence/desktop.png), [portrait result](evidence/result-portrait.png), [square result](evidence/result-square.png).

The initial collection run caught an outdated sync-fixture total after adding the fifth share module; it was corrected. The app fixture also needed multiple listeners to model the real DOM. Browser layout checks now reset independent boards and wait for fonts; delayed storage delivery is explicitly simulated while actual second-tab writes remain real. The incomplete global WebKit cache and stalled Node extraction were resolved using a CRC-verified official ZIP extracted into ignored task output; existing global files/settings were not replaced. The initial sandboxed native build could not execute Swift macros; the authorized compiler run passed. Source and generated-resource checks were rerun after fixes.

## Continue

Ask whether James would play Second Sense again and record his words without inventing a number. Sideways is next after his verdict. Switchpath, Counterpart and Shortlist are keepers without a supplied relative order; Ringcount remains available as a replacement candidate.

Use the existing `scripts/review-preview.mjs` PTY with `reload`, `game <slug>` and optional `sample <image>`; at most two task tabs. Preserve the readable-profile storage. Final stage: `dist/second-sense-review-20261030-final-v3/web`. Exact build ID, hashes and QA runtime provenance are in the evidence summary. Branch: `codex/game-by-game-2026-10-29`.
