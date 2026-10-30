# Sideways — sixth individual review, October 30, 2026

**Replacement candidate.** James said it is too easy and he is not a big fan. The updated UI and verified logic are preserved for comparison; no removal was requested. Tradeoff is next.

James correctly noticed that any three simultaneously correct columns force the fourth. Further enumeration found at least one pair of exact answers determines the entire arrangement on every board. [Depth findings and review decisions](ADJUDICATION.md). This is a structural limitation, separate from whether a player knows the answer words.

The review improved readability, blue/teal styling, current-versus-checked feedback, nudge disclosure, focus and spoiler-free sharing. Two nudge activation races were reproduced and corrected. Published content, exact scoring, last-checked feedback reuse, Undo counters, save/calendar IDs and all 32 daily games plus the bonus remain intact. No harder mode was added.

## Verification

- **863/863** catalog-scoped Node tests passed. After final review refinements, **84/84** targeted tests passed, comprising **60** Sideways tests and **24** original-game practice checks.
- **28/28** final Chromium/WebKit cases passed. They verify actual wrapping, follow/unfollow, keyboard/Undo focus, partial checked feedback expiry/reuse, movable correct columns, nudge confirmation/cancel/counters/reload, double activation, both saved-progress race timings, assisted and manual wins requiring explicit Check, real PNGs, frozen midnight identity, copy/cancel and revealed Practice separation. Exact count is in [summary](evidence/summary.json).
- **11/11** final offline lifecycle checks passed, including every daily game's cold offline boot and AI bonus play/restore.
- Unsigned iPhone Release compiled. All **278** runtime files match compiled app resources byte for byte. No device installation or physical/native image-sharing certification.
- Independent string enumeration: **215,040** orientations, one exact answer arrangement per board. The additional depth audit measures all one-, two- and three-clue subsets.

[Phone](evidence/phone.png), [desktop](evidence/desktop.png), [portrait result](evidence/result-portrait.png), [square result](evidence/result-square.png), [assisted result](evidence/assisted-portrait.png), [browser cases](evidence/browser-results.json).

Kimi/Gemini/Opus baseline fun predictions were **3/4/3** out of five. Their source reviews agreed on readability, check clarity and nudge costs. James's negative playtest verdict overrides those predictions. Human editorial fairness, physical keyboard/VoiceOver and real social recipient handoff remain unverified.

## Continue

Keep Sideways and Ringcount available as replacement candidates. Keepers are Switchpath, Counterpart, Shortlist and Second Sense, with no relative order supplied. Review Tradeoff next.

Branch: `codex/game-by-game-2026-10-29`. Final stage: `dist/sideways-review-20261030-final-v2/web`; build ID and hashes are in evidence. Reuse the existing `scripts/review-preview.mjs` PTY/profile; one window, at most two task tabs. The prior task-local WebKit runtime was reused without a download or global change.
