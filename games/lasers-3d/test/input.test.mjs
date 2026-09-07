// node:test suite for src/input.js (INTERFACES-FRONTEND.md section 2). jsdom-free: a tiny fake element.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const LaserInput = require('../src/input.js');
const LaserTheme = require('../src/theme.js');

// ---------------------------------------------------------------- fakes
function makeClock() {
  let t = 0, seq = 0;
  const timers = [];
  return {
    now: () => t,
    setTimeout(fn, ms) { const h = ++seq; timers.push({ h, at: t + ms, fn }); return h; },
    clearTimeout(h) { const i = timers.findIndex((x) => x.h === h); if (i >= 0) timers.splice(i, 1); },
    advance(ms) {
      const end = t + ms;
      for (;;) {
        timers.sort((a, b) => a.at - b.at);
        const next = timers.find((x) => x.at <= end);
        if (!next) break;
        timers.splice(timers.indexOf(next), 1);
        t = next.at;
        next.fn();
      }
      t = end;
    },
    pending: () => timers.length,
  };
}

function makeElement({ pointerEvents = true } = {}) {
  const listeners = {};
  const doc = {
    defaultView: { PointerEvent: pointerEvents ? function PointerEvent() {} : undefined },
    addEventListener(type, fn, opts) { (listeners[type] = listeners[type] || []).push({ fn, opts }); },
    removeEventListener(type, fn) { listeners[type] = (listeners[type] || []).filter((l) => l.fn !== fn); },
  };
  const el = {
    style: {},
    ownerDocument: doc,
    captured: new Set(),
    listeners,
    addEventListener: doc.addEventListener,
    removeEventListener: doc.removeEventListener,
    setPointerCapture(id) { el.captured.add(id); },
    releasePointerCapture(id) { el.captured.delete(id); },
    hasPointerCapture(id) { return el.captured.has(id); },
    dispatch(type, ev = {}) {
      ev.type = type;
      ev.defaultPrevented = false;
      ev.preventDefault = () => { ev.defaultPrevented = true; };
      for (const l of listeners[type] || []) l.fn(ev);
      return ev;
    },
    optsFor(type) { return (listeners[type] || []).map((l) => l.opts); },
  };
  return el;
}

// 7x7 board, 50 px cells starting at (0,0); off-board -> null.
const CELL = 50;
const fakeRender = {
  pickCell(x, y) {
    const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
    if (cx < 0 || cy < 0 || cx > 6 || cy > 6) return null;
    return { x: cx, y: cy };
  },
  projectCell(c) { return { x: c.x * CELL + CELL / 2, y: c.y * CELL + CELL / 2 }; },
  isFlat() { return true; },
};
const center = (cx, cy) => ({ x: cx * CELL + CELL / 2, y: cy * CELL + CELL / 2 });

function setup(opts = {}) {
  const clock = makeClock();
  const el = makeElement({ pointerEvents: opts.pointerEvents !== false });
  const log = [];
  const rec = (name) => (a, b) => log.push(b === undefined ? [name, a] : [name, a, b]);
  const handlers = {};
  for (const n of ['onTapCell', 'onTapEmpty', 'onDragPiece', 'onOrbit', 'onOrbitStart', 'onOrbitEnd', 'onZoom', 'onPan', 'onLongPressPiece', 'onHover', 'onKey']) handlers[n] = rec(n);
  const input = LaserInput.attach({ element: el, render: fakeRender, handlers, theme: LaserTheme, clock });
  const placed = opts.placed || [];
  input.setPlacedLookup((c) => placed.find((p) => p.x === c.x && p.y === c.y) || null);
  const names = () => log.map((e) => e[0]);
  const pe = (type, id, x, y, extra = {}) => el.dispatch(type, { pointerId: id, clientX: x, clientY: y, pointerType: 'touch', buttons: 1, button: 0, ...extra });
  const me = (type, id, x, y, extra = {}) => el.dispatch(type, { pointerId: id, clientX: x, clientY: y, pointerType: 'mouse', buttons: 1, button: 0, ...extra });
  return { clock, el, log, names, input, pe, me, placed };
}

