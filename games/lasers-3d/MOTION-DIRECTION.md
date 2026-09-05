Motion should make this workbench feel charged: light gathers before release, travels with purpose, catches on an optical surface, and settles into evidence the player can inspect. The beam carries the activity; the instrument carries the weight. Tilting exposes a structure that was always there, placement feels like seating precision hardware, and failure leaves a useful trace in a moment of quiet. Every animation has an explicit end. Brief atmospheric motion continues after an interaction, then the entire presentation becomes still until the player acts again.

## Implementation contract

This document supersedes earlier **motion** instructions where explicitly stated. Retain the current palette, materials, geometry, camera framing, beam altitude widths, departure geometry, and game rules in `theme.js` and the amended `DESIGN.md`.

Add one exported, pure-data `theme.motion` object. Below, `m` means `theme.motion`. Existing token references are intentional: do not duplicate their values. CSS animation parameters must be generated from these tokens.

### Units and easing

- World distances use cells. Screen distances use CSS pixels.
- Durations use milliseconds and monotonic elapsed time.
- `linear`: `f(t) = t`.
- `smoothstep`: `f(t) = t²(3 − 2t)`.
- `easeOutCubic`: `f(t) = 1 − (1 − t)³`.
- `easeInCubic`: `f(t) = t³`.
- `easeInOutCubic`: `4t³` before the midpoint; `1 − (−2t + 2)³ / 2` afterward.
- `camera`: the existing `theme.easeCamera`, evaluating `camera.motion.easing`.
- `bell`: `sin²(πt)`, for one rise and return.
- Clamp normalized time to `[0, 1]`. These mathematical endpoints are not tuning values.

### Rendering and ownership

Use one animation registry and one render scheduler. Each animation supplies a start time, end time, update function, final state, and cancellation action.

Request another WebGL frame only while a visible WebGL animation remains active. At completion, apply the exact final state, render once, and stop requesting frames. A stationary pointer, held selection, visible beam, lit target, open result panel, or unresolved puzzle must not keep the scheduler alive.

Use one-shot timers for stationary choreography holds. A hold does not render. Do not create polling timers, perpetual CSS animations, or a shader clock that advances without an active animation.

Weather uses bounded CSS compositor animations independently of WebGL. Once those finish, there must be **no application-requested frames and no running CSS animations**.

On document hiding, cancel decorative effects and settle active presentations to their final states. Commit the corresponding authoritative gameplay result and discoveries. On return, render the settled state once. Do not replay missed animation.

A new edit supersedes the current edit animation; start from the currently displayed pose. RESET and level navigation cancel all presentation work. Every callback must verify its attempt and trace identifier before changing state.

When reduced motion becomes enabled during an animation, settle decorative effects immediately and apply the item-specific fallback below. Do not multiply those fallback durations by `reducedMotion.durationScale` again.

### Flat-view information boundary

Treat `camera.isFlat()`—the existing elevation dead band—as the flat presentation boundary.

In that state:

- All board interaction overlays use a common, height-independent presentation plane and cell footprint.
- MIRROR, WEDGE, and DIP receive identical board animation, color, scale, and timing. FLOOR retains its permitted disc silhouette.
- Placement distance and timing never depend on terrain height.
- Beam animation may encode the **traced beam’s** altitude and pitch after FIRE. It must never sample terrain height to choose a decorative effect.
- Opening gleams reveal only that an opening exists. They never animate differently by opening height, count, or shape.
- A beam crossing an opening must remain visible in the flat representation. Use the existing flat beam presentation or an equivalent height-independent overlay; physical top-face depth must not erase this required tell.

Outside the flat dead band, restore physical depth testing and occlusion. Darkness gates both representations.

## 1. The beam as a living thing

### Travel and pulse

Build the route geometry once per trace. Give its vertices cumulative arc distance, segment pitch, and altitude metadata. Animate reveal distance and light intensity through uniforms; do not rebuild tubes during travel.

Include the existing lost-beam departure geometry in total drawn arc length `L`.

```text
travelMs = clamp(
  1000 × L / theme.beam.travel.cellsPerSecond,
  theme.beam.travel.minDurationMs,
  theme.beam.travel.maxDurationMs
)
speed = L / travelMs
headDistance = speed × elapsedTravelMs
```

Travel uses **linear** easing. Corners and piece hits do not pause the head. Retain the current `340–2200 ms` duration clamp.

The leading `0.28 cell` of the revealed route carries an additional `0.45` emissive multiplier. Its envelope rises with **smoothstep** toward the head. It affects light intensity only; never enlarge or displace the centerline.

Behind it, emit a pulse every `240 ms`. At any fixed point on the beam, each pulse lasts `480 ms` and adds up to `0.32` to the baseline core-emissive and glow-opacity multipliers.

For pulse emission time `k × interval`, evaluate:

```text
age = elapsedTravelMs − arcDistance / speed − k × interval
u = age / packetMs
```

