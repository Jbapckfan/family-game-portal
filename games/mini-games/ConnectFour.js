// Generated from ConnectFour.jsx by tools/build-react-games.mjs; do not edit.
"use strict";
const COLS = 7;
const ROWS = 6;
let CONNECT_TARGET = 4;
let GRAVITY_UP = false;
const PLAYERS = {
  1: { label: "Player 1", name: "Red", bg: "#ef4444", ring: "#dc2626", text: "#fecaca" },
  2: { label: "Player 2", name: "Yellow", bg: "#facc15", ring: "#eab308", text: "#422006" }
};
const createEmptyBoard = () => Array(COLS * ROWS).fill(null);
const cellIndex = (row, col) => row * COLS + col;
const lowestEmptyRow = (board, col) => {
  for (let step = 0; step < ROWS; step++) {
    const row = GRAVITY_UP ? step : ROWS - 1 - step;
    if (!board[cellIndex(row, col)]) return row;
  }
  return -1;
};
const DIRECTIONS = [
  { dr: 0, dc: 1 },
  // horizontal
  { dr: 1, dc: 0 },
  // vertical
  { dr: 1, dc: 1 },
  // diagonal down-right
  { dr: 1, dc: -1 }
  // diagonal down-left
];
const findWinThroughCell = (board, row, col) => {
  const player = board[cellIndex(row, col)];
  if (!player) return null;
  for (const { dr, dc } of DIRECTIONS) {
    const cells = [[row, col]];
    let r = row + dr, c = col + dc;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[cellIndex(r, c)] === player) {
      cells.push([r, c]);
      r += dr;
      c += dc;
    }
    r = row - dr;
    c = col - dc;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[cellIndex(r, c)] === player) {
      cells.push([r, c]);
      r -= dr;
      c -= dc;
    }
    if (cells.length >= CONNECT_TARGET) {
      return cells.slice(0, CONNECT_TARGET).map(([rr, cc]) => cellIndex(rr, cc));
    }
  }
  return null;
};
const boardIsFull = (board) => board.every((cell) => cell !== null);
const legalColumns = (board) => Array.from({ length: COLS }, (_, col) => col).filter((col) => lowestEmptyRow(board, col) >= 0);
const simulateDrop = (board, col, player) => {
  const row = lowestEmptyRow(board, col);
  if (row < 0) return null;
  const next = [...board];
  next[cellIndex(row, col)] = player;
  return { board: next, row };
};
const allWins = (board, player) => {
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (board[cellIndex(r, c)] === player && findWinThroughCell(board, r, c)) return true;
  return false;
};
const scoreBoard = (board) => {
  if (allWins(board, 2)) return 1e5;
  if (allWins(board, 1)) return -1e5;
  let score = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const v = board[cellIndex(r, c)];
    if (v === 2) score += 3 - Math.abs(3 - c);
    if (v === 1) score -= 3 - Math.abs(3 - c);
  }
  return score;
};
const chooseAIMove = (board, difficulty) => {
  const legal = legalColumns(board);
  if (!legal.length) return -1;
  if (difficulty === "easy") return legal[Math.floor(Math.random() * legal.length)];
  for (const col of legal) {
    const sim = simulateDrop(board, col, 2);
    if (findWinThroughCell(sim.board, sim.row, col)) return col;
  }
  for (const col of legal) {
    const sim = simulateDrop(board, col, 1);
    if (findWinThroughCell(sim.board, sim.row, col)) return col;
  }
  if (difficulty === "smart") return [...legal].sort((a, b) => Math.abs(3 - a) - Math.abs(3 - b))[0];
  const memo = /* @__PURE__ */ new Map();
  const minimax = (position, depth, maximizing, alpha, beta) => {
    const key = position.join("") + depth + maximizing;
    if (memo.has(key)) return memo.get(key);
    if (depth === 0 || allWins(position, 1) || allWins(position, 2)) return scoreBoard(position);
    const moves = legalColumns(position);
    if (!moves.length) return 0;
    let best = maximizing ? -Infinity : Infinity;
    for (const col of moves) {
      const sim = simulateDrop(position, col, maximizing ? 2 : 1);
      const value = minimax(sim.board, depth - 1, !maximizing, alpha, beta);
      best = maximizing ? Math.max(best, value) : Math.min(best, value);
      if (maximizing) alpha = Math.max(alpha, best);
      else beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    memo.set(key, best);
    return best;
  };
  return legal.map((col) => ({ col, value: minimax(simulateDrop(board, col, 2).board, 6, false, -Infinity, Infinity) })).sort((a, b) => b.value - a.value || Math.abs(3 - a.col) - Math.abs(3 - b.col))[0].col;
};
const HowToPlayModal = ({ isOpen, onClose, triggerRef }) => {
  const closeButtonRef = React.useRef(null);
  const modalRef = React.useRef(null);
  React.useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab" && modalRef.current) {
        const focusableEls = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableEls.length === 0) return;
        const firstEl = focusableEls[0];
        const lastEl = focusableEls[focusableEls.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);
  const handleClose = React.useCallback(() => {
    onClose();
    requestAnimationFrame(() => {
      if (triggerRef && triggerRef.current) {
        triggerRef.current.focus();
      }
    });
  }, [onClose, triggerRef]);
  if (!isOpen) return null;
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "fixed inset-0 z-50 flex items-center justify-center p-4",
      onClick: handleClose,
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "how-to-play-title",
      ref: modalRef
    },
    /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 bg-black/70 backdrop-blur-sm", "aria-hidden": "true" }),
    /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "relative bg-gray-900 border border-blue-500/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl shadow-blue-500/20 animate-fade-in",
        onClick: (e) => e.stopPropagation()
      },
      /* @__PURE__ */ React.createElement(
        "button",
        {
          ref: closeButtonRef,
          onClick: handleClose,
          className: "absolute top-2 right-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-blue-300 hover:text-white transition-colors text-2xl leading-none rounded-lg",
          "aria-label": "Close instructions"
        },
        "×"
      ),
      /* @__PURE__ */ React.createElement("h2", { id: "how-to-play-title", className: "text-2xl font-bold bg-gradient-to-r from-red-400 to-yellow-400 bg-clip-text text-transparent mb-4" }, "How to Play"),
      /* @__PURE__ */ React.createElement("ul", { className: "text-blue-100/90 text-sm space-y-3 list-none" }, /* @__PURE__ */ React.createElement("li", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-blue-400 mt-0.5", "aria-hidden": "true" }, "▶"), /* @__PURE__ */ React.createElement("span", null, "This is a ", /* @__PURE__ */ React.createElement("strong", { className: "text-blue-300" }, "2-player, pass-and-play"), " game. Player 1 is ", /* @__PURE__ */ React.createElement("strong", { className: "text-red-400" }, "Red"), ", Player 2 is ", /* @__PURE__ */ React.createElement("strong", { className: "text-yellow-300" }, "Yellow"), ".")), /* @__PURE__ */ React.createElement("li", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-blue-400 mt-0.5", "aria-hidden": "true" }, "▶"), /* @__PURE__ */ React.createElement("span", null, "Click or tap a ", /* @__PURE__ */ React.createElement("strong", { className: "text-blue-300" }, "column"), " to drop your disc — it falls to the lowest empty spot.")), /* @__PURE__ */ React.createElement("li", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-blue-400 mt-0.5", "aria-hidden": "true" }, "▶"), /* @__PURE__ */ React.createElement("span", null, "Or press ", /* @__PURE__ */ React.createElement("strong", { className: "text-blue-300" }, "number keys 1-7"), " to drop into that column.")), /* @__PURE__ */ React.createElement("li", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-blue-400 mt-0.5", "aria-hidden": "true" }, "▶"), /* @__PURE__ */ React.createElement("span", null, "First to connect ", /* @__PURE__ */ React.createElement("strong", { className: "text-blue-300" }, "4 in a row"), " — horizontally, vertically, or diagonally — wins!")), /* @__PURE__ */ React.createElement("li", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-blue-400 mt-0.5", "aria-hidden": "true" }, "▶"), /* @__PURE__ */ React.createElement("span", null, "If the board fills up with no winner, it's a ", /* @__PURE__ */ React.createElement("strong", { className: "text-blue-300" }, "Draw"), "."))),
      /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: handleClose,
          className: "mt-5 w-full py-2 min-h-[44px] rounded-lg font-bold text-black bg-gradient-to-r from-red-400 to-yellow-400 hover:from-red-300 hover:to-yellow-300 transition-all"
        },
        "Got it!"
      )
    )
  );
};
const Disc = React.memo(({ player, row, isWinning }) => {
  const cellPercent = 100 / ROWS;
  const info = player === 3 ? { bg: "#334155", ring: "#94a3b8" } : PLAYERS[player];
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "disc-slot absolute p-1 md:p-1.5",
      style: {
        width: "100%",
        height: `${cellPercent}%`,
        top: `${row * cellPercent}%`,
        left: 0
      }
    },
    /* @__PURE__ */ React.createElement(
      "div",
      {
        className: `physical-disc w-full h-full rounded-full ${isWinning ? "disc-winner" : ""}`,
        style: {
          backgroundColor: info.bg,
          color: info.ring,
          boxShadow: `0 0 8px 1px ${info.ring}aa, inset 0 0 6px rgba(0,0,0,0.35), inset 0 2px 4px rgba(255,255,255,0.3)`
        }
      },
      player === 3 && /* @__PURE__ */ React.createElement("span", { className: "flex items-center justify-center h-full text-slate-200 text-xl" }, "✦")
    )
  );
});
const Column = React.memo(({ col, board, onDrop, disabled, currentPlayer, winningSet }) => {
  const discs = [];
  for (let row = 0; row < ROWS; row++) {
    const player = board[cellIndex(row, col)];
    if (player) {
      discs.push(
        /* @__PURE__ */ React.createElement(
          Disc,
          {
            key: row,
            player,
            row,
            isWinning: winningSet.has(cellIndex(row, col))
          }
        )
      );
    }
  }
  const isFull = lowestEmptyRow(board, col) === -1;
  const info = PLAYERS[currentPlayer];
  return /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => onDrop(col),
      disabled: disabled || isFull,
      "aria-label": `Column ${col + 1}${isFull ? ", full" : `, drop ${info.name} disc here`}`,
      className: "relative flex-1 h-full disabled:cursor-not-allowed group",
      style: { minWidth: "44px" }
    },
    /* @__PURE__ */ React.createElement("div", { className: "relative w-full h-full" }, /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 grid pointer-events-none", style: { gridTemplateRows: `repeat(${ROWS}, 1fr)` }, "aria-hidden": "true" }, Array.from({ length: ROWS }).map((_, r) => /* @__PURE__ */ React.createElement("div", { key: r, className: "p-1 md:p-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "disc-well w-full h-full rounded-full bg-black/40", style: { boxShadow: "inset 0 2px 6px rgba(0,0,0,0.6)" } })))), !disabled && !isFull && /* @__PURE__ */ React.createElement("div", { className: "absolute inset-x-0 top-0 h-full col-preview group-focus-visible:opacity-100 transition-opacity pointer-events-none", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "w-full rounded-full mx-auto",
        style: {
          aspectRatio: "1 / 1",
          backgroundColor: info.bg,
          opacity: 0.35
        }
      }
    )), discs)
  );
});
const ConnectFourGame = () => {
  const [variant, setVariant] = React.useState("classic");
  const [vsAI, setVsAI] = React.useState(false);
  const [difficulty, setDifficulty] = React.useState("smart");
  const [names, setNames] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem("connect4-names")) || ["Player 1", "Player 2"];
    } catch {
      return ["Player 1", "Player 2"];
    }
  });
  const [seriesLength, setSeriesLength] = React.useState(3);
  const [matchScore, setMatchScore] = React.useState([0, 0]);
  const [starter, setStarter] = React.useState(1);
  const [moveNumber, setMoveNumber] = React.useState(0);
  const [rotation, setRotation] = React.useState(0);
  const [records, setRecords] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem("connect4-family-records")) || {};
    } catch {
      return {};
    }
  });
  const [board, setBoard] = React.useState(() => createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = React.useState(1);
  const [winner, setWinner] = React.useState(null);
  const [winningCells, setWinningCells] = React.useState([]);
  const [showHowToPlay, setShowHowToPlay] = React.useState(false);
  const howToPlayTriggerRef = React.useRef(null);
  const newGameButtonRef = React.useRef(null);
  const overlayButtonRef = React.useRef(null);
  const boardRef = React.useRef(board);
  const currentPlayerRef = React.useRef(currentPlayer);
  const gameOverRef = React.useRef(false);
  const showHowToPlayRef = React.useRef(showHowToPlay);
  const vsAIRef = React.useRef(vsAI);
  React.useEffect(() => {
    boardRef.current = board;
  }, [board]);
  React.useEffect(() => {
    currentPlayerRef.current = currentPlayer;
  }, [currentPlayer]);
  React.useEffect(() => {
    showHowToPlayRef.current = showHowToPlay;
  }, [showHowToPlay]);
  React.useEffect(() => {
    vsAIRef.current = vsAI;
  }, [vsAI]);
  const winningSet = React.useMemo(() => new Set(winningCells), [winningCells]);
  const gameOver = winner !== null;
  React.useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);
  React.useEffect(() => {
    if (gameOver && overlayButtonRef.current) {
      overlayButtonRef.current.focus();
    }
  }, [gameOver]);
  const dropDisc = React.useCallback((col, fromAI = false) => {
    if (gameOverRef.current || showHowToPlayRef.current) return;
    if (vsAIRef.current && currentPlayerRef.current === 2 && !fromAI) return;
    const prevBoard = boardRef.current;
    const row = lowestEmptyRow(prevBoard, col);
    if (row === -1) return;
    const player = currentPlayerRef.current;
    let newBoard = prevBoard.slice();
    newBoard[cellIndex(row, col)] = player;
    const nextMoveNumber = moveNumber + 1;
    if (variant === "rotate" && nextMoveNumber % 4 === 0) {
      const nextGravityUp = !GRAVITY_UP;
      const settled = createEmptyBoard();
      for (let c = 0; c < COLS; c++) {
        const pieces = [];
        for (let r = 0; r < ROWS; r++) {
          const value = newBoard[cellIndex(r, c)];
          if (value === 1 || value === 2) pieces.push(value);
        }
        pieces.forEach((value, i) => {
          const targetRow = nextGravityUp ? i : ROWS - 1 - i;
          settled[cellIndex(targetRow, c)] = value;
        });
      }
      newBoard = settled;
      GRAVITY_UP = nextGravityUp;
      setRotation((value) => value + 180);
    }
    boardRef.current = newBoard;
    setBoard(newBoard);
    setMoveNumber(nextMoveNumber);
    let win = null;
    for (let rr = 0; rr < ROWS && !win; rr++) for (let cc = 0; cc < COLS && !win; cc++) win = findWinThroughCell(newBoard, rr, cc);
    if (win) {
      gameOverRef.current = true;
      setWinningCells(win);
      setWinner(player);
    } else if (boardIsFull(newBoard)) {
      gameOverRef.current = true;
      setWinner("draw");
    } else {
      const nextPlayer = player === 1 ? 2 : 1;
      currentPlayerRef.current = nextPlayer;
      setCurrentPlayer(nextPlayer);
    }
  }, [moveNumber, variant]);
  React.useEffect(() => {
    if (!vsAI || currentPlayer !== 2 || gameOver || showHowToPlay) return;
    const timer = setTimeout(() => {
      const col = chooseAIMove(boardRef.current, difficulty);
      if (col >= 0) dropDisc(col, true);
    }, 420);
    return () => clearTimeout(timer);
  }, [vsAI, currentPlayer, gameOver, showHowToPlay, difficulty, dropDisc]);
  const matchTarget = Math.ceil(seriesLength / 2);
  const outcomeRecordedRef = React.useRef(null);
  React.useEffect(() => {
    if (!winner || outcomeRecordedRef.current === winner) return;
    outcomeRecordedRef.current = winner;
    if (winner !== "draw") setMatchScore((score) => score.map((value, index) => index === winner - 1 ? value + 1 : value));
    const key = [names[0] || "Player 1", vsAI ? `Bot (${difficulty})` : names[1] || "Player 2"].join(" vs ");
    setRecords((previous) => {
      const row = { p1: 0, p2: 0, draws: 0, ...previous[key] };
      if (winner === "draw") row.draws++;
      else if (winner === 1) row.p1++;
      else row.p2++;
      const next = { ...previous, [key]: row };
      localStorage.setItem("connect4-family-records", JSON.stringify(next));
      return next;
    });
  }, [winner, names, vsAI, difficulty]);
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (showHowToPlayRef.current) return;
      const num = Number(e.key);
      if (Number.isInteger(num) && num >= 1 && num <= COLS) {
        e.preventDefault();
        dropDisc(num - 1);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [dropDisc]);
  const freshVariantBoard = React.useCallback(() => {
    const fresh = createEmptyBoard();
    if (variant === "obstacle") [[2, 2], [3, 4], [1, 5]].forEach(([r, c]) => fresh[cellIndex(r, c)] = 3);
    return fresh;
  }, [variant]);
  const startNewGame = React.useCallback(() => {
    const freshBoard = freshVariantBoard();
    const nextStarter = starter === 1 ? 2 : 1;
    boardRef.current = freshBoard;
    currentPlayerRef.current = nextStarter;
    gameOverRef.current = false;
    setBoard(freshBoard);
    setCurrentPlayer(nextStarter);
    setStarter(nextStarter);
    setWinner(null);
    setWinningCells([]);
    setMoveNumber(0);
    setRotation(0);
    GRAVITY_UP = false;
    outcomeRecordedRef.current = null;
  }, [freshVariantBoard, starter]);
  const changeVariant = (next) => {
    setVariant(next);
    CONNECT_TARGET = next === "five" ? 5 : 4;
    GRAVITY_UP = false;
    setRotation(0);
    setMoveNumber(0);
    setMatchScore([0, 0]);
    const fresh = createEmptyBoard();
    if (next === "obstacle") [[2, 2], [3, 4], [1, 5]].forEach(([r, c]) => fresh[cellIndex(r, c)] = 3);
    boardRef.current = fresh;
    currentPlayerRef.current = 1;
    gameOverRef.current = false;
    setBoard(fresh);
    setCurrentPlayer(1);
    setStarter(1);
    setWinner(null);
    setWinningCells([]);
    outcomeRecordedRef.current = null;
  };
  const popDisc = (col) => {
    if (variant !== "pop" || gameOverRef.current) return;
    const player = currentPlayerRef.current;
    const bottom = cellIndex(ROWS - 1, col);
    if (boardRef.current[bottom] !== player) return;
    const next = [...boardRef.current];
    for (let r = ROWS - 1; r > 0; r--) next[cellIndex(r, col)] = next[cellIndex(r - 1, col)];
    next[cellIndex(0, col)] = null;
    boardRef.current = next;
    setBoard(next);
    setMoveNumber((n) => n + 1);
    let winning = null, winningPlayer = null;
    for (let r = 0; r < ROWS && !winning; r++) for (let c = 0; c < COLS && !winning; c++) {
      const found = findWinThroughCell(next, r, c);
      if (found) {
        winning = found;
        winningPlayer = next[cellIndex(r, c)];
      }
    }
    if (winning) {
      gameOverRef.current = true;
      setWinningCells(winning);
      setWinner(winningPlayer);
      return;
    }
    const other = player === 1 ? 2 : 1;
    currentPlayerRef.current = other;
    setCurrentPlayer(other);
  };
  const newRoundOrMatch = () => {
    if (matchScore.some((value) => value >= matchTarget)) setMatchScore([0, 0]);
    startNewGame();
  };
  const openHowToPlay = React.useCallback(() => setShowHowToPlay(true), []);
  const closeHowToPlay = React.useCallback(() => setShowHowToPlay(false), []);
  const turnInfo = PLAYERS[currentPlayer];
  let statusText;
  if (winner === "draw") {
    statusText = "It's a Draw!";
  } else if (winner) {
    statusText = `${winner === 1 ? names[0] || "Player 1" : vsAI ? `Bot (${difficulty})` : names[1] || "Player 2"} Wins!`;
  } else {
    statusText = `${currentPlayer === 1 ? names[0] || "Player 1" : vsAI ? `Bot (${difficulty})` : names[1] || "Player 2"}'s Turn (${turnInfo.name})`;
  }
  return /* @__PURE__ */ React.createElement("div", { className: "mini-shell min-h-screen bg-black text-white font-sans relative overflow-hidden p-4 flex items-center justify-center" }, /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 bg-gradient-to-br from-black via-blue-950/50 to-black", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("div", { className: "absolute top-0 left-0 w-full h-full bg-repeat scanline-animation pointer-events-none", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("div", { className: "mini-layout relative z-10 w-full max-w-lg mx-auto text-center" }, /* @__PURE__ */ React.createElement("aside", { className: "mini-controls" }, /* @__PURE__ */ React.createElement("header", { className: "pt-16 pb-6 sm:py-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center gap-3" }, /* @__PURE__ */ React.createElement("h1", { className: "text-4xl md:text-5xl font-black bg-gradient-to-r from-red-400 via-blue-300 to-yellow-300 bg-clip-text text-transparent tracking-wider text-shadow-neon" }, "CONNECT FOUR"), /* @__PURE__ */ React.createElement(
    "button",
    {
      ref: howToPlayTriggerRef,
      onClick: openHowToPlay,
      className: "min-w-[44px] min-h-[44px] rounded-full border border-blue-500/50 bg-blue-500/10 text-blue-300 hover:bg-blue-500/30 hover:text-white transition-all flex items-center justify-center text-lg flex-shrink-0",
      "aria-label": "How to Play",
      title: "How to Play"
    },
    "❓"
  )), /* @__PURE__ */ React.createElement("p", { className: "text-blue-300/80 mt-2" }, "2-player pass-and-play. Get 4 in a row!")), /* @__PURE__ */ React.createElement(HowToPlayModal, { isOpen: showHowToPlay, onClose: closeHowToPlay, triggerRef: howToPlayTriggerRef }), /* @__PURE__ */ React.createElement("details", { className: "mini-settings", open: window.matchMedia("(min-width: 701px) and (orientation: landscape)").matches }, /* @__PURE__ */ React.createElement("summary", null, "Match options"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2 mb-2" }, /* @__PURE__ */ React.createElement("input", { value: names[0], onChange: (e) => {
    const next = [e.target.value, names[1]];
    setNames(next);
    localStorage.setItem("connect4-names", JSON.stringify(next));
  }, maxLength: "12", className: "bg-gray-900 border border-red-500 rounded px-2 py-1 text-center", "aria-label": "Red player name" }), /* @__PURE__ */ React.createElement("input", { value: names[1], onChange: (e) => {
    const next = [names[0], e.target.value];
    setNames(next);
    localStorage.setItem("connect4-names", JSON.stringify(next));
  }, maxLength: "12", disabled: vsAI, className: "bg-gray-900 border border-yellow-500 rounded px-2 py-1 text-center disabled:opacity-40", "aria-label": "Yellow player name" })), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap justify-center gap-1 mb-2" }, /* @__PURE__ */ React.createElement("button", { onClick: () => setVsAI(false), className: `px-2 py-1 rounded border text-xs ${!vsAI ? "bg-blue-600" : "bg-gray-900"}` }, "2 Players"), ["easy", "smart", "perfect"].map((level) => /* @__PURE__ */ React.createElement("button", { key: level, onClick: () => {
    setVsAI(true);
    setDifficulty(level);
  }, className: `px-2 py-1 rounded border text-xs capitalize ${vsAI && difficulty === level ? "bg-purple-600" : "bg-gray-900"}` }, "AI ", level)), /* @__PURE__ */ React.createElement("select", { value: seriesLength, onChange: (e) => {
    setSeriesLength(Number(e.target.value));
    setMatchScore([0, 0]);
  }, className: "bg-gray-900 border rounded px-2 text-xs" }, /* @__PURE__ */ React.createElement("option", { value: "3" }, "Best of 3"), /* @__PURE__ */ React.createElement("option", { value: "5" }, "Best of 5"))), /* @__PURE__ */ React.createElement("div", { className: "flex gap-1 overflow-x-auto mb-3" }, [["classic", "Classic"], ["pop", "Pop Out"], ["five", "Five in Row"], ["obstacle", "Obstacles"], ["rotate", "Rotating"]].map(([id, label]) => /* @__PURE__ */ React.createElement("button", { key: id, onClick: () => changeVariant(id), className: `shrink-0 px-2 py-1 rounded border text-xs ${variant === id ? "bg-cyan-600" : "bg-gray-900"}` }, label))), /* @__PURE__ */ React.createElement("div", { className: "mb-2 text-sm text-blue-100" }, "Series: ", /* @__PURE__ */ React.createElement("b", { className: "text-red-300" }, names[0] || "Player 1", " ", matchScore[0]), " – ", /* @__PURE__ */ React.createElement("b", { className: "text-yellow-200" }, vsAI ? "Bot" : names[1] || "Player 2", " ", matchScore[1]), " · first to ", matchTarget)), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "flex items-center justify-center gap-3 mb-4",
      "aria-live": "polite",
      "aria-atomic": "true"
    },
    /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "bg-black/40 border border-blue-500/30 rounded-xl px-5 py-2 flex items-center gap-3"
      },
      /* @__PURE__ */ React.createElement(
        "span",
        {
          className: "inline-block w-6 h-6 rounded-full flex-shrink-0",
          style: {
            backgroundColor: winner === "draw" ? "#64748b" : turnInfo.bg,
            boxShadow: `0 0 8px ${winner === "draw" ? "#64748b" : turnInfo.ring}`
          },
          "aria-hidden": "true"
        }
      ),
      /* @__PURE__ */ React.createElement("span", { className: "text-lg font-bold text-blue-100" }, statusText)
    )
  )), /* @__PURE__ */ React.createElement(
    "main",
    {
      className: "mini-board relative rounded-2xl p-3 md:p-4 shadow-2xl select-none",
      style: {
        background: "linear-gradient(180deg, #1e40af 0%, #1e3a8a 100%)",
        boxShadow: "0 10px 40px rgba(30, 58, 138, 0.6), inset 0 2px 4px rgba(255,255,255,0.15)"
      }
    },
    /* @__PURE__ */ React.createElement(
      "div",
      {
        role: "group",
        "aria-label": `Connect Four board, 7 columns by 6 rows. ${statusText}`,
        className: "relative w-full aspect-[7/6] flex gap-1 md:gap-1.5 transition-transform duration-700",
        style: { transform: variant === "rotate" ? `rotate(${rotation}deg)` : "none" }
      },
      Array.from({ length: COLS }).map((_, col) => /* @__PURE__ */ React.createElement(
        Column,
        {
          key: col,
          col,
          board,
          onDrop: dropDisc,
          disabled: gameOver,
          currentPlayer,
          winningSet
        }
      ))
    ),
    variant === "pop" && /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-7 gap-1 mt-2" }, Array.from({ length: COLS }, (_, col) => /* @__PURE__ */ React.createElement("button", { key: col, onClick: () => popDisc(col), className: "rounded bg-blue-950 border border-blue-400 text-xs min-h-[32px]", "aria-label": `Pop bottom disc from column ${col + 1}` }, "POP"))),
    gameOver && /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "absolute inset-0 rounded-2xl bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 animate-fade-in",
        role: "alert"
      },
      /* @__PURE__ */ React.createElement("h2", { className: "text-3xl font-black text-shadow-neon text-yellow-300" }, winner === "draw" ? "DRAW!" : `${winner === 1 ? names[0] || "Player 1" : vsAI ? "Bot" : names[1] || "Player 2"} WINS!`),
      /* @__PURE__ */ React.createElement("p", { className: "text-blue-100" }, winner === "draw" ? "The board is full. No winner this time." : `${PLAYERS[winner].name} connected four in a row.`),
      /* @__PURE__ */ React.createElement(
        "button",
        {
          ref: overlayButtonRef,
          onClick: newRoundOrMatch,
          className: "py-2 px-6 min-h-[44px] rounded-xl font-bold text-black bg-gradient-to-r from-yellow-300 to-amber-400 hover:scale-105 transition-all"
        },
        matchScore.some((value) => value >= matchTarget) ? "New Match" : "Next Round"
      )
    )
  ), /* @__PURE__ */ React.createElement("div", { className: "mini-bottom" }, /* @__PURE__ */ React.createElement("div", { className: "mt-3 p-2 rounded-lg bg-black/40 border border-blue-800 text-xs text-blue-100" }, /* @__PURE__ */ React.createElement("b", null, "Family records:"), " ", Object.entries(records).slice(-3).reverse().map(([key, row]) => /* @__PURE__ */ React.createElement("div", { key }, key, ": ", row.p1, "-", row.p2, " (", row.draws, " draws)"))), /* @__PURE__ */ React.createElement("footer", { className: "py-6" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      ref: newGameButtonRef,
      onClick: newRoundOrMatch,
      className: "mt-2 py-3 px-10 min-h-[44px] rounded-xl font-bold text-lg text-white transition-all duration-200 bg-gradient-to-r from-blue-600 to-blue-800 hover:scale-105 shadow-lg shadow-blue-800/50 border border-blue-400/30"
    },
    matchScore.some((value) => value >= matchTarget) ? "New Match" : "New Round"
  )))));
};
ReactDOM.render(/* @__PURE__ */ React.createElement(ConnectFourGame, null), document.getElementById("root"));
