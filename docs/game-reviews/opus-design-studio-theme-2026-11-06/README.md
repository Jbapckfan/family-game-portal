# Opus design studio — home theme revision

James rejected the disconnected styling of round 1 and explicitly requested the current main page's background and colors. The earlier brief incorrectly imposed a generic cool-blue frame. This revision supersedes that direction.

[Open round 2](https://pal-hand-strategic-competitions.trycloudflare.com/alford-daily/previews/design-studio/?theme=2).

All **91 concepts** remain: four site alternatives, four for each of 18 confirmed keepers, and one for each of the other 15 games. They now share the live home's exact paper #f6f3ec, warm white #fffefa, charcoal #202c35, green #376c58, DM Serif and DM Sans, and the existing logo. Layouts and game pieces vary inside one theme. Game colors that communicate rules remain localized. Keeper rankings and game logic were not changed.

## Actual Opus work

Four scoped Claude Code jobs used actual `claude-opus-5-5` on the existing Max OAuth subscription. All completed successfully. Receipts, prompts and per-team revision notes are included; complete raw streams remain locally with hashes. The task-local design role and isolated workspace were used again; no global agent configuration changed. Opus authored the revised concepts and recommendations. Codex provided the measured theme, gallery integration, limited QA corrections and deployment.

The design references are fresh screenshots, computed browser styles and downloaded CSS from the actual non-ChatGPT public home. Font, logo and stylesheet hashes match the inspected public baseline. The new shared stylesheet is the final stylesheet in every concept. This prevents independent page themes from overriding it.

## Verification

All 91 concepts were checked at 393 and 1440px for exact body background, DM Sans body, DM Serif title, actually loaded fonts, overflow, missing images, failed requests and script errors. No issues remain in the final audit. The four homepage alternatives additionally passed 320, 760, 1100 and 1280px checks (16 checks); a 320px Site B header overflow was corrected. Representative revised screens and the gallery were visually inspected against the live home reference.

The original font bytes are embedded in a shared CSS asset so sandboxed iframe previews load the correct fonts without same-origin or storage access. The rejected cool-theme designs were preserved in Git and in the previous-gallery deployment snapshot. The live gallery uses cache-versioned pages/scripts/styles and a separate round-2 browser choice key. Old review choices and actual game/profile state were not cleared.

See `QA-CORRECTIONS.md` for the small Codex adjustments, and the team notes for prototype limitations. These remain visual prototypes with limited interactions, not a new set of finished game engines. Browser checks do not establish physical-device performance or human approval of the aesthetic.

## Continuing

The live home theme is the baseline unless James explicitly requests a new brand/theme. See `docs/design/HOME-THEME-REVIEW-CONSTRAINTS.md`. Four options means four layouts within that identity. Opus still recommends B, now because it stays closest to the current home rather than offering a competing hardware style. Apply only the designs James subsequently chooses to the production games.
