// EXAMPLE: topk_tutorial
// HIDE_START
import assert from 'assert';
import { createClient } from 'redis';

const client = createClient();
await client.connect();
// HIDE_END

// REMOVE_START
await client.flushDb();
// REMOVE_END

// STEP_START topk
const res1 = await client.topK.reserve('bikes:keywords', 5, {
    width: 2000,
    depth: 7,
    decay: 0.925
});
console.log(res1);  // >>> OK

const res2 = await client.topK.add('bikes:keywords', [
  'store',
  'seat',
  'handlebars',
  'handles',
  'pedals',
  'tires',
  'store',
  'seat'
]);
console.log(res2);  // >>> [null, null, null, null, null, 'handlebars', null, null]

const res3 = await client.topK.list('bikes:keywords');
console.log(res3);  // >>> ['store', 'seat', 'pedals', 'tires', 'handles']

const res4 = await client.topK.query('bikes:keywords', ['store', 'handlebars']);
console.log(res4);  // >>> [true, false]
// STEP_END

// REMOVE_START
assert.equal(res1, 'OK')
assert.deepEqual(res2, [null, null, null, null, null, 'handlebars', null, null])
assert.deepEqual(res3, ['store', 'seat', 'pedals', 'tires', 'handles'])
assert.deepEqual(res4, [1, 0])
await client.close();
// REMOVE_END

