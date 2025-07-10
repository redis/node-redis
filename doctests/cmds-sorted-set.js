// EXAMPLE: cmds_sorted_set
// REMOVE_START
import assert from "node:assert";
// REMOVE_END

// HIDE_START
import { createClient } from 'redis';

const client = createClient();
client.on('error', err => console.log('Redis Client Error', err));
await client.connect().catch(console.error);
// HIDE_END

// STEP_START zadd
const val1 = await client.zAdd("myzset", [{ value: 'one', score: 1 }]);
console.log(val1);
// returns 1

const val2 = await client.zAdd("myzset", [{ value: 'uno', score: 1 }]);
console.log(val2);
// returns 1

const val3 = await client.zAdd("myzset", [{ value: 'two', score: 2 }, { value: 'three', score: 3 }]);
console.log(val3);
// returns 2

const val4 = await client.zRangeWithScores("myzset", 0, -1);
console.log(val4);
// returns [{value: 'one', score: 1}, {value: 'uno', score: 1}, {value: 'two', score: 2}, {value: 'three', score: 3} ]

// REMOVE_START
assert.equal(val1, 1);
assert.equal(val2, 1);
assert.equal(val3, 2);
assert.deepEqual(val4, [
  { value: 'one', score: 1 },
  { value: 'uno', score: 1 },
  { value: 'two', score: 2 },
  { value: 'three', score: 3 }
]);
await client.del('myzset');
// REMOVE_END
// STEP_END

// STEP_START zrange1
const val5 = await client.zAdd("myzset", [
  { value: 'one', score: 1 },
  { value: 'two', score: 2 },
  { value: 'three', score: 3 }
]);
console.log(val5);
// returns 3

const val6 = await client.zRange('myzset', 0, -1);
console.log(val6);
// returns ['one', 'two', 'three']
// REMOVE_START
console.assert(JSON.stringify(val6) === JSON.stringify(['one', 'two', 'three']));
// REMOVE_END

const val7 = await client.zRange('myzset', 2, 3);
console.log(val7);
// returns ['three']
// REMOVE_START
console.assert(JSON.stringify(val7) === JSON.stringify(['three']));
// REMOVE_END

const val8 = await client.zRange('myzset', -2, -1);
console.log(val8);
// returns ['two', 'three']
// REMOVE_START
console.assert(JSON.stringify(val8) === JSON.stringify(['two', 'three']));
await client.del('myzset');
// REMOVE_END
// STEP_END

// STEP_START zrange2
const val9 = await client.zAdd("myzset", [
  { value: 'one', score: 1 },
  { value: 'two', score: 2 },
  { value: 'three', score: 3 }
]);
console.log(val9);
// returns 3

const val10 = await client.zRangeWithScores('myzset', 0, 1);
console.log(val10);
// returns [{value: 'one', score: 1}, {value: 'two', score: 2}]
// REMOVE_START
console.assert(JSON.stringify(val10) === JSON.stringify([{value: 'one', score: 1}, {value: 'two', score: 2}]));
await client.del('myzset');
// REMOVE_END
// STEP_END

// STEP_START zrange3
const val11 = await client.zAdd("myzset", [
  { value: 'one', score: 1 },
  { value: 'two', score: 2 },
  { value: 'three', score: 3 }
]);
console.log(val11);
// returns 3

const val12 = await client.zRange('myzset', 2, 3, { BY: 'SCORE', LIMIT: { offset: 1, count: 1 } });
console.log(val12);
// >>> ['three']
// REMOVE_START
console.assert(JSON.stringify(val12) === JSON.stringify(['three']));
await client.del('myzset');
// REMOVE_END
// STEP_END

// HIDE_START
await client.close();
// HIDE_END