// --------------------------------------------------------------- element setup
describe('attach: element setup and API surface', () => {
  test('touch-action none, user-select none, one global shape, __version', () => {
    const { el, input } = setup();
    assert.equal(el.style.touchAction, 'none');
    assert.equal(el.style.webkitUserSelect, 'none');
    assert.equal(input.__version, 1);
    assert.equal(LaserInput.__version, 1);
    assert.deepEqual(Object.keys(LaserInput).sort(), ['DEFAULTS', '__version', 'attach']);
  });
  test('passive:false only on touchstart/touchmove/wheel (+gesture/contextmenu/keydown); pointer listeners passive', () => {
    const { el } = setup();
    for (const t of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) assert.deepEqual(el.optsFor(t), [{ passive: true }], t);
    for (const t of ['touchstart', 'touchmove', 'wheel']) assert.deepEqual(el.optsFor(t), [{ passive: false }], t);
  });
  test('contextmenu is prevented', () => {
    const { el } = setup();
    assert.equal(el.dispatch('contextmenu').defaultPrevented, true);
  });
  test('factory never throws on missing optionals; handlers are all optional', () => {
    const el = makeElement();
    const input = LaserInput.attach({ element: el });
    el.dispatch('pointerdown', { pointerId: 1, clientX: 10, clientY: 10, pointerType: 'touch' });
    el.dispatch('pointerup', { pointerId: 1, clientX: 10, clientY: 10, pointerType: 'touch' });
    el.dispatch('keydown', { key: 'f' });
    input.detach(); input.detach();
    assert.ok(LaserInput.attach({}));
  });
});

// ------------------------------------------------------------------- taps
describe('tap', () => {
  test('quick press on a cell -> onTapCell with pointerType', () => {
    const { pe, log, clock } = setup();
    const p = center(1, 2);
    pe('pointerdown', 1, p.x, p.y);
    clock.advance(80);
    pe('pointerup', 1, p.x + 3, p.y - 2);
    assert.deepEqual(log, [['onTapCell', { x: 1, y: 2, pointerType: 'touch' }]]);
  });
  test('quick press off-board -> onTapEmpty', () => {
    const { pe, log } = setup();
    pe('pointerdown', 1, 900, 900);
    pe('pointerup', 1, 900, 900);
    assert.deepEqual(log, [['onTapEmpty', { pointerType: 'touch' }]]);
  });
  test('held >= 300 ms with < 10 px on empty board -> nothing', () => {
    const { pe, log, clock } = setup();
    const p = center(3, 3);
    pe('pointerdown', 1, p.x, p.y);
    clock.advance(400);
    pe('pointerup', 1, p.x, p.y);
    assert.deepEqual(log, []);
  });
  test('moved >= 10 px is never a tap', () => {
    const { pe, names } = setup();
    const p = center(3, 3);
    pe('pointerdown', 1, p.x, p.y);
    pe('pointermove', 1, p.x + 10, p.y);
    pe('pointerup', 1, p.x + 10, p.y);
    assert.ok(!names().includes('onTapCell'));
  });
  test('pointer capture is taken on down and released on up', () => {
    const { pe, el } = setup();
    pe('pointerdown', 7, 10, 10);
    assert.ok(el.captured.has(7));
    pe('pointerup', 7, 10, 10);
    assert.ok(!el.captured.has(7));
  });
  test('secondary mouse button is ignored', () => {
    const { pe, log } = setup();
    pe('pointerdown', 1, 25, 25, { pointerType: 'mouse', button: 2 });
    pe('pointerup', 1, 25, 25, { pointerType: 'mouse', button: 2 });
    assert.deepEqual(log, []);
  });
});

