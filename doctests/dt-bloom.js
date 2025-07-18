// EXAMPLE: bf_tutorial
// HIDE_START
import assert from 'assert';
import { createClient } from 'redis';

const client = createClient();
await client.connect();
// HIDE_END

// REMOVE_START
await client.flushDb();
// REMOVE_END

// STEP_START bloom
const res1 = await client.bf.reserve('bikes:models', 0.01, 1000);
console.log(res1);  // >>> OK

const res2 = await client.bf.add('bikes:models', 'Smoky Mountain Striker');
console.log(res2);  // >>> true

const res3 = await client.bf.exists('bikes:models', 'Smoky Mountain Striker');
console.log(res3);  // >>> true

const res4 = await client.bf.mAdd('bikes:models', [
  'Rocky Mountain Racer',
  'Cloudy City Cruiser',
  'Windy City Wippet'
]);
console.log(res4);  // >>> [true, true, true]

const res5 = await client.bf.mExists('bikes:models', [
  'Rocky Mountain Racer',
  'Cloudy City Cruiser',
  'Windy City Wippet'
]);
console.log(res5);  // >>> [true, true, true]
// STEP_END

// REMOVE_START
assert.equal(res1, 'OK')
assert.equal(res2, true)
assert.equal(res3, true)
assert.deepEqual(res4, [true, true, true])
assert.deepEqual(res5, [true, true, true])
await client.close();
// REMOVE_END
