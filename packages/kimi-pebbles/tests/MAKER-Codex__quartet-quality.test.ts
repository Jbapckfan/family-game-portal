import test from 'node:test'
import assert from 'node:assert/strict'
import { buildQuartetShare } from '../src/games/quartet/engine.ts'

test('Quartet sharing discloses pair assistance and keeps every answer out of the copied text',()=>{
 const text=buildQuartetShare(4,[[1,1,1,1],[2,2,2,2]],true,1)
 assert.match(text,/1 pair hint/i)
 assert.doesNotMatch(text,/oak|pasta|boxing/i)
 assert.doesNotMatch(buildQuartetShare(4,[[1,1,1,1]],true,0),/hint/i)
})
