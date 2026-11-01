import test from 'node:test'
import assert from 'node:assert/strict'
import { buildQuartetShare } from '../src/games/quartet/engine.ts'

test('Quartet sharing discloses pair assistance and keeps every answer out of the copied text',()=>{
 const text=buildQuartetShare(4,[[1,1,1,1],[2,2,2,2]],true,1)
 assert.match(text,/1 pair hint/i)
 assert.doesNotMatch(text,/oak|pasta|boxing/i)
 assert.doesNotMatch(buildQuartetShare(4,[[1,1,1,1]],true,0),/hint/i)
})

test('Quartet share accepts only nonnegative safe integer hint counts', () => {
 const history = [[1, 1, 1, 1]]
 const unassisted = buildQuartetShare(4, history, true)
 assert.equal(buildQuartetShare(4, history, true, 0), unassisted)
 assert.match(buildQuartetShare(4, history, true, 1), /\n1 pair hint$/)
 assert.match(buildQuartetShare(4, history, true, 2), /\n2 pair hints$/)
 assert.match(buildQuartetShare(4, history, true, Number.MAX_SAFE_INTEGER), /\n9007199254740991 pair hints$/)
 for (const count of [-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '1', null]) {
  assert.throws(
   () => buildQuartetShare(4, history, true, count as number),
   { name: 'TypeError', message: /nonnegative safe integer/i },
   `invalid hint count: ${String(count)}`,
  )
 }
})
