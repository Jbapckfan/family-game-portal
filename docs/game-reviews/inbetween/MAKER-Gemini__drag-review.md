### Scope & Context
Read-only inspection of this isolated checkout (`games/inbetween/`, `placement-drag.mjs`, `styles.css`, Playwright tests, and rendered Chromium/WebKit screenshots in `output/`). No commands were executed, and no files were modified or written. Disclosing scope: inline Opus tools are disabled and receives source text without images; this review inspected source logic and rendered browser artifacts directly. James’s verdict (6/10, KEEP IT; harder clues as editorial bank tuning) is respected with no rescoring.

---

### Critical & Important Bugs

#### 1. Ephemeral drag cancellation permanently wipes paid hint state
* **Trigger:** Purchase a scored nudge (`takeHint()`), start dragging any other pair tile from the bank for $\ge$ 8px, then cancel the drag (drop outside, press Escape, switch tabs, or trigger pointer cancellation).
* **Mechanism:** [`placement-drag.mjs:69`](file:///private/tmp/MAKER-Gemini__inbetween-drag-20261030/games/inbetween/placement-drag.mjs#L69) invokes `api.selectPair()` immediately on drag `begin()`. In [`app.mjs:174`](file:///private/tmp/MAKER-Gemini__inbetween-drag-20261030/games/inbetween/app.mjs#L174), `chooseTile()` clears `hinted = null` and purges `sessionStorage`. When the drag is cancelled ([`placement-drag.mjs:28`](file:///private/tmp/MAKER-Gemini__inbetween-drag-20261030/games/inbetween/placement-drag.mjs#L28)), `hinted` is never restored.
* **Impact:** The player was charged 1 nudge, but the visual hint and guidance are permanently destroyed. Requesting the nudge again charges a *second* nudge.
* **Expected:** Ephemeral drag cancellation must restore the prior `selectedTile` and `hinted` state, or selection mutation should defer until an actual valid drop preview is committed.

#### 2. Duplicate attempts charged on rejected placement double-click or re-entry
* **Trigger:** Drop an incorrect pair into a gap and click [Place pair] (or press Enter). The rejection message appears, but `<button class="fit-button">Place pair</button>` remains active and focused. Clicking it again or hitting Enter immediately charges another attempt for the identical word.
* **Mechanism:** [`submitPlacement()`](file:///private/tmp/MAKER-Gemini__inbetween-drag-20261030/games/inbetween/engine.mjs#L46-L65) does not deduplicate consecutive identical rejected placements and increments `attempts` on every call. [`app.mjs:198`](file:///private/tmp/MAKER-Gemini__inbetween-drag-20261030/games/inbetween/app.mjs#L198) re-renders with `{focusFit: true}`, leaving the rejected button focused and clickable.
* **Expected:** Disable [Place pair] after a rejection until the player changes the selected pair or target gap, preventing accidental double-charges.

#### 3. Sticky bank deadzone stalls upward edge-autoscroll on mobile
* **Trigger:** On viewports $\le$ 800px, scroll down to words 5–6 and drag a pair tile upward toward words 1–2.
* **Mechanism:** In [`styles.css:140`](file:///private/tmp/MAKER-Gemini__inbetween-drag-20261030/games/inbetween/styles.css#L140), `.bank-card` is `position: sticky; top: 8px; z-index: 5` (~170px tall). However, upward autoscroll in [`placement-drag.mjs:59`](file:///private/tmp/MAKER-Gemini__inbetween-drag-20261030/games/inbetween/placement-drag.mjs#L59) is hardcoded to `active.y < 76px`. When the pointer is between 76px and 170px, it hovers over the opaque sticky bank (where [`locate()`](file:///private/tmp/MAKER-Gemini__inbetween-drag-20261030/games/inbetween/placement-drag.mjs#L35) returns `null` because gaps are occluded beneath), but autoscroll is dormant.
* **Expected:** Set the upward autoscroll threshold to match the sticky bank height (`edge = Math.max(76, bankCard.offsetHeight + 16)`), allowing intuitive upward scrolling when dragging near the sticky bank.

---

### Narrow Visual & Interaction Improvements

1. **Pointer-type aware ghost offset:** `active.y - 120px` ([`placement-drag.mjs:55`](file:///private/tmp/MAKER-Gemini__inbetween-drag-20261030/games/inbetween/placement-drag.mjs#L55)) provides thumb clearance on touch, but on desktop mouse ([`Chromium-hover.png`](file:///private/tmp/MAKER-Gemini__inbetween-drag-20261030/output/inbetween-drag-20261030/Chromium-hover.png)), it places the ghost 120px above the cursor, occluding the masthead and "How it works" link during Row 1 drags. Use `pointerType === 'touch' ? 110 : 44`.
2. **Anchor success flourish to inserted letters:** `.fit-burst` uses `inset: 0; place-items: center;` inside `.answer-letters` ([`styles.css:163`](file:///private/tmp/MAKER-Gemini__inbetween-drag-20261030/games/inbetween/styles.css#L163)). The ring and sparks always detonate in the dead center of the 6-letter word (between letters 2 and 3) rather than centering over the placed pair (e.g. at gaps 0 or 4). Anchoring to `.answer-letter.inserted` aligns the flourish with the placement.
3. **Capacitive touch click-suppression radius:** The 6px threshold in `Math.hypot <= 6` ([`placement-drag.mjs:105`](file:///private/tmp/MAKER-Gemini__inbetween-drag-20261030/games/inbetween/placement-drag.mjs#L105)) is narrow for touch release jitter. Expanding to 12px prevents stray synthetic clicks from slipping past on physical touch liftoff.

