// How to mix and match supported commands that have named functions with 
// commands sent as arbitrary strings in the same transaction context.
// Use this when working with new Redis commands that haven't been added to 
// node-redis yet, or when working with commands that have been added to Redis
// by modules other than those directly supported by node-redis.

import { createClient } from 'redis';

const client = createClient();

await client.connect();

// Build some data fixtures.
await Promise.all([
  client.hSet('hash1', { name: 'hash1', number: 1}),
  client.hSet('hash2', { name: 'hash2', number: 1}),
  client.hSet('hash3', { name: 'hash3', number: 3})
]);

// Outside of a transaction, use sendCommand to send arbitrary commands.
await client.sendCommand(['hset', 'hash2', 'number', '3']);

// In a transaction context, use addCommand to send arbitrary commands.
// addCommand can be mixed and matched with named command functions as
// shown.
const responses = await client
  .multi()
  .hGetAll('hash2')
  .addCommand(['hset', 'hash3', 'number', '4'])
  .hGet('hash3', 'number')
  .exec();

// responses will be:
// [ [Object: null prototype] { name: 'hash2', number: '3' }, 0, '4' ]
console.log(responses);

// Clean up fixtures.
await client.del(['hash1', 'hash2', 'hash3']);

await client.quit();
