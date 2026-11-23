// Node only: settings data and moving existing controls; no browser or renderer.
import assert from 'node:assert/strict';
import { normalizePreferences, readPreferences, writePreferences, snapshotPreferences, applyPreferences, relocateControls, createControls } from './controls.mjs';

const normalized=normalizePreferences({gridSize:4,difficulty:'hard',mode:'human-vs-human',theme:'wooden',autoRotate:true,danger:true,soundMuted:true,timerEnabled:true,timerChoice:'total-300',layers:[true,false,true,false],scores:[99,0]});
assert.equal(normalized.gridSize,4);assert.equal(normalized.theme,'wooden');assert.ok(!('scores' in normalized));
assert.deepEqual(normalized.layers,[true,false,true,false]);
const invalid=normalizePreferences({gridSize:50,difficulty:'bad',theme:'bad',timerChoice:'total-1',layers:[false]});
assert.equal(invalid.gridSize,3);assert.equal(invalid.difficulty,'medium');assert.equal(invalid.theme,'default');assert.equal(invalid.timerChoice,'per-move-30');assert.deepEqual(invalid.layers,[true,true,true]);
assert.equal(readPreferences({getItem(){throw Error('blocked');}}),null);
assert.equal(readPreferences({getItem(){return '{invalid';}}),null);
assert.equal(writePreferences({setItem(){throw Error('full');}},normalized),false);
const memory={value:null,getItem(){return this.value;},setItem(k,v){this.key=k;this.value=v;}};
assert.equal(writePreferences(memory,normalized),true);assert.equal(memory.key,'dots3d_controls_v1');assert.deepEqual(readPreferences(memory),normalized);

const calls=[];
const game={gridSize:3,aiDifficulty:'medium',gameMode:'human-vs-ai',currentTheme:'default',autoRotate:false,dangerColoringEnabled:false,soundMuted:false,timerEnabled:false,timerMode:'per-move',timerSeconds:30,layerVisibility:[true,true,true],
    setGridSize(v){calls.push('grid');this.gridSize=v;this.layerVisibility=Array(v).fill(true);},
    setDifficulty(v){calls.push('difficulty');this.aiDifficulty=v;},
    updateModeUI(){calls.push('mode');},newGame(){calls.push('newGame');this.layerVisibility=Array(this.gridSize).fill(true);},
    setTheme(v){calls.push('theme');this.currentTheme=v;},
    toggleAutoRotate(){this.autoRotate=!this.autoRotate;},toggleDangerColoring(){this.dangerColoringEnabled=!this.dangerColoringEnabled;},toggleMute(){this.soundMuted=!this.soundMuted;},
    setTimerMode(v){this.timerMode=v.startsWith('total')?'total':'per-move';this.timerSeconds=Number(v.split('-').at(-1));},toggleTimer(){this.timerEnabled=!this.timerEnabled;},
    toggleLayer(i){this.layerVisibility[i]=!this.layerVisibility[i];},requestRender(){calls.push('render');},makeAIMove(){calls.push('AI');}
};
const scheduled=[];applyPreferences(game,normalized,(fn,ms)=>scheduled.push({fn,ms}));
assert.deepEqual(snapshotPreferences(game),normalized);assert.ok(calls.indexOf('grid')<calls.indexOf('theme'));assert.equal(scheduled.length,0);
applyPreferences(game,{...normalized,mode:'ai-vs-ai'},(fn,ms)=>scheduled.push({fn,ms}));assert.equal(scheduled.length,1);assert.equal(scheduled[0].ms,500);
game.gameMode='human-vs-ai';scheduled[0].fn();assert.ok(!calls.includes('AI'),'stale restoration cannot start a bot after mode changed');

class Node {
    constructor(name){this.name=name;this.children=[];this.listener={same:true};}
    get nextSibling(){return this.parentNode?.children[this.parentNode.children.indexOf(this)+1]||null;}
    appendChild(child){this.insertBefore(child,null);}
    insertBefore(child,next){if(child.parentNode)child.parentNode.children.splice(child.parentNode.children.indexOf(child),1);const i=next?this.children.indexOf(next):this.children.length;this.children.splice(i,0,child);child.parentNode=this;}
}
const original=new Node('original'),slot=new Node('drawer'),before=new Node('before'),anchor=new Node('anchor'),control=new Node('control'),after=new Node('after');
for(const n of [before,anchor,control,after])original.appendChild(n);
const identity=control.listener,moves=[{node:control,anchor,slot}];
for(let i=0;i<3;i++){relocateControls(moves,true);assert.equal(control.parentNode,slot);assert.equal(control.listener,identity);relocateControls(moves,false);assert.deepEqual(original.children.map(n=>n.name),['before','anchor','control','after']);}
console.log('Dots controls: valid/corrupt/blocked storage, preference restoration, AI guard and repeated node relocation passed');

