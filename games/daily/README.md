# Alford Daily — standalone word and logic collection

This directory contains the Alford Daily home. Alford Daily is a separate product from Family Portal and SpellSpark. Its source remains in the historically named `family-game-portal` repository, but its standalone build includes only the collection and its 32 game runtimes. The source layout at `/games/daily/` links to sibling game directories at `/games/<slug>/` and shares their browser storage when served from the same origin.

The collection contains eight ChatGPT games and six each from Kimi, DeepSeek, Qwen, and Claude. Filters preserve those creator labels. Six DeepSeek concepts and five Qwen concepts also carry separate ChatGPT implementation credit. Ringcount and Switchpath lead the home; Tradeoff and Inbetween remain family favorites. The two games named Tangle retain separate IDs, mechanics, credits, and progress.

## Local verification

From the repository root, stage a fresh standalone build and open it:

```sh
node scripts/sync-ios-web.mjs --check
node scripts/stage-site.mjs "$PWD/dist/alford-daily-preview"
python3 scripts/open-preview.py "$PWD/dist/alford-daily-preview"
```

The launcher opens `http://127.0.0.1:8765/` and serves only the staged Alford Daily build. Use that same origin for later visits to retain saves. The staging destination must be new or empty, with no symlinks in its path; on macOS, use a normal workspace directory rather than `/tmp` or `/var`. An occupied port fails without stopping another process. Opening `index.html` directly as a `file:` URL is not a supported module-loading setup.

For source development only, `npm run check` in this directory checks its JavaScript, and `npm run serve` serves the repository root at `http://localhost:8080/games/daily/`. That broader source server is not the standalone release artifact.

There are no build dependencies. Fonts, licenses, illustrations, scripts, and styles are local. The syntax check uses the flat layout in this directory.

## Relative paths

The source HTML root uses sibling game paths:

```html
<html lang="en" data-game-base="../">
```

`app.mjs` resolves both navigation and engine imports through this value. The standalone staging script writes `./games/` into the root home automatically, with runtimes below it in `games/<slug>/`. It keeps `index.html`, `styles.css`, `app.mjs`, `catalog.mjs`, `identities.css`, `icon.svg`, `manifest.webmanifest`, and `fonts/` together. No domain or NAS address is embedded in the home.

## Honest daily progress

The daily date follows `America/Chicago`, matching the game engines. This home reads each game’s current daily status and records without writing or repairing game data. The original eight games use their actual `restoreGame` and `getStats` functions. Imported games publish status through their isolated storage namespaces; their own engines validate playable saves. A preserved valid terminal record takes precedence.

Solved daily boards across all 32 games increase the solved count, including both family favorites. Practice rounds, revealed answers, and unsuccessful finishes do not. Missing or blocked storage and unavailable modules are shown explicitly. Status refreshes when another tab writes progress, when the page becomes visible, and after Central midnight.

Saves belong to the current browser, device, and website origin. A private preview address, a LAN address, and a custom public hostname each have separate browser storage.

## Content and build scope

The collection contains 8,001 prepared puzzle/answer records: 1,447 across the original eight ChatGPT games, 3,362 from Kimi, 740 DeepSeek-based records, 750 Qwen-based records, and 1,702 from Claude. Every game has at least 120 records. Keystone's 120 records each contain three arches. Some records recombine smaller approved pools; each game cycles its own finite bank, so the total does not imply 8,001 unique authored ideas or fresh days per game. Decorative home illustrations are not today's puzzles. See `../../docs/puzzle-inventory.json` for current counts and `../../docs/unified-collection.md` for provenance.

This build has no accounts, analytics, advertising, ad removal purchase, or billing SDK. The manifest provides launch metadata; it does not install a service worker or promise offline operation. Keyboard focus, a native accessible About dialog, and reduced-motion styling are included.

The 32-game native source is in `../../ios/`, with offline game resources, native navigation and records, creator filters, sharing, and haptics. Current monetization recommendations are in `../../docs/BRAND-AND-MONETIZATION-STRATEGY.md`; the October 22 handoff and remaining release boundaries are in `../../docs/RELEASE-STATE.md`. Signed device distribution still requires Apple account configuration.
