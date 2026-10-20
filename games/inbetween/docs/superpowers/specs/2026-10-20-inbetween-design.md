# Inbetween design

## Product

A short daily word game for Alford Family Games. Six real four-letter seed words and six fixed two-letter tiles appear beside six clues. Insert one tile at one of the five gaps in a seed to make the clue's six-letter answer. Keep the seed letters and tile letters in their original order. Every tile is used once.

The opening board is CART→CARPET (PE), PLAN→PLANET (ET), SAND→STRAND (TR), NOTE→NOTICE (IC), FORM→FORMAT (AT), PAST→PASTRY (RY). This differs from Tradeoff's exchange mechanic: players add a limited shared resource instead of exchanging letters already in a grid. Insertion word puzzles are an established genre; no claim of unprecedented invention is made.

## Interaction and scoring

Select a bank tile, select a gap, review the resulting word, and explicitly place it. Preview changes are free. A correct placement locks its word and consumes the tile. A wrong placement counts as an attempt but consumes nothing. Invalid actions and repeated locked-row actions are unscored. Six attempts without hints is a perfect fit. Unlimited attempts; no timer or lives. A nudge reveals a useful tile and gap but requires explicit placement. Revealing ends the board as revealed, never won. Finished states are immutable.

## Experience

Buildless HTML, CSS, and ES modules. Warm paper, violet ink, lavender paired tiles, and a yellow accent distinguish it from Tradeoff. Responsive layout from 320px, keyboard-operable controls, visible focus, meaningful labels and status announcements, and reduced-motion support. Fonts served locally with their licenses. No external runtime dependencies.

Daily dates use America/Chicago with epoch 2026-10-20. Practice has separate progress; today's uncompleted daily is reserved. Local browser persistence, statistics, streaks, spoiler-free sharing, optional sound, and safe clipboard fallback. Corrupt storage must not crash play; storage failure allows unsaved play. Protect the first terminal daily result across browser tabs.

## Content and integration

Curated real vocabulary, deterministic daily collection, distinct six-row boards, and executable validation of each tile's fit. Finite collection repeats; do not imply unlimited fresh editorial content. New standalone Site stays owner-private. Copy portable assets and complete source into the existing private family-game-portal GitHub repository and add cards in both catalogs. Retain existing portal audience and games. NAS deployment requires its documented pull or sync; a GitHub commit alone is not proof of live deployment.

## Boundaries

engine.mjs owns rules, validation, dates, scores and share text. puzzles.mjs owns authored content. app.mjs owns preview selection, DOM, local persistence, dialogs and sound. No authentication, payments, backend, tracking, or account synchronization.
