# Daily batch, round 2 (from Claude's real-browser captures)

I ran your shots outside the sandbox: `output/screen-fit/daily-after/<id>/sheet-start.png`,
`sheet-play.png`, `sheet-help.png`, the per-size PNGs and `report.json`. Sheets show, left to
right, phone 393x852, iPad landscape 1180x820, laptop 1440x900, iPad portrait 820x1180 (drawn
smaller). Same scope rules as round 1 (layout and sizing only; colors, fonts and branding kept).

Good: page scroll is now 0 at every size for all eight puzzles (it was 138-818 px), no page or
step errors, no horizontal overflow, audio muted, and the boards are much larger on iPad and
laptop. I checked the diff: no color or font value was added or removed, and
`games/daily/screen-fit.css` only uses the existing color variables.

Fix these:

1. **Branding kept exactly.** Under 960 px the new CSS hides `.brand-caption` and `.brand-line`
   (for example Tradeoff's "A DAILY GAME OF GIVE & TAKE") and sets `.hero { background: none; }`.
   That changes branding on phone and iPad portrait. Restore both and the hero background; find
   the height elsewhere (spacing, the date row, the instruction line).
2. **Shortlist, iPad portrait (play):** the candidate word list is cut off at the bottom
   (CLEAN/TRAIL half visible, QUART/BLUSH hidden) while the letter keys above are tall. Balance
   the two so all twelve words and the scan keys are visible without inner scrolling at 820x1180.
3. **Shortlist, phone (play):** the scan panel's A-Z keys are scrolled out of view inside the
   card, so the player sees only the panel's footer. After a scan, the keys and the word list
   should both be reachable, with the keys visible when the player needs them. If an inner
   scroll region is unavoidable on phone, give it a visible edge (a soft fade) so it reads as
   scrollable.
4. **Tradeoff, phone (play):** the sixth clue is half hidden behind the footer controls. Same
   treatment: fit all six or make the inner scroll clearly scrollable.
5. **Daily hub, phone:** "About the collection" wraps onto two lines in the header; keep it on
   one line (shorter display is fine only if the link text stays the same for screen readers).
   The hub's long scroll is fine; it is a catalog page.

Check the other six puzzles' phone and iPad portrait play captures for the same inner-scroll
clipping and fix any you find the same way.

Append a "Round 2" section to `daily-report.md` with what you changed and test results. Do not
try the browser capture; I will run it.
