// Execute the page's real hint/roll functions in Node; no browser or audio.
import assert from 'node:assert/strict';
import vm from 'node:vm';

function source(html,name,optional=false) {
    const match=html.match(new RegExp(`^(?:async )?function ${name}\\([^\\n]*\\) (?:\\{[^\\n]*\\}|\\{[\\s\\S]*?^\\})`,'m'));
    if(!match && !optional)throw Error(`Missing game function ${name}`);
    return match?.[0] || '';
}

function harness(html,isAI,oneDie) {
    const elements=Object.fromEntries(['selection-info','btn-roll','btn-coach'].map(id=>[id,{innerHTML:'stale selection hint',style:{}}]));
    const pending=[],timers=[];
    const math=Object.create(Math);math.random=()=>.34;
    const context=vm.createContext({
        Math:math,
        document:{getElementById(id){assert.ok(elements[id],`Unexpected DOM access: ${id}`);return elements[id];}},
        STBTable:{throw(){return new Promise(resolve=>pending.push(resolve));},closing(){}},
        setTimeout(fn,ms){timers.push({fn,ms});},
        clearTurnTimer(){},startTurnTimer(){},ensureDiceInDOM(){},playDiceRattle(){},
        renderTiles(){},renderScoreboard(){},animateScoreFinalize(){},playErrorTone(){},
        setMessage(){},nextPlayer(){},getTileEl(){return null;},playTileClack(){},esc(value){return String(value);},
        pickBestCombo(combos){return combos[0];}
    });
    const variants=html.slice(html.indexOf('const VARIANTS ='),html.indexOf('const PLAYER_COLORS ='));
    vm.runInContext(`${variants}
        let players=[{name:'Player',isAI:${isAI},done:false,shutTiles:new Set(),turnStreak:0}];
        let currentPlayerIdx=0,phase='roll',rolling=false,autoConfirming=false,diceInFlight=false;
        let diceValues=[],diceTotal=0,speedMode=false,activeVariant='${oneDie?'traditional':'modern'}';
        let selectedTiles=new Set(),validTileSet=new Set(),recommendedTiles=new Set();
        const AI_DELAY=800;
    `,context);
    const names=['variantTileIds','tileValue','tileLabel','usesOneDie','sumOpen','getOpenTiles','findCombinations','computeValidTiles',
        'updateButtons','updateSelectionInfo','animateThrow','rollDice','afterRoll','aiRoll','autoConfirmSelection'];
    for(const name of names)vm.runInContext(source(html,name),context);
    vm.runInContext(source(html,'animateDicePresentation',true),context);
    if(oneDie)vm.runInContext('players[0].shutTiles=new Set(variantTileIds().filter(id=>id>3));',context);
    return {elements,pending,timers,context,run:code=>vm.runInContext(code,context)};
}

export async function validateHintPresentation(html) {
    for(const isAI of [false,true])for(const oneDie of [false,true]) {
        const h=harness(html,isAI,oneDie);
        const done=h.run(isAI?'aiRoll()':'rollDice()');
        assert.equal(h.pending.length,1,'roll must wait on its existing animation');
        assert.equal(h.run('diceValues.length'),oneDie?1:2);
        assert.equal(h.elements['selection-info'].innerHTML,'','starting any throw clears old hints');
        // A delayed UI refresh must not restore selection instructions mid-throw,
        // even if it observes a stale select phase.
        h.run("phase='select';rolling=false;updateSelectionInfo();");
        assert.equal(h.elements['selection-info'].innerHTML,'','in-flight dice suppress selection instructions');
        h.run(`phase='roll';rolling=${!isAI};`);
        h.pending.shift()();await done;
        h.run('updateSelectionInfo();');
        if(isAI)assert.equal(h.elements['selection-info'].innerHTML,'','AI never gets human tap instructions');
        else {
            assert.match(h.elements['selection-info'].innerHTML,/Tap tiles that add up to/);
            assert.ok(h.elements['selection-info'].innerHTML.includes(`>${oneDie?3:6}</span>`),'settled badge shows its logical total');
            h.run('diceTotal=0;updateSelectionInfo();');
            assert.equal(h.elements['selection-info'].innerHTML,'','an unavailable total never creates an empty badge');
        }
    }
    const h=harness(html,false,false);
    h.run("phase='select';diceValues=[1,2];diceTotal=3;selectedTiles=new Set([1,2]);");
    const closed=h.run('autoConfirmSelection()');
    assert.match(h.elements['selection-info'].innerHTML,/Closing/);
    h.timers.find(t=>t.ms===250).fn();
    h.timers.find(t=>t.ms===400).fn();await closed;
    assert.equal(h.run('phase'),'roll');
    assert.equal(h.elements['selection-info'].innerHTML,'','tile-close handoff clears its message before the next roll');
    const next=h.run('rollDice()');
    assert.equal(h.elements['selection-info'].innerHTML,'');
    h.pending.shift()();await next;
    assert.match(h.elements['selection-info'].innerHTML,/dice-total-badge">6<\/span>/);
    console.log('4 human/AI one/two-die hint paths and tile-close handoff passed');
}
