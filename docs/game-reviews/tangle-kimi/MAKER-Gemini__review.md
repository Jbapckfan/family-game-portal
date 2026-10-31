### Tangle (Kimi): Individual Game Review

---

### Actual Scope

Tangle is an untimed, 4×4 eight-neighbor word hunt (3+ letter words; cell reuse prohibited within a word). Word scoring scales by length (3–4 letters = 1 pt, 5 = 2, 6 = 3, 7 = 5, 8+ = 11). Wrong listed attempts incur misses; sub-3-letter and duplicate entries remain free. The puzzle features 430 fixed boards (`puzzles.json`) with medal targets set by `medalTargets(max)`: gold requires ~20% of maximum board points (clamped to 8–18 pts), which triggers daily completion stats while allowing post-gold hunting to continue indefinitely. 

A single free 2-letter prefix clue per round is provided for an unfound 4+ letter word. Daily state persistence and cross-tab concurrency are managed via `useDailySession('tangle')`, with a 12-word review policy (`reviewed-words.ts`) excluding explicit slurs/acronyms from October 30, 2026 onward while preserving legacy round scores through `restoreTangleProgress`.

---

### Provisional Predictions (1–5 Scale)
*(Provisional model predictions; NOT James ratings)*

* **Fun: 3.5 / 5** — The core eight-way untimed path discovery is satisfying and stress-free. However, enjoyment is curtailed by dictionary obscurity where standard vocabulary cannot hit the gold threshold on most boards.
* **Clarity: 3.5 / 5** — Rules, scoring, and progress tiers are immediately intelligible. Ambiguity arises in drag release behavior and unconfirmed hint consumption.
* **UI: 3.0 / 5** — Tactile 3D tiles and SVG polyline paths provide good structural bones. The visual palette uses olive green (`--identity: #527b35`) rather than preferred blue/teal tones, path order subscripts are tiny (`10px`), and releasing a drag outside the board lacks an intuitive abort state.
* **Replay: 4.0 / 5** — 430 distinct boards, daily streak tracking, practice mode, and open-ended post-gold completion provide longevity.
* **Sharing: 2.5 / 5** — Clean plain-text share block, but lacks calendar dates, omits clue assistance flags, provides no practice shares, and locks sharing behind gold achievement.

---

### Material Findings

#### 1. Vocabulary Accessibility & Gold Target Dependency
* **Source:** [`word-path-audit.json`](file:///private/tmp/MAKER-Gemini__tangle-review-20261030/output/tangle-review-20261030/word-path-audit.json#L20), [`progress.ts`](file:///private/tmp/MAKER-Gemini__tangle-review-20261030/packages/kimi-pebbles/src/games/tangle/progress.ts#L5-L8), [`reviewed-words.ts`](file:///private/tmp/MAKER-Gemini__tangle-review-20261030/packages/kimi-pebbles/src/games/tangle/reviewed-words.ts#L9-L27)
* **Finding:** Across all 430 boards (30,599 reviewed paths, 9,155 distinct accepted words), only **14 boards (3.3%)** can achieve gold using solely words found in the bundled common dictionary. On 416 boards (96.7%), players must find obscure, archaic, or technical jargon to reach gold. While the 12 reviewed exclusions cleanly filter offensive terms from Oct 30 forward without invalidating legacy saves, reaching the primary win state remains heavily dependent on esoteric word lists.

#### 2. Premature Best-Word Spoiler and Tone Risk in Win Modal
* **Source:** [`TangleWinModal.tsx`](file:///private/tmp/MAKER-Gemini__tangle-review-20261030/packages/kimi-pebbles/src/games/tangle/TangleWinModal.tsx#L62-L65), [`puzzles.json`](file:///private/tmp/MAKER-Gemini__tangle-review-20261030/packages/kimi-pebbles/src/games/tangle/data/puzzles.json#L1) (Puzzle #61)
* **Finding:** When gold is reached, `TangleWinModal` immediately reveals: `Today's hidden gem was {props.puzzle.best}. You can keep hunting after closing this.` This unconditionally spoils the highest-value unfound word while actively inviting further hunting. Furthermore, uncurated generator selections create tone risks: Puzzle #61 selects `"douche"` as the board's featured "hidden gem."

#### 3. Pointer Capture Lacks Cancel-Outside Guard on Drag-Release
* **Source:** [`TangleBoard.tsx`](file:///private/tmp/MAKER-Gemini__tangle-review-20261030/packages/kimi-pebbles/src/games/tangle/TangleBoard.tsx#L58-L68), [`TangleBoard.tsx`](file:///private/tmp/MAKER-Gemini__tangle-review-20261030/packages/kimi-pebbles/src/games/tangle/TangleBoard.tsx#L91-L98)
* **Finding:** In `TangleBoard.tsx`, pointer capture is locked to the container (`setPointerCapture`). In `handleUp`, if `moved.current` is true and `path.length >= 3`, `actions.submitPath()` fires regardless of release position. Dragging outside the board cannot be used to cancel an accidental drag; releasing anywhere submits the path and assesses a miss if invalid. Additionally, `handleDown` does not check `e.button === 0`, allowing secondary/right clicks to initiate selections.

#### 4. Share Contract Omits Assistance, Date, and Practice Modes
* **Source:** [`engine.ts`](file:///private/tmp/MAKER-Gemini__tangle-review-20261030/packages/kimi-pebbles/src/games/tangle/engine.ts#L52-L62), [`TangleWinModal.tsx`](file:///private/tmp/MAKER-Gemini__tangle-review-20261030/packages/kimi-pebbles/src/games/tangle/TangleWinModal.tsx#L67-L92), [`useTangle.ts`](file:///private/tmp/MAKER-Gemini__tangle-review-20261030/packages/kimi-pebbles/src/games/tangle/useTangle.ts#L244-L264)
* **Finding:** `buildTangleShare` formats only puzzle number, medal tier, points, and word totals. It omits the calendar date, contains no indicator when a clue prefix was used (`hintsUsed > 0`), provides no share mechanism for practice rounds, and prevents daily players from sharing an in-progress snapshot prior to reaching gold.

---

### Contract & Persistence Verification

* **Native Bridge:** [`copyText`](file:///private/tmp/MAKER-Gemini__tangle-review-20261030/packages/kimi-pebbles/src/games/shared/share.ts#L21-L33) accurately calls `nativeMessage` with `document.documentElement.dataset.gameId`; fallback correctly defaults to `navigator.clipboard`.
* **State Restores:** Confetti celebration (`fireConfetti`) strictly requires `goldReached && winShownOnce`. Because `startDaily` sets `winShownOnce: false` on mount/reload, restored gold games do **not** repeat confetti celebrations upon page load.