// ------------------------------------------------------------------ orbit
describe('drag on empty board -> orbit', () => {
  test('onOrbitStart, per-move deltas at 0.0075 rad/px, drag up = +elevation, onOrbitEnd', () => {
    const { pe, log } = setup();
    const p = center(3, 3);
    pe('pointerdown', 1, p.x, p.y);
    pe('pointermove', 1, p.x + 5, p.y);            // below threshold: nothing
    assert.deepEqual(log, []);
    pe('pointermove', 1, p.x + 20, p.y - 20);      // crosses threshold
    pe('pointermove', 1, p.x + 30, p.y - 20);
    pe('pointerup', 1, p.x + 30, p.y - 20);
    assert.equal(log[0][0], 'onOrbitStart');
    assert.equal(log[1][0], 'onOrbit');
    assert.ok(Math.abs(log[1][1] - 20 * 0.0075) < 1e-12);
    assert.ok(Math.abs(log[1][2] - 20 * 0.0075) < 1e-12);   // dy = -20 px -> +elevation
    assert.equal(log[2][0], 'onOrbit');
    assert.ok(Math.abs(log[2][1] - 10 * 0.0075) < 1e-12);
    assert.equal(log[2][2], 0);
    assert.equal(log[3][0], 'onOrbitEnd');
    assert.equal(log.length, 4);
  });
  test('drag that starts on a FIXED piece orbits (not a piece drag)', () => {
    const { pe, names } = setup({ placed: [{ x: 2, y: 2, type: 'MIRROR', orient: '/', fixed: true }] });
    const p = center(2, 2);
    pe('pointerdown', 1, p.x, p.y);
    pe('pointermove', 1, p.x + 30, p.y);
    pe('pointerup', 1, p.x + 30, p.y);
    assert.deepEqual(names(), ['onOrbitStart', 'onOrbit', 'onOrbitEnd']);
  });
  test('slow drag (after 300 ms) still becomes an orbit', () => {
    const { pe, names, clock } = setup();
    const p = center(3, 3);
    pe('pointerdown', 1, p.x, p.y);
    clock.advance(600);
    pe('pointermove', 1, p.x + 30, p.y);
    pe('pointerup', 1, p.x + 30, p.y);
    assert.deepEqual(names(), ['onOrbitStart', 'onOrbit', 'onOrbitEnd']);
  });
  test('pointercancel during orbit -> onOrbitEnd, no tap', () => {
    const { pe, names } = setup();
    pe('pointerdown', 1, 100, 100);
    pe('pointermove', 1, 130, 100);
    pe('pointercancel', 1, 130, 100);
    assert.deepEqual(names(), ['onOrbitStart', 'onOrbit', 'onOrbitEnd']);
  });
});

// ------------------------------------------------------------- drag piece
describe('drag on a placed piece -> DRAG_PIECE', () => {
  const piece = { x: 1, y: 1, type: 'WEDGE', orient: '\\' };
  test('start / move(over) / end(to)', () => {
    const { pe, log } = setup({ placed: [piece] });
    const p = center(1, 1), q = center(4, 5);
    pe('pointerdown', 1, p.x, p.y);
    pe('pointermove', 1, p.x + 12, p.y);
    pe('pointermove', 1, q.x, q.y);
    pe('pointerup', 1, q.x, q.y);
    assert.deepEqual(log, [
      ['onDragPiece', 'start', { from: { x: 1, y: 1 }, piece }],
      ['onDragPiece', 'move', { from: { x: 1, y: 1 }, piece, over: { x: 1, y: 1 } }],
      ['onDragPiece', 'move', { from: { x: 1, y: 1 }, piece, over: { x: 4, y: 5 } }],
      ['onDragPiece', 'end', { from: { x: 1, y: 1 }, piece, to: { x: 4, y: 5 } }],
    ]);
  });
  test('end off-board -> to null; no orbit callbacks at all', () => {
    const { pe, log, names } = setup({ placed: [piece] });
    const p = center(1, 1);
    pe('pointerdown', 1, p.x, p.y);
    pe('pointermove', 1, 900, 900);
    pe('pointerup', 1, 900, 900);
    assert.deepEqual(log[log.length - 1], ['onDragPiece', 'end', { from: { x: 1, y: 1 }, piece, to: null }]);
    assert.ok(!names().includes('onOrbitStart') && !names().includes('onOrbit'));
  });
  test('pointercancel -> cancel', () => {
    const { pe, log } = setup({ placed: [piece] });
    const p = center(1, 1);
    pe('pointerdown', 1, p.x, p.y);
    pe('pointermove', 1, p.x + 40, p.y);
    pe('pointercancel', 1, p.x + 40, p.y);
    assert.deepEqual(log[log.length - 1], ['onDragPiece', 'cancel', { from: { x: 1, y: 1 }, piece }]);
  });
  test('setEnabled(false) mid-drag cancels and releases capture; events swallowed while disabled', () => {
    const { pe, log, input, el } = setup({ placed: [piece] });
    const p = center(1, 1);
    pe('pointerdown', 1, p.x, p.y);
    pe('pointermove', 1, p.x + 40, p.y);
    input.setEnabled(false);
    assert.deepEqual(log[log.length - 1], ['onDragPiece', 'cancel', { from: { x: 1, y: 1 }, piece }]);
    assert.ok(!el.captured.has(1));
    const n = log.length;
    pe('pointerdown', 2, p.x, p.y); pe('pointerup', 2, p.x, p.y);
    el.dispatch('keydown', { key: 'f' });
    el.dispatch('wheel', { deltaY: -100 });
    assert.equal(log.length, n);
    input.setEnabled(true);
    pe('pointerdown', 3, 900, 900); pe('pointerup', 3, 900, 900);
    assert.deepEqual(log[log.length - 1], ['onTapEmpty', { pointerType: 'touch' }]);
  });
});

