# Rough games: arcade (report: arcade-report.md)

Read `docs/codex/rough-games-2026-11-22/shared.md` first. Your games, in priority order:

1. **Nexus Defense** (`games/tower-defense/index.html`). Today: thin neon green paths on near
   black, mostly empty. Give the map real terrain (generated art fitted to the existing path so
   the road reads as a road), towers and enemies with depth and shading, and keep path geometry,
   waves, tower stats and balance unchanged.
2. **Particle Conquest** (`games/particle-conquest/`). Today: outlined circles on black. Make the
   planets look like rendered planets (texture, lit side, atmosphere glow in the owner's color)
   over a deep-space backdrop; keep ownership colors obvious at a glance, sizes and the new
   spacing unchanged. Bump the service-worker cache name and precache any new assets.
3. **Cube Jumper** (`games/cube-jumper.html`). Today: a simple neon floor and spikes. Give it a
   richer world (layered parallax backdrop, lit cube with depth, readable hazards) without
   changing jump physics, level layout or timing; its validator must still pass.
