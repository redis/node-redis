// Example to log traffic data at intersections for the city of San Francisco.
// Log license plates of each car scanned at each intersection and add to the intersections Hyperloglog.
// Reference: https://www.youtube.com/watch?v=MunL8nnwscQ

import { createClient } from 'redis';

const client = createClient();

await client.connect();

// Use `pfAdd` to add an element to a Hyperloglog, creating the Hyperloglog if necessary.
// await client.pfAdd(key, value)

// To get a count, the `pfCount` method is used.
// await client.pfCount(key)

try {
  // Corner of Market Street (ID: 12) and 10th street (ID:27).
  await client.pfAdd('count:sf:12:27', 'GHN34X');
  await client.pfAdd('count:sf:12:27', 'ECN94Y');
  await client.pfAdd('count:sf:12:27', 'VJL12V');
  await client.pfAdd('count:sf:12:27', 'ORV87O');

  // To get the count of Corner of Market Street (ID: 12) and 10th street (ID:27).
  const countForMarket10thStreet = await client.pfCount('count:sf:12:27');
  console.log(`Count for Market Street & 10th Street is ${countForMarket10thStreet}`);
  // Count for Market Street & 10th Street is 4.

  // Corner of Market Street (ID: 12) and 11 street (ID:26).
  await client.pfAdd('count:sf:12:26', 'GHN34X');
  await client.pfAdd('count:sf:12:26', 'ECN94Y');
  await client.pfAdd('count:sf:12:26', 'IRV84E');
  await client.pfAdd('count:sf:12:26', 'ORV87O');
  await client.pfAdd('count:sf:12:26', 'TEY34S');

  // To get the count of Corner of Market Street (ID: 12) and 11th street (ID:26).
  const countForMarket11thStreet = await client.pfCount('count:sf:12:26');
  console.log(`Count for Market Street & 11th Street is ${countForMarket11thStreet}`);
  // Count for Market Street & 11th Street is 5.

  // To merge the Hyperloglogs `count:sf:12:26` and `count:sf:12:27`.
  await client.pfMerge('count:merge', ['count:sf:12:27', 'count:sf:12:26']);
  const countMerge = await client.pfCount('count:merge');
  console.log(`Count for the merge is ${countMerge}`);
  // Count for the merge is 6.
} catch (e) {
  // something went wrong.
  console.error(e);
}

await client.quit();
