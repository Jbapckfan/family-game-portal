import { LINES, legalMoves, playMove } from './engine.mjs';

const BUDGETS = {casual:180,tactical:1600};
const WEIGHT = [3,2,3,2,4,2,3,2,3];
const other = player => player === 'X' ? 'O' : 'X';

function completes(values, cell, player) {
  return LINES.some(line => line.includes(cell) && line.every(index => index === cell || values[index] === player));
}

function canWinMatchNext(state, player) {
  return legalMoves(state).some(({board,cell}) => completes(state.boards, board, player) && completes(state.cells[board], cell, player));
}

function evaluate(state, player) {
  if (state.status === player) return 1000000;
  if (state.status === other(player)) return -1000000;
  if (state.status === 'draw') return 0;
  const opponent = other(player);
  let score = 0;
  for (const line of LINES) {
    const values = line.map(index => state.boards[index]);
    const mine = values.filter(value => value === player).length;
    const theirs = values.filter(value => value === opponent).length;
    if (!theirs && !values.includes('draw')) score += [0,60,650][mine] || 0;
    if (!mine && !values.includes('draw')) score -= [0,60,650][theirs] || 0;
  }
  for (let board = 0; board < 9; board++) {
    if (state.boards[board]) {
      if (state.boards[board] !== 'draw') score += (state.boards[board] === player ? 1 : -1) * 180 * WEIGHT[board];
      continue;
    }
    const cells = state.cells[board];
    for (const line of LINES) {
      const mine = line.filter(index => cells[index] === player).length;
      const theirs = line.filter(index => cells[index] === opponent).length;
      if (!theirs) score += [0,2,18][mine] || 0;
      if (!mine) score -= [0,2,22][theirs] || 0;
    }
    for (let cell = 0; cell < 9; cell++) {
      if (cells[cell]) score += (cells[cell] === player ? 1 : -1) * WEIGHT[cell];
    }
  }
  return score;
}

/** Deterministic, bounded search. No random values or time-based cutoffs. */
export function chooseMove(state, {skill = 'tactical'} = {}) {
  skill = skill === 'casual' ? 'casual' : 'tactical';
  const budget = BUDGETS[skill];
  const player = state.turn;
  const opponent = other(player);
  let nodes = 0;
  const moves = legalMoves(state);
  if (!moves.length) return {move:null,nodes,budget,skill};

  const roots = moves.map(move => {
    const next = playMove(state, move);
    nodes++;
    let priority = 0;
    if (next.status === player) priority = 10000000;
    else if (canWinMatchNext(next, opponent)) priority = -10000000;
    else if (next.boards[move.board] === player) priority = 10000;
    else if (completes(state.cells[move.board], move.cell, opponent) && (state.forcedBoard !== null || completes(state.boards, move.board, opponent))) priority = 8000;
    const score = evaluate(next, player) + WEIGHT[move.board] + WEIGHT[move.cell] + priority;
    return {move,next,priority,score};
  }).sort((a,b) => b.score - a.score || a.move.board - b.move.board || a.move.cell - b.move.cell);

  if (skill === 'casual' || roots[0].next.status === player) return {move:roots[0].move,nodes,budget,skill};

  function search(position, depth, alpha, beta, limit) {
    if (depth === 0 || position.status !== 'playing' || nodes >= limit) return evaluate(position, player);
    const maximizing = position.turn === player;
    const children = [];
    for (const move of legalMoves(position)) {
      if (nodes >= limit) break;
      const next = playMove(position, move);
      nodes++;
      children.push({next,score:evaluate(next,player)});
    }
    if (!children.length) return evaluate(position, player);
    children.sort((a,b) => maximizing ? b.score - a.score : a.score - b.score);
    let value = maximizing ? -Infinity : Infinity;
    for (const child of children.slice(0,8)) {
      const score = search(child.next, depth - 1, alpha, beta, limit);
      value = maximizing ? Math.max(value,score) : Math.min(value,score);
      if (maximizing) alpha = Math.max(alpha,value); else beta = Math.min(beta,value);
      if (beta <= alpha || nodes >= limit) break;
    }
    return value;
  }

  // Equal budgets per root keep late candidates from inheriting an exhausted
  // search. All legal roots are scored; deeper search considers eight leaders.
  const candidates = roots.slice(0,8);
  const rootBudget = Math.floor((budget - nodes) / candidates.length);
  let best = roots[0];
  let bestScore = -Infinity;
  for (const root of candidates) {
    const start = nodes;
    const allowance = Math.min(budget, start + rootBudget);
    const searched = search(root.next, 2, -Infinity, Infinity, allowance);
    const score = searched + root.priority + WEIGHT[root.move.board] + WEIGHT[root.move.cell];
    if (score > bestScore) { bestScore = score; best = root; }
    if (nodes >= budget) break;
  }
  return {move:best.move,nodes,budget,skill};
}
