import { readFile } from 'node:fs/promises';

const gameUrl = new URL('./ers.html', import.meta.url);
const portalUrl = new URL('../index.html', import.meta.url);
const html = await readFile(gameUrl, 'utf8');
const portal = await readFile(portalUrl, 'utf8');
const inlineScript = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];

if (!inlineScript) throw new Error('ERS inline script was not found.');
new Function(inlineScript);

if (/egyptian\s+rat\s+screw/i.test(html) || /egyptian\s+rat\s+screw/i.test(portal)) {
  throw new Error('The game and portal must use the name ERS only.');
}

const declaredIds = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]));
const referencedIds = [...inlineScript.matchAll(/getElementById\('([^']+)'\)/g)].map(match => match[1]);
const missingIds = referencedIds.filter(id => !declaredIds.has(id));
if (missingIds.length) throw new Error(`Missing DOM elements: ${[...new Set(missingIds)].join(', ')}.`);

const engineStart = inlineScript.indexOf('// ENGINE START');
const engineEnd = inlineScript.indexOf('// ENGINE END');
if (engineStart < 0 || engineEnd < 0) throw new Error('Could not isolate the ERS rules engine.');
const source = inlineScript.slice(engineStart, engineEnd);
const engine = new Function(`${source}; return {
  SUITS, RANKS, FACE_CHANCES, createDeck, shuffleInPlace, getSlapReasons,
  nextPlayerWithCards, createGame, totalCards, playCard, awardPile, slapPile,
  getWinnerIndex
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
  throw new Error('ERS requires a unique standard 52-card deck.');
}
const byRank = rank => deck.find(card => card.rank === rank);
const reasons = cards => engine.getSlapReasons(cards);
if (!reasons([byRank('4'), byRank('4')]).includes('Double')) throw new Error('Double slap rule failed.');
if (!reasons([byRank('7'), byRank('2'), byRank('7')]).includes('Sandwich')) throw new Error('Sandwich slap rule failed.');
if (!reasons([byRank('Q'), byRank('K')]).includes('Marriage')) throw new Error('Marriage slap rule failed.');
if (!reasons([byRank('4'), byRank('6')]).includes('Makes 10')) throw new Error('Makes 10 slap rule failed.');
if (!reasons([byRank('9'), byRank('2'), byRank('9')]).includes('Top–Bottom')) throw new Error('Top–Bottom slap rule failed.');
if (!reasons([byRank('3'), byRank('4'), byRank('5'), byRank('6')]).includes('4-card Run')) throw new Error('4-card Run slap rule failed.');
if (reasons([byRank('2'), byRank('5')]).length) throw new Error('A non-pattern was incorrectly slappable.');

for (const [rank, attempts] of Object.entries({ J: 1, Q: 2, K: 3, A: 4 })) {
  if (engine.FACE_CHANCES[rank] !== attempts) throw new Error(`${rank} must allow ${attempts} challenge attempts.`);
}

const penaltyState = engine.createGame(1, 30, seededRandom(500));
penaltyState.pile.push(byRank('2'), byRank('5'));
const totalBeforePenalty = engine.totalCards(penaltyState);
const handBeforePenalty = penaltyState.players[0].deck.length;
const penalty = engine.slapPile(penaltyState, 0);
if (penalty.valid || penalty.penalty !== 2 || penaltyState.players[0].deck.length !== handBeforePenalty - 2) {
  throw new Error('A bad slap must burn exactly two available cards.');
}
if (engine.totalCards(penaltyState) !== totalBeforePenalty) throw new Error('Bad slap penalty lost cards.');

let longestGame = 0;
let fullDeckGames = 0;
for (let seed = 1; seed <= 240; seed += 1) {
  const random = seededRandom(seed);
  const botCount = seed % 2 ? 1 : 2;
  const target = seed % 12 === 0 ? 52 : 30;
  const state = engine.createGame(botCount, target, random);
  if (engine.totalCards(state) !== 52) throw new Error(`Deal ${seed} lost cards.`);
  let steps = 0;
  while (engine.getWinnerIndex(state) < 0 && steps < 30000) {
    const slapReasons = engine.getSlapReasons(state.pile);
    if (slapReasons.length) {
      const slapper = Math.floor(random() * state.players.length);
      const result = engine.slapPile(state, slapper);
      if (!result.valid) throw new Error(`Simulation ${seed} missed a valid slap.`);
    } else if (state.pendingAward !== null) {
      engine.awardPile(state, state.pendingAward);
    } else {
      const result = engine.playCard(state, state.turnIndex);
      if (!result.ok && result.reason !== 'empty') throw new Error(`Simulation ${seed} could not advance.`);
    }
    if (engine.totalCards(state) !== 52) throw new Error(`Simulation ${seed} lost or duplicated cards at step ${steps}.`);
    steps += 1;
  }
  if (steps >= 30000) throw new Error(`Simulation ${seed} did not finish.`);
  if (target === 52) fullDeckGames += 1;
  longestGame = Math.max(longestGame, steps);
}

if (!html.includes('href="../index.html"') || !html.includes('Back to Alford Family Game Portal')) {
  throw new Error('ERS needs a functioning accessible portal home button.');
}
if (!html.includes('data-difficulty="rookie"') || !html.includes('data-difficulty="quick"') || !html.includes('data-difficulty="razor"')) {
  throw new Error('ERS needs all three AI reflex levels.');
}
if (!html.includes('data-bots="1"') || !html.includes('data-bots="2"') || !html.includes('data-match="full"')) {
  throw new Error('ERS needs duel, three-way, quick, and full-deck choices.');
}
if (!html.includes('touch-action: manipulation') || !html.includes('prefers-reduced-motion') || !html.includes("document.addEventListener('visibilitychange'")) {
  throw new Error('ERS is missing touch, reduced-motion, or safe background pause support.');
}
if (!html.includes('slapLockedUntil = performance.now() + 800')) {
  throw new Error('Bad slaps need a touch-safe penalty lockout.');
}
if (/https?:\/\//.test(html)) throw new Error('ERS must not depend on external runtime assets.');
if (!portal.includes('href="./games/ers.html"') || !portal.includes('<div class="game-title">ERS</div>')) {
  throw new Error('The family portal is missing the ERS card.');
}

const portalCards = [...portal.matchAll(/class="game-card"/g)].length;
if (portalCards < 23) throw new Error(`Expected at least 23 portal cards, found ${portalCards}.`);

console.log(
  `ERS validated: 52 unique cards, 6 slap patterns, face challenges 1/2/3/4, ` +
  `240 complete simulated matches (${fullDeckGames} full-deck), longest ${longestGame} actions, card conservation and portal navigation passed.`,
);
