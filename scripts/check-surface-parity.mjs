// Execute the real Foundation-only Swift models without a Simulator or GPU workload.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {GAMES,todayThree,featuredGames,buildDailyShare} from '../games/daily/catalog.mjs';
import {dateKey} from '../games/daily/app.mjs';
const root=path.resolve(import.meta.dirname,'..'),scratch=await mkdtemp(path.join(tmpdir(),'daily-surface-parity-'));
const dates=Array.from({length:30},(_,i)=>new Date(Date.parse('2026-10-28T18:00:00Z')+i*86400000).toISOString().slice(0,10));
const instants=['2026-11-01T04:59:59Z','2026-11-01T05:00:01Z','2026-11-02T05:59:59Z','2026-11-02T06:00:01Z','2026-10-28T18:00:00Z'];
try{
 const main=path.join(scratch,'main.swift');
 await writeFile(main,`import Foundation
 let dates = try JSONSerialization.jsonObject(with: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))) as! [String]
 let instants = try JSONSerialization.jsonObject(with: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[2]))) as! [String]
 let states: [GameStatus] = [.won, .playing, .revealed, .lost]
 var shares: [String: String] = [:]
 for date in dates {
   var ledger = ProgressLedger()
   for (index, game) in GameID.allCases.enumerated() {
     ledger.record(ProgressMessage(game: game, mode: .daily, dateKey: date, status: states[index % 4], stats: .empty))
   }
   let before = ledger
   shares[date] = ledger.todayShare(on: date)
   precondition(ledger == before)
 }
 let result: [String: Any] = [
   "games": GameID.allCases.map { ["slug": $0.rawValue, "name": $0.name, "creator": $0.creator.rawValue, "boards": $0.collectionCount] as [String: Any] },
   "featured": GameID.featured.map(\\.rawValue),
   "three": Dictionary(uniqueKeysWithValues: dates.map { ($0, GameID.todaysThree(on: $0).map(\\.rawValue)) }),
   "shares": shares,
   "keys": instants.map { DailyCalendar.key(for: ISO8601DateFormatter().date(from: $0)!) }
 ]
 print(String(data: try JSONSerialization.data(withJSONObject: result), encoding: .utf8)!)
 `);
 const datesFile=path.join(scratch,'dates.json'),instantsFile=path.join(scratch,'instants.json');
 await writeFile(datesFile,JSON.stringify(dates));await writeFile(instantsFile,JSON.stringify(instants));
 const binary=path.join(scratch,'parity');
 const compiled=spawnSync('swiftc',['-module-cache-path',path.join(scratch,'cache'),...['GameCatalog','DailyCalendar','BridgePayload','ProgressLedger'].map(name=>path.join(root,'ios/AlfordDaily/Core',name+'.swift')),main,'-o',binary],{encoding:'utf8'});
 assert.equal(compiled.status,0,compiled.stderr);
 const executed=spawnSync(binary,[datesFile,instantsFile],{encoding:'utf8'});assert.equal(executed.status,0,executed.stderr);
 const actual=JSON.parse(executed.stdout);
 assert.deepEqual(actual.games,GAMES.map(({slug,name,creator,boards})=>({slug,name,creator,boards})));
 assert.deepEqual(actual.featured,featuredGames().map(game=>game.slug));
 const states=['won','playing','revealed','lost'];
 for(const date of dates){assert.deepEqual(actual.three[date],todayThree(date).map(game=>game.slug));assert.equal(actual.shares[date],buildDailyShare(date,GAMES.map((game,index)=>({slug:game.slug,status:states[index%4]}))));}
 assert.deepEqual(actual.keys,instants.map(instant=>dateKey(new Date(instant))));
 console.log('PASS: 32 Swift/web catalog entries and counts, featured 4, 30 Today’s Three selections and read-only share summaries, Central midnight/DST/rollback date keys. Compiled actual Foundation models; no Simulator.');
}finally{await rm(scratch,{recursive:true,force:true});}
