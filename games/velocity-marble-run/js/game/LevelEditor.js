/**
 * LevelEditor - Workshop mode for creating custom levels
 * Drag and drop track pieces, test, save, and share
 */

class LevelEditor {
    constructor(game) {
        this.game = game;
        this.isActive = false;
        this.canvas = null;
        this.ctx = null;

        // Editor state
        this.currentLevel = null;
        this.selectedPiece = null;
        this.hoveredPiece = null;
        this.draggedPiece = null;
        this.dragOffset = { x: 0, y: 0 };

        // Grid
        this.gridSize = 20;
        this.showGrid = true;
        this.snapToGrid = true;

        // Camera
        this.camera = { x: 0, y: 0 };
        this.zoom = 1;

        // Tools
        this.currentTool = 'select'; // select, place, delete, test

        // Available pieces
        this.pieceTypes = [
            { type: 'ramp', name: 'Ramp', icon: '📐', category: 'basic' },
            { type: 'curve', name: 'Curve', icon: '🔄', category: 'basic' },
            { type: 'funnel', name: 'Funnel', icon: '🔻', category: 'basic' },
            { type: 'bumper', name: 'Bumper', icon: '🔴', category: 'interactive' },
            { type: 'booster', name: 'Booster', icon: '⚡', category: 'interactive' },
            { type: 'portal', name: 'Portal', icon: '🌀', category: 'interactive' },
            { type: 'spinner', name: 'Spinner', icon: '💫', category: 'hazard' },
            { type: 'movingPlatform', name: 'Platform', icon: '↔️', category: 'hazard' },
            { type: 'coin', name: 'Coin', icon: '🪙', category: 'collectible' },
            { type: 'star', name: 'Star', icon: '⭐', category: 'collectible' },
            { type: 'goal', name: 'Goal', icon: '🏁', category: 'special' },
            { type: 'spawn', name: 'Spawn', icon: '🎱', category: 'special' }
        ];

        // User created levels
        this.customLevels = this.loadCustomLevels();

        this.init();
    }

    init() {
        this.createEditorUI();
        this.createNewLevel();
    }

