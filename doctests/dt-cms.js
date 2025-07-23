// EXAMPLE: cms_tutorial
// HIDE_START
import assert from 'assert';
import { createClient } from 'redis';

const client = createClient();
await client.connect();
// HIDE_END

// REMOVE_START
await client.flushDb();
// REMOVE_END

// STEP_START cms
const res1 = await client.cms.initByProb('bikes:profit', 0.001, 0.002);
console.log(res1);  // >>> OK

const res2 = await client.cms.incrBy('bikes:profit', {
    item: 'Smoky Mountain Striker',
    incrementBy: 100
});
console.log(res2);  // >>> [100]

const res3 = await client.cms.incrBy('bikes:profit', [
  {
    item: 'Rocky Mountain Racer',
    incrementBy: 200
  },
  {
    item: 'Cloudy City Cruiser',
    incrementBy: 150
  }
]);
console.log(res3);  // >>> [200, 150]

const res4 = await client.cms.query('bikes:profit', 'Smoky Mountain Striker');
console.log(res4);  // >>> [100]

const res5 = await client.cms.info('bikes:profit');
console.log(res5.width, res5.depth, res5.count);  // >>> 2000 9 450
// STEP_END

// REMOVE_START
assert.equal(res1, 'OK')
assert.deepEqual(res2, [100])
assert.deepEqual(res3, [200, 150])
assert.deepEqual(res4, [100])
assert.deepEqual(res5, { width: 2000, depth: 9, count: 450 })
await client.close();
// REMOVE_END