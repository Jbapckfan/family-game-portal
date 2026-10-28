import { createGame, legalMoves, playMove, saveMatch, restoreMatch } from './engine.mjs';
import { chooseMove } from './ai.mjs';

export const STORAGE_KEY = 'alford:tic-tac-toe:v1:match';

/** In-memory play survives storage errors. Every persisted position is replayed. */
export function createMatchController({
  getStorage = () => globalThis.localStorage,
  schedule = callback => setTimeout(callback, 220),
  cancel = timer => clearTimeout(timer),
  choose = chooseMove,
  changed = () => {},
} = {}) {
  let state = createGame();
  let skill = 'tactical';
  let guideDismissed = false;
  let warning = '';
  let generation = 0;
  let timer = null;
  let started = false;
  let savedSnapshot = null;
  let snapshotKnown = false;
  let conflicted = false;
  try {
    const raw = getStorage().getItem(STORAGE_KEY);
    savedSnapshot = raw;
    snapshotKnown = true;
    if (raw !== null) {
      const restored = restoreMatch(JSON.parse(raw));
      if (!restored) throw new Error('invalid-save');
      ({state,skill,guideDismissed} = restored);
    }
  } catch (error) {
    warning = error instanceof SyntaxError || error?.message === 'invalid-save'
      ? 'Your saved match could not be restored. A fresh match is ready.'
      : 'This browser cannot save your match. You can keep playing here.';
  }
  const view = () => ({state,skill,guideDismissed,warning,conflicted});
  const notify = () => changed(view());
  function currentStorage() {
    if (conflicted) return false;
    try {
      const storage = getStorage();
      const raw = storage.getItem(STORAGE_KEY);
      if ((snapshotKnown && raw !== savedSnapshot) || (!snapshotKnown && raw !== null)) {
        conflicted = true;
        generation++;
        if (timer !== null) cancel(timer);
        timer = null;
        warning = 'This match changed in another window. Reload to continue the saved match.';
        notify();
        return false;
      }
      savedSnapshot = raw;
      snapshotKnown = true;
      return storage;
    } catch {
      warning = 'This browser cannot save your match. You can keep playing here.';
      return null; // Unreadable storage permits memory-only play, never a write.
    }
  }
  function persist(nextState = state, nextSkill = skill, nextGuide = guideDismissed) {
    const storage = currentStorage();
    if (storage === false) return false;
    state = nextState;
    skill = nextSkill;
    guideDismissed = nextGuide;
    if (storage) {
      const raw = JSON.stringify(saveMatch(state,{skill,guideDismissed}));
      try {
        storage.setItem(STORAGE_KEY, raw);
        savedSnapshot = raw;
      } catch { warning = 'This browser cannot save your match. You can keep playing here.'; }
    }
    return true;
  }
  function queueAI() {
    if (!started || conflicted || timer !== null || state.status !== 'playing' || state.turn !== 'O') return;
    const ticket = generation;
    const position = state;
    timer = schedule(() => {
      if (ticket !== generation || state !== position || state.turn !== 'O' || state.status !== 'playing') return;
      timer = null;
      if (currentStorage() === false) return;
      let move;
      try { move = choose(position,{skill}).move; } catch { move = null; }
      if (ticket !== generation || state !== position) return;
      const next = playMove(position,move) || playMove(position,legalMoves(position)[0]);
      if (!persist(next)) return;
      notify();
    });
  }
  return {
    get view() { return view(); },
    start() { if (started) return; started = true; notify(); queueAI(); },
    move(board,cell) {
      if (conflicted || state.turn !== 'X' || state.status !== 'playing') return false;
      const next = playMove(state,{board,cell});
      if (!next) return false;
      if (!persist(next,skill,true)) return false;
      notify(); queueAI();
      return true;
    },
    restart() {
      if (conflicted) return false;
      warning = '';
      if (!persist(createGame())) return false;
      generation++;
      if (timer !== null) cancel(timer);
      timer = null;
      notify();
      return true;
    },
    setSkill(next) {
      if (!['casual','tactical'].includes(next) || state.history.length) return false;
      if (!persist(state,next)) return false;
      notify();
      return true;
    },
    dismissGuide() {
      if (!persist(state,skill,true)) return false;
      notify();
      return true;
    },
  };
}

const POSITIONS = ['Top left','Top middle','Top right','Middle left','Center','Middle right','Bottom left','Bottom middle','Bottom right'];
const symbol = player => player === 'X' ? '×' : player === 'O' ? '○' : '';
const levelName = skill => skill === 'casual' ? 'Casual' : 'Tactical';