    createEditorUI() {
        // Main editor container
        const editor = document.createElement('div');
        editor.id = 'level-editor';
        editor.innerHTML = `
            <div class="editor-header">
                <button class="editor-back" id="editor-back">
                    <span>←</span> Back
                </button>
                <input type="text" class="level-name-input" id="level-name" placeholder="Level Name" value="My Level">
                <div class="editor-actions">
                    <button class="editor-btn" id="editor-test">▶ Test</button>
                    <button class="editor-btn" id="editor-save">💾 Save</button>
                    <button class="editor-btn" id="editor-share">📤 Share</button>
                </div>
            </div>

            <div class="editor-main">
                <div class="editor-toolbar">
                    <div class="tool-group">
                        <button class="tool-btn active" data-tool="select" title="Select (S)">👆</button>
                        <button class="tool-btn" data-tool="place" title="Place (P)">➕</button>
                        <button class="tool-btn" data-tool="delete" title="Delete (D)">🗑️</button>
                        <button class="tool-btn" data-tool="move" title="Move (M)">✋</button>
                    </div>
                    <div class="tool-divider"></div>
                    <div class="tool-group">
                        <button class="tool-btn" data-action="undo" title="Undo (Ctrl+Z)">↩️</button>
                        <button class="tool-btn" data-action="redo" title="Redo (Ctrl+Y)">↪️</button>
                    </div>
                    <div class="tool-divider"></div>
                    <div class="tool-group">
                        <button class="tool-btn" data-action="grid" title="Toggle Grid (G)">📏</button>
                        <button class="tool-btn" data-action="snap" title="Toggle Snap (N)">🧲</button>
                        <button class="tool-btn" data-action="zoom-in" title="Zoom In (+)">🔍+</button>
                        <button class="tool-btn" data-action="zoom-out" title="Zoom Out (-)">🔍-</button>
                    </div>
                </div>

                <div class="editor-canvas-container">
                    <canvas id="editor-canvas"></canvas>
                </div>

                <div class="editor-pieces-panel">
                    <h3>Pieces</h3>
                    <div class="pieces-categories">
                        <button class="category-btn active" data-category="all">All</button>
                        <button class="category-btn" data-category="basic">Basic</button>
                        <button class="category-btn" data-category="interactive">Interactive</button>
                        <button class="category-btn" data-category="hazard">Hazards</button>
                        <button class="category-btn" data-category="collectible">Items</button>
                        <button class="category-btn" data-category="special">Special</button>
                    </div>
                    <div class="pieces-grid" id="pieces-grid"></div>
                </div>
            </div>

            <div class="editor-properties" id="properties-panel">
                <h3>Properties</h3>
                <div class="properties-content" id="properties-content">
                    <p class="no-selection">Select a piece to edit its properties</p>
                </div>
            </div>

            <div class="editor-level-settings" id="level-settings">
                <h3>Level Settings</h3>
                <div class="setting-group">
                    <label>Background</label>
                    <select id="level-bg">
                        <option value="meadow">Meadow (Green)</option>
                        <option value="desert">Desert (Orange)</option>
                        <option value="ice">Ice (Blue)</option>
                        <option value="volcano">Volcano (Red)</option>
                        <option value="space">Space (Purple)</option>
                    </select>
                </div>
                <div class="setting-group">
                    <label>Star Times</label>
                    <div class="star-times">
                        <input type="number" id="star-3" value="5" min="1"> ⭐⭐⭐
                        <input type="number" id="star-2" value="10" min="1"> ⭐⭐
                        <input type="number" id="star-1" value="20" min="1"> ⭐
                    </div>
                </div>
                <div class="setting-group">
                    <label>
                        <input type="checkbox" id="ice-physics"> Ice Physics
                    </label>
                </div>
                <div class="setting-group">
                    <label>
                        <input type="checkbox" id="low-gravity"> Low Gravity
                    </label>
                </div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #level-editor {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #0f172a;
                z-index: 10000;
                flex-direction: column;
            }

            #level-editor.active {
                display: flex;
            }

            .editor-header {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 12px 20px;
                background: #1e293b;
                border-bottom: 1px solid #334155;
            }

            .editor-back {
                background: transparent;
                border: 1px solid #475569;
                color: #fff;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .editor-back:hover {
                background: #334155;
            }

            .level-name-input {
                flex: 1;
                max-width: 300px;
                background: #0f172a;
                border: 1px solid #475569;
                color: #fff;
                padding: 10px 16px;
                border-radius: 6px;
                font-size: 16px;
            }

            .editor-actions {
                display: flex;
                gap: 8px;
                margin-left: auto;
            }

            .editor-btn {
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                border: none;
                color: #fff;
                padding: 10px 20px;
                border-radius: 6px;
                font-weight: bold;
                cursor: pointer;
                transition: transform 0.2s;
            }

            .editor-btn:hover {
                transform: scale(1.05);
            }

            .editor-main {
                display: flex;
                flex: 1;
                overflow: hidden;
            }

            .editor-toolbar {
                display: flex;
                flex-direction: column;
                gap: 8px;
                padding: 12px;
                background: #1e293b;
                border-right: 1px solid #334155;
            }

            .tool-group {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .tool-btn {
                width: 44px;
                height: 44px;
                background: #0f172a;
                border: 1px solid #475569;
                border-radius: 8px;
                font-size: 20px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .tool-btn:hover {
                background: #334155;
            }

            .tool-btn.active {
                background: #3b82f6;
                border-color: #60a5fa;
            }

            .tool-divider {
                height: 1px;
                background: #475569;
                margin: 8px 0;
            }

            .editor-canvas-container {
                flex: 1;
                position: relative;
                overflow: hidden;
            }

            #editor-canvas {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
            }

            .editor-pieces-panel {
                width: 200px;
                background: #1e293b;
                border-left: 1px solid #334155;
                padding: 16px;
                overflow-y: auto;
            }

            .editor-pieces-panel h3 {
                color: #fff;
                margin: 0 0 12px 0;
                font-size: 16px;
            }

            .pieces-categories {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                margin-bottom: 12px;
            }

            .category-btn {
                background: #0f172a;
                border: 1px solid #475569;
                color: #94a3b8;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
                cursor: pointer;
            }

            .category-btn.active {
                background: #3b82f6;
                color: #fff;
                border-color: #60a5fa;
            }

            .pieces-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 8px;
            }

            .piece-item {
                background: #0f172a;
                border: 1px solid #475569;
                border-radius: 8px;
                padding: 12px 8px;
                text-align: center;
                cursor: pointer;
                transition: all 0.2s;
            }

            .piece-item:hover {
                border-color: #60a5fa;
                background: #1e3a5f;
            }

            .piece-item.selected {
                border-color: #3b82f6;
                background: #1e3a8a;
            }

            .piece-icon {
                font-size: 28px;
                margin-bottom: 4px;
            }

            .piece-name {
                color: #94a3b8;
                font-size: 11px;
            }

            .editor-properties {
                position: absolute;
                right: 220px;
                top: 70px;
                width: 220px;
                background: #1e293b;
                border: 1px solid #334155;
                border-radius: 8px;
                padding: 16px;
                display: none;
            }

            .editor-properties.active {
                display: block;
            }

            .editor-properties h3 {
                color: #fff;
                margin: 0 0 12px 0;
                font-size: 14px;
            }

            .no-selection {
                color: #64748b;
                font-size: 13px;
                text-align: center;
            }

            .property-row {
                margin-bottom: 12px;
            }

            .property-row label {
                display: block;
                color: #94a3b8;
                font-size: 12px;
                margin-bottom: 4px;
            }

            .property-row input,
            .property-row select {
                width: 100%;
                background: #0f172a;
                border: 1px solid #475569;
                color: #fff;
                padding: 8px;
                border-radius: 4px;
            }

            .editor-level-settings {
                position: absolute;
                left: 70px;
                top: 70px;
                width: 200px;
                background: #1e293b;
                border: 1px solid #334155;
                border-radius: 8px;
                padding: 16px;
            }

            .editor-level-settings h3 {
                color: #fff;
                margin: 0 0 12px 0;
                font-size: 14px;
            }

            .setting-group {
                margin-bottom: 12px;
            }

            .setting-group label {
                display: block;
                color: #94a3b8;
                font-size: 12px;
                margin-bottom: 4px;
            }

            .setting-group select,
            .setting-group input[type="number"] {
                width: 100%;
                background: #0f172a;
                border: 1px solid #475569;
                color: #fff;
                padding: 6px 8px;
                border-radius: 4px;
            }

            .star-times {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .star-times input {
                width: 60px;
            }

            .setting-group input[type="checkbox"] {
                margin-right: 8px;
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(editor);

        this.editorElement = editor;
        this.setupCanvas();
        this.populatePiecesGrid();
        this.bindEvents();
    }

    setupCanvas() {
        this.canvas = document.getElementById('editor-canvas');
        this.ctx = this.canvas.getContext('2d');

        const resize = () => {
            const container = this.canvas.parentElement;
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
            if (this.isActive) this.render();
        };

        window.addEventListener('resize', resize);
        resize();
    }

    populatePiecesGrid(category = 'all') {
        const grid = document.getElementById('pieces-grid');
        grid.innerHTML = '';

        const pieces = category === 'all'
            ? this.pieceTypes
            : this.pieceTypes.filter(p => p.category === category);

        pieces.forEach(piece => {
            const item = document.createElement('div');
            item.className = 'piece-item';
            item.dataset.type = piece.type;
            item.innerHTML = `
                <div class="piece-icon">${piece.icon}</div>
                <div class="piece-name">${piece.name}</div>
            `;

            item.addEventListener('click', () => {
                document.querySelectorAll('.piece-item').forEach(p => p.classList.remove('selected'));
                item.classList.add('selected');
                this.selectedPieceType = piece.type;
                this.currentTool = 'place';
                this.updateToolButtons();
            });

            grid.appendChild(item);
        });
    }

    bindEvents() {
        // Back button
        document.getElementById('editor-back').addEventListener('click', () => this.close());

        // Tool buttons
        document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentTool = btn.dataset.tool;
                this.updateToolButtons();
            });
        });

        // Action buttons
        document.querySelectorAll('.tool-btn[data-action]').forEach(btn => {
            btn.addEventListener('click', () => this.handleAction(btn.dataset.action));
        });

        // Category buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.populatePiecesGrid(btn.dataset.category);
            });
        });

        // Editor action buttons
        document.getElementById('editor-test').addEventListener('click', () => this.testLevel());
        document.getElementById('editor-save').addEventListener('click', () => this.saveLevel());
        document.getElementById('editor-share').addEventListener('click', () => this.shareLevel());

        // Canvas events
        this.canvas.addEventListener('mousedown', e => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', e => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', e => this.onMouseUp(e));
        this.canvas.addEventListener('wheel', e => this.onWheel(e));

        // Touch events
        this.canvas.addEventListener('touchstart', e => this.onTouchStart(e));
        this.canvas.addEventListener('touchmove', e => this.onTouchMove(e));
        this.canvas.addEventListener('touchend', e => this.onTouchEnd(e));

        // Keyboard shortcuts
        window.addEventListener('keydown', e => {
            if (!this.isActive) return;

            switch (e.key.toLowerCase()) {
                case 's': this.currentTool = 'select'; break;
                case 'p': this.currentTool = 'place'; break;
                case 'd': this.currentTool = 'delete'; break;
                case 'm': this.currentTool = 'move'; break;
                case 'g': this.showGrid = !this.showGrid; break;
                case 'n': this.snapToGrid = !this.snapToGrid; break;
                case 'delete':
                case 'backspace':
                    if (this.selectedPiece) this.deletePiece(this.selectedPiece);
                    break;
                case 'z':
                    if (e.ctrlKey || e.metaKey) this.undo();
                    break;
                case 'y':
                    if (e.ctrlKey || e.metaKey) this.redo();
                    break;
            }

            this.updateToolButtons();
            this.render();
        });
    }

    updateToolButtons() {
        document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === this.currentTool);
        });
    }

    handleAction(action) {
        switch (action) {
            case 'undo': this.undo(); break;
            case 'redo': this.redo(); break;
            case 'grid': this.showGrid = !this.showGrid; break;
            case 'snap': this.snapToGrid = !this.snapToGrid; break;
            case 'zoom-in': this.zoom = Math.min(this.zoom * 1.2, 3); break;
            case 'zoom-out': this.zoom = Math.max(this.zoom / 1.2, 0.5); break;
        }
        this.render();
    }

    createNewLevel() {
        this.currentLevel = {
            id: 'custom-' + Date.now(),
            name: 'My Level',
            worldId: 1,
            spawnX: 300,
            spawnY: 80,
            bounds: { left: 0, right: 600, top: 0, bottom: 1200 },
            starThresholds: { three: 5, two: 10, one: 20 },
            backgroundColor: ['#0f172a', '#1e3a5f'],
            icePhysics: false,
            lowGravity: false,
            tracks: [
                { type: 'goal', x: 300, y: 1000, width: 80, height: 120 }
            ]
        };

        this.history = [JSON.stringify(this.currentLevel)];
        this.historyIndex = 0;
    }

    // Mouse/Touch handling
    getCanvasPosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        return {
            x: (clientX - rect.left - this.camera.x) / this.zoom,
            y: (clientY - rect.top - this.camera.y) / this.zoom
        };
    }

    snapPosition(pos) {
        if (!this.snapToGrid) return pos;
        return {
            x: Math.round(pos.x / this.gridSize) * this.gridSize,
            y: Math.round(pos.y / this.gridSize) * this.gridSize
        };
    }

    onMouseDown(e) {
        const pos = this.getCanvasPosition(e);

        if (this.currentTool === 'select') {
            this.selectedPiece = this.findPieceAt(pos);
            if (this.selectedPiece) {
                this.draggedPiece = this.selectedPiece;
                this.dragOffset = {
                    x: pos.x - (this.selectedPiece.x || this.selectedPiece.startX),
                    y: pos.y - (this.selectedPiece.y || this.selectedPiece.startY)
                };
            }
            this.updatePropertiesPanel();
        } else if (this.currentTool === 'place' && this.selectedPieceType) {
            this.placePiece(pos);
        } else if (this.currentTool === 'delete') {
            const piece = this.findPieceAt(pos);
            if (piece) this.deletePiece(piece);
        } else if (this.currentTool === 'move') {
            this.isPanning = true;
            this.lastPanPos = { x: e.clientX, y: e.clientY };
        }

        this.render();
    }

    onMouseMove(e) {
        const pos = this.getCanvasPosition(e);

        if (this.draggedPiece) {
            const snapped = this.snapPosition({
                x: pos.x - this.dragOffset.x,
                y: pos.y - this.dragOffset.y
            });

            if (this.draggedPiece.x !== undefined) {
                this.draggedPiece.x = snapped.x;
                this.draggedPiece.y = snapped.y;
            } else {
                const dx = snapped.x - this.draggedPiece.startX;
                const dy = snapped.y - this.draggedPiece.startY;
                this.draggedPiece.startX = snapped.x;
                this.draggedPiece.startY = snapped.y;
                this.draggedPiece.endX += dx;
                this.draggedPiece.endY += dy;
            }
        } else if (this.isPanning) {
            this.camera.x += e.clientX - this.lastPanPos.x;
            this.camera.y += e.clientY - this.lastPanPos.y;
            this.lastPanPos = { x: e.clientX, y: e.clientY };
        }

        this.hoveredPiece = this.findPieceAt(pos);
        this.render();
    }

    onMouseUp() {
        if (this.draggedPiece) {
            this.saveToHistory();
            this.draggedPiece = null;
        }
        this.isPanning = false;
    }

    onTouchStart(e) {
        e.preventDefault();
        this.onMouseDown(e);
    }

    onTouchMove(e) {
        e.preventDefault();
        this.onMouseMove(e);
    }

    onTouchEnd(e) {
        e.preventDefault();
        this.onMouseUp();
    }

    onWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom = Math.max(0.5, Math.min(3, this.zoom * delta));
        this.render();
    }

    findPieceAt(pos) {
        for (let i = this.currentLevel.tracks.length - 1; i >= 0; i--) {
            const piece = this.currentLevel.tracks[i];
            if (this.isPointInPiece(pos, piece)) {
                return piece;
            }
        }
        return null;
    }

    isPointInPiece(pos, piece) {
        const threshold = 20;

        switch (piece.type) {
            case 'ramp':
                const midX = (piece.startX + piece.endX) / 2;
                const midY = (piece.startY + piece.endY) / 2;
                return Math.abs(pos.x - midX) < 50 && Math.abs(pos.y - midY) < 30;

            case 'bumper':
            case 'coin':
            case 'star':
            case 'portal':
            case 'booster':
                const radius = piece.radius || 25;
                const dx = pos.x - piece.x;
                const dy = pos.y - piece.y;
                return Math.sqrt(dx * dx + dy * dy) < radius + threshold;

            case 'goal':
            case 'funnel':
            case 'movingPlatform':
                return pos.x >= piece.x - (piece.width || 80) / 2 - threshold &&
                       pos.x <= piece.x + (piece.width || 80) / 2 + threshold &&
                       pos.y >= piece.y - (piece.height || 60) / 2 - threshold &&
                       pos.y <= piece.y + (piece.height || 60) / 2 + threshold;

            case 'spinner':
                return Math.sqrt(Math.pow(pos.x - piece.x, 2) + Math.pow(pos.y - piece.y, 2)) < piece.radius + threshold;

            default:
                return Math.abs(pos.x - piece.x) < threshold && Math.abs(pos.y - piece.y) < threshold;
        }
    }

    placePiece(pos) {
        const snapped = this.snapPosition(pos);
        let piece;

        switch (this.selectedPieceType) {
            case 'ramp':
                piece = {
                    type: 'ramp',
                    startX: snapped.x,
                    startY: snapped.y,
                    endX: snapped.x + 150,
                    endY: snapped.y + 100,
                    color: '#4ade80'
                };
                break;

            case 'curve':
                piece = {
                    type: 'curve',
                    x: snapped.x,
                    y: snapped.y,
                    radius: 80,
                    startAngle: Math.PI,
                    endAngle: Math.PI * 1.5,
                    color: '#4ade80'
                };
                break;

            case 'funnel':
                piece = {
                    type: 'funnel',
                    x: snapped.x,
                    y: snapped.y,
                    topWidth: 160,
                    bottomWidth: 40,
                    height: 100,
                    color: '#4ade80'
                };
                break;

            case 'bumper':
                piece = { type: 'bumper', x: snapped.x, y: snapped.y, radius: 30 };
                break;

            case 'booster':
                piece = { type: 'booster', x: snapped.x, y: snapped.y, angle: 0.4, boostForce: 500 };
                break;

            case 'portal':
                piece = {
                    type: 'portal',
                    x: snapped.x,
                    y: snapped.y,
                    radius: 30,
                    targetX: snapped.x + 100,
                    targetY: snapped.y + 100,
                    color: '#8b5cf6'
                };
                break;

            case 'spinner':
                piece = {
                    type: 'spinner',
                    x: snapped.x,
                    y: snapped.y,
                    radius: 60,
                    armCount: 3,
                    rotationSpeed: 1.5
                };
                break;

            case 'movingPlatform':
                piece = {
                    type: 'movingPlatform',
                    x: snapped.x,
                    y: snapped.y,
                    startX: snapped.x - 50,
                    startY: snapped.y,
                    endX: snapped.x + 50,
                    endY: snapped.y,
                    width: 80,
                    speed: 1.0
                };
                break;

            case 'coin':
                piece = { type: 'coin', x: snapped.x, y: snapped.y };
                break;

            case 'star':
                piece = { type: 'star', x: snapped.x, y: snapped.y };
                break;

            case 'goal':
                piece = { type: 'goal', x: snapped.x, y: snapped.y, width: 80, height: 120 };
                break;

            case 'spawn':
                this.currentLevel.spawnX = snapped.x;
                this.currentLevel.spawnY = snapped.y;
                this.saveToHistory();
                return;
        }

        if (piece) {
            this.currentLevel.tracks.push(piece);
            this.saveToHistory();
        }
    }

    deletePiece(piece) {
        const index = this.currentLevel.tracks.indexOf(piece);
        if (index > -1) {
            this.currentLevel.tracks.splice(index, 1);
            this.selectedPiece = null;
            this.updatePropertiesPanel();
            this.saveToHistory();
            this.render();
        }
    }

    updatePropertiesPanel() {
        const panel = document.getElementById('properties-panel');
        const content = document.getElementById('properties-content');

        if (!this.selectedPiece) {
            panel.classList.remove('active');
            content.innerHTML = '<p class="no-selection">Select a piece to edit its properties</p>';
            return;
        }

        panel.classList.add('active');

        let html = '';
        const piece = this.selectedPiece;

        // Common position properties
        if (piece.x !== undefined) {
            html += `
                <div class="property-row">
                    <label>X Position</label>
                    <input type="number" id="prop-x" value="${piece.x}">
                </div>
                <div class="property-row">
                    <label>Y Position</label>
                    <input type="number" id="prop-y" value="${piece.y}">
                </div>
            `;
        }

        // Type-specific properties
        switch (piece.type) {
            case 'bumper':
                html += `
                    <div class="property-row">
                        <label>Radius</label>
                        <input type="number" id="prop-radius" value="${piece.radius}" min="10" max="60">
                    </div>
                `;
                break;

            case 'booster':
                html += `
                    <div class="property-row">
                        <label>Angle</label>
                        <input type="number" id="prop-angle" value="${piece.angle}" step="0.1">
                    </div>
                    <div class="property-row">
                        <label>Force</label>
                        <input type="number" id="prop-force" value="${piece.boostForce}" min="100" max="1000">
                    </div>
                `;
                break;

            case 'spinner':
                html += `
                    <div class="property-row">
                        <label>Radius</label>
                        <input type="number" id="prop-radius" value="${piece.radius}" min="30" max="100">
                    </div>
                    <div class="property-row">
                        <label>Arms</label>
                        <input type="number" id="prop-arms" value="${piece.armCount}" min="2" max="6">
                    </div>
                    <div class="property-row">
                        <label>Speed</label>
                        <input type="number" id="prop-speed" value="${piece.rotationSpeed}" step="0.1">
                    </div>
                `;
                break;

            case 'portal':
                html += `
                    <div class="property-row">
                        <label>Target X</label>
                        <input type="number" id="prop-targetX" value="${piece.targetX}">
                    </div>
                    <div class="property-row">
                        <label>Target Y</label>
                        <input type="number" id="prop-targetY" value="${piece.targetY}">
                    </div>
                `;
                break;
        }

        html += '<button class="editor-btn" style="width:100%;margin-top:12px" onclick="window.levelEditor.deletePiece(window.levelEditor.selectedPiece)">Delete</button>';

        content.innerHTML = html;

        // Bind property change events
        content.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', () => this.updatePieceProperty(input));
        });
    }

    updatePieceProperty(input) {
        const value = parseFloat(input.value);
        const piece = this.selectedPiece;

        switch (input.id) {
            case 'prop-x': piece.x = value; break;
            case 'prop-y': piece.y = value; break;
            case 'prop-radius': piece.radius = value; break;
            case 'prop-angle': piece.angle = value; break;
            case 'prop-force': piece.boostForce = value; break;
            case 'prop-arms': piece.armCount = value; break;
            case 'prop-speed': piece.rotationSpeed = value; break;
            case 'prop-targetX': piece.targetX = value; break;
            case 'prop-targetY': piece.targetY = value; break;
        }

        this.saveToHistory();
        this.render();
    }

    // History management
    saveToHistory() {
        this.historyIndex++;
        this.history = this.history.slice(0, this.historyIndex);
        this.history.push(JSON.stringify(this.currentLevel));
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.currentLevel = JSON.parse(this.history[this.historyIndex]);
            this.render();
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.currentLevel = JSON.parse(this.history[this.historyIndex]);
            this.render();
        }
    }

    // Rendering
    render() {
        if (!this.ctx) return;

        const ctx = this.ctx;
        const canvas = this.canvas;

        // Clear
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(this.camera.x, this.camera.y);
        ctx.scale(this.zoom, this.zoom);

        // Draw grid
        if (this.showGrid) {
            this.drawGrid();
        }

        // Draw level bounds
        this.drawBounds();

        // Draw spawn point
        this.drawSpawnPoint();

        // Draw all pieces
        this.currentLevel.tracks.forEach(piece => {
            this.drawPiece(piece);
        });

        // Highlight selected piece
        if (this.selectedPiece) {
            this.drawSelection(this.selectedPiece);
        }

        ctx.restore();
    }

    drawGrid() {
        const ctx = this.ctx;
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;

        const startX = Math.floor(-this.camera.x / this.zoom / this.gridSize) * this.gridSize;
        const startY = Math.floor(-this.camera.y / this.zoom / this.gridSize) * this.gridSize;
        const endX = startX + this.canvas.width / this.zoom + this.gridSize * 2;
        const endY = startY + this.canvas.height / this.zoom + this.gridSize * 2;

        for (let x = startX; x < endX; x += this.gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
            ctx.stroke();
        }

        for (let y = startY; y < endY; y += this.gridSize) {
            ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
            ctx.stroke();
        }
    }

    drawBounds() {
        const ctx = this.ctx;
        const bounds = this.currentLevel.bounds;

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        ctx.strokeRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);
        ctx.setLineDash([]);
    }

    drawSpawnPoint() {
        const ctx = this.ctx;
        const x = this.currentLevel.spawnX;
        const y = this.currentLevel.spawnY;

        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎱', x, y);
    }

    drawPiece(piece) {
        const ctx = this.ctx;

        switch (piece.type) {
            case 'ramp':
                ctx.strokeStyle = piece.color || '#4ade80';
                ctx.lineWidth = 8;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(piece.startX, piece.startY);
                ctx.lineTo(piece.endX, piece.endY);
                ctx.stroke();
                break;

            case 'bumper':
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.arc(piece.x, piece.y, piece.radius, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'booster':
                ctx.fillStyle = '#fbbf24';
                ctx.beginPath();
                ctx.arc(piece.x, piece.y, 25, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('⚡', piece.x, piece.y);
                break;

            case 'portal':
                ctx.fillStyle = piece.color || '#8b5cf6';
                ctx.beginPath();
                ctx.arc(piece.x, piece.y, piece.radius, 0, Math.PI * 2);
                ctx.fill();
                // Draw line to target
                ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(piece.x, piece.y);
                ctx.lineTo(piece.targetX, piece.targetY);
                ctx.stroke();
                ctx.setLineDash([]);
                // Target indicator
                ctx.strokeStyle = '#8b5cf6';
                ctx.beginPath();
                ctx.arc(piece.targetX, piece.targetY, 15, 0, Math.PI * 2);
                ctx.stroke();
                break;

            case 'spinner':
                ctx.strokeStyle = '#64748b';
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.arc(piece.x, piece.y, piece.radius, 0, Math.PI * 2);
                ctx.stroke();
                break;

            case 'coin':
                ctx.fillStyle = '#fbbf24';
                ctx.beginPath();
                ctx.arc(piece.x, piece.y, 15, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'star':
                ctx.fillStyle = '#a855f7';
                ctx.font = '30px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('⭐', piece.x, piece.y);
                break;

            case 'goal':
                ctx.fillStyle = '#22c55e';
                ctx.fillRect(piece.x - piece.width / 2, piece.y - piece.height / 2, piece.width, piece.height);
                ctx.fillStyle = '#fff';
                ctx.font = '30px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🏁', piece.x, piece.y);
                break;

            case 'funnel':
                ctx.fillStyle = piece.color || '#4ade80';
                ctx.beginPath();
                ctx.moveTo(piece.x - piece.topWidth / 2, piece.y - piece.height / 2);
                ctx.lineTo(piece.x + piece.topWidth / 2, piece.y - piece.height / 2);
                ctx.lineTo(piece.x + piece.bottomWidth / 2, piece.y + piece.height / 2);
                ctx.lineTo(piece.x - piece.bottomWidth / 2, piece.y + piece.height / 2);
                ctx.closePath();
                ctx.fill();
                break;

            case 'movingPlatform':
                ctx.fillStyle = '#64748b';
                ctx.fillRect(piece.x - piece.width / 2, piece.y - 10, piece.width, 20);
                // Draw path
                ctx.strokeStyle = 'rgba(100, 116, 139, 0.5)';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(piece.startX, piece.startY);
                ctx.lineTo(piece.endX, piece.endY);
                ctx.stroke();
                ctx.setLineDash([]);
                break;
        }
    }

    drawSelection(piece) {
        const ctx = this.ctx;

        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 3]);

        let bounds;
        if (piece.type === 'ramp') {
            const minX = Math.min(piece.startX, piece.endX) - 10;
            const maxX = Math.max(piece.startX, piece.endX) + 10;
            const minY = Math.min(piece.startY, piece.endY) - 10;
            const maxY = Math.max(piece.startY, piece.endY) + 10;
            bounds = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
        } else {
            const size = (piece.radius || piece.width / 2 || 30) + 10;
            bounds = { x: piece.x - size, y: piece.y - size, width: size * 2, height: size * 2 };
        }

        ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
        ctx.setLineDash([]);
    }

    // Level management
    testLevel() {
        // Close editor and load level for testing
        this.close();

        if (this.game && this.game.loadCustomLevel) {
            this.game.loadCustomLevel(this.currentLevel);
        }
    }

    saveLevel() {
        this.currentLevel.name = document.getElementById('level-name').value || 'Untitled';

        // Update settings
        const bg = document.getElementById('level-bg').value;
        const bgColors = {
            meadow: ['#0f172a', '#1e3a5f'],
            desert: ['#451a03', '#78350f'],
            ice: ['#0c4a6e', '#164e63'],
            volcano: ['#450a0a', '#7f1d1d'],
            space: ['#0f0326', '#1e1b4b']
        };
        this.currentLevel.backgroundColor = bgColors[bg];

        this.currentLevel.starThresholds = {
            three: parseInt(document.getElementById('star-3').value) || 5,
            two: parseInt(document.getElementById('star-2').value) || 10,
            one: parseInt(document.getElementById('star-1').value) || 20
        };

        this.currentLevel.icePhysics = document.getElementById('ice-physics').checked;
        this.currentLevel.lowGravity = document.getElementById('low-gravity').checked;

        // Save to custom levels
        const existingIndex = this.customLevels.findIndex(l => l.id === this.currentLevel.id);
        if (existingIndex >= 0) {
            this.customLevels[existingIndex] = { ...this.currentLevel };
        } else {
            this.customLevels.push({ ...this.currentLevel });
        }

        this.saveCustomLevels();

        // Show confirmation
        this.showNotification('Level saved!');
    }

    shareLevel() {
        const levelData = JSON.stringify(this.currentLevel);
        const encoded = btoa(levelData);
        const shareUrl = `${window.location.origin}?level=${encoded}`;

        // Copy to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
            this.showNotification('Share link copied to clipboard!');
        }).catch(() => {
            // Fallback
            prompt('Copy this link to share:', shareUrl);
        });
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: #22c55e;
            color: #fff;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: bold;
            z-index: 100000;
            animation: notificationPop 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'notificationPop 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    loadCustomLevels() {
        try {
            return JSON.parse(localStorage.getItem('velocity_custom_levels') || '[]');
        } catch (e) {
            return [];
        }
    }

    saveCustomLevels() {
        localStorage.setItem('velocity_custom_levels', JSON.stringify(this.customLevels));
    }

    loadLevel(level) {
        this.currentLevel = JSON.parse(JSON.stringify(level));
        document.getElementById('level-name').value = level.name;
        this.history = [JSON.stringify(this.currentLevel)];
        this.historyIndex = 0;
        this.render();
    }

    // Open/close editor
    open() {
        this.isActive = true;
        this.editorElement.classList.add('active');
        this.render();

        // Start render loop
        this.renderLoop();
    }

    close() {
        this.isActive = false;
        this.editorElement.classList.remove('active');
    }

    renderLoop() {
        if (!this.isActive) return;
        this.render();
        requestAnimationFrame(() => this.renderLoop());
    }
}

// Export
window.LevelEditor = LevelEditor;
