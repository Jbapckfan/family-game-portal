import { readFile } from 'node:fs/promises';

const bundle = await readFile(new URL('./assets/index-velocity-v2.js', import.meta.url), 'utf8');
const patcher = await readFile(new URL('./patch-built-game.mjs', import.meta.url), 'utf8');
const html = await readFile(new URL('./index.html', import.meta.url), 'utf8');

const count = fragment => bundle.split(fragment).length - 1;
const required = [
  ['guardrail component defaults to a 2 × 8 body', 'size:t=[2,8,30]', 1],
  ['both curve rails use 2 × 9 bodies', 'size:[2,9,e*Math.abs(i-t)/g*1.18]', 2],
  ['both straight rails use 2 × 8 bodies', 'size:[2,8,g+2]', 2],
  ['both starting-runway rails use 2 × 9 bodies', 'size:[2,9,72]', 2],
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
if ((html.match(/index-velocity-v2\.js\?rails=high/g) || []).length !== 2) {
  throw new Error('The page is not cache-busting both the preload and game module for the taller rails.');
}

const marbleDiameter = 1;
const trackHalfThickness = 0.5;
const straightClearance = 2.5 + 8 / 2 - trackHalfThickness;
const curveClearance = 3 + 9 / 2 - trackHalfThickness;
if (straightClearance < marbleDiameter * 6 || curveClearance < marbleDiameter * 7) {
  throw new Error('Guardrails do not provide the intended six-to-seven marble diameters of containment.');
}

console.log(
  `Velocity rails validated: straight walls ${straightClearance.toFixed(1)} marble diameters above the track, ` +
  `curve walls ${curveClearance.toFixed(1)}, 2-unit collision thickness, visible and physical geometry share dimensions.`,
);
