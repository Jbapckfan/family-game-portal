import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {mkdtempSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {handleFeedback} from '../lib/feedback.mjs';

const id = '78d47d93-61ae-4986-83a3-bcaa8dffcb8e';
const body = {id,slug:'counterpart',text:'The clue text is hard to read.'};
function request(value = body, extra = {}) {
  return new Request('https://private.example/api/feedback', {method:'POST',headers:{'content-type':'application/json','oai-authenticated-user-id':'owner','origin':'https://private.example',...extra},body:JSON.stringify(value)});
}
function database(path = ':memory:', migrate = true) {
  const sqlite = new DatabaseSync(path);
  if(migrate)sqlite.exec(readFileSync(new URL('../drizzle/0000_feedback.sql',import.meta.url),'utf8'));
  return {sqlite, prepare(sql){return {bind(...args){return {sql,args};}};}, async batch(statements) {
    sqlite.exec('BEGIN');
    try {
      const results=statements.map(({sql,args})=>{
        const statement=sqlite.prepare(sql);
        if(sql.startsWith('SELECT'))return {success:true,results:statement.all(...args),meta:{changes:0}};
        return {success:true,results:[],meta:{changes:Number(statement.run(...args).changes)}};
      });
      sqlite.exec('COMMIT');return results;
    } catch(error){sqlite.exec('ROLLBACK');throw error;}
  }};
}

test('receipt follows durable SQLite commit and survives restart; retry creates one row',async()=>{
  const path=join(mkdtempSync(join(tmpdir(),'alford-feedback-')),'feedback.sqlite');
  const db=database(path);const response=await handleFeedback(request(),db);assert.equal(response.status,201);
  const receipt=await response.json();assert.equal(receipt.received,true);assert.equal(receipt.receipt.id,id);assert.ok(Number.isFinite(Date.parse(receipt.receipt.receivedAt)));
  db.sqlite.close();const reopened=database(path,false);
  const retry=await handleFeedback(request(),reopened);assert.equal(retry.status,200);assert.deepEqual(await retry.json(),receipt);
  assert.equal(reopened.sqlite.prepare('SELECT count(*) AS n FROM feedback').get().n,1);reopened.sqlite.close();
});

test('same id with changed feedback is rejected without overwriting original',async()=>{
  const db=database();await handleFeedback(request(),db);
  assert.equal((await handleFeedback(request({...body,text:'Changed message'}),db)).status,409);
  assert.equal(db.sqlite.prepare('SELECT text FROM feedback').get().text,body.text);db.sqlite.close();
});

test('different authenticated users have independent idempotency scope and no read endpoint',async()=>{
  const db=database();await handleFeedback(request(),db);
  assert.equal((await handleFeedback(request(body,{'oai-authenticated-user-id':'second-user'}),db)).status,201);
  assert.equal(db.sqlite.prepare('SELECT count(*) AS n FROM feedback').get().n,2);
  assert.equal((await handleFeedback(new Request('https://private.example/api/feedback'),db)).status,405);db.sqlite.close();
});

test('invalid payloads never reach storage',async()=>{
  const db={batch(){throw Error('must not write');}};
  for(const value of [null,[],{...body,id:'bad'},{...body,slug:'unknown'},{...body,text:''},{...body,text:' '.repeat(20)},{...body,text:'x'.repeat(2001)},{...body,text:'a\0b'},{...body,receivedAt:'fake'},{...body,slug:'../daily'}]) {
    assert.equal((await handleFeedback(request(value),db)).status,400,JSON.stringify(value));
  }
  assert.equal((await handleFeedback(request({...body,text:'x'.repeat(13000)}),db)).status,413);
});

test('missing identity and cross-origin writes are refused',async()=>{
  const db=database();
  assert.equal((await handleFeedback(request(body,{'oai-authenticated-user-id':''}),db)).status,401);
  assert.equal((await handleFeedback(request(body,{origin:'https://other.example'}),db)).status,403);
  assert.equal((await handleFeedback(request(body,{'sec-fetch-site':'cross-site'}),db)).status,403);
  assert.equal(db.sqlite.prepare('SELECT count(*) AS n FROM feedback').get().n,0);db.sqlite.close();
});

test('storage failures and incomplete commits never produce received success',async()=>{
  const variants=[null,{prepare(){return {bind(){return {};}};},async batch(){throw Error('offline');}},
    {prepare(){return {bind(){return {};}};},async batch(){return [{success:false},{success:true,results:[]}];}}];
  for(const db of variants){const response=await handleFeedback(request(),db);assert.equal(response.status,503);assert.notEqual((await response.json()).received,true);}
});

test('success waits for the transaction promise, with no response before persistence',async()=>{
  const db=database();const original=db.batch.bind(db);let release;db.batch=async statements=>{await new Promise(resolve=>release=resolve);return original(statements);};
  let resolved=false;const pending=handleFeedback(request(),db).then(value=>{resolved=true;return value;});
  await new Promise(resolve=>setImmediate(resolve));assert.equal(resolved,false);release();assert.equal((await pending).status,201);db.sqlite.close();
});
