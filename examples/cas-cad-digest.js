// Atomic compare-and-set (CAS) and compare-and-delete (CAD) using digests
// for single-key optimistic concurrency control. 
// Requires Redis 8.4+ and the @node-rs/xxhash package.

import { createClient, digest } from 'redis';

const client = createClient();

await client.connect();

// Basic Digest Usage: get digest from Redis and verify with client-side calculation
await client.set('mykey', 'myvalue');
const serverDigest = await client.digest('mykey');
const clientDigest = await digest('myvalue');
console.log(`Server digest: ${serverDigest}`);
console.log(`Client digest: ${clientDigest}`);
console.log(`Digests match: ${serverDigest === clientDigest}`);

// Optimistic Locking with IFDEQ: update only if digest matches
await client.set('mycounter', '100');
const currentDigest = await digest('100');

// Update only if digest matches
const result1 = await client.set('mycounter', '150', {
  condition: 'IFDEQ',
  matchValue: currentDigest
});
console.log(`Update with matching digest: ${result1}`); // 'OK'

// IFDNE: update only if digest does NOT match
await client.set('myversion', 'v1.0.0');
const unwantedDigest = await digest('v0.9.0');

const result2 = await client.set('myversion', 'v2.0.0', {
  condition: 'IFDNE',
  matchValue: unwantedDigest
});
console.log(`Update when digest differs: ${result2}`); // 'OK'

// Conditional Delete with DELEX
await client.set('mysession', 'sessiondata');
const sessionDigest = await digest('sessiondata');

// Delete only if digest matches
const deleted = await client.delEx('mysession', {
  condition: 'IFDEQ',
  matchValue: sessionDigest
});
console.log(`Deleted with correct digest: ${deleted}`); // 1

client.close();
