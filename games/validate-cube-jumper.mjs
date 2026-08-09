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

const songsStart = html.indexOf('const WORLD_SONGS =');
const songsEnd = html.indexOf('const noteRatio', songsStart);
if (songsStart < 0 || songsEnd < 0) throw new Error('Could not isolate the adaptive world scores.');
const songDefinitions = html.slice(songsStart, songsEnd);
const songs = new Function(`${songDefinitions}; return WORLD_SONGS;`)();
const songTitles = new Set(Object.values(songs).map(song => song.title));
if (Object.keys(songs).length !== 6 || songTitles.size !== 6) {
  throw new Error('Expected six uniquely titled original world scores.');
}
for (const [worldId, song] of Object.entries(songs)) {
  if (!(song.bpm >= 130 && song.bpm <= 170) || !Number.isFinite(song.root)) {
    throw new Error(`${worldId} has an invalid tempo or root note.`);
  }
  if (song.bass.length !== 16 || song.lead.length !== 16 || song.chords.length < 4) {
    throw new Error(`${song.title} needs full 16-step bass/lead arrangements and four chord changes.`);
  }
}
if (!html.includes('getAdaptiveMusicEnergy()') || !html.includes('1+Math.floor(energy*3.99)') ||
    !html.includes("player.mode==='ship'") || !html.includes('audio.seek(gameTime)')) {
  throw new Error('Adaptive score layers, performance voices, or beat-accurate seeking are not connected.');
}

const coachingSystems = [
  'captureRunCheckpoint', 'restoreRunCheckpoint', 'recordRunFrame', 'analyzeDeath',
  'applyReplayFrame', 'beginDeathReplay', 'updateDeathReplay', 'drawReplayGuides',
  'startFocusPractice', 'restartFocusSection', 'completeFocusPractice',
];
for (const system of coachingSystems) {
  if (!html.includes(`function ${system}(`)) throw new Error(`The ${system} coaching system is missing.`);
}
if (!html.includes('while(runHistory.length>360)') || !html.includes("dt*.46/PHYSICS_DT") ||
    !html.includes("fillText('IDEAL TAP'") || !html.includes("fillText('YOUR TAP'")) {
  throw new Error('The bounded slow-motion coaching replay or its timing comparison is missing.');
}
if (!html.includes('triggered:level.obstacles.map') || !html.includes('collected:level.orbs.map') ||
    !html.includes('Practice This Section') || !html.includes('Focus practice')) {
  throw new Error('Exact-state one-tap section practice is not connected.');
}
if (html.includes('setTimeout(() => startGame(), 800)')) {
  throw new Error('Normal deaths still auto-restart before the player can use the replay coach.');
}

const worldsStart = html.indexOf('const WORLD_KITS =');
const worldsEnd = html.indexOf('const LEVEL_DIFFICULTY', worldsStart);
if (worldsStart < 0 || worldsEnd < 0) throw new Error('Could not isolate the authored visual worlds.');
const worldDefinitions = html.slice(worldsStart, worldsEnd);
const { WORLD_KITS: visualWorlds, WORLD_BY_LEVEL: worldByLevel } = new Function(
  `${worldDefinitions}; return { WORLD_KITS, WORLD_BY_LEVEL };`,
)();
const requiredWorlds = ['metro', 'foundry', 'glacier', 'jungle', 'rift', 'engine'];
if (Object.keys(visualWorlds).length !== requiredWorlds.length || requiredWorlds.some(id => !visualWorlds[id])) {
  throw new Error(`Expected the six authored visual worlds: ${requiredWorlds.join(', ')}.`);
}
for (const [id, world] of Object.entries(visualWorlds)) {
  if (world.id !== id || !world.name || !world.tagline || !world.material) {
    throw new Error(`Visual world ${id} is missing authored presentation data.`);
  }
  for (const color of [world.accent, world.secondary, world.deep, world.sky]) {
    if (!/^#[0-9a-f]{6}$/i.test(color)) throw new Error(`${world.name} has an invalid color: ${color}.`);
  }
}

const visualSystems = [
  'drawWorldBackdrop', 'drawWorldGround', 'drawWorldSpike', 'drawWorldBlock',
  'drawWorldSetPiece', 'updateVisualDirector', 'drawPostEffects',
  'triggerVisualTransition', 'drawLevelIntro',
];
for (const system of visualSystems) {
  if (!html.includes(`function ${system}(`)) throw new Error(`The ${system} visual system is missing.`);
}
for (const mode of ['ship', 'wave', 'ball', 'ufo', 'robot']) {
  if (!html.includes(`player.mode === '${mode}'`)) throw new Error(`The upgraded ${mode} form is missing.`);
}
if (!html.includes('const skin=getSelectedCubeSkin()') || !html.includes('const trailSkin = getSelectedCubeSkin()')) {
  throw new Error('Equipped skin colors are not connected across player forms and trails.');
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
if (!(zoom >= 1.45 && zoom <= 1.65)) throw new Error(`Gameplay zoom ${zoom} is not close enough for bold native-game framing.`);
if (!html.includes("{alpha:false,desynchronized:true}") || !html.includes('const dprCap = W <= 1024 ? 1.5 : 1.75')) {
  throw new Error('The low-latency canvas or adaptive Retina pixel budget is missing.');
}
if (!html.includes("const renderLead=state==='playing'?Math.min(PHYSICS_DT,physicsAccum):0") ||
    !html.includes('cameraX+=speed*(player.dashing?DASH_SPEED_MULT:1)*renderLead')) {
  throw new Error('Sub-frame camera/player interpolation is missing.');
}
if (!html.includes("cameraDirector.targetFocusY=aerialMode?(groundY+ceilingY)*.5") ||
    !html.includes('cameraDirector.focusY + cameraDirector.y')) {
  throw new Error('Close framing is missing its smooth gravity/aerial vertical camera follow.');
}
if (!html.includes('staticCache.lighting=lighting') || !html.includes('260-this.p.length')) {
  throw new Error('Cached lighting or the particle performance ceiling is missing.');
}
const unmappedLevels = levels.filter(level => !worldByLevel[level.name]);
if (unmappedLevels.length) {
  throw new Error(`Levels missing an authored visual world: ${unmappedLevels.map(level => level.name).join(', ')}.`);
}
const worldUsage = new Set(levels.map(level => worldByLevel[level.name]));
if (requiredWorlds.some(id => !worldUsage.has(id))) throw new Error('Every authored visual world must be used by the campaign.');

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
  `Geometry Dash validated: ${levels.length} levels across ${worldUsage.size} authored worlds, ${Object.keys(songs).length} adaptive scores, slow-motion replay coaching, exact-state focus practice, ${skins.length} persistent multi-form skins, speeds ${Math.min(...speeds)}–${Math.max(...speeds)}px/s, ` +
  `${rapidTapRings} rapid-tap rings, ${gravityLaneIds.size} gravity lanes, median gap ${medianGap}px, 90th-percentile gap ${p90Gap}px, zoom ${zoom}×.`,
);
