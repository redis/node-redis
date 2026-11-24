// Add several values with their scores to a Sorted Set,
// then retrieve them using ZSCAN, ZRANGE, and ZINTER.

import { createClient } from 'redis';

const client = createClient();
await client.connect();

await client.zAdd('mysortedset', [
  {
    score: 99,
    value: 'Ninety Nine'
  },
  {
    score: 100,
    value: 'One Hundred'
  },
  {
    score: 101,
    value: 'One Hundred and One'
  }
]);

// Get all of the values/scores from the sorted set using
// the scan approach:
// https://redis.io/commands/zscan
for await (const membersWithScores of client.zScanIterator('mysortedset')) {
  console.log('Batch of members with scores:', membersWithScores);

  for (const memberWithScore of membersWithScores) {
    console.log('Individual member with score:', memberWithScore);
  }
}

// Get all values and scores from the sorted set in reverse order
// (highest score first) using ZRANGE with the REV modifier:
// https://redis.io/commands/zrange
const reverseOrder = await client.zRangeWithScores('mysortedset', 0, -1, {
  REV: true
});
console.log('Sorted set in reverse order (REV):', reverseOrder);

await client.zAdd('anothersortedset', [
  {
    score: 99,
    value: 'Ninety Nine'
  },
  {
    score: 102,
    value: 'One Hundred and Two'
  }
]);

// Intersection of two sorted sets
const intersection = await client.zInter([
  { key: 'mysortedset', weight: 1 },
  { key: 'anothersortedset', weight: 1 }
]);
console.log('Intersection:', intersection);

client.close();
