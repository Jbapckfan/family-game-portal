# Ringcount final review (static reading only)

I read the supplied source only. I did not run tests, render cards or play.

## Blockers

**No Critical issues found.**
- **Data integrity:** the save format and record are unchanged. `buildShareResult` returns a frozen, allowlisted snapshot taken when the dialog opens.
- **Spoilers:** the renderer gets no board, target or cut data, and its geometry is fixed.
- **Daily vs practice:** practice cannot carry a daily number or date.

**Important 1: keyboard focus is lost on Share image** (`share-card.mjs`, share click handler)
- **Trigger:** with a keyboard or screen reader, activate "Share image ↗", then cancel or complete the share sheet.
- **Cause:** `share.disabled=true` runs while the button has focus. Chromium and WebKit move focus to `<body>` when a focused button is disabled. `finally` re-enables the button but never restores focus.
- **Effect:** after the sheet closes, the user's place in the dialog is gone. This is the same class of bug as the wrong-check focus loss you just fixed.
- **Fix:** don't disable during sharing. Use an `inFlight` flag, or `aria-disabled` plus an early return, so focus stays put.

**Important 2 (likely, needs measurement): "Revealed" may collide with the ring on the square card** (`drawShareCard`)
- **Trigger:** a revealed result in square format.
- **Geometry:**
  - The inner edge of the stroke is at r = 160 − 12.5 = 147.5.
  - The text baseline is at center+7, so cap tops sit near center−45.
  - At that height the inner chord is about 2·√(147.5² − 45²) ≈ 281 px.
- **Text width:** "Revealed" at 74px is about 275 px in Times-like serifs. DM Serif Display is somewhat wider, so the "R" and "d" probably touch or cross the stroke.
- **Portrait is fine:** its chord is about 339 px.
- **Gap in testing:** your metrics test only checks a won card, and only the clearance above the ring.
- **Fix:** extend the real `measureText` test to check text width against the inner chord for both statuses and both formats. Shrink the font if needed, e.g. 60px or a fit-to-width loop.

## Minor suggestions

1. **The four arc gaps don't show.**
   - Each 6° gap is about 16.8 px (square) or 19.7 px (portrait).
   - The two round caps add 12.5 px each, so 25 px total, and close the gap.
   - The won card reads as one ring with color seams. The revealed card, all one color, is a solid ring.
   - Fix: use `lineCap='butt'`, or widen each gap to about 10°.
2. **Font loading.** `document.fonts.ready` doesn't load faces that only the canvas uses, such as italic or 600-weight variants the page may never use.
   - The first portrait draw could use a fallback font while a later square draw doesn't.
   - Fix: `await Promise.all([...].map(f=>document.fonts.load(f)))` before drawing.
3. **Stale error message in `prepare`.** The `catch` block doesn't check `own!==generation`. A failure from a superseded format can overwrite the status of the newer one.
4. **Silent failure in `openResultShare`.** It throws before `openDialog` if the result is invalid, so the click does nothing and an error goes uncaught. Wrap it and fall back to the text caption or a notice.
5. **Canvas label reads emoji aloud.** The `aria-label` copies the caption, so VoiceOver says "green square" four times. It also leaves out the visible headline. Build a dedicated plain-language label instead, e.g. "Ringcount Daily 10, October 29 2026: perfect circle, 1 check, 0 hints."
6. **Ring numbers are confusing to screen readers.** `aria-label` on a role-less `<span>` is prohibited in ARIA 1.2 and is often ignored.
   - Virtual-cursor reading then hits `4<small>1</small>` and can read it as "41".
   - The gap buttons already carry the numbers, so mark `#ring-numbers` `aria-hidden="true"`. Alternatively, give each span `role="img"` or visually hidden text.
7. **Manual caption select on iOS.** `caption.select()` on a readonly textarea is unreliable in iOS Safari. Add `setSelectionRange(0, caption.value.length)`.
8. **Missing button types.** "Share", "Download" and "Copy caption" have no `type="button"`, unlike the format buttons. They're harmless now, but would submit if the dialog content is ever wrapped in `<form method="dialog">`.
9. **Weak midnight test.** It only re-renders an existing snapshot. It doesn't test reopening the share dialog after midnight, which is the case where the `api.daily` getter semantics matter.

## Declined to judge

- Whether the CSS `@font-face` family names exactly match `"DM Serif"` and `"DM Sans"`.
- Whether `api.daily` returns the played day or the current day after midnight. This depends on the shell, which wasn't supplied.
- Engine `checkedSets` key ordering.
- Blob download inside WKWebView if the native bridge ever fails and falls through to the browser path.
- Physical VoiceOver/TalkBack behaviour, real social-app handling of files plus text, and the core game's depth.

## Verdict

**Approve with two fixes, scoped to the browser share-card flow and the a11y changes in this round.**
- Fix the share-button focus loss.
- Measure, and fix if needed, the square revealed-card text width.

I found no correctness, data-integrity or spoiler-leak bugs in the supplied code. Native image sharing remains out of scope, as you stated.
