// Add several values with their scores to a Sorted Set,
// then retrieve them all using ZSCAN, ZRANGE and ZREVRANGE.

import { createClient } from 'redis';

async function addToSortedSet() {
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
  console.log('Using ZCSCAN:');
  for await (const memberWithScore of client.zScanIterator('mysortedset')) {
    console.log(memberWithScore);
  }

  // Get all of the values/scores from the sorted set using
  // ZRANGE with WITHSCORES modifier, plus the REV modifier to
  // return the largest score first.  The REV modifier was 
  // introduced in Redis 6.2:
  // https://redis.io/commands/zrange
  console.log('');
  console.log('Using ZRANGE with WITHSCORES and REV options (Redis >=6.2.x)');
  console.log(
    await client.zRangeWithScores('mysortedset', 0, -1, {
      REV: true
    })
  );

  // Get all of the values/scores from the sorted set using 
  // ZREVRANGE, for versions of Redis prior to 6.2 (this is 
  // considered deprecated from 6.2 onwards)
  // https://redis.io/commands/zrevrange
  console.log('');
  console.log('TODO zRevRange appears to be missing?');
  
  await client.quit();
}

addToSortedSet();
