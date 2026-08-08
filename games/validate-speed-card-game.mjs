import { readFile } from 'node:fs/promises';

const gameUrl = new URL('./speed-card-game.html', import.meta.url);
const portalUrl = new URL('../index.html', import.meta.url);
const html = await readFile(gameUrl, 'utf8');
const portal = await readFile(portalUrl, 'utf8');
const inlineScript = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];

if (!inlineScript) throw new Error('Speed inline script was not found.');
new Function(inlineScript);

const declaredIds = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]));
const referencedIds = [...inlineScript.matchAll(/getElementById\('([^']+)'\)/g)].map(match => match[1]);
const missingIds = referencedIds.filter(id => !declaredIds.has(id));
if (missingIds.length) throw new Error(`Missing DOM elements: ${[...new Set(missingIds)].join(', ')}.`);

const engineStart = inlineScript.indexOf('// ENGINE START');
const engineEnd = inlineScript.indexOf('// ENGINE END');
if (engineStart < 0 || engineEnd < 0) throw new Error('Could not isolate the Speed rules engine.');
const engineSource = inlineScript.slice(engineStart, engineEnd);
const engine = new Function(`${engineSource}; return {
  SUITS, RANKS, createDeck, shuffleInPlace, isPlayable, dealGame, topCards,
  availableMoves, remainingCards, applyMove, recycleCenters, dealCenterCards,
  chooseStrategicMove
};`)();

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

const deck = engine.createDeck();
if (deck.length !== 52 || new Set(deck.map(card => card.id)).size !== 52) {
  throw new Error('A standard unique 52-card deck is required.');
}

const ace = deck.find(card => card.rank === 'A');
const two = deck.find(card => card.rank === '2');
const three = deck.find(card => card.rank === '3');
const king = deck.find(card => card.rank === 'K');
if (!engine.isPlayable(ace, two) || !engine.isPlayable(two, ace) || !engine.isPlayable(ace, king) || !engine.isPlayable(king, ace)) {
  throw new Error('Ace must connect to both King and 2 in both directions.');
}
if (engine.isPlayable(ace, ace) || engine.isPlayable(ace, three)) {
  throw new Error('Only adjacent ranks should be playable.');
}

let longestSimulation = 0;
let recycledGames = 0;
for (let seed = 1; seed <= 300; seed += 1) {
  const random = seededRandom(seed);
  const state = engine.dealGame(random);
  const initialCards = [
    ...state.human.hand, ...state.human.stock,
    ...state.ai.hand, ...state.ai.stock,
    ...state.reserve, ...state.centers.flat(),
  ];
  if (initialCards.length !== 52 || new Set(initialCards.map(card => card.id)).size !== 52) {
    throw new Error(`Deal ${seed} lost or duplicated a card.`);
  }
  if (state.human.hand.length !== 5 || state.human.stock.length !== 15 || state.ai.hand.length !== 5 || state.ai.stock.length !== 15 || state.reserve.length !== 10) {
    throw new Error(`Deal ${seed} does not match Speed's 5-card hands and 15-card stocks.`);
  }

  let steps = 0;
  let recycled = false;
  while (engine.remainingCards(state, 'human') && engine.remainingCards(state, 'ai') && steps < 5000) {
    let moved = false;
    for (const sideKey of ['human', 'ai']) {
      const move = engine.chooseStrategicMove(state, sideKey, random, .5);
      if (move) {
        engine.applyMove(state, sideKey, move.handIndex, move.pileIndex);
        moved = true;
        if (!engine.remainingCards(state, sideKey)) break;
      }
    }
    if (!moved) {
      const reserveBefore = state.reserve.length;
      const dealt = engine.dealCenterCards(state, random);
      if (!dealt) throw new Error(`Deal ${seed} reached an unrecoverable deadlock.`);
      if (reserveBefore < 2) recycled = true;
    }
    steps += 1;
  }
  if (steps >= 5000) throw new Error(`Deal ${seed} did not finish.`);
  if (recycled) recycledGames += 1;
  longestSimulation = Math.max(longestSimulation, steps);

  const finalCards = [
    ...state.human.hand, ...state.human.stock,
    ...state.ai.hand, ...state.ai.stock,
    ...state.reserve, ...state.centers.flat(),
  ];
  if (finalCards.length !== 52 || new Set(finalCards.map(card => card.id)).size !== 52) {
    throw new Error(`Simulation ${seed} lost or duplicated a card.`);
  }
}

if (!recycledGames) throw new Error('Simulations never exercised center-pile recycling.');
if (!html.includes('href="../index.html"') || !html.includes('Back to Alford Family Game Portal')) {
  throw new Error('The game needs a functioning accessible portal home button.');
}
if (!html.includes('data-difficulty="chill"') || !html.includes('data-difficulty="quick"') || !html.includes('data-difficulty="turbo"')) {
  throw new Error('All three bot speeds must be available.');
}
if (!html.includes("document.addEventListener('visibilitychange'") || !html.includes("localStorage.setItem(STORAGE_KEY")) {
  throw new Error('Automatic pause or local record persistence is missing.');
}
if (!html.includes('if (stallTimer) return;') || !html.includes('stallTimer = 0;')) {
  throw new Error('Deadlock flips must not be starved by the AI timer.');
}
if (!html.includes('touch-action: manipulation') || !html.includes('prefers-reduced-motion')) {
  throw new Error('Touch or reduced-motion support is missing.');
}
if (/https?:\/\//.test(html)) throw new Error('The game should not require external runtime assets.');
if (!portal.includes('href="./games/speed-card-game.html"') || !portal.includes('Speed: Beat the Bot')) {
  throw new Error('The family portal is missing the Speed game card.');
}

const portalCards = [...portal.matchAll(/class="game-card"/g)].length;
if (portalCards < 22) throw new Error(`Expected at least 22 portal cards, found ${portalCards}.`);

console.log(
  `Speed validated: 52 unique cards, 300 simulated races, ${recycledGames} recycling races, ` +
  `longest simulation ${longestSimulation} steps, 3 AI speeds, portal card and home navigation present.`,
);
