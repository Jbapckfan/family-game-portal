// Responsive UI only. Existing control nodes and game methods keep their handlers.
const STORAGE_KEY='dots3d_controls_v1';
const oneOf=(value,choices,fallback)=>choices.includes(value)?value:fallback;

export function normalizePreferences(value={}) {
    const v=value&&typeof value==='object'?value:{};
    const gridSize=oneOf(v.gridSize,[2,3,4],3);
    return {
        gridSize,difficulty:oneOf(v.difficulty,['easy','medium','hard','impossible'],'medium'),
        mode:oneOf(v.mode,['human-vs-ai','human-vs-human','ai-vs-ai'],'human-vs-ai'),
        theme:oneOf(v.theme,['default','neon','wooden','crystal'],'default'),
        autoRotate:v.autoRotate===true,danger:v.danger===true,soundMuted:v.soundMuted===true,timerEnabled:v.timerEnabled===true,
        timerChoice:oneOf(v.timerChoice,['per-move-15','per-move-30','per-move-60','total-180','total-300'],'per-move-30'),
        layers:Array.isArray(v.layers)&&v.layers.length===gridSize&&v.layers.every(x=>typeof x==='boolean')?v.layers.slice():Array(gridSize).fill(true)
    };
}
export function readPreferences(storage) {
    try {const v=JSON.parse(storage.getItem(STORAGE_KEY));return v&&typeof v==='object'&&!Array.isArray(v)?normalizePreferences(v):null;} catch {return null;}
}
export function writePreferences(storage,value) {
    try {storage.setItem(STORAGE_KEY,JSON.stringify(normalizePreferences(value)));return true;} catch {return false;}
}
export function snapshotPreferences(g) {
    return normalizePreferences({gridSize:g.gridSize,difficulty:g.aiDifficulty,mode:g.gameMode,theme:g.currentTheme,autoRotate:g.autoRotate,
        danger:g.dangerColoringEnabled,soundMuted:g.soundMuted,timerEnabled:g.timerEnabled,timerChoice:`${g.timerMode}-${g.timerSeconds}`,layers:g.layerVisibility});
}
export function applyPreferences(g,value,schedule=setTimeout) {
    const p=normalizePreferences(value);
    if(g.soundMuted!==p.soundMuted)g.toggleMute();
    if(g.gridSize!==p.gridSize)g.setGridSize(p.gridSize);
    if(g.aiDifficulty!==p.difficulty)g.setDifficulty(p.difficulty);
    if(g.gameMode!==p.mode) {
        g.gameMode=p.mode;g.updateModeUI();g.newGame();
        // Same initial delay as the existing mode control, with a stale-mode guard.
        if(p.mode==='ai-vs-ai')schedule(()=>{if(g.gameMode==='ai-vs-ai'&&!g.gameEnded)g.makeAIMove();},500);
    }
    if(g.currentTheme!==p.theme)g.setTheme(p.theme);
    if(g.autoRotate!==p.autoRotate)g.toggleAutoRotate();
    if(g.dangerColoringEnabled!==p.danger)g.toggleDangerColoring();
    if(`${g.timerMode}-${g.timerSeconds}`!==p.timerChoice)g.setTimerMode(p.timerChoice);
    if(g.timerEnabled!==p.timerEnabled)g.toggleTimer();
    p.layers.forEach((visible,z)=>{if(g.layerVisibility[z]!==visible)g.toggleLayer(z);});
    g.requestRender();
}
export function relocateControls(placements,intoDrawer) {
    for(const {node,anchor,slot} of placements) {
        if(intoDrawer)slot.appendChild(node);
        else anchor.parentNode.insertBefore(node,anchor.nextSibling);
    }
}

