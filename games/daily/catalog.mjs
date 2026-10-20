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
].map(game => Object.freeze(game)));

export const LAUNCH_GAMES = Object.freeze(GAMES.filter(game => game.group !== 'classic'));

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
  if (type === 'ring') return ring();
  if (type === 'path') return path();
  if (type === 'pairs') return svg(`<rect x="18" y="21" width="49" height="40" rx="9" class="motif-tile"/><rect x="83" y="21" width="49" height="40" rx="9" class="motif-tile"/><rect x="18" y="80" width="49" height="40" rx="9" class="motif-tile"/><rect x="83" y="80" width="49" height="40" rx="9" class="motif-tile"/><path d="M67 41h16M67 100h16" class="motif-line"/>${label(42, 41, 'A')}${label(108, 41, 'B')}${label(42, 100, 'C')}${label(108, 100, '?')}`, '0 0 150 140');
  if (type === 'scan') return svg(`<rect x="22" y="16" width="106" height="27" rx="7" class="motif-tile"/><rect x="22" y="56" width="106" height="27" rx="7" class="motif-tile scan-focus"/><rect x="22" y="96" width="106" height="27" rx="7" class="motif-tile"/>${label(75, 30, '12 → 6', 'class="motif-small"')}${label(75, 70, '6 → 3', 'class="motif-small"')}${label(75, 110, '3 → 1', 'class="motif-small"')}`, '0 0 150 140');
  if (type === 'sense') return svg(`<path d="M24 26h68a14 14 0 0 1 14 14v32a14 14 0 0 1-14 14H64L43 103V86H24a14 14 0 0 1-14-14V40a14 14 0 0 1 14-14Z" class="sense-back"/><path d="M54 55h68a14 14 0 0 1 14 14v32a14 14 0 0 1-14 14h-19v17l-21-17H54a14 14 0 0 1-14-14V69a14 14 0 0 1 14-14Z" class="motif-tile"/>${label(56, 48, 'noun', 'class="sense-word"')}${label(89, 85, 'verb', 'class="sense-word"')}`, '0 0 150 140');
  if (type === 'strips') return svg(`<rect x="17" y="22" width="114" height="27" rx="6" class="motif-tile"/><rect x="29" y="58" width="114" height="27" rx="6" class="motif-tile"/><rect x="7" y="94" width="114" height="27" rx="6" class="motif-tile"/>${label(74, 36, 'A  B  C  D', 'class="motif-small"')}${label(86, 72, 'G  H  E  F', 'class="motif-small"')}${label(64, 108, 'L  I  J  K', 'class="motif-small"')}<path d="M8 72H1m6-5-5 5 5 5M138 108h10m-5-5 5 5-5 5" class="motif-line"/>`, '0 0 150 140');
  if (type === 'trade') return svg(`<rect x="9" y="13" width="37" height="37" rx="8" class="motif-tile"/><rect x="34" y="44" width="37" height="37" rx="8" class="motif-tile"/>${label(27, 32, 'A')}${label(53, 63, 'B')}<path d="M53 19h13v13m-5-5 5 5 5-5M27 75H14V62m-5 5 5-5 5 5" class="motif-line"/>`, '0 0 80 94');
  return svg(`<rect x="8" y="27" width="27" height="37" rx="6" class="motif-tile"/><rect x="45" y="27" width="27" height="37" rx="6" class="motif-tile"/>${label(21, 46, 'A')}${label(58, 46, 'B')}<path d="M40 14v17m-5-5 5 5 5-5M40 76V59m-5 5 5-5 5 5" class="motif-line"/>`, '0 0 80 94');
}
