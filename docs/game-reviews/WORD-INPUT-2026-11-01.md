# Touch and keyboard controls

James requires word games to work with touch and keyboard entry where appropriate. He also reported stretched formatting while reviewing Twin Hive.

Implementation plan:

- Inventory all word games, including Tradeoff and Inbetween, whose catalog group is “classic.”
- Exercise the actual rendered controls with browser touch events and keyboard events. Use native text entry for free-form words; use focus and Space/Enter for choices, arrangements and positional paths.
- Reproduce and fix broken transitions between touch and keyboard, preserving normal button activation, text selection, composition and dialog behavior.
- Constrain Twin Hive's tile proportions and board width. Preserve readable letters and usable targets at phone widths.
- Run affected regressions and collection checks, synchronize the bundled web assets, inspect the existing preview, and save to the private feature branch.

Review focus: mixed touch/typing, duplicate-letter choices, native Enter on focused controls, composition/modifier keys, and narrow phone layouts. Browser touch emulation does not certify a physical phone's software keyboard.

Gameplay rules, puzzle calendars and earned results are outside this change.

## Delivered changes

- Twin Hive has a narrower frame and centered rack. Tiles retain a regular hexagon aspect ratio, with usable touch targets at narrow phone widths. Delete, Clear and Add word stay in one orderly row.
- Twin Hive accepts physical typing immediately after a rack tap, retaining the edit position and normal native-field behavior. Touch tiles do not force the phone keyboard open. The completed round removes its editing shortcut.
- Keystone, Tumbler and Claude's Tangle preserve native Enter activation for a focused letter/bead. Hardware typing transfers focus to the board, where Enter submits the current word. Composition and modifier keys do not invoke these game shortcuts.
- Saved rounds, word acceptance, scores and puzzle schedules retain their existing rules. The five matching web assets in the native bundle are synchronized.

## Input coverage

| Interaction | Games | Tested input |
|---|---|---|
| Word/clue selection and arrangement | Counterpart, Shortlist, Second Sense, Sideways, Tradeoff, Inbetween, Quartet, Spare, Splice | Touch controls and keyboard focus/Space; existing engine/UI suites cover arrangement and submission |
| Physical letters and touch tiles | Cairn, Morph, Hunch, Circuit, Cipher, Split, Syntax Siege | Touch entry and physical-letter events |
| Native word field, with tile entry where offered | Twin Hive, Rung, Quadra, Dovetail, Sprout, Keystone, Tumbler | Touch focus plus text insertion; physical typing and editing |
| Position-sensitive paths | Kimi's Tangle, Trail, Claude's Tangle | Touch selections and keyboard focus/Space to choose exact copies |

Second Sense also retains its native word field. Claude's Tangle additionally accepts physical letters for the next matching bead; choosing an exact copy remains possible with focus/activation.

These are basic input checks across all 26 word games, not new complete touch and keyboard playthroughs of every puzzle. Focused mixed-input checks additionally submit real valid words in the four changed apps and verify saved reloads in the Claude games. No physical iPhone software-keyboard or hardware certification is claimed.

## Independent review

A separate Codex reviewer inspected the changed app handlers, Twin Hive CSS and test harness. It reported no confirmed important source regression and requested valid-word tap → type → Enter tests for Keystone, Tumbler and Claude's Tangle. Those flows were added. This was static review, not an additional Kimi/Opus/Gemini review or a device playtest.

## Verification notes

The initial Chrome run reproduced Twin Hive's typing handoff failure and stretched proportions. It also exposed a test setup mistake: Cairn stores its help-seen flag as a JSON boolean. The corrected harness dismisses onboarding through that existing saved preference. The three focused Claude button tests failed before their handler fixes and passed afterward.

The first unit command omitted the existing jsdom dependency path and ran against unsynchronized native assets. A subsequent overly broad command included the unrelated Lasers 3D browser test, which could not find its Playwright dependency; its failure is not an Alford Daily test result. The scoped Alford Daily command uses the existing Kimi node_modules and excludes the separate Lasers 3D project. No dependencies were installed into the application.

The installed Playwright wrapper initially had no matching executable WebKit browser. WebKit 26.6 and its FFmpeg support were downloaded into `/private/tmp/alford-word-controls-browsers` for this verification; no installed browser was replaced. The WebKit pass then reproduced a real Twin Hive focus difference: taps did not focus its letter buttons, so hardware typing landed outside the puzzle. Pointer activation now focuses the board, preserving the caret without requesting the phone keyboard. Native keyboard activation still retains its button behavior.

## Final results

- **132 browser checks passed** across Chrome and WebKit, covering all **26 word games**. Each engine has 52 basic touch/keyboard checks, two Second Sense word-submission checks, six Claude focused-Enter/mixed-submission checks, and six additional Twin Hive handoff/layout checks. [Per-check evidence](word-input/evidence/browser-results.json).
- **966 collection tests and 244 Kimi package tests passed**, with zero failures or skips.
- **304 runtime files** match between portable sources and the iOS web bundle. The new standalone stage contains **338 files**, including all 32 daily games and the bonus game.
- Inspected corrected [320px phone](word-input/evidence/chromium-hive-320.png), [desktop](word-input/evidence/chromium-hive-1200.png) and [WebKit phone](word-input/evidence/webkit-hive-390.png) layouts. The existing visible Twin Hive tab was updated without adding a tab; its accepted-word progress remained.

Reproduction:

```sh
NODE_PATH="$PWD/packages/kimi-pebbles/node_modules" node --test $(rg --files games scripts -g '*.test.mjs' -g '!games/lasers-3d/**')
(cd packages/kimi-pebbles && npm test)
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/alford-word-controls-browsers ENGINES=chromium,webkit node scripts/word-input.playwright.mjs
node scripts/sync-ios-web.mjs --check
```

The browser script uses the existing Playwright module by default; `PLAYWRIGHT_MODULE` can select another installed module, and `WEBKIT_EXECUTABLE_PATH` can select an existing WebKit executable. It runs with isolated storage and local file routing, without a listening server. The final Twin Hive rerun supersedes its earlier browser rows after the WebKit repair. No new native binary build, physical-device test or production deployment is represented.
