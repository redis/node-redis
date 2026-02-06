// This example demonstrates how to use RediSearch hybrid search (FT.HYBRID).
// Hybrid search combines text search with vector similarity search for more
// comprehensive and relevant results.

import {
  createClient,
  SCHEMA_FIELD_TYPE,
  SCHEMA_VECTOR_FIELD_ALGORITHM,
} from "redis";

const client = createClient();

await client.connect();

// Helper function to create a Float32Array vector as a Buffer
const createVectorBuffer = (values) => {
  return Buffer.from(new Float32Array(values).buffer);
};

// Create an index with text, tag, numeric, and vector fields...
const indexName = "idx:products";
try {
  // Documentation: https://redis.io/commands/ft.create/
  await client.ft.create(
    indexName,
    {
      description: SCHEMA_FIELD_TYPE.TEXT,
      category: SCHEMA_FIELD_TYPE.TAG,
      price: SCHEMA_FIELD_TYPE.NUMERIC,
      embedding: {
        type: SCHEMA_FIELD_TYPE.VECTOR,
        ALGORITHM: SCHEMA_VECTOR_FIELD_ALGORITHM.FLAT,
        TYPE: "FLOAT32",
        DIM: 4,
        DISTANCE_METRIC: "L2",
      },
    },
    {
      ON: "HASH",
      PREFIX: "noderedis:products",
    },
  );
} catch (e) {
  if (e.message === "Index already exists") {
    console.log("Index exists already, skipped creation.");
  } else {
    console.error(e);
    process.exit(1);
  }
}

// Add some sample product data with embeddings...
await Promise.all([
  client.hSet("noderedis:products:1", {
    description: "comfortable red running shoes",
    category: "footwear",
    price: "79",
    embedding: createVectorBuffer([1, 2, 7, 8]),
  }),
  client.hSet("noderedis:products:2", {
    description: "stylish blue sneakers",
    category: "footwear",
    price: "89",
    embedding: createVectorBuffer([1, 4, 7, 8]),
  }),
  client.hSet("noderedis:products:3", {
    description: "elegant red dress",
    category: "clothing",
    price: "129",
    embedding: createVectorBuffer([1, 2, 6, 5]),
  }),
  client.hSet("noderedis:products:4", {
    description: "warm winter jacket",
    category: "clothing",
    price: "199",
    embedding: createVectorBuffer([5, 6, 7, 8]),
  }),
]);

// Perform a hybrid search combining text search with vector similarity
// Documentation: https://redis.io/commands/ft.hybrid/
const results = await client.ft.hybrid(indexName, {
  // Text search component - full-text search on TEXT fields
  SEARCH: {
    query: "@description:red",
    YIELD_SCORE_AS: "text_score",
  },
  // Vector similarity component
  VSIM: {
    field: "@embedding",
    // Reference to the vector parameter (must match a key in PARAMS, prefixed with '$')
    vector: "$query_vector",
    YIELD_SCORE_AS: "vector_score",
    // Search method configuration - KNN or RANGE
    method: {
      type: "KNN",
      K: 10,
    },
  },
  // Combine method: RRF (Reciprocal Rank Fusion) or LINEAR
  COMBINE: {
    method: { type: "RRF", CONSTANT: 60 },
    YIELD_SCORE_AS: "combined_score",
  },
  // Fields to load from the documents
  // - Use `'*'` to load all fields from documents
  LOAD: ["@__key", "@description", "@category", "@price"],
  // Sort by combined score
  SORTBY: {
    fields: [{ field: "@combined_score", direction: "DESC" }],
  },
  // Limit results
  LIMIT: { offset: 0, count: 10 },
  // Query parameters - the param name must match the vector reference in VSIM
  // (e.g., '$query_vector' in VSIM.vector corresponds to 'query_vector' here)
  PARAMS: {
    query_vector: createVectorBuffer([1, 2, 6, 5]),
  },
});

// results:
// {
//   totalResults: 4,
//   executionTime: 0.879,
//   warnings: [],
//   results: [
//     {
//       text_score: '0.0404949945054',
//       __key: 'noderedis:products:3',
//       description: 'elegant red dress',
//       category: 'clothing',
//       price: '129',
//       vector_score: '1',
//       combined_score: '0.0327868852459'
//     },
//     {
//       text_score: '0.0358374231755',
//       __key: 'noderedis:products:1',
//       description: 'comfortable red running shoes',
//       category: 'footwear',
//       price: '79',
//       vector_score: '0.0909090909091',
//       combined_score: '0.0322580645161'
//     },
//     {
//       __key: 'noderedis:products:2',
//       description: 'stylish blue sneakers',
//       category: 'footwear',
//       price: '89',
//       vector_score: '0.0666666666667',
//       combined_score: '0.015873015873'
//     },
//     {
//       __key: 'noderedis:products:4',
//       description: 'warm winter jacket',
//       category: 'clothing',
//       price: '199',
//       vector_score: '0.0232558139535',
//       combined_score: '0.015625'
//     }
//   ]
// }

console.log(`Results found: ${results.totalResults}`);
console.log(`Execution time: ${results.executionTime}ms`);

for (const doc of results.results) {
  console.log(`${doc.__key} - ${doc.description} ($${doc.price})`);
  console.log(`  Category: ${doc.category}`);
  console.log(`  Combined score: ${doc.combined_score}`);
}

client.destroy();
