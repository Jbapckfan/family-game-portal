import {createSession} from '../../games/deepseek-runtime/core.mjs';
import {PUZZLES} from '../../games/claude-sprout/puzzles.mjs';
import * as E from '../../games/claude-sprout/engine.mjs';
export {E};
export function createPreviewSession(options={}) {
  const memory=new Map();
  const storage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value)};
  const session=createSession({id:'claude-sprout',name:'Sprout',puzzles:PUZZLES,createState:E.createExpandedState,restoreState:E.restoreState,getStatus:E.getStatus,hint:E.hint,reveal:E.reveal},{...options,storage});
  session.practice();
  return session;
}
