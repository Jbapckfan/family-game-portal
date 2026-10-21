# Alford Daily visual system

The collection has one editorial identity and 32 individual board identities. Game rules, prepared puzzle banks, save keys, IDs, and original creator credits are independent of these presentation layers.

## Shared language

- Warm paper `#f6f3ec`, pale card surfaces, dark ink `#202c35`, restrained borders, and rounded controls.
- Self-hosted DM Sans for web interface text and DM Serif Display for editorial titles. Native screens use system text and serif styles with Dynamic Type.
- A recognizable emblem and four-color palette for each game. Home cards, game screens, and native navigation use the same identity.
- Consistent daily/practice controls, clear return navigation, visible creator credits, statistics, help, focus states, and reduced-motion support.
- Board structure carries the individual character: dials, paired cards, paper joins, stone stacks, letter rails, a graph-paper grid, a cipher sheet, and an arcade panel.

## Source of truth and generation

`identities.json` defines the name, accent, dark ink, wash, edge, and short visual direction of every game. `glyphs.mjs` defines all 32 SVG emblems in a shared 64-unit coordinate system.

```sh
node scripts/sync-game-identity.mjs
node scripts/sync-original-design.mjs
```

The first command writes each game's `icon.svg`, home palettes, and home CSS. The second compiles `collection-base.css` and the eight files in `boards/` into the original games' self-contained stylesheets. Edit these design inputs rather than their generated sections.

The 18 modular imported games use `games/deepseek-runtime/styles.css` for their common frame and their own `styles.css` for the boards. Kimi's six games retain their React source in `packages/kimi-pebbles`; run its build after source changes:

```sh
npm --prefix packages/kimi-pebbles run build
```

Its stage step writes the six wrappers and the shared hashed runtime. Each wrapper keeps its own canonical emblem. The private Site and the iOS bundle use those same built files.

Native palettes in `ios/AlfordDaily/UI/Theme.swift` mirror all 128 color values in `identities.json`. The home adapts to larger displays and accessibility text sizes, and every game keeps its visible original credit.

## Packaging

```sh
node scripts/sync-ios-web.mjs
node scripts/sync-ios-web.mjs --check
python3 ios/scripts/validate_project.py
node scripts/stage-site.mjs /absolute/path/to/site/dist
```

The native synchronizer allows the exact `icon.svg` filename alongside each supported wrapper; it does not grant access to arbitrary cross-game paths. The Site staging command copies canonical game assets and the collection home. Temporary browser review pages are excluded from production publication.

## Interaction details

- Selected insertion gaps in Inbetween use the renderer's actual `.gap.active` state.
- Tradeoff hints have a persistent border, background, and outline, so they remain visible when motion is reduced.
- Sideways uses 44px arrow controls and a two-column clue layout on narrow phones.
- Spare uses two word-card columns on narrow screens to keep long words readable.
- Quartet sizes long bank words without splitting them into isolated trailing letters.
- Opening Statistics, Help, or Reveal pauses timed imported games; closing the dialog does not charge the time spent reading it.

See [the UI release review](../docs/ui-redesign-2026-10-21.md) for the complete game identity inventory, screenshots, and validation record.
