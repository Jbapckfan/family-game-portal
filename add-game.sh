#!/bin/bash

# ============================================
# Quick Add Game Script
# ============================================
# Usage: ./add-game.sh <game-name> <source-path>
# Example: ./add-game.sh "my-new-game" ~/Projects/Games/MyNewGame

GAME_NAME="$1"
SOURCE_PATH="$2"

if [ -z "$GAME_NAME" ] || [ -z "$SOURCE_PATH" ]; then
    echo "Usage: ./add-game.sh <game-name> <source-path>"
    echo "Example: ./add-game.sh my-new-game ~/Projects/Games/MyNewGame"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEST="$SCRIPT_DIR/games/$GAME_NAME"

mkdir -p "$DEST"

# Copy HTML, JS, CSS, and common asset files
cp "$SOURCE_PATH"/*.html "$DEST/" 2>/dev/null
cp "$SOURCE_PATH"/*.js "$DEST/" 2>/dev/null
cp "$SOURCE_PATH"/*.css "$DEST/" 2>/dev/null
cp "$SOURCE_PATH"/*.json "$DEST/" 2>/dev/null
cp -r "$SOURCE_PATH"/assets "$DEST/" 2>/dev/null
cp -r "$SOURCE_PATH"/images "$DEST/" 2>/dev/null
cp -r "$SOURCE_PATH"/sounds "$DEST/" 2>/dev/null

echo "Game '$GAME_NAME' added to games directory"
echo "Access at: http://YOUR-NAS:8080/$GAME_NAME/"
echo ""
echo "Don't forget to:"
echo "1. Update games/index.html with a card for this game"
echo "2. Run ./sync-to-nas.sh to deploy"
