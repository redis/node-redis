// This example demonstrates how to use RediSearch and RedisJSON together.
// Requires both the RediSearch and RedisJSON modules:
// https://redis.io/docs/stack/search/
// https://redis.io/docs/stack/json/

import { createClient, SchemaFieldTypes, AggregateGroupByReducers, AggregateSteps } from 'redis';

const client = createClient();

await client.connect();

// Create an index.
// https://redis.io/commands/ft.create/
try {
  await client.ft.create('idx:users', {
    '$.name': {
      type: SchemaFieldTypes.TEXT,
      SORTABLE: true
    },
    '$.age': {
      type: SchemaFieldTypes.NUMERIC,
      AS: 'age'
    },
    '$.coins': {
      type: SchemaFieldTypes.NUMERIC,
      AS: 'coins'
    },
    '$.email': {
      type: SchemaFieldTypes.TAG,
      AS: 'email'
    }
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
// https://redis.io/commands/json.set/
await Promise.all([
  client.json.set('noderedis:users:1', '$', {
    name: 'Alice',
    age: 32,
    coins: 100,
    email: 'alice@nonexist.com'
  }),
  client.json.set('noderedis:users:2', '$', {
    name: 'Bob',
    age: 23,
    coins: 15,
    email: 'bob@somewhere.gov'
  })
]);

// Search all users under 30
console.log('Users under 30 years old:');
console.log(
  // https://redis.io/commands/ft.search/
  JSON.stringify(
    await client.ft.search('idx:users', '@age:[0 30]'),
    null,
    2
  )
);
// {
//   "total": 1,
//   "documents": [
//     {
//       "id": "noderedis:users:2",
//       "value": {
//         "name": "Bob",
//         "age": 23,
//         "coins": 15,
//         "email": "bob@somewhere.gov"
//       }
//     }
//   ]
// }

// Find a user by email - note we need to escape . and @ characters
// in the email address.  This applies for other punctuation too.
// https://redis.io/docs/stack/search/reference/tags/#including-punctuation-in-tags
console.log('Users with email "bob@somewhere.gov":');
const emailAddress = 'bob@somewhere.gov'.replace(/[.@\\]/g, '\\$&');
console.log(
  JSON.stringify(
    await client.ft.search('idx:users', `@email:{${emailAddress}}`),
    null,
    2
  )
);
// {
//   "total": 1,
//   "documents": [
//     {
//       "id": "noderedis:users:2",
//       "value": {
//         "name": "Bob",
//         "age": 23,
//         "coins": 15,
//         "email": "bob@somewhere.gov"
//       }
//     }
//   ]
// }

// Some aggregrations, what's the average age and total number of coins...
// https://redis.io/commands/ft.aggregate/
console.log('Aggregation Demo:');
console.log(
  JSON.stringify(
    await client.ft.aggregate('idx:users', '*', {
      STEPS: [{
        type: AggregateSteps.GROUPBY,
        REDUCE: [{
          type: AggregateGroupByReducers.AVG,
          property: 'age',
          AS: 'averageAge'
        }, {
          type: AggregateGroupByReducers.SUM,
          property: 'coins',
          AS: 'totalCoins'
        }]
      }]
    }),
    null,
    2
  )
);
// {
//   "total": 1,
//   "results": [
//     {
//       "averageAge": "27.5",
//       "totalCoins": "115"
//     }
//   ]
// }

await client.quit();
