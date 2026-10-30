### Scope Disclosure

- **Target**: Cairn in `packages/kimi-pebbles/src/games/cairn/` and scoped styles in `packages/kimi-pebbles/src/index.css`.
- **Inputs Examined**: Static source review of all 11 Cairn modules (`CairnPage.tsx`, `CairnTower.tsx`, `GameBoard.tsx`, `HelpModal.tsx`, `StatsModal.tsx`, `WinModal.tsx`, `puzzles.json`, `engine.ts`, `progress.ts`, `storage.ts`, `useGame.ts`), shared integration contracts (`dict.ts`, `integration.ts`, `share.ts`, `useDailySession.ts`, `useGameOverlays.ts`), `anagram-audit.json`, and direct visual inspection of all three supplied render captures (`before-1440.png`, `before-390.png`, `before-perfect.png`).
- **Boundaries**: Strictly confined to `/private/tmp/MAKER-Gemini__cairn-review-20261030`. No code execution, no workspace writes, no network/web access, no external files, and no agent delegation. Static source inspection is not playing. Kimi authorship is preserved.

---

### Provisional Predictions (Scale 1–5)

*Note: These are provisional model predictions derived from static source and visual inspection, NOT James ratings.*

- **Fun — 4/5**: The 3-to-7 letter multiset ladder offers an intrinsically satisfying incremental climb. The anagram audit confirms robust design: 91% of level instances (3,818 / 4,195) have multiple valid dictionary anagrams (up to 14), with every instance supported by bundled common-list vocabulary, ensuring valid player choices never strand subsequent racks.
- **Clarity — 3/5**: Core mechanics are simple, but cognitive clarity suffers during play: the previous accepted word is hidden, the added letter badge is lost once placed, and dictionary rejection lacks semantic explanation.
- **UI — 2.5/5**: While the board layout is clean, the baseline result screen is marred by jarring brown and purple stones, a cartoonish flagpole, swaying animations, and an oversized emoji block that clashes with Alford Daily's restrained editorial design.
- **Replay — 4/5**: Strong daily retention structure with 839 unique signature chains, deterministic daily rotation, streak tracking, and an isolated Practice generator that excludes upcoming dailies without contaminating stats.
- **Sharing — 2/5**: Current sharing leaks full word solutions and per-level status patterns, omits puzzle dates, fails silently on clipboard fallbacks, lacks Practice mode sharing, and bypasses native iOS sharing bridges.

---

### Concrete Material Findings & Improvements

#### 1. Redesign Summit Presentation & Remove Cartoon Assets
- **Finding**: [CairnTower.tsx](file:///private/tmp/MAKER-Gemini__cairn-review-20261030/packages/kimi-pebbles/src/games/cairn/CairnTower.tsx#L4-L17) employs brown (`#9a8762`), mauve (`#927b73`), and slate-purple (`#7b7d94`) tones, crowned by an orange cartoon flag (`anim-flag`) and a continuous sway animation (`anim-sway`). Additionally, [CairnPage.tsx](file:///private/tmp/MAKER-Gemini__cairn-review-20261030/packages/kimi-pebbles/src/games/cairn/CairnPage.tsx#L30-L33) triggers `fireConfetti()` unconditionally upon completion.
- **Fix**: Replace the stone palette with a cohesive tonal blue/teal gradient matching `--identity: #39766f`. Remove the SVG flagpole, remove `anim-sway`, eliminate the oversized emoji block from [WinModal.tsx](file:///private/tmp/MAKER-Gemini__cairn-review-20261030/packages/kimi-pebbles/src/games/cairn/WinModal.tsx#L87-L89), and remove confetti in favor of a quiet, coded geometric cairn mark.

#### 2. Implement Destructive Action Guards (Give Up & Hint)
- **Finding**: In [useGame.ts](file:///private/tmp/MAKER-Gemini__cairn-review-20261030/packages/kimi-pebbles/src/games/cairn/useGame.ts#L410-L447), tapping `Give up` immediately skips the level, breaks the summit streak, and voids completion without confirmation. Tapping `Hint` immediately burns an assistance point and permanently disqualifies a Perfect run. On touch screens, both buttons sit in close proximity to standard input controls.
- **Fix**: Add two-step inline or dialog confirmation for both Hint and Give Up to prevent accidental taps while highlighting the consequences on streaks and flawless status.

#### 3. Display Previous Accepted Word & Stabilize Added-Letter Scaffolding
- **Finding**: [GameBoard.tsx](file:///private/tmp/MAKER-Gemini__cairn-review-20261030/packages/kimi-pebbles/src/games/cairn/GameBoard.tsx#L97-L105) does not display the word completed in the previous tier, forcing players to recall their previous multiset from memory. Furthermore, rack shuffling in [useGame.ts](file:///private/tmp/MAKER-Gemini__cairn-review-20261030/packages/kimi-pebbles/src/games/cairn/useGame.ts#L366-L371) uses `findIndex`, which misassigns the new-letter highlight when duplicate letters exist.
- **Fix**: Surface the previous accepted word above the current rack (e.g. `Built: CAR → +H`) and track the added letter identity by exact multiset index rather than character matching. On 320px viewports, scale 7-letter slot/rack widths to prevent awkward wrapping.

#### 4. Social Sharing Overhaul & Native Bridge Integration
- **Finding**: [WinModal.tsx](file:///private/tmp/MAKER-Gemini__cairn-review-20261030/packages/kimi-pebbles/src/games/cairn/WinModal.tsx#L43-L56) implements clipboard copying inline instead of using `copyText` / `nativeMessage`, falsely flashes "Copied!" if `execCommand` fails, omits puzzle dates, and provides no share action for Practice rounds. The shared text leaks level-by-level status emojis.
- **Fix**: Route sharing through the native iOS bridge (`nativeMessage({ type: 'share' })`) with verified clipboard fallback. Include the date (`CAIRN No. X · [Date]`) and support Practice shares. Replace spoiler-prone word lists and per-level emoji rows with aggregate abstract metrics: 5 stone stack, counts of solved/assisted/skipped, total misses, and honest summit titles ("Stack finished" when any level was skipped; never claiming skipped levels as solved).

#### 5. Freeze Session Identity Across Midnight Rollover
- **Finding**: [useGame.ts](file:///private/tmp/MAKER-Gemini__cairn-review-20261030/packages/kimi-pebbles/src/games/cairn/useGame.ts#L203-L217) runs a 30-second interval timer that calls `startDaily()` whenever `dayNumber !== todayDayNumber()`. If midnight passes while a player is actively on level 3 or 4, their active board state is discarded.
- **Fix**: Freeze session identity during active gameplay: defer rollover until the current game is finished or explicitly abandoned.

---

### Implementation Plan Artifact

A detailed design document and verification roadmap has been created:
- [cairn_implementation_plan.md](file:///Users/jamesalford/.gemini/antigravity-cli/brain/354fe7b8-fb7f-47f4-ba2c-daf5ebe59b7d/cairn_implementation_plan.md)

Please review the plan and approve to proceed with execution.

