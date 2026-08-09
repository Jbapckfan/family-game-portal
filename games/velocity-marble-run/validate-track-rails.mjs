import { readFile } from 'node:fs/promises';

const bundle = await readFile(new URL('./assets/index-velocity-v2.js', import.meta.url), 'utf8');
const patcher = await readFile(new URL('./patch-built-game.mjs', import.meta.url), 'utf8');
const html = await readFile(new URL('./index.html', import.meta.url), 'utf8');

const count = fragment => bundle.split(fragment).length - 1;
const required = [
  ['guardrail component defaults to a 2 × 8 body', 'size:t=[2,8,30]', 1],
  ['both curve rails use 2 × 9 bodies', 'size:[2,9,L]', 2],
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
if ((html.match(/index-velocity-v2\.js\?course=grand-prix-v3/g) || []).length !== 2) {
  throw new Error('The page is not cache-busting both the preload and game module for the extended course.');
}

const halfPipeRequirements = [
  ['smooth half-pipe shell component', 'vHP=({position:n,rotation:e=[0,0,0],length:t,width:i=14', 1],
  ['round adaptive cross-section', 'window.__velocityLiteMode?14:22,1,!0,-a,a*2', 1],
  ['double-sided curved surface', 'roughness:.24,side:2', 1],
  ['straight shell integration', 'O.jsx(vHP,{position:[l,c,C],rotation:[h,d,i],length:g,width:t})', 1],
  ['curved shell integration', 'O.jsx(vHP,{position:[n[0]+f,b,n[2]+A],rotation:[P,v,Z],length:L,width:o,color:k})', 1],
  ['hidden straight containment slabs', 'O.jsx(Hc,{visible:!1,position:[l+', 1],
  ['hidden curved containment slabs', 'O.jsx(Hc,{visible:!1,position:[n[0]+f+', 1],
  ['half-pipe-matched containment angle', 'T=.62', 2],
];
for (const [description, fragment, expected] of halfPipeRequirements) {
  const actual = count(fragment);
  if (actual !== expected) throw new Error(`Expected ${description} ${expected} time(s), found ${actual}.`);
}
if (bundle.includes('},qH=({position:n,rotation:e=[0,0,0],length:t,width:i=14')) {
  throw new Error('The half-pipe component collides with an existing Three.js shader identifier.');
}
const halfPipeRadius = 14 * 0.56;
const halfPipeRise = halfPipeRadius * (1 - Math.cos(1.12));
if (halfPipeRise < 4.2) throw new Error('The curved shell is too shallow to read or behave like a half-pipe.');

const flowRequirements = [
  ['pitched curve floor and shell', 'rotation:[P,v,Z]', 2],
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
if (!html.includes('pro-polish.js?course=grand-prix-v3&circuits=full-length-v3')) {
  throw new Error('The camera gesture script is not cache-busted.');
}

if ((proPolish.match(/start:0, end:8/g) || []).length !== 6 || proPolish.includes('circuit().end < 5')) {
  throw new Error('Every family circuit must run the complete grand prix without an early checkpoint finish.');
}
if (!proPolish.includes('velocity-family-records-v3') || !proPolish.includes('velocity-ghost-v3:')) {
  throw new Error('Extended-course records must not be mixed with legacy short-course times.');
}
if (!proPolish.includes('<option value="7">Final sector</option>')) {
  throw new Error('Practice selection does not expose the extended final sector.');
}

const finishRequirements = [
  ['live-state finish callback', 'const state=Qi.getState();return state.gameState!==Kn.PLAYING', 1],
  ['one-shot finish lock', 'window.__velocityFinishLocked=!0', 1],
  ['checkpoint completion', 'state.setLastCheckpoint(7)', 1],
  ['victory assignment', 'state.setVictory(!0)', 1],
  ['upright enlarged finish trigger', 'type:"Static",args:[12],position:n,isTrigger:!0,onCollide:finishRun', 1],
  ['visible upright finish gate', 'O.jsx(vD,{position:[140,-410,-990]})', 1],
  ['high-speed finish fallback', 'b<-980&&Math.abs(f-140)<18&&A>-438&&window.__velocityCompleteRun?.()', 1],
  ['new-run finish reset', 'window.__velocityFinishLocked=!1,window.__velocityFinishPulse=0', 1],
  ['final-sector victory threshold', 'lastCheckpoint>=7', 1],
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

const checkpointsMatch = bundle.match(/tu=(\[\[[^;]+?\]\])/);
if (!checkpointsMatch) throw new Error('Could not isolate checkpoint coordinates.');
const checkpoints = JSON.parse(checkpointsMatch[1]);
if (checkpoints.length !== 8 || checkpoints.at(-1).join(',') !== '-180,-320,-700') {
  throw new Error('Expected eight recovery checkpoints spanning the extended grand prix.');
}

const straightGrades = [...course.matchAll(/O\.jsx\(da,\{start:\[([^\]]+)\],end:\[([^\]]+)\]/g)];
if (straightGrades.length < 15) throw new Error(`Expected at least fifteen downhill straights, found ${straightGrades.length}.`);
let straightDistance = 0;
for (const match of straightGrades) {
  const start = match[1].split(',').map(Number);
  const end = match[2].split(',').map(Number);
  if (!start.every(Number.isFinite) || !end.every(Number.isFinite)) {
    throw new Error(`Could not parse straight grade: ${match[0]}`);
  }
  if (end[1] > start[1]) throw new Error(`Uphill straight remains: ${match[0]}`);
  straightDistance += Math.hypot(end[0]-start[0], end[1]-start[1], end[2]-start[2]);
}

const curveGrades = [...course.matchAll(/heightStart:(-?\d+(?:\.\d+)?),heightEnd:(-?\d+(?:\.\d+)?)/g)];
if (curveGrades.length < 12) throw new Error(`Expected at least twelve downhill curves, found ${curveGrades.length}.`);
for (const match of curveGrades) {
  if (Number(match[2]) > Number(match[1])) throw new Error(`Uphill curve remains: ${match[0]}`);
}

const evaluateAngle = expression => {
  const numeric = expression.replaceAll('Math.PI', String(Math.PI));
  if (!/^[\d+*/.\s-]+$/.test(numeric)) throw new Error(`Unsafe curve angle: ${expression}`);
  return Function(`"use strict";return (${numeric})`)();
};
const curveDefinitions = [...course.matchAll(/radius:(\d+(?:\.\d+)?),angleStart:([^,}]+),angleEnd:([^,}]+),heightStart:(-?\d+(?:\.\d+)?),heightEnd:(-?\d+(?:\.\d+)?)/g)];
let curveDistance = 0;
for (const match of curveDefinitions) {
  const radius = Number(match[1]);
  const arc = radius * Math.abs(evaluateAngle(match[3]) - evaluateAngle(match[2]));
  curveDistance += Math.hypot(arc, Number(match[5]) - Number(match[4]));
}
const courseDistance = straightDistance + curveDistance;
if (courseDistance < 2100) throw new Error(`Extended course is still too short at ${courseDistance.toFixed(0)} track units.`);

const marbleDiameter = 1;
const trackHalfThickness = 0.5;
const troughTilt = 0.62;
const straightClearance = 2.5 + (8 / 2) * Math.cos(troughTilt) - trackHalfThickness;
const curveClearance = 3 + (9 / 2) * Math.cos(troughTilt) - trackHalfThickness;
if (straightClearance < marbleDiameter * 5 || curveClearance < marbleDiameter * 6) {
  throw new Error('Canted guardrails do not retain the intended containment height.');
}

console.log(
  `Velocity grand prix validated: ${courseDistance.toFixed(0)} track units across ${straightGrades.length} straights, ` +
  `${curveGrades.length} curves, and ${checkpoints.length-1} recovery sectors; ${halfPipeRise.toFixed(1)}-unit smooth half-pipe shoulders; ` +
  `canted containment retains ${straightClearance.toFixed(1)}–${curveClearance.toFixed(1)} marble diameters.`,
);
