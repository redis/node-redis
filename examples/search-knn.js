// This example demonstrates how to use RediSearch to index and query data
// stored in Redis hashes using vector similarity search.
//
// Inspired by RediSearch Python tests:
// https://github.com/RediSearch/RediSearch/blob/06e36d48946ea08bd0d8b76394a4e82eeb919d78/tests/pytests/test_vecsim.py#L96

import { createClient, SchemaFieldTypes } from "redis";

const client = createClient();

await client.connect();

// Create an index...
try {
  // Documentation: https://redis.io/docs/stack/search/reference/vectors/
  await client.sendCommand([
    "FT.CREATE",
    "idx:knn-example",
    "SCHEMA",
    "v",
    "VECTOR",
    "HNSW",
    "6",
    "TYPE",
    "FLOAT32",
    "DIM",
    "2",
    "DISTANCE_METRIC",
    "COSINE",
  ]);
} catch (e) {
  if (e.message === "Index already exists") {
    console.log("Index exists already, skipped creation.");
  } else {
    // Something went wrong, perhaps RediSearch isn't installed...
    console.error(e);
    process.exit(1);
  }
}

// This function accepts as input an array of numbers
// and returns as output a byte representation that Redis accepts.
const tobytes = (array) => Buffer.from(new Float32Array(array).buffer);

// Add some sample data...
// https://redis.io/commands/hset/
await Promise.all([
  client.hSet("noderedis:knn:a", { v: tobytes([0.1, 0.1]) }),
  client.hSet("noderedis:knn:b", { v: tobytes([0.1, 0.2]) }),
  client.hSet("noderedis:knn:c", { v: tobytes([0.1, 0.3]) }),
  client.hSet("noderedis:knn:d", { v: tobytes([0.1, 0.4]) }),
]);

// Perform a K-Nearest Neighbors vector similarity search
// Documentation: https://redis.io/docs/stack/search/reference/vectors/#pure-knn-queries
const results = await client.sendCommand([
  "FT.SEARCH",
  "idx:knn-example",
  "*=>[KNN 4 @v $BLOB AS dist]",
  "PARAMS",
  "2",
  "BLOB",
  tobytes([0.1, 0.1]),
  "SORTBY",
  "dist",
  "DIALECT",
  "2",
]);

// results:
// [
//   4,
//   'noderedis:knn:a',
//   [ 'dist', '5.96046447754e-08', 'v', '���=���=' ],
//   'noderedis:knn:b',
//   [ 'dist', '0.0513167381287', 'v', '���=��L>' ],
//   'noderedis:knn:c',
//   [ 'dist', '0.10557281971', 'v', '���=���>' ],
//   'noderedis:knn:d',
//   [ 'dist', '0.142507076263', 'v', '���=���>' ]
// ]

await client.quit();
