# Lasers 3D — front-end interfaces (historical build contract)

> September 9, 2026: the user approved one-finger pan, two-finger orbit and pinch zoom. [CURRENT-RULES.md](CURRENT-RULES.md) supersedes the gesture mapping below. `LaserInput.attach` accepts an optional `requestFrame` callback; its `flush()` method samples multi-touch once per host frame. Mouse controls remain supported.

Companion to `INTERFACES.md` (rules engine) and `VISUAL-DIRECTION.md` (art). Four engineers build `src/render.js`, `src/input.js`, `src/ui.js`, `src/audio.js` in parallel against THIS document; `src/main.js` (the integrator) wires them. Nobody edits another module. If a signature here is wrong, fix THIS file first, then the code.

Common rules for every module:

- Plain ES2019, Safari 15. Classic script, `'use strict'` inside an IIFE, exactly ONE global per file (`window.LaserRender`, `window.LaserInput`, `window.LaserUI`, `window.LaserAudio`, `window.LaserMain`, `window.LaserTheme`, `window.LEVELS`). No `import`/`export`, no `?.`/`??`, no class fields, no `Array.prototype.at`.
- No network requests, no fonts, no texture files, no CDN. Three.js is the global `THREE` (r160 UMD, `vendor/three.min.js`).
- Every module reads visual numbers from `LaserTheme` (see `src/theme.js`); never hard-code a colour or a duration.
- Every module is created with a `create`/`attach` factory and returns a plain object; every factory is safe to call before the DOM is painted and never throws on a missing optional. `dispose`/`detach` is idempotent.
- All animation is delta-time driven (`frame(dt)` seconds); nothing uses a per-frame constant. `prefers-reduced-motion` uses `LaserTheme.reducedMotion`.
- Coordinates: game space is the sim's — `x` east, `y` north (y = 0 is the SOUTH row), `z` up (0..3), `t[y][x]`. The renderer is the ONLY module that knows Three.js world space.
- Each file under ~500 lines; split into `render-*.js` etc. if larger, each still one global, and add the extra `<script>` tag to section 8.

---

## 0. Shared types (used by every module)

```
Cell        = { x:int, y:int }                       // game grid cell
Placed      = { x, y, type:'MIRROR'|'WEDGE'|'DIP', orient:'/'|'\\' }
ParsedLevel = LaserSim.parseLevel(level)             // see INTERFACES.md section 3
TraceResult = LaserSim.trace(parsedLevel, placed)    // see INTERFACES.md section 2
CameraName  = 'flat' | 'tilt'
Stars       = 0 | 1 | 2 | 3
Progress    = { currentLevel:int, highestUnlocked:int, stars:{ [levelIndex:string]: Stars }, muted:boolean }   // DESIGN.md 3.6
Solution    = [{ x, y, type, orient }]               // levels.js extension, section 7

ViewModel (main -> ui.setState) = {
  levelIndex:int,                 // 0-based index into LEVELS
  levelCount:int,
  level: ParsedLevel,
  placed: Placed[],
  trayRemaining: { MIRROR:int, WEDGE:int, DIP:int },   // counts left in the tray
  selectedTray: 'MIRROR'|'WEDGE'|'DIP'|null,           // tray type armed for the next tap
  selectedCell: Cell|null,        // a placed piece the player selected (shows floating controls)
  cursorCell: Cell|null,          // keyboard cursor (null until a key is used)
  fires:int, tiltsUsed:int, hintUsed:boolean,
  beamResult: TraceResult|null,
  status: 'idle'|'placing'|'tracing'|'won',
  stars: Stars,                   // best stars saved for this level
  attemptStars: Stars,            // stars the CURRENT attempt would earn if it solved now
  camera: CameraName,             // current preset (or 'tilt' whenever not flat)
  isFlat: boolean,
  muted: boolean,
  canUndo: boolean, canRedo: boolean,
  revealPlaying: boolean          // the free reveal is animating; ui shows controls disabled
}
```

---

## 1. `window.LaserRender` — `src/render.js`

### 1.1 API

