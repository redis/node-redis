// EXAMPLE: hll_tutorial
// HIDE_START
import assert from 'assert';
import { createClient } from 'redis';

const client = createClient();
await client.connect();
// HIDE_END

// REMOVE_START
await client.flushDb();
// REMOVE_END

// STEP_START pfadd
const res1 = await client.pfAdd('bikes', ['Hyperion', 'Deimos', 'Phoebe', 'Quaoar']);
console.log(res1);  // >>> 1

const res2 = await client.pfCount('bikes');
console.log(res2);  // >>> 4

const res3 = await client.pfAdd('commuter_bikes', ['Salacia', 'Mimas', 'Quaoar']);
console.log(res3);  // >>> 1

const res4 = await client.pfMerge('all_bikes', ['bikes', 'commuter_bikes']);
console.log(res4);  // >>> OK

const res5 = await client.pfCount('all_bikes');
console.log(res5);  // >>> 6
// STEP_END

// REMOVE_START
assert.equal(res1, 1)
assert.equal(res2, 4)
assert.equal(res3, 1)
assert.equal(res4, 'OK')
assert.equal(res5, 6)
await client.close();
// REMOVE_END
