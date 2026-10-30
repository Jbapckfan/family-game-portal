I inspected the relevant Switchpath source, tests, puzzle metadata, and supplied audit; I also viewed both `before-phone.png` and `before-desktop.png`. I did **not** execute the game or tests, so this is not a claim of actual play.

## Assessment

Switchpath is polished and immediately understandable, but its depth is uncertain. Every board uses the same 4×4, fifteen-step alternation task. The 217 boards contain 210 substantive comparison challenges and 63 route shapes, but those are content metrics—not evidence of lasting fun. Four to seven branch points and wrong branches surviving 9–14 moves could produce satisfying planning, or late failure followed by tedious rewinding. Given James’s reaction to Ringcount, I would not predict strong engagement from presentation or puzzle quantity alone.

The lack of legal-next-cell highlighting is a good constraint: players must choose the route themselves. I would preserve that and avoid adding modes until playtesting demonstrates a need.

## Highest-value changes

1. **Disclose Hint and Undo consequences at the action.**  
   In `index.html:57-59`, Undo says only “Undo one path step,” while Hint’s title omits its costs and potentially extensive rewind. Yet `engine.mjs:61-63` charges one move per rewind, and `useHint` at `engine.mjs:91-98` can rewind several steps while charging one move and one hint. Trigger: a player deep on a wrong branch presses Hint expecting a small nudge and loses most of the visible route. Add concise button-adjacent text or first-use confirmation: “Undo: −1 step, +1 move” and “Hint: corrects to the solution, +1 move/+1 hint.” Keep existing scoring and save formats unchanged.

2. **Make a genuine dead end visually unmistakable.**  
   `nextMessage` in `app.mjs:100-109` detects zero legal moves, but the message appears only in the small feedback line below the board; the direction panel still instructs “Go higher/lower.” Trigger: the final locally legal extension leaves no continuation. Change the direction panel to a clear “No legal steps—rewind to try another route” state and announce it. Use `legalNextCells().length === 0` only; do not predict future failure or highlight legal cells.

3. **Keep phone actions within easier reach.**  
   The 390px screenshot places the action row around y=1020, well below the grid, with no sticky placement. Repeated Undo/Hint use therefore requires scrolling on shorter viewports. Make a compact action bar sticky near the bottom, respecting safe-area insets and avoiding the feedback text or board. Desktop spacing and hierarchy otherwise look strong.

4. **Provide keyboard and screen-reader route inspection after completion.**  
   `routeMarkup` disables every cell and gives it `tabindex="-1"` when play ends (`app.mjs:45-65`). The board’s single long `aria-label` lists values (`app.mjs:77`), but users cannot inspect individual steps and relationships by keyboard. Add an accessible ordered route summary—step, value, position, and higher/lower transition—without re-enabling moves. This also makes revealed routes meaningfully inspectable.

5. **Upgrade sharing without exposing the route.**  
   `formatShare` (`engine.mjs:165-177`) produces four emoji squares and statistics, but no calendar date. Although it accepts a URL, `shell.mjs:326-333` does not pass one, so copied results lack a playable link. Offer a square or portrait card containing the real date, daily/practice identity, moves, hints, and result, plus the game link; retain spoiler-free text fallback. Do not include values, coordinates, route shape, or a miniature board.

## Provisional scores

- **Fun: 2/5** — elegant premise, but potentially repetitive and rewind-heavy.
- **Clarity: 4/5** — strong rule explanation and direction display; action costs are under-disclosed.
- **UI: 4/5** — attractive, readable desktop and phone boards; phone action placement needs work.
- **Replay: 3/5** — dailies, saves, streaks, and practice help, but solved-route replay has little intrinsic variation.
- **Shareability: 2/5** — spoiler-safe, yet visually slight and missing date/link.

**Human playtesting needed:** whether choices feel reasoned or guessed; solve duration and abandonment after late dead ends; reactions to charged rewinds and branch-correcting hints; enjoyment across several consecutive days; one-handed phone use; VoiceOver/keyboard route inspection; and whether recipients understand and trust the share card as spoiler-free.