// -------------------------------------------------------------- long press
describe('long-press', () => {
  const piece = { x: 2, y: 3, type: 'MIRROR', orient: '/' };
  test('500 ms held on a movable piece -> onLongPressPiece; following up is not a tap', () => {
    const { pe, log, clock } = setup({ placed: [piece] });
    const p = center(2, 3);
    pe('pointerdown', 1, p.x, p.y);
    clock.advance(499);
    assert.deepEqual(log, []);
    clock.advance(1);
    assert.deepEqual(log, [['onLongPressPiece', { x: 2, y: 3 }]]);
    pe('pointermove', 1, p.x + 3, p.y);
    pe('pointerup', 1, p.x + 3, p.y);
    assert.equal(log.length, 1);
  });
  test('quick tap on a piece before 500 ms is a tap and clears the timer', () => {
    const { pe, log, clock } = setup({ placed: [piece] });
    const p = center(2, 3);
    pe('pointerdown', 1, p.x, p.y);
    clock.advance(100);
    pe('pointerup', 1, p.x, p.y);
    clock.advance(1000);
    assert.deepEqual(log, [['onTapCell', { x: 2, y: 3, pointerType: 'touch' }]]);
    assert.equal(clock.pending(), 0);
  });
  test('movement >= 10 px before 500 ms cancels the long-press (becomes a drag)', () => {
    const { pe, names, clock } = setup({ placed: [piece] });
    const p = center(2, 3);
    pe('pointerdown', 1, p.x, p.y);
    clock.advance(200);
    pe('pointermove', 1, p.x + 15, p.y);
    clock.advance(1000);
    assert.ok(!names().includes('onLongPressPiece'));
    assert.equal(names()[0], 'onDragPiece');
  });
  test('no long-press on empty board or on a fixed piece', () => {
    const a = setup();
    a.pe('pointerdown', 1, 100, 100); a.clock.advance(1000);
    assert.deepEqual(a.log, []);
    const b = setup({ placed: [{ x: 2, y: 2, type: 'MIRROR', orient: '/', fixed: true }] });
    const p = center(2, 2);
    b.pe('pointerdown', 1, p.x, p.y); b.clock.advance(1000);
    assert.deepEqual(b.log, []);
  });
});

