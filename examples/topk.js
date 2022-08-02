// This example demonstrates the use of the Top K 
// in the RedisBloom module (https://redis.io/docs/stack/bloom/)

import { createClient } from 'redis';

const client = createClient();

await client.connect();

// Delete any pre-existing Top K.
await client.del('mytopk');

// Reserve a Top K to track the 10 most common items.
// https://redis.io/commands/topk.reserve/
try {
  await client.topK.reserve('mytopk', 10, { width: 400, depth: 10, decay: 0.9 });
  console.log('Reserved Top K.');
} catch (e) {
  if (e.message.endsWith('key already exists')) {
    console.log('Top K already reserved.');
  } else {
    console.log('Error, maybe RedisBloom is not installed?:');
    console.log(e);
  }
}

const teamMembers = [
  'leibale',
  'simon',
  'guy',
  'suze',
  'brian',
  'steve',
  'kyleb',
  'kyleo',
  'josefin',
  'alex',
  'nava',
  'lance',
  'rachel',
  'kaitlyn'
];

// Add random counts for random team members with TOPK.INCRBY
// https://redis.io/commands/topk.incrby/
for (let n = 0; n < 1000; n++) {
  const teamMember = teamMembers[Math.floor(Math.random() * teamMembers.length)];
  const points = Math.floor(Math.random() * 1000) + 1;
  await client.topK.incrBy('mytopk', {
    item: teamMember,
    incrementBy: points
  });
  console.log(`Added ${points} points for ${teamMember}.`);
}

// List out the top 10 with TOPK.LIST
// https://redis.io/commands/topk.list/
const top10 = await client.topK.list('mytopk');
console.log('The top 10:');
// top10 looks like this:
//   [
//     'guy',     'nava',
//     'kaitlyn', 'brian',
//     'simon',   'suze',
//     'lance',   'alex',
//     'steve',   'kyleo'
// ]
console.log(top10);

// List out the top 10 with their counts (requires RedisBloom >=2.2.9)
// https://redis.io/commands/topk.list/
const top10WithCounts = await client.topK.listWithCount('mytopk');
console.log('The top 10 with counts:');
console.log(top10WithCounts);
// top10WithCounts looks like this:
// [
//    { item: 'suze', count: 42363 },
//    { item: 'lance', count: 41982 },
//    { item: 'simon', count: 41831 },
//    { item: 'steve', count: 39237 },
//    { item: 'guy', count: 39078 },
//    { item: 'kyleb', count: 37338 },
//    { item: 'leibale', count: 34230 },
//    { item: 'kyleo', count: 33812 },
//    { item: 'alex', count: 33679 },
//    { item: 'nava', count: 32663 }
// ]

// Check if a few team members are in the top 10 with TOPK.QUERY:
// https://redis.io/commands/topk.query/
const [ steve, suze, leibale, frederick ] = await client.topK.query('mytopk', [
  'steve',
  'suze',
  'leibale',
  'frederick'
]);

console.log(`steve ${steve === 1 ? 'is': 'is not'} in the top 10.`);
console.log(`suze ${suze === 1 ? 'is': 'is not'} in the top 10.`);
console.log(`leibale ${leibale === 1 ? 'is': 'is not'} in the top 10.`);
console.log(`frederick ${frederick === 1 ? 'is': 'is not'} in the top 10.`);

// Get count estimate for some team members with TOPK.COUNT:
// https://redis.io/commands/topk.count/
const [ simonCount, lanceCount ] = await client.topK.count('mytopk', [
  'simon',
  'lance'
]);

console.log(`Count estimate for simon: ${simonCount}.`);
console.log(`Count estimate for lance: ${lanceCount}.`);

await client.quit();