```js
var render = LaserRender.create({ canvas, theme, sim });
//  canvas: HTMLCanvasElement (already in #stage). theme: LaserTheme. sim: LaserSim (for DIRS/PIECES only).
//  Throws Error('webgl-unavailable') if a WebGL context cannot be created. main catches this and calls ui.showWebGLFallback().

render.setLevel(parsedLevel)            // rebuilds terrain (merged geometry per material), grid strips, emitter, targets, fixed pieces; clears beam, placed, selection, ghost, hover. Refits both camera presets.
render.setPlaced(placed)                // Placed[]; diff-free full rebuild is acceptable (<= 20 pieces)
render.setBeam(traceResult, opts)       // traceResult: TraceResult|null. opts = { animate:boolean, fired:boolean }
                                        //   animate:true  -> beam grows from the emitter at theme.beam.travel.cellsPerSecond (FIRE)
                                        //   animate:false -> beam re-draws over theme.beam.travel.liveRetraceMs (live retrace after an edit)
                                        //   fired:true    -> altitude badges are shown (at every altitudeMarks entry); fired:false -> no badges
                                        //   null          -> removes the beam, badges and end caps
                                        //   Target lit materials switch when the animated beam head reaches each hit target; end-state effects (section G) fire when the head reaches endPoint.
render.setCameraPreset(name, opts)      // name: 'flat'|'tilt'; opts = { animate:boolean, durationMs?:number }. Spherical interpolation around the board center, theme.camera.motion timings/easing (theme.easeCamera), reduced-motion honoured. Returns a Promise resolved when the move ends (resolved immediately if !animate).
render.orbit(dAzimuthRad, dElevationRad)   // relative; elevation clamped to theme.camera.orbit [25, 90] deg; cancels any preset animation
render.zoom(factor)                     // multiplies current zoom; clamped to theme.camera.zoom [0.82, 1.35] x preset fit
render.pickCell(clientX, clientY)       // -> {x,y}|null. Ray from the client point; tests each column's TOP face (a 0.96 square at height t[y][x]) and returns the nearest hit column. Works at any elevation. Off-board -> null.
render.projectCell(cell, zOffset)       // -> {x:clientX, y:clientY} of the cell center at height t + (zOffset||0). ui uses this for the floating piece controls and hints.
render.setSelection(cell|null)          // cyan outline ring on a placed piece
render.setGhost(ghost|null)             // ghost = { x, y, type, orient, invalid?:boolean }; 45% opacity piece (accent color, danger if invalid). Used for the hint, the drag preview and the keyboard cursor preview.
render.setHover(cell|null)              // subtle cell highlight; ONLY called for fine pointers (input never sends it on touch)
render.setCursor(cell|null)             // keyboard cursor: dashed outline
render.pulseCell(cell, opts)            // one 500 ms cyan outline pulse (reveal choreography step 5). opts = { color? }
render.resize(width, height, dpr)       // CSS px + devicePixelRatio (main caps dpr at theme.renderer.maxDevicePixelRatio). Re-fits the current preset preserving the board center.
render.frame(dtSeconds)                 // advance animations and draw ONE frame. Must be cheap when nothing changed (still draws).
render.isFlat()                         // elevation >= 90 - theme.camera.flatEpsilonDeg (i.e. within 2 deg of straight down)
render.getShadingBlend()                // theme.revealBlend(elevationDeg), 0..1
render.getCamera()                      // { azimuthDeg, elevationDeg, zoom, preset:'flat'|'tilt'|null, animating:boolean }
render.setReducedMotion(bool)
render.dispose()                        // frees geometries/materials/renderer; canvas is left in the DOM
render.snapshotTrayIcon(type, sizePx)   // -> data URL (PNG) of the piece's physical model at 35 deg elevation on transparent, for the tray cards and How-to-Play. Cached per type+size. Returns '' if WebGL is unavailable.
```

### 1.2 World mapping (FROZEN)

Game `(x, y, z)` -> Three.js world `(x, z, -y)`. That is: `worldX = x`, `worldY = z` (up), `worldZ = -y`. The camera up-vector is `(0, 1, 0)`. In the FLAT preset the camera sits on `+Y` looking down `-Y` with the screen-up direction being world `-Z`, so **north (game +y) is up on the screen and east is right**; x is never flipped.

Board center = `((w-1)/2, 0, -(d-1)/2)`. Cell `(x,y)` top face is a `0.96 x 0.96` square centered at `(x, t[y][x], -y)`. A beam at level z runs at world `y = z + 0.5`; a segment with `v != 0` is a true 45-degree diagonal (`from.z+0.5` to `to.z+0.5`). Terminal stubs (blocked / lost-floor / lost-sky) end at the cell boundary; slope them by `v` to the exact height (floor 0, sky 4).

Azimuth `a` and elevation `e` (degrees): camera position relative to the board center at distance `R` = `(R cos e sin a, R sin e, R cos e cos a)` — azimuth 0 = camera due south (world +Z) looking north; TILT (-45, 35) puts the camera south-west and above. Light positions in `theme.lightRig.tilt` are in GAME space `(x, y, z)`; map them with the same rule.

### 1.3 Reveal contract

- `reveal = theme.revealBlend(elevationDeg)`. Floor/top shader mix, light multipliers, side opacity, physical-piece vs glyph opacity, shadow enable exactly per VISUAL-DIRECTION.md section D.
- **Secret fixed pieces** (`level.fixed[i].secret === true`): drawn with a MIRROR's physical model while `reveal < 0.5`, and with their real type's model (WEDGE/DIP face + accent filament) when `reveal >= 0.5`. The FLAT glyph is identical for every piece anyway. Never expose the real type via color, shadow or outline below 0.5.
- Tray icons (`snapshotTrayIcon`) always show the real physical model.

### 1.4 Beam animation contract

`setBeam(result, {animate:true, fired:true})` starts travel; `render.getBeamProgress()` -> `{ playing:boolean, cells:number, total:number }` so main can play `travel` audio and fire `hit`/`blocked`/`lost` sounds at the right moment. render calls NO callbacks; main polls `getBeamProgress().playing` each frame and emits `onBeamDone` itself.

