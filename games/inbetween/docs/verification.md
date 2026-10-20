# Inbetween verification — 2026-10-20

## Automated checks

- 24 engine tests: placement/scoring, invalid inputs, locks, hints, reveal, damaged saves, dates, DST, statistics, and spoiler-free sharing.
- 6 content tests: editorial integrity, deterministic regeneration, 60 unique boards, the exact introduction, safe tile assignments, and variation across the whole repeating edition.
- 4 application persistence regression tests: blocked storage, quota failures with readable stale saves, statistics recovery, and sequential stale-tab terminal preservation. These execute the actual app with the real engine and content; browser services are stand-ins.
- Every board completes from all 64 subsets of already-solved rows: 3,840 intermediate states.
- Syntax checks for all runtime modules.

## Browser checks

Tested in the supported Chromium preview against the final content collection:

- Daily completed in six confirmed placements, with six locked words and a perfect result.
- Previewing a fit did not increment attempts.
- A wrong confirmed fit incremented attempts and left all six tiles available.
- A nudge selected and previewed the correct placement without placing it; confirmation then completed the row.
- Revealed practice remained revealed after reload, with its attempt and hint counts retained.
- Restarting a finished practice reset its board and counters without affecting daily records.
- Statistics displayed one solved daily, a perfect fit, and an average of six attempts.
- Clipboard denial opened selectable, spoiler-free share text.
- A second tab restored a partially completed daily and received completion through a storage event.
- Phone layouts were inspected at nominal 320, 390, and 480px widths. A bank-button min-content overflow at the smallest width was fixed; the final document scroll width matches its available width, including with a vertical scrollbar.
- Practice opens with its bank visible and focus restored to the bank. Dialog controls are keyboard-operable; the design honors reduced motion.

## Review fixes

Independent review identified and the implementation corrected: practice scrolling below the required bank; insufficient contrast in small functional text; loss of session progress when storage is denied; quota failures replacing newer memory state with stale persisted state; and missing statistics after a partial final save. Four regression tests cover the storage cases.

## Limits

No physical iPhone/Safari device was connected. The finite 60-board edition repeats. The difficulty labels are editorial, not calibrated from player data. Storage is local to each browser and origin, so the standalone Site and the NAS portal maintain separate scores. First-terminal protection is checked before writes and through sequential cross-tab tests; the application does not claim transactional database semantics for simultaneous localStorage operations.

The private GitHub repository and standalone deployment are verified separately at release. NAS live deployment requires an authorized online device or the documented git pull; a GitHub push alone does not prove the NAS changed.
