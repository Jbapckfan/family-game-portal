/** Conservative substantive identities for scheduling and bank audits.
 * Ignore IDs, clue/round order, display shuffles, and source-owned solution paths.
 * Sprout treats every seed in one final-letter ecosystem as the same content;
 * Tangle treats every weave of the same three target threads as the same content.
 */
export const claudePuzzleSignatures=Object.freeze({
  'claude-dovetail':p=>p.words.join('|'),
  'claude-splice':p=>p.parts.flat().sort().join('|'),
  'claude-sprout':p=>[...p.seed+p.pool].sort().join(''),
  'claude-tangle':p=>[...p.w].sort().join('|'),
  'claude-keystone':p=>p.rounds.map(r=>r.k+'|'+r.clues.map(c=>c.d+':'+c.w).sort().join(',')).sort().join(';'),
  'claude-tumbler':p=>p.answer,
});
export function claudePuzzleSignature(slug,puzzle){
  const signature=claudePuzzleSignatures[slug];
  if(!signature)throw new Error(`Unknown Claude puzzle family: ${slug}`);
  return signature(puzzle);
}
