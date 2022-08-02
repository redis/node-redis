// Get the time from the Redis Server.

import { createClient } from 'redis';

const client = createClient();
await client.connect();

const serverTime = await client.time();
// 2022-02-25T12:57:40.000Z { microseconds: 351346 }
console.log(serverTime);

await client.quit();
