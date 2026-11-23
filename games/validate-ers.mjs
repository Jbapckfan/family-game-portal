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
  getWinnerIndex, isOut, canSlap, settleStall
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

const penaltyState = engine.createGame(1, 'full', seededRandom(500));
penaltyState.pile.push(byRank('2'), byRank('5'));
const totalBeforePenalty = engine.totalCards(penaltyState);
const handBeforePenalty = penaltyState.players[0].deck.length;
const penalty = engine.slapPile(penaltyState, 0);
if (penalty.valid || penalty.penalty !== 2 || penaltyState.players[0].deck.length !== handBeforePenalty - 2) {
  throw new Error('A bad slap must burn exactly two available cards.');
}
if (engine.totalCards(penaltyState) !== totalBeforePenalty) throw new Error('Bad slap penalty lost cards.');

// Regression: winning one ordinary pile must never end a match (the old "first to 30" bug).
for (const matchType of ['full', 'quick']) {
  const early = engine.createGame(1, matchType, seededRandom(77));
  early.pile.push(...early.players[1].deck.splice(0, 6));
  engine.awardPile(early, 0);
  if (engine.getWinnerIndex(early) !== -1) throw new Error(`${matchType}: a 6-card pile ended the match.`);
}
// Classic: an empty-handed player is still in (can slap back in) until someone holds all 52.
const classicEmpty = engine.createGame(1, 'full', seededRandom(78));
classicEmpty.pile.push(...classicEmpty.players[0].deck.splice(0));
if (engine.getWinnerIndex(classicEmpty) !== -1 || !engine.canSlap(classicEmpty, 0)) throw new Error('Classic must allow slapping back in.');
// Out Is Out: an empty deck knocks you out unless a face challenge owes you the pile.
const quickEmpty = engine.createGame(1, 'quick', seededRandom(79));
quickEmpty.pile.push(...quickEmpty.players[0].deck.splice(0));
if (engine.canSlap(quickEmpty, 0) || engine.getWinnerIndex(quickEmpty) !== 1) throw new Error('Out Is Out must knock out an empty deck.');
quickEmpty.pendingAward = 0;
if (engine.isOut(quickEmpty, 0) || engine.getWinnerIndex(quickEmpty) !== -1) throw new Error('A player owed the pile is still in.');

// Stalled table: every card is in the pile or burn, so nobody can flip. The last flipper takes it.
const stall = engine.createGame(1, 'full', seededRandom(80));
stall.pile.push(...stall.players[1].deck.splice(0), ...stall.players[0].deck.splice(0));
stall.lastPlayer = 0;
stall.turnIndex = 1;
if (!engine.settleStall(stall) || stall.pendingAward !== 0) throw new Error('A stalled table must award the pile.');
engine.awardPile(stall, 0);
if (engine.getWinnerIndex(stall) !== 0) throw new Error('Taking every card must win.');

let longestGame = 0;
let shortestGame = Infinity;
let fullDeckGames = 0;
let stallsSettled = 0;
for (let seed = 1; seed <= 240; seed += 1) {
  const random = seededRandom(seed);
  const botCount = seed % 2 ? 1 : 2;
  const matchType = seed % 3 === 0 ? 'quick' : 'full';
  const state = engine.createGame(botCount, matchType, random);
  if (engine.totalCards(state) !== 52) throw new Error(`Deal ${seed} lost cards.`);
  let steps = 0;
  while (steps < 30000) {
    if (engine.settleStall(state)) stallsSettled += 1;
    if (engine.getWinnerIndex(state) >= 0) break;
    const slapReasons = engine.getSlapReasons(state.pile);
    const slappers = state.players.map((_, index) => index).filter(index => engine.canSlap(state, index));
    if (slapReasons.length && slappers.length) {
      const slapper = slappers[Math.floor(random() * slappers.length)];
      const result = engine.slapPile(state, slapper);
      if (!result.valid) throw new Error(`Simulation ${seed} missed a valid slap.`);
    } else if (!slapReasons.length && state.pile.length && random() < 0.02) {
      engine.slapPile(state, slappers[Math.floor(random() * slappers.length)]); // occasional bad slap
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
  const winner = engine.getWinnerIndex(state);
  const others = state.players.filter((_, index) => index !== winner);
  if (matchType === 'full' && state.players[winner].deck.length !== 52) throw new Error(`Classic ${seed} ended before one player held all 52.`);
  if (matchType === 'quick' && others.some((_, offset) => !engine.isOut(state, state.players.indexOf(others[offset])))) {
    throw new Error(`Out Is Out ${seed} ended while another player was still in.`);
  }
  if (matchType === 'full') fullDeckGames += 1;
  longestGame = Math.max(longestGame, state.plays);
  shortestGame = Math.min(shortestGame, state.plays);
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
  `240 complete simulated matches (${fullDeckGames} classic, ${240 - fullDeckGames} out-is-out, flips ${shortestGame}-${longestGame}, ` +
  `${stallsSettled} stalled tables settled), win rules, card conservation and portal navigation passed.`,
);