Outside `[0, 1]`, its contribution is zero. Within that interval, rise from zero to one with smoothstep up to `peakAt`, then return to zero with smoothstep.

| Segment pitch | `peakAt` | Motion reading |
|---|---:|---|
| Level | `0.50` | Equal gathering and release; a steady current. |
| Climbing | `0.78` | Light gathers slowly, then releases sharply forward. |
| Descending | `0.22` | Light arrives sharply and drains away slowly. |

Evaluate only the potentially overlapping pulse ages analytically; do not create pulse objects. At each join, blend the pitch envelope over `0.10 cell` of outgoing route to avoid an intensity seam.

This modulation is additive over the existing altitude treatment. The darkest pulse trough is the current baseline beam, so motion cannot temporarily disguise altitude.

When travel ends, fade the pulse and head overlays to zero over `160 ms`, **easeOutCubic**. The complete baseline route remains visible and still.

### Altitude changes and pieces

Use the simulation’s incoming and outgoing pitch:

- **MIRROR:** preserves the pulse rhythm while turning it through the new horizontal heading.
- **WEDGE:** changes rhythm only when its clamped pitch delta changes the outgoing pitch.
- **DIP:** follows the same rule. A climbing beam becomes level only when the resulting pitch is zero.
- **FLOOR:** a descending arrival switches directly to climbing rhythm without changing horizontal heading. Level and ascending passes produce no interaction effect.

Do not reset a climbing pulse to a level pulse at a MIRROR. Do not invent an additional accent when a WEDGE or DIP hits its pitch clamp.

Interpolate existing altitude color and diameter between traced altitude endpoints along pitched geometry. Do not add a separate vertical wobble, arc, acceleration, or gravity effect.

### Contact and scatter

At an actual acting-piece hit:

1. Add a contact disc of `0.12 cell` diameter at the intersection.
2. Raise its opacity from zero to `0.60` in `36 ms`, **easeOutCubic**.
3. Fade it to zero over the next `144 ms`, **easeOutCubic**.
4. Emit two short streaks at `−35°` and `+35°` around the outgoing direction. They travel `0.18 cell` over `180 ms`, **easeOutCubic**, while opacity falls linearly from `0.45` to zero.
5. Each streak is `0.06 × 0.012 cell`, retains its length, and has no gravity.

In FLAT, use `palette.commonFlatPiece` and the common presentation plane. In TILT, use `pieceAccent[type]`; place the disc and streaks in the struck face’s plane. All streaks remain decorative and do not resemble outgoing beam branches.

An overflight produces no contact effect.

A successful FLOOR bounce additionally leaves a stationary `0.10-cell` dot in the arrival beam color at `0.65` opacity for the life of that displayed trace. Its arrival uses the same contact envelope. This is the prescribed bounce tell; do not draw an altitude-dependent shadow elsewhere in FLAT.

**Tokens:** `m.beam.*`, `m.contact.*`, `m.scatter.*`.

**Reduced motion:** Retain the existing reduced beam travel calculation, `120–700 ms`, linear. Omit moving pulses, leading brightness, scatter, and contact expansion. Show a fixed contact disc for `120 ms`, then remove it in one update. Keep the FLOOR dot, altitude widths, badges, and complete route.

**Performance:** Uniform animation on merged beam geometry. Contact discs and streaks use a fixed pool. No moving lights, bloom pass, geometry allocation, or per-segment JavaScript animation.

## 2. FIRE as a timed sequence

Let `T0` be accepted FIRE input. Trace the authoritative board immediately and increment the FIRE count once. Presentation events are scheduled from cumulative route distance.

| Time | Exact behavior |
|---|---|
| `T0–180 ms` | Charge the emitter. Multiply filament emissive intensity from `1` to `1.35`, **easeInCubic**. Contract its halo from scale `1` to `0.84` while opacity rises from its existing value to `0.34`, **smoothstep**. |
| `T0 + 180 ms` | Release the head. Begin the linear route sweep and pulse train. |
| Next `120 ms` | Return filament intensity, halo scale, and halo opacity to their existing values, **easeOutCubic**. |
| `release + distance/speed` | Dispatch each acting-piece contact, cell discovery, and target arrival. |
| Drawn route completion | Settle beam modulation over `160 ms`; run the applicable terminal behavior below. |

The FIRE button retains its existing `90 ms` pressed treatment. Do not scale the emitter body or recoil the camera.

Altitude badges appear at their traced point’s arrival, using an `80 ms` linear opacity fade. They remain stationary, with the existing screen offset. The endpoint badge arrives with its endpoint; badges do not bob.

If several events occur between rendered frames, process every logical event in trace order. Decorative contact effects use the capped pool; discovery and target state are never dropped.

After the existing `140 ms` skip grace, another tap or key completes presentation immediately. Consume that skip input. Show the final route, endpoint, readout, target states, and all traversed discoveries without replaying queued scatter or rings.

### Target arrival

At the exact target event:

