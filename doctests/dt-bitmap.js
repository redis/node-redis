// EXAMPLE: bitmap_tutorial
// REMOVE_START
import assert from 'assert';
// REMOVE_END
import { createClient, RESP_TYPES } from 'redis';

const client = createClient({
  commandOptions: {
    typeMapping: {
      [RESP_TYPES.BLOB_STRING]: Buffer
    }
  }
});
await client.connect();

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
// REMOVE_END

// STEP_START bitop_setup
await client.setBit("A", 0, 1)
await client.setBit("A", 1, 1)
await client.setBit("A", 3, 1)
await client.setBit("A", 4, 1)

const res5 = await client.get("A")
console.log(res5.readUInt8(0).toString(2).padStart(8, '0'))
// >>> 11011000

await client.setBit("B", 3, 1)
await client.setBit("B", 4, 1)
await client.setBit("B", 7, 1)

const res6 = await client.get("B")
console.log(res6.readUInt8(0).toString(2).padStart(8, '0'))
// >>> 00011001

await client.setBit("C", 1, 1)
await client.setBit("C", 2, 1)
await client.setBit("C", 4, 1)
await client.setBit("C", 5, 1)

const res7 = await client.get("C")
console.log(res7.readUInt8(0).toString(2).padStart(8, '0'))
// >>> 01101100
// STEP_END
// REMOVE_START
assert.equal(res5.readUInt8(0), 0b11011000)
assert.equal(res6.readUInt8(0), 0b00011001)
assert.equal(res7.readUInt8(0), 0b01101100)
// REMOVE_END

// STEP_START bitop_and
await client.bitOp("AND", "R", ["A", "B", "C"])
const res8 = await client.get("R")
console.log(res8.readUInt8(0).toString(2).padStart(8, '0'))
// >>> 00001000
// STEP_END
// REMOVE_START
assert.equal(res8.readUInt8(0), 0b00001000)
// REMOVE_END

// STEP_START bitop_or
await client.bitOp("OR", "R", ["A", "B", "C"])
const res9 = await client.get("R")
console.log(res9.readUInt8(0).toString(2).padStart(8, '0'))
// >>> 11111101
// STEP_END
// REMOVE_START
assert.equal(res9.readUInt8(0), 0b11111101)
// REMOVE_END

// STEP_START bitop_xor
await client.bitOp("XOR", "R", ["A", "B"]) // XOR uses two keys here
const res10 = await client.get("R")
console.log(res10.readUInt8(0).toString(2).padStart(8, '0'))
// >>> 11000001
// STEP_END
// REMOVE_START
assert.equal(res10.readUInt8(0), 0b11000001)
// REMOVE_END

// STEP_START bitop_not
await client.bitOp("NOT", "R", "A")
const res11 = await client.get("R")
console.log(res11.readUInt8(0).toString(2).padStart(8, '0'))
// >>> 00100111
// STEP_END
// REMOVE_START
assert.equal(res11.readUInt8(0), 0b00100111)
// REMOVE_END

// STEP_START bitop_diff
await client.bitOp("DIFF", "R", ["A", "B", "C"])
const res12 = await client.get("R")
console.log(res12.readUInt8(0).toString(2).padStart(8, '0'))
// >>> 10000000
// STEP_END
// REMOVE_START
assert.equal(res12.readUInt8(0), 0b10000000)
// REMOVE_END

// STEP_START bitop_diff1
await client.bitOp("DIFF1", "R", ["A", "B", "C"])
const res13 = await client.get("R")
console.log(res13.readUInt8(0).toString(2).padStart(8, '0'))
// >>> 00100101
// STEP_END
// REMOVE_START
assert.equal(res13.readUInt8(0), 0b00100101)
// REMOVE_END

// STEP_START bitop_andor
await client.bitOp("ANDOR", "R", ["A", "B", "C"])
const res14 = await client.get("R")
console.log(res14.readUInt8(0).toString(2).padStart(8, '0'))
// >>> 01011000
// STEP_END
// REMOVE_START
assert.equal(res14.readUInt8(0), 0b01011000)
// REMOVE_END

// STEP_START bitop_one
await client.bitOp("ONE", "R", ["A", "B", "C"])
const res15 = await client.get("R")
console.log(res15.readUInt8(0).toString(2).padStart(8, '0'))
// >>> 10100101
// STEP_END
// REMOVE_START
assert.equal(res15.readUInt8(0), 0b10100101)

await client.close();
// REMOVE_END