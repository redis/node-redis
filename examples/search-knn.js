// This example demonstrates how to use RediSearch to index and query data 
// stored in Redis hashes using vector similarity search.

import { createClient, SchemaFieldTypes } from 'redis';

const client = createClient();

await client.connect();

// Create an index...
try {
  // Documentation: https://redis.io/docs/stack/search/reference/vectors/
  await client.sendCommand([
    'FT.CREATE',
    'idx:vectors',
    'SCHEMA',
    'vector',
    'VECTOR',
    'HNSW',
    '6',
    'TYPE',
    'FLOAT32',
    'DIM',
    '512',
    'DISTANCE_METRIC',
    'COSINE',
  ]);
} catch (e) {
  if (e.message === 'Index already exists') {
    console.log('Index exists already, skipped creation.');
  } else {
    // Something went wrong, perhaps RediSearch isn't installed...
    console.error(e);
    process.exit(1);
  }
}

// Add some sample data...
// https://redis.io/commands/hset/
await Promise.all([
  client.hSet('noderedis:vectors:1', { vector: [0.4, -0.325, 4.3] },
  client.hSet('noderedis:vectors:2', { vector: [0.3, -0.3, 4.4] },
  client.hSet('noderedis:vectors:3', { vector: [-0.4, 0.325, -4.3] },
  client.hSet('noderedis:vectors:4', { vector: [38, 32.5, -8.1] },
]);

// Perform a K-Nearest Neighbors vector similarity search
// Documentation: https://redis.io/docs/stack/search/reference/vectors/#pure-knn-queries
const results = await client.ft.search(
  'idx:vectors', 

  // TODO how do we even get this syntax into client.ft.search
  FT.SEARCH idx "*=>[KNN 10 @vec $BLOB]" PARAMS 2 BLOB "\x12\xa9\xf5\x6c" SORTBY __vec_score DIALECT 2
);

// results:
// {
//   total: 2,
//   documents: [
//     { 
//       id: 'noderedis:animals:3',
//       value: {
//         name: 'Rover',
//         species: 'dog',
//         age: '9'
//       }
//     },
//     {
//       id: 'noderedis:animals:4',
//       value: {
//         name: 'Fido',
//         species: 'dog',
//         age: '7'
//       }
//     }
//   ]
// }

console.log(`Results found: ${results.total}.`);

for (const doc of results.documents) {
  console.log(doc);
}

await client.quit();