- Blend to the existing lit target material over `beam.endStates.target.litFadeMs`, currently `160 ms`, **smoothstep**.
- Start the existing two rings, each expanding from `0.18` to `0.75 cell` over `420 ms`, **easeOutCubic**. Delay the second by `80 ms`.
- Ring opacity falls linearly from `0.32` to zero; stroke is `0.018 cell`.
- Emit the existing eight streaks at equal angular intervals. Use the scatter size, distance, opacity, and lifetime from section 1.
- In FLAT, rings and streaks lie in the common presentation plane. In TILT, use the target’s horizontal socket plane.
- Finish at the existing stationary target halo: `0.42-cell` diameter, `0.22` opacity.

Do not make the orb bounce or rise.

### Blocked

At the cell boundary, reveal the existing solid danger octagon immediately. The head stops exactly there.

Emit the existing three `0.08-cell` sparks over `260 ms`. Their directions are `−35°`, `0°`, and `+35°` around the reverse incoming heading in the horizontal presentation plane. Travel distance is `0.18 cell`, **easeOutCubic**; opacity falls linearly from `0.45` to zero.

The cap stays. The wall does not flash, shake, dent, or illuminate its full column.

### Lost

The head continues through the complete existing departure:

- **Edge:** `2.4 cells` along the exiting ray.
- **Sky:** `2.8 cells` along the climbing ray.
- **Floor:** `1.7 cells` along the prescribed ground skim.

Retain all existing radius, opacity, taper, marker-position, and floor-clearance tokens. Never compress a departure to a cap or fade the whole lost route away.

Fade the hollow reason marker in over `120 ms`, linear, when the head reaches its marker position. A floor loss adds two forward scatter streaks using section 1; edge and sky losses emit none.

### Loop

Retain the existing amber double ring and its single `500 ms` linear rotation. Leave it stationary afterward. A loop is a diagnostic result, never an indefinitely circulating beam.

**Tokens:** `m.fire.*`, `m.target.*`, `m.failure.blockedAnglesDeg`, plus reused beam end-state tokens.

**Reduced motion:** Charge is replaced by a `60 ms` linear emitter intensity change, followed by the reduced travel. Restore the emitter over `60 ms`, linear. Target material change takes `120 ms`, linear; omit rings and streaks. Show blocked caps, lost markers, loop rings, and badges immediately at their events. Loop rotation is omitted.

**Performance:** One ordered event cursor per trace. No timers per hit. Restore pooled objects rather than disposing and recreating them. Lost departure uses the same sweep as the rest of the beam.

## 3. The reveal: the lie collapses

### Player-triggered TILT

The complete move still lasts `camera.motion.flatToTiltMs`, currently `720 ms`.

At input acceptance, the rules clear blind-solve eligibility immediately. Fade the HUD blind-star dot and eligibility highlight to the existing empty state over `160 ms`, linear. Never eject, crack, or drop the star. Already earned historical stars remain unchanged.

| Time | Terrain and ground | Pieces | Light and camera |
|---|---|---|---|
| `0–96 ms` | Remain exactly FLAT. No deformation or ripple. | Common glyphs remain unchanged. | Camera holds. Multiply existing beam-glow opacity toward `0.82`, smoothstep, creating a brief intake. If no beam exists, omit this change. |
| `96–720 ms` | Existing geometry stays fixed. Top shading follows `theme.revealBlend(elevation)`. Sides emerge with the mapping below. | Glyph and physical-face opacities follow the same reveal scalar. | Spherical orbit from current FLAT pose to the existing TILT preset using **easeInOutCubic** over this interval. |
| Reveal scalar reaches `1` | Full physical terrain and ground materials are present. No additional terrain animation starts. | Physical faces and their existing accent filaments are fully present. | Full light rig is reached. Continue the remaining camera travel to the preset. |
| `720 ms` | Set exact final state. | Set exact final state. | End the move and render its final frame. |

During the orbit, let `r = theme.revealBlend(elevation)`:

- Floor and terrain-top shading use exactly `r`.
- All tilted light intensities use exactly `r`.
- Physical piece visibility uses `r`, multiplied by each material’s existing base opacity.
- Common glyph visibility uses `1 − r`.
- Side opacity uses `smoothstep(clamp(r / lightRig.reveal.sideOpacityFullAt))`. This replaces the old discontinuous side-opacity jump.
- Shadow opacity retains `smoothstep(0.25, 0.65, r)`.
- Opening gleams retain `1 − r`.
- Beam-glow multiplier returns from `0.82` to `1` with `r`.

The initial dead band remains a perfect flat lie. The whole board reveals together. Do not stagger columns by position or height.

The ground gains its existing material response and stationary shadows. It does not roll, rise, brighten in a traveling wave, or emit a ring. The beam remains anchored to its traced world coordinates while perspective exposes its climb.

Retain section 11 camera fitting, minimum cell size, pan limits, and orthographic projection. Framing must not depend on the currently discovered fog subset. Do not add camera zoom punches.

