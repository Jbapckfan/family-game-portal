# Complete Setup Guide

This guide will help you deploy the Family Game Portal to your UGREEN NAS 6800 Pro.

---

## Prerequisites

- UGREEN NAS with Docker installed (you have this ✓)
- SSH access to your NAS
- Git installed on NAS (usually pre-installed)

---

## Step 1: Deploy to NAS

### Option A: Clone from GitHub (Recommended)

SSH into your NAS and clone the repo:

```bash
# Connect to NAS
ssh Jbapckfan@192.168.1.155

# Navigate to docker directory (adjust path for UGOS if needed)
cd /volume1/docker
# or try: cd /mnt/user/docker
# or try: cd /share/docker

# Clone the repository
git clone https://github.com/Jbapckfan/family-game-portal.git

# Start the server
cd family-game-portal
docker compose up -d
```

### Option B: Sync from Mac

If you prefer to sync from your Mac:

```bash
cd ~/Projects/nas-game-server
./sync-to-nas.sh
```

Then SSH to NAS and start Docker:
```bash
ssh Jbapckfan@192.168.1.155
cd /volume1/docker/family-game-portal
docker compose up -d
```

---

## Step 2: Verify It's Running

Check Docker status on NAS:
```bash
docker compose ps
```

You should see:
```
NAME          IMAGE           STATUS         PORTS
game-portal   caddy:2-alpine  Up X minutes   0.0.0.0:8080->80/tcp
```

---

## Step 3: Access the Games

From any device on your home network:

1. Open a web browser
2. Go to: `http://192.168.1.155:8080`
3. You'll see the game portal with all games listed

**Tip:** Bookmark this on kids' devices for easy access.

---

## Adding New Games

### For HTML/JavaScript games:

1. **Copy the game files:**
   ```bash
   # On your Mac
   cp ~/Projects/Games/NewGame/index.html ~/Projects/nas-game-server/games/new-game/
   ```

2. **Update the landing page** (`games/index.html`):
   Add a new card in the game grid section.

3. **Sync to NAS:**
   ```bash
   ./sync-to-nas.sh
   ```

### Using the add-game script:

```bash
./add-game.sh my-new-game ~/Projects/Games/MyNewGame
```

This copies HTML, JS, CSS, and common assets automatically.

---

## Updating Existing Games

When you make changes to a game:

```bash
# Sync changes to NAS
cd ~/Projects/nas-game-server
./sync-to-nas.sh

# Or manually copy just that file
scp games/zoo-conquest.html Jbapckfan@192.168.1.155:/volume1/docker/family-game-portal/games/
```

No need to restart Docker - Caddy serves static files and picks up changes immediately.

---

## Managing the Server

### View logs:
```bash
ssh Jbapckfan@192.168.1.155
cd /volume1/docker/family-game-portal
docker compose logs -f
```

### Restart server:
```bash
docker compose restart
```

### Stop server:
```bash
docker compose down
```

### Start server:
```bash
docker compose up -d
```

### Update from GitHub:
```bash
cd /volume1/docker/family-game-portal
git pull
docker compose restart
```

---

## Customization

### Change the port:

Edit `docker-compose.yml`:
```yaml
ports:
  - "80:80"      # Use port 80 instead of 8080
```

Then restart: `docker compose up -d`

### Add HTTPS:

Edit `Caddyfile` to add your domain:
```
yourdomain.com {
    root * /srv/games
    file_server browse
}
```

Caddy automatically provisions SSL certificates.

### Customize the landing page:

Edit `games/index.html` - it's standard HTML/CSS.

---

## File Locations

| Location | Purpose |
|----------|---------|
| `~/Projects/nas-game-server/` | Local copy on your Mac |
| `/volume1/docker/family-game-portal/` | Copy on NAS |
| `https://github.com/Jbapckfan/family-game-portal` | GitHub backup |

---

## Backup Strategy

Your games are backed up in 3 places:
1. **Your Mac:** `~/Projects/nas-game-server/`
2. **Your NAS:** `/volume1/docker/family-game-portal/`
3. **GitHub:** `https://github.com/Jbapckfan/family-game-portal`

To restore from GitHub:
```bash
git clone https://github.com/Jbapckfan/family-game-portal.git
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│              FAMILY GAME PORTAL CHEAT SHEET             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  PLAY GAMES         http://192.168.1.155:8080           │
│                                                         │
│  SSH TO NAS         ssh Jbapckfan@192.168.1.155         │
│                                                         │
│  SYNC GAMES         cd ~/Projects/nas-game-server       │
│                     ./sync-to-nas.sh                    │
│                                                         │
│  VIEW LOGS          docker compose logs -f              │
│                                                         │
│  RESTART            docker compose restart              │
│                                                         │
│  LOCAL FILES        ~/Projects/nas-game-server/         │
│                                                         │
│  GITHUB             github.com/Jbapckfan/               │
│                     family-game-portal                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Need Help?

1. Check Docker is running: `docker ps`
2. Check logs: `docker compose logs`
3. Verify port 8080 is open in NAS firewall
4. Make sure devices are on same WiFi network
