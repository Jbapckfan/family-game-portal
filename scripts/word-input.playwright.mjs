// Actual input smoke checks. Isolated, source-routed contexts; never touches James's saves.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {GAMES} from '../games/daily/catalog.mjs';
const root=path.resolve(import.meta.dirname,'..');
const out=path.resolve(root,process.env.INPUT_OUT||'output/playwright/word-input-20261101');
await mkdir(out,{recursive:true});
const pw=await import(process.env.PLAYWRIGHT_MODULE||'/Users/jamesalford/.npm/_npx/31e32ef8478fbf80/node_modules/playwright/index.mjs');
const results=[];
const choices={
 counterpart:['[data-tile]','aria-pressed','true'],
 shortlist:['[data-letter="A"]','aria-pressed','true'],
 'second-sense':['[data-noun]','aria-pressed','true'],
 tradeoff:['#board [data-row][data-col]:not(:disabled)','aria-pressed','true'],
 inbetween:['#bank [data-tile]','aria-pressed','true'],
 'kimi-tangle':['[data-cell="0"]','aria-pressed','true'],
 'kimi-circuit':['[data-letter="0"]','data-selected','true'],
 'kimi-quartet':['[data-tile]','aria-pressed','true'],
 'deepseek-spare':['[data-word]','aria-pressed','true'],
 'deepseek-trail':['[data-index="0"]','aria-pressed','true'],
 'claude-splice':['[data-tile]','aria-pressed','true'],
 'claude-tangle':['[data-bead="0"]','aria-pressed','true'],
};
const entries={
 'deepseek-twin-hive':'#hive-word','deepseek-rung':'#rung-word',
 'claude-dovetail':'#dovetail-entry','claude-keystone':'#keystone-input',
 'claude-tumbler':'#tumbler-input',
};
for(const engine of (process.env.ENGINES||'chromium,webkit').split(',')){
 const browser=await pw[engine].launch(engine==='chromium'?{channel:'chrome',headless:true,args:['--disable-gpu']}:{headless:true,...(process.env.WEBKIT_EXECUTABLE_PATH?{executablePath:process.env.WEBKIT_EXECUTABLE_PATH}:{})});
 async function setup(slug,width=390){
  const context=await browser.newContext({viewport:{width,height:844},hasTouch:true,reducedMotion:'reduce'});
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());if(url.origin!=='https://word-input.test')return route.abort();
   let name=url.pathname;if(name.endsWith('/'))name+='index.html';
   const file=path.resolve(root,'.'+name);if(!file.startsWith(path.join(root,'games')+path.sep))return route.abort();
   try{await route.fulfill({path:file,contentType:({'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.ttf':'font/ttf'})[path.extname(file)]});}catch{await route.fulfill({status:404,body:'Missing file'});}
  });
  await context.addInitScript(()=>{
   for(const name of ['cairn','morph','tangle','hunch','circuit','quartet']){
    localStorage.setItem(`kimi:${name}:seen-help`,'1');
    localStorage.setItem(`kimi:${name}:v1:seen-help`,'true');
   }
   localStorage.setItem('kimi:settings:v1:sound','false');
  });
  const page=await context.newPage();page.setDefaultTimeout(7000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install({time:new Date('2026-11-01T18:00:00Z')});
  await page.goto(`https://word-input.test/games/${slug}/`);
  if(slug.startsWith('kimi-'))await page.locator('[data-game-ready]').waitFor();
  else await page.locator('#puzzle,#board').first().waitFor();
  // Original games can show an introductory dialog on first use.
  const dialog=page.locator('dialog[open]');
  if(await dialog.count())await dialog.first().locator('button').filter({hasText:/play|close|got it/i}).first().click();
  return {context,page,errors};
 }
 async function run(label,slug,fn,width){
  let env;
  try{env=await setup(slug,width);await fn(env.page);assert.deepEqual(env.errors,[]);results.push({engine,slug,check:label,pass:true});}
  catch(error){results.push({engine,slug,check:label,pass:false,error:error.message});if(env)await env.page.screenshot({path:path.join(out,`${engine}-${slug}-${label.replace(/\W/g,'-')}.png`),fullPage:true});}
  finally{await env?.context.close();}
  console.log(JSON.stringify(results.at(-1)));
 }
 const activate=async(page,selector,mode)=>{
  const el=page.locator(selector).first();
  if(mode==='touch')await el.tap();
  else{await el.focus();await page.keyboard.press('Space');}
 };
 for(const game of GAMES.filter(g=>g.group==='word'||['tradeoff','inbetween'].includes(g.slug))){
  if(process.env.INPUT_ONLY&&!process.env.INPUT_ONLY.split(',').includes(game.slug))continue;
  for(const mode of ['touch','keyboard'])await run(mode,game.slug,async page=>{
   const slug=game.slug;
   if(choices[slug]){
    const [selector,attribute,value]=choices[slug];await activate(page,selector,mode);
    assert.equal(await page.locator(selector).first().getAttribute(attribute),value);
   }else if(entries[slug]){
    const input=page.locator(entries[slug]);if(mode==='touch'){await input.tap();await page.keyboard.insertText('a');}else{await input.focus();await page.keyboard.type('a');}
    assert.equal((await input.inputValue()).toLowerCase(),'a');
    await page.keyboard.press('Backspace');assert.equal(await input.inputValue(),'');
   }else if(slug==='sideways'){
    await activate(page,'[data-rotate="0"][data-direction="1"]',mode);
    assert.equal(await page.locator('#shift-moves').textContent(),'1');
   }else if(slug==='kimi-cairn'){
    const button=page.locator('.cairn-rack button:not(:disabled)').first();
    const letter=(await button.textContent()).trim().toLowerCase();
    if(mode==='touch')await button.tap();else await page.keyboard.type(letter[0]);
    assert.equal(await page.getByRole('button',{name:/Remove letter .* from position 1/}).count(),1);
   }else if(slug==='kimi-morph'){
    await activate(page,'button[aria-label^="Edit letter"]',mode);
    await page.locator('.morph-letter-palette').waitFor();
    const option=page.locator('[data-morph-letter="z"]');
    if(mode==='touch')await option.tap();else await page.keyboard.press('z');
    assert.equal(await page.locator('.morph-letter-palette').count(),0);
    assert.equal(await page.getByRole('button',{name:/Edit letter z, position 1/i}).count(),1);
   }else if(slug==='kimi-hunch'){
    if(mode==='touch')await page.getByRole('button',{name:'Letter a',exact:true}).tap();else await page.keyboard.type('a');
    assert.equal(await page.locator('[data-active="true"] [data-hunch-cell="0"]').textContent(),'a');
   }else if(slug==='deepseek-cipher'){
    const tile=page.locator('[data-code]:not(:disabled)').first(),code=await tile.getAttribute('data-code');
    await activate(page,'[data-code]:not(:disabled)',mode);
    const letter=await page.locator('.cipher-key:not(.assigned)').first().getAttribute('data-letter');
    if(mode==='touch')await page.locator(`[data-letter="${letter}"]`).tap();else await page.keyboard.type(letter);
    assert.match(await page.locator(`[data-code="${code}"]`).first().getAttribute('aria-label'),new RegExp(`guess ${letter}`));
   }else if(slug==='deepseek-split'){
    const letter=await page.locator('[data-index="0"]').textContent();
    if(mode==='touch')await page.locator('[data-index="0"]').tap();else{await page.locator('#puzzle').focus();await page.keyboard.type(letter);}
    assert.equal(await page.locator('.split-slot.filled').count(),1);
   }else if(slug==='qwen-quadra'){
    const letter=await page.locator('[data-tile]').first().textContent();
    if(mode==='touch')await page.locator('[data-tile]').first().tap();else{await page.locator('#quadra-word').focus();await page.keyboard.type(letter.trim());}
    assert.equal((await page.locator('#quadra-word').inputValue()).toUpperCase(),letter.trim().toUpperCase());
   }else if(slug==='qwen-syntax-siege'){
    await activate(page,'#siege-start',mode);
    const letter=await page.locator('[data-letter]').first().textContent();
    if(mode==='touch')await page.locator('[data-letter]').first().tap();else await page.keyboard.type(letter.trim());
    assert.equal((await page.locator('.siege-word').textContent()).trim(),letter.trim());
   }else if(slug==='claude-sprout'){
    const letter=await page.locator('[data-source="word"]').first().textContent();
    if(mode==='touch')await page.locator('[data-source="word"]').first().tap();else{await page.locator('#sprout-entry').focus();await page.keyboard.type(letter);}
    assert.equal((await page.locator('#sprout-entry').inputValue()).toUpperCase(),letter.toUpperCase());
   }else throw Error('Missing input case');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal page overflow');
  });
 }
 if(!process.env.INPUT_ONLY||process.env.INPUT_ONLY.split(',').includes('second-sense')){
  for(const mode of ['touch','keyboard'])await run(`${mode}-word-submit`,'second-sense',async page=>{
   const pair=await page.evaluate(async()=>{
    const {PUZZLES}=await import('/games/second-sense/puzzles.mjs'),E=await import('/games/second-sense/engine.mjs');
    return E.getDaily(PUZZLES,new Date()).puzzle.pairs[0];
   });
   await activate(page,`[data-noun="${pair.nounId}"]`,mode);
   await activate(page,`[data-verb="${pair.verbId}"]`,mode);
   const field=page.locator('#answer-input');
   if(mode==='touch'){await field.tap();await page.keyboard.insertText(pair.word);await page.locator('#sense-check').tap();}
   else{await field.focus();await page.keyboard.type(pair.word);await page.keyboard.press('Enter');}
   assert.match(await page.locator('#sense-progress').textContent(),/1 of 5/);
  });
 }
 for(const slug of ['claude-keystone','claude-tumbler','claude-tangle']){
  if(process.env.INPUT_ONLY&&!process.env.INPUT_ONLY.split(',').includes(slug))continue;
  await run('native-enter-on-letter',slug,async page=>{
   if(slug==='claude-tangle'){
    await page.locator('[data-bead="0"]').focus();await page.keyboard.press('Enter');
    assert.equal(await page.locator('[data-bead="0"]').getAttribute('aria-pressed'),'true');
   }else{
    const prefix=slug.replace('claude-','');
    await page.locator(`[data-key="a"]`).focus();await page.keyboard.press('Enter');
    assert.equal(await page.locator(`#${prefix}-input`).inputValue(),'a');
    await page.keyboard.type('b');await page.keyboard.press('Backspace');
    assert.equal(await page.locator(`#${prefix}-input`).inputValue(),'a');
   }
  });
  await run('tap-type-submit',slug,async page=>{
   const plan=await page.evaluate(async slug=>{
    const {PUZZLES}=await import(`/games/${slug}/puzzles.mjs`),E=await import(`/games/${slug}/engine.mjs`);
    const record=JSON.parse(localStorage.getItem(`${slug}:v1:daily:2026-11-01`)),p=PUZZLES.find(p=>p.id===record.puzzleId);
    if(slug==='claude-tumbler')return {word:p.answer};
    if(slug==='claude-keystone')return {word:p.rounds[0].k};
    // Select a prepared word whose earliest matching suffix also leaves a
    // continuation. Duplicate-copy ambiguity remains part of this game's rules.
    for(const word of p.w)for(const first of [...p.s].map((_,i)=>i).filter(i=>p.s[i]===word[0])){
     let state=E.toggle(p,record.state,first).state;
     for(const letter of word.slice(1)){
      const after=Math.max(...state.selected),i=[...p.s].findIndex((c,i)=>i>after&&c===letter);
      if(i<0)break;state=E.toggle(p,state,i).state;
     }
     const result=E.submit(p,state);
     if(E.view(p,result.state).pulls.length===1)return {word,first};
    }
    throw Error('No prepared word supports this mixed-input fixture');
   },slug);
   const field=slug==='claude-tangle'?`[data-bead="${plan.first}"]`:`[data-key="${plan.word[0]}"]`;
   await page.locator(field).tap();await page.keyboard.type(plan.word.slice(1));await page.keyboard.press('Enter');
   const saved=await page.evaluate(slug=>JSON.parse(localStorage.getItem(`${slug}:v1:daily:2026-11-01`)).state,slug);
   if(slug==='claude-tumbler')assert.deepEqual(saved.guesses,[plan.word]);
   else if(slug==='claude-keystone')assert.equal(saved.awaitingNext,true);
   else assert.equal(saved.events.filter(event=>event.type==='pull').length,1);
   const before=JSON.stringify(saved);await page.reload();
   assert.equal(await page.evaluate(slug=>JSON.stringify(JSON.parse(localStorage.getItem(`${slug}:v1:daily:2026-11-01`)).state),slug),before);
  });
 }
 if(!process.env.INPUT_ONLY||process.env.INPUT_ONLY.includes('deepseek-twin-hive')){
  await run('tap-then-type','deepseek-twin-hive',async page=>{
   await page.locator('[data-letter="A"]').tap();await page.keyboard.type('im');
   assert.equal((await page.locator('#hive-word').inputValue()).toUpperCase(),'AIM');
   await page.keyboard.press('Backspace');assert.equal((await page.locator('#hive-word').inputValue()).toUpperCase(),'AI');
  });
  await run('mixed-entry-submit-and-selection','deepseek-twin-hive',async page=>{
   const word=await page.evaluate(async()=>{
    const {PUZZLES}=await import('/games/deepseek-twin-hive/puzzles.mjs');
    const raw=JSON.parse(localStorage.getItem('deepseek-twin-hive:v1:daily:2026-11-01'));
    return PUZZLES.find(p=>p.id===raw.puzzleId).answers[0];
   });
   await page.locator(`[data-letter="${word[0]}"]`).tap();await page.keyboard.type(word.slice(1));await page.keyboard.press('Enter');
   assert.match(await page.locator('.word-list').textContent(),new RegExp(word));
   await page.locator('#hive-word').fill('AB');
   await page.locator('#hive-word').evaluate(el=>el.setSelectionRange(0,1));
   await page.locator('[data-letter="A"]').tap();await page.keyboard.type('c');
   assert.equal((await page.locator('#hive-word').inputValue()).toUpperCase(),'ACB');
   await page.locator('#hive-clear').tap();
   await page.locator('[data-letter="A"]').focus();await page.keyboard.press('Enter');
   assert.equal(await page.locator('#hive-word').inputValue(),'A','Enter activates the focused tile');
   await page.locator('[data-letter="A"]').dispatchEvent('keydown',{key:'x',isComposing:true,bubbles:true});
   await page.locator('[data-letter="A"]').dispatchEvent('keydown',{key:'x',ctrlKey:true,bubbles:true});
   assert.equal(await page.locator('#hive-word').inputValue(),'A','Composition and shortcuts do not edit the word');
   await page.locator('#hive-word').fill('A'.repeat(24));
   await page.locator('#game-help').tap();await page.locator('#close-help').tap();
   await page.locator('[data-letter="A"]').tap();await page.keyboard.press('Backspace');
   assert.equal((await page.locator('#hive-word').inputValue()).length,23,'A full rack entry remains editable after a tap');
  });
  for(const width of [320,390,768,1200])await run(`layout-${width}`,'deepseek-twin-hive',async page=>{
   const metrics=await page.locator('.hive-rack .tile').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {w:r.width,h:r.height};}));
   for(const size of metrics){assert.ok(size.w>=44&&size.h>=44,'Usable touch targets');assert.ok(size.w/size.h>=.95&&size.w/size.h<=1.25,`Balanced hexagon proportions: ${JSON.stringify(size)}`);}
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.screenshot({path:path.join(out,`${engine}-hive-${width}.png`),fullPage:true});
  },width);
 }
 await browser.close();
}
await writeFile(path.join(out,'results.json'),JSON.stringify(results,null,2));
console.log(JSON.stringify({passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass).length}));
if(results.some(r=>!r.pass))process.exitCode=1;
