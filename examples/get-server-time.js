// Get the time from the Redis Server.

import { createClient } from 'redis';

const client = createClient();
await client.connect();

const serverTime = await client.time();
// In v5, TIME returns [unixTimestamp: string, microseconds: string] instead of Date
// Example: ['1708956789', '123456']
console.log(serverTime);

// Convert to JavaScript Date if needed
const [seconds, microseconds] = serverTime;
const date = new Date(parseInt(seconds) * 1000 + parseInt(microseconds) / 1000);
console.log('Converted to Date:', date);

client.close();