### Shadow handling

Precompute or reuse a shadow map for the current settled geometry. For a reveal, request its update only if geometry or the light rig changed; sample that same map throughout the orbit. Camera motion and intensity changes do not require rebuilding it.

Use the existing enable threshold before showing shadow contribution. Do not render a shadow map on every reveal frame.

### Manual orbit and return to FLAT

Manual orbit follows the pointer without anticipation or lag. Reveal shading follows actual elevation continuously. Any accepted camera drag clears blind eligibility under the existing rules.

Returning to FLAT uses the existing `620 ms` **camera** easing with no preparatory hold. Apply the same material mapping in reverse. At the flat dead band, hide physical information completely and disable shadows.

### Free teaching reveal

Preserve the existing once-per-level exception for levels 4 and 5:

1. Hold the completed failure for `280 ms`.
2. Orbit to TILT over `900 ms`, **easeInOutCubic**, with no additional preparation hold.
3. Hold for `1300 ms`.
4. At the start of that hold, pulse one relevant visible outline for `500 ms`, using **bell** opacity from zero to `0.55` and back.
5. Return to FLAT over `650 ms`, **camera** easing.

Use a `0.018-cell` cyan outline. Select the blocked cell when visible; otherwise select the last acting piece associated with the failure. If that object remains unknown under darkness, omit the outline. This choreography never discovers cells and never consumes blind eligibility.

**Tokens:** `m.reveal.*`. Reuse camera presets, durations, reveal thresholds, and teaching choreography tokens.

**Reduced motion:** Omit anticipation, beam dimming, and outline pulsing. Use the existing `140 ms` linear camera transition with the same elevation-based information boundary. During the teaching reveal, use a stationary outline and cap its TILT hold at the existing `500 ms`. Eligibility fading takes `120 ms`, linear.

**Performance:** One camera tween and shared material uniforms. Terrain vertices and piece instances stay fixed. Holds request no frames. Recompute projected badges only when the camera changes.

## 4. Weather: life after the hand leaves

Weather is a brief trace of workshop dust caught in the instrument’s frame light.

Use two DOM flecks, colored `palette.metalLight`, each `2 × 1 CSS px`. Place them in `6 px` rails immediately outside the canvas’s top and bottom edges. Clip them to the rails and exclude HUD, tray, and Menu hit areas. They must never pass over the board. Omit a rail if no unobstructed space exists.

- Top fleck starts at `16%` of rail width.
- Bottom fleck starts at `78%`, delayed by `320 ms`.
- Each travels `18 px` right over `2400 ms`, linear.
- Opacity follows keyframes `[0, 0.16, 0.16, 0]` at progress `[0, 0.20, 0.70, 1]`, linearly interpolated.
- Their vertical positions are the rail centers. No random drift or rotation.

Run this once when the board first becomes ready, and once after a completed player interaction settles. Coalesce activity: a new interaction cancels the current weather and schedules one fresh burst after that interaction settles. Do not enqueue bursts.

This is the only idle-motion allowance. It ends no later than `2720 ms` after settling and never restarts itself.

**Tokens:** `m.weather.*`.

**Reduced motion:** Do not create the flecks or their animations.

**Performance:** Two small compositor layers, transform and opacity only. No WebGL frames, canvas painting, blur, animated gradients, or ambient timer. Remove `will-change` and hide the flecks at completion.

## 5. Placement feel

Logical placement, rotation, and removal happen on the accepted action. Visual settling must not delay retracing or invent intermediate simulation states.

| Action | Exact behavior and easing |
|---|---|
| Pick up | Over `100 ms`, **easeOutCubic**, lift the visual proxy `6 CSS px` toward screen top and scale it to `1.04`. Use identical screen displacement at every terrain height. |
| Drag | Follow the pointer directly. No spring, trailing clone, or interpolation lag. In FLAT, carry the common glyph or FLOOR disc. In TILT, carry the physical piece proxy. |
| Legal ghost | Draw a fixed `0.72-cell` footprint at `0.28` opacity in `palette.commonFlatPiece`; include the proposed common glyph. FLOOR uses its disc. Fade in over `80 ms`, linear, once on entry to the cell. |
| Drop | Animate the proxy from its current screen pose to its destination over `140 ms`, **easeOutCubic**. End at scale `1`. A tap placement starts from the same `6 px` lift and `1.04` scale. |
| Seating mark | At drop completion, show the stationary housing-sized footprint at `0.24` opacity, then fade it out over `180 ms`, **easeOutCubic**. No expanding ring. |
| Rotate | Commit the orientation immediately. Rotate the displayed piece clockwise `90°` about its own center over `120 ms`, **easeInOutCubic**. Do not lift it. Retrace against the committed orientation. |
| FLOOR rotate | Keep the disc still. Show the seating mark for `120 ms` instead; FLOOR orientation has no optical consequence. |
| Remove | Remove from simulation immediately. Fade the visual proxy to zero and scale from `1` to `0.92` over `100 ms`, **easeInCubic**. Do not fly it back to the tray. |
| Illegal placement | Keep the board and piece in place. Show a danger outline around the attempted footprint for the existing `400 ms`. Apply the existing two `70 ms`, `4 px` shake beats only to the selected tray card. |
| Cancel drag | Return the proxy to its original screen anchor over `140 ms`, **easeOutCubic**. Restore its exact base pose. |

