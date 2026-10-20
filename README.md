# Alford Family Game Portal

A self-hosted game portal for your UGREEN NAS - lets your kids test your web games from any device on the home network.

## Quick Start

**One-time setup on your NAS:**
```bash
ssh Jbapckfan@192.168.1.155
cd /volume1/docker   # or wherever your docker folder is
git clone https://github.com/Jbapckfan/family-game-portal.git
cd family-game-portal
docker compose up -d
```

**Kids access:** Open browser → `http://192.168.1.155:8080`

---

## Games Included

| Game | Type | Description |
|------|------|-------------|
| ⇄ **Tradeoff** | Daily Word | Swap letters between six words to solve their clues; five swaps is perfect |
| ＋ **Inbetween** | Daily Word | Insert six two-letter pairs into six four-letter words, using each pair once to match the clues |
| ⚡ **Reflex Riot** | Arcade | Escalating catch, smash, swipe, and freeze reflex challenges for 1–2 players |
| 🦁 **Zoo Conquest** | Strategy | Risk-style board game with animal armies |
| 🎯 **Particle Conquest Pro** | Strategy | Real-time particle territory control |
| 🔮 **Symbiosis** | Puzzle | Cooperative puzzle adventure |
| ✨ **Spark & Vesper** | Puzzle | Dual-character light/shadow puzzles |
| ⭕ **Tic Tac Toe** | Mini | Classic X's and O's |
| 🔐 **Code Breaker** | Mini | Crack the code puzzle |
| 🎲 **3D Dots & Boxes** | Mini | Classic game in 3D |
| 🔦 **Lasers & Mirrors** | Mini | Reflect lasers to hit targets |
| 💡 **Lights Out** | Mini | Turn off all the lights |
| 🔘 **Peg Jumper** | Mini | Peg solitaire puzzle |
| 🔢 **2048** | Mini | Slide and merge tiles to reach 2048 |
| 🔴 **Connect Four** | Mini | 2-player pass-and-play, connect 4 in a row |
| 🐍 **Snake** | Mini | Classic arcade snake |
| 💣 **Minesweeper** | Mini | Clear the minefield without detonating a mine |
| 🃏 **Memory Match** | Mini | Flip cards and find the matching pairs |

---

## How It Works

```
┌──────────────────────────────────────────────────────────┐
│                     YOUR HOME NETWORK                     │
│                                                          │
│   ┌─────────┐      ┌─────────────────┐      ┌────────┐  │
│   │ Kid's   │      │  UGREEN NAS     │      │ Your   │  │
│   │ iPad    │ ───▶ │  192.168.1.155  │ ◀─── │ Mac    │  │
│   └─────────┘      │                 │      └────────┘  │
│                    │  Docker runs:   │           │      │
│   ┌─────────┐      │  - Caddy server │      sync games  │
│   │ Kid's   │ ───▶ │  - Game files   │                  │
│   │ Phone   │      │                 │                  │
│   └─────────┘      │  Port 8080      │                  │
│                    └─────────────────┘                  │
└──────────────────────────────────────────────────────────┘
```

---

## Full Setup Guide

See [SETUP.md](SETUP.md) for detailed instructions.

---

## Updating Games

After new source has been pushed to GitHub, update the NAS from your home network:

```bash
ssh Jbapckfan@192.168.1.155
cd /volume1/docker/family-game-portal
git status --short
git pull --ff-only
```

Review any local changes shown by `git status` before pulling; keep them intact if Git reports a conflict. Caddy serves the mounted files directly, so these static game and catalog changes do not require a container restart. Pushing to GitHub alone does not update the NAS, and repository checks do not verify a live NAS deployment.

When you update a game on your Mac:

```bash
cd ~/Projects/nas-game-server
./sync-to-nas.sh
```

Or manually:
```bash
# Copy updated game file
scp ~/Projects/Games/MyGame/index.html Jbapckfan@192.168.1.155:/volume1/docker/family-game-portal/games/my-game/

# Restart if needed (usually not necessary for static files)
ssh Jbapckfan@192.168.1.155 "cd /volume1/docker/family-game-portal && docker compose restart"
```

The sync script transfers the root `index.html` catalog along with the `games/` directory and Caddy configuration.

---

## Daily Word Games

**Tradeoff:** Open `/games/tradeoff/`. Trade letters between six five-letter words until all six clues match. Correct words lock, and every supplied board has a five-swap solution. Daily and practice progress are stored in the current browser.

**Inbetween:** Open `/games/inbetween/`. Start with six four-letter words and six two-letter tiles. Insert each intact tile at any position without rearranging the original letters, and use every tile once to form the six clue answers.

Both games are served directly from their folders with relative asset paths. Their complete source and development files are kept alongside the runtime; no portal build step is needed. See each game's README for its rules and development notes.

Run both games' engine, puzzle-content, persistence, and syntax checks from the repository root:

```bash
npm --prefix games/tradeoff test
npm --prefix games/tradeoff run check
npm --prefix games/inbetween test
npm --prefix games/inbetween run check
```

Their deterministic puzzle generators are available with `npm --prefix games/tradeoff run generate` and `npm --prefix games/inbetween run generate`. Tradeoff contains 90 prepared boards; Inbetween contains 60. Both collections repeat once exhausted. Run the tests again after changing the authored vocabulary or generated collection. See [integration notes](docs/integration.md) for paths and deployment details.

---

## Project Structure

```
family-game-portal/
├── index.html            # Current landing page and featured-game catalog
├── docker-compose.yml     # Docker config (Caddy web server)
├── Caddyfile              # Web server settings
├── sync-to-nas.sh         # Sync script for Mac → NAS
├── add-game.sh            # Quick-add new games
├── README.md              # This file
├── SETUP.md               # Detailed setup guide
└── games/
    ├── index.html         # Legacy game catalog
    ├── tradeoff/          # Daily letter-swap game, source, tests, and generator
    ├── inbetween/         # Daily letter-pair insertion game
    ├── zoo-conquest.html  # Zoo Conquest game
    ├── particle-conquest/ # Particle Conquest Pro
    │   └── index.html
    ├── symbiosis/         # Symbiosis games
    │   ├── index.html
    │   ├── game.html
    │   ├── spark-vesper.html
    │   └── symbiosis.html
    └── mini-games/        # Mini game collection
        ├── 2DTicTacToe.html
        ├── CodeBreakerV4.html
        ├── dots3d-game-rotate.html
        ├── lasers_mirrors_game.html
        ├── LightsOut.html
        └── PegJumper.html
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't access from phone/tablet | Make sure device is on same WiFi |
| Port 8080 blocked | Check NAS firewall, try port 80 |
| Games not loading | Check `docker compose logs` on NAS |
| Changes not showing | Clear browser cache or hard refresh |

---

## Configuration

**NAS Details (configured in sync-to-nas.sh):**
- Host: `192.168.1.155`
- User: `Jbapckfan`
- Path: `/volume1/docker/family-game-portal`
- Port: `8080`

---

Built with ❤️ for the Alford family
