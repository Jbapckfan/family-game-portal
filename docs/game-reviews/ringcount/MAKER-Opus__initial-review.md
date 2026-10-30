# Ringcount review (provisional, based on reading the code and screenshots only)

## 1. Verdict

Ringcount is a calm, honest and well-built puzzle with very little depth. The rules are clear, the engine is solid (save restore refuses forged or edited saves at `engine.mjs:129`, and the exhaustive uniqueness proof is in `puzzles.test.mjs:47`). The biggest problem is the main loop itself, which players can probably solve with a simple routine. The other problems are fixable.

**Strengths**
- The live arc totals with ✓ marks, plus the written-out sums under each card (`app.mjs:45-48`), take real effort off the player. The sums use text as well as colour, which is good.
- Hint and reveal are disclosed honestly. Reveal has a confirm step and never counts as a win (`shell.mjs:307`). Shares say "Revealed" or show the hint count (`engine.mjs:210-211`).
- The gap buttons are 44×44 at 390px wide (shown in `baseline-browser.json`). Their labels are good, e.g. "Place cut after position 2, between 2 and 6". Arrow, Home and End keys move around the ring (`app.mjs:70-75`).

**Friction and bugs (with evidence)**
1. **The puzzle collapses into one routine.** All numbers are 1–9 and positive. So once one cut is right, each next cut is forced: you just add clockwise until you reach the target. You can test any gap by adding mentally; 4 of the 12 gaps work. That also means **one hint effectively solves the board**, since `useHint` adds a correct cut (`engine.mjs:97`). The difficulty labels barely vary: 208 of 210 puzzles are "Sharp" and 2 are "Deep" (from grepping `puzzles.mjs`).
2. **"Perfect" doesn't measure much.** The Check button changes to "Bring it full circle" once all four totals match (`app.mjs:50`), and the solution is unique. So no one ever needs a wrong check, and "one check, no hints" in practice just means "no hints". The checks stat and "average checks" (`app.mjs:15`) mostly count accidental taps.
3. **The hint button doesn't look like a hint.** "✦ Place a cut" (`index.html`, `#ring-hint`) reads like a normal action. Pressing it silently costs the player their "perfect" result, with no confirm step. Only the help dialog explains it.
4. **Arcs 1 and 4 are nearly the same colour.** `COLORS[0]='#a45e2c'` and `COLORS[3]='#9b684f'` (`app.mjs:6`) are both rust-brown. Arc 4 always holds the wraparound, so it sits next to arc 1. You can see this in `before-partial.png`: 3·6·5 and 2·6·2 both look brown.
5. **Arc numbers and colours jump around.** Arcs are numbered from the lowest cut (`engine.mjs:61-62`). Adding a cut with a lower index renames and recolours every existing arc.
6. **Screen readers will likely hear every update twice.** `#feedback` is `role="status"`, and `announce()` also writes to the `aria-live` `#announcer` (`shell.mjs:165,172-174`). The author's `bodyText` shows "4 of 4 cuts placed." twice. Also, `aria-label` on plain `<span>` and `<div>` elements without a role (`.ring-number`, the ✓ `<i>`, `#puzzle`, `#arc-totals`) won't reliably be read out.
7. **Shared text has no link back.** `share()` calls `formatShare` without `url` (`shell.mjs:328`). Browsers also skip `navigator.share`: it's the native bridge, then clipboard, then a textarea.
8. **Small issues:**
   - The meta description calls it "A daily **word** game" (`index.html:3`).
   - The default `family-link` href is a LAN IP, `http://192.168.1.155:8080/`. JavaScript rewrites it later.
   - The position labels are 8px at opacity .65 (`styles.css:22`), but hint messages refer to positions ("after position 4").
   - Tapping a fifth gap is simply refused (`app.mjs:58`).

## 2. Recommended changes