// ------------------------------------------------------------------ pinch
describe('pinch', () => {
  test('second pointer -> onZoom(current/last) per move; lifting one finger ends the gesture with no tap', () => {
    const { pe, log } = setup();
    pe('pointerdown', 1, 100, 100);
    pe('pointerdown', 2, 200, 100);      // distance 100
    pe('pointermove', 2, 250, 100);      // 150 -> 1.5
    pe('pointermove', 1, 130, 100);      // 120 -> 0.8
    pe('pointerup', 2, 130 + 120, 100);
    pe('pointerup', 1, 130, 100);
    const zooms = log.filter((e) => e[0] === 'onZoom');
    assert.equal(zooms.length, 2);
    assert.ok(Math.abs(zooms[0][1] - 1.5) < 1e-12);
    assert.ok(Math.abs(zooms[1][1] - 0.8) < 1e-12);
  });
  test('pinch during a piece drag cancels the drag; during an orbit ends the orbit', () => {
    const piece = { x: 1, y: 1, type: 'DIP', orient: '/' };
    const a = setup({ placed: [piece] });
    const p = center(1, 1);
    a.pe('pointerdown', 1, p.x, p.y);
    a.pe('pointermove', 1, p.x + 30, p.y);
    a.pe('pointerdown', 2, 300, 300);
    assert.deepEqual(a.log[a.log.length - 1], ['onDragPiece', 'cancel', { from: { x: 1, y: 1 }, piece }]);
    a.pe('pointermove', 2, 320, 300);
    assert.ok(a.names().includes('onZoom'));
    const b = setup();
    b.pe('pointerdown', 1, 100, 100);
    b.pe('pointermove', 1, 140, 100);
    b.pe('pointerdown', 2, 300, 300);
    assert.deepEqual(b.names(), ['onOrbitStart', 'onOrbit', 'onOrbitEnd']);
    const n0 = b.log.length;
    b.pe('pointermove', 1, 150, 100);     // two-finger movement is never orbit
    const after = b.log.slice(n0).map((e) => e[0]);
    assert.ok(after.length > 0 && after.every((x) => x === 'onZoom' || x === 'onPan'));
  });
  test('remaining finger after a pinch never orbits or taps; long-press timer is cleared by the pinch', () => {
    const { pe, log, clock } = setup({ placed: [{ x: 2, y: 2, type: 'MIRROR', orient: '/' }] });
    const p = center(2, 2);
    pe('pointerdown', 1, p.x, p.y);
    pe('pointerdown', 2, 300, 300);
    clock.advance(1000);
    pe('pointerup', 2, 300, 300);
    pe('pointermove', 1, p.x + 60, p.y);
    pe('pointerup', 1, p.x + 60, p.y);
    assert.deepEqual(log, []);
  });
  test('a tap right after a pinch is ignored; one after the debounce window is not', () => {
    const { pe, log, clock } = setup();
    pe('pointerdown', 1, 100, 100);
    pe('pointerdown', 2, 200, 100);
    pe('pointerup', 2, 200, 100);
    pe('pointerup', 1, 100, 100);
    clock.advance(50);
    pe('pointerdown', 3, 100, 100); pe('pointerup', 3, 100, 100);
    assert.deepEqual(log, []);
    clock.advance(LaserInput.DEFAULTS.pinchTapDebounceMs);
    pe('pointerdown', 4, 100, 100); pe('pointerup', 4, 100, 100);
    assert.deepEqual(log, [['onTapCell', { x: 2, y: 2, pointerType: 'touch' }]]);
  });
});

