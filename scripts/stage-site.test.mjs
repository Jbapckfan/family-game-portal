import test from 'node:test';
import assert from 'node:assert/strict';
import {cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const source = fileURLToPath(new URL('../', import.meta.url));

test('public staging includes all 32 games, excludes unrelated portal files, and refuses stale runtime copies before mutation', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'alford-public-stage-'));
  const fixture = join(temporary, 'source'), output = join(temporary, 'public');
  try {
    await mkdir(join(fixture, 'scripts'), {recursive:true});
    await mkdir(join(fixture, 'docs'), {recursive:true});
    await cp(join(source, 'scripts/stage-site.mjs'), join(fixture, 'scripts/stage-site.mjs'));
    await cp(join(source, 'scripts/sync-ios-web.mjs'), join(fixture, 'scripts/sync-ios-web.mjs'));
    await cp(join(source, 'docs/puzzle-inventory.json'), join(fixture, 'docs/puzzle-inventory.json'));
    await cp(join(source, 'games'), join(fixture, 'games'), {recursive:true});
    await cp(join(source, 'ios/Web/games'), join(fixture, 'ios/Web/games'), {recursive:true});
    await mkdir(join(fixture, 'games/private-portal-fixture'), {recursive:true});
    await writeFile(join(fixture, 'games/private-portal-fixture/internal.txt'), 'Not an Alford Daily runtime asset');
    const run = () => spawnSync(process.execPath, [join(fixture,'scripts/stage-site.mjs'), output], {encoding:'utf8'});
    const first = run();
    assert.equal(first.status, 0, first.stderr);
    const inventory = JSON.parse(await readFile(join(fixture,'docs/puzzle-inventory.json'),'utf8'));
    const expected = [...inventory.games.map(game=>game.slug), 'daily', 'kimi-runtime', 'deepseek-runtime'].sort();
    assert.deepEqual((await readdir(join(output,'games'))).sort(), expected, 'unrelated portal games must never enter the public build');
    const originalFiles = await readdir(join(output,'games/ringcount'));
    assert.ok(!originalFiles.includes('scripts') && !originalFiles.includes('tests') && !originalFiles.includes('package.json'));
    assert.match(await readFile(join(output,'index.html'),'utf8'), /data-game-base="\.\/games\/"/);
    for (const game of inventory.games) assert.match(await readFile(join(output,'games',game.slug,'index.html'),'utf8'), /<!doctype html>/i);
    assert.deepEqual(JSON.parse(await readFile(join(output,'release.json'),'utf8')), inventory);
    await writeFile(join(output,'private-leftover.txt'),'must not become a published file');
    const occupied = run();
    assert.notEqual(occupied.status,0,'an occupied destination must not be silently republished');
    assert.match(occupied.stderr,/empty|occupied/i);
    const outside = join(temporary,'outside.html');
    await writeFile(outside,'Keep this file');
    await rm(join(output,'index.html'));
    const {symlink} = await import('node:fs/promises');
    await symlink(outside,join(output,'index.html'));
    assert.notEqual(run().status,0);
    assert.equal(await readFile(outside,'utf8'),'Keep this file');
    const sourceDestination = spawnSync(process.execPath,[join(fixture,'scripts/stage-site.mjs'),join(fixture,'deploy')],{encoding:'utf8'});
    assert.notEqual(sourceDestination.status,0,'source directories must not become staging destinations');
    const marker = join(output,'games/ringcount/index.html');
    const before = await readFile(marker);
    await writeFile(join(fixture,'games/ringcount/app.mjs'),'stale fixture');
    const stale = run();
    assert.notEqual(stale.status, 0, 'a stale offline copy must block publication');
    assert.match(stale.stderr, /stale|differs/i);
    assert.deepEqual(await readFile(marker), before, 'preflight failure must preserve the existing build');
  } finally {
    await rm(temporary, {recursive:true,force:true});
  }
});
