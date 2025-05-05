// This example demonstrates the use of the DUMP and RESTORE commands

import { createClient, RESP_TYPES } from 'redis';

const client = await createClient({
  commandOptions: {
    typeMapping: {
      [RESP_TYPES.BLOB_STRING]: Buffer
    }
  }
}).on('error', err => {
  console.log('Redis Client Error', err);
}).connect();

// Make sure the source key exists
await client.set('source', 'value');

// Make sure destination doesnt exist
await client.del('destination');

// DUMP a specific key into a local variable
const dump = await client.dump('source');

// RESTORE into a new key
await client.restore('destination', 0, dump);

// RESTORE and REPLACE an existing key
await client.restore('destination', 0, dump, {
  REPLACE: true
});

await client.close();
