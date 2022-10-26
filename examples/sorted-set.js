// Add several values with their scores to a Sorted Set,
// then retrieve them all using ZSCAN.

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
for await (const memberWithScore of client.zScanIterator('mysortedset')) {
  console.log(memberWithScore);
}

await client.quit();
