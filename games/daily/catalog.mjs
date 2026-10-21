/** The home is editorial metadata only. Game engines remain the source of truth. */
export const GAMES = Object.freeze([
  {slug: 'ringcount', name: 'Ringcount', group: 'flagship', category: 'Number logic',
    description: 'Four cuts. Four equal sums. Find the balance around the ring.',
    detail: 'A circle with a satisfying solution', motif: 'ring'},
  {slug: 'switchpath', name: 'Switchpath', group: 'flagship', category: 'Path logic',
    description: 'Go higher, then lower. Follow one alternating path through every number.',
    detail: 'Every turn changes your thinking', motif: 'path'},
  {slug: 'counterpart', name: 'Counterpart', group: 'word', category: 'Word relationships',
    description: 'Read the relationship. Find the pair that follows the same logic.',
    detail: 'Make the right connection', motif: 'pairs'},
  {slug: 'shortlist', name: 'Shortlist', group: 'word', category: 'Letter deduction',
    description: 'Twelve words. Three letter scans. One final pick.',
    detail: 'Make every clue count', motif: 'scan'},
  {slug: 'second-sense', name: 'Second Sense', group: 'word', category: 'Double meanings',
    description: 'Match a noun clue with a verb clue. One word answers both.',
    detail: 'Same word. Another meaning.', motif: 'sense'},
  {slug: 'sideways', name: 'Sideways', group: 'word', category: 'Word arrangement',
    description: 'Slide the letter strips until four clued words read down the columns.',
    detail: 'A different angle on words', motif: 'strips'},
  {slug: 'tradeoff', name: 'Tradeoff', group: 'classic', category: 'Letter swaps',
    description: 'Trade letters between rows to make every clue fit.', motif: 'trade'},
  {slug: 'inbetween', name: 'Inbetween', group: 'classic', category: 'Word building',
    description: 'Find where two missing letters belong. Build the bigger word.', motif: 'insert'},
  {slug: 'kimi-cairn', name: 'Cairn', creator: 'Kimi', runtime: 'kimi', group: 'word', category: 'Growing anagrams',
    description: 'Build a five-word tower. Every new level adds just one letter.', detail: 'Five steps to the summit', motif: 'cairn', boards: 839},
  {slug: 'kimi-morph', name: 'Morph', creator: 'Kimi', runtime: 'kimi', group: 'word', category: 'Word ladders',
    description: 'Change one letter at a time. Find your way from the start word to its target.', detail: 'Every rung is a real word', motif: 'morph', boards: 450},
  {slug: 'kimi-tangle', name: 'Tangle', creator: 'Kimi', runtime: 'kimi', group: 'word', category: 'Word trails',
    description: 'Trace words through a field of letters. Keep finding paths until you reach gold.', detail: 'A board full of possibilities', motif: 'tangle', boards: 430},
  {slug: 'kimi-hunch', name: 'Hunch', creator: 'Kimi', runtime: 'kimi', group: 'word', category: 'Five-letter deduction',
    description: 'Six guesses. Follow the letter clues to discover the hidden five-letter word.', detail: 'Trust a hunch. Test it.', motif: 'hunch', boards: 937},
  {slug: 'kimi-circuit', name: 'Circuit', creator: 'Kimi', runtime: 'kimi', group: 'word', category: 'Word chains',
    description: 'Connect words around four arcs. Change arcs with each letter and cover the whole circuit.', detail: 'Make every letter part of the chain', motif: 'circuit', boards: 286},
  {slug: 'kimi-quartet', name: 'Quartet', creator: 'Kimi', runtime: 'kimi', group: 'word', category: 'Meaning & categories',
    description: 'Sixteen words belong in four groups. Find the common thread in each quartet.', detail: 'Four groups. Four discoveries.', motif: 'quartet', boards: 420},
  {"slug": "deepseek-twin-hive", "name": "Twin Hive", "creator": "DeepSeek", "credit": "Concept by DeepSeek · Built by ChatGPT", "runtime": "deepseek", "group": "word", "category": "Two-letter word search", "description": "Every word needs both golden letters. Build your daily collection.", "detail": "Two anchors. Many possibilities.", "motif": "hive", "boards": 30},
  {"slug": "deepseek-spare", "name": "Spare", "creator": "DeepSeek", "credit": "Concept by DeepSeek · Built by ChatGPT", "runtime": "deepseek", "group": "word", "category": "Meaning pairs", "description": "Match four pairs of opposites. Find the one word left over.", "detail": "Four pairs. One spare.", "motif": "spare", "boards": 30},
  {"slug": "deepseek-rung", "name": "Rung", "creator": "DeepSeek", "credit": "Concept by DeepSeek · Built by ChatGPT", "runtime": "deepseek", "group": "word", "category": "Shortest word ladders", "description": "Change one letter at a time and reach the target in as few steps as possible.", "detail": "Find the elegant route", "motif": "morph", "boards": 30},
  {"slug": "deepseek-cipher", "name": "Cipher", "creator": "DeepSeek", "credit": "Concept by DeepSeek · Built by ChatGPT", "runtime": "deepseek", "group": "word", "category": "Secret alphabets", "description": "One letter stands for another. Uncover a hidden phrase.", "detail": "A message waiting to emerge", "motif": "cipher", "boards": 30},
  {"slug": "deepseek-trail", "name": "Trail", "creator": "DeepSeek", "credit": "Concept by DeepSeek · Built by ChatGPT", "runtime": "deepseek", "group": "word", "category": "Nine-letter trails", "description": "Follow adjacent letters through a tiny grid to find one long word.", "detail": "A winding route to an aha", "motif": "trail", "boards": 30},
  {"slug": "deepseek-split", "name": "Split", "creator": "DeepSeek", "credit": "Concept by DeepSeek · Built by ChatGPT", "runtime": "deepseek", "group": "word", "category": "Clued anagrams", "description": "Divide ten letters between two clues. Every tile has a home.", "detail": "Two discoveries in one handful", "motif": "split", "boards": 30},
  {"slug": "qwen-quadra", "name": "Quadra", "creator": "Qwen", "credit": "Developed by Qwen", "runtime": "qwen", "group": "word", "category": "Category anagrams", "description": "Sixteen letters. Four words in one category. Use every tile exactly once.", "detail": "Find the four that belong", "motif": "quadra", "boards": 30},
  {"slug": "qwen-logic-lattice", "name": "Logic Lattice", "creator": "Qwen", "credit": "Concept by Qwen · Built by ChatGPT", "runtime": "qwen", "group": "logic", "category": "Grid deduction", "description": "Fill the grid until every counting clue agrees.", "detail": "Make every square make sense", "motif": "lattice", "boards": 30},
  {"slug": "qwen-syntax-siege", "name": "Syntax Siege", "creator": "Qwen", "credit": "Concept by Qwen · Built by ChatGPT", "runtime": "qwen", "group": "word", "category": "Word defense", "description": "Turn letters into words before the next wave reaches your core.", "detail": "Quick words. A strong defense.", "motif": "siege", "boards": 30},
  {"slug": "qwen-memory-maze", "name": "Memory Maze", "creator": "Qwen", "credit": "Concept by Qwen · Built by ChatGPT", "runtime": "qwen", "group": "logic", "category": "Path recall", "description": "Study the glowing route, then retrace it from memory.", "detail": "See the path. Keep the pattern.", "motif": "maze", "boards": 30},
  {"slug": "qwen-pattern-prism", "name": "Pattern Prism", "creator": "Qwen", "credit": "Concept by Qwen · Built by ChatGPT", "runtime": "qwen", "group": "logic", "category": "Visual sequences", "description": "Find how the shapes change. Predict the next three steps.", "detail": "Spot the rhythm in the pattern", "motif": "prism", "boards": 30},
  {"slug": "qwen-territory-tactics", "name": "Territory Tactics", "creator": "Qwen", "credit": "Concept by Qwen · Built by ChatGPT", "runtime": "qwen", "group": "logic", "category": "Hex strategy", "description": "Place two stones to surround and capture the target group.", "detail": "A small board. A clever move.", "motif": "territory", "boards": 30},
  {"slug": "claude-dovetail", "name": "Dovetail", "creator": "Claude", "credit": "Developed by Claude", "runtime": "claude", "group": "word", "category": "Compound chains", "description": "Fill the missing words. Each word joins the next to make another.", "detail": "Find every link in the chain", "motif": "dovetail", "boards": 77},
  {"slug": "claude-splice", "name": "Splice", "creator": "Claude", "credit": "Developed by Claude", "runtime": "claude", "group": "word", "category": "Word-half matching", "description": "Pair twelve word halves into six words. Every piece belongs somewhere.", "detail": "Match the halves. Find the fit.", "motif": "splice", "boards": 73},
  {"slug": "claude-sprout", "name": "Sprout", "creator": "Claude", "credit": "Developed by Claude", "runtime": "claude", "group": "word", "category": "Growing anagrams", "description": "Add one letter and rearrange. Grow a small seed into an eight-letter bloom.", "detail": "Choose a path that keeps growing", "motif": "cairn", "boards": 128},
  {"slug": "claude-tangle", "name": "Tangle", "creator": "Claude", "credit": "Developed by Claude", "runtime": "claude", "group": "word", "category": "Interleaved words", "description": "Three words share one string. Untangle them without changing their letter order.", "detail": "Keep the order. Find the threads.", "motif": "weave", "boards": 160},
  {"slug": "claude-keystone", "name": "Keystone", "creator": "Claude", "credit": "Developed by Claude", "runtime": "claude", "group": "word", "category": "Compound-word clues", "description": "One hidden word joins every clue. Find the link across three arches.", "detail": "The word that holds it together", "motif": "keystone", "boards": 58},
  {"slug": "claude-tumbler", "name": "Tumbler", "creator": "Claude", "credit": "Developed by Claude", "runtime": "claude", "group": "word", "category": "Alphabet deduction", "description": "Each dial points earlier or later in the alphabet. Crack the five-letter lock.", "detail": "Read the ranges. Turn the lock.", "motif": "tumbler", "boards": 1054},
].map(game => Object.freeze({creator: 'ChatGPT', runtime: 'alford', ...game})));

