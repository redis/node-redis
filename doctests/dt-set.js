// EXAMPLE: sets_tutorial
// HIDE_START
import assert from 'assert';
import { createClient } from 'redis';

const client = createClient();
await client.connect();
// HIDE_END
// REMOVE_START
await client.del('bikes:racing:france')
await client.del('bikes:racing:usa')
// REMOVE_END

// STEP_START sAdd
const res1 = await client.sAdd('bikes:racing:france', 'bike:1')
console.log(res1)  // >>> 1

const res2 = await client.sAdd('bikes:racing:france', 'bike:1')
console.log(res2)  // >>> 0
const res3 = await client.sAdd('bikes:racing:france', ['bike:2', 'bike:3'])
console.log(res3)  // >>> 2
const res4 = await client.sAdd('bikes:racing:usa', ['bike:1', 'bike:4'])
console.log(res4)  // >>> 2
// STEP_END

// REMOVE_START
assert.equal(res1, 1)
assert.equal(res2, 0)
assert.equal(res3, 2) 
assert.equal(res4, 2) 
// REMOVE_END

// STEP_START sIsMember
// HIDE_START
await client.del('bikes:racing:france')
await client.del('bikes:racing:usa')
await client.sAdd('bikes:racing:france', 'bike:1', 'bike:2', 'bike:3')
await client.sAdd('bikes:racing:usa', 'bike:1', 'bike:4')
// HIDE_END
const res5 = await client.sIsMember('bikes:racing:usa', 'bike:1')
console.log(res5)  // >>> 1

const res6 = await client.sIsMember('bikes:racing:usa', 'bike:2')
console.log(res6)  // >>> 0
// STEP_END

// REMOVE_START
assert.equal(res5, 1)
assert.equal(res6, 0)
// REMOVE_END

// STEP_START sinster
// HIDE_START
await client.del('bikes:racing:france')
await client.del('bikes:racing:usa')
await client.sAdd('bikes:racing:france', 'bike:1', 'bike:2', 'bike:3')
await client.sAdd('bikes:racing:usa', 'bike:1', 'bike:4')
// HIDE_END
const res7 = await client.sInter('bikes:racing:france', 'bikes:racing:usa')
console.log(res7)  // >>> {'bike:1'}
// STEP_END

// REMOVE_START
assert.deepEqual(res7, [ 'bike:1' ])
// REMOVE_END

// STEP_START sCard
// HIDE_START
await client.del('bikes:racing:france')
await client.sAdd('bikes:racing:france', ['bike:1', 'bike:2', 'bike:3'])
// HIDE_END
const res8 = await client.sCard('bikes:racing:france')
console.log(res8)  // >>> 3
// STEP_END

// REMOVE_START
assert.equal(res8, 3)
await client.del('bikes:racing:france')
// REMOVE_END

// STEP_START sAdd_sMembers
const res9 = await client.sAdd('bikes:racing:france', ['bike:1', 'bike:2', 'bike:3'])
console.log(res9)  // >>> 3

const res10 = await client.sMembers('bikes:racing:france')
console.log(res10)  // >>> ['bike:1', 'bike:2', 'bike:3']
// STEP_END

// REMOVE_START
assert.equal(res9, 3)
assert.deepEqual(res10.sort(), ['bike:1', 'bike:2', 'bike:3'])
// REMOVE_END

// STEP_START smIsMember
const res11 = await client.sIsMember('bikes:racing:france', 'bike:1')
console.log(res11)  // >>> 1

const res12 = await client.smIsMember('bikes:racing:france', ['bike:2', 'bike:3', 'bike:4'])
console.log(res12)  // >>> [1, 1, 0]
// STEP_END

// REMOVE_START
assert.equal(res11, 1)
assert.deepEqual(res12, [1, 1, 0])
// REMOVE_END

// STEP_START sDiff
await client.sAdd('bikes:racing:france', ['bike:1', 'bike:2', 'bike:3'])
await client.sAdd('bikes:racing:usa', ['bike:1', 'bike:4'])
const res13 = await client.sDiff(['bikes:racing:france', 'bikes:racing:usa'])
console.log(res13)  // >>> [ 'bike:2', 'bike:3' ]
// STEP_END

// REMOVE_START
assert.deepEqual(res13.sort(), ['bike:2', 'bike:3'].sort())
await client.del('bikes:racing:france')
await client.del('bikes:racing:usa')
// REMOVE_END

// STEP_START multisets
await client.sAdd('bikes:racing:france', ['bike:1', 'bike:2', 'bike:3'])
await client.sAdd('bikes:racing:usa', ['bike:1', 'bike:4'])
await client.sAdd('bikes:racing:italy', ['bike:1', 'bike:2', 'bike:3', 'bike:4'])

const res14 = await client.sInter(
  ['bikes:racing:france', 'bikes:racing:usa', 'bikes:racing:italy']
)
console.log(res14)  // >>> ['bike:1']

const res15 = await client.sUnion(
  ['bikes:racing:france', 'bikes:racing:usa', 'bikes:racing:italy']
)
console.log(res15)  // >>> ['bike:1', 'bike:2', 'bike:3', 'bike:4']

const res16 = await client.sDiff(['bikes:racing:france', 'bikes:racing:usa', 'bikes:racing:italy'])
console.log(res16)  // >>> []

const res17 = await client.sDiff(['bikes:racing:usa', 'bikes:racing:france'])
console.log(res17)  // >>> ['bike:4']

const res18 = await client.sDiff(['bikes:racing:france', 'bikes:racing:usa'])
console.log(res18)  // >>> ['bike:2', 'bike:3']
// STEP_END

// REMOVE_START
assert.deepEqual(res14, ['bike:1'])
assert.deepEqual(res15.sort(), ['bike:1', 'bike:2', 'bike:3', 'bike:4'])
assert.deepEqual(res16, [])
assert.deepEqual(res17, ['bike:4'])
assert.deepEqual(res18.sort(), ['bike:2', 'bike:3'].sort())
await client.del('bikes:racing:france')
await client.del('bikes:racing:usa')
await client.del('bikes:racing:italy')
// REMOVE_END

// STEP_START sRem
await client.sAdd('bikes:racing:france', ['bike:1', 'bike:2', 'bike:3', 'bike:4', 'bike:5'])

const res19 = await client.sRem('bikes:racing:france', 'bike:1')
console.log(res19)  // >>> 1

const res20 = await client.sPop('bikes:racing:france')
console.log(res20)  // >>> bike:3 or other random value

const res21 = await client.sMembers('bikes:racing:france')
console.log(res21)  // >>> ['bike:2', 'bike:4', 'bike:5']; depends on previous result

const res22 = await client.sRandMember('bikes:racing:france')
console.log(res22)  // >>> bike:4 or other random value
// STEP_END

// REMOVE_START
assert.equal(res19, 1)
await client.close()
// none of the other results are deterministic
// REMOVE_END