---

## 2. `window.LaserInput` — `src/input.js`

### 2.1 API

```js
var input = LaserInput.attach({ element, render, handlers, theme });
//  element: the canvas (touch-action:none set by input). render: for pickCell/projectCell/isFlat. handlers: below (all optional; missing = no-op).
input.setEnabled(bool)          // false: swallow every event (used during the reveal and while a modal is open); pointer capture released
input.setPlacedLookup(fn)       // fn(cell) -> Placed|null, set by main so input can tell "drag on a piece" from "drag on empty board"
input.setCursor(cell|null)      // sync the keyboard cursor (main owns it; input only proposes moves)
input.detach()
```

### 2.2 Handlers (event payloads)

```
onTapCell({ x, y, pointerType })                 // tap < 10 px movement and < 300 ms, on a board cell (pickCell != null)
onTapEmpty({ pointerType })                       // tap off the board (clears selection)
onDragPiece(phase, payload)                       // phase 'start'|'move'|'end'|'cancel'
                                                  //   start: { from:Cell, piece:Placed }   (pointer went down on a PLACED, non-fixed piece and moved >= 10 px)
                                                  //   move : { from:Cell, piece:Placed, over:Cell|null }
                                                  //   end  : { from:Cell, piece:Placed, to:Cell|null }   (to == null or to == from -> main cancels)
onOrbit(dAzimuthRad, dElevationRad)               // continuous; pointer down anywhere NOT on a placed piece, moved >= 10 px. 1 px = 0.0075 rad azimuth, 0.0075 rad elevation (drag up = look more from above). Sent once per pointermove. Any call counts as a tilt for stars (main increments tiltsUsed on the FIRST onOrbit of a gesture, i.e. on onOrbitStart).
onOrbitStart() / onOrbitEnd()
onZoom(factor)                                    // two-finger pinch: factor = currentDistance / lastDistance (incremental). Wheel: factor = 1.1 or 1/1.1 per notch (ctrl/pinch-wheel included).
onLongPressPiece({ x, y })                        // pointer held 500 ms, < 10 px movement, on a placed piece -> opens the floating controls (same as a tap). Suppresses the following tap.
onHover(cell|null)                                // fine pointers only (pointerType 'mouse' and no active button)
onKey(action, payload)                            // action in: 'cursor' {dx,dy} | 'enter' | 'delete' | 'fire' | 'tilt' | 'reset' | 'undo' | 'redo' | 'hint' | 'escape' | 'select' {index:1..9}
```

Keyboard map (FROZEN): ArrowUp/Down/Left/Right -> `cursor` with dy +1/-1, dx -1/+1 (Up = north = y+1); Enter or Space -> `enter` (place if empty cell and a tray piece is selected, else rotate); Delete/Backspace -> `delete`; F -> `fire`; T -> `tilt`; R -> `reset`; Z -> `undo` (Shift+Z or Y -> `redo`); H -> `hint`; Escape -> `escape`; digits 1-9 -> `select` (tray slot). Keys are ignored while the event target is an input/textarea/button or a modal is open (`input.setEnabled(false)`), and never `preventDefault` on modifier combos (Cmd/Ctrl) other than Cmd/Ctrl+Z.

### 2.3 Gesture arbitration (FROZEN)

Pointer Events only (`pointerdown/move/up/cancel`, with `setPointerCapture`); no mouse/touch fallbacks. A gesture is one of TAP, DRAG_PIECE, ORBIT, PINCH, LONG_PRESS:

1. `pointerdown` (primary): record `t0`, `p0`, `cell0 = render.pickCell()`, `piece0 = placedLookup(cell0)`; start the 500 ms long-press timer if `piece0`.
2. A second active pointer at any time -> PINCH: cancel everything else (send `onDragPiece('cancel')` if a drag had started), then `onZoom(factor)` per move; two-finger rotate is NOT orbit. When one finger lifts, the gesture ends (no tap).
3. `pointermove` beyond 10 px before 300 ms elapsed OR after: if `piece0` and `!piece0.fixed` -> DRAG_PIECE (`start`, then `move` with `over = pickCell()`); else ORBIT (`onOrbitStart` then `onOrbit` deltas). Clear the long-press timer.
4. Long-press timer fires (no move) -> LONG_PRESS: `onLongPressPiece`, mark the gesture consumed.
5. `pointerup` with < 10 px and < 300 ms and not consumed -> `onTapCell(cell0)` if `cell0`, else `onTapEmpty`. `> 300 ms` and < 10 px on empty board -> nothing. 
6. `pointercancel` -> `onDragPiece('cancel')` / `onOrbitEnd()` as applicable.

Element setup: `style.touchAction = 'none'`; `-webkit-user-select:none`; `contextmenu` prevented on the canvas; `passive:false` only on `touchstart`/`touchmove` listeners used to block page scroll/zoom on the canvas and on `wheel`; every other listener passive. No hover state is ever produced for `pointerType !== 'mouse'`.

---

