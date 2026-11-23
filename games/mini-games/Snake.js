// Generated from Snake.jsx by tools/build-react-games.mjs; do not edit.
"use strict";
const GRID_SIZE = 17;
const MID = Math.floor(GRID_SIZE / 2);
const TICK_MS = 150;
const BEST_SCORE_KEY = "familyPortalSnakeBestScore";
const POINTS_PER_FOOD = 10;
const DIR_UP = { row: -1, col: 0 };
const DIR_DOWN = { row: 1, col: 0 };
const DIR_LEFT = { row: 0, col: -1 };
const DIR_RIGHT = { row: 0, col: 1 };
const HEAD_COLOR = "#4ade80";
const HEAD_GLOW = "rgba(74, 222, 128, 0.85)";
const BODY_COLOR = "#16a34a";
const FOOD_COLOR = "#ef4444";
const FOOD_GLOW = "rgba(249, 115, 22, 0.9)";
const CELL_A = "#071c0d";
const CELL_B = "#05140a";
const createInitialSnake = () => [
  { row: MID, col: MID },
  { row: MID, col: MID - 1 },
  { row: MID, col: MID - 2 }
];
const pickRandomEmptyCell = (snake, blocked = [], extra = []) => {
  const occupied = new Set([...snake, ...blocked, ...extra].map((s) => `${s.row},${s.col}`));
  const empties = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!occupied.has(`${r},${c}`)) empties.push({ row: r, col: c });
    }
  }
  if (empties.length === 0) return null;
  return empties[Math.floor(Math.random() * empties.length)];
};
const isOpposite = (a, b) => a.row === -b.row && a.col === -b.col;
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
        className: "relative bg-gray-900 border border-green-500/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl shadow-green-500/20 animate-fade-in",
        onClick: (e) => e.stopPropagation()
      },
      /* @__PURE__ */ React.createElement(
        "button",
        {
          ref: closeButtonRef,
          onClick: handleClose,
          className: "absolute top-2 right-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-green-300 hover:text-white transition-colors text-2xl leading-none rounded-lg",
          "aria-label": "Close instructions"
        },
        "×"
      ),
      /* @__PURE__ */ React.createElement("h2", { id: "how-to-play-title", className: "text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-4" }, "How to Play"),
      /* @__PURE__ */ React.createElement("ul", { className: "text-green-100/90 text-sm space-y-3 list-none" }, /* @__PURE__ */ React.createElement("li", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-green-400 mt-0.5", "aria-hidden": "true" }, "▶"), /* @__PURE__ */ React.createElement("span", null, "Use ", /* @__PURE__ */ React.createElement("strong", { className: "text-green-300" }, "arrow keys, WASD, or swipe"), " to steer the snake up, down, left, or right.")), /* @__PURE__ */ React.createElement("li", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-green-400 mt-0.5", "aria-hidden": "true" }, "▶"), /* @__PURE__ */ React.createElement("span", null, "Eat the ", /* @__PURE__ */ React.createElement("strong", { className: "text-orange-300" }, "red dot"), " to grow longer and score ", POINTS_PER_FOOD, " points.")), /* @__PURE__ */ React.createElement("li", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-green-400 mt-0.5", "aria-hidden": "true" }, "▶"), /* @__PURE__ */ React.createElement("span", null, "Don't run into a ", /* @__PURE__ */ React.createElement("strong", { className: "text-green-300" }, "wall"), " or your ", /* @__PURE__ */ React.createElement("strong", { className: "text-green-300" }, "own tail"), " - that ends the game!")), /* @__PURE__ */ React.createElement("li", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-green-400 mt-0.5", "aria-hidden": "true" }, "▶"), /* @__PURE__ */ React.createElement("span", null, "Press ", /* @__PURE__ */ React.createElement("strong", { className: "text-green-300" }, "Space"), " or tap the pause button to pause anytime."))),
      /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: handleClose,
          className: "mt-5 w-full py-2 min-h-[44px] rounded-lg font-bold text-black bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-300 hover:to-emerald-400 transition-all"
        },
        "Got it!"
      )
    )
  );
};
const snakeBodyPaths = (segments) => {
  const groups = [];
  let group = [];
  for (const segment of segments) {
    if (group.length) {
      const previous = group[group.length - 1];
      if (Math.abs(previous.row - segment.row) + Math.abs(previous.col - segment.col) !== 1) {
        groups.push(group);
        group = [];
      }
    }
    group.push(segment);
  }
  if (group.length) groups.push(group);
  return groups.map((part) => {
    const points = part.map((cell) => ({ x: cell.col + 0.5, y: cell.row + 0.5 }));
    let path = `M ${points[0].x} ${points[0].y}`;
    if (points.length === 1) return path + " l .0001 0";
    for (let i = 1; i < points.length - 1; i++) {
      const previous = points[i - 1], point = points[i], next = points[i + 1];
      const dx = point.x - previous.x, dy = point.y - previous.y, nx = next.x - point.x, ny = next.y - point.y;
      if (dx === nx && dy === ny) path += ` L ${point.x} ${point.y}`;
      else path += ` L ${point.x - dx * 0.42} ${point.y - dy * 0.42} Q ${point.x} ${point.y} ${point.x + nx * 0.42} ${point.y + ny * 0.42}`;
    }
    const last = points[points.length - 1];
    return path + ` L ${last.x} ${last.y}`;
  });
};
const SnakeFloor = React.memo(({ obstacleCells }) => /* @__PURE__ */ React.createElement(React.Fragment, null, Array.from({ length: GRID_SIZE }, (_, r) => /* @__PURE__ */ React.createElement("div", { key: r, role: "row", className: "flex flex-1 gap-[1px]" }, Array.from({ length: GRID_SIZE }, (_2, c) => {
  const obstacle = obstacleCells.has(`${r},${c}`);
  return /* @__PURE__ */ React.createElement("div", { key: c, role: "gridcell", "aria-hidden": "true", className: "snake-floor-cell flex-1", "data-obstacle": obstacle ? "true" : void 0, style: { backgroundColor: obstacle ? "#475569" : (r + c) % 2 ? "rgba(255,255,255,.025)" : "rgba(0,0,0,.055)" } });
})))));
const SNAKE_FOOD_MATERIAL_INDEX = { "●": 0, "🐟": 1, "🔥": 2, "⭐": 3 };
const snakeSurfaceBands = (body, head) => {
  const rgb = (color) => [1, 3, 5].map((index) => parseInt(color.slice(index, index + 2), 16));
  const mix = (a, b, t) => a.map((value, index) => value + (b[index] - value) * t);
  const dark = mix(rgb(body), [0, 0, 0], 0.5), bright = mix(rgb(head), [255, 255, 255], 0.38);
  return Array.from({ length: 14 }, (_, i) => {
    const t = i / 13, color = mix(dark, bright, Math.pow(t, 0.65));
    return { width: 0.87 - t * 0.72, x: -0.09 * t, y: -0.13 * t, color: `rgb(${color.map(Math.round).join(",")})` };
  });
};
const SnakeScene = React.memo(({ snake, food, headColor, bodyColor, foodSymbol, bonusFood }) => {
  const paths = React.useMemo(() => snakeBodyPaths(snake), [snake]);
  const bands = React.useMemo(() => snakeSurfaceBands(bodyColor, headColor), [bodyColor, headColor]);
  const tint = [1, 3, 5].map((index) => parseInt(headColor.slice(index, index + 2), 16) / 255);
  const head = snake[0], neck = snake[1] || { row: head.row, col: head.col - 1 };
  let dx = head.col - neck.col, dy = head.row - neck.row;
  if (Math.abs(dx) > 1) dx = -Math.sign(dx);
  if (Math.abs(dy) > 1) dy = -Math.sign(dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  const foodIndex = SNAKE_FOOD_MATERIAL_INDEX[foodSymbol] ?? 0;
  return /* @__PURE__ */ React.createElement("svg", { className: "snake-scene", viewBox: `0 0 ${GRID_SIZE} ${GRID_SIZE}`, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("radialGradient", { id: "snake-head-material", cx: "30%", cy: "23%", r: "85%" }, /* @__PURE__ */ React.createElement("stop", { offset: "0", stopColor: "#ecfff4" }), /* @__PURE__ */ React.createElement("stop", { offset: ".18", stopColor: headColor }), /* @__PURE__ */ React.createElement("stop", { offset: ".65", stopColor: bodyColor }), /* @__PURE__ */ React.createElement("stop", { offset: "1", stopColor: "#031b16" })), /* @__PURE__ */ React.createElement("filter", { id: "snake-scale-tint", colorInterpolationFilters: "sRGB" }, /* @__PURE__ */ React.createElement("feComponentTransfer", null, /* @__PURE__ */ React.createElement("feFuncR", { type: "linear", slope: tint[0] }), /* @__PURE__ */ React.createElement("feFuncG", { type: "linear", slope: tint[1] }), /* @__PURE__ */ React.createElement("feFuncB", { type: "linear", slope: tint[2] }))), /* @__PURE__ */ React.createElement("pattern", { id: "snake-scale-grain", width: "2", height: "2", patternUnits: "userSpaceOnUse" }, /* @__PURE__ */ React.createElement("image", { href: "./Snake-assets/scale-grain-r1.jpg", width: "2", height: "2", filter: "url(#snake-scale-tint)" })), /* @__PURE__ */ React.createElement("filter", { id: "snake-contact-shadow", x: "-25%", y: "-25%", width: "150%", height: "150%" }, /* @__PURE__ */ React.createElement("feGaussianBlur", { stdDeviation: ".055" }))), /* @__PURE__ */ React.createElement("g", { fill: "none", strokeLinecap: "round", strokeLinejoin: "round" }, paths.map((path, i) => /* @__PURE__ */ React.createElement("g", { key: i }, /* @__PURE__ */ React.createElement("path", { d: path, stroke: "#000", strokeWidth: ".94", opacity: ".42", transform: "translate(.035 .14)", filter: "url(#snake-contact-shadow)" }), bands.map((band, index) => /* @__PURE__ */ React.createElement("path", { key: index, d: path, stroke: band.color, strokeWidth: band.width, transform: `translate(${band.x} ${band.y})` })), /* @__PURE__ */ React.createElement("path", { d: path, stroke: "url(#snake-scale-grain)", strokeWidth: ".82", opacity: ".30" }), /* @__PURE__ */ React.createElement("path", { d: path, stroke: "#f3fff5", strokeWidth: ".045", opacity: ".38", transform: "translate(-.095 -.19)" })))), /* @__PURE__ */ React.createElement("g", { transform: `translate(${head.col + 0.5} ${head.row + 0.5}) rotate(${angle})` }, /* @__PURE__ */ React.createElement("ellipse", { cx: ".015", cy: ".11", rx: ".48", ry: ".43", fill: "#000", opacity: ".35" }), /* @__PURE__ */ React.createElement("ellipse", { rx: ".49", ry: ".43", fill: "url(#snake-head-material)", stroke: headColor, strokeWidth: ".025" }), /* @__PURE__ */ React.createElement("ellipse", { rx: ".48", ry: ".42", fill: "url(#snake-scale-grain)", opacity: ".20" }), /* @__PURE__ */ React.createElement("path", { d: "M -.29 -.22 Q -.03 -.39 .28 -.21", fill: "none", stroke: "#d5ffeb", strokeWidth: ".055", opacity: ".55" }), [-1, 1].map((side) => /* @__PURE__ */ React.createElement("g", { key: side }, /* @__PURE__ */ React.createElement("ellipse", { cx: ".13", cy: side * 0.27, rx: ".13", ry: ".14", fill: "#06241c" }), /* @__PURE__ */ React.createElement("ellipse", { cx: ".145", cy: side * 0.265, rx: ".105", ry: ".115", fill: "#fcfff4" }), /* @__PURE__ */ React.createElement("ellipse", { cx: ".185", cy: side * 0.26, rx: ".053", ry: ".073", fill: "#08151b" }), /* @__PURE__ */ React.createElement("circle", { cx: ".175", cy: side * 0.26 - 0.025, r: ".022", fill: "white" }), /* @__PURE__ */ React.createElement("ellipse", { cx: ".37", cy: side * 0.1, rx: ".022", ry: ".015", fill: "#05251b", opacity: ".8" }))), /* @__PURE__ */ React.createElement("path", { d: "M .29 .18 Q .42 .12 .43 .02", fill: "none", stroke: "#05251b", strokeWidth: ".024", opacity: ".6" })), food && /* @__PURE__ */ React.createElement("svg", { x: food.col - 0.08, y: food.row - 0.08, width: "1.16", height: "1.16", viewBox: `${foodIndex % 2 * 256} ${Math.floor(foodIndex / 2) * 256} 256 256`, overflow: "hidden" }, /* @__PURE__ */ React.createElement("image", { href: "./Snake-assets/food-atlas-r1.webp", width: "512", height: "512" })), bonusFood && /* @__PURE__ */ React.createElement("text", { x: bonusFood.col + 0.5, y: bonusFood.row + 0.76, textAnchor: "middle", fontSize: ".72" }, bonusFood.type === "shield" ? "🛡" : bonusFood.type === "magnet" ? "🧲" : bonusFood.type === "slow" ? "❄" : "×2"));
});
const SnakeGame = () => {
  const MODES = { classic: "Classic", wrap: "Wraparound", maze: "Maze", zen: "Zen", time: "Time Attack" };
  const SKINS = {
    neon: { label: "Neon", unlock: 0, head: "#4ade80", body: "#16a34a", bg: "via-green-950/30", food: "●" },
    ocean: { label: "Ocean", unlock: 50, head: "#22d3ee", body: "#2563eb", bg: "via-blue-950/50", food: "🐟" },
    lava: { label: "Lava", unlock: 120, head: "#fb923c", body: "#dc2626", bg: "via-red-950/50", food: "🔥" },
    gold: { label: "Golden", unlock: 250, head: "#fde047", body: "#ca8a04", bg: "via-amber-950/50", food: "⭐" }
  };
  const MISSIONS = [
    { id: "free", label: "Free Run", goal: Infinity },
    { id: "snack", label: "Eat 10", goal: 10 },
    { id: "score", label: "Score 150", goal: 150 },
    { id: "gauntlet", label: "Obstacle Gauntlet", goal: 8 }
  ];
  const [mode, setMode] = React.useState("classic");
  const [mission, setMission] = React.useState("free");
  const [obstacles, setObstacles] = React.useState([]);
  const [bonusFood, setBonusFood] = React.useState(null);
  const [effects, setEffects] = React.useState({ shield: 0, magnet: 0, slow: 0, multiplier: 0 });
  const [foodsEaten, setFoodsEaten] = React.useState(0);
  const [timeLeft, setTimeLeft] = React.useState(60);
  const [missionComplete, setMissionComplete] = React.useState(false);
  const [skin, setSkin] = React.useState(() => localStorage.getItem("snake-skin") || "neon");
  const [snake, setSnake] = React.useState(createInitialSnake);
  const [food, setFood] = React.useState(() => pickRandomEmptyCell(createInitialSnake()));
  const [score, setScore] = React.useState(0);
  const [best, setBest] = React.useState(0);
  const [gameOver, setGameOver] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
  const [isStarted, setIsStarted] = React.useState(false);
  const [showHowToPlay, setShowHowToPlay] = React.useState(false);
  const snakeRef = React.useRef(snake);
  const foodRef = React.useRef(food);
  const gameOverRef = React.useRef(false);
  const isStartedRef = React.useRef(false);
  const pausedRef = React.useRef(false);
  const showHowToPlayRef = React.useRef(false);
  const currentDirectionRef = React.useRef(DIR_RIGHT);
  const pendingDirectionRef = React.useRef(null);
  const touchStartRef = React.useRef(null);
  const howToPlayTriggerRef = React.useRef(null);
  const newGameButtonRef = React.useRef(null);
  const prevGameOverRef = React.useRef(false);
  const modeRef = React.useRef(mode);
  const obstaclesRef = React.useRef(obstacles);
  const bonusFoodRef = React.useRef(bonusFood);
  const effectsRef = React.useRef(effects);
  const foodsEatenRef = React.useRef(foodsEaten);
  const scoreRef = React.useRef(score);
  React.useEffect(() => {
    snakeRef.current = snake;
  }, [snake]);
  React.useEffect(() => {
    foodRef.current = food;
  }, [food]);
  React.useEffect(() => {
    showHowToPlayRef.current = showHowToPlay;
  }, [showHowToPlay]);
  React.useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  React.useEffect(() => {
    obstaclesRef.current = obstacles;
  }, [obstacles]);
  React.useEffect(() => {
    bonusFoodRef.current = bonusFood;
  }, [bonusFood]);
  React.useEffect(() => {
    effectsRef.current = effects;
  }, [effects]);
  React.useEffect(() => {
    foodsEatenRef.current = foodsEaten;
  }, [foodsEaten]);
  React.useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  React.useEffect(() => {
    const stored = Number(localStorage.getItem(BEST_SCORE_KEY) || 0);
    if (!Number.isNaN(stored)) setBest(stored);
  }, []);
  React.useEffect(() => {
    if (score > best) {
      setBest(score);
      localStorage.setItem(BEST_SCORE_KEY, String(score));
    }
  }, [score, best]);
  React.useEffect(() => {
    if (gameOver && !prevGameOverRef.current && newGameButtonRef.current) {
      newGameButtonRef.current.focus();
    }
    prevGameOverRef.current = gameOver;
  }, [gameOver]);
  const endGame = React.useCallback(() => {
    gameOverRef.current = true;
    setGameOver(true);
  }, []);
  const createObstacles = React.useCallback((nextMode, nextMission) => {
    if (nextMode !== "maze" && nextMission !== "gauntlet") return [];
    return [
      ...Array.from({ length: 7 }, (_, i) => ({ row: 3, col: i + 5 })),
      ...Array.from({ length: 7 }, (_, i) => ({ row: 13, col: i + 5 })),
      ...Array.from({ length: 5 }, (_, i) => ({ row: i + 6, col: 4 })),
      ...Array.from({ length: 5 }, (_, i) => ({ row: i + 6, col: 12 }))
    ];
  }, []);
  const tick = React.useCallback(() => {
    if (document.hidden || !isStartedRef.current || gameOverRef.current || pausedRef.current || showHowToPlayRef.current) return;
    if (pendingDirectionRef.current) {
      currentDirectionRef.current = pendingDirectionRef.current;
      pendingDirectionRef.current = null;
    }
    const dir = currentDirectionRef.current;
    const currentSnake = snakeRef.current;
    let movementSnake = currentSnake;
    const head = currentSnake[0];
    let newHead = { row: head.row + dir.row, col: head.col + dir.col };
    if (newHead.row < 0 || newHead.row >= GRID_SIZE || newHead.col < 0 || newHead.col >= GRID_SIZE) {
      if (modeRef.current === "wrap" || modeRef.current === "zen") newHead = { row: (newHead.row + GRID_SIZE) % GRID_SIZE, col: (newHead.col + GRID_SIZE) % GRID_SIZE };
      else if (effectsRef.current.shield > 0) {
        setEffects((prev) => ({ ...prev, shield: prev.shield - 1 }));
        newHead = { row: (newHead.row + GRID_SIZE) % GRID_SIZE, col: (newHead.col + GRID_SIZE) % GRID_SIZE };
      } else {
        endGame();
        return;
      }
    }
    let currentFood = foodRef.current;
    if (currentFood && effectsRef.current.magnet > 0) {
      const distance = Math.abs(currentFood.row - newHead.row) + Math.abs(currentFood.col - newHead.col);
      if (distance <= 4 && distance > 0) {
        const pulled = { row: currentFood.row + Math.sign(newHead.row - currentFood.row), col: currentFood.col + Math.sign(newHead.col - currentFood.col) };
        if (!obstaclesRef.current.some((cell) => cell.row === pulled.row && cell.col === pulled.col)) {
          currentFood = pulled;
          foodRef.current = pulled;
          setFood(pulled);
        }
      }
    }
    const willEat = !!currentFood && newHead.row === currentFood.row && newHead.col === currentFood.col;
    const bodyToCheck = willEat ? currentSnake : currentSnake.slice(0, -1);
    const hitSelf = bodyToCheck.some((seg) => seg.row === newHead.row && seg.col === newHead.col);
    const hitObstacle = obstaclesRef.current.some((cell) => cell.row === newHead.row && cell.col === newHead.col);
    if (hitSelf || hitObstacle) {
      if (modeRef.current === "zen") {
        newHead = { row: (newHead.row + dir.row + GRID_SIZE) % GRID_SIZE, col: (newHead.col + dir.col + GRID_SIZE) % GRID_SIZE };
      } else if (effectsRef.current.shield > 0) {
        setEffects((prev) => ({ ...prev, shield: prev.shield - 1 }));
        movementSnake = currentSnake.filter((seg) => seg.row !== newHead.row || seg.col !== newHead.col);
      } else {
        endGame();
        return;
      }
    }
    const newSnake = [newHead, ...movementSnake];
    if (!willEat) newSnake.pop();
    snakeRef.current = newSnake;
    setSnake(newSnake);
    if (willEat) {
      const points = POINTS_PER_FOOD * (effectsRef.current.multiplier > 0 ? 2 : 1);
      setScore((s) => s + points);
      const eaten = foodsEatenRef.current + 1;
      setFoodsEaten(eaten);
      const nextFood = pickRandomEmptyCell(newSnake, obstaclesRef.current, bonusFoodRef.current ? [bonusFoodRef.current] : []);
      foodRef.current = nextFood;
      setFood(nextFood);
      if (eaten % 4 === 0 && !bonusFoodRef.current) {
        const cell = pickRandomEmptyCell(newSnake, obstaclesRef.current, [nextFood]);
        const types = ["shield", "magnet", "slow", "multiplier"];
        setBonusFood(cell ? { ...cell, type: types[(eaten / 4 - 1) % types.length] } : null);
      }
    }
    const bonus = bonusFoodRef.current;
    if (bonus && newHead.row === bonus.row && newHead.col === bonus.col) {
      setEffects((prev) => ({ ...prev, [bonus.type]: bonus.type === "shield" ? Math.min(2, prev.shield + 1) : 45 }));
      setBonusFood(null);
    }
    setEffects((prev) => ({ ...prev, magnet: Math.max(0, prev.magnet - 1), slow: Math.max(0, prev.slow - 1), multiplier: Math.max(0, prev.multiplier - 1) }));
  }, [endGame]);
  const tickMs = (effects.slow > 0 ? 1.45 : 1) * Math.max(70, TICK_MS - (snake.length - 3) * 3);
  React.useEffect(() => {
    if (mode !== "time" || !isStarted || paused || gameOver || showHowToPlay) return;
    const timer = setInterval(() => setTimeLeft((value) => {
      if (document.hidden) return value;
      if (value <= 1) {
        endGame();
        return 0;
      }
      return value - 1;
    }), 1e3);
    return () => clearInterval(timer);
  }, [mode, isStarted, paused, gameOver, showHowToPlay, endGame]);
  React.useEffect(() => {
    const target = MISSIONS.find((item) => item.id === mission);
    const progress = mission === "score" ? score : foodsEaten;
    if (target && target.goal !== Infinity && progress >= target.goal && !missionComplete) {
      setMissionComplete(true);
      pausedRef.current = true;
      setPaused(true);
    }
  }, [mission, score, foodsEaten, missionComplete]);
  React.useEffect(() => {
    const id = setInterval(tick, tickMs);
    return () => clearInterval(id);
  }, [tick, tickMs]);
  const startGame = React.useCallback(() => {
    if (isStartedRef.current || gameOverRef.current) return;
    isStartedRef.current = true;
    setIsStarted(true);
  }, []);
  const setPendingDirectionSafe = React.useCallback((dir) => {
    if (gameOverRef.current) return;
    startGame();
    const cur = currentDirectionRef.current;
    if (isOpposite(dir, cur)) return;
    pendingDirectionRef.current = dir;
  }, [startGame]);
  const togglePause = React.useCallback(() => {
    if (gameOverRef.current || !isStartedRef.current || showHowToPlayRef.current) return;
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
  }, []);
  const startNewGame = React.useCallback(() => {
    const initialSnake = createInitialSnake();
    const nextObstacles = createObstacles(modeRef.current, mission);
    const initialFood = pickRandomEmptyCell(initialSnake, nextObstacles);
    snakeRef.current = initialSnake;
    foodRef.current = initialFood;
    currentDirectionRef.current = DIR_RIGHT;
    pendingDirectionRef.current = null;
    gameOverRef.current = false;
    pausedRef.current = false;
    isStartedRef.current = false;
    setSnake(initialSnake);
    setFood(initialFood);
    setScore(0);
    setGameOver(false);
    setPaused(false);
    setIsStarted(false);
    setObstacles(nextObstacles);
    setBonusFood(null);
    setEffects({ shield: 0, magnet: 0, slow: 0, multiplier: 0 });
    setFoodsEaten(0);
    setTimeLeft(60);
    setMissionComplete(false);
  }, [createObstacles, mission]);
  React.useEffect(() => {
    modeRef.current = mode;
    startNewGame();
  }, [mode, mission]);
  const chooseMode = (nextMode) => {
    modeRef.current = nextMode;
    setMode(nextMode);
  };
  React.useEffect(() => {
    const KEY_DIRECTIONS = {
      ArrowUp: DIR_UP,
      ArrowDown: DIR_DOWN,
      ArrowLeft: DIR_LEFT,
      ArrowRight: DIR_RIGHT,
      w: DIR_UP,
      s: DIR_DOWN,
      a: DIR_LEFT,
      d: DIR_RIGHT,
      W: DIR_UP,
      S: DIR_DOWN,
      A: DIR_LEFT,
      D: DIR_RIGHT
    };
    const handleKeyDown = (e) => {
      if (e.key === " " || e.code === "Space" || e.key === "Spacebar") {
        e.preventDefault();
        togglePause();
        return;
      }
      const dir = KEY_DIRECTIONS[e.key];
      if (!dir) return;
      e.preventDefault();
      setPendingDirectionSafe(dir);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [togglePause, setPendingDirectionSafe]);
  const handleTouchStart = React.useCallback((e) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  }, []);
  const handleTouchEnd = React.useCallback((e) => {
    if (!touchStartRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    touchStartRef.current = null;
    const SWIPE_THRESHOLD = 24;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      setPendingDirectionSafe(dx > 0 ? DIR_RIGHT : DIR_LEFT);
    } else {
      setPendingDirectionSafe(dy > 0 ? DIR_DOWN : DIR_UP);
    }
  }, [setPendingDirectionSafe]);
  const openHowToPlay = React.useCallback(() => setShowHowToPlay(true), []);
  const closeHowToPlay = React.useCallback(() => setShowHowToPlay(false), []);
  const obstacleCells = React.useMemo(() => new Set(obstacles.map((cell) => `${cell.row},${cell.col}`)), [obstacles]);
  const activeSkin = SKINS[skin] || SKINS.neon;
  const missionData = MISSIONS.find((item) => item.id === mission);
  const missionProgress = mission === "score" ? score : foodsEaten;
  return /* @__PURE__ */ React.createElement("div", { className: "mini-shell min-h-screen bg-black text-white font-sans relative overflow-hidden p-4 flex items-center justify-center" }, /* @__PURE__ */ React.createElement("div", { className: `absolute inset-0 bg-gradient-to-br from-black ${activeSkin.bg} to-black`, "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("div", { className: "absolute top-0 left-0 w-full h-full bg-repeat scanline-animation pointer-events-none", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("div", { className: "mini-layout relative z-10 w-full mx-auto text-center" }, /* @__PURE__ */ React.createElement("aside", { className: "mini-controls" }, /* @__PURE__ */ React.createElement("header", { className: "py-6 pt-14 sm:pt-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center gap-3" }, /* @__PURE__ */ React.createElement("h1", { className: "text-4xl md:text-5xl font-black bg-gradient-to-r from-green-300 via-emerald-400 to-green-500 bg-clip-text text-transparent tracking-wider text-shadow-neon" }, "SNAKE"), /* @__PURE__ */ React.createElement(
    "button",
    {
      ref: howToPlayTriggerRef,
      onClick: openHowToPlay,
      className: "min-w-[44px] min-h-[44px] rounded-full border border-green-500/50 bg-green-500/10 text-green-300 hover:bg-green-500/30 hover:text-white transition-all flex items-center justify-center text-lg flex-shrink-0",
      "aria-label": "How to Play",
      title: "How to Play"
    },
    "❓"
  )), /* @__PURE__ */ React.createElement("p", { className: "text-green-300/80 mt-2" }, "Eat, grow, don't crash!")), /* @__PURE__ */ React.createElement(HowToPlayModal, { isOpen: showHowToPlay, onClose: closeHowToPlay, triggerRef: howToPlayTriggerRef }), /* @__PURE__ */ React.createElement("details", { className: "mini-settings snake-options", open: window.matchMedia("(min-width: 701px) and (orientation: landscape)").matches }, /* @__PURE__ */ React.createElement("summary", null, "Mode, mission & skin"), /* @__PURE__ */ React.createElement("div", { className: "flex gap-1 overflow-x-auto mb-2" }, Object.entries(MODES).map(([id, label]) => /* @__PURE__ */ React.createElement("button", { key: id, onClick: () => chooseMode(id), className: `shrink-0 px-2 py-1 rounded border text-xs font-bold ${mode === id ? "bg-green-500 text-black" : "bg-black/60 border-green-800 text-green-200"}` }, label))), /* @__PURE__ */ React.createElement("div", { className: "flex justify-center gap-2 mb-3 flex-wrap" }, /* @__PURE__ */ React.createElement("select", { value: mission, onChange: (event) => setMission(event.target.value), className: "bg-gray-900 border border-purple-600 rounded px-2 py-1 text-xs" }, MISSIONS.map((item) => /* @__PURE__ */ React.createElement("option", { key: item.id, value: item.id }, item.label))), /* @__PURE__ */ React.createElement("select", { value: skin, onChange: (event) => {
    const next = event.target.value;
    if (SKINS[next].unlock <= best) {
      setSkin(next);
      localStorage.setItem("snake-skin", next);
    }
  }, className: "bg-gray-900 border border-green-600 rounded px-2 py-1 text-xs" }, Object.entries(SKINS).map(([id, item]) => /* @__PURE__ */ React.createElement("option", { key: id, value: id, disabled: best < item.unlock }, best < item.unlock ? "🔒 " : "", item.label, item.unlock ? ` (${item.unlock})` : ""))), mode === "time" && /* @__PURE__ */ React.createElement("span", { className: "px-2 py-1 rounded bg-red-900 border border-red-500 text-sm font-bold" }, "⏱ ", timeLeft, "s")), mission !== "free" && /* @__PURE__ */ React.createElement("div", { className: "mb-2 text-xs text-purple-100" }, "Mission: ", missionData.label, " · ", Math.min(missionProgress, missionData.goal), "/", missionData.goal)), /* @__PURE__ */ React.createElement("div", { className: "flex justify-center gap-1 mb-2 text-xs" }, effects.shield > 0 && /* @__PURE__ */ React.createElement("span", { className: "px-2 py-1 rounded bg-blue-900" }, "🛡 ", effects.shield), effects.magnet > 0 && /* @__PURE__ */ React.createElement("span", { className: "px-2 py-1 rounded bg-purple-900" }, "🧲 ", effects.magnet), effects.slow > 0 && /* @__PURE__ */ React.createElement("span", { className: "px-2 py-1 rounded bg-cyan-900" }, "❄ ", effects.slow), effects.multiplier > 0 && /* @__PURE__ */ React.createElement("span", { className: "px-2 py-1 rounded bg-yellow-900" }, "×2 ", effects.multiplier)), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center gap-3 mb-4" }, /* @__PURE__ */ React.createElement("div", { "aria-live": "polite", "aria-atomic": "true", className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "bg-black/40 border border-green-500/30 rounded-xl px-5 py-2 min-w-[100px]" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs uppercase tracking-widest text-green-300/70" }, "Score"), /* @__PURE__ */ React.createElement("div", { className: "text-2xl font-bold text-green-200" }, score)), /* @__PURE__ */ React.createElement("div", { className: "bg-black/40 border border-green-500/30 rounded-xl px-5 py-2 min-w-[100px]" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs uppercase tracking-widest text-green-300/70" }, "Best"), /* @__PURE__ */ React.createElement("div", { className: "text-2xl font-bold text-green-200" }, best))), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: togglePause,
      disabled: gameOver || !isStarted,
      "aria-pressed": paused,
      "aria-label": paused ? "Resume game" : "Pause game",
      title: paused ? "Resume" : "Pause",
      className: "min-w-[44px] min-h-[44px] rounded-full border border-green-500/50 bg-green-500/10 text-green-300 hover:bg-green-500/30 hover:text-white transition-all flex items-center justify-center text-lg flex-shrink-0 disabled:opacity-40 disabled:pointer-events-none"
    },
    paused ? "▶" : "⏸"
  ))), /* @__PURE__ */ React.createElement(
    "main",
    {
      className: "mini-board relative bg-black/30 backdrop-blur-sm rounded-2xl p-2 md:p-3 border border-green-500/30 shadow-2xl shadow-green-500/20 select-none",
      style: { touchAction: "none", "--snake-head": activeSkin.head, "--snake-body": activeSkin.body },
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd
    },
    /* @__PURE__ */ React.createElement(
      "div",
      {
        role: "grid",
        "aria-label": `Snake board, ${GRID_SIZE} by ${GRID_SIZE}, score ${score}${gameOver ? ", game over" : paused ? ", paused" : ""}`,
        className: "snake-grid relative w-full aspect-square flex flex-col gap-[1px] bg-black rounded-lg overflow-hidden"
      },
      /* @__PURE__ */ React.createElement(SnakeFloor, { obstacleCells }),
      /* @__PURE__ */ React.createElement(SnakeScene, { snake, food, headColor: activeSkin.head, bodyColor: activeSkin.body, foodSymbol: activeSkin.food, bonusFood })
    ),
    !isStarted && !gameOver && /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "snake-ready absolute inset-0 rounded-2xl bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-4 animate-fade-in cursor-pointer",
        role: "button",
        tabIndex: 0,
        "aria-label": "Start game",
        onClick: startGame,
        onKeyDown: (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            startGame();
          }
        }
      },
      /* @__PURE__ */ React.createElement("h2", { className: "text-3xl font-black text-green-300 text-shadow-neon" }, "READY?"),
      /* @__PURE__ */ React.createElement("p", { className: "text-green-100 px-6 text-sm" }, "Tap, swipe, or press an arrow key to start")
    ),
    paused && !gameOver && /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 rounded-2xl bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 animate-fade-in", role: "status" }, /* @__PURE__ */ React.createElement("h2", { className: "text-3xl font-black text-green-300 text-shadow-neon" }, "PAUSED"), missionComplete && /* @__PURE__ */ React.createElement("p", { className: "text-yellow-300 text-xl font-black" }, "MISSION COMPLETE!"), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: togglePause,
        className: "py-2 px-6 min-h-[44px] rounded-xl font-bold text-black bg-gradient-to-r from-green-400 to-emerald-500 hover:scale-105 transition-all"
      },
      "Resume"
    )),
    gameOver && /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 rounded-2xl bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 animate-fade-in", role: "alert" }, /* @__PURE__ */ React.createElement("h2", { className: "text-3xl font-black text-red-400 text-shadow-neon" }, "GAME OVER"), /* @__PURE__ */ React.createElement("p", { className: "text-green-100" }, "Final score: ", score), /* @__PURE__ */ React.createElement(
      "button",
      {
        ref: newGameButtonRef,
        onClick: startNewGame,
        className: "py-2 px-6 min-h-[44px] rounded-xl font-bold text-black bg-gradient-to-r from-green-400 to-emerald-500 hover:scale-105 transition-all"
      },
      "New Game"
    ))
  ), /* @__PURE__ */ React.createElement("div", { className: "mini-bottom" }, /* @__PURE__ */ React.createElement("footer", { className: "py-6" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: startNewGame,
      className: "mt-2 py-3 px-10 min-h-[44px] rounded-xl font-bold text-lg text-black transition-all duration-200 bg-gradient-to-r from-green-400 to-emerald-500 hover:scale-105 shadow-lg shadow-green-500/50"
    },
    "New Game"
  )))));
};
ReactDOM.render(/* @__PURE__ */ React.createElement(SnakeGame, null), document.getElementById("root"));
