// EXAMPLE: ss_tutorial
// HIDE_START
import assert from 'assert';
import { createClient } from 'redis';

const client = createClient();
await client.connect();
// HIDE_END

// REMOVE_START
await client.flushDb();
// REMOVE_END

// STEP_START zadd
const res1 = await client.zAdd('racer_scores', { score: 10, value: 'Norem' });
console.log(res1);  // >>> 1

const res2 = await client.zAdd('racer_scores', { score: 12, value: 'Castilla' });
console.log(res2);  // >>> 1

const res3 = await client.zAdd('racer_scores', [
  { score: 8, value: 'Sam-Bodden' },
  { score: 10, value: 'Royce' },
  { score: 6, value: 'Ford' },
  { score: 14, value: 'Prickett' },
  { score: 12, value: 'Castilla' }
]);
console.log(res3);  // >>> 4
// STEP_END

// REMOVE_START
assert.equal(res1, 1)
assert.equal(res2, 1)
assert.equal(res3, 4)
// REMOVE_END

// REMOVE_START
const count = await client.zCard('racer_scores');
console.assert(count === 6);
// REMOVE_END

// STEP_START zrange
const res4 = await client.zRange('racer_scores', 0, -1);
console.log(res4);  // >>> ['Ford', 'Sam-Bodden', 'Norem', 'Royce', 'Castilla', 'Prickett']
// STEP_END

// REMOVE_START
assert.deepEqual(res4, ['Ford', 'Sam-Bodden', 'Norem', 'Royce', 'Castilla', 'Prickett'])
// REMOVE_END

// STEP_START zrange_withscores
const res6 = await client.zRangeWithScores('racer_scores', 0, -1);
console.log(res6);
// >>> [
//       { value: 'Ford', score: 6 }, { value: 'Sam-Bodden', score: 8 },
//       { value: 'Norem', score: 10 }, { value: 'Royce', score: 10 },
//       { value: 'Castilla', score: 12 }, { value: 'Prickett', score: 14 }
// ]
// STEP_END

// REMOVE_START
assert.deepEqual(res6, [ { value: 'Ford', score: 6 }, { value: 'Sam-Bodden', score: 8 }, { value: 'Norem', score: 10 }, { value: 'Royce', score: 10 }, { value: 'Castilla', score: 12 }, { value: 'Prickett', score: 14 } ]
)
// REMOVE_END

// STEP_START zrangebyscore
const res7 = await client.zRangeByScore('racer_scores', '-inf', 10);
console.log(res7);  // >>> ['Ford', 'Sam-Bodden', 'Norem', 'Royce']
// STEP_END

// REMOVE_START
assert.deepEqual(res7, ['Ford', 'Sam-Bodden', 'Norem', 'Royce'])
// REMOVE_END

// STEP_START zremrangebyscore
const res8 = await client.zRem('racer_scores', 'Castilla');
console.log(res8);  // >>> 1

const res9 = await client.zRemRangeByScore('racer_scores', '-inf', 9);
console.log(res9);  // >>> 2

// REMOVE_START
assert.equal(res8, 1)
assert.equal(res9, 2)
// REMOVE_END

const res10 = await client.zRange('racer_scores', 0, -1);
console.log(res10);  // >>> ['Norem', 'Royce', 'Prickett']
// STEP_END

// REMOVE_START
assert.deepEqual(res10, ['Norem', 'Royce', 'Prickett'])
// REMOVE_END

// REMOVE_START
const count2 = await client.zCard('racer_scores');
console.assert(count2 === 3);
// REMOVE_END

// STEP_START zrank
const res11 = await client.zRank('racer_scores', 'Norem');
console.log(res11);  // >>> 0

const res12 = await client.zRevRank('racer_scores', 'Norem');
console.log(res12);  // >>> 2
// STEP_END

// STEP_START zadd_lex
const res13 = await client.zAdd('racer_scores', [
  { score: 0, value: 'Norem' },
  { score: 0, value: 'Sam-Bodden' },
  { score: 0, value: 'Royce' },
  { score: 0, value: 'Ford' },
  { score: 0, value: 'Prickett' },
  { score: 0, value: 'Castilla' }
]);
console.log(res13);  // >>> 3

// REMOVE_START
assert.equal(count2, 3)
assert.equal(res11, 0)
assert.equal(res12, 2)
assert.equal(res13, 3)
// REMOVE_END

const res14 = await client.zRange('racer_scores', 0, -1);
console.log(res14);  // >>> ['Castilla', 'Ford', 'Norem', 'Prickett', 'Royce', 'Sam-Bodden']

const res15 = await client.zRangeByLex('racer_scores', '[A', '[L');
console.log(res15);  // >>> ['Castilla', 'Ford']
// STEP_END

// REMOVE_START
assert.deepEqual(res14, ['Castilla', 'Ford', 'Norem', 'Prickett', 'Royce', 'Sam-Bodden'])
assert.deepEqual(res15, ['Castilla', 'Ford'])
// REMOVE_END

// STEP_START leaderboard
const res16 = await client.zAdd('racer_scores', { score: 100, value: 'Wood' });
console.log(res16);  // >>> 1

const res17 = await client.zAdd('racer_scores', { score: 100, value: 'Henshaw' });
console.log(res17);  // >>> 1

const res18 = await client.zAdd('racer_scores', { score: 150, value: 'Henshaw' }, { nx: true });
console.log(res18);  // >>> 0

const res19 = await client.zIncrBy('racer_scores', 50, 'Wood');
console.log(res19);  // >>> 150.0

const res20 = await client.zIncrBy('racer_scores', 50, 'Henshaw');
console.log(res20);  // >>> 200.0
// STEP_END

// REMOVE_START
assert.equal(res16, 1)
assert.equal(res17, 1)
assert.equal(res18, 0)
assert.equal(res19, 150.0)
assert.equal(res20, 200.0)
await client.close();
// REMOVE_END