export const CREATORS = Object.freeze(['ChatGPT', 'Kimi', 'DeepSeek', 'Qwen', 'Claude']);
export function filterGames(creator = 'All') { return GAMES.filter(game => creator === 'All' || game.creator === creator); }


export const LAUNCH_GAMES = GAMES;

/** Resolve from the HTML location so the same home works at / or /games/daily/. */
export function gameURL(slug, base, documentURL) {
  return new URL(`${slug}/`, new URL(base || './games/', documentURL)).href;
}

const svg = (content, viewBox = '0 0 340 220') => `<svg viewBox="${viewBox}" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${content}</svg>`;
const label = (x, y, value, more = '') => `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" ${more}>${value}</text>`;

function ring() {
  const numbers = [3, 7, 5, 4, 8, 6, 2, 9, 1, 5, 6, 4];
  const pieces = numbers.map((n, i) => {
    const angle = (i * 30 - 90) * Math.PI / 180;
    const x = 170 + Math.cos(angle) * 82;
    const y = 110 + Math.sin(angle) * 82;
    return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="16" class="motif-tile"/>${label(x.toFixed(2), y.toFixed(2), n)}`;
  }).join('');
  return svg(`<circle cx="170" cy="110" r="82" class="ring-track"/><circle cx="170" cy="110" r="53" class="ring-inner"/>${pieces}<path d="M213 35l11-19M244 153l19 11M127 185l-11 19M96 67L77 56" class="ring-cuts"/>${label(170, 103, '4', 'class="ring-four"')}${label(170, 126, 'EQUAL ARCS', 'class="ring-label"')}`);
}

function path() {
  const values = [3, 12, 5, 14, 11, 7, 16, 2, 6, 15, 4, 10, 13, 1, 9, 8];
  const selected = [0, 1, 5, 4, 8, 9];
  const positions = i => ({x: 103 + (i % 4) * 45, y: 43 + Math.floor(i / 4) * 45});
  const cells = values.map((value, i) => {
    const {x, y} = positions(i);
    return `<rect x="${x - 19}" y="${y - 19}" width="38" height="38" rx="8" class="path-cell ${selected.includes(i) ? 'path-selected' : ''}"/>`;
  }).join('');
  const points = selected.map(i => {const {x, y} = positions(i); return `${x},${y}`;}).join(' ');
  const labels = values.map((value, i) => {const {x, y} = positions(i); return label(x, y, value);}).join('');
  return svg(`${cells}<polyline points="${points}" class="path-trail"/>${labels}<path d="M50 72v-25m-7 7 7-7 7 7M290 147v25m-7-7 7 7 7-7" class="path-arrows"/>`);
}

export function motif(type) {
  if(type==='dovetail')return svg(['SHOT','GUN','FIRE','WALL'].map((w,i)=>`<rect x="${20+i%2*10}" y="${10+i*32}" width="100" height="26" rx="5" class="motif-tile"/>${label(70+i%2*10,23+i*32,w,'class="motif-small"')}`).join(''),'0 0 150 145');
  if(type==='splice')return svg([['SUN','SET'],['RAIN','BOW'],['SEA','SIDE']].map((a,i)=>`<rect x="12" y="${18+i*38}" width="60" height="30" rx="6" class="motif-tile"/><rect x="78" y="${18+i*38}" width="60" height="30" rx="6" class="motif-tile"/>${label(42,33+i*38,a[0],'class="motif-small"')}${label(108,33+i*38,a[1],'class="motif-small"')}`).join(''),'0 0 150 140');
  if(type==='weave')return svg(`<path d="M13 30C58 30 92 110 137 110M13 70h124M13 110C58 110 92 30 137 30" class="motif-line"/>${[[20,30,'A'],[75,70,'B'],[130,30,'C']].map(([x,y,l])=>`<circle cx="${x}" cy="${y}" r="16" class="motif-tile"/>${label(x,y,l,'class="motif-small"')}`).join('')}`,'0 0 150 140');
  if(type==='keystone')return svg(`<path d="M30 120V70a45 45 0 0 1 90 0v50M52 120V70a23 23 0 0 1 46 0v50" class="motif-line"/><path d="M57 16h36l-6 37H63Z" class="motif-tile"/>${label(75,34,'?')}<path d="M24 85h32m38 0h32M38 39l22 23m52-23L90 62" class="motif-line"/>`,'0 0 150 140');
  if(type==='tumbler')return svg(`${[0,1,2,3,4].map(i=>`<rect x="${8+i*28}" y="40" width="23" height="52" rx="7" class="motif-tile"/>${label(19.5+i*28,65,'LOCKS'[i],'class="motif-small"')}`).join('')}<path d="M19 28v-12m-5 5 5-5 5 5M75 104v12m-5-5 5 5 5-5M131 28v-12m-5 5 5-5 5 5" class="motif-line"/>`,'0 0 150 140');
  if (type === 'hive') return svg([[46,37,'A'],[96,37,'T'],[21,80,'R'],[71,80,'E'],[121,80,'S'],[46,123,'C'],[96,123,'I']].map(([x,y,l],i)=>`<path d="M${x} ${y-22}l19 11v22l-19 11-19-11v-22Z" class="motif-tile ${i<2?'scan-focus':''}"/>${label(x,y,l,'class="motif-small"')}`).join(''),'0 0 150 150');
  if (type === 'spare') return svg(`<path d="M42 39h64M42 83h64" class="motif-line"/>${[[34,39,'↗'],[116,39,'↙'],[34,83,'+'],[116,83,'−'],[75,119,'?']].map(([x,y,l])=>`<circle cx="${x}" cy="${y}" r="18" class="motif-tile"/>${label(x,y,l)}`).join('')}`,'0 0 150 145');
  if (type === 'cipher') return svg(`${['X Q M','A H A'].map((w,i)=>`<rect x="20" y="${20+i*72}" width="110" height="32" rx="8" class="motif-tile"/>${label(75,36+i*72,w,'class="motif-small"')}`).join('')}<path d="M75 60v24m-6-6 6 6 6-6" class="motif-line"/>`,'0 0 150 140');
  if (type === 'trail' || type === 'maze' || type === 'lattice') {
    const indices=type==='lattice'?[0,2,4,5,8]:[6,3,0,1,4,7,8,5,2];
    const cells=Array.from({length:9},(_,i)=>`<rect x="${21+i%3*38}" y="${15+Math.floor(i/3)*38}" width="32" height="32" rx="7" class="motif-tile ${type==='lattice'&&indices.includes(i)?'scan-focus':''}"/>`).join('');
    const points=indices.map(i=>`${37+i%3*38},${31+Math.floor(i/3)*38}`).join(' ');
    return svg(`${cells}${type!=='lattice'?`<polyline points="${points}" class="path-trail"/>`:''}${type==='trail'?[...'CELEBRATE'].map((l,i)=>label(37+i%3*38,31+Math.floor(i/3)*38,l,'class="motif-small"')).join(''):''}`,'0 0 150 140');
  }
  if (type === 'split' || type === 'quadra') return svg(Array.from({length:type==='quadra'?16:10},(_,i)=>{const columns=type==='quadra'?4:5,x=15+i%columns*(120/columns),y=type==='quadra'?15+Math.floor(i/columns)*30:40+Math.floor(i/columns)*40;return `<rect x="${x}" y="${y}" width="${120/columns-5}" height="25" rx="5" class="motif-tile"/>${label(x+(120/columns-5)/2,y+13,(type==='quadra'?'RAINWINDHAILSNOW':'EARTHWATER')[i],'class="motif-small"')}`;}).join(''),'0 0 150 140');
  if (type === 'siege') return svg(`<path d="M28 119V79h18V64h19v15h20V64h19v15h18v40Z" class="motif-tile"/><path d="M75 60V29m-7 8 7-8 7 8" class="motif-line"/>${label(75,101,'WORD','class="motif-small"')}<circle cx="29" cy="28" r="12" class="motif-tile"/><circle cx="121" cy="41" r="12" class="motif-tile"/>`,'0 0 150 140');
  if (type === 'prism') return svg(`<circle cx="29" cy="41" r="15" class="motif-tile"/><rect x="60" y="26" width="30" height="30" rx="3" class="motif-tile"/><path d="M122 22l18 35h-36Z" class="motif-tile"/><path d="M25 78h100m-6-6 6 6-6 6" class="motif-line"/>${label(75,111,'?  ?  ?')}`,'0 0 150 140');
  if (type === 'territory') return svg([[75,24],[42,43],[108,43],[75,62],[42,81],[108,81],[75,100]].map(([x,y],i)=>`<path d="M${x} ${y-21}l18 10v21l-18 10-18-10v-21Z" class="motif-tile"/><circle cx="${x}" cy="${y}" r="${i===3?10:6}" class="territory-dot ${i===3?'territory-target':''}"/>`).join(''),'0 0 150 140');
  if (type === 'cairn') return svg([['A T E',43,90],['L A T E',32,57],['P L A T E',20,24]].map(([text,x,y]) => `<rect x="${x}" y="${y}" width="${150-2*x}" height="27" rx="8" class="motif-tile"/>${label(75,y+14,text,'class="motif-small"')}`).join(''), '0 0 150 140');
  if (type === 'morph') return svg(`<path d="M29 21v98M121 21v98" class="motif-line"/>${['C O L D','C O R D','W O R D'].map((word,i)=>`<rect x="22" y="${20+i*38}" width="106" height="28" rx="7" class="motif-tile"/>${label(75,34+i*38,word,'class="motif-small"')}`).join('')}`, '0 0 150 140');
  if (type === 'tangle' || type === 'hunch' || type === 'quartet') {
    const letters = type === 'tangle' ? 'TRACELINEROUT' : type === 'hunch' ? 'HUNCHGUESSYES' : 'FOURWORDSETS';
    return svg(Array.from({length:12},(_,i)=>{const x=22+i%4*28,y=24+Math.floor(i/4)*33;return `<rect x="${x}" y="${y}" width="24" height="27" rx="6" class="motif-tile"/>${label(x+12,y+14,letters[i],'class="motif-small"')}`}).join(''), '0 0 150 140');
  }
  if (type === 'circuit') return svg(`<circle cx="75" cy="70" r="46" class="ring-track"/>${[...'CIRCUIT'].map((l,i)=>{const a=(i*360/7-90)*Math.PI/180,x=75+Math.cos(a)*46,y=70+Math.sin(a)*46;return `<circle cx="${x}" cy="${y}" r="13" class="motif-tile"/>${label(x,y,l,'class="motif-small"')}`}).join('')}`, '0 0 150 140');
  if (type === 'ring') return ring();
  if (type === 'path') return path();
  if (type === 'pairs') return svg(`<rect x="18" y="21" width="49" height="40" rx="9" class="motif-tile"/><rect x="83" y="21" width="49" height="40" rx="9" class="motif-tile"/><rect x="18" y="80" width="49" height="40" rx="9" class="motif-tile"/><rect x="83" y="80" width="49" height="40" rx="9" class="motif-tile"/><path d="M67 41h16M67 100h16" class="motif-line"/>${label(42, 41, 'A')}${label(108, 41, 'B')}${label(42, 100, 'C')}${label(108, 100, '?')}`, '0 0 150 140');
  if (type === 'scan') return svg(`<rect x="22" y="16" width="106" height="27" rx="7" class="motif-tile"/><rect x="22" y="56" width="106" height="27" rx="7" class="motif-tile scan-focus"/><rect x="22" y="96" width="106" height="27" rx="7" class="motif-tile"/>${label(75, 30, '12 → 6', 'class="motif-small"')}${label(75, 70, '6 → 3', 'class="motif-small"')}${label(75, 110, '3 → 1', 'class="motif-small"')}`, '0 0 150 140');
  if (type === 'sense') return svg(`<path d="M24 26h68a14 14 0 0 1 14 14v32a14 14 0 0 1-14 14H64L43 103V86H24a14 14 0 0 1-14-14V40a14 14 0 0 1 14-14Z" class="sense-back"/><path d="M54 55h68a14 14 0 0 1 14 14v32a14 14 0 0 1-14 14h-19v17l-21-17H54a14 14 0 0 1-14-14V69a14 14 0 0 1 14-14Z" class="motif-tile"/>${label(56, 48, 'noun', 'class="sense-word"')}${label(89, 85, 'verb', 'class="sense-word"')}`, '0 0 150 140');
  if (type === 'strips') return svg(`<rect x="17" y="22" width="114" height="27" rx="6" class="motif-tile"/><rect x="29" y="58" width="114" height="27" rx="6" class="motif-tile"/><rect x="7" y="94" width="114" height="27" rx="6" class="motif-tile"/>${label(74, 36, 'A  B  C  D', 'class="motif-small"')}${label(86, 72, 'G  H  E  F', 'class="motif-small"')}${label(64, 108, 'L  I  J  K', 'class="motif-small"')}<path d="M8 72H1m6-5-5 5 5 5M138 108h10m-5-5 5 5-5 5" class="motif-line"/>`, '0 0 150 140');
  if (type === 'trade') return svg(`<rect x="9" y="13" width="37" height="37" rx="8" class="motif-tile"/><rect x="34" y="44" width="37" height="37" rx="8" class="motif-tile"/>${label(27, 32, 'A')}${label(53, 63, 'B')}<path d="M53 19h13v13m-5-5 5 5 5-5M27 75H14V62m-5 5 5-5 5 5" class="motif-line"/>`, '0 0 80 94');
  return svg(`<rect x="8" y="27" width="27" height="37" rx="6" class="motif-tile"/><rect x="45" y="27" width="27" height="37" rx="6" class="motif-tile"/>${label(21, 46, 'A')}${label(58, 46, 'B')}<path d="M40 14v17m-5-5 5 5 5-5M40 76V59m-5 5 5-5 5 5" class="motif-line"/>`, '0 0 80 94');
}
