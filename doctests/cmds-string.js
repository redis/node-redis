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

// STEP_START set_and_get
await client.set('bike:1', 'Process 134');
const value = await client.get('bike:1');
console.log(value);
// returns 'Process 134'
// REMOVE_START
assert.equal(value, 'Process 134');
await client.del('bike:1')
// REMOVE_END
// STEP_END

// HIDE_START
await client.quit();
// HIDE_END
