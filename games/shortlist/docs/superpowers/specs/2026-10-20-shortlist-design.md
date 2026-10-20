# Shortlist design

Build a fast daily word deduction game for Alford Family Games, more challenging than the existing letter-placement games and materially different from Wordle. The user's request authorizes implementation and continues private GitHub/portal delivery.

## Rules

Twelve visible five-letter words contain one secret. Choose two different letters to scan. The result is 0, 1 or 2: how many of those distinct letters appear anywhere in the secret, without saying which or where. Repeated occurrences of a letter count once. There are at most three scans and one final word pick. The final pick can happen early and is explicitly confirmed. Correct wins; incorrect loses. Three scans alone do not end a round. Duplicate/reversed scans are rejected without spending a scan.

Manual pencil marks are free, reversible and do not automatically calculate the answer. One optional counted hint suggests an informative scan from the visible evidence; it does not read the secret. Reveal is a separate terminal result. Unlimited practice has a one-click next puzzle flow.

Every board must be solver-verified to distinguish every one of its twelve candidates within three adaptive scans. This is a guarantee about good strategies, not every arbitrary sequence of scans. The finite prepared collection uses authored common words and no runtime dictionary. Avoid a whole-board answer reveal in help examples.

## Experience and architecture

Buildless HTML, CSS and JavaScript modules; no API or external font requests. `engine.mjs` owns pure scan/pick rules, solver helpers, validated restoration, date selection, statistics and sharing. `puzzles.mjs` contains data. `app.mjs` renders a candidate list, scan controls and scan history. `shell.mjs` owns storage, dialogs, daily/practice navigation, optional sound, sharing and accessibility.

Cream paper with deep blue and yellow-green highlights; same family typography as Counterpart. Candidate words are visible throughout. Results use digits and explanatory text, not color alone. Keyboard letters and Enter complement onscreen controls. Small screens must fit without horizontal overflow. All irreversible picks have a clearly labeled confirmation.

Daily changes at midnight America/Chicago, epoch 2026-10-20. Daily and practice have separate browser saves. The unfinished current daily stays reserved. In-memory fallback survives storage failures and quota errors; sequential stale tabs preserve the first terminal daily result. Restoration recomputes scan counts and validates pick/status. Share text reveals results only.

## Delivery and validation

Publish the registered private Site, save complete source to the private portal repository, and integrate portable assets under games/shortlist. Preserve prior games and cards. Check all puzzle decision trees, invalid/repeated scans, repeated letters, final guesses, hints, corrupted saves, date boundaries and local persistence. Browser-test a complete win, a wrong final pick, practice, hint and pencil interactions, share fallback, and desktop/phone layouts. Live NAS deployment requires an available connection; source integration alone is not a live update.