## 3. `window.LaserUI` — `src/ui.js`

### 3.1 API

```js
var ui = LaserUI.create({ root, theme, handlers, render });
//  root: #app element (contains #stage with the canvas). ui builds ALL DOM for HUD/tray/modals/toasts inside root, injects theme.cssVariables() into a <style id="lasers3d-theme"> in <head> if not present, and the page background.
//  render: optional; used for snapshotTrayIcon and projectCell (ui falls back to text labels if absent).

ui.setState(viewModel)              // idempotent full render; diffing internal
ui.showPieceControls({ screenX, screenY, cell })   // floating Rotate + Remove (44x44 each) anchored near the point, kept inside the stage; z-index theme.ui.zIndex.pieceControls
ui.hidePieceControls()
ui.showToast(text, opts)            // opts = { ms?:number (default theme.ui.toastMs), kind?:'intro'|'info'|'danger'|'success' }
ui.showHowToPlay() / ui.hideHowToPlay()       // modal with focus trap; opens automatically on first launch (no progress key yet)
ui.showLevelSelect() / ui.hideLevelSelect()   // grid of tiles: stars, cyan states, locks (index > highestUnlocked)
ui.showVictory({ stars, piecesUsed, par, fires, tiltsUsed, hintUsed, hasNext })   // choreography per VISUAL-DIRECTION.md F; buttons Next / Replay / Levels
ui.hideVictory()
ui.showWebGLFallback()              // replaces the stage with the message + link to ../mini-games/lasers_mirrors_game.html; Menu link still visible
ui.isModalOpen()                    // boolean (any of: how-to-play, level select, victory)
ui.closeTopModal()                  // Escape handler target; returns true if something closed
ui.flashInvalid(what)               // what: 'tray'|'cell'|'button:fire'; two 70 ms shakes + danger border 400 ms
ui.setHintGhostVisible(bool)        // toggles the HINT button "active" look while the ghost is shown
ui.loadProgress()                   // -> Progress; NEVER throws; corrupt/missing -> { currentLevel:0, highestUnlocked:0, stars:{}, muted:false }
ui.saveProgress(progress)           // NEVER throws; swallows quota / private-mode errors. Key 'lasers3d.v1', JSON.
ui.destroy()
```

### 3.2 Handlers (all optional)

```
onTraySelect(type|null)      // tap a tray card (tapping the selected one deselects)
onFire() onReset() onTiltToggle() onHint() onUndo() onRedo() onSoundToggle() onHelp() onLevels()
onRotateSelected() onRemoveSelected()        // floating controls
onSelectLevel(index)                          // from the grid (locked tiles do not emit)
onNextLevel() onRetryLevel()                  // victory modal
onModalOpen() onModalClose()                  // main calls input.setEnabled accordingly
```

### 3.3 DOM contract (ids/classes main and tests rely on)

`a.menu-link[href="../../"]` fixed top-left, `z-index:9999`, min 64x44, text "Menu" (`aria-label="Back to the Alford Family Game Portal"`). Nothing ever covers it: backdrops are `z-index:900`, modals `910`, HUD `100`. Test: `document.elementFromPoint(20, 20)` is the Menu link with every overlay open.

`#hud` (level number + name; stars; `PIECES used/par` in `--font-data`; tilt pill `data-camera="flat|tilt"`), `#sound` (48x44, `aria-pressed`), `#tray` with `.tray-card[data-type]` (`aria-pressed` for selected, `disabled` at zero count, `.tray-count`), `#btn-fire`, `#btn-tilt` (`aria-pressed`), `#btn-reset`, `#btn-hint`, `#btn-undo`, `#btn-redo`, `#btn-levels`, `#btn-help`, `#piece-controls` with `#btn-rotate` and `#btn-remove`, `#toast`, `#modal-help`, `#modal-levels`, `#modal-victory`, `#webgl-fallback`. Every button has an `aria-label` and both dimensions >= 44 px. Stars are inline SVG `.star[data-earned="true|false"][data-blind="true"]` per section F.

Modals: `role="dialog" aria-modal="true"`, focus moves to the close button on open, Tab cycles inside, focus returns to the opener on close, `Escape` closes (ui listens on its own; main ALSO gets input `escape` and calls `closeTopModal()` — ui must tolerate both).

Viewport: ui owns the `#stage` sizing: `min(#stage clientWidth/Height, visualViewport, documentElement client)`, re-fit on `resize`, `orientationchange`, `visualViewport.resize` and a `ResizeObserver` on `#stage`; it emits `handlers.onStageResize({ width, height, dpr })` and main calls `render.resize`. Safe-area insets via `env(safe-area-inset-*)`.

---

## 4. `window.LaserAudio` — `src/audio.js`