// -------------------------------------------------------------------- pan
// DESIGN.md 11.2: two fingers pan (and zoom); ONE finger still orbits, because orbiting is the game's signature
// move and must stay the cheapest gesture. On desktop, middle-drag or Space+drag pans.
describe('pan', () => {
  test('two fingers moving together pan by the midpoint delta and do not zoom', () => {
    const { pe, log } = setup();
    pe('pointerdown', 1, 100, 100);
    pe('pointerdown', 2, 200, 100);            // distance 100, midpoint (150, 100)
    pe('pointermove', 1, 130, 140);            // midpoint (165, 120) once both have moved
    pe('pointermove', 2, 230, 140);
    const pans = log.filter((e) => e[0] === 'onPan');
    const sum = pans.reduce((a, e) => ({ x: a.x + e[1], y: a.y + e[2] }), { x: 0, y: 0 });
    assert.ok(pans.length >= 1);
    assert.ok(Math.abs(sum.x - 30) < 1e-9 && Math.abs(sum.y - 40) < 1e-9, JSON.stringify(pans));
    // pointermove arrives one finger at a time, so the spread wobbles mid-gesture; the NET zoom must be 1
    const net = log.filter((e) => e[0] === 'onZoom').reduce((a, e) => a * e[1], 1);
    assert.ok(Math.abs(net - 1) < 1e-9, 'a rigid two-finger move must not change the zoom, got ' + net);
  });
  test('a pinch that also drifts emits both onZoom and onPan', () => {
    const { pe, log } = setup();
    pe('pointerdown', 1, 100, 100);
    pe('pointerdown', 2, 200, 100);
    pe('pointermove', 2, 260, 100);            // distance 160 -> zoom 1.6, midpoint 150 -> 180
    const z = log.filter((e) => e[0] === 'onZoom'), p = log.filter((e) => e[0] === 'onPan');
    assert.equal(z.length, 1); assert.ok(Math.abs(z[0][1] - 1.6) < 1e-12);
    assert.equal(p.length, 1); assert.ok(Math.abs(p[0][1] - 30) < 1e-9 && p[0][2] === 0);
  });
  test('one finger on empty board still orbits and never pans', () => {
    const { pe, names, log } = setup();
    pe('pointerdown', 1, 100, 100);
    pe('pointermove', 1, 160, 130);
    pe('pointermove', 1, 200, 130);
    pe('pointerup', 1, 200, 130);
    assert.deepEqual(names(), ['onOrbitStart', 'onOrbit', 'onOrbit', 'onOrbitEnd']);
    assert.equal(log.filter((e) => e[0] === 'onPan').length, 0);
  });
  test('one finger on a placed piece still drags the piece and never pans', () => {
    const piece = { x: 2, y: 2, type: 'MIRROR', orient: '/' };
    const { pe, names, log } = setup({ placed: [piece] });
    const p = center(2, 2);
    pe('pointerdown', 1, p.x, p.y);
    pe('pointermove', 1, p.x + 60, p.y + 10);
    pe('pointerup', 1, p.x + 60, p.y + 10);
    assert.deepEqual(names(), ['onDragPiece', 'onDragPiece', 'onDragPiece']);
    assert.equal(log.filter((e) => e[0] === 'onPan').length, 0);
  });
  test('desktop middle-drag pans; it never orbits, drags a piece or taps', () => {
    const piece = { x: 2, y: 2, type: 'MIRROR', orient: '/' };
    const { me, log, names } = setup({ placed: [piece] });
    const p = center(2, 2);
    me('pointerdown', 1, p.x, p.y, { button: 1, buttons: 4 });
    me('pointermove', 1, p.x + 25, p.y - 15, { buttons: 4 });
    me('pointermove', 1, p.x + 35, p.y - 15, { buttons: 4 });
    me('pointerup', 1, p.x + 35, p.y - 15, { button: 1, buttons: 0 });
    assert.deepEqual(names(), ['onPan', 'onPan']);
    assert.deepEqual(log[0], ['onPan', 25, -15]);
    assert.deepEqual(log[1], ['onPan', 10, 0]);
  });
  test('desktop Space+left-drag pans; releasing Space restores orbit', () => {
    const { el, me, names, log } = setup();
    el.dispatch('keydown', { key: ' ' });
    me('pointerdown', 1, 100, 100);
    me('pointermove', 1, 140, 120);
    me('pointerup', 1, 140, 120);
    assert.deepEqual(names(), ['onPan']);      // Space only arms panning; it never edits the puzzle
    assert.deepEqual(log[0], ['onPan', 40, 20]);
    el.dispatch('keyup', { key: ' ' });
    me('pointerdown', 2, 100, 100);
    me('pointermove', 2, 140, 120);
    me('pointerup', 2, 140, 120);
    assert.deepEqual(names().slice(1), ['onOrbitStart', 'onOrbit', 'onOrbitEnd']);
  });
  test('right-button drag is ignored entirely', () => {
    const { me, log } = setup();
    me('pointerdown', 1, 100, 100, { button: 2, buttons: 2 });
    me('pointermove', 1, 160, 130, { buttons: 2 });
    me('pointerup', 1, 160, 130, { button: 2, buttons: 0 });
    assert.deepEqual(log, []);
  });
  test('setEnabled(false) drops a pan in flight and clears the Space latch', () => {
    const { el, me, input, log } = setup();
    el.dispatch('keydown', { key: ' ' });
    me('pointerdown', 1, 100, 100);
    me('pointermove', 1, 130, 100);
    input.setEnabled(false);
    input.setEnabled(true);
    const n = log.length;
    me('pointerdown', 2, 100, 100);
    me('pointermove', 2, 140, 120);
    assert.deepEqual(log.slice(n).map((e) => e[0]), ['onOrbitStart', 'onOrbit']);
  });
});

// ------------------------------------------------------------------ wheel
describe('wheel', () => {
  test('notch up -> 1.1, notch down -> 1/1.1, preventDefault, deltaY 0 ignored', () => {
    const { el, log } = setup();
    const e1 = el.dispatch('wheel', { deltaY: -53 });
    el.dispatch('wheel', { deltaY: 120, ctrlKey: true });
    el.dispatch('wheel', { deltaY: 0 });
    assert.equal(e1.defaultPrevented, true);
    assert.equal(log.length, 2);
    assert.ok(Math.abs(log[0][1] - 1.1) < 1e-12);
    assert.ok(Math.abs(log[1][1] - 1 / 1.1) < 1e-12);
  });
});

