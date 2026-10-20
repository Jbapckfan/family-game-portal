# Counterpart design

Build a more challenging daily word game for Alford Family Games, focused on meanings and relationships. The user's request authorizes implementation and continues the previous private GitHub/portal delivery workflow.

## Rules

Five rows show a directed relationship A → B. Ten shared words supply the corresponding C → D for each row. Every word is used exactly once. A correct ordered pair locks the row and reveals a plain-English explanation. A wrong valid submission costs a check and consumes no words. Drafts and changes are free. Five checks without hints is perfect; there is no loss limit or timer. Each row offers one counted hint that reveals the relationship type. Revealing ends the board without a win.

Direction, transfer of an abstract relationship, and competing words in a shared bank provide difficulty. Synonym or antonym pairs with equally valid reversal are excluded. Authored boards are reviewed for alternative plausible pairings. Content is a finite collection of 30 curated boards with original explanations and common English vocabulary.

## Experience and architecture

Buildless HTML, CSS and JavaScript modules, with bundled licensed fonts and no runtime service dependencies. `engine.mjs` owns pure rules, validated restoration, date selection, statistics and sharing. `puzzles.mjs` contains authored data. `app.mjs` owns selection and rendering. `shell.mjs` owns storage, dialogs, daily/practice navigation, optional sound, sharing and accessibility.

Warm cream paper, terracotta ink, serif headings, generous word buttons. A desktop guide explains the mechanic using an example outside the opening board. Phone layouts preserve legible words, visible focus and comfortable tap targets. All scoring actions require explicit confirmation. Reduced motion is honored.

Daily changes at midnight America/Chicago, epoch 2026-10-20. Browser-local saves and records; practice is independent. The unfinished current daily is reserved from practice. Failed storage retains in-memory progress and shows a warning. Sequential stale tabs preserve the first terminal daily result. Saved state is validated, never trusted as a win. Share text does not expose answers.

## Delivery

Private Site at the registered Counterpart project, complete source in the existing private family-game-portal repository, and a relative-link portable copy under games/counterpart. Preserve all existing portal cards and files. Do not claim the NAS is updated without live verification.

## Validation

Engine tests cover invalid and duplicate actions, correct order, hints, reveal, corrupt saves, terminal immutability, date boundaries, statistics and spoiler-free shares. Content checks cover shape, distinct words, answer uniqueness, coverage and all 32 solved-row subsets per board. Human review addresses semantic validity beyond what structural tests prove. Browser checks exercise a wrong check, a complete win, hints, practice, restoration, and narrow layouts.
