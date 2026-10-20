# Inbetween

Six words. Six pairs. Find where they fit.

Inbetween is a daily word game for Alford Family Games. Each board gives you six real four-letter words, six clues, and a shared bank of six ordered two-letter tiles. Insert one tile into each word to form its clued six-letter answer. Every pair is used once; the original letters and the inserted pair keep their order.

## Play

1. Pick a two-letter pair from the bank.
2. Tap a gap before, after, or inside a seed word to preview the result.
3. Select **Place pair** to confirm. Correct words lock; wrong fits count as an attempt and return the pair to the available bank.

Preview changes are free. Six correct placements without a nudge earn a perfect fit. There is no timer or life limit. A nudge shows one useful tile and gap but still requires confirmation. Reveal ends a board as revealed, never won.

For example, `SING + PR → SPRING`: insert PR after the first S to answer “Season of fresh starts.”

## Daily edition

The daily date uses **America/Chicago**, with puzzle 1 on October 20, 2026. This edition has **60 prepared boards** and repeats after the collection is exhausted. Practice uses the same collection with separate saved progress. Today's uncompleted daily is reserved from practice.

The editorial bank has **174 curated transformations**, **100 distinct four-letter seeds**, and **96 different letter pairs**. Every board has six unique seeds, answers, and pairs, at least three insertion positions, and an independently correct home for every tile. No transformation repeats within six daily boards, including the collection's wraparound. The labels Gentle, Medium, and Tricky describe increasing numbers of internal insertions; they are not based on player timing studies.

## Development

Buildless HTML, CSS, and JavaScript ES modules. Serve this directory over HTTP. There are no external runtime services or package dependencies.

```sh
npm test
npm run check
node scripts/generate-puzzles.mjs
```

- `engine.mjs`: pure rules, validation, hints, daily dates, statistics, and sharing.
- `puzzles.mjs`: the complete prepared puzzle collection.
- `app.mjs`: preview interaction, DOM, persistence, sound, and dialogs.
- `scripts/generate-puzzles.mjs`: curated word/clue bank and deterministic collection generator.
- `tests/`: rules, content integrity, and regressions for actual application persistence functions.

Tests cover every board's 64 possible subsets of already-completed rows, confirming all **3,840 intermediate states** can finish. They also cover corrupted saves, denied storage, quota failures, stats recovery, stale tabs, daily midnight/DST behavior, and spoiler-free results. Browser QA is recorded in `docs/verification.md`.

## Storage and access

Progress and scores use localStorage under `inbetween:v1:`. There is no account system or cross-device synchronization. When storage is unavailable or full, the current session keeps a memory fallback and displays a warning; reloading the page can lose unsaved progress. Missing statistics for a valid completed daily are reconstructed from that saved game. A stale tab checks the stored terminal daily before saving, and open tabs synchronize via storage events.

Fonts are served locally under their included SIL Open Font License terms. Optional sound uses Web Audio and starts off. The game makes no third-party runtime requests, records no analytics, and requires no network service after assets load.

All runtime URLs are relative, so the files also work at `/games/inbetween/` in the family portal. Portal copies link back to the catalog and to Tradeoff. The separate standalone ChatGPT Site is owner-private; the NAS portal retains its existing home-network audience.

## Related games

Word insertion is an established puzzle mechanic. [Squeezy](https://imsqueezy.com/) and [Meldle](https://meldle.com/) are related games. Inbetween combines six real seed words, six semantic clues, and a shared bank of ordered pairs; it does not claim to have invented word insertion or demonstrated audience retention.