// ------------------------------------------------------------------ hover
describe('hover', () => {
  test('mouse move with no button -> onHover(cell), deduplicated, null off-board', () => {
    const { pe, log } = setup();
    pe('pointermove', 9, 75, 75, { pointerType: 'mouse', buttons: 0 });
    pe('pointermove', 9, 80, 70, { pointerType: 'mouse', buttons: 0 });
    pe('pointermove', 9, 125, 75, { pointerType: 'mouse', buttons: 0 });
    pe('pointermove', 9, 900, 900, { pointerType: 'mouse', buttons: 0 });
    pe('pointermove', 9, 901, 900, { pointerType: 'mouse', buttons: 0 });
    assert.deepEqual(log, [['onHover', { x: 1, y: 1 }], ['onHover', { x: 2, y: 1 }], ['onHover', null]]);
  });
  test('touch and pen pointers never produce hover; mouse with a button held does not either', () => {
    const { pe, names } = setup();
    pe('pointermove', 1, 75, 75, { pointerType: 'touch', buttons: 0 });
    pe('pointermove', 2, 75, 75, { pointerType: 'pen', buttons: 0 });
    pe('pointermove', 3, 75, 75, { pointerType: 'mouse', buttons: 1 });
    assert.deepEqual(names(), []);
  });
  test('mouse pointerdown clears hover; disabling clears hover', () => {
    const { pe, log, input } = setup();
    pe('pointermove', 9, 75, 75, { pointerType: 'mouse', buttons: 0 });
    pe('pointerdown', 9, 75, 75, { pointerType: 'mouse', buttons: 1 });
    assert.deepEqual(log, [['onHover', { x: 1, y: 1 }], ['onHover', null]]);
    pe('pointerup', 9, 75, 75, { pointerType: 'mouse', buttons: 0 });
    pe('pointermove', 9, 75, 75, { pointerType: 'mouse', buttons: 0 });
    input.setEnabled(false);
    assert.deepEqual(log.slice(-2), [['onHover', { x: 1, y: 1 }], ['onHover', null]]);
  });
});

// --------------------------------------------------------------- keyboard
describe('keyboard', () => {
  const key = (el, k, extra = {}) => el.dispatch('keydown', { key: k, ...extra });
  test('frozen key map', () => {
    const { el, log } = setup();
    for (const k of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' ', 'Delete', 'Backspace', 'f', 'F', 't', 'r', 'z', 'y', 'h', 'Escape', '1', '9']) key(el, k);
    key(el, 'Z', { shiftKey: true });
    key(el, 'z', { shiftKey: true });
    assert.deepEqual(log, [
      ['onKey', 'cursor', { dx: 0, dy: 1 }], ['onKey', 'cursor', { dx: 0, dy: -1 }],
      ['onKey', 'cursor', { dx: -1, dy: 0 }], ['onKey', 'cursor', { dx: 1, dy: 0 }],
      ['onKey', 'enter'], ['onKey', 'delete'], ['onKey', 'delete'],
      ['onKey', 'fire'], ['onKey', 'fire'], ['onKey', 'tilt'], ['onKey', 'reset'], ['onKey', 'undo'], ['onKey', 'redo'],
      ['onKey', 'hint'], ['onKey', 'escape'], ['onKey', 'select', { index: 1 }], ['onKey', 'select', { index: 9 }],
      ['onKey', 'redo'], ['onKey', 'redo'],
    ]);
  });
  test('handled keys are preventDefault-ed; unknown keys are not; 0 -> fit (DESIGN.md 11.2)', () => {
    const { el, log } = setup();
    assert.equal(key(el, 'ArrowUp').defaultPrevented, true);
    assert.equal(key(el, ' ').defaultPrevented, true);
    assert.equal(key(el, 'q').defaultPrevented, false);
    assert.equal(key(el, '0').defaultPrevented, true);
    assert.deepEqual(log[log.length - 1], ['onKey', 'fit']);
    assert.equal(log.length, 2);
  });
  test('modifier combos: Cmd/Ctrl+Z -> undo (prevented), Cmd/Ctrl+Shift+Z -> redo, other combos untouched', () => {
    const { el, log } = setup();
    assert.equal(key(el, 'z', { metaKey: true }).defaultPrevented, true);
    assert.equal(key(el, 'z', { ctrlKey: true, shiftKey: true }).defaultPrevented, true);
    assert.equal(key(el, 'f', { metaKey: true }).defaultPrevented, false);
    assert.equal(key(el, 'r', { ctrlKey: true }).defaultPrevented, false);
    assert.equal(key(el, 'ArrowUp', { altKey: true }).defaultPrevented, false);
    assert.deepEqual(log, [['onKey', 'undo'], ['onKey', 'redo']]);
  });
  test('ignored while the target is an input/textarea/button/contentEditable, and while disabled', () => {
    const { el, log, input } = setup();
    for (const tagName of ['INPUT', 'textarea', 'BUTTON', 'select']) key(el, 'f', { target: { tagName } });
    key(el, 'f', { target: { tagName: 'DIV', isContentEditable: true } });
    input.setEnabled(false);
    key(el, 'f'); key(el, 'Escape');
    input.setEnabled(true);
    key(el, 'f', { target: { tagName: 'CANVAS' } });
    assert.deepEqual(log, [['onKey', 'fire']]);
  });
  test('setCursor / getCursor mirror main-owned cursor; input never mutates it on keys', () => {
    const { el, input } = setup();
    input.setCursor({ x: 2, y: 3 });
    key(el, 'ArrowUp');
    assert.deepEqual(input.getCursor(), { x: 2, y: 3 });
    input.setCursor(null);
    assert.equal(input.getCursor(), null);
  });
});

