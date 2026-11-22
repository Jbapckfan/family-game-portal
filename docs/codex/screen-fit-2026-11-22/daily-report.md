# Daily batch — layout implementation, visual verification pending

2026-11-22. Changes remain in the working tree for Claude. No git writes, server, headed browser, app window, downloads, or installs.

## Scope and implementation

Changed the eight puzzle HTML shells and the Daily hub HTML. Added one local, shared layout stylesheet, `games/daily/screen-fit.css`, loaded **after** the existing styles. Original `styles.css` files, `identities.css`, fonts, colors, branding assets, JavaScript, puzzle definitions, scoring, difficulty, storage formats and catalog content remain unchanged.

The shared sheet covers **all eight puzzles plus the hub**. Ship it with the HTML changes. Static checks confirm every new stylesheet reference exists, every original element ID and script import survives, and the nine HTML documents are balanced. **These checks do not establish that all eight render correctly:** Chromium could not start here.

Puzzle pages now allocate the dynamic viewport to a compact masthead, creator/navigation line and flexible puzzle panel. Wide layouts use the available width; the old guide sidebar and footer are omitted from this play layout. The existing How-to-Play and sound buttons remain in the masthead, and the All games link still leads to Daily. Large welcome banners are reduced on larger screens and omitted on phones; the original wordmarks remain. The original icon is retained at larger widths and omitted from the phone wordmark to accommodate Menu and the three 44px tool buttons.

The minimum markup consists of a mode/date wrapper and a scrollable puzzle wrapper; Shortlist also groups its console and candidates into separate layout columns. No script restructuring. On compact screens, long puzzle content can scroll **inside** its panel while the main action/feedback area remains outside that scroll region. This is an intentional readability compromise, especially for Tradeoff, Inbetween, Counterpart, Shortlist and Sideways; it is not a claim that every puzzle row and every internal control is simultaneously visible on a phone. Existing game handlers may scroll selected content into view. The collection hub remains a scrolling catalog.

Added a fixed 44px Menu home link to each page and an equivalent link inside its native dialog. Native dialogs occupy the top layer, so raising the outside link's z-index alone would not make it tappable. Dialog Menu links are outside the script-replaced dialog content. Their actual stacking, clipping and hit testing still require browser verification.

Spacing, alignment, type sizes and tap targets were adjusted without replacing font families or palette values. Press feedback uses independent CSS `translate` so Ringcount's centered/rotated cut transforms remain intact; reduced-motion rules remove the new press movement. No new hover or continuous animation was added. Existing hover/animation code was retained under this batch's narrow scope. No canvas or animation-loop code changed; this pass does not certify refresh-rate, battery or runtime performance.

## Baseline evidence

Personally inspected all eight supplied `baseline/<id>/sheet-start.png` sheets, including phone, iPad landscape, laptop and iPad portrait. Boards are confined to narrow columns on larger screens; important actions often fall below the viewport. Portrait iPad uses the width particularly poorly because the original sidebar remains beside the puzzle.

The following values are **pre-change document vertical scroll**, in CSS pixels, from `output/screen-fit/baseline/report.json`. All these baseline rows report zero horizontal overflow and no page errors. These numbers include content below the visible play area, including footers/sidebars; they are not measurements of board height.

| Game | Phone 393×852 | iPad landscape 1180×820 | iPad portrait 820×1180 | Laptop 1440×900 |
| --- | ---: | ---: | ---: | ---: |
| Tradeoff | 490 | 514 | 138 | 435 |
| Inbetween | 659 | 581 | 364 | 501 |
| Counterpart | 818 | 659 | 360 | 580 |
| Shortlist | 734 | 661 | 285 | 582 |
| Second Sense | 599 | 693 | 317 | 614 |
| Sideways | 547 | 611 | 258 | 532 |
| Ringcount | 467 | 596 | 220 | 517 |
| Switchpath | 378 | 551 | 156 | 472 |

No supplied baseline sheet/report row for `daily-hub` was found. Its assessment here is source-based.

## Per-game changes and remaining visual review

**All after appearances and measurements at all four sizes are unverified.** The descriptions below state what the CSS implements and what Claude should inspect, not observed after results.

### Tradeoff

