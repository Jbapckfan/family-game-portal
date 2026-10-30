# Inbetween drag placement

Use the established autonomous inline design/TDD/review workflow in the existing isolated checkout. James requests drag-and-drop with cool placement visuals. His verdict is6/10, keep it; harder clues are an editorial tuning follow-up. No relative keeper order is inferred.

**Design:** Pointer Events on mouse, pen and touch; retain tap/keyboard controls. Drag a pair as a floating blue/teal tile, highlight any unsolved gap equally, and animate a live six-letter preview. Drop snaps into a free preview; explicit Place pair remains the scored action. Correct confirmation brings a staggered letter arrival, a soft expanding ring and a short particle flourish; wrong placements retain truthful error feedback. Reduced motion uses immediate state changes without travel/bursts. No correctness hint before confirmation, scoring/calendar/bank/schema change, new dependency or raster hero art.

**Architecture:** A dedicated `placement-drag.mjs` controller owns ephemeral pointer/ghost/hover/autoscroll state, never game persistence. The app supplies current puzzle/session identity, used-pair availability, selection and free-gap preview callbacks. Capture on a stable element survives the existing DOM re-render. Escape, pointer cancellation/lost capture, visibility/page changes, modal open, external progress and game navigation cancel cleanly. Release outside a legal gap spends nothing. Suppress only the pointer click following a drag, leaving keyboard/tap activation available. Edge scrolling supports long phone boards. Touch scrolling outside pair tiles remains native.

**Visual approach:** Floating joined-letter tile with lift/shadow, candidate gap halo and split seed-letter motion, temporary word formation preview and a drop-in effect; confirmed correct words settle in with staggered inserted letters and a contained success flourish. Use CSS/Web Animations for actual gameplay motion, without image generation or new assets.

- [x] Add failing interaction regressions for drag preview, cancellation, availability, stale state, click suppression and reduced motion.
- [x] Implement isolated controller, app integration, phone edge scroll and placement visuals; keep tap/keyboard/persistence checks passing.
- [x] Verify actual mouse/touch flows, free invalid/cancel drops, no correctness leaks, real confirmed perfect/revealed states and updated screenshot/animation renders.
- [x] Obtain scoped Kimi/Gemini/Opus feedback on the new interaction, adjudicate and verify findings.
- [x] Sync native resources; run relevant catalog/browser/offline/unsigned build checks and inspect final visual motion in the existing one/two-tab preview.
- [x] Save review notes and James's6/10 keeper verdict; prepare the verified all-games stage.

Save sequence after this record is committed: push the existing feature branch, verify its remote SHA, then package the verified final stage. No main push or deployment.

Rulings: cancelled gestures restore the pre-drag UI only while its game revision matches; rejected previews cannot charge again until changed. Sticky-bank edge zones avoid scrolling during lift; PointerEvents capture/Escape order and click suppression preserve taps/keyboard. Final cancelled focus returns to a usable pair after a reproduced browser regression.
