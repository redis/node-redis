// EXAMPLE: cmds_string
// REMOVE_START
import assert from "assert";
// REMOVE_END

// HIDE_START
import { createClient } from 'redis';

const client = createClient();
client.on('error', err => console.log('Redis Client Error', err));
await client.connect();
// HIDE_END

// STEP_START incr
await client.set("mykey", "10");
const value2 = await client.incr("mykey");
console.log(value2);
// returns 11
// REMOVE_START
assert.equal(value2, 11);
await client.del('mykey');
// REMOVE_END
// STEP_END

// HIDE_START
await client.quit();
// HIDE_END
