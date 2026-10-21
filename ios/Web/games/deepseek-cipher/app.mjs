import { mountDailyGame, escapeHTML as esc } from '../deepseek-runtime/common.mjs';
import { PUZZLES } from './puzzles.mjs';
import * as E from './engine.mjs';

mountDailyGame({
  id: 'deepseek-cipher', name: 'Cipher', accent: '#76539b',
  intro: 'One hidden phrase. Every letter has a double life.',
  instructions: [
    'Each coded letter stands for one different letter. The same code always has the same answer throughout the phrase.',
    'Tap a coded tile, then choose its real letter from the keyboard. Two letters are given to get you started.',
    'A real letter can belong to only one code. Erase an old guess before assigning it somewhere else.',
    'Hints confirm one letter and keep it in place. You can clear unconfirmed guesses and try as often as you like.'
  ],
  puzzles: PUZZLES, createState: E.createState, restoreState: E.restoreState,
  getStatus: E.getStatus, hint: E.hint, reveal: E.reveal, summarize: E.summarize,
  render({ root, puzzle: p, state: s, commit, announce }) {
    const status = E.getStatus(p, s), finished = status !== 'playing';
    const codes = E.cipherLetters(p);
    root.tabIndex = 0;
    root.setAttribute('aria-label', 'Cipher puzzle. Select a coded letter, then choose its answer.');
    const phrase = p.encoded.split(' ').map(word => `<span class="cipher-word">${[...word].map(code => {
      if (!/^[A-Z]$/.test(code)) return `<span class="cipher-punctuation">${esc(code)}</span>`;
      const known = s.locked.includes(code), guessed = s.guesses[code] || '·';
      return `<button type="button" class="cipher-cell ${code === s.selected ? 'selected' : ''} ${known ? 'given' : ''} ${finished ? 'complete' : ''}" data-code="${code}" aria-pressed="${code === s.selected}" aria-label="Code ${code}, ${known ? 'confirmed ' : 'guess '}${guessed === '·' ? 'blank' : guessed}" ${finished || known ? 'disabled' : ''}><span class="cipher-guess">${guessed}</span><span class="cipher-code">${code}</span></button>`;
    }).join('')}</span>`).join('');
    root.innerHTML = `<section class="panel cipher-panel">
      <p class="clue">${esc(p.clue)}</p>
      <div class="cipher-phrase" aria-label="Encoded phrase">${phrase}</div>
      <p class="muted cipher-caption">${p.givens.length} given letters · ${s.hints} hint${s.hints === 1 ? '' : 's'} used</p>
      ${finished ? `<p class="cipher-answer">${esc(p.phrase)}</p>` : `<p class="status-note">Selected code: <strong>${esc(s.selected || '—')}</strong>${s.selected ? ` → ${esc(s.guesses[s.selected] || '?')}` : ''}</p>`}
      <div class="cipher-keyboard" role="group" aria-label="Answer alphabet">
        ${[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(letter => `<button type="button" class="button cipher-key ${Object.values(s.guesses).includes(letter) ? 'assigned' : ''}" data-letter="${letter}" aria-label="Answer letter ${letter}" ${finished ? 'disabled' : ''}>${letter}</button>`).join('')}
      </div>
      <div class="actions"><button type="button" class="button" data-action="erase" ${finished ? 'disabled' : ''}>Erase guess</button><button type="button" class="button" data-action="clear" ${finished ? 'disabled' : ''}>Clear guesses</button></div>
      <p class="muted">Confirmed letters stay put. The other letters are yours to work out.</p>
    </section>`;
    const keepFocus = () => root.focus({ preventScroll: true });
    const enter = letter => {
      const result = E.guess(p, s, s.selected, letter);
      if (result.state === s) announce(result.message); else { commit(result.state, result.message); keepFocus(); }
    };
    for (const button of root.querySelectorAll('[data-code]')) button.onclick = () => { commit(E.select(p, s, button.dataset.code)); keepFocus(); };
    for (const button of root.querySelectorAll('[data-letter]')) button.onclick = () => enter(button.dataset.letter);
    root.querySelector('[data-action="erase"]').onclick = () => enter('');
    root.querySelector('[data-action="clear"]').onclick = () => { commit(E.clearGuesses(p, s), 'Unconfirmed guesses cleared.'); keepFocus(); };
    root.onkeydown = event => {
      if (event.ctrlKey || event.metaKey || event.altKey || finished) return;
      if (/^[a-z]$/i.test(event.key)) { event.preventDefault(); enter(event.key); }
      else if (event.key === 'Backspace' || event.key === 'Delete') { event.preventDefault(); enter(''); }
      else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault(); const choices = codes.filter(code => !s.locked.includes(code));
        if (!choices.length) return;
        const index = choices.indexOf(s.selected), step = event.key === 'ArrowRight' ? 1 : -1;
        commit(E.select(p, s, choices[(index + step + choices.length) % choices.length]));keepFocus();
      }
    };
  }
});