// Minimal event/parent fixture for the real controller; it does not render CSS.
let doc;
class Element extends Node {
    constructor(tag='div',id='',classes=''){super(id||tag);this.tagName=tag;this.id=id;this.classes=new Set(classes.split(' ').filter(Boolean));this.attributes={};this.handlers={};this.hidden=false;this.inert=false;this.textContent='';
        this.classList={contains:c=>this.classes.has(c),add:c=>this.classes.add(c),remove:c=>this.classes.delete(c),toggle:(c,on)=>{const value=on??!this.classes.has(c);value?this.classes.add(c):this.classes.delete(c);return value;}};}
    setAttribute(k,v){this.attributes[k]=String(v);}
    matches(selector){return selector.split(',').some(part=>{const s=part.trim();if(s==='[hidden]')return this.hidden;if(s==='[tabindex="0"]')return this.tabIndex===0;if(s.startsWith('['))return s.slice(1,-1) in this.attributes;if(s.startsWith('#'))return this.id===s.slice(1);if(s.startsWith('.'))return s.slice(1).split('.').every(c=>this.classes.has(c));if(s==='button:not(:disabled)')return this.tagName==='button'&&!this.disabled;return this.tagName===s;});}
    closest(selector){for(let n=this;n;n=n.parentNode)if(n.matches?.(selector))return n;return null;}
    querySelectorAll(selector){const all=[];const walk=n=>{for(const c of n.children){if(c.matches?.(selector))all.push(c);walk(c);}};walk(this);return all;}
    querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
    addEventListener(type,fn){(this.handlers[type]??=[]).push(fn);}
    getClientRects(){return this.closest('[hidden]')?[]:[{}];}
    focus(){doc.activeElement=this;}
    fire(type,properties={}){const e={target:this,preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;},...properties};if(type==='click')this.onclick?.(e);for(let n=this;n;n=n.parentNode){for(const fn of n.handlers?.[type]||[])fn(e);if(e.stopped)break;}return e;}
    click(){this.fire('click');}
}
doc=new Element('document');doc.body=new Element('body');doc.appendChild(doc.body);doc.createComment=()=>new Element('comment');doc.getElementById=id=>doc.querySelector('#'+id);
const add=(parent,tag,id='',classes='')=>{const n=new Element(tag,id,classes);parent.appendChild(n);return n;};
const home=add(doc.body,'a','','portal-home'),container=add(doc.body,'div','gameContainer');
add(container,'div','boardViewport');const left=add(container,'div','leftPanel'),scores=add(left,'div');
const difficulty=add(scores,'div','','difficulty-selector'),grid=add(scores,'div','','grid-selector'),timer=add(scores,'div','','timer-section'),timerPreferences=add(timer,'div','timerPreferences');
add(difficulty,'button','difficultyBtn');add(difficulty,'div','','difficulty-option');add(grid,'button','gridBtn');add(grid,'div','','grid-option');add(timerPreferences,'select','timerModeSelect');
const timerToggle=add(timerPreferences,'button','timerToggle');timerToggle.onclick=()=>game.toggleTimer();add(timer,'div','p1TimerRow');add(timer,'div','p2TimerRow');
const right=add(container,'div','rightPanel'),newGame=add(right,'button','newGameButton');add(right,'button','hint');add(right,'button','undo');const trigger=add(right,'button','settingsButton');
const secondary=add(right,'div','secondaryActions'),rotate=add(secondary,'button','autoRotateBtn');rotate.onclick=()=>game.toggleAutoRotate();
const theme=add(secondary,'div','','theme-selector');add(theme,'button','themeBtn');const themeOptions=add(theme,'div','themeDropdown','theme-dropdown'),wooden=add(themeOptions,'div','','theme-option');wooden.onclick=()=>game.setTheme('wooden');
add(secondary,'button','muteBtn');const guide=add(secondary,'button');guide.setAttribute('data-close-settings','');
const rotation=add(container,'div','','rotation-controls');add(rotation,'button');const layers=add(container,'div','layerControls');add(layers,'button','','layer-btn');
const helpRoot=add(container,'div','','help-bottom'),help=add(helpRoot,'button','','help-button');
const modal=add(container,'div','helpModal','modal'),modalButton=add(modal,'button');
const backdrop=add(doc.body,'div','settingsBackdrop'),drawer=add(doc.body,'section','settingsDrawer');drawer.hidden=true;backdrop.hidden=true;
const closeButton=add(drawer,'button','settingsClose');for(const id of ['drawerMatch','drawerActions','drawerView','drawerLayers','drawerHelp'])add(drawer,'div',id);
const changes=[],frames=[],observers=[],boardObservers=[],windowEvents={};const media={matches:true,addEventListener(type,fn){changes.push(fn);}};
game.fitBoard=()=>calls.push('fit');
const storage={value:null,getItem(){return this.value;},setItem(k,v){this.value=v;}};
const win={matchMedia:()=>media,requestAnimationFrame:fn=>frames.push(fn),queueMicrotask:fn=>fn(),localStorage:storage,
    MutationObserver:class{constructor(fn){this.fn=fn;observers.push(this);}observe(){}},
    ResizeObserver:class{constructor(fn){this.fn=fn;boardObservers.push(this);}observe(node){this.node=node;}disconnect(){this.disconnected=true;}},
    addEventListener(type,fn){windowEvents[type]=fn;}};
