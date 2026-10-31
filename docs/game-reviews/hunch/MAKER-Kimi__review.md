## Hunch static review

**Scope/model:** Kimi in Kimi Code CLI; no more specific model identifier was exposed. I inspected all 18 manifest-listed artifacts: Hunch source, shared session/stats/integration code, CSS, answer bank, supplied audit, and both screenshots. I did **not** play Hunch, execute code, run tests/builds, or modify files. Imported modules outside the supplied set were not inspected.

### Verified from source

- Five-letter answer, six guesses, no timer; two-pass evaluation correctly handles duplicate letters (`engine.ts:24`).
- Restored evaluations and win/loss state are recomputed rather than trusted from storage. Historical duplicate guesses remain loadable (`progress.ts:14`).
- Keyboard colors retain the best-known result, while gray explicitly means “absent / no additional copy”; symbols and accessible labels supplement color (`HunchBoard.tsx:36`).
- Daily writes have input/write guards against stale sessions. This is promising statically, but simultaneous-tab behavior remains untested.
- Sharing currently produces a spoiler-free text grid with score and hint indicator (`engine.ts:41`).
- The supplied audit—not independently rerun—reports 937 unique answers, full dictionary/common-list coverage, 182 distinct dated selections, and 59,049 duplicate-evaluation comparisons matching its oracle.

### Five highest-value changes

1. **Make play feel fair without adding mechanics.** Block a repeated submitted word before charging a guess, with clear feedback; retain duplicate acceptance during restore. Confirm before consuming a hint and explicitly say it reveals **membership, not position**, with cancellation free (`useHunch.ts:227`, `useHunch.ts:256`).
2. **Fix completion trust.** Celebrate and auto-open results only for a freshly completed round, not a restored one. Freeze the played date and expire the displayed streak after missed days while preserving saved stats (`HunchPage.tsx:31`, `HunchPage.tsx:44`, `useHunch.ts:192`).
3. **Add the required broader vocabulary as a Hunch-only bundled lexicon.** Use the proposed 17,946-word acceptance list, preserving all existing words and every answer/calendar index. Do not treat broader acceptance or common-list membership as evidence of answer familiarity or fun.
4. **Improve readability and instruction clarity.** Move Hunch’s mustard/beige identity toward blue/teal; enlarge the 9–12px category, subtitle, legend, Enter, and footer text. Retain the status symbols and adequately sized touch targets. Correct help’s duplicate-letter explanation and add a clearly labeled independent repeated-letter example (`index.css:176`, `HunchHelpModal.tsx:29`).
5. **Complete sharing for Daily and Practice.** Provide native-first text sharing plus frozen portrait/square PNGs, direct-gesture file share/download, and truthful copy/manual fallback. Include played date, No./Practice, actual `n/6` or `X/6`, clue use, and status-only grid—never answers, guesses, hint letters, or URLs (`HunchWinModal.tsx:26`).

### Defects

**Critical:** None confirmed statically.

**Important**

- **Completed win restored:** every reload can replay confetti and reopen results because restoration sets `finished`, which drives both effects (`HunchPage.tsx:18`, `HunchPage.tsx:31`).
- **Repeated valid word submitted:** it consumes another guess and can cause a loss; no repeat check exists (`useHunch.ts:227`).
- **Hint pressed:** the limited hint is consumed immediately, before confirmation; “Reveal a letter” does not explain that position remains unknown (`useHunch.ts:256`, `HunchBoard.tsx:184`).
- **Revisiting after missed daily games:** `loadGameStats` can display an old nonzero current streak because expiration is not applied to the local display (`useHunch.ts:76`, `stats.ts:24`).
- **Clipboard fallback resolves unsuccessfully:** Hunch still displays “Copied!” because it ignores the result of `copyText`; the fallback implementation itself was not supplied (`HunchWinModal.tsx:31`).
- **Sharing a Practice result or requesting an image:** neither Practice sharing nor PNG sharing exists.
- **Duplicate-letter help:** “Gray = not in the word” contradicts actual no-extra-copy behavior; the example has no repeated letter (`HunchHelpModal.tsx:31`).

**Minor**

- **Viewing a previous round around rollover:** the header calls `dateLabel()` for the current date rather than formatting `state.dayNumber` (`HunchPage.tsx:44`).
- **Losing Practice:** “Better luck tomorrow” is shown despite an immediate new-round action (`HunchWinModal.tsx:80`).
- **Premium help:** “one letter per round” conflicts with unlimited premium hints (`HunchHelpModal.tsx:40`, `useHunch.ts:259`).
- The phone image confirms small secondary/key text and a mustard-heavy presentation, contrary to the stated visual preferences.

### Risks and remaining hypotheses

- Lexicon expansion should be additive and Hunch-only; changing answers or selectors would invalidate the daily/calendar preservation requirement. Exact WWF/NASPA parity and licensing were not verified.
- Larger type needs narrow-phone checks to prevent keyboard/header wrapping.
- Fresh-only celebration must not rewrite completed results or erase earned fresh confetti.
- PNG/native sharing needs frozen snapshots and truthful failure states; unsupported native sharing must fall back without claiming success.
- Physical/custom keyboard input, double submission, stale-session adoption, completed rounds, and truly simultaneous tabs still require runtime testing.
- Human answer familiarity, difficulty, engagement, and fun remain unknown. No Hard Mode or new puzzle mechanics before James playtests.

### Subjective current-state predictions

These are **my static predictions, not James’s ratings or measured player feedback**:

| Dimension | Prediction /5 |
|---|---:|
| Fun | 3 |
| Clarity | 3 |
| UI | 2 |
| Replay | 3 |
| Shareability | 2 |

Hunch has a sound core and useful Practice replay, but completion polish, readable presentation, and trustworthy sharing are the clearest opportunities.
