import { readFile } from 'node:fs/promises';

const gameUrl = new URL('./cube-jumper.html', import.meta.url);
const html = await readFile(gameUrl, 'utf8');
const inlineScript = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];

if (!inlineScript) throw new Error('Geometry Dash inline script was not found.');
new Function(inlineScript);

const definitionsStart = html.indexOf('const LEVEL_DISTANCE_SCALE');
const definitionsEnd = html.indexOf(
  '// ═══════════════════════════════════════════════════════\n// GAME ENGINE',
  definitionsStart,
);
if (definitionsStart < 0 || definitionsEnd < 0) {
  throw new Error('Could not isolate the Geometry Dash level definitions.');
}

const definitions = html.slice(definitionsStart, definitionsEnd);
const levels = new Function(`${definitions}; return buildLevels().map(paceLevel);`)();
const zoom = Number(html.match(/const GAMEPLAY_ZOOM = ([\d.]+);/)?.[1]);

if (levels.length !== 18) throw new Error(`Expected 18 levels, found ${levels.length}.`);
if (!(zoom >= 1.15 && zoom <= 1.3)) throw new Error(`Gameplay zoom ${zoom} is outside the safe range.`);

const gaps = [];
let rapidTapRings = 0;
let widestGap = 0;
const gravity = 1650;

for (const level of levels) {
  if (!Number.isFinite(level.speed) || level.speed < 285) {
    throw new Error(`${level.name} is still too slow at ${level.speed}px/s.`);
  }
  if (!Number.isFinite(level.length) || level.length <= 0) {
    throw new Error(`${level.name} has an invalid length.`);
  }

  const obstacles = [...level.obstacles].sort((a, b) => a.x - b.x);
  for (let index = 1; index < obstacles.length; index += 1) {
    const previous = obstacles[index - 1];
    const gap = Math.max(0, obstacles[index].x - (previous.x + (previous.w || 0)));
    gaps.push(gap);
    widestGap = Math.max(widestGap, gap);
  }

  const rapidSteps = obstacles.filter(obstacle => obstacle.rapidTapStep);
  rapidTapRings += rapidSteps.length;
  if (!rapidSteps.length) continue;

  const firstStep = rapidSteps[0];
  const pad = obstacles
    .filter(obstacle => obstacle.x < firstStep.x && obstacle.type.startsWith('pad_'))
    .at(-1);
  if (!pad) throw new Error(`${level.name} has a rapid-tap chain without a launch pad.`);

  let mode = level.startMode || 'cube';
  let gravityFlipped = false;
  for (const obstacle of obstacles) {
    if (obstacle.x > pad.x) break;
    if (obstacle.type === 'portal_mode') mode = obstacle.mode;
    if (obstacle.type === 'portal_gravity') gravityFlipped = !gravityFlipped;
  }
  if (mode !== 'cube' || gravityFlipped) {
    throw new Error(`${level.name} rapid-tap chain is not in a normal cube section.`);
  }

  let centerHeight = 13;
  let verticalSpeed = pad.type === 'pad_yellow' ? -560 * 1.35 : -560 * 0.95;
  let priorX = pad.x;
  for (const step of rapidSteps) {
    const travelTime = (step.x - priorX) / level.speed;
    centerHeight += -verticalSpeed * travelTime - 0.5 * gravity * travelTime ** 2;
    const missDistance = Math.abs(centerHeight - step.y);
    if (missDistance >= 40) {
      throw new Error(`${level.name} TAP ${step.rapidTapStep} misses its flight path by ${missDistance.toFixed(1)}px.`);
    }
    verticalSpeed = step.type === 'orb_pink' ? -560 * 0.7 : -560;
    priorX = step.x;
  }
}

if (widestGap > 500) throw new Error(`Obstacle gap ${widestGap}px is still too wide.`);
if (rapidTapRings < 20) throw new Error(`Expected at least 20 rapid-tap rings, found ${rapidTapRings}.`);

gaps.sort((a, b) => a - b);
const medianGap = gaps[Math.floor(gaps.length * 0.5)];
const p90Gap = gaps[Math.floor(gaps.length * 0.9)];
const speeds = levels.map(level => level.speed);

console.log(
  `Geometry Dash validated: ${levels.length} levels, speeds ${Math.min(...speeds)}–${Math.max(...speeds)}px/s, ` +
  `${rapidTapRings} rapid-tap rings, median gap ${medianGap}px, 90th-percentile gap ${p90Gap}px, zoom ${zoom}×.`,
);
