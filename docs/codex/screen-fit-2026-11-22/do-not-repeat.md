# Game pitfalls to keep (from the project notes)

## Puzzle-level traps

- **Do not equate a level definition or mirror count with solvability—or difficulty.** Lasers & Mirrors levels 6–8 shipped with fewer mirrors than their obstacle layouts mathematically required, while a supposedly hard layout can also hide a trivial shortcut. Run `games/mini-games/validate-laser-levels.mjs` after changing laser levels; it checks every puzzle with mirror clearance across desktop, tablet, portrait-phone, small-phone, and phone-landscape boards and enforces `minimumMirrors` on advanced levels.
- **Do not stretch Geometry Dash levels globally to make them longer.** A `3×` horizontal multiplier turned designed jumps, pad/orb combinations, and mode corridors into long empty runs. Tune authored distances and speed together, then run `games/validate-cube-jumper.mjs` to check gap density and the actual ballistic path through rapid-tap chains.
- **Do not confuse more Geometry Dash background detail with native-game feel.** The first six-world pass still felt small and stepped because it retained 1.2x framing and displayed only completed physics ticks. Preserve the close 1.55x framing, smooth gravity/aerial camera focus, render interpolation, cached lighting, adaptive DPR, and deterministic effects enforced by `validate-cube-jumper.mjs`.
- **Do not bring back forced Geometry Dash auto-restart after a normal death.** It bypasses the run coach and one-tap focus-practice loop. Preserve bounded replay history and exact-state checkpoints; record replay object changes as sparse event deltas rather than allocating every obstacle/orb state on every 120 Hz tick.
- **Do not reset Speed's deadlock-flip timer on every AI poll.** Turbo's AI checks faster than the flip delay, so clearing and rescheduling the deadlock timer each pass would starve it forever. Keep the first pending deadlock timer alive until a legal move appears or the center cards flip, then run `games/validate-speed-card-game.mjs`.
- **Do not add legal-card highlighting back to Speed.** The player must recognize playable ranks without a glow, dimming, `playable`/`blocked` class, or another advance hint. Whole-card double-click may select the leftmost legal pile internally, but only after the player attempts that specific card.
- **Do not let Speed's Chill mode silently accelerate.** Preserve its 2.4–3.2-second base interval, ignore positive adaptive pressure, and disable the late-game per-card momentum boost. Losses may make Chill gentler; wins must not make it faster.

## Front-end dependency traps

- **Do not make a game's basic layout depend on `cdn.tailwindcss.com` at runtime.** When that script failed inside the mobile/in-app browser, Velocity Marble Run's utility classes had no CSS, collapsing the Three.js canvas to its default size and leaving the HUD unstyled. Compile and deploy a local stylesheet with the game instead.
- **Do not put optional third-party HDR or font downloads on a 3D game's startup path.** Kids' iPads or filtered networks can block `raw.githack.com`, Google Fonts, or JSDelivr and leave an otherwise local game blank. Use local/system assets for startup and provide a visible timeout/error fallback.

## Laser board design

- **Both Sides means one shared floor with the terrain bases touching.** James clarified on 2026-09-16: the existing board starts as a flat bird’s-eye grid and reveals its heights when tilted; the underside is a vertically reflected copy, with columns and optics extending outward/downward from the same floor. Real holes connect the two faces, and solid floor always blocks the beam. The camera must flip under the actual opaque board. He rejected the earlier two-platform stack with support posts and a transparent cutaway; do not revive that structure. The corrected profile capture (`output/playwright/laser-underside-profile.png`) was described as “much closer to what I was thinking.” Preserve the original 2D opening view and centred rotation.