For the illegal card shake, use normalized horizontal keyframes `[0, +1, −1, +1, 0]` at `[0, 0.25, 0.50, 0.75, 1]`, linear, over the combined `140 ms`.

Ghosts are cell-snapped and static after entry. Changing orientation updates the ghost immediately. Do not display a live beam from a ghost before a placement is committed.

Do not show an illegal hover ghost for an unknown dark cell based on hidden contents. Its preview remains neutral until an attempted placement returns the normal legality result. That result must not reveal the hidden object through animation.

Hint ghosts use the same presentation, remain for the existing `ui.hintGhostMs`, and disappear without a repeated pulse. Existing hint penalties remain unchanged.

**Tokens:** `m.placement.*`; reuse housing dimensions and UI invalid-state tokens.

**Reduced motion:** Pick up, drag following, drop, rotation, and removal update directly with no lift, scale, or tween. Ghost opacity appears immediately. Show the seating mark for `120 ms` without fading. Illegal placement retains the static `400 ms` danger outline and omits the shake.

**Performance:** Animate only the active proxy and footprint, never the board batch. Pointer movement invalidates only when the pose or hovered cell changes. Commit shared geometry updates once per accepted edit. A settled drag or ghost owns no animation lease.

## 6. The win: a completed circuit

Victory starts only when the game’s authoritative result says every required target is lit. Animation must not create a separate target-accumulation rule. A partial target arrival receives section 2’s treatment without victory.

Let `W0` be the final required target’s presentation event.

| Time from `W0` | Behavior |
|---|---|
| `0–480 ms` | End the traveling pulse train. Apply one whole-route emissive and glow gain of `0.18 × bell(t)`. Keep all baseline altitude differences. |
| `0–500 ms` | Finish the target material change, staggered rings, and streaks already specified. |
| `520 ms` | Begin the victory modal’s existing `360 ms` fade and `12 px` rise, **easeOutCubic**. |
| Modal fully visible | Award stars at the existing offsets `[0, 180, 360] ms`. |
| Each earned star | Over `320 ms`, scale through existing values `[0.72, 1.12, 1]` at progress `[0, 0.55, 1]`; use **easeOutCubic** into the peak and **smoothstep** into rest. Fade opacity in over `120 ms`, linear. |
| First star begins | Run one cyan modal light ring for `540 ms`, then remove it. |

Empty stars remain stationary throughout. Use actual earned conditions; do not animate three awards and retract one.

The modal light ring is centered behind the stars. Its diameter grows from `0.25` to `1.25` times the modal’s smaller dimension, **easeOutCubic**. Its `1 px` stroke fades linearly from `0.18` opacity to zero. Clip it to the modal. It is a single SVG or CSS outline, with no animated blur.

After the seal, the beam remains at its existing baseline brightness. Targets retain their stationary halos. No celebratory beam circulation, moving camera, star orbit, or continuing sparkle.

**Tokens:** `m.win.*`; reuse `ui.victory`, star artwork, and target end-state tokens.

**Reduced motion:** Omit the beam seal, target rings, modal rise, star scaling, staggering, and modal light ring. Fade in the modal and all earned stars together over `120 ms`, linear, after the final target’s `120 ms` material change.

**Performance:** One beam gain uniform and bounded DOM/SVG animation. No world-space celebration system. The board stops rendering as soon as its target and beam effects finish, even while the modal animation continues.

## 7. Failure and retry: the held breath

The final diagnostic remains the visual center of a failed shot. Do not darken the board, shake the camera, flash the screen red, or move the FIRE button.

At drawn-route completion:

1. Finish the endpoint treatment.
2. Fade the post-FIRE readout in over `120 ms`, linear, in its existing reserved row.
3. Leave the full route, badges, and endpoint visible.
4. Allow `240 ms` of quiet before starting optional weather. This is a stationary presentation hold, not an input lock.

Keep the distinction visible:

- **Blocked:** solid cap and short recoil sparks.
- **Lost:** continuous tapered departure and hollow reason marker.
- **Loop:** stationary double ring after its single turn.
- **Incomplete targets:** preserve the achieved target state and readout without a danger pulse on unlit targets.

The player can edit, FIRE, or RESET during the quiet interval. New input cancels remaining decoration immediately.

### Retry and live retrace

On a committed edit after FIRE:

- Compute the new route immediately.
- Remove obsolete beam geometry, badges, caps, bounce dots, and readout contents in the same update. Do not overlay old and new routes.
- Reveal the new route over the existing `140 ms`, linear.
- Omit emitter charging, pulse trains, scatter, and target rings.
- Newly reached targets use the standard material fade; targets no longer lit return to their unlit material over `120 ms`, linear.
- Update discoveries at the new sweep’s cell-entry events.
- Do not increment FIRE count.

An explicit FIRE repeats the full sequence.

RESET updates the attempt immediately, clears the displayed trace, and restores the rules’ eligibility state. It preserves known dark cells. Do not animate terrain reconstruction or fog returning.

**Tokens:** `m.failure.*`.

**Reduced motion:** Readout appears immediately. Omit the quiet hold. Live retrace uses the existing `140 × 0.35 = 49 ms`, linear. Target-state changes take `120 ms`, linear. RESET is immediate.

**Performance:** Quiet intervals request no frames. Retrace animation uses the same merged route infrastructure. Never maintain an invisible previous-route animation.

## 8. Dark levels: fog burns back along the beam

Darkness is a cell-content mask, not volumetric mist.

Initial known cells—the emitter, target cells, and persisted discoveries—render fully known in the first frame. Do not replay their discovery. Player-placed pieces remain visible independently of this mask.

At a newly entered cell’s beam event:

1. Commit that cell to the persistent known set.
2. Record its incoming horizontal heading.
3. Over the existing `terrain.darkness.revealMs`, currently `420 ms`, sweep a reveal boundary across the cell from its entry edge to its opposite edge using **smoothstep**.
4. Give the boundary a `0.08-cell` soft transition.
5. Add a `0.04-cell` inner rim in `palette.uiAccent` at `0.12` maximum opacity. Its opacity follows **bell** over the cell’s reveal.
6. At completion, remove the rim and use exactly the normal known-cell presentation.

Compute sweep position from the cell’s local horizontal coordinates only. Its duration, width, brightness, and direction must not depend on terrain height or opening level.

Apply the same mask to terrain, fixed pieces, and opening gleams. It must never extend into an adjacent cell. Preserve the always-visible unknown grid and its existing brightness.

Terrain appears at its true position through the mask; it does not grow upward. In TILT, crossfade the unknown ground-plane grid outline to the stationary known top outline using the reveal progress. Do not translate an outline between them. In FLAT those two outlines project identically.

A blocked cell has not been entered and remains unknown. Decorative scatter, lost departure extensions, glow, camera reveals, and ghost previews never discover cells.

Known cells stay known through edits, failures, RESET, and re-entry. Reversing the camera reveal does not restore fog.

### Shadows during discovery

Unknown geometry must not cast visible shadows.

Keep the pre-shot shadow cache while cells are burning in. Newly discovered geometry does not join that cache until all reveals from the current trace have settled. Then update the shadow map once; its new shadows appear in that final frame. Existing shadows stay unchanged during discovery.

On interrupted travel or skip, settle all legitimately traversed discoveries and make one shadow-cache update. Do not rebuild shadows per newly discovered cell or per fade frame.

**Tokens:** `m.fog.*`; reuse `terrain.darkness.*`.

**Reduced motion:** Make each entered cell fully known at its event, immediately. Omit sweep, rim, grid crossfade, and geometry arrival effects. Preserve all discovery rules. Batch shadow-cache updates at trace completion.

**Performance:** Use the existing small fog-data texture, extended with per-cell reveal timing and entry direction as needed. A cell list drives uploads; no mesh per fog patch and no terrain rebuild. Cap simultaneously animated cells at `24`; when exceeded, settle the oldest first. This cap may shorten decoration but may never delay or discard discovery.

## 9. What must remain still

| Element | Rule and reason |
|---|---|
| Terrain columns | Never bob, breathe, ripple, stagger, or change scale. Movement would turn hidden structure into a timing code and make the workbench feel unstable. |
| Flat terrain shading | No traveling light, reflection shimmer, shadow motion, or grain variation. Identical tops must remain identical at every animation sample. |
| Unstruck fixed pieces | No anticipatory twitch or accent pulse. A hidden WEDGE must not identify itself before interaction. |
| Opening gleams | Static, with the same shape and intensity for every opening. Flicker frequency must not become an opening-height code. |
| Unlit targets | No bobbing, orbiting, or beacon pulse. Their location is already readable; repeated motion would compete with the shot. |
| Settled lit targets and beam | Steady light. Perpetual energy loops would consume frames and make successful reasoning feel unfinished. |
| Camera at rest | No drift, breathing zoom, inertial flourish, or automatic pursuit of the beam. The player owns the reveal. |
| Unknown dark cells | No silhouettes, shadow hints, hovering dust collisions, or content-dependent preview response. |
| Tray miniatures and panels | No auto-rotation or shimmer. Their silhouettes and labels are tools for comparison. |
| Stars outside an award | No sparkle loop. A star records a condition; it is not an attention beacon. |
| Ground | No impact waves, beam-following light pool, or height-dependent flat beam shadow. These would add false spatial evidence. |

