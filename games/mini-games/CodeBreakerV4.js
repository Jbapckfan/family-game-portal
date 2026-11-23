// Generated from CodeBreakerV4.jsx by tools/build-react-games.mjs; do not edit.
"use strict";
const AudioSystem = /* @__PURE__ */ (() => {
  let ctx;
  const getCtx = () => ctx || (ctx = new (window.AudioContext || window.webkitAudioContext)());
  return {
    play(freq, duration = 0.15, type = "sine") {
      try {
        const c = getCtx();
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = type;
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.1, c.currentTime);
        g.gain.exponentialRampToValueAtTime(1e-3, c.currentTime + duration);
        o.connect(g).connect(c.destination);
        o.start();
        o.stop(c.currentTime + duration);
      } catch (e) {
      }
    }
  };
})();
const COLOR_NAMES = {
  "#FF007F": "Pink",
  "#00E5FF": "Cyan",
  "#00FFFF": "Cyan",
  "#76FF03": "Green",
  "#00FF00": "Green",
  "#FFD600": "Yellow",
  "#FFFF00": "Yellow",
  "#FF3D00": "Orange",
  "#FF8C00": "Orange",
  "#D500F9": "Purple",
  "#8A2BE2": "Purple",
  "#FFFFFF": "White",
  "#607D8B": "Gray"
};
const COLOR_EMOJI = {
  "#FF007F": "🟥",
  "#00FFFF": "🟦",
  "#00FF00": "🟩",
  "#FFFF00": "🟨",
  "#8A2BE2": "🟪",
  "#FF8C00": "🟧"
};
const GAME_PRESETS = {
  easy: {
    codeLength: 3,
    maxGuesses: 12,
    availableColors: ["#FF007F", "#00FFFF", "#00FF00", "#FFFF00"],
    initialHints: 2
  },
  medium: {
    codeLength: 4,
    maxGuesses: 10,
    availableColors: ["#FF007F", "#00FFFF", "#00FF00", "#FFFF00", "#8A2BE2", "#FF8C00"],
    initialHints: 1
  },
  hard: {
    codeLength: 5,
    maxGuesses: 8,
    availableColors: ["#FF007F", "#00FFFF", "#00FF00", "#FFFF00", "#8A2BE2", "#FF8C00"],
    initialHints: 1
  }
};
const generateSecretCode = (config, allowDuplicates) => {
  const code = [];
  let colorsToPickFrom = [...config.availableColors];
  const effectiveAllowDuplicates = allowDuplicates || config.codeLength > colorsToPickFrom.length;
  if (effectiveAllowDuplicates) {
    for (let i = 0; i < config.codeLength; i++) {
      const randomIndex = Math.floor(Math.random() * colorsToPickFrom.length);
      code.push(colorsToPickFrom[randomIndex]);
    }
  } else {
    for (let i = 0; i < config.codeLength; i++) {
      const randomIndex = Math.floor(Math.random() * colorsToPickFrom.length);
      code.push(colorsToPickFrom[randomIndex]);
      colorsToPickFrom.splice(randomIndex, 1);
    }
  }
  return code;
};
const getFeedback = (guess, secretCode) => {
  const feedback = [];
  const secretCodeCopy = [...secretCode];
  const guessCopy = [...guess];
  for (let i = 0; i < secretCode.length; i++) {
    if (guessCopy[i] === secretCodeCopy[i]) {
      feedback.push("black");
      secretCodeCopy[i] = null;
      guessCopy[i] = null;
    }
  }
  for (let i = 0; i < secretCode.length; i++) {
    if (guessCopy[i] !== null) {
      const secretIndex = secretCodeCopy.indexOf(guessCopy[i]);
      if (secretIndex !== -1) {
        feedback.push("white");
        secretCodeCopy[secretIndex] = null;
      }
    }
  }
  while (feedback.length < secretCode.length) {
    feedback.push("empty");
  }
  feedback.sort((a, b) => {
    if (a === "black" && b !== "black") return -1;
    if (a !== "black" && b === "black") return 1;
    if (a === "white" && b === "empty") return -1;
    if (a === "empty" && b === "white") return 1;
    return 0;
  });
  return feedback;
};
const computeAutoEliminations = (guesses) => {
  const eliminated = /* @__PURE__ */ new Set();
  guesses.forEach((g) => {
    const blackCount = g.feedback.filter((f) => f === "black").length;
    const whiteCount = g.feedback.filter((f) => f === "white").length;
    if (blackCount === 0 && whiteCount === 0) {
      g.code.forEach((c) => eliminated.add(c));
    }
  });
  return eliminated;
};
const PEG_MATERIAL_INDEX = { Pink: 0, Cyan: 1, Green: 2, Yellow: 3, Purple: 4, Orange: 5, Black: 6, White: 7 };
const pegMaterialIndex = (color) => PEG_MATERIAL_INDEX[COLOR_NAMES[color]] ?? -1;
const PegMaterial = ({ index }) => index < 0 ? null : /* @__PURE__ */ React.createElement("span", { className: "peg-material", "aria-hidden": "true", style: { backgroundPosition: `${index % 4 * 100 / 3}% ${Math.floor(index / 4) * 100}%` } });
const CodePeg = ({ color, onClick, index, totalPegs, isActiveSlot }) => {
  const pegStyle = {
    backgroundColor: color || "#2d3748",
    "--peg-color-glow": color || "transparent"
  };
  const colorName = color ? COLOR_NAMES[color] || color : "Empty";
  const ariaLabel = color ? `Code peg ${index + 1} of ${totalPegs}: ${colorName}` : `Empty code peg ${index + 1} of ${totalPegs}${isActiveSlot ? " (next slot)" : ""}`;
  const handleKeyDown = (e) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  };
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center touch-target-peg transition-transform duration-100 ease-in-out hover:scale-105 active:scale-95 ${onClick ? "cursor-pointer" : ""} ${color ? "peg-shadow-neon active-glow" : "peg-shadow-neon"} ${isActiveSlot ? "active-slot-indicator" : ""}`,
      style: pegStyle,
      onClick,
      onKeyDown: handleKeyDown,
      role: onClick ? "button" : "img",
      tabIndex: onClick ? 0 : -1,
      "aria-label": ariaLabel
    },
    color && /* @__PURE__ */ React.createElement(PegMaterial, { index: pegMaterialIndex(color) })
  );
};
const FeedbackPeg = ({ type, index, animate, animDelay }) => /* @__PURE__ */ React.createElement(
  "div",
  {
    className: `w-3 h-3 md:w-4 md:h-4 rounded-full ${type === "black" ? "feedback-peg-black" : type === "white" ? "feedback-peg-white" : "feedback-peg-empty"} ${animate ? "feedback-peg-animate" : ""}`,
    style: animate ? { animationDelay: `${animDelay || 0}ms` } : {},
    role: "img",
    "aria-label": type === "black" ? "Correct color and position" : type === "white" ? "Correct color, wrong position" : "No match"
  },
  (type === "black" || type === "white") && /* @__PURE__ */ React.createElement(PegMaterial, { index: type === "black" ? 6 : 7 })
);
const GuessRow = ({ guess, feedback, codeLength, rowNumber, isLatest }) => {
  const blackCount = feedback.filter((f) => f === "black").length;
  const whiteCount = feedback.filter((f) => f === "white").length;
  const summaryLabel = `Guess ${rowNumber}: ${blackCount} exact, ${whiteCount} wrong position`;
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "flex items-center justify-between px-2 py-1.5 my-1 bg-gray-700/50 rounded-lg shadow-md border border-gray-600/50 fade-in",
      role: "listitem",
      "aria-label": summaryLabel
    },
    /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1" }, Array.from({ length: codeLength }).map((_, i) => /* @__PURE__ */ React.createElement(CodePeg, { key: i, color: guess[i], index: i, totalPegs: codeLength }))),
    /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-1 ml-4", "aria-label": `Feedback: ${blackCount} exact, ${whiteCount} wrong position` }, Array.from({ length: codeLength }).map((_, i) => /* @__PURE__ */ React.createElement(FeedbackPeg, { key: i, type: feedback[i], index: i, animate: isLatest, animDelay: i * 250 })))
  );
};
const Particle = ({ id, color, size, top, left, duration }) => {
  const style = {
    backgroundColor: color,
    width: `${size}px`,
    height: `${size}px`,
    top: `${top}%`,
    left: `${left}%`,
    animationDuration: `${duration}s`,
    boxShadow: `0 0 10px ${color}, 0 0 20px ${color}`
  };
  return /* @__PURE__ */ React.createElement("div", { key: id, className: "particle", style });
};
const ParticleBackground = ({ availableColors }) => {
  const [particles, setParticles] = React.useState([]);
  React.useEffect(() => {
    const newParticles = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      size: Math.random() * 5 + 2,
      duration: Math.random() * 4 + 2,
      color: availableColors[Math.floor(Math.random() * availableColors.length)],
      top: Math.random() * 100,
      left: Math.random() * 100
    }));
    setParticles(newParticles);
  }, [availableColors]);
  return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 pointer-events-none overflow-hidden", "aria-hidden": "true" }, particles.map((p) => /* @__PURE__ */ React.createElement(Particle, { key: p.id, ...p })));
};
const useModalKeys = (containerRef, onClose) => {
  React.useEffect(() => {
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !containerRef.current) return;
      const focusableElements = containerRef.current.querySelectorAll(focusableSelector);
      if (focusableElements.length === 0) return;
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [containerRef, onClose]);
};
const TutorialOverlay = ({ onClose, availableColors, codeLength }) => {
  const [step, setStep] = React.useState(0);
  const [animPhase, setAnimPhase] = React.useState(0);
  const cardRef = React.useRef(null);
  const nextBtnRef = React.useRef(null);
  const totalSteps = 5;
  const sampleSecret = availableColors.slice(0, Math.min(codeLength, availableColors.length));
  const sampleGuess = [
    availableColors[0],
    availableColors[1],
    availableColors.length > 2 ? availableColors[2] : availableColors[0],
    availableColors.length > 3 ? availableColors[3] : availableColors[1]
  ].slice(0, codeLength);
  const sampleFeedback = [];
  for (let i = 0; i < codeLength; i++) {
    if (i === 0) sampleFeedback.push("black");
    else if (i === 1) sampleFeedback.push("white");
    else sampleFeedback.push("empty");
  }
  React.useEffect(() => {
    setAnimPhase(0);
    if (step === 1 || step === 2 || step === 3) {
      const timers = [];
      for (let i = 1; i <= 4; i++) {
        timers.push(setTimeout(() => setAnimPhase(i), i * 500));
      }
      return () => timers.forEach(clearTimeout);
    }
  }, [step]);
  const handleNext = () => {
    if (step < totalSteps - 1) setStep(step + 1);
    else handleFinish();
  };
  const handleFinish = () => {
    try {
      localStorage.setItem("neonBreakerTutorialSeen", "true");
    } catch (e) {
    }
    onClose();
  };
  useModalKeys(cardRef, handleFinish);
  React.useEffect(() => {
    if (nextBtnRef.current) nextBtnRef.current.focus();
  }, []);
  const renderStep = () => {
    switch (step) {
      case 0:
        return /* @__PURE__ */ React.createElement("div", { className: "text-center" }, /* @__PURE__ */ React.createElement("h2", { className: "text-2xl font-bold text-cyan-400 mb-3 text-shadow-neon" }, "Welcome to Neon Breaker!"), /* @__PURE__ */ React.createElement("p", { className: "text-gray-300 text-sm mb-4" }, "Crack the secret color code using logic and deduction. Let's walk through how it works."), /* @__PURE__ */ React.createElement("div", { className: "tutorial-anim-board flex justify-center gap-2" }, sampleSecret.map((c, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-gray-400 text-lg font-bold", style: { boxShadow: "0 0 10px rgba(34,211,238,0.3)" } }, "?"))), /* @__PURE__ */ React.createElement("p", { className: "text-gray-400 text-xs mt-2" }, "A secret code of ", codeLength, " colors is hidden. Your job is to figure it out!"));
      case 1:
        return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "text-lg font-bold text-cyan-400 mb-2" }, "Step 1: Pick Colors"), /* @__PURE__ */ React.createElement("p", { className: "text-gray-300 text-sm mb-3" }, "Click colors from the palette to fill your guess slots."), /* @__PURE__ */ React.createElement("div", { className: "tutorial-anim-board" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-center gap-2 mb-3" }, availableColors.slice(0, Math.min(6, availableColors.length)).map((c, i) => /* @__PURE__ */ React.createElement(
          "div",
          {
            key: i,
            className: `w-9 h-9 rounded-full border-2 transition-all duration-300 ${animPhase > i && i < codeLength ? "border-white scale-110" : "border-gray-600"}`,
            style: { backgroundColor: c, boxShadow: animPhase > i && i < codeLength ? `0 0 12px ${c}` : "none" }
          }
        ))), /* @__PURE__ */ React.createElement("div", { className: "flex justify-center gap-2" }, Array.from({ length: codeLength }).map((_, i) => /* @__PURE__ */ React.createElement(
          "div",
          {
            key: i,
            className: `w-10 h-10 rounded-full flex items-center justify-center ${animPhase > i ? "tut-peg-anim" : ""}`,
            style: {
              backgroundColor: animPhase > i ? sampleGuess[i] : "#2d3748",
              boxShadow: animPhase > i ? `inset 0 0 5px rgba(255,255,255,0.3), 0 0 15px ${sampleGuess[i]}` : "inset 0 0 5px rgba(255,255,255,0.1)",
              animationDelay: `${i * 0.15}s`
            }
          }
        )))), /* @__PURE__ */ React.createElement("div", { className: "tut-callout mt-2", style: { animationDelay: "0.5s" } }, /* @__PURE__ */ React.createElement("span", { className: "text-cyan-300" }, "Tip:"), " ", /* @__PURE__ */ React.createElement("span", { className: "text-gray-300" }, "Colors auto-fill the leftmost empty slot. Click a filled slot to remove it.")));
      case 2:
        return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "text-lg font-bold text-cyan-400 mb-2" }, "Step 2: Submit Your Guess"), /* @__PURE__ */ React.createElement("p", { className: "text-gray-300 text-sm mb-3" }, 'Once all slots are filled, click the "Guess" button.'), /* @__PURE__ */ React.createElement("div", { className: "tutorial-anim-board" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-center gap-2 mb-3" }, sampleGuess.map((c, i) => /* @__PURE__ */ React.createElement(
          "div",
          {
            key: i,
            className: "w-10 h-10 rounded-full",
            style: { backgroundColor: c, boxShadow: `inset 0 0 5px rgba(255,255,255,0.3), 0 0 15px ${c}` }
          }
        ))), /* @__PURE__ */ React.createElement("div", { className: "flex justify-center" }, /* @__PURE__ */ React.createElement(
          "div",
          {
            className: `py-1.5 px-4 text-sm bg-blue-700 text-white font-bold rounded-lg transition-all duration-300 ${animPhase >= 2 ? "scale-110 shadow-lg shadow-blue-500/50" : ""} ${animPhase >= 3 ? "scale-95 opacity-70" : ""}`,
            style: { boxShadow: animPhase >= 2 ? "0 0 20px rgba(59,130,246,0.6)" : "none" }
          },
          "Guess"
        ))), /* @__PURE__ */ React.createElement("div", { className: "tut-callout" }, /* @__PURE__ */ React.createElement("span", { className: "text-cyan-300" }, "Note:"), " ", /* @__PURE__ */ React.createElement("span", { className: "text-gray-300" }, 'You can also use "Clear" to reset your current guess, or "Undo" to take back your last submitted guess.')));
      case 3:
        return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "text-lg font-bold text-cyan-400 mb-2" }, "Step 3: Read the Feedback"), /* @__PURE__ */ React.createElement("p", { className: "text-gray-300 text-sm mb-3" }, "After submitting, you'll see feedback pegs:"), /* @__PURE__ */ React.createElement("div", { className: "tutorial-anim-board" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between px-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex gap-1" }, sampleGuess.map((c, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "w-9 h-9 rounded-full", style: { backgroundColor: c, boxShadow: `inset 0 0 5px rgba(255,255,255,0.3), 0 0 10px ${c}` } }))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-1 ml-3" }, sampleFeedback.map((f, i) => /* @__PURE__ */ React.createElement(
          "div",
          {
            key: i,
            className: `w-4 h-4 rounded-full ${animPhase > i ? "tut-feedback-anim" : "opacity-0"} ${f === "black" ? "feedback-peg-black" : f === "white" ? "feedback-peg-white" : "feedback-peg-empty"}`,
            style: { animationDelay: `${i * 0.2}s` }
          }
        ))))), /* @__PURE__ */ React.createElement("div", { className: "space-y-2 mt-3" }, /* @__PURE__ */ React.createElement("div", { className: "tut-callout", style: { animationDelay: "0.3s" } }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "w-4 h-4 rounded-full feedback-peg-black flex-shrink-0" }), /* @__PURE__ */ React.createElement("span", { className: "text-gray-200" }, /* @__PURE__ */ React.createElement("strong", { className: "text-cyan-300" }, "Black peg"), " = Right color, right position"))), /* @__PURE__ */ React.createElement("div", { className: "tut-callout", style: { animationDelay: "0.6s" } }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "w-4 h-4 rounded-full feedback-peg-white flex-shrink-0" }), /* @__PURE__ */ React.createElement("span", { className: "text-gray-200" }, /* @__PURE__ */ React.createElement("strong", { className: "text-cyan-300" }, "White peg"), " = Right color, wrong position"))), /* @__PURE__ */ React.createElement("div", { className: "tut-callout", style: { animationDelay: "0.9s" } }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "w-4 h-4 rounded-full feedback-peg-empty flex-shrink-0" }), /* @__PURE__ */ React.createElement("span", { className: "text-gray-200" }, /* @__PURE__ */ React.createElement("strong", { className: "text-gray-400" }, "Empty peg"), " = No match for that slot")))));
      case 4:
        return /* @__PURE__ */ React.createElement("div", { className: "text-center" }, /* @__PURE__ */ React.createElement("h3", { className: "text-lg font-bold text-cyan-400 mb-2" }, "You're Ready!"), /* @__PURE__ */ React.createElement("p", { className: "text-gray-300 text-sm mb-4" }, "Use logic to narrow down the code. You can also use:"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3 text-left mb-4" }, /* @__PURE__ */ React.createElement("div", { className: "tut-callout", style: { animationDelay: "0.1s" } }, /* @__PURE__ */ React.createElement("strong", { className: "text-purple-300" }, "Hints"), /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { className: "text-gray-400 text-xs" }, "Reveals one correct color in the right position")), /* @__PURE__ */ React.createElement("div", { className: "tut-callout", style: { animationDelay: "0.2s" } }, /* @__PURE__ */ React.createElement("strong", { className: "text-yellow-300" }, "Notepad"), /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { className: "text-gray-400 text-xs" }, "Track which colors you've eliminated")), /* @__PURE__ */ React.createElement("div", { className: "tut-callout", style: { animationDelay: "0.3s" } }, /* @__PURE__ */ React.createElement("strong", { className: "text-red-300" }, "Undo"), /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { className: "text-gray-400 text-xs" }, "Take back your last guess (once per game)")), /* @__PURE__ */ React.createElement("div", { className: "tut-callout", style: { animationDelay: "0.4s" } }, /* @__PURE__ */ React.createElement("strong", { className: "text-green-300" }, "Share"), /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", { className: "text-gray-400 text-xs" }, "Copy a spoiler-free result after the game"))), /* @__PURE__ */ React.createElement("p", { className: "text-cyan-300 text-sm" }, "Good luck, Code Breaker!"));
      default:
        return null;
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "tutorial-overlay", role: "dialog", "aria-modal": "true", "aria-label": "Game tutorial" }, /* @__PURE__ */ React.createElement("div", { className: "tutorial-card", ref: cardRef }, /* @__PURE__ */ React.createElement("div", { className: "tutorial-step-indicator" }, Array.from({ length: totalSteps }).map((_, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: `tutorial-dot ${i === step ? "active" : i < step ? "completed" : ""}` }))), renderStep(), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between mt-4 gap-2" }, /* @__PURE__ */ React.createElement("button", { onClick: handleFinish, className: "tutorial-nav-btn secondary", "aria-label": "Skip tutorial" }, "Skip"), /* @__PURE__ */ React.createElement("button", { ref: nextBtnRef, onClick: handleNext, className: "tutorial-nav-btn primary", "aria-label": step < totalSteps - 1 ? "Next step" : "Start playing" }, step < totalSteps - 1 ? "Next" : "Let's Go!"))));
};
const PostGameSummary = ({ gameStatus, guesses, secretCode, codeLength, elapsedTime, formatTime, maxCombo, currentPreset, maxGuesses, onPlayAgain, onClose, playAgainRef }) => {
  const [copyText, setCopyText] = React.useState("Copy Result");
  const generateShareText = () => {
    const isWin2 = gameStatus === "won";
    const header = `NEON BREAKER ${isWin2 ? "🔓" : "🔒"}`;
    const meta = `${currentPreset.charAt(0).toUpperCase() + currentPreset.slice(1)} | ${isWin2 ? guesses.length : "X"}/${maxGuesses} | ${formatTime(elapsedTime)}`;
    const gridLines = guesses.map((g) => {
      return g.feedback.map((f) => {
        if (f === "black") return "⬛";
        if (f === "white") return "⬜";
        return "🟥";
      }).join("");
    }).join("\n");
    return `${header}