```js
var audio = LaserAudio.create({ theme });    // creates NO AudioContext until unlock()
audio.unlock()            // call on the first pointerdown/keydown; creates/resumes the context; safe to call repeatedly; returns boolean (unlocked)
audio.play(name)          // 'place'|'rotate'|'remove'|'fire'|'travel'|'hit'|'blocked'|'lost'|'win'|'tilt'|'flat'|'ui'|'invalid'|'hint'|'reveal'
                          //   'travel' starts a loop (returns nothing; a second play('travel') is a no-op while looping)
audio.stop(name)          // stops 'travel' (others are one-shots and ignore stop)
audio.setMuted(bool)      // mutes via master gain (context stays alive); persisted by main through progress.muted
audio.isMuted()
audio.setLevel(z)         // 0..3: pitches the travel loop up a musical step per altitude (optional flourish; must be cheap)
audio.dispose()
```

All sounds are synthesized (oscillators + gain envelopes + optional noise buffer); no files, no fetch. Every call is safe before `unlock()` (no-op) and when the context is suspended. Max polyphony 8; a play beyond that steals the oldest voice. Volume: master 0.6, one-shots <= 0.5 peak, travel loop 0.18.

---

## 5. `window.LaserMain` — `src/main.js` (integrator, built last)

```js
LaserMain.start({ root, canvas })   // called from index.html after all scripts; returns the app object below for tests
app = { state, sim: LaserSim, render, input, ui, audio, theme, loadLevel(index), fire(), reset(), undo(), redo(), hint(), tilt(), setPlaced(placed), getViewModel(), destroy() }
```

State machine: `idle` (level loaded, nothing placed) -> `placing` (any edit; live retrace with `{animate:false, fired:false}`) -> `tracing` (FIRE pressed: `fires++`, `setBeam(result,{animate:true, fired:true})`, input disabled until `getBeamProgress().playing` is false) -> back to `placing` on failure, or `won` when `result.allTargetsHit` (victory modal, progress saved). RESET -> `idle` (clears placed, beam, `tiltsUsed = 0`, `hintUsed = false`, `fires = 0`; undo stack cleared; camera snaps flat).

Undo/redo: stack of `placed` snapshots (JSON-cloned) pushed on every place/rotate/remove/move; undo/redo re-trace live.

Stars (DESIGN.md 3.6, computed on `won`): 1 always; +1 if `placed.length <= level.par && !hintUsed`; +1 if `tiltsUsed === 0`. `tiltsUsed` increments on every `onOrbitStart` and every TILT press (not on FLAT press, not on the free reveal). Saved stars = `max(old, new)`; `highestUnlocked = max(highestUnlocked, levelIndex + 1)`.

Free reveal (levels with `levelIndex` 3 or 4, i.e. levels 4 and 5): after the first FIRE that fails on that level (`!allTargetsHit`), once per level per session-AND-storage (`progress.revealed[levelIndex] = true` is allowed as an extra key; `loadProgress` tolerates extra keys), run: hold 280 ms -> `setCameraPreset('tilt',{animate:true,durationMs:900})` -> hold 1300 ms with `render.pulseCell(relevantCell)` (the first `overflights` cell, else the first secret fixed piece, else the first `t>0` cell the beam passes) -> `setCameraPreset('flat',{animate:true,durationMs:650})` -> re-enable input. `tiltsUsed` unchanged; `viewModel.revealPlaying = true` throughout.

Hint: `level.solution` (section 7) is required; pick the first solution entry whose cell is not already occupied by a placed piece of that type+orient; `render.setGhost(entry)` for `theme.ui.hintGhostMs` (2000 ms); `hintUsed = true`. If no solution is available the HINT button is disabled.

Frame loop (`requestAnimationFrame`, `dt = min(0.05, (now - last)/1000)`), order FROZEN:

1. input (events already dispatched synchronously into main handlers between frames)
2. main: apply pending state changes; if `placedDirty` -> `sim.trace(level, placed)` -> `render.setPlaced` + `render.setBeam(result, {animate:false, fired:false})` (or `{animate:true, fired:true}` when the change was FIRE)
3. main: poll `render.getBeamProgress()` for audio cues and the `tracing -> placing|won` transition
4. `ui.setState(getViewModel())` only when the view model changed (main keeps a version counter)
5. `render.frame(dt)`

---

## 6. `index.html` load order and shell

```html
<script src="vendor/three.min.js"></script>
<script src="src/pieces.js"></script>
<script src="src/sim.js"></script>
<script src="src/theme.js"></script>
<script src="src/levels.js"></script>
<script src="src/audio.js"></script>
<script src="src/render-core.js"></script>
<script src="src/render-terrain.js"></script>
<script src="src/render-pieces.js"></script>
<script src="src/render-beam.js"></script>
<script src="src/render.js"></script>
<script src="src/input.js"></script>
<script src="src/ui.js"></script>
<script src="src/main.js"></script>
<script>LaserMain.start({ root: document.getElementById('app'), canvas: document.getElementById('board') });</script>
```

Shell DOM authored by the integrator: `<a class="menu-link" href="../../">Menu</a>` FIRST in body, then `<div id="app"><div id="stage"><canvas id="board"></canvas></div></div>`; ui builds the rest. Meta: viewport `width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no`, `apple-mobile-web-app-capable`, `theme-color` = `theme.palette.background`. `<style>` in head holds only the shell layout; tokens come from `theme.cssVariables()`.

