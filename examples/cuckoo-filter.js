// This example demonstrates the use of the Cuckoo Filter 
// in the RedisBloom module (https://redis.io/docs/stack/bloom/)

import { createClient } from 'redis';

const client = createClient();

await client.connect();

// Delete any pre-existing Cuckoo Filter.
await client.del('mycuckoo');

// Reserve a Cuckoo Filter with a capacity of 10000 items.
// https://redis.io/commands/cf.reserve/
try {
  await client.cf.reserve('mycuckoo', 10000);
  console.log('Reserved Cuckoo Filter.');
} catch (e) {
  console.log('Error, maybe RedisBloom is not installed?:');
  console.log(e);
}

// Add items to Cuckoo Filter individually with CF.ADD command.
// https://redis.io/commands/cf.add/
await Promise.all([
  client.cf.add('mycuckoo', 'leibale'),
  client.cf.add('mycuckoo', 'simon'),
  client.cf.add('mycuckoo', 'guy'),
  client.cf.add('mycuckoo', 'suze'),
  client.cf.add('mycuckoo', 'brian'),
  client.cf.add('mycuckoo', 'steve'),
  client.cf.add('mycuckoo', 'kyle'),
  client.cf.add('mycuckoo', 'josefin'),
  client.cf.add('mycuckoo', 'alex'),
  client.cf.add('mycuckoo', 'nava'),
]);

// Add items to the Cuckoo Filter only if they don't exist in it...
// https://redis.io/commands/cf.addnx/
const nxReply = await Promise.all([
  client.cf.addNX('mycuckoo', 'kaitlyn'), // New
  client.cf.addNX('mycuckoo', 'rachel'),  // New
  client.cf.addNX('mycuckoo', 'brian')  // Previously added
]);

console.log('Added members to Cuckoo Filter.');
console.log('nxReply:');

// nxReply looks like this:
// [ 
//   true, 
//   true, 
//   false 
// ]
console.log(nxReply);

// Check whether a member exists with the CF.EXISTS command.
// https://redis.io/commands/cf.exists/
const simonExists = await client.bf.exists('mycuckoo', 'simon');
console.log(`simon ${simonExists ? 'may' : 'does not'} exist in the Cuckoo Filter.`);

// Get stats for the Cuckoo Filter with the CF.INFO command:
// https://redis.io/commands/cf.info/
const info = await client.cf.info('mycuckoo');

// info looks like this:
// {
//   size: 16440,
//   numberOfBuckets: 8192,
//   numberOfFilters: 1,
//   numberOfInsertedItems: 12,
//   numberOfDeletedItems: 0,
//   bucketSize: 2,
//   expansionRate: 1,
//   maxIteration: 20
// }
console.log(info);

await client.quit();
