# Switchpath — second individual review, October 30, 2026

James subsequently said “yes, i like it” and would play again. It is now a keeper and provisionally first among the two games he has played. See the [compact-board and 5×5 consideration follow-up](SPACING-AND-5X5.md) for his requested refinements. The initial review below is retained as dated evidence. All **32 daily games plus the nine-board bonus** remain available. Ringcount's “easy and boring” feedback is recorded as a replacement candidate, without deletion or an invented numeric score.

The phone header is shorter and controls sit directly below the board. Dead ends now remain obvious after reload. Hints disclose their cost and possible rewind before changing the route. Finished routes have an ordered readable inspection view. Browser results export as spoiler-free square/portrait PNGs with the played date and honest moves/hints, plus download/copy fallbacks. Rules, boards, historical calendar, scores and saved-game formats are unchanged.

Kimi K3.1 Pro and Gemini 3.8 Flash High reviewed the baseline source/screenshots; Opus 5.5 reviewed the updated source. Opus found no confirmed major defect in its scope. All three remain cautious about lasting enjoyment. A follow-up forcing audit found 58/217 boards, including today's, resolve using basic degree rules; the other 159 are not automatically difficult. [Full review decisions and limitations](ADJUDICATION.md).

## Verification

- **845/845** catalog-scoped Node tests passed, including unchanged-bank uniqueness, calendar/practice/save logic and bundle staging.
- **20/20** Chromium/WebKit browser checks passed: actual wrong route and recovery, reload, hint cancel/cost, keyboard, 320/390/768/1440 layouts, perfect finish, terminal inspection, real PNG dimensions, prior-day identity after reopening, cancellation/manual copy and revealed practice separation.
- **11/11** offline lifecycle checks passed on the final staged asset hashes, including all 32 daily pages and a bonus turn/restoration.
- Unsigned iPhone Release compiled; **274** runtime files match its app resources byte for byte. No new device install, native image share or physical playtest is claimed.
- Final build ID **95fae0c6c3f9431b**. Phone/desktop and solved/revealed square/portrait images visually inspected. Revised game and explicitly labelled automated-test share example opened visibly in isolated Chrome. No social post or public deployment.

[Evidence summary](evidence/summary.json), [browser cases](evidence/browser-results.json), [phone](evidence/phone.png), [desktop](evidence/desktop.png), [square result](evidence/result-square.png).

Initial tests deliberately reproduced the missing confirmation, dead-end reload, terminal inspection and bundle-export failures. A DOM run first lacked the installed jsdom module path; it passed after using the existing dependency location. A browser test initially froze requestAnimationFrame after Enter and sent Backspace before focus restoration; advancing the controlled test clock through that frame corrected the harness. No product workaround was needed. Final source cleanup removed unused Ringcount selectors and extra trailing whitespace; final browser/offline checks and compiled-resource parity use the cleaned CSS.

## Continue

Record James's enjoyment and whether he would play again in [the ranking ledger](../ranking.json). Do not convert model scores into his ranking. Counterpart is next after his Switchpath feedback.

Checkout: `/Users/jamesalford/Projects/MAKER-codex__alford-daily-six-months`; feature branch `codex/game-by-game-2026-10-29`. Final package source: `dist/switchpath-review-20261030-final-v2/web`. Preview uses intercepted HTTPS inside its own Chrome profile and starts no listener. Prior play profiles are preserved. Initial visible stage has the same rendered UI; final stage only removes unused CSS selectors/whitespace.
