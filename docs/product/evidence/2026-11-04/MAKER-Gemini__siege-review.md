### Static Source Review: Syntax Siege

#### 1. Fatal TDZ `ReferenceError` on Submit ([`engine.mjs`](file:///private/tmp/MAKER-Gemini__siege-ui-20261104/games/qwen-syntax-siege/engine.mjs#L42))
In `submit()`, `let state={...state,played,selected:[]};` references `state` before its lexical declaration finishes (the parameter is named `s`). Submitting any valid word throws a fatal `ReferenceError: Cannot access 'state' before initialization`, completely crashing gameplay. It must be `...s`.

#### 2. DOM Thrashing on Every Tick in Tile Mode ([`app.mjs`](file:///private/tmp/MAKER-Gemini__siege-ui-20261104/games/qwen-syntax-siege/app.mjs#L42-L44))
`boardStamp` serializes `{...s, remainingMs: 0}` to skip full DOM updates on clock ticks. However, `s.paceCarry` is omitted from normalization. In tile mode, `paceCarry` cycles (0, 1, 2) on almost every tick (`delta * 2 % 3`), causing `stamp !== boardStamp`. The entire DOM (`root.innerHTML`) re-renders 60 times/sec, wiping active touch interactions and button focus.

#### 3. Keyboard `Enter` Ignored When Focused on Child Elements ([`app.mjs`](file:///private/tmp/MAKER-Gemini__siege-ui-20261104/games/qwen-syntax-siege/app.mjs#L68))
In `root.onkeydown`, submitting with Enter requires `event.key === 'Enter' && event.target === root`. When any inner DOM element (tile, button, or panel container) receives focus, `event.target` is that element rather than `root`. As a result, pressing Enter to fire a word is silently dropped despite the instructions stating "Enter fires".

#### 4. Broken CSS Selector on Breached Core ([`styles.css`](file:///private/tmp/MAKER-Gemini__siege-ui-20261104/games/qwen-syntax-siege/styles.css#L3))
The selector `breached .tower-body` lacks the class dot prefix (`.breached .tower-body`). Because CSS parses this as a tag selector for `<breached>`, breach visual styles never apply when core HP reaches 0 and `.breached` is added to `.siege-arena`.

#### 5. Disabled Tiles Disguised as Interactive ([`styles.css`](file:///private/tmp/MAKER-Gemini__siege-ui-20261104/games/qwen-syntax-siege/styles.css#L16))
`.siege-rack .tile:disabled:not(.selected){opacity:1}` strips the visual disabled state from unselected tiles before defense starts and after completion. The tiles retain full opacity, 3D shadows, and crisp backgrounds, misleading users into tapping non-functional controls.

#### 6. Untimed Assist Abruptly Snaps Enemy Position ([`app.mjs`](file:///private/tmp/MAKER-Gemini__siege-ui-20261104/games/qwen-syntax-siege/app.mjs#L20-L24))
Activating untimed assist mid-wave switches the approach ratio from `s.remainingMs / w.durationMs` to `1 - practicePhase / 20000`. Because `practicePhase` is uninitialized (`0`) during timed play, the approaching enemy instantly teleports all the way back to spawn (86%), violating smooth approach preservation.

#### 7. Mouse-Clicked "Start" Erroneously Flags Mixed Input ([`app.mjs`](file:///private/tmp/MAKER-Gemini__siege-ui-20261104/games/qwen-syntax-siege/app.mjs#L65))
Clicking "Start defense" with a mouse passes `eventMode(event) === 'tiles'` (as `detail > 0`), locking the state into tile entry and setting `inputHistory` to `2`. When a desktop player types their first letter, it shifts to keyboard and sets `inputHistory` to `3`, incorrectly branding pure keyboard players as mixed input users.