---

## 7. `src/levels.js` extension: `solution`

`window.LEVELS = [ level, ... ]` per INTERFACES.md section 3, plus an optional per-level field:

```js
solution: [{ x, y, type: 'MIRROR'|'WEDGE'|'DIP', orient: '/'|'\\' }]   // a proven minimal solution (length == par), written by the solver/curator
```

`LaserSim.parseLevel` ignores it (it copies only known fields), so main reads it from the RAW `LEVELS[i].solution`, never from the parsed level. It is used ONLY by the hint. `validate-levels.mjs` asserts it re-traces to `allTargetsHit` with `length === par` when present.

---

## 8. Test hooks

- `window.__lasers3d = app` after `LaserMain.start` (Playwright reads `app.getViewModel()` and calls `app.setPlaced`).
- Each module exposes `MODULE.__version = 1`. The renderer is split into `render-core.js` (`LaserRenderCore`), `render-terrain.js` (`LaserRenderTerrain`), `render-pieces.js` (`LaserRenderPieces`), `render-beam.js` (`LaserRenderBeam`) and the facade `render.js` (`LaserRender`); load them in that order (section 6). `render.cellToScreen(cell)` is an alias of `render.projectCell(cell, 0)`. Renderer smoke test: `node test/render.smoke.mjs` (Playwright WebKit against `tools/render-harness.html`; writes `flat.png` / `tilt.png` to `$SHOTS_DIR`).
- Console must be clean (no errors, no warnings) through: load, place, rotate, fire, solve level 1 and level 5, open every modal, tilt/flat, resize.

---

## Changes

Amendments to the frozen contract above, newest last. Everything not listed here is unchanged.

### 2026-09-03 — big boards: tight camera fit, minimum tappable cell, pan/zoom, FIT (DESIGN.md section 11)

Levels are now 12x12 to 24x24. The camera no longer fits from a fixed padding on board width.

**New file** `src/render-camera.js` (global `LaserRenderCamera`), loaded between `render-core.js` and `render-terrain.js`
(section 6 script order becomes: `render-core.js`, **`render-camera.js`**, `render-terrain.js`, `render-pieces.js`,
`render-beam.js`, `render.js`). It owns the orthographic rig: bounding-box fit, presets, orbit, zoom, pan.

**`window.LaserRender` gains**

```js
render.fitToBoard(opts)      // opts = { animate:boolean, durationMs?:number }. Re-frames the board in the CURRENT
                             //   orientation and clears the pan. Returns a Promise resolved when the move ends.
render.pan(dxCssPx, dyCssPx) // translates the camera target in the board plane so the board follows the pointer.
                             //   Clamped: at least theme.camera.panMinVisiblePct (25%) of the board's projected box
                             //   stays inside the canvas on each axis.
render.getCellPx()           // on-screen size of one cell in CSS px = zoom x the SMALLER of the two board axes'
                             //   projected lengths (1 in FLAT, cos of the view angle under TILT). Never < minCellPx.
render.canFit()              // true when the board is zoomed or panned away from its framed view (drives ui `canFit`)
render.getBoardScreenBox()   // { width, height, centerX, centerY } in canvas CSS px, canvas centre at (0, 0);
                             //   the board's projected bounding box. Used by tests and by the pan clamp.
```

**Changed**

- `render.zoom(factor)` now clamps the ABSOLUTE zoom to `[fit-to-board zoom, 3 x the minCellPx zoom]` instead of
  multiplying a `[0.82, 1.35]` factor. `getCamera()` additionally returns `cellPx`, `fitZoom` and `effectiveZoom`,
  and `animating` is true during a `fitToBoard` tween as well as a preset move.
- The frustum is fitted to the board's projected bounding box in the CURRENT orientation (all silhouette points:
  the floor slab's corners, every terrain top-face corner at its own height, and the tops of the emitter, targets and
  fixed pieces), leaving `theme.camera.fitMarginPct` per side. It is refitted on level change, resize, orbit and
  preset moves. During a free orbit the fit EASES to its new value over `theme.camera.fitSmoothingMs` so it never
  visibly pumps; preset animations and explicit fits snap.
- When that fit would make a cell smaller than `theme.camera.minCellPx`, the camera does NOT shrink further: it zooms
  so cells are exactly `minCellPx` and the board overflows the canvas. On a phone a 20x20 board therefore starts
  zoomed showing part of the board. That is intended (DESIGN.md 11.2).
- `render.pickCell` is unchanged in contract but no longer raycasts per-cell meshes. It marches the ray through the
  height field (a 2D DDA over the at most ~10 cells the ray crosses between the tallest block and the floor, one
  slab test per cell) — exact, and O(1) in board size.

**`window.LaserInput` gains**

```
onPan(dxCssPx, dyCssPx)      // two-finger drag (the pinch midpoint's travel), desktop middle-drag, or Space+left-drag
```

- Gesture arbitration 2.3 point 2 is extended: two pointers emit BOTH `onZoom` (spread ratio) and `onPan` (midpoint
  delta) per move. A ONE-finger drag is unchanged — orbit on empty board, drag on a placed piece — and never pans.