**Tokens:** `m.policy.*`.

**Reduced motion:** Identical stationary behavior.

**Performance:** These prohibitions prevent the largest accidental source of idle rendering: attractive effects with no stopping condition.

## 10. Frame-budget rules and verification

Target `60 fps` during active motion on iPad, with a `30 fps` floor on iPhone 11. These are acceptance targets, not an assumption that this specification alone guarantees them.

Use the vendored Three.js r160 renderer. No new dependency, postprocessing composer, fluid simulation, dynamic reflection capture, or per-contact light.

- Add at most `4` WebGL draw calls for all new contact, scatter, ring, and footprint effects combined. Beam and fog modulation modify existing passes.
- Pool at most `32` transient sprites, including target streaks. If full, drop the oldest scatter first, then the oldest contact decoration. Never drop the beam, diagnostic marker, discovery, or target state.
- New animation bookkeeping should remain below `1 ms` of main-thread work per active frame at the maximum board size.
- Keep `renderer.maxDrawCalls` as an existing absolute ceiling, not a motion budget to consume.
- Render active motion from elapsed time. Do not slow game time when frames are missed.
- Coalesce shadow and fog updates per frame or settled event as specified.
- Preserve the existing minimum `34 CSS px` cell size under every quality tier.

Measure consecutive active-frame intervals. If the median of the latest `30` samples exceeds `18 ms`, drop one decorative tier. Reassess after another full sample window. Do not raise quality again during the same attempt. Do not include stationary holds or background-tab intervals in those samples.

Verification must include a `24 × 24` board with dense voxel terrain and openings, the longest permitted trace, target arrivals, camera reveal, live editing, and dark-cell discovery. Also verify:

- Flat screenshots sampled during placement and reveal dead-band motion remain invariant under changes to hidden column height, excluding explicitly permitted beam evidence.
- A MIRROR preserves a climbing pulse; DIP can level it; FLOOR switches descent to ascent.
- Skipping and interrupted traces leave correct discoveries and result markers.
- Reduced-motion toggling settles every active effect.
- After the final weather burst, instrumentation records zero scheduled application frames and zero running animations until new input.

## Token ledger

All rows below are additions under `theme.motion`. Object-valued rows specify every new leaf in that object. Values described as references resolve to existing theme tokens.

### Shared tokens

| New token | Value |
|---|---|
| `easing` | `{ linear: 'linear', smooth: 'smoothstep', enter: 'easeOutCubic', exit: 'easeInCubic', turn: 'easeInOutCubic', camera: camera.motion.easing, pulse: 'bell' }` |
| `reduced` | `{ fadeMs: 120, contactHoldMs: 120, chargeMs: 60, releaseMs: 60 }` |
| `budget` | `{ targetFps: 60, floorFps: 30, newDrawCallsMax: 4, transientSpritesMax: 32, animatedFogCellsMax: 24, cpuUpdateMs: 1, sampleFrames: 30, degradeMedianMs: 18, restoreWithinAttempt: false }` |

### Beam, contact, and FIRE tokens

| New token | Value |
|---|---|
| `beam.headCells` | `0.28` |
| `beam.headGain` | `0.45` |
| `beam.packetIntervalMs` | `240` |
| `beam.packetMs` | `480` |
| `beam.packetGain` | `0.32` |
| `beam.peakAt` | `{ level: 0.50, climb: 0.78, descend: 0.22 }` |
| `beam.pitchBlendCells` | `0.10` |
| `beam.settleMs` | `160` |
| `contact.diameterCells` | `0.12` |
| `contact.peakOpacity` | `0.60` |
| `contact.attackMs` | `36` |
| `contact.decayMs` | `144` |
| `contact.flatColor` | `palette.commonFlatPiece` |
| `contact.bounceDot` | `{ diameterCells: 0.10, opacity: 0.65, color: 'arrivalBeamColor' }` |
| `scatter.anglesDeg` | `[-35, 35]` |
| `scatter.lengthCells` | `0.06` |
| `scatter.widthCells` | `0.012` |
| `scatter.distanceCells` | `0.18` |
| `scatter.ms` | `180` |
| `scatter.opacity` | `0.45` |
| `fire.chargeMs` | `180` |
| `fire.chargeEmissiveMultiplier` | `1.35` |
| `fire.chargeHaloScale` | `0.84` |
| `fire.chargeHaloOpacity` | `0.34` |
| `fire.releaseMs` | `120` |
| `fire.badgeFadeMs` | `80` |
| `fire.lostMarkerFadeMs` | `120` |
| `target.ringDelayMs` | `80` |
| `target.ringOpacity` | `0.32` |
| `target.ringStrokeCells` | `0.018` |

### Reveal tokens

