
        // --- CONFIGURATION ---
        const PLAYERS = { X: 'X', O: 'O' };
        const GAME_MODES = { PVP: 'PvP', PVAI: 'PvAI' };
        const DIFFICULTIES = { EASY: 'easy', MEDIUM: 'medium', HARD: 'hard' };
        const AI_THINK_DELAY = 800; // Milliseconds for AI to "think"
        const STATS_KEY_PVP = 'ttt-stats-pvp';
        const STATS_KEY_PVAI = 'ttt-stats-pvai';
        const STREAK_KEY_PVP = 'ttt-streak-pvp';
        const STREAK_KEY_PVAI = 'ttt-streak-pvai';
        const THEME_KEY = 'ttt-theme';
        const REPLAY_STEP_DELAY = 600; // ms between replay steps

        // Theme definitions
        const THEMES = [
            { id: 'neon-pink', label: 'Neon Pink' },
            { id: 'classic', label: 'Classic' },
            { id: 'retro-green', label: 'Retro Green' },
        ];

        // --- SOUND ENGINE (Web Audio API) ---
        const SoundEngine = (() => {
            let audioCtx = null;
            let muted = false;

            const getCtx = () => {
                if (!audioCtx) {
                    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                }
                if (audioCtx.state === 'suspended') {
                    audioCtx.resume();
                }
                return audioCtx;
            };

            const playTone = (freq, duration, type = 'square', gain = 0.15, delay = 0) => {
                if (muted) return;
                try {
                    const ctx = getCtx();
                    const osc = ctx.createOscillator();
                    const gainNode = ctx.createGain();
                    osc.type = type;
                    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
                    gainNode.gain.setValueAtTime(gain, ctx.currentTime + delay);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
                    osc.connect(gainNode);
                    gainNode.connect(ctx.destination);
                    osc.start(ctx.currentTime + delay);
                    osc.stop(ctx.currentTime + delay + duration);
                } catch (e) {
                    // Silently fail if audio not supported
                }
            };

            return {
                isMuted: () => muted,
                setMuted: (val) => { muted = val; },
                toggleMute: () => { muted = !muted; return muted; },

                playX: () => {
                    playTone(520, 0.12, 'square', 0.12);
                    playTone(780, 0.08, 'square', 0.08, 0.06);
                },
                playO: () => {
                    playTone(440, 0.15, 'sine', 0.15);
                    playTone(330, 0.1, 'sine', 0.1, 0.07);
                },
                playAIMove: () => {
                    playTone(350, 0.1, 'triangle', 0.08);
                    playTone(500, 0.1, 'triangle', 0.06, 0.08);
                },
                playVictory: () => {
                    playTone(523, 0.15, 'square', 0.12, 0);
                    playTone(659, 0.15, 'square', 0.12, 0.15);
                    playTone(784, 0.15, 'square', 0.12, 0.30);
                    playTone(1047, 0.35, 'square', 0.18, 0.45);
                },
                playDraw: () => {
                    playTone(220, 0.3, 'sawtooth', 0.08);
                    playTone(196, 0.4, 'sawtooth', 0.06, 0.25);
                },
            };
        })();

        // --- STATS HELPERS ---
        const loadStats = (key) => {
            try {
                const raw = localStorage.getItem(key);
                if (raw) return JSON.parse(raw);
            } catch (e) {}
            return { wins: 0, losses: 0, draws: 0 };
        };

        const saveStats = (key, stats) => {
            try {
                localStorage.setItem(key, JSON.stringify(stats));
            } catch (e) {}
        };

        // --- STREAK HELPERS (Feature 1) ---
        const loadStreak = (key) => {
            try {
                const raw = localStorage.getItem(key);
                if (raw) return parseInt(raw, 10) || 0;
            } catch (e) {}
            return 0;
        };

        const saveStreak = (key, val) => {
            try {
                localStorage.setItem(key, String(val));
            } catch (e) {}
        };

        // --- THEME HELPERS (Feature 7) ---
        const loadTheme = () => {
            try {
                return localStorage.getItem(THEME_KEY) || 'neon-pink';
            } catch (e) {}
            return 'neon-pink';
        };

        const saveTheme = (theme) => {
            try {
                localStorage.setItem(THEME_KEY, theme);
            } catch (e) {}
        };

        // --- HELPER FUNCTIONS ---

        const WIN_LINES = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6]             // Diagonals
        ];

        /**
         * Checks if there's a winner on the given board.
         */
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

        /**
         * Checks if the game is a draw (all cells filled).
         */
        const checkDraw = (board) => {
            return board.flat().every(cell => cell !== '');
        };

        /**
         * Early draw detection (Feature 9): checks if any winning line
         * can still be completed by either player. A line is dead if it
         * contains both an X and an O.
         */
        const checkEarlyDraw = (board) => {
            const flatBoard = board.flat();
            // If the board is already full, use normal draw check
            if (flatBoard.every(cell => cell !== '')) return false;

            for (let i = 0; i < WIN_LINES.length; i++) {
                const [a, b, c] = WIN_LINES[i];
                const cells = [flatBoard[a], flatBoard[b], flatBoard[c]];
                const hasX = cells.includes(PLAYERS.X);
                const hasO = cells.includes(PLAYERS.O);
                // If a line has only one player's marks (or empty), it's still winnable
                if (!(hasX && hasO)) {
                    return false; // At least one line is still viable
                }
            }
            // All lines are blocked - early draw
            return true;
        };

        /**
         * Converts a flat array back into a 3x3 board.
         */
        const unflatten = (flat) => {
            return [flat.slice(0, 3), flat.slice(3, 6), flat.slice(6, 9)];
        };

        // --- AI LOGIC ---

        const minimax = (flatBoard, isMaximizing, aiPlayer, alpha, beta, depth) => {
            const opponent = aiPlayer === PLAYERS.X ? PLAYERS.O : PLAYERS.X;
            const board2d = unflatten(flatBoard);

            // Depth-adjusted scores: prefer the fastest win and the slowest loss
            if (checkWinner(board2d, aiPlayer)) return 10 - depth;
            if (checkWinner(board2d, opponent)) return depth - 10;
            if (flatBoard.every(cell => cell !== '')) return 0;

            const emptyCells = [];
            for (let i = 0; i < 9; i++) {
                if (flatBoard[i] === '') emptyCells.push(i);
            }

            if (isMaximizing) {
                let best = -Infinity;
                for (const idx of emptyCells) {
                    flatBoard[idx] = aiPlayer;
                    const score = minimax(flatBoard, false, aiPlayer, alpha, beta, depth + 1);
                    flatBoard[idx] = '';
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
                    flatBoard[idx] = '';
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
                if (flatBoard[i] === '') {
                    flatBoard[i] = aiPlayer;
                    const score = minimax(flatBoard, false, aiPlayer, -Infinity, Infinity, 1);
                    flatBoard[i] = '';
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
            const emptyCells = flatBoard.map((cell, i) => cell === '' ? i : -1).filter(i => i !== -1);
            return emptyCells[Math.floor(Math.random() * emptyCells.length)];
        };

        const getAIMoveMedium = (board, aiPlayer) => {
            const opponent = aiPlayer === PLAYERS.X ? PLAYERS.O : PLAYERS.X;
            const flatBoard = board.flat();
            const emptyCells = flatBoard.map((cell, index) => cell === '' ? index : -1).filter(index => index !== -1);

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
            const availableCorners = corners.filter(corner => emptyCells.includes(corner));
            if (availableCorners.length > 0) {
                return availableCorners[Math.floor(Math.random() * availableCorners.length)];
            }

            const sides = [1, 3, 5, 7];
            const availableSides = sides.filter(side => emptyCells.includes(side));
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

        // --- CONFETTI ENGINE (Feature 8) ---
        const ConfettiEngine = (() => {
            let animFrame = null;
            let particles = [];
            let canvas = null;
            let ctx = null;
            let cssW = 0;
            let cssH = 0;

            const PARTICLE_COUNT = 80;
            const COLORS = ['#FF007F', '#00FFFF', '#FFFF00', '#FF6600', '#00FF00', '#FF00FF', '#4488FF'];
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
                    decay: 0.005 + Math.random() * 0.008,
                    shape: Math.random() > 0.5 ? 'rect' : 'circle',
                };
            };

            let lastTime = 0;
            const update = (now) => {
                animFrame = null;
                if (!canvas || !ctx || document.hidden) return;
                const dt60 = lastTime ? Math.min(now - lastTime, 50) / (1000 / 60) : 1;
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
                    ctx.rotate((p.rotation * Math.PI) / 180);
                    ctx.globalAlpha = Math.max(0, p.life);
                    ctx.fillStyle = p.color;

                    if (p.shape === 'rect') {
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
                if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
                canvas = canvasEl;
                if (!canvas) return;
                ctx = canvas.getContext('2d');
                // Size the backing store for the device pixel ratio so confetti is
                // crisp on Retina displays. Dimensions are re-read on every burst,
                // so a rotation before the next win is picked up automatically.
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

            document.addEventListener('visibilitychange', () => {
                if (document.hidden) { if (animFrame) cancelAnimationFrame(animFrame); animFrame = null; }
                else if (particles.length && !animFrame) { lastTime = 0; animFrame = requestAnimationFrame(update); }
            });
            window.addEventListener('resize', () => {
                if (!canvas || !ctx) return;
                cssW = innerWidth; cssH = innerHeight;
                const dpr = Math.min(devicePixelRatio || 1, 2);
                canvas.width = cssW * dpr; canvas.height = cssH * dpr;
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            });
            return { start, stop };
        })();


        // --- COMPONENTS ---

        /**
         * Rules modal with focus trapping and escape key support.
         */
        const RulesModal = ({ onClose }) => {
            const closeRef = React.useRef(null);
            const modalRef = React.useRef(null);

            React.useEffect(() => {
                const prevFocus = document.activeElement;
                if (closeRef.current) closeRef.current.focus();

                return () => {
                    if (prevFocus && typeof prevFocus.focus === 'function') {
                        prevFocus.focus();
                    }
                };
            }, []);

            React.useEffect(() => {
                const handleKeyDown = (e) => {
                    if (e.key === 'Escape') {
                        e.preventDefault();
                        onClose();
                    }
                };
                document.addEventListener('keydown', handleKeyDown);
                return () => document.removeEventListener('keydown', handleKeyDown);
            }, [onClose]);

            const handleModalKeyDown = (e) => {
                if (e.key !== 'Tab') return;
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

            return (
                <div
                    className="modal-overlay"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Game rules"
                    onKeyDown={handleModalKeyDown}
                    ref={modalRef}
                    onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
                >
                    <div className="modal-content">
                        <button
                            ref={closeRef}
                            onClick={onClose}
                            className="modal-close-button"
                            aria-label="Close rules"
                        >
                            &times;
                        </button>
                        <h2 className="text-3xl font-bold text-cyan-400 mb-4 text-shadow-neon">Game Rules: Tic-Tac-Toe</h2>
                        <p className="text-gray-200 mb-2">
                            The classic game of Tic-Tac-Toe! Get three of your marks ('X' or 'O') in a row, column, or diagonal to win.
                        </p>
                        <h3 className="text-xl font-bold text-blue-300 mt-4 mb-2">How to Play:</h3>
                        <ul className="list-disc list-inside text-gray-200 space-y-2">
                            <li>
                                <strong>Choose a Mode:</strong> Select "1 vs 1 (Local)" to play against another person on the same device, or "1 vs AI" to challenge the computer.
                            </li>
                            <li>
                                <strong>Take Turns:</strong> Players take turns placing their mark ('X' or 'O') into an empty square on the 3x3 grid.
                            </li>
                            <li>
                                <strong>Win Condition:</strong> The first player to get three of their marks in a horizontal, vertical, or diagonal row wins the game.
                            </li>
                            <li>
                                <strong>Draw:</strong> If all 9 squares are filled and no player has achieved three in a row, the game is a draw. The game also detects early draws when no winning lines remain possible.
                            </li>
                            <li>
                                <strong>Difficulty:</strong> In AI mode, choose <strong>Easy</strong> (random), <strong>Medium</strong> (heuristic), or <strong>Hard</strong> (unbeatable minimax).
                            </li>
                            <li>
                                <strong>First Move:</strong> In AI mode, you can choose to play as X (go first) or O (go second).
                            </li>
                            <li>
                                <strong>Undo:</strong> Click the <strong>"Undo"</strong> button to take back your last move. In AI mode, this undoes both your move and the AI's response.
                            </li>
                            <li>
                                <strong>Replay:</strong> After a game ends, click <strong>"Replay"</strong> to step through the move history one move at a time.
                            </li>
                            <li>
                                <strong>Pause/Resume:</strong> Click the <strong>"Pause"</strong> button to temporarily stop the game and blur the screen. Click <strong>"Resume"</strong> to continue.
                            </li>
                            <li>
                                <strong>Custom Names:</strong> Enter nicknames on the start screen to personalise the game.
                            </li>
                            <li>
                                <strong>Themes:</strong> Switch between Neon Pink, Classic, and Retro Green board themes.
                            </li>
                            <li>
                                <strong>New Game:</strong> Click the "New Game" button to start over.
                            </li>
                        </ul>
                    </div>
                </div>
            );
        };

        /**
         * Represents a single cell on the Tic-Tac-Toe board.
         */
        // Raised resin pieces share the existing X/O theme colors and all original hit areas.
        const PhysicalMark = ({mark,pieceId}) => {
            const x=mark===PLAYERS.X;
            const shape=x?'M22 10 50 38 78 10 90 22 62 50 90 78 78 90 50 62 22 90 10 78 38 50 10 22Z':'M50 9a41 41 0 1 0 0 82a41 41 0 1 0 0-82Z M50 29a21 21 0 1 1 0 42a21 21 0 1 1 0-42Z';
            const id='piece-face-'+pieceId;
            return <svg className={`physical-mark ${x?'x-color':'o-color'}`} viewBox="0 0 100 108" aria-hidden="true">
                <defs><linearGradient id={id} x1=".1" y1="0" x2=".8" y2="1"><stop offset="0" stopColor="#fff9f5"/><stop offset=".20" stopColor="currentColor"/><stop offset=".7" stopColor="currentColor"/><stop offset="1" stopColor="#121d24"/></linearGradient></defs>
                <path d={shape} fill="#090d14" fillRule="evenodd" transform="translate(0 7)" opacity=".65"/>
                <path d={shape} fill="currentColor" fillRule="evenodd" transform="translate(0 4)" stroke="#06111d" strokeWidth="1.8"/>
                <path d={shape} fill={`url(#${id})`} fillRule="evenodd" stroke="currentColor" strokeWidth="1"/>
                <path d={shape} fill="none" fillRule="evenodd" stroke="#ffffffb0" strokeWidth="1.3" transform="translate(-.5 -.5)"/>
                {x?<path d="M24 17 48 41 M17 25 40 48" stroke="#fff" strokeWidth="2" opacity=".65" fill="none"/>:<path d="M19 46a32 32 0 0 1 37-28" stroke="#fff" strokeWidth="2.2" opacity=".7" fill="none"/>}
            </svg>;
        };

        const Cell = ({ value, onClick, row, col, ghostMark, canInteract, entranceDelay }) => {
            const [hovered, setHovered] = React.useState(false);
            const isOccupied = !!value;
            const showGhost = window.matchMedia('(hover: hover)').matches && hovered && !isOccupied && canInteract && ghostMark;

            const entranceStyle = {
                '--stone-x':`${col*50}%`,'--stone-y':`${row*50}%`,
                ...(entranceDelay !== undefined ? {animationDelay:`${entranceDelay}ms`} : {})
            };

            const entranceClass = entranceDelay !== undefined ? 'cell-entrance' : '';

            return (
                <div
                    className={`cell rounded-lg transition-all duration-200 ${isOccupied ? 'occupied' : 'cursor-pointer'} ${entranceClass}`}
                    style={entranceStyle}
                    onClick={isOccupied ? undefined : onClick}
                    onKeyDown={isOccupied ? undefined : (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                    role="gridcell"
                    tabIndex={isOccupied ? "-1" : "0"}
                    aria-disabled={isOccupied ? "true" : undefined}
                    aria-label={`Row ${row + 1}, column ${col + 1}${value ? `, marked ${value}` : ', empty'}`}
                >
                    {value && (
                        <div className={`cell-content ${value === PLAYERS.X ? 'x-color' : 'o-color'}`} aria-hidden="true">
                            <PhysicalMark mark={value} pieceId={`${row}-${col}`}/>
                        </div>
                    )}
                    {showGhost && (
                        <div className={`cell-ghost ${ghostMark === PLAYERS.X ? 'x-color' : 'o-color'}`} aria-hidden="true">
                            <PhysicalMark mark={ghostMark} pieceId={`ghost-${row}-${col}`}/>
                        </div>
                    )}
                </div>
            );
        };

        /**
         * SVG win line overlay using grid-relative coordinates.
         */
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

            return (
                <svg
                    className="win-line-svg"
                    viewBox="0 0 3 3"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                        zIndex: 10,
                    }}
                >
                    <line
                        x1={x1} y1={y1}
                        x2={x2} y2={y2}
                        stroke={getComputedStyle(document.documentElement).getPropertyValue('--theme-win-line').trim() || '#FFFF00'}
                        strokeWidth="0.12"
                        strokeLinecap="round"
                        pathLength="1"
                        style={{ filter: 'drop-shadow(0 0 3px #FFFF00)' }}
                    />
                </svg>
            );
        };

        const PRO_VARIANTS = {
            four: { title: '4 × 4', subtitle: 'Make four in a row on the larger board.' },
            misere: { title: 'Misère', subtitle: 'Making three in a row loses.' },
            ultimate: { title: 'Ultimate', subtitle: 'Your move sends the opponent to that matching mini-board.' },
            puzzles: { title: 'Tactics Lab', subtitle: 'Win, block, and build forks from crafted positions.' },
            coach: { title: 'Teaching AI', subtitle: 'Play the bot with live, plain-language strategy coaching.' }
        };

        const TACTICAL_PUZZLES = [
            { title: 'Win in one', goal: 'Finish the row.', board: ['X','X','','O','O','','','',''], answers: [2] },
            { title: 'Block the threat', goal: 'Stop O from winning.', board: ['O','','X','O','X','','','',''], answers: [6] },
            { title: 'Build a fork', goal: 'Create two winning threats.', board: ['X','','','','O','','','','X'], answers: [2,6] },
            { title: 'Force the draw', goal: 'Find the only safe square.', board: ['X','O','X','X','O','','O','X',''], answers: [8] }
        ];

        const lineResult = (cells, size, needed = size) => {
            const lines = [];
            for (let r = 0; r < size; r++) lines.push(Array.from({length: size}, (_, c) => r * size + c));
            for (let c = 0; c < size; c++) lines.push(Array.from({length: size}, (_, r) => r * size + c));
            lines.push(Array.from({length: size}, (_, i) => i * size + i));
            lines.push(Array.from({length: size}, (_, i) => i * size + (size - 1 - i)));
            for (const line of lines) {
                for (let start = 0; start <= line.length - needed; start++) {
                    const run = line.slice(start, start + needed);
                    const mark = cells[run[0]];
                    if (mark && run.every(i => cells[i] === mark)) return { mark, line: run };
                }
            }
            return null;
        };

        const coachAdvice = (cells) => {
            const empty = cells.map((v, i) => v ? -1 : i).filter(i => i >= 0);
            for (const mark of ['X', 'O']) {
                for (const i of empty) {
                    const copy = [...cells]; copy[i] = mark;
                    if (lineResult(copy, 3, 3)) return mark === 'X'
                        ? `Winning move: square ${i + 1} completes your line.`
                        : `Block square ${i + 1}—the bot can win there next.`;
                }
            }
            if (!cells[4]) return 'Own the center: it belongs to four possible winning lines.';
            const openCorners = [0,2,6,8].filter(i => !cells[i]);
            if (openCorners.length) return `Try corner ${openCorners[0] + 1}. Corners create more fork chances than edges.`;
            return 'Look for a fork: a move that creates two different winning squares.';
        };

        const ProTicTacToe = ({ kind, onExit }) => {
            const isUltimate = kind === 'ultimate';
            const isFour = kind === 'four';
            const isPuzzle = kind === 'puzzles';
            const isCoach = kind === 'coach';
            const size = isFour ? 4 : 3;
            const fresh = () => Array(isUltimate ? 81 : size * size).fill('');
            const [cells, setCells] = React.useState(fresh);
            const [turn, setTurn] = React.useState('X');
            const [status, setStatus] = React.useState(PRO_VARIANTS[kind].subtitle);
            const [over, setOver] = React.useState(false);
            const [activeMini, setActiveMini] = React.useState(null);
            const [miniWinners, setMiniWinners] = React.useState(Array(9).fill(''));
            const [puzzleIndex, setPuzzleIndex] = React.useState(0);
            const aiTimer = React.useRef(null);

            const reset = React.useCallback((nextPuzzle = puzzleIndex) => {
                const initial = isPuzzle ? [...TACTICAL_PUZZLES[nextPuzzle].board] : fresh();
                setCells(initial); setTurn('X'); setOver(false); setActiveMini(null); setMiniWinners(Array(9).fill(''));
                setStatus(isPuzzle ? TACTICAL_PUZZLES[nextPuzzle].goal : (isCoach ? coachAdvice(initial) : PRO_VARIANTS[kind].subtitle));
            }, [kind, puzzleIndex]);

            React.useEffect(() => { reset(puzzleIndex); return () => clearTimeout(aiTimer.current); }, [kind, puzzleIndex]);

            const finishStandardMove = (next, mark, index) => {
                if (isPuzzle) {
                    if (TACTICAL_PUZZLES[puzzleIndex].answers.includes(index)) {
                        setCells(next); setOver(true); setStatus('Solved! That is the key move.'); SoundEngine.playVictory();
                    } else {
                        setStatus('That move misses the tactic. Try another square.'); SoundEngine.playDraw();
                    }
                    return;
                }
                const result = lineResult(next, size, size);
                if (result) {
                    const winnerMark = kind === 'misere' ? (mark === 'X' ? 'O' : 'X') : mark;
                    setCells(next); setOver(true);
                    setStatus(kind === 'misere' ? `${mark} made a line—${winnerMark} wins!` : `${winnerMark} wins!`);
                    SoundEngine.playVictory(); return;
                }
                if (next.every(Boolean)) { setCells(next); setOver(true); setStatus('Draw!'); return; }
                setCells(next); setTurn(mark === 'X' ? 'O' : 'X');
                setStatus(isCoach ? coachAdvice(next) : `${mark === 'X' ? 'O' : 'X'} to move`);
            };

            const makeMove = (index) => {
                if (over || cells[index]) return;
                if (isCoach && turn === 'O') return;
                if (isUltimate) {
                    const mini = Math.floor(index / 9);
                    if (miniWinners[mini] || (activeMini !== null && mini !== activeMini)) return;
                    const next = [...cells]; next[index] = turn;
                    const local = next.slice(mini * 9, mini * 9 + 9);
                    const localResult = lineResult(local, 3, 3);
                    const winners = [...miniWinners];
                    if (localResult) winners[mini] = turn;
                    else if (local.every(Boolean)) winners[mini] = 'D';
                    const globalResult = lineResult(winners.map(v => v === 'D' ? '' : v), 3, 3);
                    const destination = index % 9;
                    setCells(next); setMiniWinners(winners);
                    if (globalResult) { setOver(true); setStatus(`${turn} conquers the Ultimate board!`); SoundEngine.playVictory(); return; }
                    if (winners.every(Boolean)) { setOver(true); setStatus('Ultimate draw!'); return; }
                    setActiveMini(winners[destination] ? null : destination);
                    setTurn(turn === 'X' ? 'O' : 'X');
                    setStatus(`${turn === 'X' ? 'O' : 'X'}: play ${winners[destination] ? 'on any open board' : `mini-board ${destination + 1}`}`);
                    return;
                }
                const next = [...cells]; next[index] = turn;
                finishStandardMove(next, turn, index);
                if (isCoach && turn === 'X' && !lineResult(next, 3, 3) && next.some(v => !v)) {
                    aiTimer.current = setTimeout(() => {
                        const aiIndex = getAIMove(unflatten(next), 'O', DIFFICULTIES.MEDIUM);
                        if (aiIndex >= 0) { const afterAI = [...next]; afterAI[aiIndex] = 'O'; finishStandardMove(afterAI, 'O', aiIndex); }
                    }, 500);
                }
            };

            const nextPuzzle = () => setPuzzleIndex(i => (i + 1) % TACTICAL_PUZZLES.length);
            return <div className="mini-shell min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
                <div className="variant-layout w-full max-w-2xl bg-black/50 border border-cyan-700 rounded-2xl p-5 text-center shadow-2xl">
                    <div className="flex justify-between items-center gap-3 mb-3">
                        <button className="action-btn px-3 py-2 bg-gray-700 rounded-lg" onClick={onExit}>← Modes</button>
                        <div><h1 className="text-3xl font-black text-cyan-300">{PRO_VARIANTS[kind].title}</h1>{isPuzzle && <b className="text-yellow-300">{TACTICAL_PUZZLES[puzzleIndex].title}</b>}</div>
                        <button className="action-btn px-3 py-2 bg-purple-700 rounded-lg" onClick={() => reset()}>Reset</button>
                    </div>
                    <p className="min-h-[3rem] text-cyan-100 bg-cyan-950/60 rounded-lg p-3 mb-4" role="status">{status}</p>
                    {isUltimate ? <div className="variant-board grid grid-cols-3 gap-2 max-w-[560px] mx-auto">
                        {Array.from({length:9}, (_, mini) => <div key={mini} className={`relative grid grid-cols-3 gap-1 p-1 rounded-lg border-2 ${activeMini === null || activeMini === mini ? 'border-cyan-400' : 'border-gray-700 opacity-60'} ${miniWinners[mini] ? 'bg-purple-950' : 'bg-gray-800'}`}>
                            {Array.from({length:9}, (_, local) => { const idx = mini * 9 + local; return <button key={local} onClick={() => makeMove(idx)} aria-label={`Board ${mini+1}, square ${local+1}${cells[idx]?`, ${cells[idx]}`:', empty'}`} className="aspect-square rounded bg-gray-950 text-lg sm:text-2xl font-black hover:bg-cyan-950 disabled:opacity-50" disabled={!!cells[idx] || !!miniWinners[mini] || (activeMini !== null && activeMini !== mini)}>{cells[idx]&&<PhysicalMark mark={cells[idx]} pieceId={`ultimate-${mini}-${local}`}/>}</button>; })}
                            {miniWinners[mini] && <span className="absolute inset-0 flex items-center justify-center bg-black/70 text-6xl font-black text-yellow-300 pointer-events-none">{miniWinners[mini] === 'D' ? '•' : <PhysicalMark mark={miniWinners[mini]} pieceId={`board-winner-${mini}`}/>}</span>}
                        </div>)}
                    </div> : <div className={`variant-board grid gap-2 mx-auto max-w-[480px] ${isFour ? 'grid-cols-4' : 'grid-cols-3'}`}>
                        {cells.map((v,i) => <button key={i} onClick={() => makeMove(i)} disabled={!!v || over || (isCoach && turn === 'O')} aria-label={`Square ${i + 1}`} className="aspect-square rounded-xl border-2 border-cyan-700 bg-gray-950 text-4xl sm:text-6xl font-black hover:bg-cyan-950 disabled:cursor-default">{v&&<PhysicalMark mark={v} pieceId={`variant-${i}`}/>}</button>)}
                    </div>}
                    <div className="mt-4 flex justify-center gap-3">
                        {isPuzzle && <button onClick={nextPuzzle} className="action-btn px-5 py-2 rounded-lg bg-green-700">Next Puzzle</button>}
                        {isCoach && <span className="text-sm text-gray-300">Squares are numbered left-to-right, top-to-bottom.</span>}
                    </div>
                </div>
            </div>;
        };

        /**
         * Main Tic-Tac-Toe game component.
         */
        const TicTacToeGame = () => {
            const emptyBoard = () => Array(3).fill(null).map(() => Array(3).fill(''));

            const [board, setBoard] = React.useState(emptyBoard());
            const [currentPlayer, setCurrentPlayer] = React.useState(PLAYERS.X);
            const [gameMode, setGameMode] = React.useState(null); // null, 'PvP', 'PvAI'
            const [difficulty, setDifficulty] = React.useState(DIFFICULTIES.MEDIUM);
            const [winner, setWinner] = React.useState(null); // null, 'X', 'O', 'Draw'
            const [winningLine, setWinningLine] = React.useState(null);
            const [message, setMessage] = React.useState('');
            const [showRules, setShowRules] = React.useState(false);
            const [isPaused, setIsPaused] = React.useState(false);
            const [aiThinking, setAiThinking] = React.useState(false);
            const [isMuted, setIsMuted] = React.useState(SoundEngine.isMuted());
            const [proMode, setProMode] = React.useState(null);

            // Move history for undo: array of { board, currentPlayer } snapshots
            const [moveHistory, setMoveHistory] = React.useState([]);

            // Feature 1: Win streak
            const [streakPvp, setStreakPvp] = React.useState(() => loadStreak(STREAK_KEY_PVP));
            const [streakPvai, setStreakPvai] = React.useState(() => loadStreak(STREAK_KEY_PVAI));

            // Feature 2: Board entrance animation key
            const [boardKey, setBoardKey] = React.useState(0);

            // Feature 3: First-move chooser for PvAI
            const [humanPlayer, setHumanPlayer] = React.useState(PLAYERS.X);
            const [aiPlayer, setAiPlayer] = React.useState(PLAYERS.O);
            const [choosingFirstMove, setChoosingFirstMove] = React.useState(false);

            // Feature 4: Game Replay
            const [gameMoves, setGameMoves] = React.useState([]); // Array of { index, player } for replay
            const [isReplaying, setIsReplaying] = React.useState(false);
            const [replayStep, setReplayStep] = React.useState(0);
            const replayTimeoutRef = React.useRef(null);

            // Feature 6: Custom player names
            const [nameX, setNameX] = React.useState('');
            const [nameO, setNameO] = React.useState('');

            // Feature 7: Board theme
            const [theme, setTheme] = React.useState(() => loadTheme());

            // Feature 8: Confetti canvas ref
            const confettiCanvasRef = React.useRef(null);

            // Feature 9: Early draw message
            const [earlyDrawMessage, setEarlyDrawMessage] = React.useState('');

            // Stats
            const [statsPvp, setStatsPvp] = React.useState(() => loadStats(STATS_KEY_PVP));
            const [statsPvai, setStatsPvai] = React.useState(() => loadStats(STATS_KEY_PVAI));

            // Two-tap confirm for the destructive stats Reset button
            const [confirmingStatsReset, setConfirmingStatsReset] = React.useState(false);
            const statsResetTimeoutRef = React.useRef(null);

            // Ref to hold AI timeout for proper cleanup
            const aiTimeoutRef = React.useRef(null);
            const boardRef = React.useRef(board);
            React.useEffect(() => { boardRef.current = board; }, [board]);
            const difficultyRef = React.useRef(difficulty);
            React.useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);
            const gridRef = React.useRef(null);
            const winButtonRef = React.useRef(null);

            // Apply theme to document
            React.useEffect(() => {
                if (theme === 'neon-pink') {
                    document.documentElement.removeAttribute('data-theme');
                } else {
                    document.documentElement.setAttribute('data-theme', theme);
                }
            }, [theme]);

            const handleThemeChange = (newTheme) => {
                setTheme(newTheme);
                saveTheme(newTheme);
            };

            // Clean up AI timeout on unmount
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

            // Helper to get display name for a player mark
            const getPlayerName = (mark) => {
                if (mark === PLAYERS.X) {
                    return nameX || 'Player X';
                }
                return nameO || 'Player O';
            };

            // Record outcome to stats and update streak (Feature 1)
            const recordOutcome = React.useCallback((outcome) => {
                if (!gameMode) return;
                const key = gameMode === GAME_MODES.PVP ? STATS_KEY_PVP : STATS_KEY_PVAI;
                const streakKey = gameMode === GAME_MODES.PVP ? STREAK_KEY_PVP : STREAK_KEY_PVAI;
                const setter = gameMode === GAME_MODES.PVP ? setStatsPvp : setStatsPvai;
                const streakSetter = gameMode === GAME_MODES.PVP ? setStreakPvp : setStreakPvai;

                setter(prev => {
                    const next = { ...prev };
                    if (outcome === 'draw') {
                        next.draws += 1;
                    } else if (gameMode === GAME_MODES.PVP) {
                        if (outcome === 'X_wins') next.wins += 1;
                        else next.losses += 1;
                    } else {
                        // PvAI: determine win/loss from human player perspective
                        const humanWon = (outcome === 'X_wins' && humanPlayer === PLAYERS.X) ||
                                         (outcome === 'O_wins' && humanPlayer === PLAYERS.O);
                        if (humanWon) next.wins += 1;
                        else next.losses += 1;
                    }
                    saveStats(key, next);
                    return next;
                });

                // Update streak (Feature 1)
                streakSetter(prev => {
                    let isWin = false;
                    if (outcome === 'draw') {
                        // Draw doesn't change streak
                        return prev;
                    } else if (gameMode === GAME_MODES.PVP) {
                        isWin = outcome === 'X_wins';
                    } else {
                        isWin = (outcome === 'X_wins' && humanPlayer === PLAYERS.X) ||
                                (outcome === 'O_wins' && humanPlayer === PLAYERS.O);
                    }
                    const newStreak = isWin ? prev + 1 : 0;
                    saveStreak(streakKey, newStreak);
                    return newStreak;
                });
            }, [gameMode, humanPlayer]);

            // Handle a player's move
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
                    setEarlyDrawMessage('');
                    SoundEngine.playVictory();
                    recordOutcome(winResult.winner === PLAYERS.X ? 'X_wins' : 'O_wins');
                    // Feature 8: Trigger confetti
                    if (confettiCanvasRef.current) {
                        ConfettiEngine.start(confettiCanvasRef.current);
                    }
                } else if (checkDraw(newBoard)) {
                    setWinner('Draw');
                    setMessage("It's a DRAW!");
                    setEarlyDrawMessage('');
                    SoundEngine.playDraw();
                    recordOutcome('draw');
                } else if (checkEarlyDraw(newBoard)) {
                    // Feature 9: Early draw detection
                    setWinner('Draw');
                    setMessage("Draw - No possible wins remaining.");
                    setEarlyDrawMessage("Draw - No possible wins remaining.");
                    SoundEngine.playDraw();
                    recordOutcome('draw');
                } else {
                    const nextPlayer = playerMoved === PLAYERS.X ? PLAYERS.O : PLAYERS.X;
                    setCurrentPlayer(nextPlayer);
                    setMessage(`${getPlayerName(nextPlayer)}'s turn`);
                }
            }, [recordOutcome, nameX, nameO]);

            // AI move logic - now uses dynamic aiPlayer instead of hardcoded O
            const handleAIMove = React.useCallback(() => {
                if (gameMode === GAME_MODES.PVAI && currentPlayer === aiPlayer && !winner && !checkDraw(board) && !checkEarlyDraw(board) && !isPaused) {
                    setAiThinking(true);
                    setMessage("AI is thinking...");
                    aiTimeoutRef.current = setTimeout(() => {
                        aiTimeoutRef.current = null;
                        const latestBoard = boardRef.current;
                        const moveIndex = getAIMove(latestBoard, aiPlayer, difficultyRef.current);
                        if (moveIndex === -1 || moveIndex === undefined) return;
                        const newBoardFlat = [...latestBoard.flat()];
                        newBoardFlat[moveIndex] = aiPlayer;
                        const updatedBoard = unflatten(newBoardFlat);

                        // Save state before AI move for undo
                        setMoveHistory(prev => [...prev, { board: latestBoard, currentPlayer: aiPlayer }]);

                        // Record move for replay (Feature 4)
                        setGameMoves(prev => [...prev, { index: moveIndex, player: aiPlayer }]);

                        handleMove(updatedBoard, aiPlayer, true);
                        setAiThinking(false);
                    }, AI_THINK_DELAY);
                }
            }, [board, currentPlayer, gameMode, winner, isPaused, handleMove, aiPlayer]);

            // Effect to trigger AI's turn
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

            // Handle cell click from UI
            const handleCellClick = React.useCallback((rowIndex, colIndex) => {
                if (winner || isPaused || aiThinking || isReplaying || board[rowIndex][colIndex] !== '') {
                    return;
                }

                // In PvAI, only allow human player to click
                if (gameMode === GAME_MODES.PVAI && currentPlayer !== humanPlayer) {
                    return;
                }

                setMoveHistory(prev => [...prev, { board: board, currentPlayer: currentPlayer }]);

                // Record move for replay (Feature 4)
                const flatIndex = rowIndex * 3 + colIndex;
                setGameMoves(prev => [...prev, { index: flatIndex, player: currentPlayer }]);

                const newBoard = board.map(row => [...row]);
                newBoard[rowIndex][colIndex] = currentPlayer;

                handleMove(newBoard, currentPlayer, false);
            }, [winner, isPaused, aiThinking, isReplaying, board, currentPlayer, handleMove, gameMode, humanPlayer]);

            // Undo handler
            const handleUndo = React.useCallback(() => {
                if (moveHistory.length === 0 || winner || aiThinking || isPaused || isReplaying) return;
                // In PvAI the human must have actually moved: with only the AI's
                // opening move in history there is nothing of the human's to undo.
                if (gameMode === GAME_MODES.PVAI && moveHistory.length < 2 && humanPlayer !== PLAYERS.X) return;

                if (gameMode === GAME_MODES.PVAI && moveHistory.length >= 2) {
                    const playerState = moveHistory[moveHistory.length - 2];
                    setBoard(playerState.board);
                    setCurrentPlayer(playerState.currentPlayer);
                    setMoveHistory(prev => prev.slice(0, -2));
                    setGameMoves(prev => prev.slice(0, -2));
                    setMessage(`${getPlayerName(playerState.currentPlayer)}'s turn`);
                } else {
                    const prevState = moveHistory[moveHistory.length - 1];
                    setBoard(prevState.board);
                    setCurrentPlayer(prevState.currentPlayer);
                    setMoveHistory(prev => prev.slice(0, -1));
                    setGameMoves(prev => prev.slice(0, -1));
                    setMessage(`${getPlayerName(prevState.currentPlayer)}'s turn`);
                }
            }, [moveHistory, winner, aiThinking, isPaused, gameMode, isReplaying, humanPlayer, nameX, nameO]);

            const canUndo = moveHistory.length > 0 && !winner && !aiThinking && !isPaused && !isReplaying &&
                (gameMode !== GAME_MODES.PVAI || moveHistory.length >= 2 || humanPlayer === PLAYERS.X);

            // --- Feature 4: Game Replay ---
            const startReplay = React.useCallback(() => {
                if (gameMoves.length === 0) return;
                setIsReplaying(true);
                setReplayStep(0);
                setBoard(emptyBoard());
                setWinner(null);
                setWinningLine(null);
                setEarlyDrawMessage('');
                setMessage('Replaying...');
            }, [gameMoves]);

            // Replay stepper effect
            React.useEffect(() => {
                if (!isReplaying) return;

                if (replayStep >= gameMoves.length) {
                    // Replay finished - restore final state
                    replayTimeoutRef.current = setTimeout(() => {
                        // Rebuild final board from all moves
                        const finalFlat = Array(9).fill('');
                        gameMoves.forEach(m => { finalFlat[m.index] = m.player; });
                        const finalBoard = unflatten(finalFlat);
                        setBoard(finalBoard);

                        // Check for winner on final board
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
                            setWinner('Draw');
                            setMessage(earlyDrawMessage || "It's a DRAW!");
                        }
                        setIsReplaying(false);
                    }, REPLAY_STEP_DELAY);
                    return;
                }

                replayTimeoutRef.current = setTimeout(() => {
                    const move = gameMoves[replayStep];
                    setBoard(prevBoard => {
                        const flat = [...prevBoard.flat()];
                        flat[move.index] = move.player;
                        return unflatten(flat);
                    });
                    setMessage(`Replaying... move ${replayStep + 1}/${gameMoves.length}`);
                    setReplayStep(prev => prev + 1);
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
                // Restore final board state
                const finalFlat = Array(9).fill('');
                gameMoves.forEach(m => { finalFlat[m.index] = m.player; });
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
                    setWinner('Draw');
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
                setMessage('');
                setIsPaused(false);
                setAiThinking(false);
                setMoveHistory([]);
                setGameMoves([]);
                setIsReplaying(false);
                setReplayStep(0);
                setEarlyDrawMessage('');
                setGameMode(null);
                setChoosingFirstMove(false);
                setHumanPlayer(PLAYERS.X);
                setAiPlayer(PLAYERS.O);
                // Increment boardKey so next game gets entrance animation
                setBoardKey(prev => prev + 1);
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
                setEarlyDrawMessage('');
                setBoardKey(prev => prev + 1);

                if (gameMode === GAME_MODES.PVAI && humanPlayer === PLAYERS.O) {
                    // AI goes first as X
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

            // Stats Reset is destructive (wipes W/L/D and streak) - require a
            // second tap within 3 seconds to confirm.
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
                    }, 3000);
                }
            };

            const handleMuteToggle = () => {
                const nowMuted = SoundEngine.toggleMute();
                setIsMuted(nowMuted);
            };

            // Focus management: move focus to Play Again button when win/draw overlay appears
            React.useEffect(() => {
                if (winner && !isReplaying && winButtonRef.current) {
                    winButtonRef.current.focus();
                }
            }, [winner, isReplaying]);

            // Feature 3: Start game flow
            const startGame = (mode) => {
                if (mode === GAME_MODES.PVAI) {
                    setChoosingFirstMove(true);
                    setGameMode(mode);
                } else {
                    setGameMode(mode);
                    setMessage(`${getPlayerName(PLAYERS.X)}'s turn`);
                    setMoveHistory([]);
                    setGameMoves([]);
                    setBoardKey(prev => prev + 1);
                }
            };

            const chooseFirstMove = (playAs) => {
                setHumanPlayer(playAs);
                const ai = playAs === PLAYERS.X ? PLAYERS.O : PLAYERS.X;
                setAiPlayer(ai);
                setChoosingFirstMove(false);
                setMoveHistory([]);
                setGameMoves([]);
                setBoardKey(prev => prev + 1);

                if (playAs === PLAYERS.O) {
                    // AI goes first as X
                    setCurrentPlayer(PLAYERS.X);
                    setMessage("AI is thinking...");
                } else {
                    setCurrentPlayer(PLAYERS.X);
                    setMessage(`${nameX || 'Player X'}'s turn`);
                }
            };

            // Current stats based on game mode
            const currentStats = gameMode === GAME_MODES.PVP ? statsPvp : statsPvai;
            const currentStatsKey = gameMode === GAME_MODES.PVP ? STATS_KEY_PVP : STATS_KEY_PVAI;
            const currentStreak = gameMode === GAME_MODES.PVP ? streakPvp : streakPvai;

            // Whether cells can be interacted with
            const cellsInteractive = !winner && !isPaused && !aiThinking && !isReplaying;

            // Ghost mark: in PvAI show humanPlayer mark, in PvP show currentPlayer
            const ghostMark = cellsInteractive
                ? (gameMode === GAME_MODES.PVAI ? humanPlayer : currentPlayer)
                : null;

            // --- MODE SELECTION SCREEN ---
            if (proMode) return <ProTicTacToe kind={proMode} onExit={() => setProMode(null)} />;

            if (!gameMode) {
                return (
                    <div className="tic-setup-shell mini-shell min-h-screen relative bg-gray-900 text-white flex flex-col items-center justify-center p-4">
                        <div className="scanline-overlay" aria-hidden="true"></div>
                        <button className="mute-btn" onClick={handleMuteToggle} aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}>
                            {isMuted ? '\uD83D\uDD07' : '\uD83D\uDD0A'}
                        </button>
                        <div className="tic-setup-card relative z-10 bg-black/40 rounded-xl shadow-2xl p-6 w-full max-w-md border border-blue-700/50 shadow-blue-900/40 text-center">
                            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent tracking-wider text-shadow-neon">
                                TIC-TAC-TOE
                            </h1>

                            {/* Feature 6: Custom Player Names */}
                            <div className="mb-5">
                                <p className="text-cyan-300/60 text-xs mb-2">Enter nicknames (optional):</p>
                                <div className="flex justify-center gap-3 flex-wrap">
                                    <div className="flex flex-col items-center gap-1">
                                        <label className="text-xs text-gray-400" htmlFor="name-x">Player X</label>
                                        <input
                                            id="name-x"
                                            className="name-input"
                                            type="text"
                                            maxLength={12}
                                            placeholder="Player X"
                                            value={nameX}
                                            onChange={(e) => setNameX(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <label className="text-xs text-gray-400" htmlFor="name-o">Player O</label>
                                        <input
                                            id="name-o"
                                            className="name-input"
                                            type="text"
                                            maxLength={12}
                                            placeholder="Player O"
                                            value={nameO}
                                            onChange={(e) => setNameO(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Feature 7: Theme selector */}
                            <div className="theme-selector mb-5" role="group" aria-label="Board theme">
                                {THEMES.map(t => (
                                    <button
                                        key={t.id}
                                        className={`theme-btn ${t.id} ${theme === t.id ? 'active' : ''}`}
                                        onClick={() => handleThemeChange(t.id)}
                                        aria-pressed={theme === t.id}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            <p className="text-cyan-300/80 mb-6 text-shadow-neon">Choose your challenge:</p>
                            <div className="flex flex-col space-y-4" role="group" aria-label="Game mode selection">
                                <button
                                    onClick={() => startGame(GAME_MODES.PVP)}
                                    className="action-btn py-3 px-8 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg shadow-lg shadow-blue-700/50 transition-all duration-200 transform hover:scale-105 active:scale-95 text-xl"
                                >
                                    1 vs 1 (Local)
                                </button>
                                <button
                                    onClick={() => startGame(GAME_MODES.PVAI)}
                                    className="action-btn py-3 px-8 bg-green-700 hover:bg-green-800 text-white font-bold rounded-lg shadow-lg shadow-green-700/50 transition-all duration-200 transform hover:scale-105 active:scale-95 text-xl"
                                >
                                    1 vs AI
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-4" role="group" aria-label="Advanced modes">
                                {Object.entries(PRO_VARIANTS).map(([id, info]) => (
                                    <button key={id} onClick={() => setProMode(id)} className="action-btn py-2 px-2 bg-cyan-900 hover:bg-cyan-800 border border-cyan-500 text-white font-bold rounded-lg text-sm">
                                        {info.title}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setShowRules(true)}
                                className="action-btn mt-8 py-2 px-6 bg-yellow-700 hover:bg-yellow-800 text-white font-bold rounded-lg shadow-lg shadow-yellow-700/50 transition-all duration-200 transform hover:scale-105 active:scale-95"
                            >
                                Rules
                            </button>
                        </div>
                        {showRules && <RulesModal onClose={() => setShowRules(false)} />}
                    </div>
                );
            }

            // --- Feature 3: FIRST-MOVE CHOOSER SCREEN ---
            if (choosingFirstMove) {
                return (
                    <div className="mini-shell min-h-screen relative bg-gray-900 text-white flex flex-col items-center justify-center p-4">
                        <div className="scanline-overlay" aria-hidden="true"></div>
                        <button className="mute-btn" onClick={handleMuteToggle} aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}>
                            {isMuted ? '\uD83D\uDD07' : '\uD83D\uDD0A'}
                        </button>
                        <div className="relative z-10 bg-black/40 rounded-xl shadow-2xl p-6 w-full max-w-md border border-blue-700/50 shadow-blue-900/40 text-center">
                            <h1 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent tracking-wider text-shadow-neon">
                                CHOOSE YOUR SIDE
                            </h1>
                            <p className="text-cyan-300/80 mb-6 text-shadow-neon">Do you want to go first or second?</p>
                            <div className="first-move-chooser">
                                <button
                                    onClick={() => chooseFirstMove(PLAYERS.X)}
                                    className="first-move-btn action-btn py-3 px-8 bg-pink-700 hover:bg-pink-800 text-white font-bold rounded-lg shadow-lg shadow-pink-700/50 transition-all duration-200 transform hover:scale-105 active:scale-95 text-lg"
                                >
                                    Play as X (Go First)
                                </button>
                                <button
                                    onClick={() => chooseFirstMove(PLAYERS.O)}
                                    className="first-move-btn action-btn py-3 px-8 bg-cyan-700 hover:bg-cyan-800 text-white font-bold rounded-lg shadow-lg shadow-cyan-700/50 transition-all duration-200 transform hover:scale-105 active:scale-95 text-lg"
                                >
                                    Play as O (Go Second)
                                </button>
                                <button
                                    onClick={resetGame}
                                    className="action-btn mt-4 py-2 px-6 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 text-sm"
                                >
                                    Back
                                </button>
                            </div>
                        </div>
                    </div>
                );
            }

            return (
                <div className="mini-shell min-h-screen relative bg-gray-900 text-white flex flex-col items-center justify-center p-4">
                    {/* Scanline overlay for retro CRT effect */}
                    <div className="scanline-overlay" aria-hidden="true"></div>
                    {/* Mute toggle */}
                    <button className="mute-btn" onClick={handleMuteToggle} aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}>
                        {isMuted ? '\uD83D\uDD07' : '\uD83D\uDD0A'}
                    </button>

                    {/* Feature 8: Confetti canvas */}
                    <canvas ref={confettiCanvasRef} className="confetti-canvas" aria-hidden="true"></canvas>

                    <div className="mini-layout relative z-10 bg-black/40 rounded-xl shadow-2xl p-6 w-full max-w-md border border-blue-700/50 shadow-blue-900/40">
                        <aside className="mini-controls"><h1 className="text-4xl md:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent tracking-wider text-shadow-neon">
                            TIC-TAC-TOE
                        </h1>

                        {/* Difficulty Selector (PvAI only) */}
                        {gameMode === GAME_MODES.PVAI && (
                            <div className="difficulty-selector" role="group" aria-label="AI difficulty">
                                <button
                                    className={`difficulty-btn easy ${difficulty === DIFFICULTIES.EASY ? 'active' : ''}`}
                                    onClick={() => setDifficulty(DIFFICULTIES.EASY)}
                                    aria-pressed={difficulty === DIFFICULTIES.EASY}
                                    disabled={isPaused}
                                >
                                    Easy
                                </button>
                                <button
                                    className={`difficulty-btn medium ${difficulty === DIFFICULTIES.MEDIUM ? 'active' : ''}`}
                                    onClick={() => setDifficulty(DIFFICULTIES.MEDIUM)}
                                    aria-pressed={difficulty === DIFFICULTIES.MEDIUM}
                                    disabled={isPaused}
                                >
                                    Medium
                                </button>
                                <button
                                    className={`difficulty-btn hard ${difficulty === DIFFICULTIES.HARD ? 'active' : ''}`}
                                    onClick={() => setDifficulty(DIFFICULTIES.HARD)}
                                    aria-pressed={difficulty === DIFFICULTIES.HARD}
                                    disabled={isPaused}
                                >
                                    Hard
                                </button>
                            </div>
                        )}

                        {/* Feature 7: Theme selector */}
                        <div className="theme-selector" role="group" aria-label="Board theme">
                            {THEMES.map(t => (
                                <button
                                    key={t.id}
                                    className={`theme-btn ${t.id} ${theme === t.id ? 'active' : ''}`}
                                    onClick={() => handleThemeChange(t.id)}
                                    aria-pressed={theme === t.id}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        <p
                            className="text-center text-cyan-300/80 mb-4 text-shadow-neon"
                            style={{ color: 'var(--theme-text-status)' }}
                            role="status"
                            aria-live="polite"
                            aria-atomic="true"
                        >
                            {message || `${getPlayerName(currentPlayer)}'s turn`}
                            {aiThinking && <span className="ai-thinking-indicator ml-2" aria-hidden="true">. . .</span>}
                        </p>

                        </aside>
                        {/* Game Board - key prop triggers re-mount for entrance animation */}
                        <div
                            key={boardKey}
                            className="mini-board p-4 rounded-lg shadow-inner mb-4 relative"
                            style={{
                                backgroundColor: 'var(--theme-grid-bg)',
                                borderColor: 'var(--theme-grid-border)',
                                borderWidth: '1px',
                                borderStyle: 'solid',
                            }}
                            role="grid"
                            aria-label="Tic-Tac-Toe board"
                            ref={gridRef}
                        >
                            {board.map((rowCells, rowIndex) => (
                                <div key={`row-${rowIndex}`} role="row" className="grid grid-cols-3 gap-2" style={rowIndex < 2 ? { marginBottom: '0.5rem' } : undefined}>
                                    {rowCells.map((cellValue, colIndex) => {
                                        const flatIdx = rowIndex * 3 + colIndex;
                                        return (
                                            <Cell
                                                key={`${rowIndex}-${colIndex}`}
                                                value={cellValue}
                                                row={rowIndex}
                                                col={colIndex}
                                                onClick={() => handleCellClick(rowIndex, colIndex)}
                                                ghostMark={ghostMark}
                                                canInteract={cellsInteractive}
                                                entranceDelay={flatIdx * 50}
                                            />
                                        );
                                    })}
                                </div>
                            ))}

                            {/* Win Line Overlay */}
                            {winner && winner !== 'Draw' && !isReplaying && (
                                <WinLineOverlay winningLine={winningLine} />
                            )}
                        </div>

                        <div className="mini-bottom">
                        {/* Stats Bar (Feature 1: includes streak) */}
                        <div className="stats-bar" aria-label="Game statistics">
                            {gameMode === GAME_MODES.PVP ? (
                                <React.Fragment>
                                    <span className="stat-win" title={`${getPlayerName(PLAYERS.X)} wins`}>{getPlayerName(PLAYERS.X)}: {currentStats.wins}</span>
                                    <span className="stat-loss" title={`${getPlayerName(PLAYERS.O)} wins`}>{getPlayerName(PLAYERS.O)}: {currentStats.losses}</span>
                                </React.Fragment>
                            ) : (
                                <React.Fragment>
                                    <span className="stat-win" title="Wins">W: {currentStats.wins}</span>
                                    <span className="stat-loss" title="Losses">L: {currentStats.losses}</span>
                                </React.Fragment>
                            )}
                            <span className="stat-draw" title="Draws">D: {currentStats.draws}</span>
                            <span className="stat-streak" title="Win Streak">Streak: {currentStreak}</span>
                            <button
                                className="stats-reset-btn"
                                onClick={handleStatsResetClick}
                                aria-label={confirmingStatsReset ? 'Tap again to confirm resetting statistics' : 'Reset statistics'}
                                title="Reset stats"
                            >
                                {confirmingStatsReset ? 'Sure?' : 'Reset'}
                            </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-center space-x-3 flex-wrap gap-y-2">
                            <button
                                onClick={() => setShowRules(true)}
                                className="action-btn py-2 px-4 bg-yellow-700 hover:bg-yellow-800 text-white font-bold rounded-lg shadow-lg shadow-yellow-700/50 transition-all duration-200 transform hover:scale-105 active:scale-95"
                                disabled={isPaused}
                                aria-label="Show game rules"
                            >
                                Rules
                            </button>
                            <button
                                onClick={handleUndo}
                                className="action-btn py-2 px-4 bg-orange-700 hover:bg-orange-800 text-white font-bold rounded-lg shadow-lg shadow-orange-700/50 transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                                disabled={!canUndo}
                                aria-label="Undo last move"
                            >
                                Undo
                            </button>
                            <button
                                onClick={() => setIsPaused(!isPaused)}
                                className="action-btn py-2 px-4 bg-gray-700 hover:bg-gray-800 text-white font-bold rounded-lg shadow-lg shadow-gray-700/50 transition-all duration-200 transform hover:scale-105 active:scale-95"
                                disabled={winner !== null || isReplaying}
                                aria-label={isPaused ? 'Resume game' : 'Pause game'}
                            >
                                {isPaused ? 'Resume' : 'Pause'}
                            </button>
                            <button
                                onClick={resetGame}
                                className="action-btn py-2 px-4 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg shadow-lg shadow-purple-700/50 transition-all duration-200 transform hover:scale-105 active:scale-95"
                                disabled={isPaused}
                                aria-label="Start a new game"
                            >
                                New Game
                            </button>
                        </div>

                        </div>
                        {/* Win/Draw Overlay */}
                        {winner && !isReplaying && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 fade-in pointer-events-none rounded-xl" role="alert" aria-live="assertive">
                                <h2 className={`text-5xl font-bold text-yellow-300 text-shadow-neon ${winner !== 'Draw' ? 'win-animation' : ''}`}>
                                    {winner === 'Draw'
                                        ? (earlyDrawMessage || "IT'S A DRAW!")
                                        : `${getPlayerName(winner)} WINS!`}
                                </h2>
                                <div className="flex gap-3 mt-6 flex-wrap justify-center">
                                    <button
                                        ref={winButtonRef}
                                        onClick={startNewGameSameMode}
                                        className="action-btn py-2 px-6 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg shadow-lg shadow-purple-700/50 transition-all duration-200 transform hover:scale-105 active:scale-95 pointer-events-auto"
                                    >
                                        Play Again
                                    </button>
                                    {/* Feature 4: Replay button */}
                                    {gameMoves.length > 0 && (
                                        <button
                                            onClick={startReplay}
                                            className="action-btn py-2 px-6 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg shadow-lg shadow-teal-700/50 transition-all duration-200 transform hover:scale-105 active:scale-95 pointer-events-auto"
                                        >
                                            Replay
                                        </button>
                                    )}
                                    <button
                                        onClick={resetGame}
                                        className="action-btn py-2 px-6 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg shadow-lg shadow-gray-600/50 transition-all duration-200 transform hover:scale-105 active:scale-95 pointer-events-auto"
                                    >
                                        Menu
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Replay overlay indicator */}
                        {isReplaying && (
                            <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 pointer-events-none rounded-xl">
                                <button
                                    onClick={stopReplay}
                                    className="action-btn py-2 px-6 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg shadow-lg shadow-red-700/50 transition-all duration-200 transform hover:scale-105 active:scale-95 pointer-events-auto"
                                >
                                    Stop Replay
                                </button>
                            </div>
                        )}

                        {/* Pause Overlay */}
                        {isPaused && (
                            <div className="pause-overlay" role="alert" aria-live="assertive">
                                PAUSED
                            </div>
                        )}

                        {/* Rules Modal */}
                        {showRules && <RulesModal onClose={() => setShowRules(false)} />}
                    </div>
                </div>
            );
        };

        // Render the main component to the root div
        ReactDOM.render(<TicTacToeGame />, document.getElementById('root'));
