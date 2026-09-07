# Lasers 3D improvement release — September 7, 2026

Implemented the actionable reliability issues from the [full review](2026-09-06-lasers-3d-review.md), added campaign learning and camera improvements, and packaged the game as an offline iPad/iPhone app with a new illustrated icon.

## Fixed review findings

| Finding | Result |
|---|---|
| F1: hint can charge eligibility while off screen | Three-stage help now focuses the relevant cell. Only the exact answer affects assistance; the ghost lasts eight seconds. Verified the second level-4 hint at six viewport sizes and after rotation. Working alternate solutions receive confirmation without a charge. |
| F2: hidden phone actions | FIRE, TILT, overview, RESET, HINT and More use a visible grid with 44px targets. The 320px layout keeps a usable board and compact piece cards. |
| F3: Space edits while arming pan | Space exclusively arms pan; Enter places/rotates. Pointer and keyboard regressions cover it. |
| F4: attempts lost on leaving | Placements, counters, assistance and camera framing survive reload and level navigation. Awards/discovery remain separate. |
| F5: unknown fixed optics disclosed | Unknown fixed-cell feedback is generic; placement ghosts and selection descriptions respect discovery. |
| F6: fragile numeric identities/fingerprint | Stable IDs and compatibility migration preserve awards across reorder. Fingerprints include fixed optics, openings and all puzzle semantics. Stale attempts/discovery are rejected; corrupt records are isolated. |
| F7: new game absent from portal indexes | Added Lasers 3D cards to both indexes. Source release is tracked in Git; NAS publication is pending because the direct LAN connection times out. |

## Improvements delivered

- Playable first-bounce introduction, progressive tray types and replayable contextual lessons.
- Tilt-free campaign stars with optional FROM ABOVE mastery; existing earned stars retained.
- Graduated hints, tap-to-focus overview, camera pan/zoom buttons, tap-destination piece movement, cursor description and a last-shot event inspector.
- Visible campaign chapter and level names; browser zoom restriction removed; more readable shot explanations.
- WebGL loss/restoration recovery and saved-progress handling when the native web process terminates.
- Portable npm dependencies and a complete `npm run verify` entry point. The two previous TODO robustness cases now pass.
- [Current rules and build guide](../../games/lasers-3d/CURRENT-RULES.md), explicitly superseding contradictory historical design sections.
- New navy/cyan/amber laser-mirror icon, including an opaque 1024px iOS asset.

## Verification

| Check | Result |
|---|---|
| Unit/DOM suite | 419 tests passed, zero failed/skipped/TODO; embedded DOM harness 507/507 |
| Level proofs | All 23 levels pass solution, inventory, minimal-par and mechanic checks |
| WebKit UI | 211/211 |
| Motion scheduling | 131/131, including zero application frames after settling |
| Render/picking smoke suite | All passed |
| New release regressions | 63/63 in Chromium, including saved camera/counters, button-based movement, beam inspector and WebGL restore followed by a win |
| Signed iOS build | Succeeded with Xcode 27, iPhone/iPad target, bundle `com.jamesalford.lasers3d` |
| Physical iPad Pro 13-inch M4 | Installed; 8/8 in-app checks passed, including all bundled solutions, WebGL, synthetic touch placement/rotation, FIRE, saved attempt/awards, touch-target bounds and visible hint |

The actual iPad game screen was captured for visual inspection. The native app uses scene lifecycle support and bundles every gameplay script locally. Verification mode preserves the normal native save and restores its local-storage snapshot; the final launch is normal gameplay. Build/install/launch results and screenshots are in the local, untracked `output/laser-fixes/` evidence directory.

No rules-engine redesign or level-layout changes were needed. The original pitch-as-delta physics, large boards and 23-level solver guarantees are intact.

The NAS SSH connection to `192.168.100.35` timed out, so no live-web deployment or live-content hash match is claimed. The iPad app works independently of that server. Human family playtesting, full VoiceOver gameplay, audio listening and sustained thermal/battery measurements remain unperformed. Future modes, new mechanic packs and online features are product backlog, not fixes completed in this release.