- Before: phone stacks clue/letters but cuts off later words; landscape iPad and laptop have narrow rows and offscreen controls. Portrait iPad shows more of the six-row board, with a narrow puzzle column beside the guide.
- Layout/polish: landscape iPad and laptop get two columns of three trading rows with larger letters. Portrait iPad gets six full-width rows that share the remaining height. Phone keeps full-width clues above 44px letters, allowing panel scrolling rather than squeezing the clues into a tiny side column. Mode/date and feedback/actions are compact and separate from the scrollable board.
- Still review/change if needed: phone's last word and selected-letter message, long clues, row numbering/order across the wide layout, and any scroll needed to trade between distant rows. Confirm the hint and undo actions remain visible.

### Inbetween

- Before: the bank and six word rows extend below the phone/landscape/laptop viewport; the portrait iPad retains a particularly narrow insertion area and offscreen lower actions.
- Layout/polish: six letter pairs form a single bank row; every insertion gap is 44px. Landscape iPad and laptop use a two-column, three-row puzzle. Portrait iPad retains a wide single column with clue and insertion line alongside one another. Phone stacks those two parts, keeps the preview/Place pair action in the scrollable region, and keeps the main nudge/clear controls outside it.
- Still review/change if needed: every insertion position, solved six-letter rows, rejection text and Place pair previews at each size. Phone gap-row width needs particular attention with the scrollbar present. Confirm scrolling a preview into view does not move the whole page.

### Counterpart

- Before: the phone word bank consumes much of the viewport before the first relationship. All larger views still place lower relationships/actions beyond the visible area; portrait remains a split page.
- Layout/polish: landscape iPad and laptop place the bank beside the analogy list. Portrait iPad uses the full page width. Phone uses two bank columns so long vocabulary such as `PALEONTOLOGIST` can remain readable without splitting mid-word; inactive rows use compact adjacent cues/slots. Bank and relationships can scroll together; persistent feedback/options remain outside.
- Still review/change if needed: the longest words, active-row reverse/hint/check controls, rejection text and solved relationship explanations. Long solved explanations are allowed to enlarge the internal scroll content.

### Shortlist

- Before: phone shows the scan console/history while candidates and actions extend below it. The landscape/laptop views also lose the candidate deck below the fold; portrait shows the deck but leaves lower controls below it.
- Layout/polish: landscape iPad and laptop put the scanner/history next to a three-column candidate deck that grows vertically. Portrait iPad stacks console and deck across the full width. Phone uses six alphabet columns, two candidate columns, 44px letter/pencil targets and readable scan explanations, with internal scrolling instead of shrinking keys.
- Still review/change if needed: phone scan-result wrapping and access between scanner and candidate deck; scan-button text after letters are selected; crossed-off/restored candidates; final-pick confirmation dialog and its Menu link. The desktop layout deliberately keeps the original dark console palette.

### Second Sense

- Before: large clue cards extend below the phone, landscape and laptop viewport, leaving the answer form farther down. Portrait shows the form near the bottom but retains the narrow split page.
- Layout/polish: all four sizes retain the noun/verb columns; cards share the flexible board height and use readable clue text. The answer panel sits outside the clue scroller. Landscape iPad/laptop put selected meanings and input/check alongside each other; portrait iPad and phone retain the stacked answer arrangement. Discovered-word explanations have a bounded separate scroll region.
- Still review/change if needed: long clues/hints, rejected answers, accumulation of discovered words, keyboard-open phone layout and completed-puzzle states. Verify that neither the input nor Check word disappears below the screen.

### Sideways

- Before: later rotating rows and checks are offscreen on phone/landscape/laptop; portrait is more complete but remains confined beside the guide.
- Layout/polish: strips expand across the viewport and use available board height. Both rotation directions keep 44px targets. Landscape iPad/laptop and portrait iPad retain four aligned clue columns; phone uses a labeled two-by-two clue arrangement so prose is not squeezed into four tiny columns. Check/undo/nudge and feedback remain outside the puzzle scroller.
- Still review/change if needed: letter/clue alignment on larger screens, phone A–D label correspondence, long words in column summaries, shifting both directions and checked/solved states.

### Ringcount

- Before: a fixed-cap circular board occupies only a small part of the larger screens; lower totals/check actions extend below the viewport. Portrait has a complete small dial with considerable unused surrounding space.
- Layout/polish: the circle now derives its size from the available stage height/width, retaining its aspect ratio. Landscape iPad/laptop place intro and totals beside the dial. Portrait iPad and phone stack them. Number discs and center numerals scale; cut hit areas remain 44px; hint/check actions stay outside the scroll region.
- Still review/change if needed: all twelve cut targets, four-cut totals, center labels, number/arc overlap, and circle scaling at every size. Confirm 44px invisible cut hit areas remain distinct from nearby discs and that the pressed cut does not jump.

