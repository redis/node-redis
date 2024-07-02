// EXAMPLE: cuckoo_tutorial
// HIDE_START
import assert from 'assert';
import { createClient } from 'redis';

const client = createClient();
await client.connect();
// HIDE_END

// REMOVE_START
await client.flushDb();
// REMOVE_END

// STEP_START cuckoo
const res1 = await client.cf.reserve('bikes:models', 1000000);
console.log(res1);  // >>> OK

const res2 = await client.cf.add('bikes:models', 'Smoky Mountain Striker');
console.log(res2);  // >>> 1

const res3 = await client.cf.exists('bikes:models', 'Smoky Mountain Striker');
console.log(res3);  // >>> 1

const res4 = await client.cf.exists('bikes:models', 'Terrible Bike Name');
console.log(res4);  // >>> 0

const res5 = await client.cf.del('bikes:models', 'Smoky Mountain Striker');
console.log(res5);  // >>> 1
// STEP_END

// REMOVE_START
assert.equal(res1, 'OK')
assert.equal(res2, true)
assert.equal(res3, true)
assert.equal(res4, false)
assert.equal(res5, true)
await client.quit();
// REMOVE_END