1. **Make the hint honest.** Rename the button to "Hint: show a correct cut", with a small line saying "Counts as a hint". Benefit: no accidental loss of a perfect result. Saves aren't affected.
2. **Fix arc colour and order.** Pick four clearly different colours that also pass colourblind checks, and keep each arc's colour stable as cuts change (for example, key it to the arc containing a fixed position). Benefit: you can trust which arc is which at a glance.
3. **Make the score mean something.** Say plainly that only hints and reveal affect "perfect", or drop "checks" from the perfect rule and share text. Benefit: players aren't confused by a metric that never changes. The `won` records rely on `checks>=1` (`engine.mjs:125`), so keep storing checks and just change what's shown.
4. **Add depth to the puzzles, at the content level.** For example, harder ones that hide some arc totals, which you'd need to make optional to keep the accessibility promise. Or difficulty actually graded by how few gaps work as a starting point, with honest labels. Benefit: more reason to come back. **This needs playtesting before you commit.**
5. **Small cleanup:** remove the duplicate live region, add the share URL and `navigator.share({text})`, and fix the meta description. Benefit: cleaner screen-reader output and more useful shares.

## 3. Candidate changes

| Candidate | Verdict |
|---|---|
| Visibly labelled hint | **Helps, and should be first.** It's needed for honest disclosure. |
| Select a cut, then tap where it goes | **Overcomplicates.** Toggling already moves a cut in two taps. A "selected" state would clash with "tap a selected cut to remove it" and add a mode screen readers must track. A better full-board message is enough. |
| Arc focus on hover/tap | **Helps a little, once colours are fixed.** Tapping a total card to highlight its numbers works on phone and desktop; hover alone doesn't work on phones. Not needed if colours are distinct and stable. |
| Live status of balanced arcs | **Mostly done already** (✓ marks, `matched` class, "N arcs match"). Small gain: also show matched arcs on the ring itself, e.g. a solid stroke instead of the faint `.42` opacity line. |
| Clearer finish action | **Small help.** The label already changes. Add `aria-live` text about which arcs match and a stronger "ready" style. Keep the explicit check: it keeps records compatible and gives a satisfying final tap. |
| Branded PNG export + native file share with copy/download fallback | **Overcomplicates for now.** A spoiler-free image would only show four green squares plus counts. It means canvas and font work, uneven file-share support, and another native bridge type. Add the URL and `navigator.share` to the text share first, then decide. |

## 4. Provisional scores (my prediction from reading the code, not measured)

- **Fun: 2.5/5.** A pleasant "aha" on first play, but the routine I describe in finding 1 likely makes later boards feel like arithmetic.
- **Clarity: 4/5.** The rules, warm-up lesson and live totals are clear. The hint label and the near-identical arc colours take away from it.
- **UI: 3.5/5.** The dial is attractive and the touch targets are fine. Arc colours jump and are hard to tell apart, and position labels are tiny.
- **Replay: 2.5/5.** 210 boards, but almost all are rated the same and there's little to master. Practice and stats help a bit.
- **Shareability: 2.5/5.** Spoiler-free and honest, but the emoji row is always the same for a win, there's no link, and browsers have no native share.

## 5. What needs human playtesting

- Whether players discover the "add clockwise" routine, how quickly, and whether fun drops off after that.
- How long a session lasts, and whether "Sharp" feels right.
- Whether players misread "✦ Place a cut" as a free action.
- Telling arcs apart by colour, including for colourblind players, on a real phone.
- Screen-reader experience (VoiceOver/TalkBack): duplicate announcements, and whether arc totals are easy to find.
- Tap accuracy on gaps placed outside the numbers at 360px and narrower.
- Whether players care about "perfect" or "checks", and whether anyone actually shares.

**How I reviewed this:** I read all the source and test files and viewed all three screenshots (`before-phone`, `before-desktop`, `before-partial`). I did **not** run anything: no tests, no browser, no solver. `baseline-browser.json` and the 23 passing tests are the author's evidence, not mine. Some imported files aren't in this folder (`../deepseek-runtime/*`, `scripts/generate-puzzles.mjs`), so I couldn't check the daily-selection or generator code.
