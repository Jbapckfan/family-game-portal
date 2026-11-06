# Alford Family Game Portal

**Alford Daily updates must reach the public friends site.** See [the primary public deployment and verification procedure](docs/PUBLIC-DEPLOYMENT.md). The private preview is a separate destination.

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

## Alford Daily: one attributed collection

The daily-puzzle web and iOS app contains **32 daily games with Alford Daily, Kimi, DeepSeek, Qwen, and Claude creator labels**, plus a separate local-AI nine-board Tic-Tac-Toe bonus. Counterpart, Shortlist, Second Sense and Sideways lead the word edition; all daily games remain accessible. Cards and game screens retain their original developer labels, with filters for all five creators and separate concept/completion credit where applicable. The existing family-portal games remain available. See [the current collection and import record](docs/unified-collection.md).

## Games Included

| Game | Type | Description |
|------|------|-------------|
| ⇄ **Tradeoff** | Daily Word | Swap letters between six words to solve their clues; five swaps is perfect |
| ＋ **Inbetween** | Daily Word | Insert six two-letter pairs into six four-letter words, using each pair once to match the clues |
| ∶ **Counterpart** | Daily Word | Match five ordered word pairs by the relationships they share |
| ⌕ **Shortlist** | Daily Word | Scan pairs of letters to narrow twelve candidate words before one final pick |
| Ⅱ **Second Sense** | Daily Word | Pair two different meanings and type the word they share |
| ↔ **Sideways** | Daily Word | Rotate five letter strips to form four clued words vertically |
| ◯ **Ringcount** | Daily Number | Place four cuts around twelve numbers so each arc has the same sum |
| ↗ **Switchpath** | Daily Logic | Visit every square on one route while numbers alternate higher and lower |
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
docker compose restart game-portal
```

Review any local changes shown by `git status` before pulling; keep them intact if Git reports a conflict. The homepage is mounted as a single file. Restart the portal service after updating the catalog so the running container reopens the current homepage file. Pushing to GitHub alone does not update the NAS, and repository checks do not verify a live NAS deployment.

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

## Alford Daily puzzles

The 32 daily games have a local hub at `/games/daily/`, sourced from `games/daily/index.html`. The NAS portal serves each game locally, with no dependence on access to that private app.

| Game | Local portal path | Prepared boards |
| --- | --- | --- |
| Tradeoff | `/games/tradeoff/` | 180 |
| Inbetween | `/games/inbetween/` | 180 |
| Counterpart | `/games/counterpart/` | 180 |
| Shortlist | `/games/shortlist/` | 180 |
| Second Sense | `/games/second-sense/` | 180 |
| Sideways | `/games/sideways/` | 180 |
| Ringcount | `/games/ringcount/` | 180 |
| Switchpath | `/games/switchpath/` | 187 |

**Tradeoff:** Open `/games/tradeoff/`. Trade letters between six five-letter words until all six clues match. Correct words lock, and every supplied board has a five-swap solution. Daily and practice progress are stored in the current browser.

**Inbetween:** Open `/games/inbetween/`. Start with six four-letter words and six two-letter tiles. Insert each intact tile at any position without rearranging the original letters, and use every tile once to form the six clue answers.

**Counterpart:** Five visible word pairs establish five relationships. Choose an ordered pair from ten shared word tiles for each row. Both the relationship and its direction must match; use every tile once.

**Shortlist:** One of twelve five-letter words is hidden. Scan two different letters to learn whether the answer contains zero, one, or both. Use up to three scans, then make one final pick. Every board has a verified strategy that can identify every possible answer within the scan budget.

**Second Sense:** Pair clues for two different meanings of the same written word, then type that word. The spelling stays the same; the pronunciation may change. Each board has five answers.

**Sideways:** Five horizontal strips each contain four letters. Rotate a whole strip left or right to make four clued five-letter words read vertically. Each move affects all four words.

**Ringcount:** Twelve fixed numbers form a ring. Add four cuts so each contiguous arc sums to the target, then Check. Wrong arrangements remain editable. All boards have exactly one solution, with varied arc lengths and small numbers.

**Switchpath:** Trace one orthogonal route from Start to End, covering all sixteen cells exactly once. Numbers must alternate higher, lower, higher, lower. Every board has one verified complete route.

All games use relative runtime assets and work directly from their folders; the portal needs no build step. Daily and practice results are separate, hints are tracked, and revealed boards do not count as wins. Daily progress is stored in the current browser. Ringcount, Switchpath, Counterpart, Shortlist, Second Sense, and Sideways share a shell for dialogs, statistics, practice selection, sharing, and storage recovery.

Run a packaged game's engine, content, and syntax checks from the repository root, replacing `ringcount` with its folder name:

```bash
npm --prefix games/ringcount test
npm --prefix games/ringcount run check
```

The original eight games contain 1,447 prepared boards; the full 32-game collection contains 8,001 prepared daily puzzle/answer records. Every game has at least 120 boards, available through daily and practice play. Some word games use distinct combinations of a finite curated word or clue pool. Each finite game library repeats once exhausted. Run the corresponding tests after changing content or regenerating a collection. A future commercial daily app needs an ongoing editorial schedule; see the [current collection record](docs/unified-collection.md). See [integration notes](docs/integration.md) for paths, validation, and NAS deployment details.

The [iOS app project](ios/README.md) includes all 32 attributed daily games and the separate nine-board Tic-Tac-Toe bonus, with 8,001 prepared daily puzzle/answer records. The four original word games lead the collection. The bonus has Casual and Tactical local AI, a separate resumable match and no daily credit. It includes native navigation, records, offline bundled games, sharing, haptics, and optional local reminders. Open `ios/AlfordDaily.xcodeproj` in Xcode and select the `AlfordDaily` scheme. The private repository's `iOS app verification` workflow compiles and tests the simulator build; consult its result for the current commit. Signed device distribution and App Store submission require Apple account configuration.

Tradeoff and Inbetween remain in the family portal as earlier games. The [current monetization plan](docs/monetization-unified.md) describes permanent ad removal, restrained advertising, and content requirements. Commerce is disabled in the normal app build and no ad SDK is included. See the [expanded release verification record](docs/verification-expanded-2026-10-20.md) for executed checks and remaining release gates.

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
    ├── daily/             # Alford Daily hub for all 32 attributed games
    ├── tradeoff/          # Daily letter-swap game, source, tests, and generator
    ├── inbetween/         # Daily letter-pair insertion game
    ├── counterpart/       # Ordered word relationships
    ├── shortlist/         # Letter-scan deduction
    ├── second-sense/      # Two meanings, one spelling
    ├── sideways/          # Rotating letter strips
    ├── ringcount/         # Equal-sum ring partition
    ├── switchpath/        # Alternating number route
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
