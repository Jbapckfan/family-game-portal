# Sprout — living plant presentation

James: “make it look like a really cool growing plant, it is so plain and boring right now, but is challening”. Record criticism of the visuals and recognition of the challenge; no keeper verdict or numerical score was supplied.

The word ladder is now a botanical climber with shaded, veined leaves, a curved stem, a ceramic seed bed and an eight-letter white flower. Each accepted word adds stem and leaf growth. The young plant starts in a compact viewport; the garden expands with accepted progress. An unobtrusive 3–8 progress rail keeps the full goal visible. Letter rows remain readable, active letters can be removed, and the separate racks and typing field are retained.

Growth is derived from the accepted word stack, not guesses. SVG artwork is decorative to assistive technology. Typing does not replay growth; reload shows the saved stage immediately; undo/restart shrink to actual progress. Lost/revealed rounds show a continuation in blue without receiving the completion flower. New growth animates once, with reduced motion supported. No new libraries, raster assets, network requests, puzzle data, dictionary edits or save-schema changes were introduced. The collection background remains intact.

Validation: 15 combined Sprout/Territory engine tests passed. Chrome and WebKit each completed Sprout by keyboard and touch, checked every visible growth stage, no growth on typing and completed-result reload. Additional checks covered reduced motion, undo/restart, hint-caused loss and reveal without a false bloom. Seed and bloom layouts were checked at 320, 393 and 1280 pixels. Phone seed/mid-growth/bloom captures were visually inspected. Strict native web-bundle parity passed for all 33 entries and 308 files; no native binary was installed.

Published privately from Site source `ae405e555392d1d528c9636257ea09f65f2bcafc`; deployment `appgdep_6aede49728d881919ba9847f0be3f91c` succeeded. The native web assets are copied and hash-checked; this does not install a new native binary.

Hosted release checks at 393 and 1280 pixels verified the exact app/CSS source hashes, visible updated UI, no horizontal overflow and no page errors. The offline worker intentionally pins an open offline edition until all collection tabs close; a simple refresh may retain that edition. Close and reopen the Alford Daily tabs to activate a downloaded update when necessary. No skip-waiting behavior or vocabulary migration rule was changed.

A focused motion probe measured leaf width growing from 3.60 to 88.75 pixels and the flower opening from 13.08 to 70.50 pixels, confirming actual animation rather than only CSS class presence. This used an isolated earlier puzzle, not James’s current round.

James subsequently said the UI “is still weird” and requested several more options. Treat this implemented visual direction as unaccepted. [Three natural-plant composition mockups](ui-options-2026-11-06/index.html) are available for selection; the game rules and challenge remain intact.
