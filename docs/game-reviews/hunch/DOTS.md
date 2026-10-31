# Hunch black/white dots — October 31, 2026

James said **“still seems very similar to wordle, keep it, maybe do white and black dots lie in mastermind. go to next game.”** Hunch stays a keeper. He chose to move on rather than pursue a larger redesign; no numerical score, explicit replay answer or relative keeper order was supplied.

Each accepted guess now has a separate group of black exact-match dots, white misplaced-match dots and dashes for unused matches. Dots are sorted by status, so their sequence does not identify individual letters. The letters and keyboard stay neutral; accessible feedback announces only totals. The independent APPLE/ALLEY example gives one black dot and two white dots, accounting for the extra L. Help, result preview, captions, PNGs and the icon use the same black/white presentation.

The original duplicate evaluator, answers, calendars, six-guess limit and saved-round schema are unchanged. Existing rounds remain loadable. A membership clue now excludes only previous clue letters: the player cannot infer individual letters from grouped feedback, so excluding hidden internal green/gold letters would incorrectly treat them as known. Consent, free cancellation, one-clue limit, retained assistance and fresh-only celebration remain.

Answers, guessed words and clue letters remain excluded from exported snapshots; status rows are canonical grouped rows rather than original position evaluations. The screenshot and actual downloaded PNG evidence are in `dot-evidence/`. No fully original-mechanic or complete departure from Wordle/Mastermind is claimed. James accepted keeping the underlying game.

New regressions cover feedback permutations producing identical grouped rows, duplicate-copy counts, no per-letter attributes or labels, neutral keyboard, aggregate-safe clues and dot-only exports. Earlier per-position accessibility fixtures were updated for the deliberately changed information model. The final Opus review of Circuit and Hunch found a confirmation-focus issue and pointer Undo ownership issue; both were reproduced before the fixes, then checked with real React and browser flows. Hunch confirmation now captures and restores the real opener while initially focusing cancellation; its visible and accessible clue names agree.

The [Circuit delivery report](../circuit/REPORT.md) and evidence summary record the shared final build and verification. Circuit is next and remains pending James’s verdict. Hunch’s numerical/ranking fields are unchanged.
