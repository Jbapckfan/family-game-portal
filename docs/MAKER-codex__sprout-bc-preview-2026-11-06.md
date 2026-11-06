# Sprout B/C playable preview — November 6, 2026

Approved scope: James requested playable B (Letter branches) and C (Living word vine) after choosing these image-model concepts. This is an isolated visual practice preview. Production Sprout, native code, profiles, rankings, feedback, and hosting are not edited here.

Implementation plan:
- Use the canonical 211-board Sprout bank, expanded engine and practice calendar through a memory-only session. No localStorage or account writes.
- B: real leaf images carry individual letters on complete curved word branches. C: shaded green letterforms themselves form the ascending vine, with attached leaves. White ceramic planter and earned final flower use the supplied generated assets.
- Stable input controls support keyboard/caret and a touch rack, all current letters plus exactly one soil tile, canonical hints/wilts/undo/restart, explicit reveal state, New practice, and B/C switching without losing or faking progress.
- Animate only newly accepted growth. Keep reduced-motion support. Test full solves, touch, keyboard, focus, states and responsive widths using isolated Playwright contexts and source routing; no local server or real browser profile.

Implementation and verification are recorded below.

## Implemented files and behavior

- `previews/sprout-bc/index.html`: dedicated practice preview, B/C switch, collection backlink, controls.
- `previews/sprout-bc/style.css`: pale cool-blue/white/navy/green responsive layout with touch targets and reduced-motion support.
- `previews/sprout-bc/model.mjs`: canonical `createSession` with an injected in-memory Map and immediate `practice()` selection; `createExpandedState` and the full existing bank. No mounted common runtime, localStorage, account activity, feedback, or network calls.
- `previews/sprout-bc/plant.mjs`: SVG curved stems, separate real leaf letter surfaces in B, layered shaded/veined italic letterform vines in C; generated planter/flower assets; explicit accepted-growth animation and typed-tip updates. SVG viewBox cropping uses the original leaf bitmap without modifying its pixels.
- `previews/sprout-bc/app.mjs`: same practice state across views, stable keyboard input node/caret, touch tile selection, canonical submit/clear/delete/undo/restart/hint/reveal/new practice. Reveal/loss never create an eight-letter bloom. Replay last growth only replays an already accepted branch and does not change game state. Offscreen mobile accepted growth scrolls into view before the main unfurl.
- `previews/sprout-bc/assets/{leaf,planter,flower}.png`: copied original generated transparent artwork, verified without black backgrounds in actual browser screenshots.

Default and `?view=b` open B. `?view=c` opens C. Switching views keeps the round. Reloading starts fresh ephemeral practice.

Generated asset provenance is the supplied `.codex/generated_images/01a184ad-a033-7d91-b2be-6b497ba3be28/` directory: leaf `exec-b01f0dda-f0f2-448c-ac16-81f92fc6c277.png`, planter `exec-847b8a99-57c5-4cdf-a9e4-ee21a4985d71.png`, flower `exec-da120377-01cd-48d9-b3df-1306fbb7ce19.png`.

## Verification

All evidence and reproducible checks are under ignored `output/MAKER-codex__sprout-bc-20261106/`.

- Chromium (installed Chrome channel) and WebKit 26.6: full keyboard and full touch solves of **both** B and C; every growth stage through the earned eight-letter bloom.
- Both engines: measured changing transforms for B leaf unfurl and changing clip geometry for C vine growth; screenshots during motion and at rest. No fresh growth on view switching. Replay exercised without progression changes.
- Both engines: caret and input focus after a middle-of-word edit; clear/delete; actual listed dead-end wilt; Undo/Restart penalty preservation; five hint/restart penalties reach loss; explicit reveal has no bloom; reduced-motion has no running plant animation.
- Both engines: 320, 393 and 1280 widths; no horizontal page overflow at mobile sizes; every letter-rack target at least 44×44 CSS pixels; empty localStorage after play. No JavaScript page errors.
- `model-check.mjs`: all 23 currently selectable practice candidates (as of the check date) stay outside today and the canonical future reservation list; preview win leaves daily statistics empty. Full imported bank contains 211 boards.
- Canonical `node --test games/claude-sprout/engine.test.mjs`: 8/8 tests pass, including all prepared routes, strict letter conservation, traps, wilts, hints, restoration and shared-session completion.
- `node --check` passes for app and plant modules.
- Visual review corrected initial planter/caption overlap, disconnected joins, overly rigid C letterforms and empty-tip dots. Final images were inspected through local image viewing; the parent handles visible public preview and publication.

Commands:

```sh
node output/MAKER-codex__sprout-bc-20261106/verify.mjs
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/alford-word-controls-browsers BROWSER=webkit node output/MAKER-codex__sprout-bc-20261106/verify.mjs
node output/MAKER-codex__sprout-bc-20261106/model-check.mjs
node --test games/claude-sprout/engine.test.mjs
```

`verification.json` and `webkit/verification.json` contain final six-group pass results and sampled motion values. Representative captures: `B-growing-393.png`, `C-growing-393.png`, `B-bloom-1280.png`, `C-bloom-393.png`, `B-loss-320.png`; WebKit equivalents are in `webkit/`.

No production edits, server launch, real-user browser access, commit, push, deployment, model download, or paid API use was performed by this preview task. Actual physical iPhone visual/touch acceptance remains for James; automated WebKit touch is browser evidence only.

## Public delivery

Published to the existing friend-sharing site in build714ea7a69726c446. B and C are playable at https://pal-hand-strategic-competitions.trycloudflare.com/alford-daily/previews/sprout-bc/?view=b and ?view=c. All 368 files matched public HTTPS hashes; both live designs accepted a word and visibly ran Replay animations, with no POSTs or page errors. Production account and game data remained untouched.
