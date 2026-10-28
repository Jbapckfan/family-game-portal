/** Pure nine-board tic-tac-toe rules. X (human) always opens. */
export const LINES = Object.freeze([
  [0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8], [2,4,6],
].map(Object.freeze));

export function createGame() {
  return {
    cells: Array.from({length:9}, () => Array(9).fill(null)),
    boards: Array(9).fill(null), turn:'X', forcedBoard:null,
    status:'playing', history:[],
  };
}

function lineWinner(values) {
  for (const [a,b,c] of LINES) {
    if ((values[a] === 'X' || values[a] === 'O') && values[a] === values[b] && values[a] === values[c]) return values[a];
  }
  return null;
}

export function boardResult(cells) {
  return lineWinner(cells) || (cells.every(Boolean) ? 'draw' : null);
}

export function matchResult(boards) {
  return lineWinner(boards) || (boards.every(Boolean) ? 'draw' : 'playing');
}

export function legalMoves(state) {
  if (state.status !== 'playing') return [];
  const forced = state.forcedBoard !== null && state.boards[state.forcedBoard] === null ? state.forcedBoard : null;
  const moves = [];
  for (let board = 0; board < 9; board++) {
    if (state.boards[board] !== null || (forced !== null && board !== forced)) continue;
    for (let cell = 0; cell < 9; cell++) if (state.cells[board][cell] === null) moves.push({board,cell});
  }
  return moves;
}

export function playMove(state, move) {
  if (!move || !Number.isInteger(move.board) || !Number.isInteger(move.cell)) return null;
  const {board,cell} = move;
  if (state.status !== 'playing' || board < 0 || board > 8 || cell < 0 || cell > 8 || state.boards[board] !== null || state.cells[board][cell] !== null) return null;
  if (state.forcedBoard !== null && state.boards[state.forcedBoard] === null && board !== state.forcedBoard) return null;
  const cells = state.cells.map(values => [...values]);
  const boards = [...state.boards];
  cells[board][cell] = state.turn;
  boards[board] = boardResult(cells[board]);
  const status = matchResult(boards);
  return {
    cells, boards, turn:state.turn === 'X' ? 'O' : 'X',
    forcedBoard:status === 'playing' && boards[cell] === null ? cell : null,
    status, history:[...state.history,{board,cell}],
  };
}

export function replayHistory(history) {
  if (!Array.isArray(history) || history.length > 81) return null;
  let state = createGame();
  for (const move of history) {
    state = playMove(state, move);
    if (!state) return null;
  }
  return state;
}

export function saveMatch(state, {skill = 'tactical', guideDismissed = true} = {}) {
  return {version:1,skill,guideDismissed,history:state.history.map(({board,cell}) => ({board,cell}))};
}

export function restoreMatch(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.version !== 1 || !['casual','tactical'].includes(value.skill) || typeof value.guideDismissed !== 'boolean') return null;
  const state = replayHistory(value.history);
  return state ? {state,skill:value.skill,guideDismissed:value.guideDismissed} : null;
}
