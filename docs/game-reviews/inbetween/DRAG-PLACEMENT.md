# Inbetween drag-and-drop — October 30, 2026

James's verdict: **6/10, keep it; could have harder clues.** The ranking records that score on a ten-point scale, without inventing an order among keepers. This update delivers his requested drag-and-drop placement visuals. Harder clues remain an editorial tuning follow-up; published puzzles are unchanged.

Pairs now lift as joined blue/teal tiles. Hovering a legal gap opens a neutral six-letter word preview with a magnetic halo. Dropping snaps into a free preview; **Place pair** remains the explicit scored confirmation. Accepted fits settle their letters and produce a short ripple/particle flourish centered on the inserted pair. A prior preview dims while another location is hovered. Mouse and touch use different floating-tile positions to keep the preview visible. Reduced motion keeps usable static feedback.

Mouse dragging works in Chromium and WebKit. Chromium's native emulated touch input verifies free preview, touch confirmation and phone edge scrolling. Both directions of mouse edge scrolling work in both browser engines. The sticky phone bank's upper zone follows its visible lower edge, so lifting a pair inside it does not scroll accidentally. Normal tap, keyboard and scored nudge controls remain available.

Release outside, Escape, pointer cancellation/lost capture, modal/navigation changes and external progress cancel safely. A cancelled gesture restores its previous selection and paid advice only while the same game revision remains current; it cannot overwrite newer game progress. Cancelled drag focus returns to a usable pair. A rejected placement disables confirmation until a changed preview, preventing accidental duplicate charges; focus returns to its gap.

The dedicated controller owns pointer/ghost/hover/scroll state and never calls scoring or storage. All hover destinations receive the same treatment, including nonsense. Correctness is checked only by the existing engine on explicit confirmation, after the normal stale-save boundary. Engine rules, bank, IDs, save schema, daily/practice rotation, native text sharing and spoiler-free result images remain intact. All 32 daily games and the nine-board bonus are included.

Verification on the final runtime:

- **899 catalog tests** passed; an overlapping **93-test focused suite** passed. Ten controller tests cover gestures, cancellation, prior-choice restoration, used pairs, sessions, click suppression, reduced motion and sticky-bank scrolling. App regressions cover rejected-confirmation deduplication and the existing scoring/save/hint boundaries.
- **19 drag browser checks** passed, plus **26 existing tap/keyboard/hint/save/share checks**, in Chromium and WebKit. They include actual drag-and-confirm perfect wins, wrong fits, no correctness leaks, paid-advice cancellation/reload, incoming terminal progress, reduced motion and scrolling. Chromium native emulated touch is distinct from a physical-device test.
- **11 offline checks** passed, including all daily pages and the human/AI bonus turn/restore.
- Unsigned iPhone Release build succeeded. All **281 compiled game runtime files** exactly match synchronized source; structural checks passed. No native XCTest or physical-phone interaction is claimed.
- Final web stage: `dist/inbetween-drag-20261030-final-v2/web`, build ID `4a11ed6b7792b7c6`, **315 files**, verified against its asset manifest.
- Actual hover and confirmed-placement frames were visually inspected. The single owned preview was reopened with full motion in the same saved profile, and a free drag preview was demonstrated and cancelled. A fresh Practice board remains open; no demo placement or fabricated score was submitted to James's completed daily.

Kimi, Gemini and Opus reviewed the scoped source; Kimi/Gemini also received gameplay screenshots. They did not execute the game. Concrete review findings were reproduced and corrected, with final automated/browser checks afterward. See [DRAG-ADJUDICATION.md](DRAG-ADJUDICATION.md) and [drag-evidence/summary.json](drag-evidence/summary.json).

Physical iPhone ergonomics, capacitive jitter, haptics and long sessions remain unverified. The existing literal simultaneous-terminal-write limitation remains documented. No paid API, dependency installation, social posting or public deployment occurred.
