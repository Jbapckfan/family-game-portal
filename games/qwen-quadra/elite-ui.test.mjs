import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {JSDOM}=createRequire(import.meta.url)('jsdom');

// Exercise each real game renderer and engine. Only the shell mount is captured;
// no browser, server, timer or storage is started by this focused DOM harness.
let loadSerial=0;
async function game(slug,puzzle,state) {
 const base=new URL(`../qwen-${slug}/`,import.meta.url),E=await import(new URL('engine.mjs',base)),{PUZZLES}=await import(new URL('puzzles.mjs',base));
 let config;
 globalThis.__captureQwen=configured=>{config=configured;};
 let source=await readFile(new URL('app.mjs',base),'utf8');
 source=source.replace(/import \{mountDailyGame,?\s*(?:escapeHTML as esc)?\} from '[^']+';/,`import {escapeHTML as esc} from '${new URL('../deepseek-runtime/common.mjs',base)}';const mountDailyGame=globalThis.__captureQwen;`);
 source=source.replace(/from '(\.\.?\/[^']+)'/g,(_,path)=>`from '${new URL(path,base)}'`);
 await import(`data:text/javascript;base64,${Buffer.from(source+`\n// renderer instance ${++loadSerial}`).toString('base64')}`);
 delete globalThis.__captureQwen;
 const dom=new JSDOM('<!doctype html><div id="puzzle"></div>',{url:'https://example.test/'});
 globalThis.document=dom.window.document;
 const root=document.getElementById('puzzle'),p=puzzle||PUZZLES[0],messages=[];
 let s=state||E.createState(p);
 const render=next=>{if(next)s=next;config.render({root,puzzle:p,state:s,mode:'daily',announce:message=>messages.push(message),commit:(next,message)=>{const valid=E.restoreState(p,next);assert.ok(valid,'UI commits a compatible save');s=valid;render();if(message)messages.push(message);return true;}});};
 render();
 return {root,p,E,config,messages,get state(){return s;},render,close(){dom.window.close();delete globalThis.document;},key(target,key,options={}){target.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true,...options}));},input(value,position){const input=root.querySelector('#quadra-word');input.focus();input.value=value;input.setSelectionRange(position,position);input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));}};
}

test('Quadra keeps the insertion point while editing duplicate letters without spending a chance',async()=>{
 const g=await game('quadra',{id:'entry-fixture',category:'Words',tiles:[...'FOODMOONSTARLIME'],answers:['FOOD','MOON','STAR','LIME']});
 try{g.input('FOO',1);const input=g.root.querySelector('#quadra-word');assert.equal(input.value,'FOO');assert.equal(input.selectionStart,1);assert.equal(document.activeElement,input);assert.equal(new Set(g.state.selected).size,3);assert.equal(g.E.analyze(g.p,g.state).mistakes,0);
  g.input('FOOX',4);assert.equal(g.root.querySelector('#quadra-word').value,'FOO');assert.equal(g.E.analyze(g.p,g.state).mistakes,0);assert.match(g.messages.at(-1),/No unused X/);
 }finally{g.close();}
});

test('Lattice keyboard white marks are a single undoable action and givens stay fixed',async()=>{
 const g=await game('logic-lattice');
 try{const cell=()=>g.root.querySelector('[data-cell="0"]');cell().focus();g.key(cell(),'w');assert.equal(g.state.cells[0],0);assert.equal(g.state.history.length,1);assert.equal(document.activeElement,cell());g.root.querySelector('#lattice-undo').click();assert.equal(g.state.cells[0],-1);g.key(cell(),'b');assert.equal(g.state.cells[0],1);g.key(cell(),'u');assert.equal(g.state.cells[0],-1);g.key(g.root.querySelector('[data-cell="1"]'),'b');assert.equal(g.state.cells[1],0);
 }finally{g.close();}
});

test('Lattice completed and contradictory clues have visible marks independent of color',async()=>{
 const g=await game('logic-lattice');
 try{g.render({...g.state,cells:[...g.p.solution]});assert.match(g.root.querySelector('.lattice-count.satisfied').textContent,/✓/);
  const cells=[...g.p.solution];cells[4]=1;g.render({...g.state,cells});assert.match(g.root.querySelector('.lattice-count.contradiction').textContent,/!/);
 }finally{g.close();}
});

