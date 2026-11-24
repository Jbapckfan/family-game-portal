// Generated from LightsOut.jsx by tools/build-react-games.mjs; do not edit.
"use strict";
const getLightColorOn = () => {
  const style = getComputedStyle(document.documentElement);
  const rgb = style.getPropertyValue("--lo-primary").trim();
  return `rgb(${rgb})`;
};
const getLightGlowOn = () => getLightColorOn();
const LIGHT_COLOR_OFF = "transparent";
const DIFFICULTY_OPTIONS = [
  { size: 3, label: "Beginner", sublabel: "3x3" },
  { size: 5, label: "Standard", sublabel: "5x5" },
  { size: 7, label: "Expert", sublabel: "7x7" }
];
const HINTS_PER_GAME = 3;
const LIGHTS_CAMPAIGN = [
  { name: "Little Cross", size: 3, clicks: [[1, 1]] },
  { name: "Four Corners", size: 3, clicks: [[0, 0], [0, 2], [2, 0], [2, 2]] },
  { name: "Lightning Bolt", size: 5, clicks: [[0, 1], [1, 2], [2, 2], [3, 3], [4, 3]] },
  { name: "Space Invader", size: 5, clicks: [[0, 0], [0, 4], [1, 1], [1, 3], [2, 2], [3, 0], [3, 4]] },
  { name: "Twin Spirals", size: 5, clicks: [[0, 0], [0, 4], [1, 0], [1, 3], [2, 1], [2, 3], [3, 1], [4, 0], [4, 4]] },
  { name: "Neon Crown", size: 7, clicks: [[0, 0], [0, 3], [0, 6], [1, 1], [1, 5], [2, 2], [2, 4], [3, 3], [5, 1], [5, 5], [6, 3]] }
];
const campaignBoard = (stage) => stage.clicks.reduce((b, [r, c]) => toggleLights(b, r, c, stage.size), Array.from({ length: stage.size }, () => Array(stage.size).fill(false)));
const CAN_HOVER = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const THEMES = [
  { id: "cyan", label: "Neon Cyan", color: "#22d3ee" },
  { id: "green", label: "Matrix Green", color: "#4ade80" },
  { id: "amber", label: "Warm Amber", color: "#fbbf24" },
  { id: "purple", label: "Purple Haze", color: "#c084fc" }
];
const STORAGE_KEY_THEME = "lightsout_theme";
const loadTheme = () => {
  try {
    return localStorage.getItem(STORAGE_KEY_THEME) || "cyan";
  } catch {
    return "cyan";
  }
};
const saveTheme = (themeId) => {
  try {
    localStorage.setItem(STORAGE_KEY_THEME, themeId);
  } catch {
  }
};
const applyTheme = (themeId) => {
  if (themeId === "cyan") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", themeId);
  }
};
applyTheme(loadTheme());
const TIME_LIMITS = {
  3: 30,
  5: 60,
  7: 120,
  9: 180,
  11: 240
};
const getTimeLimit = (size) => TIME_LIMITS[size] || Math.max(60, size * size * 2);
const BONUS_POINTS_PER_SECOND = 10;
const MAX_BOARD_GEN_ITERATIONS = 1e3;
const generateBoard = (gridSize) => {
  let board;
  let iterations = 0;
  do {
    board = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));
    const clicks = Math.floor(Math.random() * Math.min(8, gridSize * gridSize - 4)) + 5;
    const usedPositions = /* @__PURE__ */ new Set();
    for (let i = 0; i < clicks; i++) {
      let r, c, key;
      do {
        r = Math.floor(Math.random() * gridSize);
        c = Math.floor(Math.random() * gridSize);
        key = r + "," + c;
      } while (usedPositions.has(key));
      usedPositions.add(key);
      board = toggleLights(board, r, c, gridSize);
    }
    iterations++;
  } while (checkWinCondition(board) && iterations < MAX_BOARD_GEN_ITERATIONS);
  return board;
};
const toggleLights = (board, r, c, gridSize) => {
  const size = gridSize || board.length;
  const newBoard = board.map((row) => [...row]);
  const positions = [[r, c], [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];
  positions.forEach(([row, col]) => {
    if (row >= 0 && row < size && col >= 0 && col < size) {
      newBoard[row][col] = !newBoard[row][col];
    }
  });
  return newBoard;
};
const checkWinCondition = (board) => {
  return board.every((row) => row.every((light) => !light));
};
const solveLightsOut = (board) => {
  const n = board.length;
  const N = n * n;
  const A = [];
  for (let i = 0; i < N; i++) {
    A.push(new Uint8Array(N + 1));
  }
  for (let j = 0; j < N; j++) {
    const jr = Math.floor(j / n);
    const jc = j % n;
    const affected = [[jr, jc], [jr - 1, jc], [jr + 1, jc], [jr, jc - 1], [jr, jc + 1]];
    for (const [ar, ac] of affected) {
      if (ar >= 0 && ar < n && ac >= 0 && ac < n) {
        const i = ar * n + ac;
        A[i][j] = 1;
      }
    }
  }
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      A[r * n + c][N] = board[r][c] ? 1 : 0;
    }
  }
  const pivotRow = new Array(N).fill(-1);
  let col = 0;
  for (let row = 0; row < N && col < N; col++) {
    let pivotR = -1;
    for (let r = row; r < N; r++) {
      if (A[r][col] === 1) {
        pivotR = r;
        break;
      }
    }
    if (pivotR === -1) continue;
    if (pivotR !== row) {
      const temp = A[row];
      A[row] = A[pivotR];
      A[pivotR] = temp;
    }
    pivotRow[col] = row;
    for (let r = 0; r < N; r++) {
      if (r !== row && A[r][col] === 1) {
        for (let k = 0; k <= N; k++) {
          A[r][k] ^= A[row][k];
        }
      }
    }
    row++;
  }
  const freeCols = [];
  for (let c = 0; c < N; c++) if (pivotRow[c] === -1) freeCols.push(c);
  let solution = null;
  let solutionSize = Infinity;
  for (let mask = 0; mask < 1 << freeCols.length; mask++) {
    const candidate = new Uint8Array(N);
    freeCols.forEach((f, i) => {
      candidate[f] = mask >> i & 1;
    });
    for (let c = 0; c < N; c++) {
      if (pivotRow[c] !== -1) {
        let v = A[pivotRow[c]][N];
        for (const f of freeCols) v ^= A[pivotRow[c]][f] & candidate[f];
        candidate[c] = v;
      }
    }
    const size = candidate.reduce((sum, v) => sum + v, 0);
    if (size < solutionSize) {
      solution = candidate;
      solutionSize = size;
    }
  }
  for (let i = 0; i < N; i++) {
    let sum = 0;
    for (let j = 0; j < N; j++) {
      const ir = Math.floor(i / n);
      const ic = i % n;
      const jr = Math.floor(j / n);
      const jc = j % n;
      const dist = Math.abs(ir - jr) + Math.abs(ic - jc);
      if (dist <= 1) {
        sum ^= solution[j];
      }
    }
    const target = board[Math.floor(i / n)][i % n] ? 1 : 0;
    if (sum !== target) {
      return null;
    }
  }
  const moves = [];
  for (let i = 0; i < N; i++) {
    if (solution[i] === 1) {
      moves.push({ row: Math.floor(i / n), col: i % n });
    }
  }
  return moves;
};
const STORAGE_KEY_BEST_MOVES = "lightsout_best_moves";
const STORAGE_KEY_BEST_STARS = "lightsout_best_stars";
const STORAGE_KEY_BEST_TIMED = "lightsout_best_timed";
const loadBestScores = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BEST_MOVES);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};
const saveBestScore = (gridSize, moves) => {
  const scores = loadBestScores();
  const key = String(gridSize);
  if (!scores[key] || moves < scores[key]) {
    scores[key] = moves;
    try {
      localStorage.setItem(STORAGE_KEY_BEST_MOVES, JSON.stringify(scores));
    } catch {
    }
  }
  return scores;
};
const loadBestStars = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BEST_STARS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};
const saveBestStars = (gridSize, stars) => {
  const allStars = loadBestStars();
  const key = String(gridSize);
  if (!allStars[key] || stars > allStars[key]) {
    allStars[key] = stars;
    try {
      localStorage.setItem(STORAGE_KEY_BEST_STARS, JSON.stringify(allStars));
    } catch {
    }
  }
  return allStars;
};
const loadBestTimed = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BEST_TIMED);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};
const saveBestTimed = (gridSize, score) => {
  const scores = loadBestTimed();
  const key = String(gridSize);
  if (!scores[key] || score > scores[key]) {
    scores[key] = score;
    try {
      localStorage.setItem(STORAGE_KEY_BEST_TIMED, JSON.stringify(scores));
    } catch {
    }
  }
  return scores;
};
const calculateStars = (playerMoves, minMoves) => {
  if (minMoves <= 0) return 3;
  if (playerMoves <= minMoves + 1) return 3;
  if (playerMoves <= minMoves + 3) return 2;
  return 1;
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
        className: "relative bg-gray-900 rounded-2xl p-6 max-w-sm w-full animate-fade-in",
        style: {
          border: `1px solid rgba(var(--lo-primary), 0.4)`,
          boxShadow: `0 25px 50px rgba(var(--lo-primary), 0.15)`
        },
        onClick: (e) => e.stopPropagation()
      },
      /* @__PURE__ */ React.createElement(
        "button",
        {
          ref: closeButtonRef,
          onClick: handleClose,
          className: "absolute top-2 right-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:text-white transition-colors text-2xl leading-none rounded-lg",
          style: { color: `rgba(var(--lo-primary), 0.8)` },
          "aria-label": "Close instructions"
        },
        "×"
      ),
      /* @__PURE__ */ React.createElement(
        "h2",
        {
          id: "how-to-play-title",
          className: "text-2xl font-bold bg-clip-text text-transparent mb-4",
          style: { backgroundImage: `linear-gradient(to right, var(--lo-gradient-from), var(--lo-gradient-to))` }
        },
        "How to Play"
      ),
      /* @__PURE__ */ React.createElement("ul", { className: "text-sm space-y-3 list-none", style: { color: `rgba(var(--lo-text-primary), 0.85)` } }, /* @__PURE__ */ React.createElement("li", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "mt-0.5", style: { color: `rgba(var(--lo-primary), 0.9)` }, "aria-hidden": "true" }, "▶"), /* @__PURE__ */ React.createElement("span", null, "Click any ", /* @__PURE__ */ React.createElement("strong", { style: { color: `rgba(var(--lo-primary), 0.9)` } }, "light"), " to toggle it and its ", /* @__PURE__ */ React.createElement("strong", { style: { color: `rgba(var(--lo-primary), 0.9)` } }, "4 adjacent neighbors"), " (up, down, left, right).")), /* @__PURE__ */ React.createElement("li", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "mt-0.5", style: { color: `rgba(var(--lo-primary), 0.9)` }, "aria-hidden": "true" }, "▶"), /* @__PURE__ */ React.createElement("span", null, "Your goal is to turn ", /* @__PURE__ */ React.createElement("strong", { className: "text-yellow-300" }, "ALL lights off"), " to win the game.")), /* @__PURE__ */ React.createElement("li", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "mt-0.5", style: { color: `rgba(var(--lo-primary), 0.9)` }, "aria-hidden": "true" }, "▶"), /* @__PURE__ */ React.createElement("span", null, "The ", /* @__PURE__ */ React.createElement("strong", { style: { color: `rgba(var(--lo-primary), 0.9)` } }, "fewer moves"), " you use, the better your score!")), /* @__PURE__ */ React.createElement("li", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "mt-0.5", style: { color: `rgba(var(--lo-primary), 0.9)` }, "aria-hidden": "true" }, "▶"), /* @__PURE__ */ React.createElement("span", null, "Use ", /* @__PURE__ */ React.createElement("strong", { style: { color: `rgba(var(--lo-primary), 0.9)` } }, "Undo"), " to take back your last move, or ", /* @__PURE__ */ React.createElement("strong", { className: "text-yellow-300" }, "Hint"), " (3 per game) for help."))),
      /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: handleClose,
          className: "mt-5 w-full py-2 min-h-[44px] rounded-lg font-bold text-black transition-all",
          style: { backgroundImage: `linear-gradient(to right, var(--lo-gradient-from), var(--lo-gradient-to))` }
        },
        "Got it!"
      )
    )
  );
};
const ThemeSwitcher = ({ currentTheme, onThemeChange, totalStars = 0 }) => {
  return /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center gap-2 mb-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs", style: { color: `rgba(var(--lo-text-primary), 0.6)` } }, "Theme:"), THEMES.map((t, index) => {
    const needed = index * 4;
    const locked = totalStars < needed;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: t.id,
        onClick: () => onThemeChange(t.id),
        disabled: locked,
        className: `theme-dot w-6 h-6 rounded-full border-2 ${currentTheme === t.id ? "active border-white/80" : "border-white/20 hover:border-white/50"}`,
        style: { backgroundColor: t.color, opacity: locked ? 0.25 : 1 },
        "aria-label": `${t.label} theme${locked ? `, locked until ${needed} stars` : currentTheme === t.id ? " (active)" : ""}`,
        title: locked ? `${needed} stars to unlock` : t.label
      }
    );
  }));
};
const DifficultySelector = ({ gridSize, onChange, customSize, onCustomSizeChange }) => {
  const isCustomActive = !DIFFICULTY_OPTIONS.some((opt) => opt.size === gridSize);
  const [customInput, setCustomInput] = React.useState(customSize || "");
  const [customError, setCustomError] = React.useState("");
  const handleCustomSubmit = () => {
    const val = parseInt(customInput, 10);
    if (isNaN(val) || val < 3 || val > 11) {
      setCustomError("3-11 only");
      return;
    }
    if (val % 2 === 0) {
      setCustomError("Must be odd");
      return;
    }
    setCustomError("");
    onCustomSizeChange(val);
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleCustomSubmit();
  };
  return /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center gap-2 mb-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 justify-center flex-wrap", role: "radiogroup", "aria-label": "Difficulty" }, DIFFICULTY_OPTIONS.map((opt) => {
    const isActive = opt.size === gridSize;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: opt.size,
        role: "radio",
        "aria-checked": isActive,
        onClick: () => {
          setCustomError("");
          onChange(opt.size);
        },
        className: `px-3 py-1.5 min-h-[44px] rounded-lg text-xs font-bold transition-all border`,
        style: {
          backgroundColor: isActive ? `rgba(var(--lo-primary), 0.2)` : "rgba(0,0,0,0.4)",
          borderColor: isActive ? `rgba(var(--lo-primary), 0.8)` : `rgba(var(--lo-primary), 0.15)`,
          color: isActive ? `rgba(var(--lo-text-primary), 0.9)` : `rgba(var(--lo-primary), 0.5)`,
          boxShadow: isActive ? `0 4px 15px rgba(var(--lo-primary), 0.15)` : "none"
        }
      },
      /* @__PURE__ */ React.createElement("div", null, opt.label),
      /* @__PURE__ */ React.createElement("div", { className: "text-[10px] opacity-70" }, opt.sublabel)
    );
  }), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      min: "3",
      max: "11",
      step: "2",
      value: customInput,
      onChange: (e) => {
        setCustomInput(e.target.value);
        setCustomError("");
      },
      onKeyDown: handleKeyDown,
      placeholder: "NxN",
      className: "w-14 h-[44px] rounded-lg text-xs font-bold text-center border bg-black/40 focus:outline-none",
      style: {
        borderColor: isCustomActive ? `rgba(var(--lo-primary), 0.8)` : `rgba(var(--lo-primary), 0.15)`,
        color: `rgba(var(--lo-text-primary), 0.9)`,
        backgroundColor: isCustomActive ? `rgba(var(--lo-primary), 0.15)` : "rgba(0,0,0,0.4)"
      },
      "aria-label": "Custom grid size (odd number, 3-11)"
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleCustomSubmit,
      className: "h-[44px] px-2 rounded-lg text-xs font-bold border transition-all",
      style: {
        borderColor: `rgba(var(--lo-primary), 0.4)`,
        color: `rgba(var(--lo-primary), 0.9)`,
        backgroundColor: "rgba(0,0,0,0.3)"
      },
      "aria-label": "Apply custom board size"
    },
    "Go"
  )), customError && /* @__PURE__ */ React.createElement("div", { className: "text-[10px] text-red-400 mt-0.5" }, customError), isCustomActive && !customError && /* @__PURE__ */ React.createElement("div", { className: "text-[10px] mt-0.5", style: { color: `rgba(var(--lo-primary), 0.6)` } }, "Custom ", gridSize, "x", gridSize))));
};
const StarRating = ({ stars, animated, className }) => {
  return /* @__PURE__ */ React.createElement("div", { className: `flex gap-1 justify-center ${className || ""}`, "aria-label": `${stars} out of 3 stars` }, [1, 2, 3].map((i) => /* @__PURE__ */ React.createElement(
    "span",
    {
      key: i,
      className: `text-3xl ${animated && i <= stars ? "animate-star-pop" : ""}`,
      style: animated && i <= stars ? { animationDelay: `${(i - 1) * 0.15}s`, opacity: 0 } : {},
      "aria-hidden": "true"
    },
    i <= stars ? "★" : "☆"
  )));
};
const LightCell = React.memo(({ isOn, onToggle, onHover, row, col, isHinted, cellSizeClass, isAdjacentHighlight, rippleClass }) => {
  const style = React.useMemo(() => ({
    backgroundColor: isOn ? `rgb(var(--lo-primary))` : LIGHT_COLOR_OFF,
    boxShadow: isOn ? `0 0 15px rgba(var(--lo-primary), 1), 0 0 25px rgba(var(--lo-primary), 0.38), inset 0 0 5px rgba(var(--lo-primary), 0.5)` : "inset 0 0 10px rgba(0,0,0,0.5)",
    borderColor: `rgba(var(--lo-primary), 0.3)`
  }), [isOn]);
  const handleClick = React.useCallback(() => {
    onToggle(row, col);
  }, [onToggle, row, col]);
  const handleMouseEnter = React.useCallback(() => {
    onHover(row, col);
  }, [onHover, row, col]);
  return /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleClick,
      onMouseEnter: handleMouseEnter,
      role: "gridcell",
      className: `${cellSizeClass} rounded-lg border-2 transition-all duration-200 ease-in-out transform hover:scale-105 ${isHinted ? "hint-highlight" : ""} ${isAdjacentHighlight ? "adjacent-highlight" : ""} ${rippleClass || ""}`,
      style,
      "aria-label": `Row ${row + 1}, Column ${col + 1}, light ${isOn ? "on" : "off"}${isHinted ? ", suggested move" : ""}`,
      "aria-pressed": isOn
    }
  );
});
const LightsOutGame = () => {
  const [gridSize, setGridSize] = React.useState(5);
  const [board, setBoard] = React.useState(() => generateBoard(5));
  const [moves, setMoves] = React.useState(0);
  const [moveHistory, setMoveHistory] = React.useState([]);
  const [hintsRemaining, setHintsRemaining] = React.useState(HINTS_PER_GAME);
  const [hintCell, setHintCell] = React.useState(null);
  const [minSolution, setMinSolution] = React.useState(null);
  const [bestScores, setBestScores] = React.useState(() => loadBestScores());
  const [bestStarsMap, setBestStarsMap] = React.useState(() => loadBestStars());
  const [showHowToPlay, setShowHowToPlay] = React.useState(false);
  const [wonStars, setWonStars] = React.useState(0);
  const [campaignMode, setCampaignMode] = React.useState(false);
  const [campaignIndex, setCampaignIndex] = React.useState(0);
  const [campaignUnlocked, setCampaignUnlocked] = React.useState(() => {
    try {
      return Number(localStorage.getItem("lightsout_campaign_unlocked") || 0);
    } catch {
      return 0;
    }
  });
  const [hintExplanation, setHintExplanation] = React.useState("");
  const howToPlayTriggerRef = React.useRef(null);
  const resetButtonRef = React.useRef(null);
  const isWon = checkWinCondition(board);
  const prevIsWonRef = React.useRef(false);
  const [currentTheme, setCurrentTheme] = React.useState(() => loadTheme());
  const handleThemeChange = React.useCallback((themeId) => {
    setCurrentTheme(themeId);
    applyTheme(themeId);
    saveTheme(themeId);
  }, []);
  const [hoveredCell, setHoveredCell] = React.useState(null);
  const getAdjacentCells = React.useCallback((r, c, size) => {
    const adj = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];
    return adj.filter(([row, col]) => row >= 0 && row < size && col >= 0 && col < size);
  }, []);
  const handleCellHover = React.useCallback((r, c) => {
    if (!CAN_HOVER) return;
    setHoveredCell({ row: r, col: c });
  }, []);
  const handleCellLeave = React.useCallback(() => {
    setHoveredCell(null);
  }, []);
  const adjacentHighlightSet = React.useMemo(() => {
    if (!hoveredCell) return null;
    const adj = getAdjacentCells(hoveredCell.row, hoveredCell.col, gridSize);
    return new Set(adj.map(([ar, ac]) => `${ar}-${ac}`));
  }, [hoveredCell, gridSize, getAdjacentCells]);
  const [rippleCells, setRippleCells] = React.useState({});
  const triggerRipple = React.useCallback((r, c, size) => {
    const centerKey = `${r}-${c}`;
    const adjacents = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([row, col]) => row >= 0 && row < size && col >= 0 && col < size).map(([row, col]) => `${row}-${col}`);
    const newRipples = { [centerKey]: "ripple-center" };
    adjacents.forEach((key) => {
      newRipples[key] = "ripple-adjacent";
    });
    setRippleCells(newRipples);
    setTimeout(() => setRippleCells({}), 600);
  }, []);
  const [customSize, setCustomSize] = React.useState(null);
  const [timedMode, setTimedMode] = React.useState(false);
  const [timeRemaining, setTimeRemaining] = React.useState(0);
  const [timerActive, setTimerActive] = React.useState(false);
  const [timerStarted, setTimerStarted] = React.useState(false);
  const [timedScore, setTimedScore] = React.useState(null);
  const [bestTimedScores, setBestTimedScores] = React.useState(() => loadBestTimed());
  const timerRef = React.useRef(null);
  React.useEffect(() => {
    if (timerActive && timeRemaining > 0 && !isWon) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setTimerActive(false);
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1e3);
      return () => clearInterval(timerRef.current);
    }
    if (isWon && timerRef.current) {
      clearInterval(timerRef.current);
      setTimerActive(false);
    }
  }, [timerActive, isWon]);
  const isTimedGameOver = timedMode && timeRemaining === 0 && timerActive === false && !isWon && timerStarted;
  const toggleTimedMode = React.useCallback(() => {
    setTimedMode((prev) => {
      const newMode = !prev;
      return newMode;
    });
  }, []);
  const computeMinSolution = React.useCallback((b) => {
    const sol = solveLightsOut(b);
    return sol ? sol.length : null;
  }, []);
  React.useEffect(() => {
    setMinSolution(computeMinSolution(board));
  }, []);
  const cellSizeClass = React.useMemo(() => {
    if (gridSize <= 3) return "w-20 h-20 md:w-24 md:h-24";
    if (gridSize <= 5) return "w-14 h-14 md:w-16 md:h-16";
    if (gridSize <= 7) return "w-10 h-10 md:w-12 md:h-12";
    if (gridSize <= 9) return "w-8 h-8 md:w-10 md:h-10";
    return "w-7 h-7 md:w-10 md:h-10";
  }, [gridSize]);
  React.useEffect(() => {
    if (isWon && !prevIsWonRef.current) {
      const updatedScores = saveBestScore(gridSize, moves);
      setBestScores(updatedScores);
      const stars = calculateStars(moves, minSolution);
      setWonStars(stars);
      const updatedStars = saveBestStars(gridSize, stars);
      setBestStarsMap(updatedStars);
      if (campaignMode) {
        const unlocked = Math.min(LIGHTS_CAMPAIGN.length - 1, Math.max(campaignUnlocked, campaignIndex + 1));
        setCampaignUnlocked(unlocked);
        try {
          localStorage.setItem("lightsout_campaign_unlocked", String(unlocked));
        } catch {
        }
      }
      try {
        const audio = new (window.AudioContext || window.webkitAudioContext)();
        [0, 1, 2].slice(0, stars).forEach((_, i) => {
          const o = audio.createOscillator(), g = audio.createGain();
          o.connect(g);
          g.connect(audio.destination);
          o.frequency.value = [523, 659, 784][i] + THEMES.findIndex((t) => t.id === currentTheme) * 25;
          g.gain.setValueAtTime(0.06, audio.currentTime + i * 0.13);
          g.gain.exponentialRampToValueAtTime(1e-3, audio.currentTime + i * 0.13 + 0.25);
          o.start(audio.currentTime + i * 0.13);
          o.stop(audio.currentTime + i * 0.13 + 0.25);
        });
      } catch {
      }
      if (timedMode && timeRemaining > 0) {
        const bonus = timeRemaining * BONUS_POINTS_PER_SECOND;
        const moveScore = Math.max(0, 1e3 - moves * 20);
        const totalScore = moveScore + bonus;
        setTimedScore(totalScore);
        const updatedTimed = saveBestTimed(gridSize, totalScore);
        setBestTimedScores(updatedTimed);
      }
      if (resetButtonRef.current) {
        resetButtonRef.current.focus();
      }
    }
    prevIsWonRef.current = isWon;
  }, [isWon, moves, gridSize, minSolution, timedMode, timeRemaining]);
  const handleLightClick = React.useCallback((r, c) => {
    if (checkWinCondition(board)) return;
    if (timedMode && timeRemaining === 0 && timerStarted) return;
    if (timedMode && !timerStarted) {
      setTimeRemaining(getTimeLimit(gridSize));
      setTimerActive(true);
      setTimerStarted(true);
    }
    setMoveHistory((prev) => [...prev, { row: r, col: c }]);
    setBoard((prevBoard) => toggleLights(prevBoard, r, c, gridSize));
    setMoves((prevMoves) => prevMoves + 1);
    setHintCell(null);
    setHintExplanation("");
    setHoveredCell(null);
    triggerRipple(r, c, gridSize);
  }, [board, gridSize, timedMode, timeRemaining, timerStarted, triggerRipple]);
  const handleUndo = React.useCallback(() => {
    if (moveHistory.length === 0) return;
    if (timedMode && timeRemaining === 0 && timerStarted) return;
    const lastMove = moveHistory[moveHistory.length - 1];
    setMoveHistory((prev) => prev.slice(0, -1));
    setBoard((prevBoard) => toggleLights(prevBoard, lastMove.row, lastMove.col, gridSize));
    setMoves((prevMoves) => Math.max(0, prevMoves - 1));
    setHintCell(null);
  }, [moveHistory, gridSize, timedMode, timeRemaining, timerStarted]);
  const handleHint = React.useCallback(() => {
    if (hintsRemaining <= 0 || isWon) return;
    if (timedMode && timeRemaining === 0 && timerStarted) return;
    const solution = solveLightsOut(board);
    if (!solution || solution.length === 0) {
      setHintCell(null);
      return;
    }
    const target = solution[0];
    setHintCell(target);
    const affected = [[target.row, target.col], [target.row - 1, target.col], [target.row + 1, target.col], [target.row, target.col - 1], [target.row, target.col + 1]].filter(([r, c]) => r >= 0 && r < gridSize && c >= 0 && c < gridSize);
    const lit = affected.filter(([r, c]) => board[r][c]).length;
    setHintExplanation(`Choose row ${target.row + 1}, column ${target.col + 1}. It flips ${affected.length} cells, including ${lit} currently lit, and belongs to a complete shortest solution of ${solution.length} move${solution.length === 1 ? "" : "s"}.`);
    setHintsRemaining((prev) => prev - 1);
  }, [hintsRemaining, isWon, board, timedMode, timeRemaining, timerStarted, gridSize]);
  const startNewGame = React.useCallback((size) => {
    const newBoard = generateBoard(size);
    setBoard(newBoard);
    setMoves(0);
    setMoveHistory([]);
    setHintsRemaining(HINTS_PER_GAME);
    setHintCell(null);
    setHintExplanation("");
    setWonStars(0);
    setTimedScore(null);
    setTimeRemaining(0);
    setTimerActive(false);
    setTimerStarted(false);
    setRippleCells({});
    setHoveredCell(null);
    if (timerRef.current) clearInterval(timerRef.current);
    const sol = solveLightsOut(newBoard);
    setMinSolution(sol ? sol.length : null);
  }, []);
  const startCampaignStage = React.useCallback((index) => {
    const stage = LIGHTS_CAMPAIGN[index];
    if (!stage || index > campaignUnlocked) return;
    const next = campaignBoard(stage);
    setCampaignMode(true);
    setCampaignIndex(index);
    setGridSize(stage.size);
    setCustomSize(null);
    setBoard(next);
    setMoves(0);
    setMoveHistory([]);
    setHintsRemaining(HINTS_PER_GAME);
    setHintCell(null);
    setHintExplanation("");
    setWonStars(0);
    setTimedMode(false);
    setTimerActive(false);
    setTimerStarted(false);
    const solution = solveLightsOut(next);
    setMinSolution(solution ? solution.length : null);
  }, [campaignUnlocked]);
  const startNewGameRef = React.useRef(startNewGame);
  startNewGameRef.current = startNewGame;
  const handleCustomSizeChangeStable = React.useCallback((size) => {
    setCampaignMode(false);
    setCustomSize(size);
    setGridSize(size);
    startNewGameRef.current(size);
  }, []);
  const handleSizeChange = React.useCallback((newSize) => {
    setCampaignMode(false);
    setCustomSize(null);
    setGridSize(newSize);
    startNewGame(newSize);
  }, [startNewGame]);
  const resetGame = React.useCallback(() => {
    if (campaignMode) startCampaignStage(campaignIndex);
    else startNewGame(gridSize);
  }, [campaignMode, campaignIndex, startCampaignStage, gridSize, startNewGame]);
  const openHowToPlay = React.useCallback(() => {
    setShowHowToPlay(true);
  }, []);
  const closeHowToPlay = React.useCallback(() => {
    setShowHowToPlay(false);
  }, []);
  const lightsOnCount = React.useMemo(() => {
    return board.reduce((total, row) => total + row.filter(Boolean).length, 0);
  }, [board]);
  const totalStars = Object.values(bestStarsMap).reduce((sum, value) => sum + Number(value || 0), 0);
  const currentBestMoves = bestScores[String(gridSize)];
  const currentBestStars = bestStarsMap[String(gridSize)];
  const currentBestTimed = bestTimedScores[String(gridSize)];
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };
  const timeLimit = getTimeLimit(gridSize);
  const timerPercent = timedMode && timeLimit > 0 ? timeRemaining / timeLimit * 100 : 100;
  const timerUrgent = timedMode && timerActive && timeRemaining <= 10 && timeRemaining > 0;
  const gameDisabled = isWon || isTimedGameOver;
  return /* @__PURE__ */ React.createElement("div", { className: "mini-shell min-h-screen bg-black text-white font-sans relative overflow-hidden p-4 flex items-center justify-center" }, /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 bg-gradient-to-br from-black to-black", style: { background: `linear-gradient(135deg, #000 0%, rgba(var(--lo-bg-via), 0.4) 50%, #000 100%)` }, "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("div", { className: "absolute top-0 left-0 w-full h-full bg-repeat scanline-animation pointer-events-none", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("div", { className: "mini-layout relative z-10 max-w-lg mx-auto text-center" }, /* @__PURE__ */ React.createElement("aside", { className: "mini-controls" }, /* @__PURE__ */ React.createElement("header", { className: "py-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center gap-3" }, /* @__PURE__ */ React.createElement(
    "h1",
    {
      className: "text-4xl md:text-5xl font-bold bg-clip-text text-transparent tracking-wider text-shadow-neon",
      style: { backgroundImage: `linear-gradient(to right, var(--lo-gradient-from), var(--lo-gradient-to), var(--lo-accent-hex))` }
    },
    "LIGHTS OUT"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      ref: howToPlayTriggerRef,
      onClick: openHowToPlay,
      className: "min-w-[44px] min-h-[44px] rounded-full transition-all flex items-center justify-center text-lg flex-shrink-0",
      style: {
        borderColor: `rgba(var(--lo-primary), 0.4)`,
        backgroundColor: `rgba(var(--lo-primary), 0.08)`,
        color: `rgba(var(--lo-primary), 0.8)`,
        border: `1px solid rgba(var(--lo-primary), 0.4)`
      },
      "aria-label": "How to Play",
      title: "How to Play"
    },
    "❓"
  )), /* @__PURE__ */ React.createElement("p", { className: "mt-1 text-sm", style: { color: `rgba(var(--lo-primary), 0.6)` } }, "Turn off all the lights!")), /* @__PURE__ */ React.createElement("details", { className: "mini-settings", open: window.matchMedia("(min-width: 701px) and (orientation: landscape)").matches }, /* @__PURE__ */ React.createElement("summary", null, "Puzzle options"), "                        ", /* @__PURE__ */ React.createElement(ThemeSwitcher, { currentTheme, onThemeChange: handleThemeChange, totalStars }), /* @__PURE__ */ React.createElement("details", { className: "mini-campaign" }, /* @__PURE__ */ React.createElement("summary", null, "Campaign levels"), /* @__PURE__ */ React.createElement("div", { className: "flex gap-1 overflow-x-auto pb-2 mb-2", "aria-label": "Handcrafted campaign" }, LIGHTS_CAMPAIGN.map((stage, index) => /* @__PURE__ */ React.createElement("button", { key: stage.name, disabled: index > campaignUnlocked, onClick: () => startCampaignStage(index), className: `shrink-0 px-2 py-1 rounded border text-xs ${campaignMode && campaignIndex === index ? "bg-yellow-500 text-black border-yellow-200" : "bg-gray-900 border-gray-700"} disabled:opacity-30` }, index > campaignUnlocked ? "🔒 " : "", index + 1, ". ", stage.name)))), /* @__PURE__ */ React.createElement(DifficultySelector, { gridSize, onChange: handleSizeChange, customSize, onCustomSizeChange: handleCustomSizeChangeStable }), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center gap-3 mb-3" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        toggleTimedMode();
        resetGame();
      },
      className: "flex items-center gap-2 px-3 py-1.5 min-h-[44px] rounded-lg text-xs font-bold transition-all border",
      style: {
        borderColor: timedMode ? "rgba(239, 68, 68, 0.6)" : `rgba(var(--lo-primary), 0.2)`,
        backgroundColor: timedMode ? "rgba(239, 68, 68, 0.15)" : "rgba(0,0,0,0.3)",
        color: timedMode ? "rgb(252, 165, 165)" : `rgba(var(--lo-primary), 0.5)`
      },
      "aria-pressed": timedMode,
      "aria-label": `Timed challenge mode: ${timedMode ? "on" : "off"}`
    },
    /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, timedMode ? "⏱" : "⏱"),
    "Timed ",
    timedMode ? "ON" : "OFF",
    timedMode && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] opacity-70" }, "(", formatTime(getTimeLimit(gridSize)), ")")
  ))), timedMode && (timerActive || timeRemaining > 0 || isTimedGameOver) && /* @__PURE__ */ React.createElement("div", { className: "mb-3 px-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-xs mb-1" }, /* @__PURE__ */ React.createElement(
    "span",
    {
      className: `font-bold ${timerUrgent ? "text-red-400 countdown-urgent" : ""}`,
      style: !timerUrgent ? { color: `rgba(var(--lo-primary), 0.8)` } : {}
    },
    formatTime(timeRemaining)
  ), timedMode && !timerStarted && /* @__PURE__ */ React.createElement("span", { className: "text-gray-400 text-[10px]" }, "Timer starts on first move")), /* @__PURE__ */ React.createElement("div", { className: "w-full h-2 rounded-full bg-gray-800 overflow-hidden" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `h-full rounded-full transition-all duration-1000 ease-linear ${timerUrgent ? "countdown-urgent" : ""}`,
      style: {
        width: `${timerPercent}%`,
        backgroundColor: timerPercent > 50 ? `rgba(var(--lo-primary), 0.8)` : timerPercent > 20 ? "rgb(251, 191, 36)" : "rgb(239, 68, 68)"
      }
    }
  ))), /* @__PURE__ */ React.createElement(HowToPlayModal, { isOpen: showHowToPlay, onClose: closeHowToPlay, triggerRef: howToPlayTriggerRef })), /* @__PURE__ */ React.createElement(
    "main",
    {
      className: "mini-board bg-black/30 backdrop-blur-sm rounded-2xl p-4 border shadow-2xl",
      style: {
        borderColor: `rgba(var(--lo-primary), 0.2)`,
        boxShadow: `0 25px 50px rgba(var(--lo-primary), 0.1)`
      }
    },
    /* @__PURE__ */ React.createElement(
      "div",
      {
        role: "grid",
        "aria-label": `Lights Out ${gridSize}x${gridSize} puzzle grid, ${lightsOnCount} lights remaining`,
        className: "flex flex-col gap-1.5",
        onMouseLeave: handleCellLeave
      },
      board.map((row, r) => /* @__PURE__ */ React.createElement("div", { key: r, role: "row", className: "flex gap-1.5 justify-center" }, row.map((isOn, c) => /* @__PURE__ */ React.createElement(
        LightCell,
        {
          key: `${r}-${c}`,
          isOn,
          row: r,
          col: c,
          onToggle: handleLightClick,
          onHover: handleCellHover,
          isHinted: hintCell !== null && hintCell.row === r && hintCell.col === c,
          cellSizeClass,
          isAdjacentHighlight: !gameDisabled && adjacentHighlightSet !== null && adjacentHighlightSet.has(`${r}-${c}`),
          rippleClass: rippleCells[`${r}-${c}`] || ""
        }
      ))))
    ),
    !isWon && !isTimedGameOver && /* @__PURE__ */ React.createElement("div", { className: "flex gap-3 justify-center mt-4" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleUndo,
        disabled: moveHistory.length === 0,
        className: `px-4 py-2 min-h-[44px] rounded-lg text-sm font-bold transition-all border ${moveHistory.length === 0 ? "border-gray-600/30 bg-gray-800/30 text-gray-600 cursor-not-allowed" : ""}`,
        style: moveHistory.length > 0 ? {
          borderColor: `rgba(var(--lo-primary), 0.35)`,
          backgroundColor: `rgba(var(--lo-primary), 0.08)`,
          color: `rgba(var(--lo-primary), 0.8)`
        } : {},
        "aria-label": `Undo last move${moveHistory.length === 0 ? ", no moves to undo" : ""}`
      },
      "↶ Undo"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleHint,
        disabled: hintsRemaining <= 0,
        className: `px-4 py-2 min-h-[44px] rounded-lg text-sm font-bold transition-all border ${hintsRemaining <= 0 ? "border-gray-600/30 bg-gray-800/30 text-gray-600 cursor-not-allowed" : "border-yellow-500/40 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20 hover:border-yellow-400"}`,
        "aria-label": `Get hint, ${hintsRemaining} hints remaining`
      },
      "★ Hint (",
      hintsRemaining,
      ")"
    )),
    hintExplanation && !isWon && /* @__PURE__ */ React.createElement("div", { className: "mt-3 p-2 rounded-lg bg-yellow-950/60 border border-yellow-600/40 text-xs text-yellow-100", role: "status" }, /* @__PURE__ */ React.createElement("b", null, "Why this move:"), " ", hintExplanation)
  ), /* @__PURE__ */ React.createElement("div", { className: "mini-bottom" }, /* @__PURE__ */ React.createElement("footer", { className: "py-4" }, isTimedGameOver && /* @__PURE__ */ React.createElement("div", { className: "animate-fade-in", role: "alert" }, /* @__PURE__ */ React.createElement("h2", { className: "text-3xl font-bold text-red-400 text-shadow-neon mb-2" }, "TIME'S UP!"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-300 mb-1" }, "You ran out of time after ", /* @__PURE__ */ React.createElement("span", { className: "font-bold", style: { color: `rgba(var(--lo-primary), 0.9)` } }, moves), " moves."), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 mb-3" }, lightsOnCount, " light", lightsOnCount !== 1 ? "s" : "", " still on.")), isWon ? /* @__PURE__ */ React.createElement("div", { className: "animate-fade-in", role: "alert" }, /* @__PURE__ */ React.createElement("h2", { className: "text-3xl font-bold text-yellow-300 text-shadow-neon mb-2" }, "YOU WON!"), /* @__PURE__ */ React.createElement(StarRating, { stars: wonStars, animated: true, className: "mb-2" }), /* @__PURE__ */ React.createElement("p", { className: "text-sm mb-1", style: { color: `rgba(var(--lo-text-primary), 0.6)` } }, wonStars === 3 ? "Perfect!" : wonStars === 2 ? "Great job!" : "Solved!", minSolution !== null && /* @__PURE__ */ React.createElement("span", { className: "ml-1" }, "(Optimal: ", minSolution, " moves)")), /* @__PURE__ */ React.createElement("p", { className: "text-lg text-white mb-1" }, "Solved in ", /* @__PURE__ */ React.createElement("span", { className: "font-bold", style: { color: `rgba(var(--lo-primary), 0.9)` } }, moves), " moves."), timedMode && timedScore !== null && /* @__PURE__ */ React.createElement("div", { className: "mb-2" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-yellow-300" }, "Time bonus: +", timeRemaining * BONUS_POINTS_PER_SECOND, " pts (", formatTime(timeRemaining), " remaining)"), /* @__PURE__ */ React.createElement("p", { className: "text-lg font-bold text-yellow-200" }, "Score: ", timedScore), currentBestTimed && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-yellow-400/60" }, "Best timed score: ", currentBestTimed))) : !isTimedGameOver && /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("div", { className: "text-2xl text-white", "aria-live": "polite", "aria-atomic": "true" }, "Moves: ", /* @__PURE__ */ React.createElement("span", { className: "font-bold", style: { color: `rgba(var(--lo-primary), 0.9)` } }, moves)), currentBestMoves !== void 0 && /* @__PURE__ */ React.createElement("div", { className: "text-sm", style: { color: `rgba(var(--lo-primary), 0.45)` } }, "Best: ", /* @__PURE__ */ React.createElement("span", { className: "font-bold" }, currentBestMoves), " moves", currentBestStars > 0 && /* @__PURE__ */ React.createElement("span", { className: "ml-2 text-yellow-400/70" }, "★".repeat(currentBestStars), "☆".repeat(3 - currentBestStars)))), /* @__PURE__ */ React.createElement(
    "button",
    {
      ref: resetButtonRef,
      onClick: resetGame,
      className: "mt-3 py-3 px-10 min-h-[44px] rounded-xl font-bold text-lg text-black transition-all duration-200 bg-gradient-to-r from-yellow-400 to-orange-500 hover:scale-105 shadow-lg shadow-yellow-500/50"
    },
    isWon ? "Play Again" : isTimedGameOver ? "Try Again" : "Reset"
  )))));
};
ReactDOM.render(/* @__PURE__ */ React.createElement(LightsOutGame, null), document.getElementById("root"));
