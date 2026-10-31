# Morph individual review implementation plan

Use the established autonomous inline design/TDD/review workflow in this isolated checkout. Cairn is now a keeper from James’s exact “keeper, go next”; no numeric score or relative rank. Tenth game Morph remains Kimi-authored; James’s Morph verdict is pending. Tangle (Kimi) follows.

**Goal:** Make the existing four-letter ladder clear, pleasant and safely shareable, verify its full supplied bank and practical browser flows, and present it for James’s decision.

**Architecture / technology:** Existing React19/TypeScript/Vite/Radix UI, maintained `packages/kimi-pebbles/src/games/morph`, scoped Morph CSS and shared offline six-game runtime. Preserve engine, hook rules, progress schema/storage IDs, dictionaries,450bank, suggested-move scoring and dated/practice selectors unless an ordinary-UI defect is reproduced. No packages/models/downloads, new raster hero, infrastructure, public deployment, paid API or new visible browser window. Existing one-tab preview; at most one labelled example tab. Old generated asset directories move to recoverable ignored backups before staging/sync.

**Design:** Follow James’s large readable type and blue/teal preferences. Replace Morph’s purple with blue/teal editorial styling. Keep the goal visible above the growing ladder, label start/accepted steps/editing/goal clearly, expose the public count of changed letters, and explain that the supplied4–7move route is a suggestion rather than shortest. Each accepted word still changes exactly one position; valid alternative words count, repeats do not. Improve palette position/keyboard clarity. Confirm first full-route assistance, giveup and restart; cancel/duplicate/stale confirmation spends nothing. Reopening a saved route remains free; undo/restart retain misses/hints. Remove restored-win confetti. Result wording must distinguish completed/revealed and assisted/unaided without inventing perfect or shortest claims.

**Sharing:** Morph-local pure frozen aggregate snapshot: played Daily number/date or Practice, solved/revealed, actual moves, supplied suggested benchmark, misses and help used. No start/goal/route/word/letters/position pattern/URL. Native text first; prepared portrait/square PNG, gesture file-share, cancellation, download, honest copy/manual caption fallback. Private result answer lists are excluded from output. No external posts or physical share certification.

**Audit baseline:**161package tests and actual supplied-route Daily browser win passed.450distinct unordered endpoint pairs,333starts,323targets,988canonicalwords,max recurrence17. Every path is dictionary-valid, nonrepeating and changes one position per move. BFS over7186four-letter dictionary words finds shorter routes for357boards; this validates the existing “suggested route” wording, not shortest/familiarity claims.391canonicalwords are outside the bundled747four-letter common-list entries. No automatic bank rewrite; human vocabulary judgment remains open.

**Review focus:** stale confirmations after undo/mode/round changes; first versus repeat full-route hints and miss retention; keyboard/palette focus and long-ladder goal visibility at320phone; truthful assisted/revealed aggregate snapshots and date freeze; whole runtime/offline parity across all six Kimi games.

- [x] Record Cairn keeper, reuse preview, inspect/audit Morph, capture baseline and request scoped Kimi/Gemini/Opus reviews.
- [x] Write failing outcome/privacy tests; implement `morph/share-card.ts` and `MorphSharePanel.tsx`.
- [x] Write failing Board confirmation/palette tests; implement scoped layout, safe confirmations, accurate results/help/date/stats display.
- [x] Read/adjudicate actual baseline panel. One fresh final Opus source review; fix reproduced material issues, record deferred limitations.
- [x] Typecheck, isolated Vite build/recoverable stage/sync. Package/catalog tests, real Chrome/WebKit complete/assisted/revealed/recovery/restore/sharing/focus/width checks; six-game boots; actual offline cache and unsigned iPhone build/byte parity.
- [x] Inspect final game/cards in existing preview, save reports/ranking with Morph preference pending, commit/push feature branch/verify remoteSHA and package all32daily games+bonus.

**Decision:** Follow the established inline workflow without another design-approval round; the user’s repeated go/next instructions authorize the same review/improvement scope. Prefer a scoped UI/interaction pass over a new mode or bank rewrite. Distinct-endpoint construction is not human difficulty or editorial certification. All reviewers receive labelled isolated folders and no private unrelated data.

Final: Fixed consumed palette event — production keydown regression RED→GREEN; focused33/package172/catalog899 and real browser42 passed. Help copy corrected to suggested moves. Deferred minors: same-round share reopening focus flash, assisted route panel visibility on reload, physical Safari delayed download. See review/report. No extra model re-review; independent tests cover the fix.
