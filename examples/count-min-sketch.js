// This example demonstrates the use of the Count-Min Sketch
// in the RedisBloom module (https://redisbloom.io/)

import { createClient } from 'redis';

async function countMinSketch() {
  const client = createClient();

  await client.connect();

  // Delete any pre-existing Count-Min Sketch.
  await client.del('mycms');

  // Initialize a Count-Min Sketch with error rate and probability:
  // https://oss.redis.com/redisbloom/CountMinSketch_Commands/#cmsinitbyprob
  try {
    await client.cms.initByProb('mycms', 0.001, 0.01);
    console.log('Reserved Top K.');
  } catch (e) {
    console.log('Error, maybe RedisBloom is not installed?:');
    console.log(e);
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

  // Store actual counts for comparison with CMS.
  let actualCounts = {};

  // Randomly emit a team member and count them with the CMS.
  for (let n = 0; n < 1000; n++) {
    const teamMember = teamMembers[Math.floor(Math.random() * teamMembers.length)];
    await client.cms.incrBy('mycms', {
      item: teamMember,
      incrementBy: 1
    });

    actualCounts[teamMember] = actualCounts[teamMember] ? actualCounts[teamMember] + 1 : 1;

    console.log(`Incremented score for ${teamMember}.`);
  }

  // Get count estimate for some team members:
  // https://oss.redis.com/redisbloom/CountMinSketch_Commands/#cmsquery
  const [ alexCount, rachelCount ] = await client.cms.query('mycms', [
    'simon',
    'lance'
  ]);

  console.log(`Count estimate for alex: ${alexCount} (actual ${actualCounts.alex}).`);
  console.log(`Count estimate for rachel: ${rachelCount} (actual ${actualCounts.rachel}).`);

  // Get overall information about the Count-Min Sketch:
  // https://oss.redis.com/redisbloom/CountMinSketch_Commands/#cmsinfo
  const info = await client.cms.info('mycms');
  console.log('Count-Min Sketch info:');

  // info looks like this:
  // { 
  //   width: 2000, 
  //   depth: 7, 
  //   count: 1000 
  // }
  console.log(info);
  
  await client.quit();
}

countMinSketch();