### Switchpath

- Before: the original 420–440px route cap makes the board small on larger screens; bottom rows and controls fall below the landscape/laptop/phone viewport. Portrait shows the board more fully but still leaves the action area below.
- Layout/polish: removed that route cap in the layout layer. Landscape iPad and laptop place a viewport-sized square board beside direction/rhythm/progress information. Portrait iPad and phone stack those elements, with square size limited by the remaining stage height. Undo/reset/hint/options remain outside the stage scroller. Numeric cell layout and original route overlays are unchanged.
- Still review/change if needed: route-line registration after resize, S/E and step-label legibility, higher/lower direction changes, rewind/reset confirmation and hints. The play shot takes a real adjacent higher first step based only on visible cell values, without reading the solution.

### Daily hub

- Before: no supplied image baseline; source has a capped catalog width and a large welcome section.
- Layout/polish: wider catalog, shorter welcome/progress/filter spacing, four word/logic cards per row on landscape iPad/laptop, and larger card detail/creator/action labels. Portrait iPad retains the existing responsive card grouping with wider available space. Phone remains a single-column catalog with 44px creator filters/actions. Original 32-game catalog and creator identities are unchanged.
- Still review/change if needed: all card groups and all creator filters at each size, card-bottom wrapping, progress marks and the hub's own About dialog/Menu. Its play shot follows the Ringcount card and places two cuts; hub and game screenshots are intentionally different states.

## Checks actually run

- `node --test tests/*.test.mjs` from each of the eight puzzle folders: **287 passed, 0 failed, 0 skipped**. Tradeoff 20; Inbetween 37; Counterpart 47; Shortlist 43; Second Sense 46; Sideways 41; Ringcount 19; Switchpath 34. Logs: `output/screen-fit/daily-after/*-tests.log`.
- `node --check` on all top-level puzzle `.mjs` files plus Daily `app.mjs` and `catalog.mjs`: **32 checks passed**. No JavaScript was edited. Results: `source-checks.json` in that output folder.
- All nine shot files parse as JSON, begin with `start`, have real-interaction `play` steps and include a `help` shot. Embedded evaluation scripts compile with Node's `vm.Script`. Selector execution is still unverified because no browser launched.
- HTML/static audit: nine balanced documents; original IDs and script imports preserved; no duplicate IDs; new stylesheet paths resolve; two Menu links per document. Shared CSS delimiters balance and no literal colors/font-family declarations were introduced. This is a structural check, **not a CSS browser parser or rendering test**. Results: `layout-source-audit.json`.
- `git diff --check` for this batch's game paths: passed. Read-only comparison confirms the existing CSS, JS and puzzle data files have no tracked changes.
- No separate daily validator is named in the batch brief. Existing game suites cover engine/content/shell behavior; they do not certify the new layout.

## Capture limitation and Claude handoff

Exactly one attempt:

```sh
node tools/screen-fit/capture.mjs --out output/screen-fit/daily-after --batch daily
```

Exit 1 before any page was created: `bootstrap_check_in ... Permission denied (1100)` in Chromium's Mach-port rendezvous. The tool reported the process exited with SIGTRAP and temporary-directory cleanup completed. No retry, alternate browser, port or server. No after PNGs or after layout metrics exist. Receipt: `output/screen-fit/daily-after/capture-attempt.txt`.

Claude should run that same command outside this sandbox and inspect **every** `sheet-start.png`, `sheet-play.png` and `sheet-help.png` for all nine IDs. In particular:

1. Verify no document horizontal/vertical overflow during play at all four sizes; distinguish intentional internal puzzle scrolling from page scrolling. Check that the flexible stage actually receives height and controls stay within the viewport.
2. Check native-dialog Menu hit testing as well as appearance, normal Menu placement, header wordmark/tools on phone, safe areas, and orientation resizing.
3. Check all per-game cases listed above. Container query sizing in Ringcount/Switchpath and long labels in Counterpart/Inbetween/Sideways need real rendering evidence.
4. Exercise the hub's About dialog separately; its automated help shot occurs after navigation to Ringcount. Check phone keyboard layout in Second Sense separately.

Visual quality, actual no-overflow behavior, all-eight rendering, sound-toggle interaction, physical-device results and final polish remain **pending**, not passed. No processes started by this work were left running.

## Files changed

