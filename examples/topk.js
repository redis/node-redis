// This example demonstrates the use of the Top K 
// in the RedisBloom module (https://redisbloom.io/)

import { createClient } from 'redis';

async function topK() {
  const client = createClient();

  await client.connect();

  // Delete any pre-existing Top K.
  await client.del('mytopk');

  // Reserve a Top K to track the 10 most common items.
  // https://oss.redis.com/redisbloom/TopK_Commands/#topkreserve
  try {
    await client.topK.reserve('mytopk', 10);
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

  // Check if a few team members are in the top 10 with TOPK.QUERY:
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

  // Get count estimate for some team members:
  const [ simonCount, lanceCount ] = await client.topK.count('mytopk', [
    'simon',
    'lance'
  ]);

  console.log(`Count estimate for simon: ${simonCount}.`);
  console.log(`Count estimate for lance: ${lanceCount}.`);
  
  await client.quit();
}

topK();
