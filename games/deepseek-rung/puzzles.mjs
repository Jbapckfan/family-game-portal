import {findRoute} from './engine.mjs';
// Thirty authored start/target challenges. Pars are calculated against the actual accepted lexicon.
const endpoints=[
 ['COLD','WARM'],['HEAD','TAIL'],['LOVE','HATE'],['WEST','EAST'],['DARK','LAMP'],
 ['DUSK','DAWN'],['SAND','SOIL'],['FIRE','RAIN'],['MIND','BODY'],['WORD','BOOK'],
 ['POOR','RICH'],['FAST','SLOW'],['HOME','AWAY'],['SAFE','WILD'],['HARD','SOFT'],
 ['GIVE','TAKE'],['LOST','FIND'],['WOLF','LAMB'],['FISH','BIRD'],['GAME','PLAY'],
 ['MOON','STAR'],['GOOD','FOUL'],['WORK','REST'],['LIFE','DEAD'],['BLUE','PINK'],
 ['TREE','LEAF'],['LEAD','GOLD'],['BEAR','LION'],['TIDE','WAVE'],['CATS','DOGS'],
];
export const PUZZLES=Object.freeze(endpoints.map(([start,target],index)=>{
 const route=findRoute(start,target);
 if(!route)throw new Error(`Disconnected authored ladder: ${start} to ${target}`);
 return Object.freeze({id:`rung-${String(index+1).padStart(2,'0')}`,start,target,par:route.length-1});
}));
