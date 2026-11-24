// Generated from 2DTicTacToe.jsx by tools/build-react-games.mjs; do not edit.
"use strict";
const PLAYERS = { X: "X", O: "O" };
const GAME_MODES = { PVP: "PvP", PVAI: "PvAI" };
const DIFFICULTIES = { EASY: "easy", MEDIUM: "medium", HARD: "hard" };
const AI_THINK_DELAY = 800;
const STATS_KEY_PVP = "ttt-stats-pvp";
const STATS_KEY_PVAI = "ttt-stats-pvai";
const STREAK_KEY_PVP = "ttt-streak-pvp";
const STREAK_KEY_PVAI = "ttt-streak-pvai";
const THEME_KEY = "ttt-theme";
const REPLAY_STEP_DELAY = 600;
const THEMES = [
  { id: "neon-pink", label: "Neon Pink" },
  { id: "classic", label: "Classic" },
  { id: "retro-green", label: "Retro Green" }
];
const SoundEngine = /* @__PURE__ */ (() => {
  let audioCtx = null;
  let muted = false;
  const getCtx = () => {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  };
  const playTone = (freq, duration, type = "square", gain = 0.15, delay = 0) => {
    if (muted) return;
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gainNode.gain.setValueAtTime(gain, ctx.currentTime + delay);
      gainNode.gain.exponentialRampToValueAtTime(1e-3, ctx.currentTime + delay + duration);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    } catch (e) {
    }
  };
  return {
    isMuted: () => muted,
    setMuted: (val) => {
      muted = val;
    },
    toggleMute: () => {
      muted = !muted;
      return muted;
    },
    playX: () => {
      playTone(520, 0.12, "square", 0.12);
      playTone(780, 0.08, "square", 0.08, 0.06);
    },
    playO: () => {
      playTone(440, 0.15, "sine", 0.15);
      playTone(330, 0.1, "sine", 0.1, 0.07);
    },
    playAIMove: () => {
      playTone(350, 0.1, "triangle", 0.08);
      playTone(500, 0.1, "triangle", 0.06, 0.08);
    },
    playVictory: () => {
      playTone(523, 0.15, "square", 0.12, 0);
      playTone(659, 0.15, "square", 0.12, 0.15);
      playTone(784, 0.15, "square", 0.12, 0.3);
      playTone(1047, 0.35, "square", 0.18, 0.45);
    },
    playDraw: () => {
      playTone(220, 0.3, "sawtooth", 0.08);
      playTone(196, 0.4, "sawtooth", 0.06, 0.25);
    }
  };
})();
const loadStats = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
  }
  return { wins: 0, losses: 0, draws: 0 };
};
const saveStats = (key, stats) => {
  try {
    localStorage.setItem(key, JSON.stringify(stats));
  } catch (e) {
  }
};
const loadStreak = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return parseInt(raw, 10) || 0;
  } catch (e) {
  }
  return 0;
};
const saveStreak = (key, val) => {
  try {
    localStorage.setItem(key, String(val));
  } catch (e) {
  }
};
const loadTheme = () => {
  try {
    return localStorage.getItem(THEME_KEY) || "neon-pink";
  } catch (e) {
  }
  return "neon-pink";
};
const saveTheme = (theme) => {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {
  }
};
const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  // Rows
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  // Columns
  [0, 4, 8],
  [2, 4, 6]
  // Diagonals
];
const checkWinner = (board, player) => {
  const flatBoard = board.flat();
  for (let i = 0; i < WIN_LINES.length; i++) {
    const [a, b, c] = WIN_LINES[i];
    if (flatBoard[a] === player && flatBoard[b] === player && flatBoard[c] === player) {
      return { winner: player, line: [a, b, c] };
    }
  }
  return null;
};
const checkDraw = (board) => {
  return board.flat().every((cell) => cell !== "");
};
const checkEarlyDraw = (board) => {
  const flatBoard = board.flat();
  if (flatBoard.every((cell) => cell !== "")) return false;
  for (let i = 0; i < WIN_LINES.length; i++) {
    const [a, b, c] = WIN_LINES[i];
    const cells = [flatBoard[a], flatBoard[b], flatBoard[c]];
    const hasX = cells.includes(PLAYERS.X);
    const hasO = cells.includes(PLAYERS.O);
    if (!(hasX && hasO)) {
      return false;
    }
  }
  return true;
};
const unflatten = (flat) => {
  return [flat.slice(0, 3), flat.slice(3, 6), flat.slice(6, 9)];
};
const minimax = (flatBoard, isMaximizing, aiPlayer, alpha, beta, depth) => {
  const opponent = aiPlayer === PLAYERS.X ? PLAYERS.O : PLAYERS.X;
  const board2d = unflatten(flatBoard);
  if (checkWinner(board2d, aiPlayer)) return 10 - depth;
  if (checkWinner(board2d, opponent)) return depth - 10;
  if (flatBoard.every((cell) => cell !== "")) return 0;
  const emptyCells = [];
  for (let i = 0; i < 9; i++) {
    if (flatBoard[i] === "") emptyCells.push(i);
  }
  if (isMaximizing) {
    let best = -Infinity;
    for (const idx of emptyCells) {
      flatBoard[idx] = aiPlayer;
      const score = minimax(flatBoard, false, aiPlayer, alpha, beta, depth + 1);
      flatBoard[idx] = "";
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const idx of emptyCells) {
      flatBoard[idx] = opponent;
      const score = minimax(flatBoard, true, aiPlayer, alpha, beta, depth + 1);
      flatBoard[idx] = "";
      best = Math.min(best, score);
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
};
const getAIMoveHard = (board, aiPlayer) => {
  const flatBoard = [...board.flat()];
  let bestScore = -Infinity;
  let bestMove = -1;
  for (let i = 0; i < 9; i++) {
    if (flatBoard[i] === "") {
      flatBoard[i] = aiPlayer;
      const score = minimax(flatBoard, false, aiPlayer, -Infinity, Infinity, 1);
      flatBoard[i] = "";
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }
  return bestMove;
};
const getAIMoveEasy = (board) => {
  const flatBoard = board.flat();
  const emptyCells = flatBoard.map((cell, i) => cell === "" ? i : -1).filter((i) => i !== -1);
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
};
const getAIMoveMedium = (board, aiPlayer) => {
  const opponent = aiPlayer === PLAYERS.X ? PLAYERS.O : PLAYERS.X;
  const flatBoard = board.flat();
  const emptyCells = flatBoard.map((cell, index) => cell === "" ? index : -1).filter((index) => index !== -1);
  for (let i = 0; i < emptyCells.length; i++) {
    const move = emptyCells[i];
    const tempBoard = [...flatBoard];
    tempBoard[move] = aiPlayer;
    if (checkWinner(unflatten(tempBoard), aiPlayer)) return move;
  }
  for (let i = 0; i < emptyCells.length; i++) {
    const move = emptyCells[i];
    const tempBoard = [...flatBoard];
    tempBoard[move] = opponent;
    if (checkWinner(unflatten(tempBoard), opponent)) return move;
  }
  if (emptyCells.includes(4)) return 4;
  const corners = [0, 2, 6, 8];
  const availableCorners = corners.filter((corner) => emptyCells.includes(corner));
  if (availableCorners.length > 0) {
    return availableCorners[Math.floor(Math.random() * availableCorners.length)];
  }
  const sides = [1, 3, 5, 7];
  const availableSides = sides.filter((side) => emptyCells.includes(side));
  if (availableSides.length > 0) {
    return availableSides[Math.floor(Math.random() * availableSides.length)];
  }
  return emptyCells[0];
};
const getAIMove = (board, aiPlayer, difficulty) => {
  switch (difficulty) {
    case DIFFICULTIES.EASY:
      return getAIMoveEasy(board);
    case DIFFICULTIES.HARD:
      return getAIMoveHard(board, aiPlayer);
    case DIFFICULTIES.MEDIUM:
    default:
      return getAIMoveMedium(board, aiPlayer);
  }
};
const ConfettiEngine = (() => {
  let animFrame = null;
  let particles = [];
  let canvas = null;
  let ctx = null;
  let cssW = 0;
  let cssH = 0;
  const PARTICLE_COUNT = 80;
  const COLORS = ["#FF007F", "#00FFFF", "#FFFF00", "#FF6600", "#00FF00", "#FF00FF", "#4488FF"];
  const GRAVITY = 0.12;
  const FRICTION = 0.99;
  const createParticle = (canvasW, canvasH) => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 8;
    return {
      x: canvasW / 2 + (Math.random() - 0.5) * 100,
      y: canvasH / 2 - 50,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 3 + Math.random() * 5,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      life: 1,
      decay: 5e-3 + Math.random() * 8e-3,
      shape: Math.random() > 0.5 ? "rect" : "circle"
    };
  };
  let lastTime = 0;
  const update = (now) => {
    animFrame = null;
    if (!canvas || !ctx || document.hidden) return;
    const dt60 = lastTime ? Math.min(now - lastTime, 50) / (1e3 / 60) : 1;
    lastTime = now;
    ctx.clearRect(0, 0, cssW, cssH);
    let alive = false;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.life <= 0) continue;
      alive = true;
      p.x += p.vx * dt60;
      p.y += p.vy * dt60;
      p.vy += GRAVITY * dt60;
      p.vx *= Math.pow(FRICTION, dt60);
      p.rotation += p.rotationSpeed * dt60;
      p.life -= p.decay * dt60;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation * Math.PI / 180);
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      if (p.shape === "rect") {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    if (alive) {
      animFrame = requestAnimationFrame(update);
    } else {
      stop();
    }
  };
  const start = (canvasEl) => {
    stop();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    canvas = canvasEl;
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cssW = window.innerWidth;
    cssH = window.innerHeight;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    ctx.scale(dpr, dpr);
    lastTime = 0;
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle(cssW, cssH));
    }
    animFrame = requestAnimationFrame(update);
  };
  const stop = () => {
    if (animFrame) {
      cancelAnimationFrame(animFrame);
      animFrame = null;
    }
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    particles = [];
  };
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (animFrame) cancelAnimationFrame(animFrame);
      animFrame = null;
    } else if (particles.length && !animFrame) {
      lastTime = 0;
      animFrame = requestAnimationFrame(update);
    }
  });
  window.addEventListener("resize", () => {
    if (!canvas || !ctx) return;
    cssW = innerWidth;
    cssH = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  });
  return { start, stop };
})();
const RulesModal = ({ onClose }) => {
  const closeRef = React.useRef(null);
  const modalRef = React.useRef(null);
  React.useEffect(() => {
    const prevFocus = document.activeElement;
    if (closeRef.current) closeRef.current.focus();
    return () => {
      if (prevFocus && typeof prevFocus.focus === "function") {
        prevFocus.focus();
      }
    };
  }, []);
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
  const handleModalKeyDown = (e) => {
    if (e.key !== "Tab") return;
    const focusable = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "modal-overlay",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": "Game rules",
      onKeyDown: handleModalKeyDown,
      ref: modalRef,
      onClick: (e) => {
        if (e.target === e.currentTarget) onClose();
      }
    },
    /* @__PURE__ */ React.createElement("div", { className: "modal-content" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        ref: closeRef,
        onClick: onClose,
        className: "modal-close-button",
        "aria-label": "Close rules"
      },
      "×"
    ), /* @__PURE__ */ React.createElement("h2", { className: "text-3xl font-bold text-cyan-400 mb-4 text-shadow-neon" }, "Game Rules: Tic-Tac-Toe"), /* @__PURE__ */ React.createElement("p", { className: "text-gray-200 mb-2" }, "The classic game of Tic-Tac-Toe! Get three of your marks ('X' or 'O') in a row, column, or diagonal to win."), /* @__PURE__ */ React.createElement("h3", { className: "text-xl font-bold text-blue-300 mt-4 mb-2" }, "How to Play:"), /* @__PURE__ */ React.createElement("ul", { className: "list-disc list-inside text-gray-200 space-y-2" }, /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "Choose a Mode:"), ' Select "1 vs 1 (Local)" to play against another person on the same device, or "1 vs AI" to challenge the computer.'), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "Take Turns:"), " Players take turns placing their mark ('X' or 'O') into an empty square on the 3x3 grid."), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "Win Condition:"), " The first player to get three of their marks in a horizontal, vertical, or diagonal row wins the game."), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "Draw:"), " If all 9 squares are filled and no player has achieved three in a row, the game is a draw. The game also detects early draws when no winning lines remain possible."), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "Difficulty:"), " In AI mode, choose ", /* @__PURE__ */ React.createElement("strong", null, "Easy"), " (random), ", /* @__PURE__ */ React.createElement("strong", null, "Medium"), " (heuristic), or ", /* @__PURE__ */ React.createElement("strong", null, "Hard"), " (unbeatable minimax)."), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "First Move:"), " In AI mode, you can choose to play as X (go first) or O (go second)."), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "Undo:"), " Click the ", /* @__PURE__ */ React.createElement("strong", null, '"Undo"'), " button to take back your last move. In AI mode, this undoes both your move and the AI's response."), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "Replay:"), " After a game ends, click ", /* @__PURE__ */ React.createElement("strong", null, '"Replay"'), " to step through the move history one move at a time."), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "Pause/Resume:"), " Click the ", /* @__PURE__ */ React.createElement("strong", null, '"Pause"'), " button to temporarily stop the game and blur the screen. Click ", /* @__PURE__ */ React.createElement("strong", null, '"Resume"'), " to continue."), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "Custom Names:"), " Enter nicknames on the start screen to personalise the game."), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "Themes:"), " Switch between Neon Pink, Classic, and Retro Green board themes."), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "New Game:"), ' Click the "New Game" button to start over.')))
  );
};
const PhysicalMark = ({ mark, pieceId }) => {
  const x = mark === PLAYERS.X;
  const shape = x ? "M22 10 50 38 78 10 90 22 62 50 90 78 78 90 50 62 22 90 10 78 38 50 10 22Z" : "M50 9a41 41 0 1 0 0 82a41 41 0 1 0 0-82Z M50 29a21 21 0 1 1 0 42a21 21 0 1 1 0-42Z";
  const id = "piece-face-" + pieceId;
  return /* @__PURE__ */ React.createElement("svg", { className: `physical-mark ${x ? "x-color" : "o-color"}`, viewBox: "0 0 100 108", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id, x1: ".1", y1: "0", x2: ".8", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0", stopColor: "#fff9f5" }), /* @__PURE__ */ React.createElement("stop", { offset: ".20", stopColor: "currentColor" }), /* @__PURE__ */ React.createElement("stop", { offset: ".7", stopColor: "currentColor" }), /* @__PURE__ */ React.createElement("stop", { offset: "1", stopColor: "#121d24" }))), /* @__PURE__ */ React.createElement("path", { d: shape, fill: "#090d14", fillRule: "evenodd", transform: "translate(0 7)", opacity: ".65" }), /* @__PURE__ */ React.createElement("path", { d: shape, fill: "currentColor", fillRule: "evenodd", transform: "translate(0 4)", stroke: "#06111d", strokeWidth: "1.8" }), /* @__PURE__ */ React.createElement("path", { d: shape, fill: `url(#${id})`, fillRule: "evenodd", stroke: "currentColor", strokeWidth: "1" }), /* @__PURE__ */ React.createElement("path", { d: shape, fill: "none", fillRule: "evenodd", stroke: "#ffffffb0", strokeWidth: "1.3", transform: "translate(-.5 -.5)" }), x ? /* @__PURE__ */ React.createElement("path", { d: "M24 17 48 41 M17 25 40 48", stroke: "#fff", strokeWidth: "2", opacity: ".65", fill: "none" }) : /* @__PURE__ */ React.createElement("path", { d: "M19 46a32 32 0 0 1 37-28", stroke: "#fff", strokeWidth: "2.2", opacity: ".7", fill: "none" }));
};
const Cell = ({ value, onClick, row, col, ghostMark, canInteract, entranceDelay }) => {
  const [hovered, setHovered] = React.useState(false);
  const isOccupied = !!value;
  const showGhost = window.matchMedia("(hover: hover)").matches && hovered && !isOccupied && canInteract && ghostMark;
  const entranceStyle = {
    "--stone-x": `${col * 50}%`,
    "--stone-y": `${row * 50}%`,
    ...entranceDelay !== void 0 ? { animationDelay: `${entranceDelay}ms` } : {}
  };
  const entranceClass = entranceDelay !== void 0 ? "cell-entrance" : "";
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `cell rounded-lg transition-all duration-200 ${isOccupied ? "occupied" : "cursor-pointer"} ${entranceClass}`,
      style: entranceStyle,
      onClick: isOccupied ? void 0 : onClick,
      onKeyDown: isOccupied ? void 0 : (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      },
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
      role: "gridcell",
      tabIndex: isOccupied ? "-1" : "0",
      "aria-disabled": isOccupied ? "true" : void 0,
      "aria-label": `Row ${row + 1}, column ${col + 1}${value ? `, marked ${value}` : ", empty"}`
    },
    value && /* @__PURE__ */ React.createElement("div", { className: `cell-content ${value === PLAYERS.X ? "x-color" : "o-color"}`, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(PhysicalMark, { mark: value, pieceId: `${row}-${col}` })),
    showGhost && /* @__PURE__ */ React.createElement("div", { className: `cell-ghost ${ghostMark === PLAYERS.X ? "x-color" : "o-color"}`, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(PhysicalMark, { mark: ghostMark, pieceId: `ghost-${row}-${col}` }))
  );
};
const WinLineOverlay = ({ winningLine }) => {
  if (!winningLine) return null;
  const [c1, , c3] = winningLine;
  const row1 = Math.floor(c1 / 3);
  const col1 = c1 % 3;
  const row3 = Math.floor(c3 / 3);
  const col3 = c3 % 3;
  const x1 = col1 + 0.5;
  const y1 = row1 + 0.5;
  const x2 = col3 + 0.5;
  const y2 = row3 + 0.5;
  return /* @__PURE__ */ React.createElement(
    "svg",
    {
      className: "win-line-svg",
      viewBox: "0 0 3 3",
      preserveAspectRatio: "none",
      "aria-hidden": "true",
      style: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 10
      }
    },
    /* @__PURE__ */ React.createElement(
      "line",
      {
        x1,
        y1,
        x2,
        y2,
        stroke: getComputedStyle(document.documentElement).getPropertyValue("--theme-win-line").trim() || "#FFFF00",
        strokeWidth: "0.12",
        strokeLinecap: "round",
        pathLength: "1",
        style: { filter: "drop-shadow(0 0 3px #FFFF00)" }
      }
    )
  );
};
const PRO_VARIANTS = {
  four: { title: "4 × 4", subtitle: "Make four in a row on the larger board." },
  misere: { title: "Misère", subtitle: "Making three in a row loses." },
  ultimate: { title: "Ultimate", subtitle: "Your move sends the opponent to that matching mini-board." },
  puzzles: { title: "Tactics Lab", subtitle: "Win, block, and build forks from crafted positions." },
  coach: { title: "Teaching AI", subtitle: "Play the bot with live, plain-language strategy coaching." }
};
const TACTICAL_PUZZLES = [
  { title: "Win in one", goal: "Finish the row.", board: ["X", "X", "", "O", "O", "", "", "", ""], answers: [2] },
  { title: "Block the threat", goal: "Stop O from winning.", board: ["O", "", "X", "O", "X", "", "", "", ""], answers: [6] },
  { title: "Build a fork", goal: "Create two winning threats.", board: ["X", "", "", "O", "X", "", "", "", "O"], answers: [1, 2] },
  { title: "Force the draw", goal: "Find the only safe square.", board: ["O", "", "X", "X", "O", "", "O", "X", ""], answers: [8] }
];
const lineResult = (cells, size, needed = size) => {
  const lines = [];
  for (let r = 0; r < size; r++) lines.push(Array.from({ length: size }, (_, c) => r * size + c));
  for (let c = 0; c < size; c++) lines.push(Array.from({ length: size }, (_, r) => r * size + c));
  lines.push(Array.from({ length: size }, (_, i) => i * size + i));
  lines.push(Array.from({ length: size }, (_, i) => i * size + (size - 1 - i)));
  for (const line of lines) {
    for (let start = 0; start <= line.length - needed; start++) {
      const run = line.slice(start, start + needed);
      const mark = cells[run[0]];
      if (mark && run.every((i) => cells[i] === mark)) return { mark, line: run };
    }
  }
  return null;
};
const coachAdvice = (cells) => {
  const empty = cells.map((v, i) => v ? -1 : i).filter((i) => i >= 0);
  for (const mark of ["X", "O"]) {
    for (const i of empty) {
      const copy = [...cells];
      copy[i] = mark;
      if (lineResult(copy, 3, 3)) return mark === "X" ? `Winning move: square ${i + 1} completes your line.` : `Block square ${i + 1}—the bot can win there next.`;
    }
  }
  if (!cells[4]) return "Own the center: it belongs to four possible winning lines.";
  const openCorners = [0, 2, 6, 8].filter((i) => !cells[i]);
  if (openCorners.length) return `Try corner ${openCorners[0] + 1}. Corners create more fork chances than edges.`;
  return "Look for a fork: a move that creates two different winning squares.";
};
const ProTicTacToe = ({ kind, onExit }) => {
  const isUltimate = kind === "ultimate";
  const isFour = kind === "four";
  const isPuzzle = kind === "puzzles";
  const isCoach = kind === "coach";
  const size = isFour ? 4 : 3;
  const fresh = () => Array(isUltimate ? 81 : size * size).fill("");
  const [cells, setCells] = React.useState(fresh);
  const [turn, setTurn] = React.useState("X");
  const [status, setStatus] = React.useState(PRO_VARIANTS[kind].subtitle);
  const [over, setOver] = React.useState(false);
  const [activeMini, setActiveMini] = React.useState(null);
  const [miniWinners, setMiniWinners] = React.useState(Array(9).fill(""));
  const [puzzleIndex, setPuzzleIndex] = React.useState(0);
  const aiTimer = React.useRef(null);
  const reset = React.useCallback((nextPuzzle2 = puzzleIndex) => {
    clearTimeout(aiTimer.current);
    const initial = isPuzzle ? [...TACTICAL_PUZZLES[nextPuzzle2].board] : fresh();
    setCells(initial);
    setTurn("X");
    setOver(false);
    setActiveMini(null);
    setMiniWinners(Array(9).fill(""));
    setStatus(isPuzzle ? TACTICAL_PUZZLES[nextPuzzle2].goal : isCoach ? coachAdvice(initial) : PRO_VARIANTS[kind].subtitle);
  }, [kind, puzzleIndex]);
  React.useEffect(() => {
    reset(puzzleIndex);
    return () => clearTimeout(aiTimer.current);
  }, [kind, puzzleIndex]);
  const finishStandardMove = (next, mark, index) => {
    if (isPuzzle) {
      if (TACTICAL_PUZZLES[puzzleIndex].answers.includes(index)) {
        setCells(next);
        setOver(true);
        setStatus("Solved! That is the key move.");
        SoundEngine.playVictory();
      } else {
        setStatus("That move misses the tactic. Try another square.");
        SoundEngine.playDraw();
      }
      return;
    }
    const result = lineResult(next, size, size);
    if (result) {
      const winnerMark = kind === "misere" ? mark === "X" ? "O" : "X" : mark;
      setCells(next);
      setOver(true);
      setStatus(kind === "misere" ? `${mark} made a line—${winnerMark} wins!` : `${winnerMark} wins!`);
      SoundEngine.playVictory();
      return;
    }
    if (next.every(Boolean)) {
      setCells(next);
      setOver(true);
      setStatus("Draw!");
      return;
    }
    setCells(next);
    setTurn(mark === "X" ? "O" : "X");
    setStatus(isCoach ? coachAdvice(next) : `${mark === "X" ? "O" : "X"} to move`);
  };
  const makeMove = (index) => {
    if (over || cells[index]) return;
    if (isCoach && turn === "O") return;
    if (isUltimate) {
      const mini = Math.floor(index / 9);
      if (miniWinners[mini] || activeMini !== null && mini !== activeMini) return;
      const next2 = [...cells];
      next2[index] = turn;
      const local = next2.slice(mini * 9, mini * 9 + 9);
      const localResult = lineResult(local, 3, 3);
      const winners = [...miniWinners];
      if (localResult) winners[mini] = turn;
      else if (local.every(Boolean)) winners[mini] = "D";
      const globalResult = lineResult(winners.map((v) => v === "D" ? "" : v), 3, 3);
      const destination = index % 9;
      setCells(next2);
      setMiniWinners(winners);
      if (globalResult) {
        setOver(true);
        setStatus(`${turn} conquers the Ultimate board!`);
        SoundEngine.playVictory();
        return;
      }
      if (winners.every(Boolean)) {
        setOver(true);
        setStatus("Ultimate draw!");
        return;
      }
      setActiveMini(winners[destination] ? null : destination);
      setTurn(turn === "X" ? "O" : "X");
      setStatus(`${turn === "X" ? "O" : "X"}: play ${winners[destination] ? "on any open board" : `mini-board ${destination + 1}`}`);
      return;
    }
    const next = [...cells];
    next[index] = turn;
    finishStandardMove(next, turn, index);
    if (isCoach && turn === "X" && !lineResult(next, 3, 3) && next.some((v) => !v)) {
      aiTimer.current = setTimeout(() => {
        const aiIndex = getAIMove(unflatten(next), "O", DIFFICULTIES.MEDIUM);
        if (aiIndex >= 0) {
          const afterAI = [...next];
          afterAI[aiIndex] = "O";
          finishStandardMove(afterAI, "O", aiIndex);
        }
      }, 500);
    }
  };
  const nextPuzzle = () => setPuzzleIndex((i) => (i + 1) % TACTICAL_PUZZLES.length);
  return /* @__PURE__ */ React.createElement("div", { className: "mini-shell min-h-screen bg-gray-900 text-white flex items-center justify-center p-4" }, /* @__PURE__ */ React.createElement("div", { className: "variant-layout w-full max-w-2xl bg-black/50 border border-cyan-700 rounded-2xl p-5 text-center shadow-2xl" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center gap-3 mb-3" }, /* @__PURE__ */ React.createElement("button", { className: "action-btn px-3 py-2 bg-gray-700 rounded-lg", onClick: onExit }, "← Modes"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "text-3xl font-black text-cyan-300" }, PRO_VARIANTS[kind].title), isPuzzle && /* @__PURE__ */ React.createElement("b", { className: "text-yellow-300" }, TACTICAL_PUZZLES[puzzleIndex].title)), /* @__PURE__ */ React.createElement("button", { className: "action-btn px-3 py-2 bg-purple-700 rounded-lg", onClick: () => reset() }, "Reset")), /* @__PURE__ */ React.createElement("p", { className: "min-h-[3rem] text-cyan-100 bg-cyan-950/60 rounded-lg p-3 mb-4", role: "status" }, status), isUltimate ? /* @__PURE__ */ React.createElement("div", { className: "variant-board grid grid-cols-3 gap-2 max-w-[560px] mx-auto" }, Array.from({ length: 9 }, (_, mini) => /* @__PURE__ */ React.createElement("div", { key: mini, className: `relative grid grid-cols-3 gap-1 p-1 rounded-lg border-2 ${activeMini === null || activeMini === mini ? "border-cyan-400" : "border-gray-700 opacity-60"} ${miniWinners[mini] ? "bg-purple-950" : "bg-gray-800"}` }, Array.from({ length: 9 }, (_2, local) => {
    const idx = mini * 9 + local;
    return /* @__PURE__ */ React.createElement("button", { key: local, onClick: () => makeMove(idx), "aria-label": `Board ${mini + 1}, square ${local + 1}${cells[idx] ? `, ${cells[idx]}` : ", empty"}`, className: "aspect-square rounded bg-gray-950 text-lg sm:text-2xl font-black hover:bg-cyan-950 disabled:opacity-50", disabled: !!cells[idx] || !!miniWinners[mini] || activeMini !== null && activeMini !== mini }, cells[idx] && /* @__PURE__ */ React.createElement(PhysicalMark, { mark: cells[idx], pieceId: `ultimate-${mini}-${local}` }));
  }), miniWinners[mini] && /* @__PURE__ */ React.createElement("span", { className: "absolute inset-0 flex items-center justify-center bg-black/70 text-6xl font-black text-yellow-300 pointer-events-none" }, miniWinners[mini] === "D" ? "•" : /* @__PURE__ */ React.createElement(PhysicalMark, { mark: miniWinners[mini], pieceId: `board-winner-${mini}` }))))) : /* @__PURE__ */ React.createElement("div", { className: `variant-board grid gap-2 mx-auto max-w-[480px] ${isFour ? "grid-cols-4" : "grid-cols-3"}` }, cells.map((v, i) => /* @__PURE__ */ React.createElement("button", { key: i, onClick: () => makeMove(i), disabled: !!v || over || isCoach && turn === "O", "aria-label": `Square ${i + 1}`, className: "aspect-square rounded-xl border-2 border-cyan-700 bg-gray-950 text-4xl sm:text-6xl font-black hover:bg-cyan-950 disabled:cursor-default" }, v && /* @__PURE__ */ React.createElement(PhysicalMark, { mark: v, pieceId: `variant-${i}` })))), /* @__PURE__ */ React.createElement("div", { className: "mt-4 flex justify-center gap-3" }, isPuzzle && /* @__PURE__ */ React.createElement("button", { onClick: nextPuzzle, className: "action-btn px-5 py-2 rounded-lg bg-green-700" }, "Next Puzzle"), isCoach && /* @__PURE__ */ React.createElement("span", { className: "text-sm text-gray-300" }, "Squares are numbered left-to-right, top-to-bottom."))));
};
const TicTacToeGame = () => {
  const emptyBoard = () => Array(3).fill(null).map(() => Array(3).fill(""));
  const [board, setBoard] = React.useState(emptyBoard());
  const [currentPlayer, setCurrentPlayer] = React.useState(PLAYERS.X);
  const [gameMode, setGameMode] = React.useState(null);
  const [difficulty, setDifficulty] = React.useState(DIFFICULTIES.MEDIUM);
  const [winner, setWinner] = React.useState(null);
  const [winningLine, setWinningLine] = React.useState(null);
  const [message, setMessage] = React.useState("");
  const [showRules, setShowRules] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [aiThinking, setAiThinking] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(SoundEngine.isMuted());
  const [proMode, setProMode] = React.useState(null);
  const [moveHistory, setMoveHistory] = React.useState([]);
  const [streakPvp, setStreakPvp] = React.useState(() => loadStreak(STREAK_KEY_PVP));
  const [streakPvai, setStreakPvai] = React.useState(() => loadStreak(STREAK_KEY_PVAI));
  const [boardKey, setBoardKey] = React.useState(0);
  const [humanPlayer, setHumanPlayer] = React.useState(PLAYERS.X);
  const [aiPlayer, setAiPlayer] = React.useState(PLAYERS.O);
  const [choosingFirstMove, setChoosingFirstMove] = React.useState(false);
  const [gameMoves, setGameMoves] = React.useState([]);
  const [isReplaying, setIsReplaying] = React.useState(false);
  const [replayStep, setReplayStep] = React.useState(0);
  const replayTimeoutRef = React.useRef(null);
  const [nameX, setNameX] = React.useState("");
  const [nameO, setNameO] = React.useState("");
  const [theme, setTheme] = React.useState(() => loadTheme());
  const confettiCanvasRef = React.useRef(null);
  const [earlyDrawMessage, setEarlyDrawMessage] = React.useState("");
  const [statsPvp, setStatsPvp] = React.useState(() => loadStats(STATS_KEY_PVP));
  const [statsPvai, setStatsPvai] = React.useState(() => loadStats(STATS_KEY_PVAI));
  const [confirmingStatsReset, setConfirmingStatsReset] = React.useState(false);
  const statsResetTimeoutRef = React.useRef(null);
  const aiTimeoutRef = React.useRef(null);
  const boardRef = React.useRef(board);
  React.useEffect(() => {
    boardRef.current = board;
  }, [board]);
  const difficultyRef = React.useRef(difficulty);
  React.useEffect(() => {
    difficultyRef.current = difficulty;
  }, [difficulty]);
  const gridRef = React.useRef(null);
  const winButtonRef = React.useRef(null);
  React.useEffect(() => {
    if (theme === "neon-pink") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme]);
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    saveTheme(newTheme);
  };
  React.useEffect(() => {
    return () => {
      if (aiTimeoutRef.current !== null) {
        clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = null;
      }
      if (replayTimeoutRef.current !== null) {
        clearTimeout(replayTimeoutRef.current);
        replayTimeoutRef.current = null;
      }
      if (statsResetTimeoutRef.current !== null) {
        clearTimeout(statsResetTimeoutRef.current);
        statsResetTimeoutRef.current = null;
      }
      ConfettiEngine.stop();
    };
  }, []);
  const getPlayerName = (mark) => {
    if (mark === PLAYERS.X) {
      return nameX || "Player X";
    }
    return nameO || "Player O";
  };
  const recordOutcome = React.useCallback((outcome) => {
    if (!gameMode) return;
    const key = gameMode === GAME_MODES.PVP ? STATS_KEY_PVP : STATS_KEY_PVAI;
    const streakKey = gameMode === GAME_MODES.PVP ? STREAK_KEY_PVP : STREAK_KEY_PVAI;
    const setter = gameMode === GAME_MODES.PVP ? setStatsPvp : setStatsPvai;
    const streakSetter = gameMode === GAME_MODES.PVP ? setStreakPvp : setStreakPvai;
    setter((prev) => {
      const next = { ...prev };
      if (outcome === "draw") {
        next.draws += 1;
      } else if (gameMode === GAME_MODES.PVP) {
        if (outcome === "X_wins") next.wins += 1;
        else next.losses += 1;
      } else {
        const humanWon = outcome === "X_wins" && humanPlayer === PLAYERS.X || outcome === "O_wins" && humanPlayer === PLAYERS.O;
        if (humanWon) next.wins += 1;
        else next.losses += 1;
      }
      saveStats(key, next);
      return next;
    });
    streakSetter((prev) => {
      let isWin = false;
      if (outcome === "draw") {
        return prev;
      } else if (gameMode === GAME_MODES.PVP) {
        isWin = outcome === "X_wins";
      } else {
        isWin = outcome === "X_wins" && humanPlayer === PLAYERS.X || outcome === "O_wins" && humanPlayer === PLAYERS.O;
      }
      const newStreak = isWin ? prev + 1 : 0;
      saveStreak(streakKey, newStreak);
      return newStreak;
    });
  }, [gameMode, humanPlayer]);
  const handleMove = React.useCallback((newBoard, playerMoved, isAIMove) => {
    setBoard(newBoard);
    if (isAIMove) {
      SoundEngine.playAIMove();
    } else if (playerMoved === PLAYERS.X) {
      SoundEngine.playX();
    } else {
      SoundEngine.playO();
    }
    const winResult = checkWinner(newBoard, playerMoved);
    if (winResult) {
      setWinner(winResult.winner);
      setWinningLine(winResult.line);
      setMessage(`${getPlayerName(winResult.winner)} WINS!`);
      setEarlyDrawMessage("");
      SoundEngine.playVictory();
      recordOutcome(winResult.winner === PLAYERS.X ? "X_wins" : "O_wins");
      if (confettiCanvasRef.current) {
        ConfettiEngine.start(confettiCanvasRef.current);
      }
    } else if (checkDraw(newBoard)) {
      setWinner("Draw");
      setMessage("It's a DRAW!");
      setEarlyDrawMessage("");
      SoundEngine.playDraw();
      recordOutcome("draw");
    } else if (checkEarlyDraw(newBoard)) {
      setWinner("Draw");
      setMessage("Draw - No possible wins remaining.");
      setEarlyDrawMessage("Draw - No possible wins remaining.");
      SoundEngine.playDraw();
      recordOutcome("draw");
    } else {
      const nextPlayer = playerMoved === PLAYERS.X ? PLAYERS.O : PLAYERS.X;
      setCurrentPlayer(nextPlayer);
      setMessage(`${getPlayerName(nextPlayer)}'s turn`);
    }
  }, [recordOutcome, nameX, nameO]);
  const handleAIMove = React.useCallback(() => {
    if (gameMode === GAME_MODES.PVAI && currentPlayer === aiPlayer && !winner && !checkDraw(board) && !checkEarlyDraw(board) && !isPaused) {
      setAiThinking(true);
      setMessage("AI is thinking...");
      aiTimeoutRef.current = setTimeout(() => {
        aiTimeoutRef.current = null;
        const latestBoard = boardRef.current;
        const moveIndex = getAIMove(latestBoard, aiPlayer, difficultyRef.current);
        if (moveIndex === -1 || moveIndex === void 0) return;
        const newBoardFlat = [...latestBoard.flat()];
        newBoardFlat[moveIndex] = aiPlayer;
        const updatedBoard = unflatten(newBoardFlat);
        setMoveHistory((prev) => [...prev, { board: latestBoard, currentPlayer: aiPlayer }]);
        setGameMoves((prev) => [...prev, { index: moveIndex, player: aiPlayer }]);
        handleMove(updatedBoard, aiPlayer, true);
        setAiThinking(false);
      }, AI_THINK_DELAY);
    }
  }, [board, currentPlayer, gameMode, winner, isPaused, handleMove, aiPlayer]);
  React.useEffect(() => {
    if (gameMode === GAME_MODES.PVAI && currentPlayer === aiPlayer && !winner && !checkDraw(board) && !checkEarlyDraw(board) && !isPaused && !aiThinking && !isReplaying) {
      handleAIMove();
    }
    return () => {
      if (aiTimeoutRef.current !== null) {
        clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = null;
        setAiThinking(false);
      }
    };
  }, [board, currentPlayer, gameMode, winner, isPaused, handleAIMove, aiPlayer, isReplaying]);
  const handleCellClick = React.useCallback((rowIndex, colIndex) => {
    if (winner || isPaused || aiThinking || isReplaying || board[rowIndex][colIndex] !== "") {
      return;
    }
    if (gameMode === GAME_MODES.PVAI && currentPlayer !== humanPlayer) {
      return;
    }
    setMoveHistory((prev) => [...prev, { board, currentPlayer }]);
    const flatIndex = rowIndex * 3 + colIndex;
    setGameMoves((prev) => [...prev, { index: flatIndex, player: currentPlayer }]);
    const newBoard = board.map((row) => [...row]);
    newBoard[rowIndex][colIndex] = currentPlayer;
    handleMove(newBoard, currentPlayer, false);
  }, [winner, isPaused, aiThinking, isReplaying, board, currentPlayer, handleMove, gameMode, humanPlayer]);
  const handleUndo = React.useCallback(() => {
    if (moveHistory.length === 0 || winner || aiThinking || isPaused || isReplaying) return;
    if (gameMode === GAME_MODES.PVAI && moveHistory.length < 2 && humanPlayer !== PLAYERS.X) return;
    if (gameMode === GAME_MODES.PVAI && moveHistory.length >= 2) {
      const playerState = moveHistory[moveHistory.length - 2];
      setBoard(playerState.board);
      setCurrentPlayer(playerState.currentPlayer);
      setMoveHistory((prev) => prev.slice(0, -2));
      setGameMoves((prev) => prev.slice(0, -2));
      setMessage(`${getPlayerName(playerState.currentPlayer)}'s turn`);
    } else {
      const prevState = moveHistory[moveHistory.length - 1];
      setBoard(prevState.board);
      setCurrentPlayer(prevState.currentPlayer);
      setMoveHistory((prev) => prev.slice(0, -1));
      setGameMoves((prev) => prev.slice(0, -1));
      setMessage(`${getPlayerName(prevState.currentPlayer)}'s turn`);
    }
  }, [moveHistory, winner, aiThinking, isPaused, gameMode, isReplaying, humanPlayer, nameX, nameO]);
  const canUndo = moveHistory.length > 0 && !winner && !aiThinking && !isPaused && !isReplaying && (gameMode !== GAME_MODES.PVAI || moveHistory.length >= 2 || humanPlayer === PLAYERS.X);
  const startReplay = React.useCallback(() => {
    if (gameMoves.length === 0) return;
    setIsReplaying(true);
    setReplayStep(0);
    setBoard(emptyBoard());
    setWinner(null);
    setWinningLine(null);
    setEarlyDrawMessage("");
    setMessage("Replaying...");
  }, [gameMoves]);
  React.useEffect(() => {
    if (!isReplaying) return;
    if (replayStep >= gameMoves.length) {
      replayTimeoutRef.current = setTimeout(() => {
        const finalFlat = Array(9).fill("");
        gameMoves.forEach((m) => {
          finalFlat[m.index] = m.player;
        });
        const finalBoard = unflatten(finalFlat);
        setBoard(finalBoard);
        const winX = checkWinner(finalBoard, PLAYERS.X);
        const winO = checkWinner(finalBoard, PLAYERS.O);
        if (winX) {
          setWinner(winX.winner);
          setWinningLine(winX.line);
          setMessage(`${getPlayerName(winX.winner)} WINS!`);
          if (confettiCanvasRef.current) ConfettiEngine.start(confettiCanvasRef.current);
        } else if (winO) {
          setWinner(winO.winner);
          setWinningLine(winO.line);
          setMessage(`${getPlayerName(winO.winner)} WINS!`);
          if (confettiCanvasRef.current) ConfettiEngine.start(confettiCanvasRef.current);
        } else {
          setWinner("Draw");
          setMessage(earlyDrawMessage || "It's a DRAW!");
        }
        setIsReplaying(false);
      }, REPLAY_STEP_DELAY);
      return;
    }
    replayTimeoutRef.current = setTimeout(() => {
      const move = gameMoves[replayStep];
      setBoard((prevBoard) => {
        const flat = [...prevBoard.flat()];
        flat[move.index] = move.player;
        return unflatten(flat);
      });
      setMessage(`Replaying... move ${replayStep + 1}/${gameMoves.length}`);
      setReplayStep((prev) => prev + 1);
    }, REPLAY_STEP_DELAY);
    return () => {
      if (replayTimeoutRef.current) {
        clearTimeout(replayTimeoutRef.current);
        replayTimeoutRef.current = null;
      }
    };
  }, [isReplaying, replayStep, gameMoves, nameX, nameO]);
  const stopReplay = React.useCallback(() => {
    if (replayTimeoutRef.current) {
      clearTimeout(replayTimeoutRef.current);
      replayTimeoutRef.current = null;
    }
    const finalFlat = Array(9).fill("");
    gameMoves.forEach((m) => {
      finalFlat[m.index] = m.player;
    });
    const finalBoard = unflatten(finalFlat);
    setBoard(finalBoard);
    const winX = checkWinner(finalBoard, PLAYERS.X);
    const winO = checkWinner(finalBoard, PLAYERS.O);
    if (winX) {
      setWinner(winX.winner);
      setWinningLine(winX.line);
      setMessage(`${getPlayerName(winX.winner)} WINS!`);
    } else if (winO) {
      setWinner(winO.winner);
      setWinningLine(winO.line);
      setMessage(`${getPlayerName(winO.winner)} WINS!`);
    } else {
      setWinner("Draw");
      setMessage(earlyDrawMessage || "It's a DRAW!");
    }
    setIsReplaying(false);
  }, [gameMoves, nameX, nameO, earlyDrawMessage]);
  const resetGame = () => {
    if (aiTimeoutRef.current !== null) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }
    if (replayTimeoutRef.current !== null) {
      clearTimeout(replayTimeoutRef.current);
      replayTimeoutRef.current = null;
    }
    ConfettiEngine.stop();
    setBoard(emptyBoard());
    setCurrentPlayer(PLAYERS.X);
    setWinner(null);
    setWinningLine(null);
    setMessage("");
    setIsPaused(false);
    setAiThinking(false);
    setMoveHistory([]);
    setGameMoves([]);
    setIsReplaying(false);
    setReplayStep(0);
    setEarlyDrawMessage("");
    setGameMode(null);
    setChoosingFirstMove(false);
    setHumanPlayer(PLAYERS.X);
    setAiPlayer(PLAYERS.O);
    setBoardKey((prev) => prev + 1);
  };
  const startNewGameSameMode = () => {
    if (aiTimeoutRef.current !== null) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }
    if (replayTimeoutRef.current !== null) {
      clearTimeout(replayTimeoutRef.current);
      replayTimeoutRef.current = null;
    }
    ConfettiEngine.stop();
    setBoard(emptyBoard());
    setCurrentPlayer(PLAYERS.X);
    setWinner(null);
    setWinningLine(null);
    setIsPaused(false);
    setAiThinking(false);
    setMoveHistory([]);
    setGameMoves([]);
    setIsReplaying(false);
    setReplayStep(0);
    setEarlyDrawMessage("");
    setBoardKey((prev) => prev + 1);
    if (gameMode === GAME_MODES.PVAI && humanPlayer === PLAYERS.O) {
      setMessage("AI is thinking...");
    } else {
      setMessage(`${getPlayerName(PLAYERS.X)}'s turn`);
    }
  };
  const resetStats = (key) => {
    const empty = { wins: 0, losses: 0, draws: 0 };
    saveStats(key, empty);
    if (key === STATS_KEY_PVP) {
      setStatsPvp(empty);
      setStreakPvp(0);
      saveStreak(STREAK_KEY_PVP, 0);
    } else {
      setStatsPvai(empty);
      setStreakPvai(0);
      saveStreak(STREAK_KEY_PVAI, 0);
    }
  };
  const handleStatsResetClick = () => {
    if (confirmingStatsReset) {
      if (statsResetTimeoutRef.current !== null) {
        clearTimeout(statsResetTimeoutRef.current);
        statsResetTimeoutRef.current = null;
      }
      setConfirmingStatsReset(false);
      resetStats(currentStatsKey);
    } else {
      setConfirmingStatsReset(true);
      statsResetTimeoutRef.current = setTimeout(() => {
        statsResetTimeoutRef.current = null;
        setConfirmingStatsReset(false);
      }, 3e3);
    }
  };
  const handleMuteToggle = () => {
    const nowMuted = SoundEngine.toggleMute();
    setIsMuted(nowMuted);
  };
  React.useEffect(() => {
    if (winner && !isReplaying && winButtonRef.current) {
      winButtonRef.current.focus();
    }
  }, [winner, isReplaying]);
  const startGame = (mode) => {
    if (mode === GAME_MODES.PVAI) {
      setChoosingFirstMove(true);
      setGameMode(mode);
    } else {
      setGameMode(mode);
      setMessage(`${getPlayerName(PLAYERS.X)}'s turn`);
      setMoveHistory([]);
      setGameMoves([]);
      setBoardKey((prev) => prev + 1);
    }
  };
  const chooseFirstMove = (playAs) => {
    setHumanPlayer(playAs);
    const ai = playAs === PLAYERS.X ? PLAYERS.O : PLAYERS.X;
    setAiPlayer(ai);
    setChoosingFirstMove(false);
    setMoveHistory([]);
    setGameMoves([]);
    setBoardKey((prev) => prev + 1);
    if (playAs === PLAYERS.O) {
      setCurrentPlayer(PLAYERS.X);
      setMessage("AI is thinking...");
    } else {
      setCurrentPlayer(PLAYERS.X);
      setMessage(`${nameX || "Player X"}'s turn`);
    }
  };
  const currentStats = gameMode === GAME_MODES.PVP ? statsPvp : statsPvai;
  const currentStatsKey = gameMode === GAME_MODES.PVP ? STATS_KEY_PVP : STATS_KEY_PVAI;
  const currentStreak = gameMode === GAME_MODES.PVP ? streakPvp : streakPvai;
  const cellsInteractive = !winner && !isPaused && !aiThinking && !isReplaying;
  const ghostMark = cellsInteractive ? gameMode === GAME_MODES.PVAI ? humanPlayer : currentPlayer : null;
  if (proMode) return /* @__PURE__ */ React.createElement(ProTicTacToe, { kind: proMode, onExit: () => setProMode(null) });
  if (!gameMode) {
    return /* @__PURE__ */ React.createElement("div", { className: "tic-setup-shell mini-shell min-h-screen relative bg-gray-900 text-white flex flex-col items-center justify-center p-4" }, /* @__PURE__ */ React.createElement("div", { className: "scanline-overlay", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("button", { className: "mute-btn", onClick: handleMuteToggle, "aria-label": isMuted ? "Unmute sounds" : "Mute sounds" }, isMuted ? "🔇" : "🔊"), /* @__PURE__ */ React.createElement("div", { className: "tic-setup-card relative z-10 bg-black/40 rounded-xl shadow-2xl p-6 w-full max-w-md border border-blue-700/50 shadow-blue-900/40 text-center" }, /* @__PURE__ */ React.createElement("h1", { className: "text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent tracking-wider text-shadow-neon" }, "TIC-TAC-TOE"), /* @__PURE__ */ React.createElement("div", { className: "mb-5" }, /* @__PURE__ */ React.createElement("p", { className: "text-cyan-300/60 text-xs mb-2" }, "Enter nicknames (optional):"), /* @__PURE__ */ React.createElement("div", { className: "flex justify-center gap-3 flex-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center gap-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs text-gray-400", htmlFor: "name-x" }, "Player X"), /* @__PURE__ */ React.createElement(
      "input",
      {
        id: "name-x",
        className: "name-input",
        type: "text",
        maxLength: 12,
        placeholder: "Player X",
        value: nameX,
        onChange: (e) => setNameX(e.target.value)
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center gap-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs text-gray-400", htmlFor: "name-o" }, "Player O"), /* @__PURE__ */ React.createElement(
      "input",
      {
        id: "name-o",
        className: "name-input",
        type: "text",
        maxLength: 12,
        placeholder: "Player O",
        value: nameO,
        onChange: (e) => setNameO(e.target.value)
      }
    )))), /* @__PURE__ */ React.createElement("div", { className: "theme-selector mb-5", role: "group", "aria-label": "Board theme" }, THEMES.map((t) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: t.id,
        className: `theme-btn ${t.id} ${theme === t.id ? "active" : ""}`,
        onClick: () => handleThemeChange(t.id),
        "aria-pressed": theme === t.id
      },
      t.label
    ))), /* @__PURE__ */ React.createElement("p", { className: "text-cyan-300/80 mb-6 text-shadow-neon" }, "Choose your challenge:"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col space-y-4", role: "group", "aria-label": "Game mode selection" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => startGame(GAME_MODES.PVP),
        className: "action-btn py-3 px-8 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg shadow-lg shadow-blue-700/50 transition-all duration-200 transform hover:scale-105 active:scale-95 text-xl"
      },
      "1 vs 1 (Local)"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => startGame(GAME_MODES.PVAI),
        className: "action-btn py-3 px-8 bg-green-700 hover:bg-green-800 text-white font-bold rounded-lg shadow-lg shadow-green-700/50 transition-all duration-200 transform hover:scale-105 active:scale-95 text-xl"
      },
      "1 vs AI"
    )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2 mt-4", role: "group", "aria-label": "Advanced modes" }, Object.entries(PRO_VARIANTS).map(([id, info]) => /* @__PURE__ */ React.createElement("button", { key: id, onClick: () => setProMode(id), className: "action-btn py-2 px-2 bg-cyan-900 hover:bg-cyan-800 border border-cyan-500 text-white font-bold rounded-lg text-sm" }, info.title))), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setShowRules(true),
        className: "action-btn mt-8 py-2 px-6 bg-yellow-700 hover:bg-yellow-800 text-white font-bold rounded-lg shadow-lg shadow-yellow-700/50 transition-all duration-200 transform hover:scale-105 active:scale-95"
      },
      "Rules"
    )), showRules && /* @__PURE__ */ React.createElement(RulesModal, { onClose: () => setShowRules(false) }));
  }
  if (choosingFirstMove) {
    return /* @__PURE__ */ React.createElement("div", { className: "mini-shell min-h-screen relative bg-gray-900 text-white flex flex-col items-center justify-center p-4" }, /* @__PURE__ */ React.createElement("div", { className: "scanline-overlay", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("button", { className: "mute-btn", onClick: handleMuteToggle, "aria-label": isMuted ? "Unmute sounds" : "Mute sounds" }, isMuted ? "🔇" : "🔊"), /* @__PURE__ */ React.createElement("div", { className: "relative z-10 bg-black/40 rounded-xl shadow-2xl p-6 w-full max-w-md border border-blue-700/50 shadow-blue-900/40 text-center" }, /* @__PURE__ */ React.createElement("h1", { className: "text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent tracking-wider text-shadow-neon" }, "CHOOSE YOUR SIDE"), /* @__PURE__ */ React.createElement("p", { className: "text-cyan-300/80 mb-6 text-shadow-neon" }, "Do you want to go first or second?"), /* @__PURE__ */ React.createElement("div", { className: "first-move-chooser" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => chooseFirstMove(PLAYERS.X),
        className: "first-move-btn action-btn py-3 px-8 bg-pink-700 hover:bg-pink-800 text-white font-bold rounded-lg shadow-lg shadow-pink-700/50 transition-all duration-200 transform hover:scale-105 active:scale-95 text-lg"
      },
      "Play as X (Go First)"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => chooseFirstMove(PLAYERS.O),
        className: "first-move-btn action-btn py-3 px-8 bg-cyan-700 hover:bg-cyan-800 text-white font-bold rounded-lg shadow-lg shadow-cyan-700/50 transition-all duration-200 transform hover:scale-105 active:scale-95 text-lg"
      },
      "Play as O (Go Second)"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: resetGame,
        className: "action-btn mt-4 py-2 px-6 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 text-sm"
      },
      "Back"
    ))));
  }
  return /* @__PURE__ */ React.createElement("div", { className: "mini-shell min-h-screen relative bg-gray-900 text-white flex flex-col items-center justify-center p-4" }, /* @__PURE__ */ React.createElement("div", { className: "scanline-overlay", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("button", { className: "mute-btn", onClick: handleMuteToggle, "aria-label": isMuted ? "Unmute sounds" : "Mute sounds" }, isMuted ? "🔇" : "🔊"), /* @__PURE__ */ React.createElement("canvas", { ref: confettiCanvasRef, className: "confetti-canvas", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("div", { className: "mini-layout relative z-10 bg-black/40 rounded-xl shadow-2xl p-6 w-full max-w-md border border-blue-700/50 shadow-blue-900/40" }, /* @__PURE__ */ React.createElement("aside", { className: "mini-controls" }, /* @__PURE__ */ React.createElement("h1", { className: "text-4xl md:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent tracking-wider text-shadow-neon" }, "TIC-TAC-TOE"), gameMode === GAME_MODES.PVAI && /* @__PURE__ */ React.createElement("div", { className: "difficulty-selector", role: "group", "aria-label": "AI difficulty" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      className: `difficulty-btn easy ${difficulty === DIFFICULTIES.EASY ? "active" : ""}`,
      onClick: () => setDifficulty(DIFFICULTIES.EASY),
      "aria-pressed": difficulty === DIFFICULTIES.EASY,
      disabled: isPaused
    },
    "Easy"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: `difficulty-btn medium ${difficulty === DIFFICULTIES.MEDIUM ? "active" : ""}`,
      onClick: () => setDifficulty(DIFFICULTIES.MEDIUM),
      "aria-pressed": difficulty === DIFFICULTIES.MEDIUM,
      disabled: isPaused
    },
    "Medium"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: `difficulty-btn hard ${difficulty === DIFFICULTIES.HARD ? "active" : ""}`,
      onClick: () => setDifficulty(DIFFICULTIES.HARD),
      "aria-pressed": difficulty === DIFFICULTIES.HARD,
      disabled: isPaused
    },
    "Hard"
  )), /* @__PURE__ */ React.createElement("div", { className: "theme-selector", role: "group", "aria-label": "Board theme" }, THEMES.map((t) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: t.id,
      className: `theme-btn ${t.id} ${theme === t.id ? "active" : ""}`,
      onClick: () => handleThemeChange(t.id),
      "aria-pressed": theme === t.id
    },
    t.label
  ))), /* @__PURE__ */ React.createElement(
    "p",
    {
      className: "text-center text-cyan-300/80 mb-4 text-shadow-neon",
      style: { color: "var(--theme-text-status)" },
      role: "status",
      "aria-live": "polite",
      "aria-atomic": "true"
    },
    message || `${getPlayerName(currentPlayer)}'s turn`,
    aiThinking && /* @__PURE__ */ React.createElement("span", { className: "ai-thinking-indicator ml-2", "aria-hidden": "true" }, ". . .")
  )), /* @__PURE__ */ React.createElement(
    "div",
    {
      key: boardKey,
      className: "mini-board p-4 rounded-lg shadow-inner mb-4 relative",
      style: {
        backgroundColor: "var(--theme-grid-bg)",
        borderColor: "var(--theme-grid-border)",
        borderWidth: "1px",
        borderStyle: "solid"
      },
      role: "grid",
      "aria-label": "Tic-Tac-Toe board",
      ref: gridRef
    },
    board.map((rowCells, rowIndex) => /* @__PURE__ */ React.createElement("div", { key: `row-${rowIndex}`, role: "row", className: "grid grid-cols-3 gap-2", style: rowIndex < 2 ? { marginBottom: "0.5rem" } : void 0 }, rowCells.map((cellValue, colIndex) => {
      const flatIdx = rowIndex * 3 + colIndex;
      return /* @__PURE__ */ React.createElement(
        Cell,
        {
          key: `${rowIndex}-${colIndex}`,
          value: cellValue,
          row: rowIndex,
          col: colIndex,
          onClick: () => handleCellClick(rowIndex, colIndex),
          ghostMark,
          canInteract: cellsInteractive,
          entranceDelay: flatIdx * 50
        }
      );
    }))),
    winner && winner !== "Draw" && !isReplaying && /* @__PURE__ */ React.createElement(WinLineOverlay, { winningLine })
  ), /* @__PURE__ */ React.createElement("div", { className: "mini-bottom" }, /* @__PURE__ */ React.createElement("div", { className: "stats-bar", "aria-label": "Game statistics" }, gameMode === GAME_MODES.PVP ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "stat-win", title: `${getPlayerName(PLAYERS.X)} wins` }, getPlayerName(PLAYERS.X), ": ", currentStats.wins), /* @__PURE__ */ React.createElement("span", { className: "stat-loss", title: `${getPlayerName(PLAYERS.O)} wins` }, getPlayerName(PLAYERS.O), ": ", currentStats.losses)) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "stat-win", title: "Wins" }, "W: ", currentStats.wins), /* @__PURE__ */ React.createElement("span", { className: "stat-loss", title: "Losses" }, "L: ", currentStats.losses)), /* @__PURE__ */ React.createElement("span", { className: "stat-draw", title: "Draws" }, "D: ", currentStats.draws), /* @__PURE__ */ React.createElement("span", { className: "stat-streak", title: "Win Streak" }, "Streak: ", currentStreak), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "stats-reset-btn",
      onClick: handleStatsResetClick,
      "aria-label": confirmingStatsReset ? "Tap again to confirm resetting statistics" : "Reset statistics",
      title: "Reset stats"
    },
    confirmingStatsReset ? "Sure?" : "Reset"
  )), /* @__PURE__ */ React.createElement("div", { className: "flex justify-center space-x-3 flex-wrap gap-y-2" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setShowRules(true),
      className: "action-btn py-2 px-4 bg-yellow-700 hover:bg-yellow-800 text-white font-bold rounded-lg shadow-lg shadow-yellow-700/50 transition-all duration-200 transform hover:scale-105 active:scale-95",
      disabled: isPaused,
      "aria-label": "Show game rules"
    },
    "Rules"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleUndo,
      className: "action-btn py-2 px-4 bg-orange-700 hover:bg-orange-800 text-white font-bold rounded-lg shadow-lg shadow-orange-700/50 transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none",
      disabled: !canUndo,
      "aria-label": "Undo last move"
    },
    "Undo"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setIsPaused(!isPaused),
      className: "action-btn py-2 px-4 bg-gray-700 hover:bg-gray-800 text-white font-bold rounded-lg shadow-lg shadow-gray-700/50 transition-all duration-200 transform hover:scale-105 active:scale-95",
      disabled: winner !== null || isReplaying,
      "aria-label": isPaused ? "Resume game" : "Pause game"
    },
    isPaused ? "Resume" : "Pause"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: resetGame,
      className: "action-btn py-2 px-4 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg shadow-lg shadow-purple-700/50 transition-all duration-200 transform hover:scale-105 active:scale-95",
      disabled: isPaused,
      "aria-label": "Start a new game"
    },
    "New Game"
  ))), winner && !isReplaying && /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 fade-in pointer-events-none rounded-xl", role: "alert", "aria-live": "assertive" }, /* @__PURE__ */ React.createElement("h2", { className: `text-5xl font-bold text-yellow-300 text-shadow-neon ${winner !== "Draw" ? "win-animation" : ""}` }, winner === "Draw" ? earlyDrawMessage || "IT'S A DRAW!" : `${getPlayerName(winner)} WINS!`), /* @__PURE__ */ React.createElement("div", { className: "flex gap-3 mt-6 flex-wrap justify-center" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      ref: winButtonRef,
      onClick: startNewGameSameMode,
      className: "action-btn py-2 px-6 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg shadow-lg shadow-purple-700/50 transition-all duration-200 transform hover:scale-105 active:scale-95 pointer-events-auto"
    },
    "Play Again"
  ), gameMoves.length > 0 && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: startReplay,
      className: "action-btn py-2 px-6 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg shadow-lg shadow-teal-700/50 transition-all duration-200 transform hover:scale-105 active:scale-95 pointer-events-auto"
    },
    "Replay"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: resetGame,
      className: "action-btn py-2 px-6 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg shadow-lg shadow-gray-600/50 transition-all duration-200 transform hover:scale-105 active:scale-95 pointer-events-auto"
    },
    "Menu"
  ))), isReplaying && /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 flex flex-col items-center justify-end pb-8 pointer-events-none rounded-xl" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: stopReplay,
      className: "action-btn py-2 px-6 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg shadow-lg shadow-red-700/50 transition-all duration-200 transform hover:scale-105 active:scale-95 pointer-events-auto"
    },
    "Stop Replay"
  )), isPaused && /* @__PURE__ */ React.createElement("div", { className: "pause-overlay", role: "alert", "aria-live": "assertive" }, "PAUSED"), showRules && /* @__PURE__ */ React.createElement(RulesModal, { onClose: () => setShowRules(false) })));
};
ReactDOM.render(/* @__PURE__ */ React.createElement(TicTacToeGame, null), document.getElementById("root"));