// ------------------------------------------------- touch fallback + scroll block
describe('touch fallback and page-scroll blocking', () => {
  const touch = (id, x, y) => ({ identifier: id, clientX: x, clientY: y });
  test('without PointerEvent, touch events drive taps and orbits', () => {
    const { el, log, names } = setup({ pointerEvents: false });
    assert.deepEqual(el.optsFor('pointerdown'), []);
    const p = center(1, 2);
    el.dispatch('touchstart', { touches: [touch(1, p.x, p.y)], changedTouches: [touch(1, p.x, p.y)] });
    el.dispatch('touchend', { touches: [], changedTouches: [touch(1, p.x, p.y)] });
    assert.deepEqual(log, [['onTapCell', { x: 1, y: 2, pointerType: 'touch' }]]);
    el.dispatch('touchstart', { touches: [touch(2, 100, 100)], changedTouches: [touch(2, 100, 100)] });
    const mv = el.dispatch('touchmove', { touches: [touch(2, 140, 100)], changedTouches: [touch(2, 140, 100)] });
    assert.equal(mv.defaultPrevented, true);
    el.dispatch('touchend', { touches: [], changedTouches: [touch(2, 140, 100)] });
    assert.deepEqual(names().slice(1), ['onOrbitStart', 'onOrbit', 'onOrbitEnd']);
  });
  test('with PointerEvent, touchmove is preventDefault-ed only during a gesture and touch events do not double-fire', () => {
    const { el, pe, log } = setup();
    const idle = el.dispatch('touchmove', { touches: [touch(1, 5, 5)], changedTouches: [touch(1, 5, 5)] });
    assert.equal(idle.defaultPrevented, false);
    pe('pointerdown', 1, 100, 100);
    const busy = el.dispatch('touchmove', { touches: [touch(1, 140, 100)], changedTouches: [touch(1, 140, 100)] });
    assert.equal(busy.defaultPrevented, true);
    assert.deepEqual(log, []);   // the synthetic touch path is off when PointerEvent exists
    const two = el.dispatch('touchstart', { touches: [touch(1, 100, 100), touch(2, 200, 200)], changedTouches: [touch(2, 200, 200)] });
    assert.equal(two.defaultPrevented, true);
  });
  test('detach removes every listener and is idempotent', () => {
    const { el, input, pe, log } = setup();
    input.detach();
    input.detach();
    for (const t of Object.keys(el.listeners)) assert.deepEqual(el.listeners[t], [], t);
    pe('pointerdown', 1, 75, 75); pe('pointerup', 1, 75, 75);
    assert.deepEqual(log, []);
  });
});