let boardShortcutCount=0;doc.addEventListener('keydown',()=>boardShortcutCount++);
const ui=createControls(game,doc,win);frames.shift()();
assert.equal(right.querySelectorAll('button').length,4,'only three play actions plus Settings remain');
assert.equal(secondary.parentNode,doc.getElementById('drawerActions'));assert.equal(difficulty.parentNode,doc.getElementById('drawerMatch'));
assert.equal(timerPreferences.parentNode,doc.getElementById('drawerMatch'));assert.equal(doc.getElementById('p1TimerRow').parentNode,timer,'live clocks stay beside the board');
trigger.click();assert.ok(ui.isOpen());assert.equal(drawer.hidden,false);assert.equal(backdrop.hidden,false);assert.equal(trigger.attributes['aria-expanded'],'true');assert.equal(doc.activeElement,closeButton);assert.equal(container.children[0].inert,true);assert.equal(home.inert,false);
closeButton.fire('keydown',{key:'ArrowRight'});assert.equal(boardShortcutCount,0,'settings keys do not rotate the game');
rotate.click();wooden.click();assert.equal(JSON.parse(storage.value).autoRotate,game.autoRotate);assert.equal(JSON.parse(storage.value).theme,'wooden');
timerToggle.click();assert.equal(doc.body.classList.contains('clock-enabled'),game.timerEnabled);
closeButton.fire('keydown',{key:'Escape'});assert.ok(!ui.isOpen());assert.equal(doc.activeElement,trigger);assert.equal(container.children[0].inert,false);
trigger.click();media.matches=false;changes[0]();assert.ok(!ui.isOpen());assert.equal(secondary.parentNode,right);assert.equal(difficulty.parentNode,scores);assert.equal(doc.activeElement,newGame);
media.matches=true;changes[0]();trigger.click();modalButton.focus();modal.classList.add('active');observers[0].fn([{target:modal}]);assert.ok(!ui.isOpen());assert.equal(doc.activeElement,modalButton,'opening another modal keeps its focus');
trigger.click();backdrop.click();assert.ok(!ui.isOpen());assert.equal(doc.activeElement,trigger);
assert.equal(boardObservers[0].node,doc.getElementById('boardViewport'));let fitCount=calls.filter(c=>c==='fit').length;boardObservers[0].fn();assert.equal(calls.filter(c=>c==='fit').length,fitCount+1);
game.renderDisposed=true;fitCount=calls.filter(c=>c==='fit').length;boardObservers[0].fn();assert.equal(calls.filter(c=>c==='fit').length,fitCount);game.renderDisposed=false;
windowEvents.pagehide({persisted:true});assert.ok(!boardObservers[0].disconnected);windowEvents.pagehide({persisted:false});assert.ok(boardObservers[0].disconnected);
console.log('Dots drawer: original handlers, compact/wide relocation, inert background, focus, Escape, backdrop, modal handoff and live preference writes passed');
