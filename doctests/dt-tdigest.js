// EXAMPLE: tdigest_tutorial
// HIDE_START
import assert from 'assert';
import { createClient } from 'redis';

const client = createClient();
await client.connect();
// HIDE_END

// REMOVE_START
await client.flushDb();
// REMOVE_END

// STEP_START tdig_start
const res1 = await client.tDigest.create('bikes:sales', 100);
console.log(res1);  // >>> OK

const res2 = await client.tDigest.add('bikes:sales', [21]);
console.log(res2);  // >>> OK

const res3 = await client.tDigest.add('bikes:sales', [150, 95, 75, 34]);
console.log(res3);  // >>> OK
// STEP_END

// REMOVE_START
assert.equal(res1, 'OK')
assert.equal(res2, 'OK')
assert.equal(res3, 'OK')
// REMOVE_END

// STEP_START tdig_cdf
const res4 = await client.tDigest.create('racer_ages');
console.log(res4);  // >>> OK

const res5 = await client.tDigest.add('racer_ages', [
  45.88, 44.2, 58.03, 19.76, 39.84, 69.28, 50.97, 25.41, 19.27, 85.71, 42.63
]);
console.log(res5);  // >>> OK

const res6 = await client.tDigest.rank('racer_ages', [50]);
console.log(res6);  // >>> [7]

const res7 = await client.tDigest.rank('racer_ages', [50, 40]);
console.log(res7);  // >>> [7, 4]
// STEP_END

// REMOVE_START
assert.equal(res4, 'OK')
assert.equal(res5, 'OK')
assert.deepEqual(res6, [7])
assert.deepEqual(res7, [7, 4])
// REMOVE_END

// STEP_START tdig_quant
const res8 = await client.tDigest.quantile('racer_ages', [0.5]);
console.log(res8);  // >>> [44.2]

const res9 = await client.tDigest.byRank('racer_ages', [4]);
console.log(res9);  // >>> [42.63]
// STEP_END

// STEP_START tdig_min
const res10 = await client.tDigest.min('racer_ages');
console.log(res10);  // >>> 19.27

const res11 = await client.tDigest.max('racer_ages');
console.log(res11);  // >>> 85.71
// STEP_END

// REMOVE_START
assert.deepEqual(res8, [44.2])
assert.deepEqual(res9, [42.63])
assert.equal(res10, 19.27)
assert.equal(res11, 85.71)
// REMOVE_END

// STEP_START tdig_reset
const res12 = await client.tDigest.reset('racer_ages');
console.log(res12);  // >>> OK
// STEP_END

// REMOVE_START
assert.equal(res12, 'OK')
await client.close();
// REMOVE_END