export function createControls(game,doc=document,win=window) {
    const drawer=doc.getElementById('settingsDrawer'),backdrop=doc.getElementById('settingsBackdrop');
    const trigger=doc.getElementById('settingsButton'),close=doc.getElementById('settingsClose');
    const container=doc.getElementById('gameContainer');
    const media=win.matchMedia('(max-width:900px)');
    const placements=[];
    for(const [selector,slotId] of [
        ['.difficulty-selector','drawerMatch'],['.grid-selector','drawerMatch'],['#timerPreferences','drawerMatch'],
        ['#secondaryActions','drawerActions'],['.rotation-controls','drawerView'],['#layerControls','drawerLayers'],['.help-bottom','drawerHelp']
    ]) {
        const node=doc.querySelector(selector),anchor=doc.createComment(`original ${selector}`);
        node.parentNode.insertBefore(anchor,node);
        placements.push({node,anchor,slot:doc.getElementById(slotId)});
    }
    // These nodes move; their click listeners and inline handlers are not cloned.
    const help=doc.querySelector('.help-button');help.textContent='?  How to Play';
    for(const option of doc.querySelectorAll('.difficulty-option,.grid-option,.theme-option')) {
        option.setAttribute('role','button');option.tabIndex=0;
        option.addEventListener('keydown',event=>{
            if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();option.click();}
        });
    }
    const helpOriginal=help.textContent;
    let open=false;
    const originalInert=new Map();
    function closeDrawer(restoreFocus=true) {
        if(!open)return;
        open=false;drawer.hidden=true;backdrop.hidden=true;
        trigger.setAttribute('aria-expanded','false');doc.body.classList.remove('settings-open');
        originalInert.forEach((value,node)=>{node.inert=value;});originalInert.clear();
        for(const node of drawer.querySelectorAll('.difficulty-dropdown,.grid-dropdown,.theme-dropdown'))node.classList.remove('active');
        if(restoreFocus)(media.matches?trigger:doc.getElementById('newGameButton')).focus();
    }
    function openDrawer() {
        if(!media.matches)return;
        open=true;drawer.hidden=false;backdrop.hidden=false;
        trigger.setAttribute('aria-expanded','true');doc.body.classList.add('settings-open');
        // Menu deliberately remains outside the inert game panels and above this sheet.
        for(const node of container.children)if(!node.matches('.modal')){originalInert.set(node,node.inert);node.inert=true;}
        close.focus();
    }
    trigger.addEventListener('click',()=>open?closeDrawer():openDrawer());
    close.addEventListener('click',()=>closeDrawer());
    backdrop.addEventListener('click',()=>closeDrawer());
    drawer.addEventListener('keydown',event=>{
        // Prevent board keyboard shortcuts while operating settings.
        event.stopPropagation();
        if(event.key==='Escape'){event.preventDefault();closeDrawer();return;}
        if(event.key==='Tab') {
            const nodes=[doc.querySelector('.portal-home'),...drawer.querySelectorAll('button:not(:disabled),select,[tabindex="0"]')]
                .filter(node=>node&&node.getClientRects().length&&!node.closest('[hidden]'));
            const first=nodes[0],last=nodes.at(-1);
            if(event.shiftKey&&doc.activeElement===first){event.preventDefault();last.focus();}
            else if(!event.shiftKey&&doc.activeElement===last){event.preventDefault();first.focus();}
        }
    });
    for(const panel of [doc.getElementById('leftPanel'),doc.getElementById('rightPanel')])panel.addEventListener('keydown',event=>event.stopPropagation());
    // The Menu link is part of the keyboard loop as well as always being tappable.
    doc.querySelector('.portal-home').addEventListener('keydown',event=>{
        if(open&&event.key==='Escape'){event.preventDefault();event.stopPropagation();closeDrawer();return;}
        if(open&&event.key==='Tab') {
            event.preventDefault();
            if(event.shiftKey){const nodes=[...drawer.querySelectorAll('button:not(:disabled),select,[tabindex="0"]')].filter(n=>n.getClientRects().length);nodes.at(-1)?.focus();}
            else close.focus();
        }
    });
    function adapt() {
        closeDrawer();
        relocateControls(placements,media.matches);
        doc.body.classList.toggle('compact-controls',media.matches);
        help.textContent=media.matches?helpOriginal:'?';
        // Refit once after moving controls; no new animation loop.
        win.requestAnimationFrame(()=>{game.fitBoard();game.requestRender();});
    }
    media.addEventListener('change',adapt);adapt();
    if(win.ResizeObserver) {
        const boardObserver=new win.ResizeObserver(()=>{if(!game.renderDisposed){game.fitBoard();game.requestRender();}});
        boardObserver.observe(doc.getElementById('boardViewport'));
        win.addEventListener('pagehide',event=>{if(!event.persisted)boardObserver.disconnect();});
    }
    const modalObserver=new win.MutationObserver(records=>{
        if(open&&records.some(record=>record.target.classList.contains('active')))closeDrawer(false);
    });
    for(const modal of container.querySelectorAll('.modal'))modalObserver.observe(modal,{attributes:true,attributeFilter:['class']});
    let storage;
    try {storage=win.localStorage;} catch {storage=null;}
    const saved=readPreferences(storage);
    if(saved)applyPreferences(game,saved);
    doc.getElementById('timerModeSelect').value=`${game.timerMode}-${game.timerSeconds}`;
    const syncClock=()=>{
        const changed=doc.body.classList.contains('clock-enabled')!==game.timerEnabled;
        doc.body.classList.toggle('clock-enabled',game.timerEnabled);
        if(changed)win.requestAnimationFrame(()=>{game.fitBoard();game.requestRender();});
    };
    syncClock();
    const persist=()=>{syncClock();return writePreferences(storage,snapshotPreferences(game));};
    const uiSelector='#leftPanel,#rightPanel,#settingsDrawer';
    doc.addEventListener('click',event=>{
        if(!event.target.closest(uiSelector))return;
        // Snapshot after the original handler has changed the existing game state.
        win.queueMicrotask(persist);
        const option=event.target.closest('.difficulty-option,.grid-option,.theme-option');
        if(open&&option)option.closest('.difficulty-selector,.grid-selector,.theme-selector')?.querySelector('button')?.focus();
        if(open&&event.target.closest('[data-close-settings],.help-button'))closeDrawer(false);
    });
    doc.addEventListener('change',event=>{if(event.target.closest(uiSelector))win.queueMicrotask(persist);});
    return {open:openDrawer,close:closeDrawer,isOpen:()=>open};
}

if(typeof window!=='undefined') {
    const boot=()=>{if(window.game)window.dotsControls=createControls(window.game);};
    if(window.game)boot();else window.addEventListener('DOMContentLoaded',boot,{once:true});
}
