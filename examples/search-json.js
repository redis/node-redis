// This example demonstrates how to use RediSearch and RedisJSON together.

import { createClient, SchemaFieldTypes, AggregateGroupByReducers, AggregateSteps } from 'redis';

async function searchJSON() {
  const client = createClient();

  await client.connect();

  // Create an index.
  try {
    await client.ft.create('idx:users', {
      '$.name': {
        type: SchemaFieldTypes.TEXT,
        SORTABLE: 'UNF'
      },
      '$.age': SchemaFieldTypes.NUMERIC,
      '$.coins': SchemaFieldTypes.NUMERIC
    }, {
      ON: 'JSON',
      PREFIX: 'noderedis:users'
    });
  } catch (e) {
    if (e.message === 'Index already exists') {
      console.log('Index exists already, skipped creation.');
    } else {
      // Something went wrong, perhaps RediSearch isn't installed...
      console.error(e);
      process.exit(1);
    }
  }

  // Add some users.
  await Promise.all([
    client.json.set('noderedis:users:1', '$', {
      name: 'Alice',
      age: 32,
      coins: 100
    }),
    client.json.set('noderedis:users:2', '$', {
      name: 'Bob',
      age: 23,
      coins: 15
    })
  ]);

  // Search all users under 30
  // https://oss.redis.com/redisearch/Commands/#ftsearch
  // TODO: why "$.age:[-inf, 30]" does not work?
  console.log(
    await client.ft.search('idx:users', '*')
  );
  // {
  //   total: 1,
  //   documents: [...]
  // }

  // Some aggregrations, what's the average age and total number of coins...
  // https://oss.redis.com/redisearch/Commands/#ftaggregate
  console.log(
    await client.ft.aggregate('idx:users', '*', {
      STEPS: [{
        type: AggregateSteps.GROUPBY,
        REDUCE: [{
          type: AggregateGroupByReducers.AVG,
          property: '$.age',
          AS: 'averageAge'
        }, {
          type: AggregateGroupByReducers.SUM,
          property: '$.coins',
          AS: 'totalCoins'
        }]
      }]
    })
  );
  // {
  //   total: 2,
  //   results: [{
  //     averageAge: '27.5',
  //     totalCoins: '115'
  //   }]
  // }

  await client.quit();
}

searchJSON();
