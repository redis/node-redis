// EXAMPLE: bitfield_tutorial
// HIDE_START
import assert from 'assert';
import { createClient } from 'redis';

const client = createClient();
await client.connect();
// HIDE_END

// REMOVE_START
await client.flushDb();
// REMOVE_END

// STEP_START bf
let res1 = await client.bitField("bike:1:stats", [{
  operation: 'SET',
  encoding: 'u32',
  offset: '#0',
  value: 1000
}]);
console.log(res1);  // >>> [0]

let res2 = await client.bitField('bike:1:stats', [
  {
    operation: 'INCRBY',
    encoding: 'u32',
    offset: '#0',
    increment: -50
  },
  {
    operation: 'INCRBY',
    encoding: 'u32',
    offset: '#1',
    increment: 1
  }
]);
console.log(res2);  // >>> [950, 1]

let res3 = await client.bitField('bike:1:stats', [
  {
    operation: 'INCRBY',
    encoding: 'u32',
    offset: '#0',
    increment: 500
  },
  {
    operation: 'INCRBY',
    encoding: 'u32',
    offset: '#1',
    increment: 1
  }
]);
console.log(res3);  // >>> [1450, 2]

let res4 = await client.bitField('bike:1:stats', [
  {
    operation: 'GET',
    encoding: 'u32',
    offset: '#0'
  },
  {
    operation: 'GET',
    encoding: 'u32',
    offset: '#1'
  }
]);
console.log(res4);  // >>> [1450, 2]
// STEP_END

// REMOVE_START
assert.deepEqual(res1, [0])
assert.deepEqual(res2, [950, 1])
assert.deepEqual(res3, [1450, 2])
assert.deepEqual(res4, [1450, 2])
await client.close();
// REMOVE_END