test('Siege announces a real clock impact once and keeps damage separate from score',async()=>{
 const g=await game('syntax-siege');
 try{g.render({...g.state,started:true,remainingMs:1});g.render(g.E.tick(g.p,g.state,500));assert.equal(g.E.health(g.state),80);assert.match(g.messages.at(-1),/20 damage/);assert.match(g.messages.at(-1),/same wave/i);const count=g.messages.length;g.render(g.E.tick(g.p,g.state,500));assert.equal(g.messages.length,count);
  for(const index of [1,5,3])g.root.querySelector(`[data-letter="${index}"]`).click();assert.match(g.root.querySelector('#siege-fire').textContent,/30 damage/);assert.match(g.root.querySelector('[data-letter="5"]').getAttribute('aria-label'),/selected letter 2/);assert.equal(g.root.querySelector('[data-letter="5"] .siege-order').textContent,'2');
 }finally{g.close();}
});

test('Memory Maze hands focus to the known start only when study ends, with route-free arrow navigation',async()=>{
 const g=await game('memory-maze',{id:'navigation-fixture',path:[0,1,2,9,16,17,24,25],obstacles:[7,14]});
 try{g.root.querySelector('#maze-start').click();assert.equal(g.state.remainingMs,6000);g.render(g.E.tick(g.p,g.state,5999));assert.equal(g.state.phase,'study');assert.notEqual(document.activeElement?.dataset?.cell,'0');g.render(g.E.tick(g.p,g.state,1));assert.equal(document.activeElement.dataset.cell,'0');assert.match(g.messages.at(-1),/study complete/i);g.key(document.activeElement,'ArrowRight');assert.equal(document.activeElement.dataset.cell,'1');assert.equal(g.state.trail.length,0);assert.equal(g.state.mistakes,0);g.key(document.activeElement,'ArrowLeft');document.activeElement.click();assert.deepEqual(g.state.trail,[0]);
 }finally{g.close();}
});

test('Prism moves keyboard focus to the new prediction prompt after an accepted choice',async()=>{
 const g=await game('pattern-prism');
 try{const choice=g.root.querySelector('[data-choice="0"]');choice.focus();choice.click();assert.equal(g.state.answers.length,1);assert.equal(document.activeElement.id,'prism-prompt');assert.match(document.activeElement.textContent,/7/);assert.equal(g.root.querySelector('.prism-choices').getAttribute('aria-labelledby'),'prism-prompt');
 }finally{g.close();}
});

test('Prism letter keys choose options and a rejected choice leaves a usable keyboard target',async()=>{
 const g=await game('pattern-prism');
 try{const wrong=g.root.querySelector('[data-choice="1"]');wrong.focus();g.key(wrong,'b');assert.equal(g.state.wrong[0].length,1);assert.equal(document.activeElement.disabled,false);assert.equal(document.activeElement.dataset.choice,'2');g.key(document.activeElement,'a');assert.equal(g.state.answers.length,1);assert.equal(g.E.mistakes(g.state),1);
 }finally{g.close();}
});

test('Prism ignores a held shortcut so one key press cannot answer the next prediction',async()=>{
 const g=await game('pattern-prism');
 try{g.key(g.root.querySelector('[data-choice="0"]'),'a');assert.equal(g.state.answers.length,1);g.key(document.activeElement,'d',{repeat:true});assert.equal(g.state.answers.length,1);assert.equal(g.E.mistakes(g.state),0);
 }finally{g.close();}
});

test('Territory exhausted placements disable empty hexes and lead directly to undo without ending play',async()=>{
 const g=await game('territory-tactics');
 try{g.root.querySelector('[data-hex="0,-2"]').click();g.root.querySelector('[data-hex="1,-2"]').click();assert.equal(g.state.moves.length,2);assert.equal(g.E.getStatus(g.p,g.state),'playing');assert.ok([...g.root.querySelectorAll('.territory-hex.empty')].every(b=>b.disabled));assert.equal(document.activeElement.id,'territory-undo');assert.match(g.root.querySelector('.territory-note').textContent,/undo or restart/i);g.root.querySelector('#territory-undo').click();assert.equal(g.state.moves.length,1);assert.ok([...g.root.querySelectorAll('.territory-hex.empty')].some(b=>!b.disabled));assert.equal(g.state.hints,0);
 }finally{g.close();}
});
