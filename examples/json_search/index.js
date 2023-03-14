// HIDE_START
// Step 1
import { createClient, SchemaFieldTypes } from 'redis';
const client = createClient();
await client.connect();
// HIDE_END

// Create an index.
// https://redis.io/commands/ft.create/
try {
  await client.ft.create('idx:users', {
    '$.name': {
      type: SchemaFieldTypes.TEXT,
      SORTABLE: 'UNF'
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
