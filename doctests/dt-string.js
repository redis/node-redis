// EXAMPLE: set_tutorial
// HIDE_START
import assert from 'assert';
import { createClient } from 'redis';

const client = createClient();
await client.connect();
// HIDE_END
// REMOVE_START
await client.flushDb();
// REMOVE_END

// STEP_START set_get
const res1 = await client.set("bike:1", "Deimos");
console.log(res1);  // OK
const res2 = await client.get("bike:1");
console.log(res2);  // Deimos
// STEP_END

// REMOVE_START
assert.equal(res1, 'OK');
assert.equal(res2, 'Deimos');
// REMOVE_END

// STEP_START setnx_xx
const res3 = await client.set("bike:1", "bike", {'NX': true});
console.log(res3);  // null
console.log(await client.get("bike:1"));  // Deimos
const res4 = await client.set("bike:1", "bike", {'XX': true});
console.log(res4);  // OK
// STEP_END

// REMOVE_START
assert.equal(res3, null);
assert.equal(res4, 'OK');
// REMOVE_END

// STEP_START mset
const res5 = await client.mSet([
  ["bike:1", "Deimos"],
  ["bike:2", "Ares"],
  ["bike:3", "Vanth"]
]);

console.log(res5);  // OK
const res6 = await client.mGet(["bike:1", "bike:2", "bike:3"]);
console.log(res6);  // ['Deimos', 'Ares', 'Vanth']
// STEP_END

// REMOVE_START
assert.equal(res5, 'OK');
assert.deepEqual(res6, ["Deimos", "Ares", "Vanth"]);
// REMOVE_END

// STEP_START incr
await client.set("total_crashes", 0);
const res7 = await client.incr("total_crashes");
console.log(res7); // 1
const res8 = await client.incrBy("total_crashes", 10);
console.log(res8); // 11
// STEP_END

// REMOVE_START
assert.equal(res7, 1);
assert.equal(res8, 11);

await client.close();
// REMOVE_END