- `games/daily/screen-fit.css` (new shared layout CSS)
- `games/daily/index.html`
- `games/tradeoff/index.html`
- `games/inbetween/index.html`
- `games/counterpart/index.html`
- `games/shortlist/index.html`
- `games/second-sense/index.html`
- `games/sideways/index.html`
- `games/ringcount/index.html`
- `games/switchpath/index.html`
- `tools/screen-fit/shots/tradeoff.json`
- `tools/screen-fit/shots/inbetween.json`
- `tools/screen-fit/shots/counterpart.json`
- `tools/screen-fit/shots/shortlist.json`
- `tools/screen-fit/shots/second-sense.json`
- `tools/screen-fit/shots/sideways.json`
- `tools/screen-fit/shots/ringcount.json`
- `tools/screen-fit/shots/switchpath.json`
- `tools/screen-fit/shots/daily-hub.json`
- `docs/codex/screen-fit-2026-11-22/daily-report.md`
- Evidence created only under `output/screen-fit/daily-after/`: eight `*-tests.log` files, `source-checks.json`, `layout-source-audit.json`, and `capture-attempt.txt`.


## Round 2 — Claude capture feedback, 2026-11-22

### Evidence reviewed

Personally inspected the supplied Round 1 `sheet-play.png` for all eight puzzles and the hub's `sheet-start.png`, including the phone and portrait iPad views. Also read Claude's `daily-after/report.json`: all **32 play rows for the eight puzzles** have zero page scroll, zero horizontal overflow, no page/step errors, and muted audio. Those are **Round 1 results supplied by Claude**, not measurements of this Round 2 patch. They supersede the earlier report's statement that no after captures existed.

The images confirm the named Shortlist/Tradeoff problems. Additional observed cutoffs: Inbetween's phone lower words, Counterpart's phone active relationship/actions, Second Sense's phone later clue cards, Sideways' phone later strips and portrait column summary, and Ringcount's phone/portrait arc totals. Switchpath's phone/portrait board and action area were visible without the same cutoff in these supplied shots.

### Changes

- **Branding restored on every web size:** removed the layout layer's tagline, hero and phone wordmark-icon suppression. Explicitly restore `.brand-caption` and `.brand-line`, including widths where the original stylesheet also hid them. Each hero references that puzzle's own existing `icon.svg` using a correct URL relative to the shared stylesheet. Eyebrows, titles and subtitles remain visible, with tighter margins. Phone mastheads place the original tagline below the wordmark/tool row. Reduced creator/date-row spacing, tab padding and panel gaps recover some height. Existing font families, palette declarations, brand wording and artwork files are unchanged; type/icon sizes remain responsive.
- **Shortlist, portrait iPad:** nine alphabet columns with 44px rows replace the five-row alphabet arrangement; three candidate columns yield four rows for the twelve words. Console-heading, explanatory-note and deck-note spacing is reduced. This addresses the competing height budgets without reducing key or pencil-button targets. Whether all rows fit at 820×1180 **after branding restoration** still needs Claude's new capture.
- **Shortlist, phone:** the alphabet/scan-history group and candidate list no longer share one scroller. The alphabet uses seven 44px columns. Scan history becomes a single compact row of three results showing letters/counts; full result explanations remain available to assistive technology through the existing text and ARIA labels. The repeated console instruction is visually hidden on phone, retained in the document and How to Play. The word list has its own keyboard-focusable, labeled scroll region with fade edges and end padding. Focusing a candidate is therefore confined to that list's scroll container. The console has an independent height cap/scroll fallback for shorter available viewports, also with fade edges, so the two regions remain separately reachable. No selection, scanning, result or scoring code changed.
- **Tradeoff, phone:** kept full-width readable clues and 44px letters. The inner board retains scrolling where six rows cannot fit; both edges now fade instead of ending abruptly at the controls. Padding under the fade leaves the first/last row clear when scrolled fully to that end. Feedback/undo/nudge remain outside the scroll region. No assertion that all six rows fit simultaneously.
- **Other puzzle scrollers:** the same padded top/bottom fade is applied to the shared puzzle stage, covering the observed Inbetween, Counterpart and Second Sense cutoffs. The mask uses the existing opaque ink variable and transparency; no palette values were added. All original rows remain reachable in the scroll region. Actual fade visibility and last-row clearance require new images.
- **Sideways, phone/portrait:** replaced the strip-height estimate based on total stage height with grid rows that reserve the clue and column-summary heights first. The five strips share the remaining board row with a minimum that preserves 44px controls. When phone content exceeds that budget, the shared fade indicates internal scrolling. Portrait's column summary is now explicitly included in the stage's grid budget.
- **Ringcount, phone/portrait:** the stage now reserves the heading, intro and actual arc-total height before allocating the remaining row to the dial. A minimal `.ring-dial-fit` wrapper supplies that remaining width/height; the circle uses the smaller dimension and preserves its aspect ratio. This replaces the fixed subtraction that let long arc formulas fall below the visible stage. The existing wide-screen side-by-side arrangement remains. All positioning, cut logic and SVG drawing scripts are unchanged.
- **Switchpath:** retained its board/control arrangement from the supplied successful phone/portrait views. It receives the restored branding and shared scroll-edge treatment; check its remaining board height in the next capture.
- **Daily hub, phone:** the header displays the short label `About ↗` without wrapping. The button keeps the exact accessible name **About the collection** through `aria-label`; the original long text remains in the markup for larger widths. The original hub icon is visible beside the wordmark again.

