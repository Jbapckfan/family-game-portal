import { readFile } from 'node:fs/promises';

const bundle = await readFile(new URL('./assets/index-velocity-v2.js', import.meta.url), 'utf8');
const patcher = await readFile(new URL('./patch-built-game.mjs', import.meta.url), 'utf8');
const html = await readFile(new URL('./index.html', import.meta.url), 'utf8');

const count = fragment => bundle.split(fragment).length - 1;
const required = [
  ['guardrail component defaults to a 2 × 8 body', 'size:t=[2,8,30]', 1],
  ['both curve rails use 2 × 9 bodies', 'size:[2,9,e*Math.abs(i-t)/g*1.18]', 2],
  ['both straight rails use 2 × 8 bodies', 'size:[2,8,g+2]', 2],
  ['curve rail centers are raised to 3', 'b+Math.sin(Z)*(o/2)+3', 1],
  ['opposite curve rail center is raised to 3', 'b-Math.sin(Z)*(o/2)+3', 1],
  ['straight rail centers are raised to 2.5', 'c+Math.sin(i)*(t/2)+2.5', 1],
  ['opposite straight rail center is raised to 2.5', 'c-Math.sin(i)*(t/2)+2.5', 1],
];

for (const [description, fragment, expected] of required) {
  const actual = count(fragment);
  if (actual !== expected) throw new Error(`Expected ${description} ${expected} time(s), found ${actual}.`);
}

if (bundle.includes('size:[1.5,5') || bundle.includes('size:t=[1.5,5,30]')) {
  throw new Error('A legacy five-unit guardrail remains in the shipped bundle.');
}
if (!bundle.includes('type:"Static",position:n,rotation:e,args:t,material:{friction:0,restitution:.05}')) {
  throw new Error('Guardrail dimensions are not connected to the static physics body.');
}
if (!bundle.includes('O.jsx("boxGeometry",{args:t})')) {
  throw new Error('Guardrail dimensions are not connected to the visible mesh.');
}
if (!patcher.includes('Raise the visible and physical guardrails together')) {
  throw new Error('The repeatable bundle patch is missing its guardrail upgrade.');
}
if ((html.match(/index-velocity-v2\.js\?finish=guaranteed-v1/g) || []).length !== 2) {
  throw new Error('The page is not cache-busting both the preload and game module for the flowing track.');
}

const flowRequirements = [
  ['pitched curve surface', 'rotation:[P,v,Z]', 1],
  ['outward-canted first curve wall', 'rotation:[P,v,Z-T]', 1],
  ['outward-canted opposite curve wall', 'rotation:[P,v,Z+T]', 1],
  ['outward-canted first straight wall', 'rotation:[h,d,i-T]', 1],
  ['outward-canted opposite straight wall', 'rotation:[h,d,i+T]', 1],
  ['gently downhill starting runway', 'O.jsx(da,{start:[0,13,40],end:[0,12,-30],width:16})', 1],
  ['manual camera orbit integration', 'const orbit=window.__velocityCameraOrbit', 1],
];

for (const [description, fragment, expected] of flowRequirements) {
  const actual = count(fragment);
  if (actual !== expected) throw new Error(`Expected ${description} ${expected} time(s), found ${actual}.`);
}

if (!patcher.includes('genuinely downhill surfaces') || !patcher.includes('drag/swipe orbit')) {
  throw new Error('The repeatable patch does not preserve the flow and camera upgrades.');
}

const proPolish = await readFile(new URL('./pro-polish.js', import.meta.url), 'utf8');
for (const fragment of ['pointerdown', 'pointermove', 'DOUBLE-TAP RESET', 'cameraOrbit.pitch']) {
  if (!proPolish.includes(fragment)) throw new Error(`Camera control is missing: ${fragment}`);
}
if (!html.includes('pro-polish.js?finish=guaranteed-v1')) {
  throw new Error('The camera gesture script is not cache-busted.');
}

const finishRequirements = [
  ['live-state finish callback', 'const state=Qi.getState();return state.gameState!==Kn.PLAYING', 1],
  ['one-shot finish lock', 'window.__velocityFinishLocked=!0', 1],
  ['checkpoint completion', 'state.setLastCheckpoint(4)', 1],
  ['victory assignment', 'state.setVictory(!0)', 1],
  ['upright enlarged finish trigger', 'type:"Static",args:[12],position:n,isTrigger:!0,onCollide:finishRun', 1],
  ['visible upright finish gate', 'O.jsx(vD,{position:[0,-135,-455]})', 1],
  ['high-speed finish fallback', 'b<-445&&Math.abs(f)<18&&A>-158&&window.__velocityCompleteRun?.()', 1],
  ['new-run finish reset', 'window.__velocityFinishLocked=!1,window.__velocityFinishPulse=0', 1],
];

for (const [description, fragment, expected] of finishRequirements) {
  const actual = count(fragment);
  if (actual !== expected) throw new Error(`Expected ${description} ${expected} time(s), found ${actual}.`);
}
if (!proPolish.includes('runStarted = 0;')) {
  throw new Error('The finish celebration does not reset before replay.');
}

const courseStart = bundle.indexOf('yD=()=>');
const courseEnd = bundle.indexOf(',GD=', courseStart);
if (courseStart < 0 || courseEnd < 0) throw new Error('Could not isolate the authored course.');
const course = bundle.slice(courseStart, courseEnd);

const straightGrades = [...course.matchAll(/O\.jsx\(da,\{start:\[([^\]]+)\],end:\[([^\]]+)\]/g)];
if (straightGrades.length < 7) throw new Error(`Expected at least seven downhill straights, found ${straightGrades.length}.`);
for (const match of straightGrades) {
  const start = match[1].split(',').map(Number);
  const end = match[2].split(',').map(Number);
  if (!start.every(Number.isFinite) || !end.every(Number.isFinite)) {
    throw new Error(`Could not parse straight grade: ${match[0]}`);
  }
  if (end[1] > start[1]) throw new Error(`Uphill straight remains: ${match[0]}`);
}

const curveGrades = [...course.matchAll(/heightStart:(-?\d+(?:\.\d+)?),heightEnd:(-?\d+(?:\.\d+)?)/g)];
if (curveGrades.length < 5) throw new Error(`Expected five downhill curves, found ${curveGrades.length}.`);
for (const match of curveGrades) {
  if (Number(match[2]) > Number(match[1])) throw new Error(`Uphill curve remains: ${match[0]}`);
}

const marbleDiameter = 1;
const trackHalfThickness = 0.5;
const troughTilt = 0.42;
const straightClearance = 2.5 + (8 / 2) * Math.cos(troughTilt) - trackHalfThickness;
const curveClearance = 3 + (9 / 2) * Math.cos(troughTilt) - trackHalfThickness;
if (straightClearance < marbleDiameter * 5.5 || curveClearance < marbleDiameter * 6.5) {
  throw new Error('Canted guardrails do not retain the intended containment height.');
}

console.log(
  `Velocity flow validated: ${straightGrades.length} straights and ${curveGrades.length} curves never climb; ` +
  `canted walls retain ${straightClearance.toFixed(1)}–${curveClearance.toFixed(1)} marble diameters of height; ` +
  `manual orbit and redundant finish detection are wired.`,
);
