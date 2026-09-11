# Lasers 3D emitter and receiver — September 11, 2026

The emitter now has a dark enamel chassis, a stepped metal mounting plate, cooling rings, side filaments and a recessed pink lens. The lens brightens with the existing finite charge animation. Polished trim follows each chapter's palette while the dark housing keeps the aperture distinct.

The receiver has an octagonal base, four swept metal supports, a segmented illuminated ring and a faceted crystal inside a transparent optical shell. The supports leave the beam paths open and keep the crystal visible from the default diagonal view. The crystal grows and changes from amber to mint when reached; lower shell emission preserves its silhouette when lit.

Both models retain their cell footprint and optical centre at local height 0.5. Shared physical materials follow the existing tilt reveal and disposal paths. The flat target reticle remains height-neutral. Puzzle rules, levels, camera controls and shot timing are unchanged; the geometry and materials require no downloaded assets or additional animation loop.

## Verification and delivery

- Chromium captures reviewed at 1194 × 834, including normal board framing and close-ups of the emitter and both receiver states.
- 423 unit/DOM tests passed, including 507 embedded DOM assertions.
- 242 rendering/picking checks, 131 animation checks and 54 optical-art checks passed in WebKit. Hidden-height pixel checks remain exact, all five chapter palettes render, and settled scenes schedule zero application frames.
- 69 Chromium release checks passed, including WebGL context loss, restoration and a successful shot after restoration.
- Representative solved scene: 65 draw calls. The 24 × 24 stress scene uses 67 calls and 27,184 triangles. These are desktop browser measurements, not sustained iPad performance results.
- Signed offline iOS build succeeded; signature verification passed. All 26 bundled game files and the native verification script match source.
- Installed successfully on the user's iPad Pro 13-inch M4 after it was reconnected and unlocked. All 13 isolated on-device checks passed: WebGL, all 23 solutions, placement/rotation, saving, winning, awards, touch target sizes, hints, one-finger pan, two-finger tilt, finger handoff, pinch separation and zero idle frames. Verification uses nonpersistent web storage and cannot write native progress. The game was relaunched normally after verification. No Simulator or NAS deployment was performed.

Local evidence: `output/playwright/laser-emitter-detail.png`, `laser-receiver-amber.png`, `laser-receiver-lit.png`, and `laser-optics-obsidian.png` are actual browser captures. Test and build logs are under `output/laser-optics-*.log`; the fresh physical result is `output/laser-optics-device-verification-current.json`, dated September 11, 2026.
