# Trail — harder review sample, November 3, 2026

James said “trail seems way too easy,” then “try harder,” approving the proposed separate 4×4 sample. This is a playtest of the harder direction. Retention, enjoyment score and relative rank remain undecided.

## What changed

The sample uses nine of sixteen tiles, leaving seven decoys. The opening clue is indirect; an optional definition is counted in the result. Multiple plausible routes survive through five letters before the complete solution becomes unique. A revised top row avoids spelling out the answer's opening. The word itself is familiar; extra vocabulary obscurity is not the difficulty mechanism.

The interface has large blue tiles, numbered selections, connecting lines, nine letter spaces, backtracking, Undo/Clear and a checked-guess history that stays open while playing. Touch, arrow keys and Space/Enter work; Backspace undoes and Escape clears. Touch selection explicitly restores keyboard focus, including in WebKit. Clearing or undoing the final tile returns focus to the grid. A stable live region announces the current trail.

There is no strike limit; repeated words do not add a check. Saved wrong-guess history is bounded at 1,000 distinct entries, with a reserved final record for the correct answer. Reaching that bound does not prevent a solve, and the interface no longer promises unlimited stored checks. Reveal requires confirmation and is not recorded as a solve. Result text excludes the answer, clue and route, and records definition use. Clipboard failure leaves copyable result text visible.

The default Trail entry opens this sample during review. “Original daily” opens `#daily` in the same tab. The original 200 puzzles, daily engine exports and saved daily records are preserved. Preview storage is `deepseek-trail:4x4-preview:v1`. This sample is not a replacement six-month content bank.

## Verification

- Eleven focused engine tests passed: five original Trail tests, including all prepared paths and original puzzle hashes; six preview tests for independent path enumeration, row boundaries, backtracking, distinct checks, completion, reveal and invalid saves.
- Eighteen isolated browser checks passed across Chrome and WebKit. Each engine completed touch and keyboard solves, restored progress and wins, checked wrong/repeated guesses, switched input modes, exercised definition/reveal/cancel and clipboard fallback, preserved original daily saves, handled corrupt/unavailable storage, and checked layouts at 320, 393 and 1200 pixels.
- Every tested tile met a 44-pixel minimum target. The connecting SVG and tile centers agreed within one pixel. Screenshots were visually inspected, including selected paths on the narrow phone layout.
- An independent trie search of 57,245 distinct nine-letter entries from three pinned local lexicons found only the intended word traceable on the final board. This supports this sample's answer coverage; it is not proof about every English dictionary. See [lexicon evidence](evidence/lexicon-scan.json). The report contains the answer.
- Full collection suite: **978 passed, zero failures or skips**. The unrelated Lasers 3D suite was excluded, as in the previous collection checks.
- Native web resource verification: **33 game entries, two shared runtimes, 304 matching files**. No native binary was rebuilt or installed.
- The existing visible Trail tab was reloaded and its fresh sample inspected at 0/9 letters. The controller retained two task tabs. No move or hint was entered in James's preview or daily round.

Reproduce with:

```sh
node --test scripts/trail-preview.test.mjs games/deepseek-trail/engine.test.mjs
node scripts/trail-preview-lexicon.mjs
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/alford-word-controls-browsers node scripts/trail-preview.playwright.mjs
node scripts/sync-ios-web.mjs --check
NODE_PATH="$PWD/packages/kimi-pebbles/node_modules" node --test $(rg --files games scripts -g '*.test.mjs' -g '!games/lasers-3d/**')
```

Initial browser failures are retained locally. Two were missing navigation waits in the daily-isolation test. The WebKit mixed-input failure was a real focus defect: after a tap, Backspace could act on browser history. Explicit tile focus fixed it. New regressions verify the review-driven disabled-button focus handoff and history toggle preservation.

## Requested model reviews

These are static supplied-source reviews, not browser playtests. The three supplied files and their hashes are recorded in each request receipt. Reviewers saw the first sample before the subsequent grid/focus/history/check-limit improvements; they did not certify the final build.

- **Opus 5.5:** no blocker or critical issue. Flagged the obvious opening letters, focus loss after disabling Undo/Clear, history collapsing on each render, and missing current-word announcements. These were addressed and verified. It predicts a stronger routing challenge, but warns that an experienced solver could still find it easy. [Full review, with spoilers](MAKER-Opus__review.md).
- **Gemini 3.8 Flash High:** no blocker; considered the clue fair and predicted a meaningful increase in difficulty. Also identified history collapse and disabled-button focus handoff, both fixed. Its assertion that no other English word exists is narrower than our evidence supports; retain the pinned-lexicon qualification. [Full review, with spoilers](MAKER-Gemini__review.md).
- **Kimi k3.1:** completed successfully through the installed subscription CLI. No blocker; judged the clue fair and identified the same focus issue. It also found that the 1,000-entry history bound could prevent a subsequent correct answer from winning. The checker now reserves a final winning record, restoration accepts that valid terminal state, and a regression fills the history with actual legal, distinct paths before submitting and restoring the win. [Full review, with spoilers](MAKER-Kimi__review.md).
- **DeepSeek:** no newly verified free reviewer route was used. The game’s creator label is not a new review or endorsement.

Opus also suggested exempting a possible technical word from checks. That suggestion was not adopted: it was explicitly uncertain, absent from the three searched lexicons, and not established as an alternative answer to the clue. Incorrect paths are described as not fitting the clue, not as universally invalid dictionary words. Checks remain consistent across guesses. No numerical fun prediction or user rating was invented.

Human difficulty and enjoyment, physical iPhone play, and a full bank for this new variant remain unverified. No production site, ads or purchases were activated.
