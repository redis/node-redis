// This example demonstrates how to use RediSearch and RedisJSON together.
// Requires both the RediSearch and RedisJSON modules:
// https://redis.io/docs/stack/search/
// https://redis.io/docs/stack/json/

import { createClient, SCHEMA_FIELD_TYPE, FT_AGGREGATE_GROUP_BY_REDUCERS, FT_AGGREGATE_STEPS } from 'redis';

const client = createClient();

await client.connect();

// Create an index.
// https://redis.io/commands/ft.create/
try {
  await client.ft.create('idx:users', {
    '$.name': {
      type: SCHEMA_FIELD_TYPE.TEXT,
      SORTABLE: true
    },
    '$.age': {
      type: SCHEMA_FIELD_TYPE.NUMERIC,
      AS: 'age'
    },
    '$.coins': {
      type: SCHEMA_FIELD_TYPE.NUMERIC,
      AS: 'coins'
    },
    '$.email': {
      type: SCHEMA_FIELD_TYPE.TAG,
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
        type: FT_AGGREGATE_STEPS.GROUPBY,
        REDUCE: [{
          type: FT_AGGREGATE_GROUP_BY_REDUCERS.AVG,
          property: 'age',
          AS: 'averageAge'
        }, {
          type: FT_AGGREGATE_GROUP_BY_REDUCERS.SUM,
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

client.destroy();
