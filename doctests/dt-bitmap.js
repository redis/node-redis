// EXAMPLE: bitmap_tutorial
// HIDE_START
import assert from 'assert';
import { createClient } from 'redis';

const client = createClient();
await client.connect();
// HIDE_END

// REMOVE_START
await client.flushDb();
// REMOVE_END

// STEP_START ping
const res1 = await client.setBit("pings:2024-01-01-00:00", 123, 1)
console.log(res1)  // >>> 0

const res2 = await client.getBit("pings:2024-01-01-00:00", 123)
console.log(res2)  // >>> 1

const res3 = await client.getBit("pings:2024-01-01-00:00", 456)
console.log(res3)  // >>> 0
// STEP_END

// REMOVE_START
assert.equal(res1, 0)
// REMOVE_END

// STEP_START bitcount
// HIDE_START
await client.setBit("pings:2024-01-01-00:00", 123, 1)
// HIDE_END
const res4 = await client.bitCount("pings:2024-01-01-00:00")
console.log(res4)  // >>> 1
// STEP_END
// REMOVE_START
assert.equal(res4, 1)
await client.close();
// REMOVE_END