- Keyboard map gains `0` -> `fit`. Every other key is unchanged. Space still sends `enter`; holding it additionally
  arms the desktop pan drag.
- `LaserInput.DEFAULTS` gains `panMinPx` (0).

**`window.LaserUI`**

- ViewModel gains `canFit: boolean`. `ui.setState` shows `#btn-fit` only when it is true.
- New handler `onFit()`. New DOM id `#btn-fit` (`aria-label="Fit board to screen"`, >= 44 px, styled like TILT/RESET
  and placed immediately after `#btn-tilt`), hidden by default.

**`window.LaserTheme.camera`**

- Added: `fitMarginPct` (0.04), `fitSmoothingMs` (170), `panMinVisiblePct` (0.25), `motion.fitMs` (420).
- `zoom` is now `{ minFactorOfFit: 1, maxCellPxMultiple: 3 }` (was `{ min, max }`).
- `presets.*.paddingCells`, `.minPaddingCells` and `.fitHeights` are DEPRECATED and no longer read by the renderer.
  They are still exported so node tooling that imports them keeps loading.
- `piece.trayIcon` added: `{ azimuthDeg: 88, elevationDeg: 18, marginPct: 0.06, lookAtY: 0.40 }` — see below.

**Tray icons.** `render.snapshotTrayIcon` used to look perpendicular into the piece's diagonal panel (azimuth 45,
which is normal to the `/` hinge), so MIRROR, WEDGE and DIP all rendered as the same plain coloured rectangle. The
icon camera now stands ~40 degrees off the hinge at a low elevation, with one frustum fitted to the union of the
three models' bounds so they are drawn at the same scale: MIRROR reads as an upright panel, WEDGE as a face rising to
the right, DIP as a face falling to the right. The housing is in every icon for scale and each piece keeps its accent.

### 2026-09-03 — review fixes: criterion stars, post-FIRE readout, exclusive reveal, dirty rendering, view toggle

Amendments from the gpt-5.6-sol code review (S3, S4, S5/S10, S6, S8, S9, S13, S14) and the art-direction review
(A3-A7), plus the OVERVIEW/WORKING view toggle. Everything not listed here is unchanged.

**Stars are three criterion FLAGS, never an ordinal count (S3).** `Stars` in section 0 becomes

```
StarFlags = { solved:boolean, par:boolean, blind:boolean }
Progress  = { schema:2, currentLevel, highestUnlocked, stars:{ [levelIndex]: StarFlags }, muted, ... }
```

- `ui.loadProgress()` migrates a schema-1 numeric count of N to the first N flags in the order solved, par, blind,
  and stamps `schema: 2`. It still never throws; the storage key is unchanged (`lasers3d.v1`).
- ViewModel: `stars` and `attemptStars` are `StarFlags`; `starCount` and `attemptStarCount` carry the numbers for
  display. `ui.showVictory({ stars: StarFlags, starCount, ... })`.
- Each HUD / victory / level-tile star is drawn from its OWN flag, so a hinted blind solve lights stars one and
  three. Saving a win ORs the criteria into the stored set (`LaserUI.mergeStars`), it does not `max()` a count.
- `window.LaserUI` gains `starFlags(v)`, `starCount(v)`, `mergeStars(a, b)`, `starsHtml(v)`, `STAR_KEYS`, `SCHEMA`
  and `endText` (the kid-language end-reason strings).

**Post-FIRE readout (S5 + S10).** New ViewModel field and DOM node:

```
readout: { kind:'success'|'danger', end:string, message:string,
           altitude: { beamZ:int, targetZ:int, above:boolean } | null,
           progress: { lit:int, total:int } | null } | null
```

`ui.setReadout(readout)` (also driven by `ui.setState`) renders `#readout`: `.readout-msg` plus `.readout-chips`
with `.chip` elements. `#readout` is its own GRID ROW between `#hud` and `#stage` (grid area `readout`), so it can
never cover the board or the Menu link; the row collapses to nothing while `readout` is null. main builds it from
the trace: an overflown target (a `visited` state on a target cell at a different `z`) becomes "flew over" /
"passed under" plus both altitudes as CARET + NUMBER (never colour alone); `level.targets.length > 1` adds
"n of m lit"; otherwise the end reason maps through `LaserUI.endText`. It is cleared by an edit, RESET, a level
change and the start of the next FIRE.

**Camera view toggle: OVERVIEW / WORKING (DESIGN.md 11.2).** `render.fitToBoard()` could only ever re-apply the
34 px minimum-cell zoom, so on a board bigger than the floor the FIT button never fitted the board.

```js
render.setViewMode('working'|'overview', { animate })   // -> Promise; clears pan and userZoom
render.getViewMode()                                    // 'working' | 'overview'
render.hasOverview()                                    // true when the min-cell clamp makes the two states differ
```

- WORKING (the default on every level load) is the shipping behaviour: cells never below `theme.camera.minCellPx`,
  board overflows, player pans. OVERVIEW zooms to the bounding-box fit so the WHOLE board is on screen, with cells
  allowed below the touch floor because it is a planning view. `fitToBoard` is now `setViewMode(currentMode)`.