| New token | Value |
|---|---|
| `reveal.prepareMs` | `96` |
| `reveal.cameraEasing` | `'easeInOutCubic'` |
| `reveal.beamGlowMinimum` | `0.82` |
| `reveal.eligibilityFadeMs` | `160` |
| `reveal.sideEasing` | `'smoothstep'` |
| `reveal.teachingOutlineOpacity` | `0.55` |
| `reveal.teachingOutlineWidthCells` | `0.018` |

### Weather tokens

| New token | Value |
|---|---|
| `weather.enabled` | `true` |
| `weather.reducedEnabled` | `false` |
| `weather.color` | `palette.metalLight` |
| `weather.railPx` | `6` |
| `weather.fleckSizePx` | `[2, 1]` |
| `weather.startX` | `[0.16, 0.78]` |
| `weather.delaysMs` | `[0, 320]` |
| `weather.travelXPx` | `18` |
| `weather.ms` | `2400` |
| `weather.opacityStops` | `[0, 0.16, 0.16, 0]` |
| `weather.progressStops` | `[0, 0.20, 0.70, 1]` |
| `weather.iterations` | `1` |

### Placement tokens

| New token | Value |
|---|---|
| `placement.pickupMs` | `100` |
| `placement.liftPx` | `6` |
| `placement.pickupScale` | `1.04` |
| `placement.ghostOpacity` | `0.28` |
| `placement.ghostFadeMs` | `80` |
| `placement.overlayColor` | `palette.commonFlatPiece` |
| `placement.dropMs` | `140` |
| `placement.seatOpacity` | `0.24` |
| `placement.seatMs` | `180` |
| `placement.rotateDeg` | `90` clockwise |
| `placement.rotateMs` | `120` |
| `placement.floorAcknowledgeMs` | `120` |
| `placement.removeMs` | `100` |
| `placement.removeScale` | `0.92` |
| `placement.cancelMs` | `140` |
| `placement.invalidOffsets` | `[0, 1, -1, 1, 0]` |
| `placement.invalidProgress` | `[0, 0.25, 0.50, 0.75, 1]` |

### Win, failure, and darkness tokens

| New token | Value |
|---|---|
| `win.beamSealMs` | `480` |
| `win.beamSealGain` | `0.18` |
| `win.modalDelayMs` | `520` |
| `win.starMs` | `320` |
| `win.starProgress` | `[0, 0.55, 1]` |
| `win.starFadeMs` | `120` |
| `win.ringMs` | `540` |
| `win.ringDiameterFactors` | `[0.25, 1.25]` |
| `win.ringStrokePx` | `1` |
| `win.ringOpacity` | `0.18` |
| `win.ringColor` | `palette.uiAccent` |
| `failure.blockedAnglesDeg` | `[-35, 0, 35]` relative to reverse incoming heading |
| `failure.readoutFadeMs` | `120` |
| `failure.quietMs` | `240` |
| `failure.targetUnlightMs` | `120` |
| `fog.featherCells` | `0.08` |
| `fog.rimWidthCells` | `0.04` |
| `fog.rimOpacity` | `0.12` |
| `fog.rimColor` | `palette.uiAccent` |
| `fog.easing` | `'smoothstep'` |
| `fog.shadowCommit` | `'after-trace-reveals-settle'` |

### Stationary-policy and degradation tokens

| New token | Value |
|---|---|
| `policy` | `{ terrainMotion: false, flatLightingMotion: false, anticipatoryPieceMotion: false, openingPulse: false, targetIdleMotion: false, beamIdleMotion: false, cameraIdleMotion: false, trayIdleMotion: false, panelShimmer: false, starIdleMotion: false, groundWaves: false, weatherSelfRestart: false }` |
| `quality.cutOrder` | `['weather', 'scatter-and-target-streaks', 'decorative-rings-and-fog-rim', 'trailing-beam-pulses', 'pixel-ratio', 'reduced-presentation']` |
| `quality.degradedDprMax` | `1.5` |
| `quality.floorDprMax` | `1.0` |

## What to cut first

Apply these cumulative cuts in order. End a removed effect cleanly; never leave a frozen particle onscreen.

| Order | Cut | Preserve |
|---:|---|---|
| 1 | Weather. | All interaction and beam feedback. |
| 2 | Piece scatter, blocked sparks, and target streaks. | Contact discs, solid blocked caps, lost departures, target state. |
| 3 | Target rings, modal ring, seating fades, teaching outline pulse, and fog rim. Use a stationary teaching outline. | Star awards, fog discovery, camera reveal, ghost footprint. |
| 4 | Trailing beam pulses. | Linear travel, head highlight, altitude widths, badges, and FLOOR bounce dots. |
| 5 | Cap device pixel ratio at `1.5`, then `1.0` after another failed sample window. | CSS cell size, geometry, information, timing, and typography. |
| 6 | Apply the defined reduced-motion presentation to remaining effects, including camera and fog transitions. | Every logical event, complete diagnostic routes, discoveries, target states, and star conditions. |

Never cut the flat-view information boundary, unknown-cell masking, departure length, beam altitude encoding, input responsiveness, or the final transition back to zero frames.