/** Preview the actual move, including a mini board closing its own destination. */
export function moveRoute(state, board, cell) {
  const next = playMove(state,{board,cell});
  if (next && next.status !== 'playing') return {destination:null,text:'This move ends the match.'};
  const closed = (next || state).boards[cell] !== null;
  return {destination:closed ? null : cell,text:closed
    ? `The ${POSITIONS[cell].toLowerCase()} board is closed: the opponent may choose any open board.`
    : `Sends the opponent to ${POSITIONS[cell].toLowerCase()}.`};
}

function boot() {
  const $ = id => document.getElementById(id);
  const native = Boolean(window.__ALFORD_NATIVE__ || window.webkit?.messageHandlers?.alford);
  document.body.classList.toggle('native-app', native);
  let selectedBoard = 4;
  let renderedMoves = -1;
  let previousStatus = 'playing';
  let previewCell = null;
  let returnFocus = null;
  let toastTimer;
  const boardButtons = [];
  const cellButtons = [];

  function nativeMessage(payload) {
    try {
      const handler = window.webkit?.messageHandlers?.alford;
      if (!handler?.postMessage) return false;
      handler.postMessage({...payload,slug:'nested-tic-tac-toe'});
      return true;
    } catch { return false; }
  }
  function toast(message) {
    clearTimeout(toastTimer);
    $('toast').textContent = message;
    $('toast').hidden = false;
    toastTimer = setTimeout(() => { $('toast').hidden = true; },4000);
  }
  function openDialog(id, trigger) {
    returnFocus = trigger || document.activeElement;
    $(id).showModal();
  }
  function closeDialog(dialog) { dialog.close(); returnFocus?.focus(); }
  function routeText(state, cell) { return moveRoute(state,selectedBoard,cell).text; }
  function updatePreview(cell) {
    previewCell = cell;
    const {state} = controller.view;
    const destination = cell === null ? null : moveRoute(state,selectedBoard,cell).destination;
    for (let board = 0; board < 9; board++) boardButtons[board].classList.toggle('destination', destination !== null && board === destination);
    $('route-preview').textContent = cell === null ? 'Each small square points to the matching board.' : routeText(state,cell);
  }
  function render({state,skill,guideDismissed,warning,conflicted}) {
    const playing = state.status === 'playing';
    const human = playing && state.turn === 'X' && !conflicted;
    const moves = legalMoves(state);
    const openBoards = new Set(moves.map(move => move.board));
    if (state.history.length !== renderedMoves) {
      if (state.forcedBoard !== null) selectedBoard = state.forcedBoard;
      else if (state.boards[selectedBoard] !== null && playing) selectedBoard = moves[0]?.board ?? 4;
      renderedMoves = state.history.length;
      previewCell = null;
    }
    $('puzzle').dataset.turn = conflicted ? 'paused' : playing ? state.turn : 'finished';
    $('puzzle').setAttribute('aria-busy', String(playing && !human && !conflicted));
    $('guide').hidden = guideDismissed;
    $('storage-warning').hidden = !warning;
    $('storage-warning').textContent = warning;
    $('reload-match-button').hidden = !conflicted;
    $('dismiss-guide').disabled = conflicted;
    $('save-note').textContent = conflicted ? 'The saved match in the other window has been kept.' : warning ? 'This match is held in memory.' : 'Your match is saved on this device.';
    $('share-button').hidden = playing || conflicted;
    $('new-match-button').disabled = conflicted;
    $('new-match-button').textContent = playing ? 'New match' : 'Play again';
    for (const button of document.querySelectorAll('[data-skill]')) {
      button.setAttribute('aria-pressed',String(button.dataset.skill === skill));
      button.disabled = conflicted || state.history.length > 0;
    }
    $('level-note').textContent = state.history.length ? `${levelName(skill)} AI · Choose a level after starting a new match.` : 'Casual sees the next move. Tactical looks further ahead.';
    let title;
    let instruction;
    if (conflicted) {
      title = 'Match changed elsewhere';
      instruction = 'Reload to continue the saved match. This window is paused.';
    } else if (!playing) {
      title = state.status === 'X' ? 'You win the match.' : state.status === 'O' ? 'AI wins the match.' : 'The match is a draw.';
      instruction = state.status === 'draw' ? 'Every mini board is closed. No three claimed squares form a line.' : 'Three claimed boards in a line. Ready for a rematch?';
    } else {
      title = human ? 'Your turn' : 'AI is thinking…';
      instruction = state.forcedBoard === null
        ? (state.history.length ? 'The destination board is closed. Choose any open board.' : 'First move: choose any board, then a small square.')
        : `${human ? 'Play' : 'AI plays'} in the ${POSITIONS[state.forcedBoard].toLowerCase()} board.`;
    }
    $('turn-title').textContent = title;
    $('turn-mark').textContent = symbol(playing ? state.turn : state.status);
    $('turn-mark').className = `turn-mark mark-${playing ? state.turn.toLowerCase() : state.status.toLowerCase()}`;
    $('turn-instruction').textContent = instruction;
    $('turn-status').setAttribute('aria-label',`${title} ${instruction}`);
    $('board-choice-note').textContent = conflicted ? 'Reload to see the current saved match' : playing && state.forcedBoard === null ? `${new Set(moves.map(move => move.board)).size} open boards · select one below` : playing ? 'The outlined board is the next destination' : 'The finished match';
    const claimedX = state.boards.filter(board => board === 'X').length;
    const claimedO = state.boards.filter(board => board === 'O').length;
    const last = state.history.at(-1);
    const lastPlayer = last ? state.cells[last.board][last.cell] : null;
    $('recent-move').hidden = !last;
    const recentText = last ? `${lastPlayer === 'X' ? 'You' : 'AI'} played ${symbol(lastPlayer)} in the ${POSITIONS[last.board].toLowerCase()} board, ${POSITIONS[last.cell].toLowerCase()} square.` : '';
    if ($('last-move').textContent !== recentText) $('last-move').textContent = recentText;
    $('inspect-last-move').disabled = conflicted;
    if (last) $('inspect-last-move').setAttribute('aria-label',`Inspect the last move in the ${POSITIONS[last.board].toLowerCase()} board`);
    $('return-to-play').hidden = !human || openBoards.has(selectedBoard);
    if (human && !openBoards.has(selectedBoard)) $('return-to-play').setAttribute('aria-label',state.forcedBoard === null ? 'Return to an open board to make your move' : `Return to the ${POSITIONS[state.forcedBoard].toLowerCase()} board to make your move`);
    $('claim-x').textContent = `${claimedX}`;
    $('claim-o').textContent = `${claimedO}`;
    for (let board = 0; board < 9; board++) {
      const button = boardButtons[board];
      const result = state.boards[board];
      const available = openBoards.has(board);
      const status = result === 'draw' ? 'Drawn' : result === 'X' ? 'You claimed' : result === 'O' ? 'AI claimed' : conflicted ? 'Paused' : state.forcedBoard === board && playing ? (human ? 'Play here' : 'AI here') : available && playing ? 'Open' : 'Waiting';
      button.className = `mini-board${available ? ' available' : ''}${selectedBoard === board ? ' selected' : ''}${state.forcedBoard === board && playing ? ' forced' : ''}${result ? ` closed result-${result.toLowerCase()}` : ''}${last?.board === board ? ' has-last-move' : ''}`;
      button.setAttribute('aria-pressed',String(board === selectedBoard));
      button.setAttribute('aria-label',`${POSITIONS[board]} board. ${status}. ${selectedBoard === board ? 'Selected.' : 'Select to inspect.'}${last?.board === board ? ` Last move: ${lastPlayer === 'X' ? 'you' : 'AI'} played the ${POSITIONS[last.cell].toLowerCase()} square.` : ''}`);
      button.querySelector('.board-state').textContent = status;
      for (let cell = 0; cell < 9; cell++) {
        const mark = button.querySelectorAll('.mini-mark')[cell];
        const value = state.cells[board][cell];
        mark.textContent = symbol(value);
        mark.className = `mini-mark${value ? ` mark-${value.toLowerCase()}` : ''}${last?.board === board && last.cell === cell ? ' last-move' : ''}`;
      }
      const overlay = button.querySelector('.board-overlay');
      overlay.hidden = !result;
      overlay.querySelector('b').textContent = result === 'draw' ? '—' : symbol(result);
      overlay.querySelector('span').textContent = result === 'draw' ? 'Drawn' : result === 'X' ? 'Yours' : 'AI';
    }
    const selectedResult = state.boards[selectedBoard];
    const playable = human && openBoards.has(selectedBoard);
    $('selected-board-title').textContent = `${POSITIONS[selectedBoard]} board`;
    $('selected-board-status').textContent = conflicted ? 'Paused · reload to continue' : selectedResult === 'draw' ? 'Drawn · closed' : selectedResult ? `${selectedResult === 'X' ? 'You' : 'AI'} claimed this board` : !playing ? 'Match finished' : playable ? 'Choose your square' : human ? 'Inspecting · play in the outlined board' : 'AI turn · please wait';
    $('detail-panel').classList.toggle('can-play', playable);
    $('detail-panel').classList.toggle('is-closed', Boolean(selectedResult));
    for (let cell = 0; cell < 9; cell++) {
      const button = cellButtons[cell];
      const value = state.cells[selectedBoard][cell];
      button.textContent = symbol(value);
      button.disabled = !playable || value !== null;
      button.className = `cell${value ? ` mark-${value.toLowerCase()}` : ''}${last?.board === selectedBoard && last.cell === cell ? ' last-move' : ''}`;
      button.setAttribute('aria-label',`${POSITIONS[selectedBoard]} board, ${POSITIONS[cell].toLowerCase()} cell. ${value ? `${value === 'X' ? 'Your X' : 'AI O'}.` : `Empty. ${routeText(state,cell)}`}`);
    }
    $('detail-closed').hidden = !selectedResult;
    $('detail-closed').textContent = selectedResult === 'draw' ? 'A draw. This square stays unclaimed.' : selectedResult ? `${selectedResult === 'X' ? 'You' : 'AI'} won this mini board.` : '';
    updatePreview(previewCell);
    if (previousStatus === 'playing' && !playing) nativeMessage({type:'haptic',kind:state.status === 'X' ? 'win' : state.status === 'O' ? 'miss' : 'fit'});
    previousStatus = state.status;
    $('puzzle').dataset.gameReady = 'true';
  }

  function inspectBoard(board) {
    selectedBoard = board;
    render(controller.view);
    $('detail-panel').scrollIntoView({block:'nearest',behavior:'auto'});
    const playable = cellButtons.find(cell => !cell.disabled);
    (playable || $('detail-panel')).focus({preventScroll:true});
  }
  for (let board = 0; board < 9; board++) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mini-board';
    button.innerHTML = `<span class="board-state"></span><span class="mini-grid" aria-hidden="true">${'<span class="mini-mark"></span>'.repeat(9)}</span><span class="board-overlay" aria-hidden="true" hidden><b></b><span></span></span><span class="board-name">${POSITIONS[board]}</span>`;
    button.addEventListener('click',() => inspectBoard(board));
    boardButtons.push(button);
    $('macro-board').append(button);
  }
  for (let cell = 0; cell < 9; cell++) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.cell = cell;
    button.addEventListener('click',() => {
      if (controller.move(selectedBoard,cell)) nativeMessage({type:'haptic',kind:'select'});
    });
    button.addEventListener('pointerenter',() => { if (!button.disabled) updatePreview(cell); });
    button.addEventListener('pointerleave',() => updatePreview(null));
    button.addEventListener('focus',() => { if (!button.disabled) updatePreview(cell); });
    button.addEventListener('blur',() => updatePreview(null));
    button.addEventListener('keydown',event => {
      const offsets = {ArrowLeft:-1,ArrowRight:1,ArrowUp:-3,ArrowDown:3};
      if (!(event.key in offsets)) return;
      event.preventDefault();
      const step = offsets[event.key];
      for (let distance = 1; distance <= 9; distance++) {
        const next = cellButtons[(cell + step * distance + 90) % 9];
        if (!next.disabled) { next.focus(); break; }
      }
    });
    cellButtons.push(button);
    $('detail-board').append(button);
  }
  const controller = createMatchController({changed:render});
  $('inspect-last-move').addEventListener('click',() => {
    const last = controller.view.state.history.at(-1);
    if (last) inspectBoard(last.board);
  });
  $('return-to-play').addEventListener('click',() => {
    const state = controller.view.state;
    const move = legalMoves(state)[0];
    if (state.turn === 'X' && move) inspectBoard(move.board);
  });
  $('reload-match-button').addEventListener('click',() => window.location.reload());
  $('dismiss-guide').addEventListener('click',() => controller.dismissGuide());
  $('help-button').addEventListener('click',event => openDialog('help-dialog',event.currentTarget));
  $('game-help-button').addEventListener('click',event => openDialog('help-dialog',event.currentTarget));
  $('new-match-button').addEventListener('click',event => {
    if (!controller.view.state.history.length || controller.view.state.status !== 'playing') controller.restart();
    else openDialog('restart-dialog',event.currentTarget);
  });
  $('confirm-restart').addEventListener('click',() => { closeDialog($('restart-dialog')); controller.restart(); });
  for (const button of document.querySelectorAll('[data-close-dialog]')) button.addEventListener('click',() => closeDialog(button.closest('dialog')));
  for (const button of document.querySelectorAll('[data-skill]')) button.addEventListener('click',() => controller.setSkill(button.dataset.skill));
  $('share-button').addEventListener('click', async () => {
    const {state,skill} = controller.view;
    if (state.status === 'playing') return;
    const result = state.status === 'X' ? 'I won' : state.status === 'O' ? 'AI won' : 'A draw';
    const text = `Tic-Tac-Toe · Nine boards\n${result} against ${levelName(skill)} AI.\nAlford Daily · Bonus game`;
    if (nativeMessage({type:'share',text})) return;
    try {
      if (navigator.share) await navigator.share({title:'Tic-Tac-Toe · Alford Daily',text});
      else { await navigator.clipboard.writeText(text); toast('Result copied.'); }
    } catch (error) { if (error.name !== 'AbortError') toast('Sharing is unavailable in this browser.'); }
  });
  controller.start();
}

if (typeof document !== 'undefined') boot();
