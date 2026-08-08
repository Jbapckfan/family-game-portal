import { readFile } from 'node:fs/promises';

const gameUrl = new URL('./cube-jumper.html', import.meta.url);
const html = await readFile(gameUrl, 'utf8');
const inlineScript = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];

if (!inlineScript) throw new Error('Geometry Dash inline script was not found.');
new Function(inlineScript);

const skinsStart = html.indexOf('const CUBE_SKINS =');
const skinsEnd = html.indexOf('// ── MUSIC SYSTEM', skinsStart);
if (skinsStart < 0 || skinsEnd < 0) throw new Error('Could not isolate the cube skins.');
const skinDefinitions = html.slice(skinsStart, skinsEnd);
const skins = new Function(`${skinDefinitions}; return CUBE_SKINS;`)();
const skinIds = new Set(skins.map(skin => skin.id));
const skinPatterns = new Set(skins.map(skin => skin.pattern));

if (skins.length < 8 || skinIds.size !== skins.length) {
  throw new Error(`Expected at least 8 uniquely identified cube skins, found ${skinIds.size}.`);
}
if (skinPatterns.size !== skins.length) {
  throw new Error('Every cube skin should have its own visible pattern.');
}
for (const skin of skins) {
  for (const color of [skin.primary, skin.secondary, skin.detail]) {
    if (!/^#[0-9a-f]{6}$/i.test(color)) throw new Error(`${skin.name} has an invalid color: ${color}.`);
  }
  if (!html.includes(`skin.pattern === '${skin.pattern}'`)) {
    throw new Error(`${skin.name} does not have a gameplay renderer for its ${skin.pattern} pattern.`);
  }
}
if (!html.includes('id="skin-picker"') || !html.includes('aria-label="Choose cube skin"')) {
  throw new Error('The accessible cube skin picker is missing.');
}
if (!html.includes('skin:selectedCubeSkin') || !html.includes('drawCubeSkin(ctx, ps, getSelectedCubeSkin())')) {
  throw new Error('Cube skin persistence or gameplay rendering is not connected.');
}

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
const gravityLaneIds = new Set();
const gravity = 1650;
const cubeSize = 26;
const arenaHeight = 300;

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

  const laneIds = new Set(
    obstacles.filter(obstacle => obstacle.gravitySection).map(obstacle => obstacle.gravitySection),
  );
  for (const laneId of laneIds) {
    if (gravityLaneIds.has(laneId)) throw new Error(`Gravity lane ${laneId} is duplicated.`);
    gravityLaneIds.add(laneId);

    const laneObjects = obstacles.filter(obstacle => obstacle.gravitySection === laneId);
    const gates = laneObjects.filter(obstacle => obstacle.type === 'portal_gravity');
    const ceilingSpikes = laneObjects.filter(obstacle => obstacle.type === 'ceiling_spike');
    if (gates.length !== 2 || gates[0].gravityGate !== 'up' || gates[1].gravityGate !== 'down') {
      throw new Error(`${level.name} ${laneId} needs one FLIP UP gate followed by one FLIP DOWN gate.`);
    }
    if (ceilingSpikes.length < 2 || ceilingSpikes.some(spike => spike.x <= gates[0].x || spike.x >= gates[1].x)) {
      throw new Error(`${level.name} ${laneId} needs at least two ceiling spikes between its gates.`);
    }

    let modeAtEntry = level.startMode || 'cube';
    let flippedAtEntry = false;
    for (const obstacle of obstacles) {
      if (obstacle.x >= gates[0].x) break;
      if (obstacle.type === 'portal_mode') modeAtEntry = obstacle.mode;
      if (obstacle.type === 'portal_gravity') {
        flippedAtEntry = obstacle.gravityGate
          ? obstacle.gravityGate === 'up'
          : !flippedAtEntry;
      }
    }
    if (modeAtEntry !== 'cube' || flippedAtEntry) {
      throw new Error(`${level.name} ${laneId} must begin in a normal upright cube section.`);
    }

    const surfaceTravelTime = Math.sqrt((2 * (arenaHeight - cubeSize)) / gravity);
    const firstSpike = ceilingSpikes[0];
    const entryRunwayTime = (firstSpike.x - gates[0].x - cubeSize) / level.speed;
    if (entryRunwayTime < surfaceTravelTime + 0.08) {
      throw new Error(`${level.name} ${laneId} does not leave enough time to reach the ceiling.`);
    }

    const nextGroundSpike = obstacles.find(obstacle =>
      obstacle.type === 'spike' && obstacle.x > gates[1].x
    );
    if (nextGroundSpike) {
      const recoveryTime = (nextGroundSpike.x - gates[1].x - cubeSize) / level.speed;
      if (recoveryTime < surfaceTravelTime) {
        const clearance = arenaHeight - cubeSize - 0.5 * gravity * recoveryTime ** 2;
        if (clearance <= nextGroundSpike.h + 12) {
          throw new Error(`${level.name} ${laneId} drops the cube into its next ground spike.`);
        }
      }
    }
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
if (gravityLaneIds.size < 4) throw new Error(`Expected at least 4 curated gravity lanes, found ${gravityLaneIds.size}.`);
if (!html.includes("obs.gravityGate==='up'?'FLIP UP':'FLIP DOWN'")) {
  throw new Error('Gravity gates are missing their directional labels.');
}

gaps.sort((a, b) => a - b);
const medianGap = gaps[Math.floor(gaps.length * 0.5)];
const p90Gap = gaps[Math.floor(gaps.length * 0.9)];
const speeds = levels.map(level => level.speed);

console.log(
  `Geometry Dash validated: ${levels.length} levels, ${skins.length} persistent cube skins, speeds ${Math.min(...speeds)}–${Math.max(...speeds)}px/s, ` +
  `${rapidTapRings} rapid-tap rings, ${gravityLaneIds.size} gravity lanes, median gap ${medianGap}px, 90th-percentile gap ${p90Gap}px, zoom ${zoom}×.`,
);
