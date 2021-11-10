// Use Redis Search and Redis JSON

import { createClient, SchemaFieldTypes, AggregateGroupByReducers, AggregateSteps } from 'redis';

async function searchPlusJson() {
  const client = createClient();

  await client.connect();

  // Create an index
  await client.ft.create('users', {
    '$.name': {
      type: SchemaFieldTypes.TEXT,
      SORTABLE: 'UNF'
    },
    '$.age': SchemaFieldTypes.NUMERIC,
    '$.coins': SchemaFieldTypes.NUMERIC
  }, {
    ON: 'JSON'
  });

  // Add some users
  await Promise.all([
    client.json.set('users:1', '$', {
      name: 'Alice',
      age: 32,
      coins: 100
    }),
    client.json.set('users:2', '$', {
      name: 'Bob',
      age: 23,
      coins: 15
    })
  ]);

  // Search all users under 30
  // TODO: why "$.age:[-inf, 30]" does not work?
  console.log(
    await client.ft.search('users', '*')
  );
  // {
  //   total: 1,
  //   documents: [...]
  // }

  // Some aggrigrations
  console.log(
    await client.ft.aggregate('users', '*', {
      STEPS: [{
        type: AggregateSteps.GROUPBY,
        REDUCE: [{
          type: AggregateGroupByReducers.AVG,
          property: '$.age',
          AS: 'avarageAge'
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
  //     avarageAvg: '27.5',
  //     totalCoins: '115'
  //   }]
  // }

  await client.quit();
}

searchPlusJson();
