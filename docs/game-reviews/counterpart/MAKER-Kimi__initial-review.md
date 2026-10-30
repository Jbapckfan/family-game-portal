## Counterpart review

**Overall:** a thoughtful, clearly explained analogy game with satisfying direction-based constraints. It risks feeling like an exact-answer worksheet rather than offering Switchpath’s sense of discovery. The 210 boards recombine only **90 authored analogies**, so replay value will diminish once relationships become familiar.

### Concrete findings

- **Mobile scrolling can hide the active row.** The phone bank is sticky, while a successful check scrolls the next row using a fixed `scroll-margin-top:280px` (`styles.css:105`, `app.mjs:89`). In the 390px screenshot the bank is roughly 340px tall, so the next row’s cue can land beneath it. Selecting words is convenient, but checking lower rows needs real-device testing.
- **Hints have an irreversible, unconfirmed cost.** A single tap immediately reveals the relationship and records the hint (`app.mjs:91`). Repeated display is correctly free. This is especially risky beside Reverse on a touch screen.
- **Statuses can mislead.** “Words left” counts only locked words, not current drafts (`app.mjs:55`). More importantly, “5 is perfect” remains visible after a hint, although perfect is then impossible. The static rule should say “5 checks + 0 hints = perfect.”
- **Coaching is precise mechanically but too absolute semantically.** Only the exact authored ordered pair passes; only its exact reversal receives reverse feedback (`engine.mjs:49`). Other answers get “That pair doesn’t carry the same relationship” (`app.mjs:86`), which would falsely condemn a plausible alternative. Coaching does not otherwise reveal answers or other rows.
- **Accessibility fundamentals are good:** labelled controls, keyboard-operable buttons, visible focus, 44px touch targets, reduced-motion support, and draft restoration. However, updates populate both `#feedback[role=status]` and a separate live announcer (`shell.mjs:172`), potentially announcing every selection twice.

### Content audit

I inspected all 90 records. Most directed relationships are fair, with no obvious systematically reversed answers. Some labels need tightening:

- **SIEVE→SIFT / NET→CATCH:** a net is not a “utensil.”
- **CANVAS→PAINTER / CLAY→POTTER:** canvas is a support, not the artistic “medium.”
- **PERMISSION→ACT / INVITATION→ATTEND:** an invitation is not necessarily “authorization.”
- **REHEARSAL→PERFORMANCE / DRAFT→PUBLICATION:** preparation/action and version/outcome are not perfectly parallel.

There are clear **potential exact-answer conflicts**: PROLOGUE→STORY / OVERTURE→OPERA and APPETIZER→MEAL / PRELUDE→CONCERT can share “opening portion → main experience.” If co-banked, either ordered answer pair reasonably fits either cue, yet the engine rejects the alternative. Similar broad-tool conflicts exist between LEVER/AWL and SIEVE/NET records.

The supplied audit lacks board-to-bank membership and `puzzles.mjs` was not supplied, so actual co-occurrence is **unconfirmed**, not a claimed shipped-board defect. Notably, the interchangeability test covers only boards after the first 30 (`tests/expansion.test.mjs:71`).

### Provisional predictions—not James’s rating

- **Fun: 3/5** — satisfying connections, but exact matching and unlimited guessing can feel mechanical.
- **Clarity: 4/5** — excellent warm-up and direction instruction; statuses and some labels need correction.
- **UI: 3/5** — compact bank and strong touch controls, but mobile occlusion and terracotta styling work against James’s preferences.
- **Replay: 3/5** — many combinations, but repeated analogies become memorable.
- **Sharing: 4/5** — honest checks/hints, daily/practice/revealed labels, no spoilers or private URL; currently text rather than an image, and daily shares lack the date.

### Five scoped improvements

1. Measure the sticky bank and scroll active rows below its actual height.
2. Confirm the first hint; clarify perfect and bank-count wording.
3. Audit actual board combinations for interchangeable answers; soften generic rejection to “Not the intended pair.”
4. Use one live-announcement path and verify VoiceOver/keyboard play.
5. Add the daily date and an optional spoiler-free square/portrait share image using existing counts and labels.

**Human playtest needed:** real-phone lower-row scrolling, accidental hints, draft restoration across modes/reloads, screen-reader announcements, and whether repeated analogies remain fun.

**Scope:** inspected the supplied application/source files, all seven test files, audit and baseline JSON, and viewed both screenshots. No game or tests were executed; the stated 66-test baseline was not independently verified.
