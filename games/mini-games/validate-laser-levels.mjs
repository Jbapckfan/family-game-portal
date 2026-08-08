import { readFile } from 'node:fs/promises';

const gameUrl = new URL('./lasers_mirrors_game.html', import.meta.url);
const html = await readFile(gameUrl, 'utf8');
const dataStart = html.indexOf('const M45 =');
const dataEnd = html.indexOf('let gameState =', dataStart);
if (dataStart < 0 || dataEnd < 0) throw new Error('Could not locate laser level definitions.');

const levelSource = html.slice(dataStart, dataEnd);
const levels = new Function(`${levelSource}; return LEVELS;`)();

const viewports = [
  { name: 'desktop', width: 1200, height: 640 },
  { name: 'tablet', width: 1024, height: 688 },
  { name: 'phone', width: 390, height: 684 },
  { name: 'small-phone', width: 320, height: 488 },
  { name: 'phone-landscape', width: 844, height: 310 },
];

const roundCoordinate = value => Math.round(value * 1000) / 1000;
const uniqueSorted = values => [...new Set(values.map(roundCoordinate))].sort((a, b) => a - b);
const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

function expandedObstacles(level, width, height, clearance = 8) {
  return level.obstacles.map(obstacle => ({
    left: obstacle.xPct * width - clearance,
    right: (obstacle.xPct + obstacle.wPct) * width + clearance,
    top: obstacle.yPct * height - clearance,
    bottom: (obstacle.yPct + obstacle.hPct) * height + clearance,
  }));
}

function pointBlocked(x, y, obstacles) {
  return obstacles.some(obstacle => x > obstacle.left && x < obstacle.right && y > obstacle.top && y < obstacle.bottom);
}

function segmentClear(a, b, obstacles) {
  if (a.x !== b.x && a.y !== b.y) return false;
  return obstacles.every(obstacle => {
    if (a.y === b.y) {
      const left = Math.min(a.x, b.x);
      const right = Math.max(a.x, b.x);
      return !(a.y > obstacle.top && a.y < obstacle.bottom && right > obstacle.left && left < obstacle.right);
    }
    const top = Math.min(a.y, b.y);
    const bottom = Math.max(a.y, b.y);
    return !(a.x > obstacle.left && a.x < obstacle.right && bottom > obstacle.top && top < obstacle.bottom);
  });
}

function compressPath(path) {
  if (path.length < 3) return path;
  const compressed = [path[0]];
  for (let index = 1; index < path.length - 1; index += 1) {
    const previous = compressed[compressed.length - 1];
    const current = path[index];
    const next = path[index + 1];
    if ((previous.x === current.x && current.x === next.x) || (previous.y === current.y && current.y === next.y)) continue;
    compressed.push(current);
  }
  compressed.push(path[path.length - 1]);
  return compressed;
}

