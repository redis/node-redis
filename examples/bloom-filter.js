// This example demonstrates the use of the Bloom Filter 
// in the RedisBloom module (https://redis.io/docs/stack/bloom/)

import { createClient } from 'redis';

const client = createClient();

await client.connect();

// Delete any pre-existing Bloom Filter.
await client.del('mybloom');

// Reserve a Bloom Filter with configurable error rate and capacity.
// https://redis.io/commands/bf.reserve/
try {
  await client.bf.reserve('mybloom', 0.01, 1000);
  console.log('Reserved Bloom Filter.');
} catch (e) {
  if (e.message.endsWith('item exists')) {
    console.log('Bloom Filter already reserved.');
  } else {
    console.log('Error, maybe RedisBloom is not installed?:');
    console.log(e);
  }
}

// Add items to Bloom Filter individually with BF.ADD command.
// https://redis.io/commands/bf.add/
await Promise.all([
  client.bf.add('mybloom', 'leibale'),
  client.bf.add('mybloom', 'simon'),
  client.bf.add('mybloom', 'guy'),
  client.bf.add('mybloom', 'suze'),
  client.bf.add('mybloom', 'brian'),
  client.bf.add('mybloom', 'steve'),
  client.bf.add('mybloom', 'kyle'),
  client.bf.add('mybloom', 'josefin'),
  client.bf.add('mybloom', 'alex'),
  client.bf.add('mybloom', 'nava'),
]);

// Add multiple items to Bloom Filter at once with BF.MADD command.
// https://redis.io/commands/bf.madd/
await client.bf.mAdd('mybloom', [
  'kaitlyn', 
  'rachel'
]);

console.log('Added members to Bloom Filter.');

// Check whether a member exists with the BF.EXISTS command.
// https://redis.io/commands/bf.exists/
const simonExists = await client.bf.exists('mybloom', 'simon');
console.log(`simon ${simonExists ? 'may' : 'does not'} exist in the Bloom Filter.`);

// Check whether multiple members exist with the BF.MEXISTS command.
// https://redis.io/commands/bf.mexists/
const [ lanceExists, leibaleExists ] = await client.bf.mExists('mybloom', [
  'lance',
  'leibale'
]);

console.log(`lance ${lanceExists ? 'may' : 'does not'} exist in the Bloom Filter.`);
console.log(`leibale ${leibaleExists ? 'may' : 'does not'} exist in the Bloom Filter.`);

// Get stats for the Bloom Filter with the BF.INFO command.
// https://redis.io/commands/bf.info/
const info = await client.bf.info('mybloom');
// info looks like this:
//
//  {
//    capacity: 1000,
//    size: 1531,
//    numberOfFilters: 1,
//    numberOfInsertedItems: 12,
//    expansionRate: 2
//  }
console.log(info);

await client.quit();
