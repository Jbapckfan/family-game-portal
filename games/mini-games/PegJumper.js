// Generated from PegJumper.jsx by tools/build-react-games.mjs; do not edit.
"use strict";
const { useState, useEffect, useCallback, useRef } = React;
const LEVELS = [
  {
    name: "Triangle",
    layout: [
      [null, null, null, null, 1, null, null, null, null],
      [null, null, null, 1, null, 1, null, null, null],
      [null, null, 1, null, 1, null, 1, null, null],
      [null, 1, null, 1, null, 1, null, 1, null],
      [1, null, 1, null, 1, null, 1, null, 1]
    ],
    initialEmpty: { row: 0, col: 4 },
    // Standard triangle rules: jumps only along the board's three lines
    directions: [[0, 4], [0, -4], [2, 2], [2, -2], [-2, 2], [-2, -2]]
  },
  {
    name: "Cross",
    layout: [
      [null, null, 1, 1, 1, null, null],
      [null, null, 1, 1, 1, null, null],
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [null, null, 1, 1, 1, null, null],
      [null, null, 1, 1, 1, null, null]
    ],
    initialEmpty: { row: 3, col: 3 },
    directions: [[0, 2], [0, -2], [2, 0], [-2, 0]]
  },
  {
    name: "Triple Triangle",
    layout: [
      [null, null, 1, null, 1, null, 1, null, null],
      [null, 1, null, 1, null, 1, null, 1, null],
      [1, null, 1, null, 1, null, 1, null, 1],
      [null, null, null, 1, null, 1, null, null, null],
      [null, null, 1, null, 1, null, 1, null, null]
    ],
    initialEmpty: { row: 2, col: 4 },
    // Keeps the extra straight up/down jump ([4,0]); explained in How to Play
    directions: [[0, 4], [0, -4], [4, 0], [-4, 0], [2, 2], [2, -2], [-2, 2], [-2, -2]]
  },
  {
    name: "Rectangle",
    layout: [
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1]
    ],
    initialEmpty: { row: 1, col: 2 },
    directions: [[0, 2], [0, -2], [2, 0], [-2, 0]]
  },
  {
    name: "Compact Square",
    layout: [
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1]
    ],
    initialEmpty: { row: 0, col: 1 },
    directions: [[0, 2], [0, -2], [2, 0], [-2, 0]]
  },
  {
    name: "Long Board",
    layout: [
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1]
    ],
    initialEmpty: { row: 0, col: 2 },
    directions: [[0, 2], [0, -2], [2, 0], [-2, 0]]
  }
];
const GameState = {
  PLAYING: "playing",
  WON: "won",
  LOST: "lost"
};
const RAPID_MOVE_BONUS = 50;
const RAPID_MOVE_THRESHOLD_MS = 2500;
const IS_TOUCH_PRIMARY = window.matchMedia && window.matchMedia("(hover: none)").matches || (navigator.maxTouchPoints || 0) > 0;
function safeGetItem(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn("localStorage read failed:", e);
    return null;
  }
}
function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn("localStorage write failed:", e);
  }
}
function findMoves(board, levelIndex, fromRow, fromCol) {
  const moves = [];
  const directions = LEVELS[levelIndex].directions;
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (fromRow !== void 0 && (r !== fromRow || c !== fromCol)) continue;
      if (board[r][c] !== true) continue;
      for (const [dr, dc] of directions) {
        const endR = r + dr, endC = c + dc;
        const midR = r + dr / 2, midC = c + dc / 2;
        if (board[endR] && board[endR][endC] === false && board[midR] && board[midR][midC] === true) {
          moves.push({ from: { row: r, col: c }, to: { row: endR, col: endC }, jumped: { row: midR, col: midC } });
        }
      }
    }
  }
  return moves;
}
function boardAfterJump(board, move) {
  const next = board.map((row) => [...row]);
  next[move.from.row][move.from.col] = false;
  next[move.jumped.row][move.jumped.col] = false;
  next[move.to.row][move.to.col] = true;
  return next;
}
function analyzeSolvability(startBoard, levelIndex, maxNodes = 7e4) {
  const memo = /* @__PURE__ */ new Map();
  let nodes = 0;
  const encode = (board) => board.flatMap((row) => row.filter((cell) => cell !== null).map((cell) => cell ? "1" : "0")).join("");
  const visit = (board) => {
    if (++nodes > maxNodes) return null;
    const key = encode(board);
    if (memo.has(key)) return memo.get(key);
    if (board.flat().filter(Boolean).length === 1) return true;
    const moves = findMoves(board, levelIndex);
    if (!moves.length) {
      memo.set(key, false);
      return false;
    }
    let uncertain = false;
    moves.sort((a, b) => Math.hypot(a.to.row - board.length / 2, a.to.col - board[0].length / 2) - Math.hypot(b.to.row - board.length / 2, b.to.col - board[0].length / 2));
    for (const move of moves) {
      const answer = visit(boardAfterJump(board, move));
      if (answer === true) {
        memo.set(key, true);
        return true;
      }
      if (answer === null) uncertain = true;
    }
    if (!uncertain) memo.set(key, false);
    return uncertain ? null : false;
  };
  return { result: visit(startBoard), nodes };
}
const Celebration = ({ show, pegsRemaining }) => {
  if (!show) return null;
  const isPerfect = pegsRemaining === 1;
  const isNiceTry = pegsRemaining >= 2 && pegsRemaining <= 3;
  const confettiColors = ["#fbbf24", "#f472b6", "#34d399", "#60a5fa", "#a78bfa", "#fb923c", "#f87171"];
  const confettiPieces = isPerfect ? Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    color: confettiColors[i % confettiColors.length],
    delay: Math.random() * 1.5,
    duration: 2.5 + Math.random() * 2,
    size: 6 + Math.random() * 8,
    shape: Math.random() > 0.5 ? "circle" : "rect"
  })) : [];
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "fixed inset-0 pointer-events-none z-50 flex items-center justify-center",
      role: "status",
      "aria-live": "assertive",
      "aria-label": isPerfect ? "Perfect solve! Congratulations!" : isNiceTry ? "Nice try! Almost perfect!" : "Congratulations, you won!"
    },
    isPerfect && /* @__PURE__ */ React.createElement(React.Fragment, null, confettiPieces.map((p) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: p.id,
        className: "confetti-piece",
        "aria-hidden": "true",
        style: {
          left: `${p.left}%`,
          width: p.size,
          height: p.size,
          backgroundColor: p.color,
          borderRadius: p.shape === "circle" ? "50%" : "2px",
          animationDelay: `${p.delay}s`,
          animationDuration: `${p.duration}s`
        }
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "golden-badge flex flex-col items-center gap-2", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("div", { className: "text-8xl" }, "🏆"), /* @__PURE__ */ React.createElement("div", { className: "px-6 py-2 bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 rounded-full shadow-lg shadow-yellow-500/50" }, /* @__PURE__ */ React.createElement("span", { className: "text-xl font-black text-gray-900 tracking-wide" }, "PERFECT SOLVE!"))), /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-pink-400/20 to-purple-400/20 animate-pulse", "aria-hidden": "true" })),
    isNiceTry && /* @__PURE__ */ React.createElement("div", { className: "nice-try-anim flex flex-col items-center gap-2", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("div", { className: "text-6xl" }, "👏"), /* @__PURE__ */ React.createElement("div", { className: "px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-lg" }, /* @__PURE__ */ React.createElement("span", { className: "text-lg font-bold text-white" }, "Nice Try! ", pegsRemaining, " pegs left"))),
    !isPerfect && !isNiceTry && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "text-8xl animate-bounce", "aria-hidden": "true" }, "🏆"), /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-pink-400/20 to-purple-400/20 animate-pulse", "aria-hidden": "true" }))
  );
};
const Peg = ({ onClick, onKeyDown, isSelected, rowIndex, colIndex, animClass, hidden }) => /* @__PURE__ */ React.createElement(
  "div",
  {
    className: "min-w-[38px] min-h-[38px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center cursor-pointer",
    onClick,
    onKeyDown,
    role: "button",
    tabIndex: 0,
    "aria-label": `Peg at row ${rowIndex + 1}, column ${colIndex + 1}${isSelected ? ", selected" : ""}`,
    "aria-pressed": isSelected
  },
  /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `peg-object w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-400/70 transition-all duration-200 pointer-events-none ${isSelected ? "border-4 border-yellow-400 animate-pulse ring-2 ring-yellow-400/50" : "border-2 border-cyan-400/30"} ${animClass || ""}`,
      style: hidden ? { opacity: 0 } : void 0,
      "aria-hidden": "true"
    }
  )
);
const Hole = ({ onClick, onKeyDown, rowIndex, colIndex, isValidTarget, onMouseEnter, onMouseLeave }) => /* @__PURE__ */ React.createElement(
  "div",
  {
    className: "min-w-[38px] min-h-[38px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center cursor-pointer",
    onClick,
    onKeyDown,
    onMouseEnter,
    onMouseLeave,
    role: "button",
    tabIndex: 0,
    "aria-label": `Empty hole at row ${rowIndex + 1}, column ${colIndex + 1}${isValidTarget ? ", valid move target" : ""}`
  },
  /* @__PURE__ */ React.createElement("div", { className: `peg-well w-6 h-6 sm:w-7 sm:h-7 rounded-full shadow-inner border-2 transition-colors pointer-events-none ${isValidTarget ? "valid-target-hole bg-gray-800" : "bg-gray-800 border-purple-500/30 hover:border-purple-500"}`, "aria-hidden": "true" })
);
const HowToPlayModal = ({ isOpen, onClose, triggerRef }) => {
  const closeButtonRef = useRef(null);
  const gotItButtonRef = useRef(null);
  const modalRef = useRef(null);
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      if (gotItButtonRef.current) gotItButtonRef.current.focus();
    }, 50);
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
      if (triggerRef && triggerRef.current) {
        triggerRef.current.focus();
      }
    };
  }, [isOpen, onClose, triggerRef]);
  if (!isOpen) return null;
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "fixed inset-0 z-50 flex items-center justify-center p-4",
      onClick: onClose,
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "how-to-play-title"
    },
    /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 bg-black/70 backdrop-blur-sm", "aria-hidden": "true" }),
    /* @__PURE__ */ React.createElement(
      "div",
      {
        ref: modalRef,
        className: "relative bg-gray-900 border border-purple-500/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl shadow-purple-500/20",
        style: { animation: "fadeIn 0.3s ease-out" },
        onClick: (e) => e.stopPropagation()
      },
      /* @__PURE__ */ React.createElement(
        "button",
        {
          ref: closeButtonRef,
          onClick: onClose,
          className: "absolute top-3 right-3 text-purple-300 hover:text-white transition-colors text-2xl leading-none min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg",
          "aria-label": "Close instructions"
        },
        "×"
      ),
      /* @__PURE__ */ React.createElement("h2", { id: "how-to-play-title", className: "text-2xl font-black bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4" }, "How to Play"),
      /* @__PURE__ */ React.createElement("ul", { className: "text-purple-100/90 text-sm space-y-3 list-none" }, /* @__PURE__ */ React.createElement("li", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-cyan-400 mt-0.5", "aria-hidden": "true" }, "▶"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("strong", { className: "text-cyan-300" }, "Click a peg"), " to select it, then click an ", /* @__PURE__ */ React.createElement("strong", { className: "text-cyan-300" }, "empty hole"), " two spaces away to jump.")), /* @__PURE__ */ React.createElement("li", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-cyan-400 mt-0.5", "aria-hidden": "true" }, "▶"), /* @__PURE__ */ React.createElement("span", null, "The peg you ", /* @__PURE__ */ React.createElement("strong", { className: "text-pink-300" }, "jump over"), " is removed from the board.")), /* @__PURE__ */ React.createElement("li", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-cyan-400 mt-0.5", "aria-hidden": "true" }, "▶"), /* @__PURE__ */ React.createElement("span", null, "Goal: remove as many pegs as possible. Ideally, leave ", /* @__PURE__ */ React.createElement("strong", { className: "text-yellow-300" }, "just 1 peg"), "!")), /* @__PURE__ */ React.createElement("li", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-cyan-400 mt-0.5", "aria-hidden": "true" }, "▶"), /* @__PURE__ */ React.createElement("span", null, "Jump over adjacent pegs into empty holes along ", /* @__PURE__ */ React.createElement("strong", { className: "text-cyan-300" }, "valid paths"), ".")), /* @__PURE__ */ React.createElement("li", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-cyan-400 mt-0.5", "aria-hidden": "true" }, "▶"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("strong", { className: "text-cyan-300" }, "Triple Triangle bonus move:"), " on that board only, a peg can also jump ", /* @__PURE__ */ React.createElement("strong", { className: "text-cyan-300" }, "straight up or down"), " over the peg right above or below it, even though there is a small gap between them."))),
      /* @__PURE__ */ React.createElement(
        "button",
        {
          ref: gotItButtonRef,
          onClick: onClose,
          className: "mt-5 w-full py-3 rounded-lg font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 transition-all min-h-[44px]"
        },
        "Got it!"
      )
    )
  );
};
const FlyingPeg = ({ from, to, getCellPosition }) => {
  const [style, setStyle] = useState({});
  const pegRef = useRef(null);
  useEffect(() => {
    const fromPos = getCellPosition(from.row, from.col);
    const toPos = getCellPosition(to.row, to.col);
    const diameter = fromPos.diameter || 36;
    setStyle({
      left: fromPos.x - diameter / 2,
      top: fromPos.y - diameter / 2,
      width: diameter,
      height: diameter
    });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setStyle({
          left: toPos.x - diameter / 2,
          top: toPos.y - diameter / 2,
          width: diameter,
          height: diameter
        });
      });
    });
  }, [from, to, getCellPosition]);
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      ref: pegRef,
      className: "peg-flying rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-400/70 border-2 border-yellow-400",
      style,
      "aria-hidden": "true"
    }
  );
};
const getLevelDifficulty = (level) => {
  let pegCount = 0;
  level.layout.forEach((row) => row.forEach((cell) => {
    if (cell === 1) pegCount++;
  }));
  const dirCount = level.directions.length;
  const complexity = pegCount - dirCount * 1.5;
  if (complexity >= 20) return { label: "Hard", color: "text-red-400", dotColor: "bg-red-400", bgColor: "bg-red-400/10" };
  if (complexity >= 10) return { label: "Medium", color: "text-yellow-400", dotColor: "bg-yellow-400", bgColor: "bg-yellow-400/10" };
  return { label: "Easy", color: "text-green-400", dotColor: "bg-green-400", bgColor: "bg-green-400/10" };
};
const GhostTrail = ({ from, to, jumped, getCellPosition, faint }) => {
  const [positions, setPositions] = useState(null);
  useEffect(() => {
    const fromPos = getCellPosition(from.row, from.col);
    const toPos = getCellPosition(to.row, to.col);
    const jumpedPos = getCellPosition(jumped.row, jumped.col);
    if (fromPos.x === 0 && fromPos.y === 0) return;
    setPositions({ from: fromPos, to: toPos, jumped: jumpedPos });
  }, [from, to, jumped, getCellPosition]);
  if (!positions) return null;
  const { from: fp, to: tp, jumped: jp } = positions;
  const midX = (fp.x + tp.x) / 2;
  const midY = (fp.y + tp.y) / 2;
  const dx = tp.x - fp.x;
  const dy = tp.y - fp.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const arcHeight = len * 0.25;
  const cpX = midX - dy / len * arcHeight;
  const cpY = midY + dx / len * arcHeight;
  return /* @__PURE__ */ React.createElement("svg", { className: "absolute inset-0 pointer-events-none", style: { width: "100%", height: "100%", zIndex: 50, opacity: faint ? 0.55 : 1 }, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("marker", { id: "arrowhead", markerWidth: "8", markerHeight: "6", refX: "8", refY: "3", orient: "auto" }, /* @__PURE__ */ React.createElement("polygon", { points: "0 0, 8 3, 0 6", fill: "rgba(74, 222, 128, 0.7)" }))), /* @__PURE__ */ React.createElement(
    "path",
    {
      d: `M ${fp.x} ${fp.y} Q ${cpX} ${cpY} ${tp.x} ${tp.y}`,
      fill: "none",
      stroke: "rgba(74, 222, 128, 0.5)",
      strokeWidth: "2.5",
      strokeDasharray: "6 4",
      markerEnd: "url(#arrowhead)"
    }
  ), /* @__PURE__ */ React.createElement("line", { x1: jp.x - 6, y1: jp.y - 6, x2: jp.x + 6, y2: jp.y + 6, stroke: "rgba(239, 68, 68, 0.7)", strokeWidth: "2.5", strokeLinecap: "round" }), /* @__PURE__ */ React.createElement("line", { x1: jp.x + 6, y1: jp.y - 6, x2: jp.x - 6, y2: jp.y + 6, stroke: "rgba(239, 68, 68, 0.7)", strokeWidth: "2.5", strokeLinecap: "round" }), /* @__PURE__ */ React.createElement("circle", { cx: tp.x, cy: tp.y, r: "14", fill: "rgba(34, 211, 238, 0.2)", stroke: "rgba(34, 211, 238, 0.4)", strokeWidth: "1.5", strokeDasharray: "4 3" }));
};
const PegJumperGame = () => {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [board, setBoard] = useState([]);
  const [selectedPeg, setSelectedPeg] = useState(null);
  const [gameState, setGameState] = useState(GameState.PLAYING);
  const [pegsRemaining, setPegsRemaining] = useState(0);
  const [initialPegCount, setInitialPegCount] = useState(0);
  const [showWin, setShowWin] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [score, setScore] = useState(0);
  const [highScores, setHighScores] = useState({});
  const [time, setTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const lastMoveTimestamp = useRef(0);
  const timerRef = useRef(null);
  const timeRef = useRef(0);
  const winTimeoutRef = useRef(null);
  const moveTimeoutRef = useRef(null);
  const howToPlayTriggerRef = useRef(null);
  const [historyStack, setHistoryStack] = useState([]);
  const [moveCount, setMoveCount] = useState(0);
  const [solvedLevels, setSolvedLevels] = useState({});
  const [animatingMove, setAnimatingMove] = useState(null);
  const boardRef = useRef(null);
  const HINTS_PER_GAME = 3;
  const [hintsRemaining, setHintsRemaining] = useState(HINTS_PER_GAME);
  const [hintHighlight, setHintHighlight] = useState(null);
  const hintTimeoutRef = useRef(null);
  const [hoveredTarget, setHoveredTarget] = useState(null);
  const [bestMoves, setBestMoves] = useState({});
  const [isPaused, setIsPaused] = useState(false);
  const [moveLog, setMoveLog] = useState([]);
  const [fatalMove, setFatalMove] = useState(null);
  const [solverMessage, setSolverMessage] = useState("");
  const [isReplaying, setIsReplaying] = useState(false);
  const initialBoardRef = useRef([]);
  const replayTimersRef = useRef([]);
  useEffect(() => {
    const saved = safeGetItem("pegJumperHighScores");
    if (saved) {
      try {
        setHighScores(JSON.parse(saved));
      } catch (e) {
        console.warn("Could not parse high scores:", e);
      }
    }
    const savedSolved = safeGetItem("pegJumperSolvedLevels");
    if (savedSolved) {
      try {
        setSolvedLevels(JSON.parse(savedSolved));
      } catch (e) {
        console.warn("Could not parse solved levels:", e);
      }
    }
    const savedBestMoves = safeGetItem("pegJumperBestMoves");
    if (savedBestMoves) {
      try {
        setBestMoves(JSON.parse(savedBestMoves));
      } catch (e) {
        console.warn("Could not parse best moves:", e);
      }
    }
  }, []);
  const getValidTargets = useCallback((currentBoard, selected, levelIndex) => {
    const targets = /* @__PURE__ */ new Set();
    if (!selected || !currentBoard.length) return targets;
    for (const move of findMoves(currentBoard, levelIndex, selected.row, selected.col)) {
      targets.add(`${move.to.row},${move.to.col}`);
    }
    return targets;
  }, []);
  const validTargets = selectedPeg ? getValidTargets(board, selectedPeg, currentLevelIndex) : /* @__PURE__ */ new Set();
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTime((prevTime) => {
          const newTime = prevTime + 1;
          timeRef.current = newTime;
          return newTime;
        });
      }, 1e3);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isTimerRunning]);
  useEffect(() => {
    return () => {
      if (winTimeoutRef.current) {
        clearTimeout(winTimeoutRef.current);
        winTimeoutRef.current = null;
      }
    };
  }, []);
  const initializeBoard = useCallback((levelIndex) => {
    if (moveTimeoutRef.current) {
      clearTimeout(moveTimeoutRef.current);
      moveTimeoutRef.current = null;
    }
    if (winTimeoutRef.current) {
      clearTimeout(winTimeoutRef.current);
      winTimeoutRef.current = null;
    }
    const level = LEVELS[levelIndex];
    let pegCount = 0;
    const newBoard = level.layout.map(
      (row2) => row2.map((cell) => {
        if (cell === 1) {
          pegCount++;
          return true;
        }
        return null;
      })
    );
    const { row, col } = level.initialEmpty;
    if (newBoard[row] && newBoard[row][col] === true) {
      newBoard[row][col] = false;
      pegCount--;
    }
    initialBoardRef.current = newBoard.map((r) => [...r]);
    setBoard(newBoard);
    setInitialPegCount(pegCount);
    setPegsRemaining(pegCount);
    setGameState(GameState.PLAYING);
    setSelectedPeg(null);
    setShowWin(false);
    setCurrentLevelIndex(levelIndex);
    setScore(0);
    setTime(0);
    timeRef.current = 0;
    setIsTimerRunning(false);
    lastMoveTimestamp.current = 0;
    setHistoryStack([]);
    setMoveCount(0);
    setAnimatingMove(null);
    setMoveLog([]);
    setFatalMove(null);
    setSolverMessage("");
    setIsReplaying(false);
    replayTimersRef.current.forEach(clearTimeout);
    replayTimersRef.current = [];
    setHintsRemaining(HINTS_PER_GAME);
    setHintHighlight(null);
    setIsPaused(false);
    if (hintTimeoutRef.current) {
      clearTimeout(hintTimeoutRef.current);
      hintTimeoutRef.current = null;
    }
  }, []);
  useEffect(() => {
    initializeBoard(0);
  }, [initializeBoard]);
  const checkForNoMoves = useCallback((currentBoard, levelIndex) => {
    return findMoves(currentBoard, levelIndex).length === 0;
  }, []);
  const applyMove = useCallback((newBoard, start, end, jumpedRow, jumpedCol, isRapidMove) => {
    const newPegsRemaining = pegsRemaining - 1;
    setPegsRemaining(newPegsRemaining);
    setBoard(newBoard);
    setSelectedPeg(null);
    setMoveCount((mc) => mc + 1);
    setAnimatingMove(null);
    setMoveLog((log) => [...log, {
      from: start,
      to: end,
      jumped: { row: jumpedRow, col: jumpedCol },
      boardAfter: newBoard.map((r) => [...r])
    }]);
    if (newPegsRemaining === 1) {
      setGameState(GameState.WON);
      setIsTimerRunning(false);
      setShowWin(true);
      winTimeoutRef.current = setTimeout(() => {
        setShowWin(false);
        winTimeoutRef.current = null;
      }, 4e3);
      const rapidBonus = isRapidMove ? RAPID_MOVE_BONUS : 0;
      const currentScore = score + rapidBonus;
      const finalScore = Math.max(0, currentScore + initialPegCount * 100 - timeRef.current * 10);
      setScore(finalScore);
      if (finalScore > (highScores[currentLevelIndex] || 0)) {
        const newHighScores = { ...highScores, [currentLevelIndex]: finalScore };
        setHighScores(newHighScores);
        safeSetItem("pegJumperHighScores", JSON.stringify(newHighScores));
      }
      const newSolved = { ...solvedLevels, [currentLevelIndex]: true };
      setSolvedLevels(newSolved);
      safeSetItem("pegJumperSolvedLevels", JSON.stringify(newSolved));
      const finalMoveCount = moveCount + 1;
      const currentBest = bestMoves[currentLevelIndex];
      if (!currentBest || finalMoveCount < currentBest) {
        const newBestMoves = { ...bestMoves, [currentLevelIndex]: finalMoveCount };
        setBestMoves(newBestMoves);
        safeSetItem("pegJumperBestMoves", JSON.stringify(newBestMoves));
      }
    } else {
      if (isRapidMove) {
        setScore((s) => s + RAPID_MOVE_BONUS);
      }
      if (checkForNoMoves(newBoard, currentLevelIndex)) {
        setGameState(GameState.LOST);
        setIsTimerRunning(false);
        if (newPegsRemaining >= 2 && newPegsRemaining <= 3) {
          setShowWin(true);
          winTimeoutRef.current = setTimeout(() => {
            setShowWin(false);
            winTimeoutRef.current = null;
          }, 3e3);
        }
      }
    }
  }, [pegsRemaining, score, highScores, currentLevelIndex, initialPegCount, checkForNoMoves, solvedLevels, bestMoves, moveCount]);
  const handleCellClick = useCallback((row, col) => {
    if (gameState !== GameState.PLAYING || animatingMove || isPaused) return;
    const cell = board[row][col];
    if (cell === true) {
      setSelectedPeg((prev) => prev && prev.row === row && prev.col === col ? null : { row, col });
      setHoveredTarget(null);
    } else if (cell === false) {
      if (selectedPeg) {
        const start = selectedPeg;
        const end = { row, col };
        const move = findMoves(board, currentLevelIndex, start.row, start.col).find((m) => m.to.row === end.row && m.to.col === end.col);
        if (move) {
          const jumpedRow = move.jumped.row;
          const jumpedCol = move.jumped.col;
          if (!isTimerRunning) setIsTimerRunning(true);
          setHintHighlight(null);
          if (hintTimeoutRef.current) {
            clearTimeout(hintTimeoutRef.current);
            hintTimeoutRef.current = null;
          }
          setHistoryStack((prev) => [...prev, {
            board: board.map((r) => [...r]),
            pegsRemaining,
            score,
            moveCount,
            time: timeRef.current
          }]);
          const now = Date.now();
          const isRapidMove = lastMoveTimestamp.current > 0 && now - lastMoveTimestamp.current < RAPID_MOVE_THRESHOLD_MS;
          lastMoveTimestamp.current = now;
          const newBoard = board.map((r) => [...r]);
          newBoard[start.row][start.col] = false;
          newBoard[end.row][end.col] = true;
          newBoard[jumpedRow][jumpedCol] = false;
          setAnimatingMove({ from: start, to: end, jumped: { row: jumpedRow, col: jumpedCol } });
          setSelectedPeg(null);
          moveTimeoutRef.current = setTimeout(() => {
            moveTimeoutRef.current = null;
            applyMove(newBoard, start, end, jumpedRow, jumpedCol, isRapidMove);
          }, 370);
        }
      }
    }
  }, [board, selectedPeg, gameState, pegsRemaining, isTimerRunning, score, highScores, currentLevelIndex, initialPegCount, checkForNoMoves, animatingMove, moveCount, applyMove, isPaused]);
  const handleUndo = useCallback(() => {
    if (historyStack.length === 0 || animatingMove) return;
    const prevState = historyStack[historyStack.length - 1];
    setHistoryStack((prev) => prev.slice(0, -1));
    setBoard(prevState.board);
    setPegsRemaining(prevState.pegsRemaining);
    setScore(prevState.score);
    setMoveCount(prevState.moveCount);
    setMoveLog((prev) => prev.slice(0, -1));
    setFatalMove(null);
    setSolverMessage("");
    setTime(prevState.time);
    timeRef.current = prevState.time;
    setSelectedPeg(null);
    setGameState(GameState.PLAYING);
    setShowWin(false);
    if (winTimeoutRef.current) {
      clearTimeout(winTimeoutRef.current);
      winTimeoutRef.current = null;
    }
    if (historyStack.length === 1) {
      setIsTimerRunning(false);
      lastMoveTimestamp.current = 0;
    }
  }, [historyStack, animatingMove]);
  const handlePause = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;
    setIsPaused(true);
    setIsTimerRunning(false);
  }, [gameState]);
  const handleResume = useCallback(() => {
    setIsPaused(false);
    if (historyStack.length > 0 && gameState === GameState.PLAYING) {
      setIsTimerRunning(true);
    }
  }, [historyStack, gameState]);
  const handleHint = useCallback(() => {
    if (hintsRemaining <= 0 || gameState !== GameState.PLAYING || animatingMove || isPaused) return;
    if (hintTimeoutRef.current) {
      clearTimeout(hintTimeoutRef.current);
    }
    const candidates = findMoves(board, currentLevelIndex).map((move2) => {
      const next = boardAfterJump(board, move2);
      const analysis = analyzeSolvability(next, currentLevelIndex, 45e3);
      return { move: move2, analysis, mobility: findMoves(next, currentLevelIndex).length };
    });
    const choice = candidates.find((candidate) => candidate.analysis.result === true) || candidates.filter((candidate) => candidate.analysis.result !== false).sort((a, b) => b.mobility - a.mobility)[0] || candidates.sort((a, b) => b.mobility - a.mobility)[0];
    const move = choice && choice.move;
    if (!move) return;
    setHintsRemaining((h) => h - 1);
    setHintHighlight({ source: move.from, target: move.to });
    setSolverMessage(choice.analysis.result === true ? `Solver checked ${choice.analysis.nodes.toLocaleString()} positions and found a route to one peg through this jump.` : `Solver rejected proven dead ends and chose the safest high-mobility branch after checking ${choice.analysis.nodes.toLocaleString()} positions.`);
    hintTimeoutRef.current = setTimeout(() => {
      setHintHighlight(null);
      hintTimeoutRef.current = null;
    }, 1800);
  }, [hintsRemaining, gameState, animatingMove, board, currentLevelIndex, isPaused]);
  useEffect(() => {
    if (gameState !== GameState.LOST || !moveLog.length) return;
    let firstFatal = null;
    for (let i = 0; i < moveLog.length; i++) {
      const analysis = analyzeSolvability(moveLog[i].boardAfter, currentLevelIndex, 35e3);
      if (analysis.result === false) {
        firstFatal = i;
        break;
      }
    }
    setFatalMove(firstFatal);
  }, [gameState, moveLog, currentLevelIndex]);
  const replayMoveTree = useCallback(() => {
    if (!moveLog.length || isReplaying) return;
    const finalBoard = board.map((r) => [...r]);
    const frames = [initialBoardRef.current, ...moveLog.map((entry) => entry.boardAfter)];
    setIsReplaying(true);
    setSelectedPeg(null);
    frames.forEach((frame, index) => {
      replayTimersRef.current.push(setTimeout(() => {
        setBoard(frame.map((r) => [...r]));
        setSolverMessage(index === 0 ? "Replay: starting position" : `Replay branch ${index}/${moveLog.length}${fatalMove === index - 1 ? " — first proven fatal branch" : ""}`);
        if (index === frames.length - 1) {
          replayTimersRef.current.push(setTimeout(() => {
            setBoard(finalBoard);
            setIsReplaying(false);
          }, 650));
        }
      }, index * 650));
    });
  }, [moveLog, board, fatalMove, isReplaying]);
  const handleCellKeyDown = useCallback((e, row, col) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCellClick(row, col);
    }
  }, [handleCellClick]);
  const getGameStatusMessage = () => {
    switch (gameState) {
      case GameState.PLAYING:
        return `Pegs: ${pegsRemaining}`;
      case GameState.WON:
        return "You Win!";
      case GameState.LOST:
        return "No more moves!";
      default:
        return "";
    }
  };
  const getGameStatusAria = () => {
    switch (gameState) {
      case GameState.PLAYING:
        return `Playing. ${pegsRemaining} of ${initialPegCount} pegs remaining. ${moveCount} moves made.`;
      case GameState.WON:
        return `Congratulations! You won with a score of ${score} in ${moveCount} moves!`;
      case GameState.LOST:
        return `Game over. No more moves available. ${pegsRemaining} pegs remaining after ${moveCount} moves.`;
      default:
        return "";
    }
  };
  const getCellPosition = useCallback((row, col) => {
    if (!boardRef.current) return { x: 0, y: 0 };
    const boardEl = boardRef.current;
    const rows = boardEl.querySelectorAll('[role="row"]');
    if (!rows[row]) return { x: 0, y: 0 };
    const cells = rows[row].querySelectorAll('[role="gridcell"]');
    if (!cells[col]) return { x: 0, y: 0 };
    const cellRect = cells[col].getBoundingClientRect();
    const boardRect = boardEl.getBoundingClientRect();
    return {
      x: cellRect.left - boardRect.left + cellRect.width / 2,
      y: cellRect.top - boardRect.top + cellRect.height / 2,
      diameter: cells[col].querySelector(".peg-object")?.getBoundingClientRect().width || Math.min(96, cellRect.width * 0.82)
    };
  }, []);
  return /* @__PURE__ */ React.createElement("div", { className: "mini-shell min-h-screen w-full bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white relative overflow-hidden flex flex-col items-center justify-center p-4 pt-16 sm:pt-4" }, /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("div", { className: "absolute top-20 left-20 w-32 h-32 bg-purple-500 rounded-full blur-3xl opacity-20 animate-pulse" }), /* @__PURE__ */ React.createElement("div", { className: "absolute top-40 right-32 w-24 h-24 bg-cyan-500 rounded-full blur-2xl opacity-30 animate-pulse" })), /* @__PURE__ */ React.createElement("main", { className: "mini-layout relative z-10 flex flex-col items-center w-full max-w-2xl", role: "main" }, /* @__PURE__ */ React.createElement("aside", { className: "mini-controls" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center gap-3 mb-2" }, /* @__PURE__ */ React.createElement("h1", { className: "text-4xl sm:text-5xl font-black text-center bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent" }, "Peg Jumper"), /* @__PURE__ */ React.createElement(
    "button",
    {
      ref: howToPlayTriggerRef,
      onClick: () => setShowHowToPlay(true),
      className: "min-w-[44px] min-h-[44px] rounded-full border border-purple-500/50 bg-purple-500/10 text-purple-300 hover:bg-purple-500/30 hover:text-white transition-all flex items-center justify-center text-lg flex-shrink-0",
      "aria-label": "How to Play",
      title: "How to Play"
    },
    "❓"
  )), /* @__PURE__ */ React.createElement(HowToPlayModal, { isOpen: showHowToPlay, onClose: () => setShowHowToPlay(false), triggerRef: howToPlayTriggerRef }), /* @__PURE__ */ React.createElement("details", { className: "mini-settings", open: window.matchMedia("(min-width: 701px) and (orientation: landscape)").matches }, /* @__PURE__ */ React.createElement("summary", null, "Choose a board"), /* @__PURE__ */ React.createElement("nav", { "aria-label": "Level selection", className: "flex flex-wrap justify-center gap-2 mb-4" }, LEVELS.map((level, index) => {
    const difficulty = getLevelDifficulty(level);
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: level.name,
        onClick: () => initializeBoard(index),
        "aria-pressed": currentLevelIndex === index,
        "aria-label": `${level.name} - ${difficulty.label} difficulty`,
        className: `px-4 py-2 text-sm font-bold rounded-lg transition-all transform hover:scale-105 min-h-[44px] relative ${currentLevelIndex === index ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/50" : "bg-gray-700 text-gray-300 hover:bg-gray-600"} ${solvedLevels[index] ? "solved-level-btn" : ""}`
      },
      solvedLevels[index] && /* @__PURE__ */ React.createElement("span", { className: "absolute -top-1.5 -right-1.5 text-yellow-400 text-sm", "aria-label": "Solved" }, "★"),
      /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1.5" }, level.name, /* @__PURE__ */ React.createElement("span", { className: `inline-block w-2 h-2 rounded-full ${difficulty.dotColor} flex-shrink-0`, title: difficulty.label, "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("span", { className: `text-xs font-semibold ${difficulty.color}` }, difficulty.label))
    );
  }))), /* @__PURE__ */ React.createElement("div", { className: "w-full bg-black/20 p-3 rounded-lg mb-4", "aria-label": "Game statistics" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center text-lg" }, /* @__PURE__ */ React.createElement("div", { className: "text-left" }, /* @__PURE__ */ React.createElement("div", null, "Score: ", /* @__PURE__ */ React.createElement("span", { className: "font-bold text-cyan-400", "aria-label": `Score: ${score}` }, score)), /* @__PURE__ */ React.createElement("div", null, "High Score: ", /* @__PURE__ */ React.createElement("span", { className: "font-bold text-yellow-400", "aria-label": `High score: ${highScores[currentLevelIndex] || 0}` }, highScores[currentLevelIndex] || 0))), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "text-center text-2xl font-semibold text-white",
      role: "status",
      "aria-live": "polite",
      "aria-label": getGameStatusAria()
    },
    getGameStatusMessage()
  ), /* @__PURE__ */ React.createElement("div", { className: "text-right" }, "Time: ", /* @__PURE__ */ React.createElement("span", { className: "font-bold text-pink-400", "aria-label": `Time: ${Math.floor(time / 60)} minutes ${time % 60} seconds` }, new Date(time * 1e3).toISOString().substring(14, 19)))), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center mt-2 pt-2 border-t border-white/10 text-sm text-purple-200" }, /* @__PURE__ */ React.createElement("div", null, "Moves: ", /* @__PURE__ */ React.createElement("span", { className: "font-bold text-white" }, moveCount)), /* @__PURE__ */ React.createElement("div", null, "Pegs: ", /* @__PURE__ */ React.createElement("span", { className: "font-bold text-white" }, pegsRemaining), " / ", /* @__PURE__ */ React.createElement("span", { className: "text-purple-300" }, initialPegCount)), /* @__PURE__ */ React.createElement("div", { className: "text-purple-400" }, bestMoves[currentLevelIndex] ? /* @__PURE__ */ React.createElement(React.Fragment, null, "Best: ", /* @__PURE__ */ React.createElement("span", { className: "font-bold text-green-400" }, bestMoves[currentLevelIndex], " moves")) : /* @__PURE__ */ React.createElement(React.Fragment, null, "Best possible: ", /* @__PURE__ */ React.createElement("span", { className: "font-bold text-green-400" }, "1 peg")))))), /* @__PURE__ */ React.createElement(
    "div",
    {
      ref: boardRef,
      style: { "--peg-cols": LEVELS[currentLevelIndex].layout[0].length, "--peg-rows": LEVELS[currentLevelIndex].layout.length, "--peg-row-scale": LEVELS[currentLevelIndex].layout[0].length === 9 ? Math.sqrt(3) : 1 },
      className: "mini-board bg-black/40 backdrop-blur-sm rounded-2xl p-2 sm:p-4 border border-cyan-400/30 shadow-2xl min-h-[320px] flex flex-col justify-center items-center relative",
      role: "grid",
      "aria-label": `${LEVELS[currentLevelIndex].name} game board`
    },
    board.map((row, rowIndex) => /* @__PURE__ */ React.createElement("div", { key: rowIndex, className: "flex justify-center", role: "row" }, row.map((cell, colIndex) => {
      if (cell === null) return /* @__PURE__ */ React.createElement("div", { key: colIndex, className: "min-w-[38px] min-h-[38px] sm:min-w-[44px] sm:min-h-[44px]", role: "gridcell", "aria-hidden": "true" });
      const isSelected = selectedPeg && selectedPeg.row === rowIndex && selectedPeg.col === colIndex;
      const isValidTarget = cell === false && validTargets.has(`${rowIndex},${colIndex}`);
      let animClass = "";
      if (animatingMove) {
        if (animatingMove.jumped.row === rowIndex && animatingMove.jumped.col === colIndex) {
          animClass = "peg-shrink-fade";
        }
      }
      const isAnimFrom = animatingMove && animatingMove.from.row === rowIndex && animatingMove.from.col === colIndex;
      const isAnimTo = animatingMove && animatingMove.to.row === rowIndex && animatingMove.to.col === colIndex;
      const isHintSource = hintHighlight && hintHighlight.source.row === rowIndex && hintHighlight.source.col === colIndex;
      const isHintTarget = hintHighlight && hintHighlight.target.row === rowIndex && hintHighlight.target.col === colIndex;
      return /* @__PURE__ */ React.createElement("div", { key: colIndex, role: "gridcell", className: isHintSource ? "hint-source-pulse" : isHintTarget ? "hint-target-pulse" : "" }, cell ? /* @__PURE__ */ React.createElement(
        Peg,
        {
          isSelected,
          onClick: () => handleCellClick(rowIndex, colIndex),
          onKeyDown: (e) => handleCellKeyDown(e, rowIndex, colIndex),
          rowIndex,
          colIndex,
          animClass,
          hidden: isAnimFrom
        }
      ) : /* @__PURE__ */ React.createElement(
        Hole,
        {
          onClick: () => handleCellClick(rowIndex, colIndex),
          onKeyDown: (e) => handleCellKeyDown(e, rowIndex, colIndex),
          rowIndex,
          colIndex,
          isValidTarget,
          onMouseEnter: () => window.matchMedia("(hover: hover)").matches && isValidTarget ? setHoveredTarget({ row: rowIndex, col: colIndex }) : null,
          onMouseLeave: () => setHoveredTarget(null)
        }
      ));
    }))),
    animatingMove && /* @__PURE__ */ React.createElement(FlyingPeg, { from: animatingMove.from, to: animatingMove.to, getCellPosition }),
    isPaused && /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 z-40 bg-gray-900/95 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "text-5xl", "aria-hidden": "true" }, "⏸"), /* @__PURE__ */ React.createElement("div", { className: "text-2xl font-black text-white" }, "PAUSED"), /* @__PURE__ */ React.createElement("div", { className: "text-purple-300 text-sm" }, "Game board hidden"), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleResume,
        className: "mt-2 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 rounded-lg font-bold text-lg text-white transition-all transform hover:scale-105 min-h-[44px]"
      },
      "▶ Resume"
    )),
    selectedPeg && hoveredTarget && validTargets.has(`${hoveredTarget.row},${hoveredTarget.col}`) && (() => {
      const dr = hoveredTarget.row - selectedPeg.row;
      const dc = hoveredTarget.col - selectedPeg.col;
      const jumpedRow = selectedPeg.row + dr / 2;
      const jumpedCol = selectedPeg.col + dc / 2;
      return /* @__PURE__ */ React.createElement(GhostTrail, { from: selectedPeg, to: hoveredTarget, jumped: { row: jumpedRow, col: jumpedCol }, getCellPosition });
    })(),
    IS_TOUCH_PRIMARY && selectedPeg && !hoveredTarget && !isPaused && Array.from(validTargets).map((key) => {
      const [tRow, tCol] = key.split(",").map(Number);
      const jumpedRow = selectedPeg.row + (tRow - selectedPeg.row) / 2;
      const jumpedCol = selectedPeg.col + (tCol - selectedPeg.col) / 2;
      return /* @__PURE__ */ React.createElement(GhostTrail, { key, faint: true, from: selectedPeg, to: { row: tRow, col: tCol }, jumped: { row: jumpedRow, col: jumpedCol }, getCellPosition });
    })
  ), /* @__PURE__ */ React.createElement("div", { className: "mini-bottom" }, solverMessage && /* @__PURE__ */ React.createElement("div", { className: "mt-3 w-full p-3 rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-sm text-cyan-100", role: "status" }, solverMessage), gameState !== GameState.PLAYING && moveLog.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "mt-3 w-full p-3 rounded-xl bg-black/40 border border-purple-400/30 text-center" }, /* @__PURE__ */ React.createElement("div", { className: "font-bold text-purple-200 mb-2" }, "Move Tree (", moveLog.length, " branches)"), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-300 mb-2 max-h-20 overflow-auto" }, moveLog.map((m, i) => /* @__PURE__ */ React.createElement("span", { key: i, className: fatalMove === i ? "text-red-300 font-bold" : "" }, i + 1, ": (", m.from.row + 1, ",", m.from.col + 1, ")→(", m.to.row + 1, ",", m.to.col + 1, ")", fatalMove === i ? " ⚠ first fatal move" : "", i < moveLog.length - 1 ? " · " : ""))), fatalMove !== null && /* @__PURE__ */ React.createElement("p", { className: "text-sm text-red-200 mb-2" }, "Move ", fatalMove + 1, " was the first point where the solver proved a one-peg finish was no longer possible."), /* @__PURE__ */ React.createElement("button", { onClick: replayMoveTree, disabled: isReplaying, className: "px-4 py-2 rounded-lg bg-indigo-600 font-bold disabled:opacity-40" }, isReplaying ? "Replaying…" : "▶ Replay Move Tree")), /* @__PURE__ */ React.createElement("div", { className: "mt-6 flex flex-wrap gap-3 justify-center" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: isPaused ? handleResume : handlePause,
      disabled: gameState !== GameState.PLAYING && !isPaused,
      className: `px-5 py-3 rounded-lg font-bold text-lg transition-all transform hover:scale-105 min-h-[44px] ${gameState !== GameState.PLAYING && !isPaused ? "bg-gray-700 text-gray-500 cursor-not-allowed" : isPaused ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white" : "bg-gradient-to-r from-slate-500 to-gray-600 hover:from-slate-400 hover:to-gray-500 text-white"}`,
      "aria-label": isPaused ? "Resume game" : "Pause game"
    },
    isPaused ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, "▶"), " Resume") : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, "❚❚"), " Pause")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleHint,
      disabled: hintsRemaining <= 0 || gameState !== GameState.PLAYING || !!animatingMove || isPaused,
      className: `px-5 py-3 rounded-lg font-bold text-lg transition-all transform hover:scale-105 min-h-[44px] ${hintsRemaining <= 0 || gameState !== GameState.PLAYING || animatingMove || isPaused ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-white"}`,
      "aria-label": `Get hint. ${hintsRemaining} hints remaining`
    },
    "💡 Hint (",
    hintsRemaining,
    ")"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleUndo,
      disabled: historyStack.length === 0 || !!animatingMove,
      className: `px-6 py-3 rounded-lg font-bold text-lg transition-all transform hover:scale-105 min-h-[44px] ${historyStack.length === 0 || animatingMove ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white"}`,
      "aria-label": `Undo last move${historyStack.length > 0 ? ` (${historyStack.length} moves to undo)` : ""}`
    },
    "↶ Undo"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => initializeBoard(currentLevelIndex),
      className: "px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-bold text-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 min-h-[44px]",
      "aria-label": `Reset ${LEVELS[currentLevelIndex].name} level`
    },
    "Reset Level"
  )))), /* @__PURE__ */ React.createElement(Celebration, { show: showWin, pegsRemaining }));
};
const container = document.getElementById("root");
const root = ReactDOM.createRoot(container);
root.render(/* @__PURE__ */ React.createElement(PegJumperGame, null));
