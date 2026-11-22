// Pure renderer invariants. No browser, server, audio or gameplay mutations.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { validateHintPresentation } from './validate-hints.mjs';
const require = createRequire(import.meta.url);
globalThis.THREE = require('./vendor/three.min.js');
const { faceQuaternion, topFace, stepDie, separateDice, rollingBounds } = require('./physics.js');
let checks = 0;
for (let value = 1; value <= 6; value++) {
    for (let i = 0; i < 24; i++) {
        const q = faceQuaternion(value, i * Math.PI / 12);
        assert.equal(topFace(q), value, `logical ${value} must face up at yaw ${i}`); checks++;
    }
}
for (const hz of [30, 60, 120]) {
    const body = { x: 0, y: 2, z: 2, vx: 14, vy: 4, vz: -12, bounces: 0, walls: 0 };
    for (let i = 0; i < hz * 2; i++) stepDie(body, 1 / hz, { x: 5, zMin: -3, zMax: 3, floor: .5 });
    assert.ok(Math.abs(body.x) <= 5 && body.z >= -3 && body.z <= 3 && body.y >= .5);
    assert.ok(body.bounces > 0 && body.walls > 0, 'throw must contact felt and walls');
    if (hz === 30) globalThis.reference = { ...body };
    else assert.ok(Math.hypot(body.x-reference.x, body.y-reference.y, body.z-reference.z) < .001, 'time-based integration must agree at 30/60/120 Hz');
    checks += 3;
}
console.log(`${checks} dice orientation, collision and refresh-rate checks passed`);
for(const distance of [0,.1,.8,1.11]) {
    const a={x:0,y:.65,z:0,vx:1,vz:0},b={x:distance,y:.65,z:0,vx:-1,vz:0};
    separateDice(a,b);
    assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>=1.11999,'dice must separate even when coincident');
}
console.log('4 die-to-die contact checks passed');
// The complete tumbling cube must clear the farthest edge of a shut tile.
let bedChecks=0;
for(const [depth,twoBanks] of [[6.8,false],[8.1,false],[9.2,true],[17,false],[17,true]]) {
    const bounds=rollingBounds(14,depth,twoBanks),radius=Math.sqrt(3)*.46;
    assert.ok(bounds.zMin<=bounds.zMax,'felt corridor must remain usable');
    assert.ok(bounds.zMin-radius > -depth/2+1.95+1.67,'die clears folded back bank');
    if(twoBanks)assert.ok(bounds.zMax+radius < depth/2-1.95-1.67,'die clears folded front bank');
    for(const hz of [30,60,120]) {
        const body={x:0,y:2,z:bounds.zMax,vx:14,vy:4,vz:-12,bounces:0,walls:0};
        for(let n=0;n<hz*2;n++) {
            stepDie(body,1/hz,bounds);
            assert.ok(Math.abs(body.x)<=bounds.x && body.z>=bounds.zMin && body.z<=bounds.zMax,'throw stays inside felt corridor');
        }
        bedChecks++;
    }
}
console.log(`${bedChecks} felt corridor/refresh-rate trajectories passed`);
const current = readFileSync(new URL('../shut-the-box.html',import.meta.url),'utf8');
const previous = execFileSync('git',['show',(process.env.STB_BASE||'origin/main')+':games/shut-the-box.html'],{encoding:'utf8'}); // compare with the published game, not HEAD, so the check still means something after commit
const unchanged = ['sumOpen','getOpenTiles','findCombinations','computeValidTiles','usesOneDie','tileValue','tileLabel','futureRollCoverage','rankStrategicCombo','pickBestCombo','recordChampionship','recordGameStats'];
for (const name of unchanged) {
    const pattern = new RegExp('^function '+name+'\\([^\\n]*\\)(?: \\{[^\\n]*\\}| \\{[\\s\\S]*?^\\})','m');
    assert.equal(current.match(pattern)?.[0],previous.match(pattern)?.[0],`${name}: rules, scoring and AI must remain unchanged`);
    assert.ok(current.match(pattern),`${name} must be found`);
}
for (const name of ['rollDice','aiRoll']) {
    const start = current.indexOf('async function '+name+'(');
    const logic = current.slice(start,current.indexOf('    ensureDiceInDOM();',start));
    const oldStart = previous.indexOf('async function '+name+'(');
    assert.equal(logic,previous.slice(oldStart,previous.indexOf('    ensureDiceInDOM();',oldStart)),`${name} must decide values before animation exactly as before`);
}
console.log(`${unchanged.length} rule/score/AI functions and both roll-decision blocks match ${process.env.STB_BASE||'origin/main'}`);
await validateHintPresentation(current);