### Checks run after implementation

- All eight existing game test suites: **287 passed, 0 failed, 0 skipped**. Counts remain Tradeoff 20, Inbetween 37, Counterpart 47, Shortlist 43, Second Sense 46, Sideways 41, Ringcount 19, Switchpath 34. Fresh logs: `output/screen-fit/daily-after/round2-*-tests.log`.
- **32** top-level JavaScript module syntax checks passed. No JavaScript or shot files were edited this round.
- **Nine** HTML documents checked for balanced nesting and duplicate IDs. The changed documents retain their original IDs and script imports. Hub About's accessible name is explicitly checked.
- All **eight** restored hero URLs resolve to their existing original icon files. Hash comparison confirms **134** pre-existing CSS, font, icon and puzzle-script/data files are unchanged. The layout stylesheet has balanced delimiters and no literal color or `font-family` declarations. These are source checks, not browser CSS/rendering checks.
- Results: `output/screen-fit/daily-after/round2-source-checks.json`; preservation hashes: `round2-protected-hashes.json`. Before-edit copies of the four edited source files are under `round2-before/` for exact Round 2 comparison.
- `git diff --check` on the Round 2 source/report paths passed.
- **No browser/capture attempt, app/window, server, download, git write or background process this round.** Claude's PNGs and `report.json` were read, not overwritten.

### Claude's next capture checks

Round 2 visual fit is **pending**. Run the existing daily captures and compare against these supplied Round 1 images:

1. At 820×1180, verify Shortlist shows all 26 keys and all 12 candidate words without inner scrolling, including after a scan/cross-off. Verify restored taglines and hero marks at phone and portrait iPad.
2. On phone Shortlist, select letters, scan, mark/restore a candidate, then choose more letters. Confirm the console remains visible independently of the word-list scroll; test its fallback on a shorter available viewport. Check all three compact scan results and screen-reader names.
3. Scroll Tradeoff/Inbetween/Counterpart/Second Sense/Sideways to both ends. Confirm the fade reads as a scroll cue and the final row/actions are fully revealed at the end rather than remaining masked. Check portrait Sideways' column summary and Ringcount totals after two cuts and four cuts.
4. Recheck page overflow, Menu/tool hit targets, dialog Menu stacking and Switchpath geometry at all four sizes after branding restoration. The previous zero-overflow results do not certify these new CSS changes.
5. Confirm the hub's phone About label stays on one line, opens the same dialog and retains the accessible name `About the collection`.

### Round 2 files changed

- `games/daily/screen-fit.css`
- `games/daily/index.html`
- `games/shortlist/index.html`
- `games/ringcount/index.html`
- `docs/codex/screen-fit-2026-11-22/daily-report.md` (this appended section)
- Evidence only under `output/screen-fit/daily-after/`: eight `round2-*-tests.log` files, `round2-source-checks.json`, `round2-protected-hashes.json`, and `round2-before/` source copies.

### Claude follow-up after Round 2 capture

Round 2 forced the tagline and the hero icon on at every width. The published puzzles hide both at
800 px and below (and the wordmark icon at 360 px and below), so `screen-fit.css` now shows them
only where each puzzle's own stylesheet does, and the phone masthead track went from 68 px to 52 px.
Capture `output/screen-fit/daily-verify3`: 108 captures, no errors, no page scroll or horizontal
overflow on any puzzle, audio muted; mean largest-panel area phone 0.738, iPad landscape 0.707,
laptop 0.728, iPad portrait 0.788. No color or font value differs from origin/main.