${meta}

${gridLines}`;
  };
  const handleCopy = async () => {
    const text = generateShareText();
    try {
      await navigator.clipboard.writeText(text);
      setCopyText("Copied!");
      setTimeout(() => setCopyText("Copy Result"), 2e3);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopyText("Copied!");
      setTimeout(() => setCopyText("Copy Result"), 2e3);
    }
  };
  const isWin = gameStatus === "won";
  const totalCombos = maxCombo;
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 backdrop-blur-md fade-in rounded-xl z-50 p-4 overflow-y-auto",
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "summary-heading"
    },
    /* @__PURE__ */ React.createElement("div", { className: "max-w-sm w-full" }, /* @__PURE__ */ React.createElement(
      "h2",
      {
        id: "summary-heading",
        className: `text-3xl md:text-4xl font-bold text-center mb-2 text-shadow-neon ${isWin ? "text-yellow-300 win-animation" : "text-red-400"}`
      },
      isWin ? "YOU WON!" : "GAME OVER"
    ), /* @__PURE__ */ React.createElement("div", { className: "text-center mb-3" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-cyan-300 mb-1" }, "Secret Code:"), /* @__PURE__ */ React.createElement("div", { className: "flex justify-center" }, /* @__PURE__ */ React.createElement(SecretCodeReveal, { secretCode, codeLength }))), /* @__PURE__ */ React.createElement("div", { className: "flex justify-center gap-3 mb-3 text-center" }, /* @__PURE__ */ React.createElement("div", { className: "stats-box flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs text-cyan-300" }, "Guesses"), /* @__PURE__ */ React.createElement("div", { className: "stats-value text-sm" }, guesses.length, "/", maxGuesses)), /* @__PURE__ */ React.createElement("div", { className: "stats-box flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs text-cyan-300" }, "Time"), /* @__PURE__ */ React.createElement("div", { className: "stats-value text-sm" }, formatTime(elapsedTime))), /* @__PURE__ */ React.createElement("div", { className: "stats-box flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs text-cyan-300" }, "Max Combo"), /* @__PURE__ */ React.createElement("div", { className: "stats-value text-sm" }, "x", totalCombos))), /* @__PURE__ */ React.createElement("div", { className: "summary-guesses-list mb-3" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-cyan-300 mb-1 text-center" }, "Guess History:"), guesses.map((g, idx) => /* @__PURE__ */ React.createElement("div", { key: idx, className: "flex items-center justify-between px-2 py-1 my-0.5 bg-gray-700/50 rounded border border-gray-600/30 text-xs" }, /* @__PURE__ */ React.createElement("div", { className: "flex gap-0.5" }, g.code.map((c, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "w-5 h-5 rounded-full", style: { backgroundColor: c } }))), /* @__PURE__ */ React.createElement("div", { className: "flex gap-0.5 ml-2" }, g.feedback.map((f, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: `w-3 h-3 rounded-full ${f === "black" ? "feedback-peg-black" : f === "white" ? "feedback-peg-white" : "feedback-peg-empty"}` })))))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-2 items-center" }, /* @__PURE__ */ React.createElement("button", { onClick: handleCopy, className: "copy-result-btn w-full", "aria-label": "Copy spoiler-free result to clipboard" }, copyText), /* @__PURE__ */ React.createElement(
      "button",
      {
        ref: playAgainRef,
        onClick: onPlayAgain,
        className: "action-btn w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg shadow-lg shadow-cyan-500/50 transition-all duration-200 transform hover:scale-105 active:scale-95 border border-cyan-400",
        "aria-label": "Play again"
      },
      "Play Again"
    )))
  );
};
const HISTORY_STORAGE_KEY = "neonBreakerGameHistory";
const MAX_HISTORY_ENTRIES = 20;
const loadGameHistory = () => {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};
const saveGameToHistory = (entry) => {
  try {
    const history = loadGameHistory();
    history.unshift(entry);
    if (history.length > MAX_HISTORY_ENTRIES) {
      history.length = MAX_HISTORY_ENTRIES;
    }
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.warn("Could not save game history", e);
  }
};
const GameHistoryModal = ({ onClose }) => {
  const [history, setHistory] = React.useState([]);
  const closeRef = React.useRef(null);
  const modalRef = React.useRef(null);
  React.useEffect(() => {
    setHistory(loadGameHistory());
    if (closeRef.current) closeRef.current.focus();
  }, []);
  useModalKeys(modalRef, onClose);
  const clearHistory = () => {
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (e) {
    }
    setHistory([]);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "modal-overlay", role: "dialog", "aria-modal": "true", "aria-labelledby": "history-heading" }, /* @__PURE__ */ React.createElement("div", { className: "modal-content", ref: modalRef, style: { maxWidth: "440px", width: "95%" } }, /* @__PURE__ */ React.createElement("button", { ref: closeRef, onClick: onClose, className: "modal-close-button", "aria-label": "Close history" }, "×"), /* @__PURE__ */ React.createElement("h2", { id: "history-heading", className: "text-xl font-bold text-cyan-400 mb-3 text-shadow-neon" }, "Game History"), history.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-gray-400 text-sm text-center py-6" }, "No games played yet. Your results will appear here.") : /* @__PURE__ */ React.createElement("div", { className: "history-list" }, history.map((entry, idx) => {
    const dateStr = new Date(entry.date).toLocaleDateString(void 0, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    return /* @__PURE__ */ React.createElement("div", { key: idx, className: `history-entry ${entry.won ? "win-entry" : "loss-entry"}` }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-0.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, dateStr), /* @__PURE__ */ React.createElement("span", { className: "text-cyan-300 font-bold capitalize" }, entry.difficulty)), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-end gap-0.5" }, /* @__PURE__ */ React.createElement("span", { className: `font-bold ${entry.won ? "text-green-400" : "text-red-400"}` }, entry.won ? "WON" : "LOST"), /* @__PURE__ */ React.createElement("span", { className: "text-gray-300" }, entry.guesses, "/", entry.maxGuesses, " guesses")));
  })), history.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "mt-3 flex justify-center" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: clearHistory,
      className: "text-xs text-red-400 hover:text-red-300 underline",
      "aria-label": "Clear all game history"
    },
    "Clear History"
  ))));
};
const SecretCodeReveal = ({ secretCode, codeLength }) => {
  const [revealedCount, setRevealedCount] = React.useState(0);
  React.useEffect(() => {
    setRevealedCount(0);
    const timers = [];
    for (let i = 0; i < codeLength; i++) {
      timers.push(setTimeout(() => {
        setRevealedCount((prev) => prev + 1);
        AudioSystem.play(440 + i * 80, 0.15);
      }, (i + 1) * 300));
    }
    return () => timers.forEach(clearTimeout);
  }, [secretCode, codeLength]);
  return /* @__PURE__ */ React.createElement("div", { className: "flex space-x-2 p-3 bg-gray-700/50 rounded-lg shadow-inner border border-gray-600/50", "aria-label": "Secret code revealed" }, secretCode.map((color, index) => /* @__PURE__ */ React.createElement("div", { key: index, className: "secret-peg-container" }, /* @__PURE__ */ React.createElement("div", { className: `secret-peg-flipper ${index < revealedCount ? "flipped" : ""}` }, /* @__PURE__ */ React.createElement("div", { className: "secret-peg-front" }, "?"), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `secret-peg-back ${index < revealedCount ? "secret-peg-revealed" : ""}`,
      style: {
        backgroundColor: color,
        boxShadow: index < revealedCount ? `0 0 12px ${color}, 0 0 24px ${color}` : "none"
      }
    },
    /* @__PURE__ */ React.createElement(PegMaterial, { index: pegMaterialIndex(color) })
  )))));
};
const gameReducer = (state, action) => {
  switch (action.type) {
    case "RESET_GAME":
      const newConfig = GAME_PRESETS[action.preset];
      return {
        ...state,
        gameConfig: newConfig,
        currentPreset: action.preset,
        secretCode: generateSecretCode(newConfig, action.allowDuplicates),
        guesses: [],
        currentGuess: Array(newConfig.codeLength).fill(null),
        gameStatus: "playing",
        message: "Guess the secret code!",
        selectedColorFromPalette: null,
        elapsedTime: 0,
        hintsRemaining: newConfig.initialHints,
        allowDuplicates: action.allowDuplicates,
        currentBlackPegStreak: 0,
        comboMessage: "",
        // Feature 2: reset eliminated colors
        eliminatedColors: [],
        notepadOpen: false,
        // Feature 3: reset undo
        undoUsed: false,
        undoSnapshot: null,
        // Feature 4: reset max combo
        maxCombo: 0
      };
    case "SET_SELECTED_COLOR":
      return { ...state, selectedColorFromPalette: action.color, message: "" };
    case "UPDATE_CURRENT_GUESS":
      return { ...state, currentGuess: action.newGuess, message: "" };
    // Feature 1: Clear current guess
    case "CLEAR_CURRENT_GUESS":
      return {
        ...state,
        currentGuess: Array(state.gameConfig.codeLength).fill(null),
        selectedColorFromPalette: null,
        message: ""
      };
    case "SUBMIT_GUESS":
      const feedback = getFeedback(state.currentGuess, state.secretCode);
      const newGuesses = [...state.guesses, { code: state.currentGuess, feedback }];
      let newGameStatus = state.gameStatus;
      let newMessage = "";
      let newStats = { ...state.stats };
      let newBlackPegStreak = state.currentBlackPegStreak;
      let newComboMessage = "";
      let newMaxCombo = state.maxCombo;
      const blackPegsInGuess = feedback.filter((f) => f === "black").length;
      if (blackPegsInGuess > 0) {
        newBlackPegStreak++;
        if (newBlackPegStreak > 1) {
          newComboMessage = `COMBO x${newBlackPegStreak}!`;
        } else {
          newComboMessage = "Good Guess!";
        }
        if (newBlackPegStreak > newMaxCombo) {
          newMaxCombo = newBlackPegStreak;
        }
      } else {
        newBlackPegStreak = 0;
        newComboMessage = "";
      }
      if (blackPegsInGuess === state.gameConfig.codeLength) {
        newGameStatus = "won";
        newMessage = "Congratulations! You broke the code!";
        AudioSystem.play(880, 0.5);
        newStats = {
          gamesPlayed: newStats.gamesPlayed + 1,
          wins: newStats.wins + 1,
          bestTime: Math.min(newStats.bestTime, state.elapsedTime),
          bestAttempts: Math.min(newStats.bestAttempts, newGuesses.length)
        };
        try {
          localStorage.setItem("neonBreakerStats", JSON.stringify(newStats));
        } catch (e) {
          console.warn("Could not save stats", e);
        }
        saveGameToHistory({
          date: (/* @__PURE__ */ new Date()).toISOString(),
          difficulty: state.currentPreset,
          guesses: newGuesses.length,
          maxGuesses: state.gameConfig.maxGuesses,
          won: true
        });
      } else if (newGuesses.length >= state.gameConfig.maxGuesses) {
        newGameStatus = "lost";
        newMessage = "Game Over!";
        AudioSystem.play(220, 0.3, "sawtooth");
        newStats = {
          ...newStats,
          gamesPlayed: newStats.gamesPlayed + 1
        };
        try {
          localStorage.setItem("neonBreakerStats", JSON.stringify(newStats));
        } catch (e) {
          console.warn("Could not save stats", e);
        }
        saveGameToHistory({
          date: (/* @__PURE__ */ new Date()).toISOString(),
          difficulty: state.currentPreset,
          guesses: newGuesses.length,
          maxGuesses: state.gameConfig.maxGuesses,
          won: false
        });
      } else {
        AudioSystem.play(660);
        newMessage = newComboMessage;
      }
      const autoEliminated = computeAutoEliminations(newGuesses);
      const mergedEliminations = [.../* @__PURE__ */ new Set([...state.eliminatedColors, ...autoEliminated])];
      const undoSnapshot = {
        guesses: state.guesses,
        currentGuess: state.currentGuess,
        currentBlackPegStreak: state.currentBlackPegStreak,
        comboMessage: state.comboMessage,
        maxCombo: state.maxCombo,
        eliminatedColors: state.eliminatedColors,
        message: state.message
      };
      return {
        ...state,
        guesses: newGuesses,
        currentGuess: Array(state.gameConfig.codeLength).fill(null),
        selectedColorFromPalette: null,
        gameStatus: newGameStatus,
        message: newMessage,
        stats: newStats,
        currentBlackPegStreak: newBlackPegStreak,
        comboMessage: newComboMessage,
        maxCombo: newMaxCombo,
        eliminatedColors: mergedEliminations,
        undoSnapshot
      };
    case "SET_MESSAGE":
      return { ...state, message: action.message };
    case "INCREMENT_TIME":
      return { ...state, elapsedTime: state.elapsedTime + 1 };
    case "USE_HINT":
      if (state.hintsRemaining <= 0 || state.gameStatus !== "playing") return state;
      const emptySlots = state.currentGuess.map((color2, index) => ({ color: color2, index })).filter((item) => item.color === null).map((item) => item.index);
      if (emptySlots.length === 0) return state;
      const randomSlot = emptySlots[Math.floor(Math.random() * emptySlots.length)];
      const newGuessWithHint = [...state.currentGuess];
      newGuessWithHint[randomSlot] = state.secretCode[randomSlot];
      AudioSystem.play(600);
      return { ...state, currentGuess: newGuessWithHint, hintsRemaining: state.hintsRemaining - 1 };
    case "SET_DIFFICULTY":
      return gameReducer(state, { type: "RESET_GAME", preset: action.preset, allowDuplicates: state.allowDuplicates });
    case "RESET_WITH_SECRET": {
      const customConfig = GAME_PRESETS[action.preset || "medium"];
      return {
        ...state,
        gameConfig: customConfig,
        currentPreset: action.preset || "medium",
        secretCode: action.secretCode.slice(0, customConfig.codeLength),
        guesses: [],
        currentGuess: Array(customConfig.codeLength).fill(null),
        gameStatus: "playing",
        message: action.message || "Guess the secret code!",
        selectedColorFromPalette: null,
        elapsedTime: 0,
        hintsRemaining: action.disableHints ? 0 : customConfig.initialHints,
        allowDuplicates: true,
        currentBlackPegStreak: 0,
        comboMessage: "",
        eliminatedColors: [],
        notepadOpen: false,
        undoUsed: false,
        undoSnapshot: null,
        maxCombo: 0
      };
    }
    case "SHOW_RULES":
      return { ...state, showRules: action.show };
    // Feature 2: Notepad actions
    case "TOGGLE_NOTEPAD":
      return { ...state, notepadOpen: !state.notepadOpen };
    case "TOGGLE_ELIMINATE_COLOR":
      const color = action.color;
      const isEliminated = state.eliminatedColors.includes(color);
      return {
        ...state,
        eliminatedColors: isEliminated ? state.eliminatedColors.filter((c) => c !== color) : [...state.eliminatedColors, color]
      };
    // Feature 3: Undo last guess
    case "UNDO_GUESS":
      if (state.undoUsed || !state.undoSnapshot || state.gameStatus !== "playing") return state;
      AudioSystem.play(400, 0.15, "triangle");
      return {
        ...state,
        guesses: state.undoSnapshot.guesses,
        currentGuess: state.undoSnapshot.currentGuess,
        currentBlackPegStreak: state.undoSnapshot.currentBlackPegStreak,
        comboMessage: state.undoSnapshot.comboMessage,
        maxCombo: state.undoSnapshot.maxCombo,
        eliminatedColors: state.undoSnapshot.eliminatedColors,
        message: "Last guess undone.",
        selectedColorFromPalette: null,
        undoUsed: true,
        undoSnapshot: null
      };
    // Feature 5: Tutorial
    case "SHOW_TUTORIAL":
      return { ...state, showTutorial: action.show };
    // Game History modal
    case "SHOW_HISTORY":
      return { ...state, showHistory: action.show };
    default:
      return state;
  }
};
const MastermindGame = () => {
  const defaultStats = {
    gamesPlayed: 0,
    wins: 0,
    bestTime: Infinity,
    bestAttempts: Infinity
  };
  const lazyInit = () => {
    let initialStats;
    try {
      const raw = JSON.parse(localStorage.getItem("neonBreakerStats"));
      if (raw) {
        if (raw.bestTime === null || raw.bestTime === void 0) raw.bestTime = Infinity;
        if (raw.bestAttempts === null || raw.bestAttempts === void 0) raw.bestAttempts = Infinity;
      }
      initialStats = raw || defaultStats;
    } catch (e) {
      console.warn("Could not load stats from localStorage, using defaults", e);
      initialStats = defaultStats;
    }
    let tutorialSeen = false;
    try {
      tutorialSeen = localStorage.getItem("neonBreakerTutorialSeen") === "true";
    } catch (e) {
    }
    return {
      gameConfig: GAME_PRESETS.medium,
      currentPreset: "medium",
      secretCode: generateSecretCode(GAME_PRESETS.medium, false),
      guesses: [],
      currentGuess: Array(GAME_PRESETS.medium.codeLength).fill(null),
      gameStatus: "playing",
      message: "Guess the secret code!",
      selectedColorFromPalette: null,
      elapsedTime: 0,
      hintsRemaining: GAME_PRESETS.medium.initialHints,
      allowDuplicates: false,
      showRules: false,
      stats: initialStats,
      currentBlackPegStreak: 0,
      comboMessage: "",
      // Feature 2
      eliminatedColors: [],
      notepadOpen: false,
      // Feature 3
      undoUsed: false,
      undoSnapshot: null,
      // Feature 4
      maxCombo: 0,
      // Feature 5
      showTutorial: !tutorialSeen,
      // Game History
      showHistory: false
    };
  };
  const [state, dispatch] = React.useReducer(gameReducer, null, lazyInit);
  const [specialMode, setSpecialMode] = React.useState("classic");
  const [makerDraft, setMakerDraft] = React.useState([]);
  const [notebookMarks, setNotebookMarks] = React.useState({});
  const {
    gameConfig,
    secretCode,
    guesses,
    currentGuess,
    gameStatus,
    message,
    selectedColorFromPalette,
    showRules,
    elapsedTime,
    hintsRemaining,
    allowDuplicates,
    stats,
    comboMessage,
    currentPreset,
    eliminatedColors,
    notepadOpen,
    undoUsed,
    undoSnapshot,
    maxCombo,
    showTutorial,
    showHistory
  } = state;
  const guessListRef = React.useRef(null);
  const rulesCloseRef = React.useRef(null);
  const playAgainRef = React.useRef(null);
  const lossPlayAgainRef = React.useRef(null);
  const guessInputRef = React.useRef(null);
  const rulesModalRef = React.useRef(null);
  const prevGameStatusRef = React.useRef("playing");
  const prevGuessRef = React.useRef(currentGuess);
  React.useEffect(() => {
    let tutorialSeen = false;
    try {
      tutorialSeen = localStorage.getItem("neonBreakerTutorialSeen") === "true";
    } catch (e) {
    }
    if (!tutorialSeen) {
      dispatch({ type: "SHOW_TUTORIAL", show: true });
    }
  }, []);
  React.useEffect(() => {
    if (gameStatus !== "playing" || showTutorial || showRules || showHistory) return;
    const timer = setInterval(() => {
      dispatch({ type: "INCREMENT_TIME" });
    }, 1e3);
    return () => clearInterval(timer);
  }, [gameStatus, showTutorial, showRules, showHistory]);
  React.useEffect(() => {
    if (guessListRef.current && guesses.length > 0) {
      guessListRef.current.scrollTop = guessListRef.current.scrollHeight;
    }
  }, [guesses.length]);
  React.useEffect(() => {
    const prev = prevGuessRef.current;
    prevGuessRef.current = currentGuess;
    if (gameStatus !== "playing") return;
    const colorWasPlaced = prev.some((c, i) => c === null && currentGuess[i] !== null);
    if (!colorWasPlaced) return;
    const nextEmptyIdx = currentGuess.indexOf(null);
    if (nextEmptyIdx !== -1 && guessInputRef.current) {
      requestAnimationFrame(() => {
        if (guessInputRef.current) {
          const buttons = guessInputRef.current.querySelectorAll('[role="button"]');
          if (buttons[nextEmptyIdx]) buttons[nextEmptyIdx].focus();
        }
      });
    }
  }, [currentGuess, gameStatus]);
  React.useEffect(() => {
    if (gameStatus === "won" && playAgainRef.current) {
      playAgainRef.current.focus();
    }
  }, [gameStatus]);
  React.useEffect(() => {
    if (gameStatus === "lost" && lossPlayAgainRef.current) {
      lossPlayAgainRef.current.focus();
    }
  }, [gameStatus]);
  React.useEffect(() => {
    const prev = prevGameStatusRef.current;
    prevGameStatusRef.current = gameStatus;
    if (gameStatus === "playing" && (prev === "won" || prev === "lost")) {
      if (guessInputRef.current) {
        const firstButton = guessInputRef.current.querySelector('[role="button"]');
        if (firstButton) firstButton.focus();
      }
    }
  }, [gameStatus]);
  React.useEffect(() => {
    if (showRules && rulesCloseRef.current) {
      rulesCloseRef.current.focus();
    }
  }, [showRules]);
  React.useEffect(() => {
    if (!showRules) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        dispatch({ type: "SHOW_RULES", show: false });
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showRules]);
  React.useEffect(() => {
    if (!showRules || !rulesModalRef.current) return;
    const modal = rulesModalRef.current;
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const handleTab = (e) => {
      if (e.key !== "Tab") return;
      const focusableElements = modal.querySelectorAll(focusableSelector);
      if (focusableElements.length === 0) return;
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [showRules]);
  const handlePaletteColorClick = (color) => {
    if (gameStatus !== "playing") return;
    const newGuess = [...currentGuess];
    const emptyIndex = newGuess.indexOf(null);
    if (emptyIndex !== -1) {
      if (!allowDuplicates && newGuess.includes(color)) {
        dispatch({ type: "SET_MESSAGE", message: "Colors must be unique in your guess!" });
        return;
      }
      newGuess[emptyIndex] = color;
      dispatch({ type: "UPDATE_CURRENT_GUESS", newGuess });
      dispatch({ type: "SET_SELECTED_COLOR", color: null });
      AudioSystem.play(520);
    } else {
      dispatch({ type: "SET_SELECTED_COLOR", color });
      AudioSystem.play(440);
    }
  };
  const handleGuessPegClick = (index) => {
    if (gameStatus !== "playing") return;
    const newGuess = [...currentGuess];
    if (newGuess[index] !== null) {
      newGuess[index] = null;
      dispatch({ type: "UPDATE_CURRENT_GUESS", newGuess });
      dispatch({ type: "SET_SELECTED_COLOR", color: null });
      AudioSystem.play(520);
    } else {
      if (selectedColorFromPalette !== null) {
        if (!allowDuplicates && newGuess.includes(selectedColorFromPalette)) {
          dispatch({ type: "SET_MESSAGE", message: "Colors must be unique in your guess!" });
          return;
        }
        newGuess[index] = selectedColorFromPalette;
        dispatch({ type: "UPDATE_CURRENT_GUESS", newGuess });
        dispatch({ type: "SET_SELECTED_COLOR", color: null });
        AudioSystem.play(520);
      } else {
        dispatch({ type: "SET_MESSAGE", message: "Select a color from the palette first!" });
        return;
      }
    }
  };
  const handleSubmitGuess = () => {
    if (gameStatus !== "playing") return;
    if (currentGuess.includes(null)) {
      dispatch({ type: "SET_MESSAGE", message: "Please complete your guess!" });
      return;
    }
    dispatch({ type: "SUBMIT_GUESS" });
  };
  const handleNewGame = () => {
    if (specialMode === "daily") {
      dispatch({ type: "RESET_WITH_SECRET", preset: "medium", secretCode: seededDailySecret(), disableHints: true, message: `Daily Code ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)} — same puzzle for everyone` });
      return;
    }
    if (specialMode.startsWith("maker")) {
      setSpecialMode("maker");
      setMakerDraft([]);
      dispatch({ type: "SET_MESSAGE", message: "Code Maker: choose 4 colors, then lock the secret." });
      return;
    }
    dispatch({ type: "RESET_GAME", preset: currentPreset, allowDuplicates });
  };
  const handleToggleDuplicates = () => {
    if (guesses.length > 0 || gameStatus !== "playing") return;
    dispatch({ type: "RESET_GAME", preset: currentPreset, allowDuplicates: !allowDuplicates });
  };
  const seededDailySecret = () => {
    const day = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    let seed = [...day].reduce((n, ch) => n * 31 + ch.charCodeAt(0) >>> 0, 2166136261);
    const colors = GAME_PRESETS.medium.availableColors;
    const result = [];
    for (let i = 0; i < GAME_PRESETS.medium.codeLength; i++) {
      seed = Math.imul(seed, 1664525) + 1013904223 >>> 0;
      result.push(colors[seed % colors.length]);
    }
    return result;
  };
  const startDaily = () => {
    setSpecialMode("daily");
    setMakerDraft([]);
    setNotebookMarks({});
    dispatch({ type: "RESET_WITH_SECRET", preset: "medium", secretCode: seededDailySecret(), disableHints: true, message: `Daily Code ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)} — same puzzle for everyone` });
  };
  const startCodeMaker = () => {
    setSpecialMode("maker");
    setMakerDraft([]);
    setNotebookMarks({});
    dispatch({ type: "SET_MESSAGE", message: "Code Maker: choose 4 colors, then lock the secret." });
  };
  const lockMakerCode = () => {
    if (makerDraft.length !== GAME_PRESETS.medium.codeLength) return;
    dispatch({ type: "RESET_WITH_SECRET", preset: "medium", secretCode: makerDraft, disableHints: true, message: "Code locked. Pass the device to the Code Breaker!" });
    setMakerDraft([]);
    setSpecialMode("maker-playing");
  };
  const cycleNotebookMark = (color) => {
    const order = ["possible", "impossible", "confirmed"];
    setNotebookMarks((prev) => {
      const current = prev[color] || (eliminatedColors.includes(color) ? "impossible" : "possible");
      return { ...prev, [color]: order[(order.indexOf(current) + 1) % order.length] };
    });
  };
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };
  const canUndo = !undoUsed && undoSnapshot !== null && gameStatus === "playing";
  return /* @__PURE__ */ React.createElement("main", { className: "mini-shell h-screen h-[100dvh] relative bg-gray-900 text-white flex flex-col items-center p-2 pt-14 overflow-hidden", role: "main" }, /* @__PURE__ */ React.createElement("div", { className: "scanline-overlay", "aria-hidden": "true" }), showTutorial && /* @__PURE__ */ React.createElement(
    TutorialOverlay,
    {
      onClose: () => dispatch({ type: "SHOW_TUTORIAL", show: false }),
      availableColors: gameConfig.availableColors,
      codeLength: gameConfig.codeLength
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "breaker-layout game-panel relative z-10 bg-black/60 rounded-xl shadow-2xl p-4 w-full max-w-md border border-blue-700/50 shadow-blue-900/40 flex flex-col flex-1 min-h-0 overflow-hidden" }, /* @__PURE__ */ React.createElement("aside", { className: "breaker-setup" }, /* @__PURE__ */ React.createElement("h1", { className: "game-title text-3xl md:text-4xl font-bold text-center mb-2 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent tracking-wider text-shadow-neon" }, "NEON BREAKER"), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center mb-2" }, /* @__PURE__ */ React.createElement("div", { className: "stats-box" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm text-cyan-300" }, "Time"), /* @__PURE__ */ React.createElement("div", { className: "stats-value" }, formatTime(elapsedTime))), /* @__PURE__ */ React.createElement("div", { className: "stats-box" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm text-cyan-300" }, "Attempts"), /* @__PURE__ */ React.createElement("div", { className: "stats-value" }, guesses.length, "/", gameConfig.maxGuesses)), /* @__PURE__ */ React.createElement("div", { className: "stats-box" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm text-cyan-300" }, "Hints"), /* @__PURE__ */ React.createElement("div", { className: "stats-value" }, hintsRemaining))), /* @__PURE__ */ React.createElement("div", { className: "flex justify-center gap-2 mb-2 flex-wrap" }, /* @__PURE__ */ React.createElement("button", { onClick: () => {
    setSpecialMode("classic");
    setMakerDraft([]);
    setNotebookMarks({});
    dispatch({ type: "RESET_GAME", preset: currentPreset, allowDuplicates });
  }, className: `px-2 py-1 rounded border ${specialMode === "classic" ? "bg-cyan-700 border-cyan-300" : "bg-gray-800 border-gray-600"}` }, "Classic"), /* @__PURE__ */ React.createElement("button", { onClick: startDaily, className: `px-2 py-1 rounded border ${specialMode === "daily" ? "bg-cyan-700 border-cyan-300" : "bg-gray-800 border-gray-600"}` }, "Daily Code"), /* @__PURE__ */ React.createElement("button", { onClick: startCodeMaker, className: `px-2 py-1 rounded border ${specialMode.startsWith("maker") ? "bg-purple-700 border-purple-300" : "bg-gray-800 border-gray-600"}` }, "2P Code Maker")), specialMode === "maker" && /* @__PURE__ */ React.createElement("div", { className: "mb-2 p-2 rounded-lg bg-purple-950/80 border border-purple-500" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-center text-purple-200 mb-2" }, "Maker only: tap four colors. Duplicates are allowed."), /* @__PURE__ */ React.createElement("div", { className: "flex justify-center gap-2 mb-2" }, makerDraft.map((color, i) => /* @__PURE__ */ React.createElement("button", { key: i, onClick: () => setMakerDraft((d) => d.filter((_, j) => j !== i)), className: "material-palette-peg w-8 h-8 rounded-full border-2 border-white", style: { backgroundColor: color }, "aria-label": "Remove maker color" }, /* @__PURE__ */ React.createElement(PegMaterial, { index: pegMaterialIndex(color) })))), /* @__PURE__ */ React.createElement("div", { className: "flex justify-center gap-2" }, GAME_PRESETS.medium.availableColors.map((color) => /* @__PURE__ */ React.createElement("button", { key: color, onClick: () => makerDraft.length < 4 && setMakerDraft((d) => [...d, color]), className: "material-palette-peg w-8 h-8 rounded-full", style: { backgroundColor: color }, "aria-label": `Add ${COLOR_NAMES[color]}` }, /* @__PURE__ */ React.createElement(PegMaterial, { index: pegMaterialIndex(color) })))), /* @__PURE__ */ React.createElement("button", { onClick: lockMakerCode, disabled: makerDraft.length !== 4, className: "mt-2 w-full py-2 rounded bg-purple-600 font-bold disabled:opacity-40" }, "Lock Secret & Pass Device")), /* @__PURE__ */ React.createElement("div", { className: "breaker-config" }, /* @__PURE__ */ React.createElement("label", { className: "breaker-difficulty" }, /* @__PURE__ */ React.createElement("span", null, "Difficulty"), /* @__PURE__ */ React.createElement(
    "select",
    {
      className: "bg-gray-800 text-white rounded p-1 touch-select",
      value: currentPreset,
      onChange: (e) => dispatch({ type: "SET_DIFFICULTY", preset: e.target.value }),
      disabled: gameStatus !== "playing" || guesses.length > 0 || specialMode !== "classic",
      "aria-label": "Select difficulty level"
    },
    Object.keys(GAME_PRESETS).map((presetKey) => /* @__PURE__ */ React.createElement("option", { key: presetKey, value: presetKey }, presetKey.charAt(0).toUpperCase() + presetKey.slice(1)))
  )), /* @__PURE__ */ React.createElement("div", { className: "breaker-duplicates" }, /* @__PURE__ */ React.createElement("span", null, "Duplicates"), /* @__PURE__ */ React.createElement("label", { className: "switch" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "checkbox",
      checked: allowDuplicates,
      onChange: handleToggleDuplicates,
      disabled: gameStatus !== "playing" || guesses.length > 0 || specialMode !== "classic",
      "aria-label": "Toggle duplicate colors"
    }
  ), /* @__PURE__ */ React.createElement("span", { className: "slider" })), /* @__PURE__ */ React.createElement("span", null, allowDuplicates ? "On" : "Off"))), /* @__PURE__ */ React.createElement("p", { className: "text-center text-cyan-300/80 mb-1 text-sm text-shadow-neon", role: "status", "aria-live": "polite", "aria-atomic": "true" }, comboMessage && comboMessage !== message && /* @__PURE__ */ React.createElement("span", { className: "text-yellow-300 mr-2" }, comboMessage), message)), /* @__PURE__ */ React.createElement("div", { ref: guessListRef, className: "breaker-history flex-1 min-h-[140px] overflow-y-auto mb-2 p-1 rounded-md bg-gray-700/30 border border-gray-600/30", role: "list", "aria-label": "Past guesses and feedback" }, guesses.map((g, index) => /* @__PURE__ */ React.createElement(GuessRow, { key: index, guess: g.code, feedback: g.feedback, codeLength: gameConfig.codeLength, rowNumber: index + 1, isLatest: index === guesses.length - 1 }))), /* @__PURE__ */ React.createElement("section", { className: "breaker-input" }, (() => {
    const nextEmptySlot = gameStatus === "playing" ? currentGuess.indexOf(null) : -1;
    return /* @__PURE__ */ React.createElement("div", { ref: guessInputRef, className: "flex flex-wrap justify-center gap-2 mb-2 p-2 bg-gray-700/50 rounded-lg shadow-inner border border-gray-600/50", "aria-label": "Current guess input area" }, Array.from({ length: gameConfig.codeLength }).map((_, i) => /* @__PURE__ */ React.createElement(
      CodePeg,
      {
        key: `current-${i}`,
        color: currentGuess[i],
        onClick: () => handleGuessPegClick(i),
        index: i,
        totalPegs: gameConfig.codeLength,
        isActiveSlot: i === nextEmptySlot
      }
    )));
  })(), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap justify-center gap-2 mb-1", role: "group", "aria-label": "Color selection palette" }, gameConfig.availableColors.map((color) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: color,
      onClick: () => handlePaletteColorClick(color),
      className: `material-palette-peg rounded-full transition-transform duration-100 ease-in-out hover:scale-110 active:scale-90 color-picker-button ${selectedColorFromPalette === color ? "selected" : ""}`,
      style: { backgroundColor: color },
      disabled: gameStatus !== "playing",
      "aria-label": `Select color ${COLOR_NAMES[color] || color}`,
      "aria-pressed": selectedColorFromPalette === color
    },
    /* @__PURE__ */ React.createElement(PegMaterial, { index: pegMaterialIndex(color) })
  ))), /* @__PURE__ */ React.createElement("div", { className: "flex justify-center mb-1" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => dispatch({ type: "TOGGLE_NOTEPAD" }),
      className: "notepad-toggle-btn",
      "aria-expanded": notepadOpen,
      "aria-controls": "notepad-panel",
      "aria-label": notepadOpen ? "Hide color notepad" : "Show color notepad"
    },
    notepadOpen ? "Hide Notepad" : "Notepad"
  )), /* @__PURE__ */ React.createElement("div", { id: "notepad-panel", className: `notepad-panel ${notepadOpen ? "expanded" : "collapsed"}`, "aria-label": "Color elimination notepad" }, notepadOpen && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-cyan-300/70 mb-2 text-center" }, "Tap each color to cycle Possible → Impossible → Confirmed. All-empty feedback auto-marks impossible."), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap justify-center gap-3" }, gameConfig.availableColors.map((color) => {
    const mark = notebookMarks[color] || (eliminatedColors.includes(color) ? "impossible" : "possible");
    const isElim = mark === "impossible";
    const isConfirmed = mark === "confirmed";
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: color,
        onClick: () => cycleNotebookMark(color),
        className: `notepad-color relative flex flex-col items-center gap-1 ${isElim ? "eliminated" : ""}`,
        "aria-label": `${COLOR_NAMES[color] || color}: ${mark}. Click to cycle note.`
      },
      /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "w-8 h-8 rounded-full border-2 transition-all",
          style: {
            backgroundColor: color,
            borderColor: isElim ? "#ff4444" : isConfirmed ? "#22c55e" : "rgba(255,255,255,0.2)",
            boxShadow: isConfirmed ? "0 0 12px #22c55e" : isElim ? "none" : `0 0 6px ${color}`
          }
        }
      ),
      /* @__PURE__ */ React.createElement("span", { className: `text-xs ${isElim ? "line-through text-red-400" : isConfirmed ? "text-green-300 font-bold" : "text-gray-400"}` }, isConfirmed ? "✓ " : "", COLOR_NAMES[color] || "?")
    );
  })))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap justify-center gap-2" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => dispatch({ type: "USE_HINT" }),
      disabled: hintsRemaining <= 0 || gameStatus !== "playing",
      className: "action-btn py-1.5 px-3 text-sm bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg shadow-lg shadow-purple-700/50 transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
      "aria-label": `Use hint. ${hintsRemaining} hints remaining.`
    },
    "Hint (",
    hintsRemaining,
    ")"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => dispatch({ type: "SHOW_RULES", show: true }),
      className: "action-btn secondary-action-btn py-1.5 px-3 text-sm bg-yellow-700 hover:bg-yellow-800 text-white font-bold rounded-lg shadow-lg shadow-yellow-700/50 transition-all duration-200 transform hover:scale-105 active:scale-95",
      "aria-label": "Show game rules"
    },
    "Rules"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => dispatch({ type: "CLEAR_CURRENT_GUESS" }),
      disabled: gameStatus !== "playing" || currentGuess.every((c) => c === null),
      className: "action-btn py-1.5 px-3 text-sm bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg shadow-lg shadow-gray-600/50 transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
      "aria-label": "Clear current guess"
    },
    "Clear"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleSubmitGuess,
      className: "action-btn py-1.5 px-3 text-sm bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg shadow-lg shadow-blue-700/50 transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
      disabled: gameStatus !== "playing" || currentGuess.includes(null),
      "aria-label": "Submit your guess"
    },
    "Guess"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => dispatch({ type: "UNDO_GUESS" }),
      disabled: !canUndo,
      className: "action-btn py-1.5 px-3 text-sm bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg shadow-lg shadow-red-700/50 transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
      "aria-label": undoUsed ? "Undo already used this game" : "Undo last guess",
      title: undoUsed ? "Undo already used" : "Undo last guess (once per game)"
    },
    "Undo"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleNewGame,
      className: "action-btn py-1.5 px-3 text-sm bg-green-700 hover:bg-green-800 text-white font-bold rounded-lg shadow-lg shadow-green-700/50 transition-all duration-200 transform hover:scale-105 active:scale-95",
      "aria-label": "Start a new game"
    },
    "New Game"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => dispatch({ type: "SHOW_TUTORIAL", show: true }),
      className: "action-btn secondary-action-btn py-1.5 px-3 text-sm bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg shadow-lg shadow-teal-700/50 transition-all duration-200 transform hover:scale-105 active:scale-95",
      "aria-label": "Show tutorial"
    },
    "Tutorial"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => dispatch({ type: "SHOW_HISTORY", show: true }),
      className: "action-btn secondary-action-btn py-1.5 px-3 text-sm bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-lg shadow-lg shadow-indigo-700/50 transition-all duration-200 transform hover:scale-105 active:scale-95",
      "aria-label": "View game history"
    },
    "History"
  ))), gameStatus === "won" && /* @__PURE__ */ React.createElement(
    PostGameSummary,
    {
      gameStatus,
      guesses,
      secretCode,
      codeLength: gameConfig.codeLength,
      elapsedTime,
      formatTime,
      maxCombo,
      currentPreset,
      maxGuesses: gameConfig.maxGuesses,
      onPlayAgain: handleNewGame,
      playAgainRef
    }
  ), gameStatus === "lost" && /* @__PURE__ */ React.createElement(
    PostGameSummary,
    {
      gameStatus,
      guesses,
      secretCode,
      codeLength: gameConfig.codeLength,
      elapsedTime,
      formatTime,
      maxCombo,
      currentPreset,
      maxGuesses: gameConfig.maxGuesses,
      onPlayAgain: handleNewGame,
      playAgainRef: lossPlayAgainRef
    }
  ), showRules && /* @__PURE__ */ React.createElement("div", { className: "modal-overlay", role: "dialog", "aria-modal": "true", "aria-labelledby": "rules-heading", ref: rulesModalRef }, /* @__PURE__ */ React.createElement("div", { className: "modal-content" }, /* @__PURE__ */ React.createElement("button", { ref: rulesCloseRef, onClick: () => dispatch({ type: "SHOW_RULES", show: false }), className: "modal-close-button", "aria-label": "Close rules" }, "×"), /* @__PURE__ */ React.createElement("h2", { id: "rules-heading", className: "text-2xl md:text-3xl font-bold text-cyan-400 mb-4 text-shadow-neon" }, "Game Rules: Code Breaker"), /* @__PURE__ */ React.createElement("p", { className: "text-gray-200 mb-4" }, "Your goal is to guess the secret code, which consists of ", gameConfig.codeLength, " colors. You have ", gameConfig.maxGuesses, " attempts."), /* @__PURE__ */ React.createElement("h3", { className: "text-xl font-bold text-blue-300 mt-4 mb-2" }, "How to Play:"), /* @__PURE__ */ React.createElement("ul", { className: "list-disc list-inside text-gray-200 space-y-2" }, /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("span", { className: "font-bold" }, "Make a Guess:"), /* @__PURE__ */ React.createElement("ul", { className: "list-disc list-inside ml-4 mt-1" }, /* @__PURE__ */ React.createElement("li", null, "Click a color from the palette at the bottom"), /* @__PURE__ */ React.createElement("li", null, "Then click on any empty circle in your current guess area"), /* @__PURE__ */ React.createElement("li", null, "To remove a color, click on a filled circle"))), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("span", { className: "font-bold" }, "Submit Your Guess:"), ' Click "Guess" when your current guess is complete'), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("span", { className: "font-bold" }, "Receive Feedback:"), /* @__PURE__ */ React.createElement("ul", { className: "list-disc list-inside ml-4 mt-1" }, /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("span", { className: "feedback-peg-black inline-block w-3 h-3 rounded-full mr-2" }), " Black: Correct color in correct position"), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("span", { className: "feedback-peg-white inline-block w-3 h-3 rounded-full mr-2" }), " White: Correct color in wrong position"))), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("span", { className: "font-bold" }, "Win or Lose:"), /* @__PURE__ */ React.createElement("ul", { className: "list-disc list-inside ml-4 mt-1" }, /* @__PURE__ */ React.createElement("li", null, "Win: Get ", gameConfig.codeLength, " black pegs"), /* @__PURE__ */ React.createElement("li", null, "Lose: Run out of guesses"))), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("span", { className: "font-bold" }, "Hints:"), " Use the hint button to reveal one correct color (", gameConfig.initialHints, " per game)"), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("span", { className: "font-bold" }, "Clear:"), " Reset your current guess row to start over"), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("span", { className: "font-bold" }, "Undo:"), " Take back your last submitted guess (once per game)"), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("span", { className: "font-bold" }, "Notepad:"), " Track eliminated colors to narrow down the code"), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("span", { className: "font-bold" }, "Game Mode:"), " Toggle between allowing duplicate colors or requiring unique colors, and select difficulty.")))), showHistory && /* @__PURE__ */ React.createElement(GameHistoryModal, { onClose: () => dispatch({ type: "SHOW_HISTORY", show: false }) }), /* @__PURE__ */ React.createElement("div", { className: "breaker-records mt-2 flex justify-between text-xs px-1", role: "contentinfo", "aria-label": "Game statistics" }, /* @__PURE__ */ React.createElement("span", { className: "text-cyan-300" }, "Played: ", /* @__PURE__ */ React.createElement("span", { className: "text-white font-bold" }, stats.gamesPlayed)), /* @__PURE__ */ React.createElement("span", { className: "text-cyan-300" }, "Wins: ", /* @__PURE__ */ React.createElement("span", { className: "text-white font-bold" }, stats.wins)), /* @__PURE__ */ React.createElement("span", { className: "text-cyan-300" }, "Best: ", /* @__PURE__ */ React.createElement("span", { className: "text-white font-bold" }, stats.bestTime === Infinity ? "--:--" : formatTime(stats.bestTime))), /* @__PURE__ */ React.createElement("span", { className: "text-cyan-300" }, "Fewest: ", /* @__PURE__ */ React.createElement("span", { className: "text-white font-bold" }, stats.bestAttempts === Infinity ? "--" : stats.bestAttempts)))));
};
ReactDOM.render(/* @__PURE__ */ React.createElement(MastermindGame, null), document.getElementById("root"));
