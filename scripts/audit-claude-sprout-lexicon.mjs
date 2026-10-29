#!/usr/bin/env node
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {COMMON} from '../games/claude-keystone/puzzles.mjs';
import {PUZZLES} from '../games/claude-sprout/puzzles.mjs';
import * as E from '../games/claude-sprout/engine.mjs';

const editorial=JSON.parse(await readFile(new URL('./claude-sprout-editorial-exclusions.json',import.meta.url),'utf8'));
export const sproutNewContentExclusions=new Set(Object.values(editorial).filter(Array.isArray).flat());

/** Visit each genuinely reachable accepted word state, then check every COMMON
 * word that conserves its letters and adds exactly one available soil letter.
 * Each current word determines the remaining multiset, so revisiting it along
 * another anagram path cannot reveal a different legal next-word transition.
 */
export function auditSproutLexicon(puzzles=PUZZLES){
  const byLength=new Map();
  for(const word of COMMON)if(/^[a-z]{4,8}$/.test(word)){
    if(!byLength.has(word.length))byLength.set(word.length,[]);
    byLength.get(word.length).push(word);
  }
  const omissions=[],excluded=[],affected=new Set(),words=new Set();
  let reachableStates=0,legalTransitions=0;
  for(const p of puzzles){
    const isNew=Number(p.id.split('-').at(-1))>128;
    let states=[{word:p.seed,state:E.createState(p),path:[p.seed]}];
    for(let n=4;n<=8;n++){
      const next=new Map(),listed=new Set([...p.levels[n].a,...p.levels[n].d]);
      for(const {word,state,path} of states){
        reachableStates++;
        const a=E.analyze(p,state),remaining=[...p.pool].filter((_,i)=>!a.soilUsed.includes(i));
        for(const candidate of byLength.get(n)||[]){
          const added=E.extraLetter(word,candidate);
          if(added===null||!remaining.includes(added))continue;
          legalTransitions++;
          if(isNew&&sproutNewContentExclusions.has(candidate)){
            excluded.push({puzzleId:p.id,path,candidate});
            continue;
          }
          if(listed.has(candidate))continue;
          const rest=[...remaining];rest.splice(rest.indexOf(added),1);
          const tail=E.findRoute(p,candidate,rest),selection=E.selectWord(p,state,candidate);
          const result=selection.state?E.submitWord(p,selection.state):null;
          omissions.push({puzzleId:p.id,path,candidate,continuation:tail,selectable:!!selection.state,message:result?.message??selection.message});
          affected.add(p.id);words.add(candidate);
        }
        for(const candidate of p.levels[n].a){
          const result=E.submitWord(p,state,candidate);
          if(result.state.events.length>state.events.length&&E.analyze(p,result.state).stack.at(-1)===candidate){
            next.set(candidate,{word:candidate,state:result.state,path:[...path,candidate]});
          }
        }
      }
      states=[...next.values()];
    }
  }
  return {
    records:puzzles.length,reachableStates,legalTransitions,
    omittedTransitions:omissions.length,distinctOmittedWords:words.size,
    affectedRecords:affected.size,viableOmissions:omissions.filter(r=>r.continuation).length,
    excludedTransitions:excluded.length,distinctExcludedWords:[...new Set(excluded.map(r=>r.candidate))].sort(),
    examples:omissions.slice(0,20),
  };
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  console.log(JSON.stringify(auditSproutLexicon(),null,2));
}
