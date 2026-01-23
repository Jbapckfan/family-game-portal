#!/bin/bash

# ============================================
# Game Portal Sync Script for UGREEN NAS
# ============================================

# Configuration - UPDATE THESE
NAS_USER="Jbapckfan"                # Your NAS username
NAS_HOST="192.168.1.155"            # UGREEN NAS
NAS_PATH="/volume1/docker/family-game-portal"  # Path on NAS

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
GAMES_DIR="$SCRIPT_DIR/games"

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}   Game Portal Sync Tool${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Create games directory structure
mkdir -p "$GAMES_DIR"/{particle-conquest,symbiosis,mini-games}

# Sync Particle Conquest Pro
echo -e "${YELLOW}Syncing Particle Conquest Pro...${NC}"
cp ~/Projects/Games/ParticleConquestPro/index.html "$GAMES_DIR/particle-conquest/"
cp ~/Projects/Games/ParticleConquestPro/manifest.json "$GAMES_DIR/particle-conquest/" 2>/dev/null
cp ~/Projects/Games/ParticleConquestPro/sw.js "$GAMES_DIR/particle-conquest/" 2>/dev/null

# Sync Symbiosis Game
echo -e "${YELLOW}Syncing Symbiosis Game...${NC}"
cp ~/Projects/Games/"Symbiosis Game"/*.html "$GAMES_DIR/symbiosis/"

# Sync Mini Games (HTML Game Previews)
echo -e "${YELLOW}Syncing Mini Games Collection...${NC}"
cp ~/Projects/Games/"Bouncing Basketball Game"/"HTML Game Previews"/*.html "$GAMES_DIR/mini-games/"

echo ""
echo -e "${GREEN}Local sync complete!${NC}"
echo ""

# Ask about NAS sync
read -p "Sync to NAS at $NAS_USER@$NAS_HOST? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Syncing to NAS...${NC}"

    # Create directory on NAS if needed
    ssh "$NAS_USER@$NAS_HOST" "mkdir -p $NAS_PATH"

    # Sync files
    rsync -avz --progress \
        "$SCRIPT_DIR/docker-compose.yml" \
        "$SCRIPT_DIR/Caddyfile" \
        "$GAMES_DIR" \
        "$NAS_USER@$NAS_HOST:$NAS_PATH/"

    echo ""
    echo -e "${GREEN}NAS sync complete!${NC}"
    echo ""
    echo -e "To start the server on your NAS, SSH in and run:"
    echo -e "  ${BLUE}cd $NAS_PATH && docker-compose up -d${NC}"
    echo ""
    echo -e "Then access games at: ${GREEN}http://$NAS_HOST:8080${NC}"
else
    echo ""
    echo -e "Skipping NAS sync. Files are ready in: ${BLUE}$GAMES_DIR${NC}"
    echo ""
    echo -e "To test locally:"
    echo -e "  ${BLUE}cd $SCRIPT_DIR && docker-compose up${NC}"
    echo -e "  Then visit: ${GREEN}http://localhost:8080${NC}"
fi

echo ""
echo -e "${BLUE}======================================${NC}"
