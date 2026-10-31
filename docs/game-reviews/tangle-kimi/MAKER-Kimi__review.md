## Tangle review — Kimi

**Actual scope:** Reviewed the supplied Tangle/shared source, CSS, two 390px previews, and path-audit data. I did not execute or play the game, inspect the full puzzle bank, use external files, or write anything. The reported 172-test baseline and author-run keyboard-path Daily gold are context, not verification by me.

**Provisional predictions — not James’s ratings**

- Fun: **3/5**
- Clarity: **3/5**
- UI: **3/5**
- Replay: **3/5**
- Sharing: **2/5**

### Material findings

1. **Drag release and non-primary input can cause unintended submissions.** Every pointer-down is accepted, including secondary buttons and additional touches; no primary pointer ID is tracked. More importantly, pointer capture means releasing outside the grid still calls `handleUp`, which submits any moved 3+ letter path without checking release position. An invalid word therefore costs a miss even when the player drags away to cancel. Cancellation preserves the preview, but release-outside does not.  
   Source: `packages/kimi-pebbles/src/games/tangle/TangleBoard.tsx:58-103`, `:214-222`.

2. **Assistive-technology activation is not equivalent to the verified keyboard path.** Tiles handle Enter/Space through `onKeyDown`, but have no standard `onClick`; screen-reader-generated button clicks may therefore do nothing. The one free clue is also consumed immediately without confirmation. These are interaction/accessibility risks, not evidence that the author’s keyboard run failed.  
   Source: `packages/kimi-pebbles/src/games/tangle/TangleBoard.tsx:248-269`, `:279-284`; `packages/kimi-pebbles/src/games/tangle/useTangle.ts:244-263`.

3. **Content volume is strong, but approachable difficulty remains the largest six-month risk.** The audit supports 430 distinct grids, all accepted paths reachable, 28–80 words per board, and enough structural content for well beyond six months. However, only **14/430** boards reach gold using points from the bundled common list. That list is incomplete and cannot establish actual difficulty, but the result warrants editorial concern about obscure required finds rather than a claim that puzzles are impossible or unreviewed. A single two-letter clue offers limited relief.  
   Source: `output/tangle-review-20261030/word-path-audit.json:2-22`; `packages/kimi-pebbles/src/games/tangle/useTangle.ts:251-263`.

4. **The gold modal can spoil ongoing play and has a demonstrated tone problem.** It always names `puzzle.best`, even when unfound, despite inviting continued hunting. The supplied gold preview displays **DOUCHE** as both best find and “hidden gem,” making the repetition and potentially jarring tone concrete rather than hypothetical.  
   Source: `packages/kimi-pebbles/src/games/tangle/TangleWinModal.tsx:24-29`, `:62-65`; `output/tangle-review-20261030/before-gold.png`.

5. **Sharing exists, including the native bridge, but does not yet provide an honest complete result.** Native sharing is genuinely attempted through `copyText`; this is not a missing-native claim. Current text contains only puzzle number, medal, score/max, and found/total. It lacks date, misses, clue assistance, ongoing/continuing status, practice sharing, and image sharing; sharing is exposed only after gold. The UI also announces “Copied!” after native handoff or regardless of fallback success, so that confirmation is not reliable.  
   Source: `packages/kimi-pebbles/src/games/tangle/engine.ts:52-62`; `packages/kimi-pebbles/src/games/tangle/TangleWinModal.tsx:26-35`, `:67-91`; `packages/kimi-pebbles/src/games/shared/share.ts:21-32`.

**UI and logic check:** The previews show readable grid letters, clear ordered paths, and a distinct end tile, but found words are only 11px, the green/brown treatment misses the stated blue/teal preference, and the score/max meter leaves gold visually near 20% rather than presenting gold as the primary goal (`index.css:150-162`; `TangleBoard.tsx:153-175`). Source does support guarded actions/persistence, score reconstruction on restore, valid legacy-edition preservation, and no automatic restored-gold celebration because reload resets `winShownOnce` to false (`useTangle.ts:87-109`, `:290-293`; `progress.ts:33-45`; `engine.ts:19-26`).
