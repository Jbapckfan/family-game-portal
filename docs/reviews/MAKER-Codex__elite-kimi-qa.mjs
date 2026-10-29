/** MAKER-Codex · source-assisted real-control QA; launches no browser. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

export const QA_DATE = '2026-10-28T18:00:00.000Z';
const day = Math.floor(Date.parse('2026-10-28T00:00:00Z') / 86400000);
const source = new URL('../../packages/kimi-pebbles/src/games/', import.meta.url);
function daily(game) {
  const bank = JSON.parse(readFileSync(new URL(`${game}/data/${game === 'hunch' ? 'answers' : 'puzzles'}.json`, source), 'utf8'));
  const index = day % bank.length;
  return { puzzleId: index + 1, puzzle: bank[index] };
}
const points = word => word.length <= 4 ? 1 : word.length === 5 ? 2 : word.length === 6 ? 3 : word.length === 7 ? 5 : 11;
function pathFor(grid, word) {
  const visit = (path, pos) => {
    if (pos === word.length) return path;
    for (let cell = 0; cell < 16; cell++) {
      if (grid[cell] !== word[pos] || path.includes(cell)) continue;
      const last = path.at(-1);
      if (last !== undefined && (Math.abs(Math.floor(last / 4) - Math.floor(cell / 4)) > 1 || Math.abs(last % 4 - cell % 4) > 1)) continue;
      const result = visit([...path, cell], pos + 1);
      if (result) return result;
    }
    return null;
  };
  const path = visit([], 0);
  assert.ok(path, `No legal path for ${word}`);
  return path;
}

export const sourceAssistedSolutions = Object.fromEntries(['cairn', 'morph', 'tangle', 'hunch', 'circuit', 'quartet'].map(game => [game, daily(game)]));
const tangle = sourceAssistedSolutions.tangle;
tangle.gold = Math.min(18, Math.max(8, Math.round(tangle.puzzle.max * .2)));
tangle.route = [];
let score = 0;
const candidates = [tangle.puzzle.best, ...[...tangle.puzzle.words].sort((a, b) => points(b) - points(a) || a.localeCompare(b))];
for (const word of new Set(candidates)) {
  if (score >= tangle.gold) break;
  tangle.route.push({ word, path: pathFor(tangle.puzzle.g, word), points: points(word) });
  score += points(word);
}
assert.ok(tangle.route.length > 1 && tangle.route[0].points < tangle.gold, 'checkpoint must precede gold');

async function dismissHelp(page) {
  await page.locator('[data-game-ready="true"]').waitFor();
  const dialog = page.getByRole('dialog');
  // First-visit help is automatic. Wait on the game or its modal rather than
  // injecting a seen-help flag; fresh locators are used again after reload.
  if (await dialog.count()) {
    const title = await dialog.locator('[data-slot="dialog-title"]').innerText();
    assert.ok(!/summit|gold rush|flawless|target met|first try|sharp hunch/i.test(title), `Unexpected completed starting round: ${title}`);
    await dialog.getByRole('button', { name: 'Close', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
  }
}
async function result(page, puzzleId, title) {
  await page.clock.runFor(1000);
  const heading = page.locator('[role="dialog"] [data-slot="dialog-title"]');
  await heading.waitFor({ timeout: 10000 });
  const terminalText = await heading.innerText();
  assert.match(terminalText, title);
  return { puzzleId, terminalSelector: '[role="dialog"] [data-slot="dialog-title"]', terminalText, assistance: 'source-assisted' };
}
async function rackLetter(page, letter) {
  await page.locator('.cairn-rack button:enabled').filter({ hasText: new RegExp(`^${letter}$`, 'i') }).first().click();
}
async function morphLetter(page, index, letter) {
  await page.locator('.morph-ladder button[aria-label^="Edit letter"]').nth(index).click();
  await page.locator('[role="dialog"]').getByRole('button', { name: letter, exact: true }).click();
  await page.locator('.morph-letter-palette').waitFor({ state: 'hidden' });
}
async function tangleWord(page, entry) {
  for (const cell of entry.path) {
    // Native keyboard activation intentionally exercises the same selection
    // controls that a keyboard/assistive user can reach, without synthetic taps.
    await page.locator(`[data-cell="${cell}"]`).press('Space');
  }
  await page.getByRole('button', { name: 'Submit word', exact: true }).click();
  await page.locator('.tangle-found').getByText(entry.word, { exact: true }).waitFor();
}

/** Root navigates with the fixed clock, then supplies its reload/storage audit. */
export async function playGame(page, slug, { checkpoint } = {}) {
  assert.equal(typeof checkpoint, 'function', 'Provide the real reload checkpoint callback');
  const game = slug.replace(/^kimi-/, '');
  const fixture = sourceAssistedSolutions[game];
  assert.ok(fixture, `Unknown Kimi game: ${slug}`);
  await dismissHelp(page);
  const { puzzle, puzzleId } = fixture;
  if (game === 'cairn') {
    for (let level = 0; level < puzzle.w.length; level++) {
      const word = puzzle.w[level];
      await page.locator('.cairn-level').filter({ hasText: `Level ${level + 1} · ${word.length} letters` }).waitFor();
      for (let i = 0; i < word.length; i++) {
        await rackLetter(page, word[i]);
        if (level === 1 && i === 1) { await checkpoint(); await dismissHelp(page); }
      }
      await page.getByRole('button', { name: 'ENTER', exact: true }).click();
      await page.clock.runFor(700);
    }
    return result(page, puzzleId, /Perfect summit/);
  }
  if (game === 'morph') {
    for (let rung = 1; rung < puzzle.p.length; rung++) {
      const before = puzzle.p[rung - 1], next = puzzle.p[rung];
      const index = [...next].findIndex((letter, position) => letter !== before[position]);
      await morphLetter(page, index, next[index]);
      if (rung === 1) { await checkpoint(); await dismissHelp(page); }
      await page.getByRole('button', { name: 'LOCK IN RUNG', exact: true }).click();
    }
    return result(page, puzzleId, /Gold.*target met/);
  }
  if (game === 'hunch') {
    for (const letter of 'crane') await page.getByRole('button', { name: new RegExp(`^Letter ${letter}(?:,|$)`) }).click();
    await page.getByRole('button', { name: 'Enter', exact: true }).click();
    assert.equal(await page.locator('.hunch-result-mark').count(), 5);
    for (let index = 0; index < puzzle.length; index++) {
      await page.getByRole('button', { name: new RegExp(`^Letter ${puzzle[index]}(?:,|$)`) }).click();
      if (index === 2) { await checkpoint(); await dismissHelp(page); }
    }
    await page.getByRole('button', { name: 'Enter', exact: true }).click();
    return result(page, puzzleId, /Sharp hunch/);
  }
  if (game === 'tangle') {
    await page.getByRole('button', { name: /Hint · 1 free/ }).click();
    for (let index = 0; index < fixture.route.length; index++) {
      await tangleWord(page, fixture.route[index]);
      if (index === 0) { await checkpoint(); await dismissHelp(page); }
    }
    return result(page, puzzleId, /Gold rush/);
  }
  if (game === 'circuit') {
    for (let wordIndex = 0; wordIndex < puzzle.sol.length; wordIndex++) {
      const word = puzzle.sol[wordIndex];
      const start = wordIndex === 0 ? 0 : 1; // submit auto-seeds the shared letter
      for (let index = start; index < word.length; index++) {
        await page.locator(`[data-letter="${puzzle.l.indexOf(word[index])}"]`).click();
        if (wordIndex === 1 && index === 2) { await checkpoint(); await dismissHelp(page); }
      }
      await page.getByRole('button', { name: 'Play word', exact: true }).click();
    }
    return result(page, puzzleId, /Gold/);
  }
  for (let index = 0; index < puzzle.groups.length; index++) {
    for (const word of puzzle.groups[index].members) {
      await page.getByRole('button', { name: new RegExp(`^Word ${word}(?:,|$)`) }).click();
    }
    await page.getByRole('button', { name: 'Submit 4/4', exact: true }).click();
    if (index === 0) {
      await page.getByRole('button', { name: /Pair glow · 1 free/ }).click();
      await page.locator('#quartet-hint').waitFor();
      await checkpoint(); await dismissHelp(page);
      await page.locator('#quartet-hint').waitFor();
    }
  }
  return result(page, puzzleId, /Flawless quartet/);
}