- `getCamera()` gains `view`. `rig.isAnimating()` is new (see dirty rendering).
- ViewModel gains `viewToggle: 'overview'|'working'|'fit'|null` — the DESTINATION of a press, or null to hide the
  button. `#btn-fit` takes its text and `aria-label` from it (`ALL` / `ZOOM` / `FIT`); `canFit` still drives
  visibility for callers that do not set `viewToggle`. `onFit()` and the `0` key both toggle.

**Beam travel is duration-clamped and skippable (S8).** `theme.beam.travel` gains `minDurationMs` (340),
`maxDurationMs` (2200) and `skipGraceMs` (140); `theme.reducedMotion` gains `beamTravelMinDurationMs` /
`beamTravelMaxDurationMs`. The travel speed is `pathLength / clamp(pathLength / cellsPerSecond, min, max)`, so a
60-cell route on a 24x24 board takes ~2.2 s instead of ~11 s. `render.finishBeam()` jumps the head to the end of
the path (the next `frame()` then fires every remaining hit and the end-state effect); main calls it from a
document-level `pointerdown` / `keydown` / `touchstart` listener while `status === 'tracing'`, ignoring anything
inside `skipGraceMs` of the FIRE so the gesture that fired cannot skip its own beam.

**Dirty rendering (S13).** main no longer runs `requestAnimationFrame` forever. It schedules a frame on any state
change (`bump()` marks dirty), on input, on resize and on `visibilitychange` to visible; it stops scheduling while
`document.hidden`; and after each frame it keeps going only while `S.dirty`, `status === 'tracing'` (the beam ends
INSIDE `render.frame()`, after `pollTrace` has run) or `render.needsFrame()`.

```js
render.needsFrame()   // rig.isAnimating() || beam.isAnimating() || pieces.isAnimating()
```

`app.state.frames` counts frames drawn (test hook).

**Exclusive one-time reveal (S6).** While `revealPlaying`: `loadLevel()` returns false, `onLevels`/`onHelp` are
vetoed and `#btn-levels` / `#btn-help` / `#btn-more` are disabled alongside TILT / RESET, and board input is off.
`progress.revealed[levelIndex]` is written in `endReveal()`, i.e. only when the choreography actually finishes, so
an interruption (reload, level change, close) leaves the lesson to replay.

**RESET waits for the camera (S4).** RESET clears the attempt, then, if the board is tilted, keeps the app busy
(`viewModel.cameraBusy`, `busy()` true, input and controls disabled) until the animated return to flat resolves,
and clears the counters again at the end. `ui.setState` treats `cameraBusy` like `revealPlaying`.

**Audio (S9, S14).** `LaserAudio.create` accepts `document` and `window` overrides for testing, listens for
`visibilitychange` / `pagehide` / `freeze` to stop the travel loop, and rebuilds the whole graph on the next
`unlock()` when the context is closed or a `resume()` failed to reach `running`. A one-shot voice is released only
once EVERY source has ended (the second `invalid` beep and the final `win` note are no longer cut off). New test
hooks: `__onVisibility`, `__onPageHide`, `__state()`.

**UI / art.** `materials.blockSide` is self-lit at its own colour (`emissiveIntensity: 1.5`, measured — see the
comment in theme.js). `materials.targetFlatProxy` is a new FLAT-only screen-facing target reticle that cross-fades
with the physical orb (`opacity = (1 - reveal) * (1 - lit)`, orb `opacity *= max(reveal, lit)`), so a dormant
target is no longer a black hole in the floor and still leaks no height. `pieces.frame(dt, speed, view)` takes the
view so the reticle can face the camera. Opening any modal hides the toast and resumes it, with its remaining time,
when the last modal closes. The sound button is a 20x20 stroked SVG (`fill:none; stroke:currentColor;
stroke-width:2`), not an emoji. `#hud` reserves `max(--hud-left, --hud-right)` on BOTH sides so the panel is
centred in its row; `--hud-right` is a new shell token. `ui.showPieceControls` keeps the floating controls
`pointer-events: none` for 260 ms after they appear, so the tap that opened them cannot also click Rotate.

**New files (section 6 load order).** `src/main-trace.js` (`LaserMainTrace`) and `src/main-camera.js`
(`LaserMainCamera`) load between `src/ui.js` and `src/main.js`:

```html
<script src="src/ui.js"></script>
<script src="src/main-trace.js"></script>
<script src="src/main-camera.js"></script>
<script src="src/main.js"></script>
```

- `LaserMainTrace` is pure and DOM-free: `flyover(level, result)`, `readout(level, result, texts)`,
  `cues(level, result)` (arc-length audio cue schedule) and `revealCell(level, result)`.
- `LaserMainCamera.create({ theme, render, hold, play, dirty, alive })` owns the free-reveal choreography
  (`playReveal(cell, done)` / `cancelReveal()`) and the view toggle (`viewToggle()` / `toggleView(opts)`).
