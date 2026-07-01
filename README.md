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

---

## Project Structure

```
family-game-portal/
├── docker-compose.yml     # Docker config (Caddy web server)
├── Caddyfile              # Web server settings
├── sync-to-nas.sh         # Sync script for Mac → NAS
├── add-game.sh            # Quick-add new games
├── README.md              # This file
├── SETUP.md               # Detailed setup guide
└── games/
    ├── index.html         # Landing page (game portal)
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
