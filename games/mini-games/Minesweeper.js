// Generated from Minesweeper.jsx by tools/build-react-games.mjs; do not edit.
"use strict";
const GRID_SIZE = 9;
const MINE_COUNT = 10;
const BEST_TIME_KEY = "familyPortalMinesweeperBestTime";
const NUMBER_COLORS = {
  1: "#60a5fa",
  // blue
  2: "#4ade80",
  // green
  3: "#f87171",
  // red
  4: "#c084fc",
  // purple
  5: "#fb7185",
  // maroon-ish
  6: "#22d3ee",
  // turquoise
  7: "#e2e8f0",
  // near-white
  8: "#94a3b8"
  // gray
};
const createEmptyBoard = () => Array.from(
  { length: GRID_SIZE },
  (_, r) => Array.from({ length: GRID_SIZE }, (_2, c) => ({
    row: r,
    col: c,
    mine: false,
    revealed: false,
    flagged: false,
    adjacent: 0
  }))
);
const cloneBoard = (board) => board.map((row) => row.map((cell) => ({ ...cell })));
const getNeighbors = (r, c) => {
  const neighbors = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) neighbors.push([nr, nc]);
    }
  }
  return neighbors;
};
const placeMines = (board, safeRow, safeCol) => {
  const newBoard = cloneBoard(board);
  const safeSet = /* @__PURE__ */ new Set([`${safeRow},${safeCol}`]);
  getNeighbors(safeRow, safeCol).forEach(([r, c]) => safeSet.add(`${r},${c}`));
  let placed = 0;
  while (placed < MINE_COUNT) {
    const r = Math.floor(Math.random() * GRID_SIZE);
    const c = Math.floor(Math.random() * GRID_SIZE);
    if (safeSet.has(`${r},${c}`) || newBoard[r][c].mine) continue;
    newBoard[r][c].mine = true;
    placed++;
  }
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (newBoard[r][c].mine) {
        newBoard[r][c].adjacent = -1;
        continue;
      }
      let count = 0;
      getNeighbors(r, c).forEach(([nr, nc]) => {
        if (newBoard[nr][nc].mine) count++;
      });
      newBoard[r][c].adjacent = count;
    }
  }
  return newBoard;
};
const revealFloodFill = (board, startRow, startCol) => {
  const newBoard = board.map((row) => row.slice());
  const queue = [[startRow, startCol]];
  const visited = /* @__PURE__ */ new Set();
  while (queue.length) {
    const [r, c] = queue.shift();
    const key = `${r},${c}`;
    if (visited.has(key)) continue;
    visited.add(key);
    let cell = newBoard[r][c];
    if (cell.revealed || cell.flagged) continue;
    cell = { ...cell, revealed: true };
    newBoard[r][c] = cell;
    if (cell.adjacent === 0 && !cell.mine) {
      getNeighbors(r, c).forEach(([nr, nc]) => {
        if (!newBoard[nr][nc].revealed && !newBoard[nr][nc].flagged) {
          queue.push([nr, nc]);
        }
      });
    }
  }
  return newBoard;
};
const revealAllMines = (board) => board.map((row) => row.map((cell) => cell.mine ? { ...cell, revealed: true } : cell));
const checkWin = (board) => {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!board[r][c].mine && !board[r][c].revealed) return false;
    }
  }
  return true;
};
const formatMineCounter = (n) => {
  const clamped = Math.max(-99, Math.min(999, n));
  if (clamped < 0) return "-" + String(Math.abs(clamped)).padStart(2, "0");
  return String(clamped).padStart(3, "0");
};
const formatTimeCounter = (n) => String(Math.max(0, Math.min(999, n))).padStart(3, "0");
const formatBestTime = (n) => {
  if (n === null || n === void 0) return "--:--";
  const mins = Math.floor(n / 60);
  const secs = n % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
};
const HowToPlayModal = ({ isOpen, onClose, triggerRef }) => {
  const closeButtonRef = React.useRef(null);
  const modalRef = React.useRef(null);
  React.useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);
  const handleClose = React.useCallback(() => {
    onClose();
    requestAnimationFrame(() => {
      if (triggerRef && triggerRef.current) {
        triggerRef.current.focus();
      }
    });
  }, [onClose, triggerRef]);
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
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
  }, [isOpen, handleClose]);
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
        className: "relative bg-slate-900 border border-slate-500/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl shadow-black/50 animate-fade-in",
        onClick: (e) => e.stopPropagation()
      },
      /* @__PURE__ */ React.createElement(
        "button",
        {
          ref: closeButtonRef,
          onClick: handleClose,
          className: "absolute top-2 right-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-300 hover:text-white transition-colors text-2xl leading-none rounded-lg",
          "aria-label": "Close instructions"
        },
        "×"
      ),
      /* @__PURE__ */ React.createElement("h2", { id: "how-to-play-title", className: "text-2xl font-bold bg-gradient-to-r from-slate-200 to-red-300 bg-clip-text text-transparent mb-4" }, "How to Play"),
      /* @__PURE__ */ React.createElement("ul", { className: "text-slate-200/90 text-sm space-y-3 list-none" }, /* @__PURE__ */ React.createElement("li", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-red-400 mt-0.5", "aria-hidden": "true" }, "▶"), /* @__PURE__ */ React.createElement("span", null, "Tap a ", /* @__PURE__ */ React.createElement("strong", { className: "text-slate-100" }, "hidden cell"), " to reveal it. Numbers show how many mines hide among its 8 neighbors.")), /* @__PURE__ */ React.createElement("li", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-red-400 mt-0.5", "aria-hidden": "true" }, "▶"), /* @__PURE__ */ React.createElement("span", null, "Reveal a ", /* @__PURE__ */ React.createElement("strong", { className: "text-red-300" }, "mine"), " and it's game over — but your very first tap is always guaranteed safe.")), /* @__PURE__ */ React.createElement("li", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-red-400 mt-0.5", "aria-hidden": "true" }, "▶"), /* @__PURE__ */ React.createElement("span", null, "Turn on ", /* @__PURE__ */ React.createElement("strong", { className: "text-slate-100" }, "Flag Mode 🚩"), " to mark suspected mines (tap again to unmark), or right-click on a computer.")), /* @__PURE__ */ React.createElement("li", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-red-400 mt-0.5", "aria-hidden": "true" }, "▶"), /* @__PURE__ */ React.createElement("span", null, "Uncover ", /* @__PURE__ */ React.createElement("strong", { className: "text-slate-100" }, "every safe cell"), " to win — flagging every mine isn't required.")), /* @__PURE__ */ React.createElement("li", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-red-400 mt-0.5", "aria-hidden": "true" }, "▶"), /* @__PURE__ */ React.createElement("span", null, "Your ", /* @__PURE__ */ React.createElement("strong", { className: "text-slate-100" }, "best time"), " is saved automatically. Try to beat it!"))),
      /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: handleClose,
          className: "mt-5 w-full py-2 min-h-[44px] rounded-lg font-bold text-white bg-gradient-to-r from-slate-500 to-slate-700 hover:from-slate-400 hover:to-slate-600 transition-all"
        },
        "Got it!"
      )
    )
  );
};
const cellAriaLabel = (cell, gameState) => {
  const pos = `Row ${cell.row + 1}, column ${cell.col + 1}`;
  if (cell.flagged && !cell.revealed) {
    if (gameState === "lost" && !cell.mine) return `${pos}, incorrectly flagged`;
    return `${pos}, flagged`;
  }
  if (!cell.revealed) return `${pos}, hidden`;
  if (cell.mine) return `${pos}, mine`;
  if (cell.adjacent === 0) return `${pos}, empty, no adjacent mines`;
  return `${pos}, ${cell.adjacent} adjacent mine${cell.adjacent === 1 ? "" : "s"}`;
};
const Cell = React.memo(({ cell, isExploded, gameState, onActivate, onContextMenu }) => {
  const isDisabled = cell.revealed || gameState !== "playing";
  const handleClick = React.useCallback(() => {
    onActivate(cell.row, cell.col);
  }, [onActivate, cell.row, cell.col]);
  const handleContext = React.useCallback((e) => {
    e.preventDefault();
    onContextMenu(cell.row, cell.col);
  }, [onContextMenu, cell.row, cell.col]);
  let content = null;
  let contentColor = void 0;
  if (cell.flagged && !cell.revealed) {
    content = gameState === "lost" && !cell.mine ? "❌" : "🚩";
  } else if (cell.revealed) {
    if (cell.mine) {
      content = "💣";
    } else if (cell.adjacent > 0) {
      content = cell.adjacent;
      contentColor = NUMBER_COLORS[cell.adjacent];
    }
  }
  let bgStyle;
  if (cell.revealed) {
    if (cell.mine) {
      bgStyle = {
        backgroundColor: isExploded ? "#dc2626" : "#450a0a",
        boxShadow: "inset 1px 1px 3px rgba(0,0,0,0.6)"
      };
    } else {
      bgStyle = {
        backgroundColor: "#1e293b",
        boxShadow: "inset 1px 1px 4px rgba(0,0,0,0.65)"
      };
    }
  } else {
    bgStyle = {
      backgroundColor: "#475569",
      boxShadow: "inset 2px 2px 0 rgba(255,255,255,0.3), inset -2px -2px 0 rgba(0,0,0,0.45)"
    };
  }
  return /* @__PURE__ */ React.createElement(
    "button",
    {
      role: "gridcell",
      onClick: handleClick,
      onContextMenu: handleContext,
      disabled: isDisabled,
      "aria-label": cellAriaLabel(cell, gameState),
      "aria-pressed": cell.revealed ? void 0 : cell.flagged,
      className: `ms-cell flex-shrink-0 rounded-[4px] flex items-center justify-center font-bold select-none transition-transform duration-100 ${cell.revealed ? "cell-reveal" : "hover:brightness-110 active:scale-95"}`,
      style: { ...bgStyle, color: contentColor, cursor: isDisabled ? "default" : "pointer" }
    },
    content
  );
});
const MinesweeperGame = () => {
  const [board, setBoard] = React.useState(() => createEmptyBoard());
  const [minesPlaced, setMinesPlaced] = React.useState(false);
  const [flagMode, setFlagMode] = React.useState(false);
  const [gameState, setGameState] = React.useState("playing");
  const [explodedCell, setExplodedCell] = React.useState(null);
  const [elapsed, setElapsed] = React.useState(0);
  const [bestTime, setBestTime] = React.useState(null);
  const [showHowToPlay, setShowHowToPlay] = React.useState(false);
  const timerRef = React.useRef(null);
  const elapsedRef = React.useRef(0);
  const startTimeRef = React.useRef(null);
  const pausedAtRef = React.useRef(null);
  const boardRef = React.useRef(board);
  const gameStateRef = React.useRef("playing");
  const minesPlacedRef = React.useRef(false);
  const flagModeRef = React.useRef(false);
  const howToPlayTriggerRef = React.useRef(null);
  const newGameButtonRef = React.useRef(null);
  const prevStateRef = React.useRef("playing");
  const commitBoard = React.useCallback((b) => {
    boardRef.current = b;
    setBoard(b);
  }, []);
  React.useEffect(() => {
    const stored = Number(localStorage.getItem(BEST_TIME_KEY));
    if (!Number.isNaN(stored) && stored > 0) setBestTime(stored);
  }, []);
  React.useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);
  React.useEffect(() => {
    if (gameState !== "playing" && prevStateRef.current === "playing" && newGameButtonRef.current) {
      newGameButtonRef.current.focus();
    }
    prevStateRef.current = gameState;
  }, [gameState]);
  const startTimer = React.useCallback(() => {
    if (timerRef.current !== null) return;
    if (startTimeRef.current === null) startTimeRef.current = Date.now();
    timerRef.current = window.setInterval(() => {
      elapsedRef.current = Math.floor((Date.now() - startTimeRef.current) / 1e3);
      setElapsed(elapsedRef.current);
    }, 500);
  }, []);
  const stopTimer = React.useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);
  React.useEffect(() => {
    if (showHowToPlay) {
      if (timerRef.current !== null && startTimeRef.current !== null) {
        pausedAtRef.current = Date.now();
        stopTimer();
      }
    } else if (pausedAtRef.current !== null) {
      startTimeRef.current += Date.now() - pausedAtRef.current;
      pausedAtRef.current = null;
      startTimer();
    }
  }, [showHowToPlay, startTimer, stopTimer]);
  const flagCount = React.useMemo(() => {
    let count = 0;
    board.forEach((row) => row.forEach((cell) => {
      if (cell.flagged) count++;
    }));
    return count;
  }, [board]);
  const minesRemaining = MINE_COUNT - flagCount;
  const revealCell = React.useCallback((r, c) => {
    if (gameStateRef.current !== "playing") return;
    const existing = boardRef.current[r][c];
    if (existing.flagged || existing.revealed) return;
    let workingBoard = boardRef.current;
    if (!minesPlacedRef.current) {
      workingBoard = placeMines(workingBoard, r, c);
      minesPlacedRef.current = true;
      setMinesPlaced(true);
      startTimer();
    }
    const target = workingBoard[r][c];
    if (target.mine) {
      setExplodedCell({ row: r, col: c });
      commitBoard(revealAllMines(workingBoard));
      gameStateRef.current = "lost";
      setGameState("lost");
      stopTimer();
      return;
    }
    const newBoard = revealFloodFill(workingBoard, r, c);
    commitBoard(newBoard);
    if (checkWin(newBoard)) {
      gameStateRef.current = "won";
      setGameState("won");
      stopTimer();
      if (startTimeRef.current !== null) {
        elapsedRef.current = Math.floor((Date.now() - startTimeRef.current) / 1e3);
        setElapsed(elapsedRef.current);
      }
      const finalTime = elapsedRef.current;
      setBestTime((prevBest) => {
        if (prevBest === null || finalTime < prevBest) {
          localStorage.setItem(BEST_TIME_KEY, String(finalTime));
          return finalTime;
        }
        return prevBest;
      });
    }
  }, [commitBoard, startTimer, stopTimer]);
  const toggleFlag = React.useCallback((r, c) => {
    if (gameStateRef.current !== "playing") return;
    const cell = boardRef.current[r][c];
    if (cell.revealed) return;
    const newBoard = boardRef.current.map((row) => row.slice());
    newBoard[r][c] = { ...cell, flagged: !cell.flagged };
    commitBoard(newBoard);
  }, [commitBoard]);
  const handleCellActivate = React.useCallback((r, c) => {
    if (flagModeRef.current) {
      toggleFlag(r, c);
    } else {
      revealCell(r, c);
    }
  }, [toggleFlag, revealCell]);
  const handleCellContextMenu = React.useCallback((r, c) => {
    toggleFlag(r, c);
  }, [toggleFlag]);
  const startNewGame = React.useCallback(() => {
    stopTimer();
    elapsedRef.current = 0;
    startTimeRef.current = null;
    pausedAtRef.current = null;
    setElapsed(0);
    commitBoard(createEmptyBoard());
    minesPlacedRef.current = false;
    setMinesPlaced(false);
    gameStateRef.current = "playing";
    setGameState("playing");
    setExplodedCell(null);
    flagModeRef.current = false;
    setFlagMode(false);
  }, [commitBoard, stopTimer]);
  const toggleFlagMode = React.useCallback(() => {
    flagModeRef.current = !flagModeRef.current;
    setFlagMode(flagModeRef.current);
  }, []);
  const openHowToPlay = React.useCallback(() => setShowHowToPlay(true), []);
  const closeHowToPlay = React.useCallback(() => setShowHowToPlay(false), []);
  const faceEmoji = gameState === "won" ? "😎" : gameState === "lost" ? "😵" : "🙂";
  const isOver = gameState !== "playing";
  return /* @__PURE__ */ React.createElement("div", { className: "mines-shell min-h-screen bg-black text-white font-sans relative overflow-hidden p-4 flex items-center justify-center" }, /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 bg-gradient-to-br from-black via-slate-800/40 to-black", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("div", { className: "absolute top-0 left-0 w-full h-full bg-repeat scanline-animation pointer-events-none", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("div", { className: "relative z-10 w-full max-w-md md:max-w-2xl mx-auto text-center" }, /* @__PURE__ */ React.createElement("header", { className: "game-header py-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center gap-3" }, /* @__PURE__ */ React.createElement("h1", { className: "text-4xl md:text-5xl font-black bg-gradient-to-r from-slate-200 via-slate-300 to-red-300 bg-clip-text text-transparent tracking-wider text-shadow-steel" }, "MINESWEEPER"), /* @__PURE__ */ React.createElement(
    "button",
    {
      ref: howToPlayTriggerRef,
      onClick: openHowToPlay,
      className: "min-w-[44px] min-h-[44px] rounded-full border border-slate-400/50 bg-slate-500/10 text-slate-200 hover:bg-slate-500/30 hover:text-white transition-all flex items-center justify-center text-lg flex-shrink-0",
      "aria-label": "How to Play",
      title: "How to Play"
    },
    "❓"
  )), /* @__PURE__ */ React.createElement("p", { className: "text-slate-300/80 mt-2" }, "Clear the field. Don't trip a mine.")), /* @__PURE__ */ React.createElement(HowToPlayModal, { isOpen: showHowToPlay, onClose: closeHowToPlay, triggerRef: howToPlayTriggerRef }), /* @__PURE__ */ React.createElement("div", { className: "game-stats flex items-center justify-center gap-3 mb-4" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "bg-black/60 border border-slate-500/40 rounded-lg px-3 py-2 min-w-[76px]",
      "aria-live": "polite",
      "aria-atomic": "true"
    },
    /* @__PURE__ */ React.createElement("div", { className: "text-[10px] uppercase tracking-widest text-slate-400" }, "Mines"),
    /* @__PURE__ */ React.createElement("div", { className: "text-2xl font-bold text-red-400 tabular-nums", style: { fontFamily: "monospace" } }, formatMineCounter(minesRemaining))
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      ref: newGameButtonRef,
      onClick: startNewGame,
      className: "min-w-[44px] min-h-[44px] w-14 h-14 rounded-xl border border-slate-400/50 bg-gradient-to-b from-slate-400 to-slate-600 text-2xl flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-black/40",
      "aria-label": "New game",
      title: "New Game"
    },
    /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, faceEmoji)
  ), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "bg-black/60 border border-slate-500/40 rounded-lg px-3 py-2 min-w-[76px]",
      "aria-live": "polite",
      "aria-atomic": "true"
    },
    /* @__PURE__ */ React.createElement("div", { className: "text-[10px] uppercase tracking-widest text-slate-400" }, "Time"),
    /* @__PURE__ */ React.createElement("div", { className: "text-2xl font-bold text-red-400 tabular-nums", style: { fontFamily: "monospace" } }, formatTimeCounter(elapsed))
  )), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center mb-4" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: toggleFlagMode,
      "aria-pressed": flagMode,
      className: `min-h-[44px] px-5 rounded-xl border font-bold transition-all flex items-center gap-2 ${flagMode ? "bg-red-500/30 border-red-400 text-red-200" : "bg-slate-500/10 border-slate-400/50 text-slate-200 hover:bg-slate-500/20"}`
    },
    /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, "🚩"),
    "Flag Mode ",
    flagMode ? "On" : "Off"
  )), /* @__PURE__ */ React.createElement("main", { className: "relative inline-block bg-black/30 backdrop-blur-sm rounded-2xl p-2 border border-slate-500/30 shadow-2xl shadow-black/50" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      role: "grid",
      "aria-label": `Minesweeper board, 9 by 9, ${minesRemaining} mines remaining`,
      className: "flex flex-col gap-1"
    },
    board.map((row, r) => /* @__PURE__ */ React.createElement("div", { key: r, role: "row", className: "flex gap-1 justify-center" }, row.map((cell) => /* @__PURE__ */ React.createElement(
      Cell,
      {
        key: `${cell.row}-${cell.col}`,
        cell,
        gameState,
        isExploded: !!explodedCell && explodedCell.row === cell.row && explodedCell.col === cell.col,
        onActivate: handleCellActivate,
        onContextMenu: handleCellContextMenu
      }
    ))))
  ), isOver && /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "absolute inset-0 rounded-2xl bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 animate-fade-in",
      role: "alert"
    },
    /* @__PURE__ */ React.createElement("h2", { className: `text-3xl font-black text-shadow-steel ${gameState === "won" ? "text-emerald-300" : "text-red-400"}` }, gameState === "won" ? "YOU WIN!" : "GAME OVER"),
    /* @__PURE__ */ React.createElement("p", { className: "text-slate-200" }, gameState === "won" ? `Cleared in ${elapsed}s` : "You hit a mine."),
    /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: startNewGame,
        className: "py-2 px-6 min-h-[44px] rounded-xl font-bold text-white bg-gradient-to-r from-slate-500 to-slate-700 hover:scale-105 transition-all"
      },
      "New Game"
    )
  )), /* @__PURE__ */ React.createElement("footer", { className: "game-footer py-6" }, /* @__PURE__ */ React.createElement("p", { className: "text-slate-300/80 text-sm mb-3" }, "Best time: ", /* @__PURE__ */ React.createElement("span", { className: "font-bold text-slate-100" }, formatBestTime(bestTime))), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: startNewGame,
      className: "py-3 px-10 min-h-[44px] rounded-xl font-bold text-lg text-white transition-all duration-200 bg-gradient-to-r from-slate-500 to-slate-700 hover:scale-105 shadow-lg shadow-black/50"
    },
    "New Game"
  ))));
};
