# Alford Daily — portable family portal home

This directory is the Alford Daily home at `/games/daily/`. It links to all 32 sibling game directories at `/games/<slug>/` and shares their browser storage when served from the same origin. It does not contain copies of the game runtimes.

The collection contains eight ChatGPT games and six each from Kimi, DeepSeek, Qwen, and Claude. Filters preserve those creator labels. Six DeepSeek concepts and five Qwen concepts also carry separate ChatGPT implementation credit. Ringcount and Switchpath lead the home; Tradeoff and Inbetween remain family favorites. The two games named Tangle retain separate IDs, mechanics, credits, and progress.

## Local verification

From this directory:

```sh
npm run check
npm run serve
```

Open `http://localhost:8080/games/daily/`. The server serves the portal root, so the sibling game links and progress-validation imports work. Opening `index.html` directly as a `file:` URL is not a supported module-loading setup.

There are no build dependencies. Fonts, licenses, illustrations, scripts, and styles are local. The syntax check uses the flat layout in this directory.

## Relative paths

The HTML root is configured for the family portal:

```html
<html lang="en" data-game-base="../">
```

`app.mjs` resolves both navigation and engine imports through this value. For a standalone collection whose runtimes live below its home in `games/<slug>/`, use `./games/` instead. Keep `index.html`, `styles.css`, `app.mjs`, `catalog.mjs`, `icon.svg`, `manifest.webmanifest`, and `fonts/` together. No domain or NAS address is embedded in the home.

## Honest daily progress

The daily date follows `America/Chicago`, matching the game engines. This home reads each game’s current daily status and records without writing or repairing game data. The original eight games use their actual `restoreGame` and `getStats` functions. Imported games publish status through their isolated storage namespaces; their own engines validate playable saves. A preserved valid terminal record takes precedence.

Solved daily boards across all 32 games increase the solved count, including both family favorites. Practice rounds, revealed answers, and unsuccessful finishes do not. Missing or blocked storage and unavailable modules are shown explicitly. Status refreshes when another tab writes progress, when the page becomes visible, and after Central midnight.

Saves belong to the current browser, device, and website origin. The private collection address, standalone game addresses, and this NAS portal have separate browser storage.

## Content and build scope

The collection contains 5,842 prepared daily puzzle/answer records: 570 across the original eight ChatGPT games, 3,362 from Kimi, 180 DeepSeek-based records, 180 Qwen-based records, and 1,550 from Claude. Keystone's 58 records each contain three arches. Each game cycles its own finite bank, so the total does not imply 5,842 fresh days per game. Decorative home illustrations are not today's puzzles. See `../../docs/unified-collection.md` for the per-game inventory and provenance.

This build has no accounts, analytics, advertising, ad removal purchase, or billing SDK. The manifest provides launch metadata; it does not install a service worker or promise offline operation. Keyboard focus, a native accessible About dialog, and reduced-motion styling are included.

The 32-game native source is in `../../ios/`, with offline game resources, native navigation and records, creator filters, sharing, and haptics. Current monetization recommendations are in `../../docs/monetization-unified.md`; executed checks and remaining release boundaries are in `../../docs/verification-expanded-2026-10-20.md`. Signed device distribution still requires Apple account configuration.