function solveLevel(level, width, height, maxTurns = level.mirrors.length) {
  // Keep solution turns far enough from walls and screen edges for a 55px,
  // 45-degree mirror to fit comfortably under a finger.
  const longestMirror = Math.max(...level.mirrors.map(mirror => mirror.length), 55);
  const clearance = longestMirror / Math.sqrt(2) / 2 + 4;
  const boardMargin = Math.max(28, clearance + 4);
  const obstacles = expandedObstacles(level, width, height, clearance);
  const source = { x: roundCoordinate(level.laser.xPct * width), y: roundCoordinate(level.laser.yPct * height) };
  const target = { x: roundCoordinate(level.target.xPct * width), y: roundCoordinate(level.target.yPct * height) };
  const xValues = [source.x, target.x, boardMargin, width - boardMargin];
  const yValues = [source.y, target.y, boardMargin, height - boardMargin];
  for (let step = 1; step < 10; step += 1) {
    xValues.push(width * step / 10);
    yValues.push(height * step / 10);
  }

  obstacles.forEach(obstacle => {
    xValues.push(clamp(obstacle.left, boardMargin, width - boardMargin));
    xValues.push(clamp(obstacle.right, boardMargin, width - boardMargin));
    yValues.push(clamp(obstacle.top, boardMargin, height - boardMargin));
    yValues.push(clamp(obstacle.bottom, boardMargin, height - boardMargin));
  });

  const xs = uniqueSorted(xValues);
  const ys = uniqueSorted(yValues);
  const nodes = [];
  ys.forEach((y, row) => xs.forEach((x, col) => {
    if (pointBlocked(x, y, obstacles)) return;
    nodes.push({ x, y, id: `${col},${row}` });
  }));

  const sourceNode = nodes.find(node => node.x === source.x && node.y === source.y);
  const targetNode = nodes.find(node => node.x === target.x && node.y === target.y);
  if (!sourceNode || !targetNode) return null;

  const directions = [
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: -1 },
  ];
  const initialDirection = Math.round((((level.laser.angle || 0) / (Math.PI / 2)) % 4 + 4) % 4);
  const queue = [{ node: sourceNode, direction: initialDirection, turns: 0, path: [sourceNode] }];
  const seen = new Set([`${sourceNode.id}|${initialDirection}|0`]);

  while (queue.length) {
    const state = queue.shift();
    if (state.node.id === targetNode.id) return compressPath(state.path);

    directions.forEach((direction, nextDirection) => {
      const turn = nextDirection === state.direction ? 0 : 1;
      if (state.path.length === 1 && turn) return;
      if (turn && (nextDirection + 2) % 4 === state.direction) return;
      const nextTurns = state.turns + turn;
      if (nextTurns > maxTurns) return;
      if (!turn && state.path.length > 1) return;

      nodes.forEach(nextNode => {
        if (nextNode.id === state.node.id) return;
        const deltaX = nextNode.x - state.node.x;
        const deltaY = nextNode.y - state.node.y;
        if (direction.dx && (deltaY !== 0 || Math.sign(deltaX) !== direction.dx)) return;
        if (direction.dy && (deltaX !== 0 || Math.sign(deltaY) !== direction.dy)) return;
        if (!segmentClear(state.node, nextNode, obstacles)) return;
        const key = `${nextNode.id}|${nextDirection}|${nextTurns}`;
        if (seen.has(key)) return;
        seen.add(key);
        queue.push({ node: nextNode, direction: nextDirection, turns: nextTurns, path: [...state.path, nextNode] });
      });
    });
  }
  return null;
}

let failures = 0;
levels.forEach((level, index) => {
  const results = viewports.map(viewport => ({ viewport, path: solveLevel(level, viewport.width, viewport.height) }));
  const failed = results.filter(result => !result.path);
  if (failed.length) {
    failures += 1;
    const diagnostics = failed.map(result => {
      const path = solveLevel(level, result.viewport.width, result.viewport.height, 12);
      return `${result.viewport.name}${path ? ` needs ${Math.max(0, path.length - 2)}` : ' has no route'}`;
    });
    console.error(`FAIL ${index + 1}. ${level.name}: ${diagnostics.join(', ')}`);
    return;
  }
  if (level.minimumMirrors) {
    const easierLayouts = viewports.filter(viewport =>
      solveLevel(level, viewport.width, viewport.height, level.minimumMirrors - 1)
    );
    if (easierLayouts.length) {
      failures += 1;
      console.error(`FAIL ${index + 1}. ${level.name}: easier than its ${level.minimumMirrors}-mirror challenge on ${easierLayouts.map(viewport => viewport.name).join(', ')}`);
      return;
    }
  }
  const desktopPath = results[0].path;
  const turns = Math.max(0, desktopPath.length - 2);
  const route = desktopPath.map(point => `(${Math.round(point.x)},${Math.round(point.y)})`).join(' -> ');
  console.log(`PASS ${index + 1}. ${level.name}: ${turns}/${level.mirrors.length} mirrors ${route}`);
});

if (failures) {
  console.error(`\n${failures} laser level${failures === 1 ? '' : 's'} failed passability validation.`);
  process.exitCode = 1;
} else {
  console.log(`\nAll ${levels.length} laser levels have a clear route on desktop, tablet, and phone layouts.`);
}
