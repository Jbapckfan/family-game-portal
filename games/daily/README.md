# Alford Daily — portable family portal home

This directory is the Alford Daily home at `/games/daily/`. It links to the eight sibling game directories at `/games/<slug>/` and shares their browser storage when served from the same origin. It does not contain copies of the game runtimes.

The six featured launch games are Ringcount, Switchpath, Counterpart, Shortlist, Second Sense, and Sideways. Tradeoff and Inbetween remain available as two family favorites below the daily collection.

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

The daily date follows `America/Chicago`, matching the game engines. This home reads each game’s current daily save and records without writing or repairing game data. The actual `restoreGame` and `getStats` functions validate results. A preserved valid terminal record takes precedence; a valid terminal game save can also supply the result if its record write was interrupted.

Only solved daily boards in the six featured games increase the solved count. Practice rounds, revealed answers, unsuccessful finishes, and the two classics do not. Missing or blocked storage and unavailable modules are shown explicitly. Malformed values are rejected through the engines. Status refreshes when another tab writes progress, when the page becomes visible, and after Central midnight.

Saves belong to the current browser, device, and website origin. The private collection address, standalone game addresses, and this NAS portal have separate browser storage.

## Content and build scope

The six featured games contain 420 prepared boards: Counterpart 30, Shortlist 90, Second Sense 30, Sideways 90, Ringcount 90, and Switchpath 90. Tradeoff adds 90 and Inbetween 60, making 570 across the web collection. Each game cycles its finite collection, so boards eventually repeat. Decorative home illustrations are not today’s puzzles.

This build has no accounts, analytics, advertising, ad removal purchase, or billing SDK. The manifest provides launch metadata; it does not install a service worker or promise offline operation. Keyboard focus, a native accessible About dialog, and reduced-motion styling are included.

The six-game iOS plan and monetization research are documented in `../../docs/ios-launch-and-monetization.md`. The native source is a separate project in `../../ios/`.
