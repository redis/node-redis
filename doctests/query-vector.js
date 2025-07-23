// EXAMPLE: query_vector
// HIDE_START
import assert from 'node:assert';
import fs from 'node:fs';
import { createClient } from 'redis';
import { SCHEMA_FIELD_TYPE, SCHEMA_VECTOR_FIELD_ALGORITHM } from '@redis/search';
import { pipeline } from '@xenova/transformers';

function float32Buffer(arr) {
  const floatArray = new Float32Array(arr);
  const float32Buffer = Buffer.from(floatArray.buffer);
  return float32Buffer;
}

async function embedText(sentence) {
  let modelName = 'Xenova/all-MiniLM-L6-v2';
  let pipe = await pipeline('feature-extraction', modelName);

  let vectorOutput = await pipe(sentence, {
      pooling: 'mean',
      normalize: true,
  });

  const embedding = Object.values(vectorOutput?.data);

  return embedding;
}

const vector_query = float32Buffer(await embedText('That is a very happy person'));

const client = createClient();
await client.connect().catch(console.error);

// create index
await client.ft.create('idx:bicycle', {
    '$.description': {
      type: SCHEMA_FIELD_TYPE.TEXT,
      AS: 'description'
    },
    '$.description_embeddings': {
        type: SCHEMA_FIELD_TYPE.VECTOR,
        TYPE: 'FLOAT32',
        ALGORITHM: SCHEMA_VECTOR_FIELD_ALGORITHM.FLAT,
        DIM: 384,
        DISTANCE_METRIC: 'COSINE',
        AS: 'vector'
    }
}, {
    ON: 'JSON',
    PREFIX: 'bicycle:'
});

// load data
const bicycles = JSON.parse(fs.readFileSync('data/query_vector.json', 'utf8'));

await Promise.all(
  bicycles.map((bicycle, bid) => {
      return client.json.set(`bicycle:${bid}`, '$', bicycle);
  })
);
// HIDE_END

// STEP_START vector1
const res1 = await client.ft.search('idx:bicycle', 
  '*=>[KNN 3 @vector $query_vector AS score]', {
    PARAMS: { query_vector: vector_query },
    RETURN: ['description'],
    DIALECT: 2
  }
);
console.log(res1.total); // >>> 3
console.log(res1); // >>>
//{
//  total: 3,
//  documents: [
//    { id: 'bicycle:0', value: [Object: null prototype] {} },
//    { id: 'bicycle:2', value: [Object: null prototype] {} },
//    { id: 'bicycle:9', value: [Object: null prototype] {} }
//  ]
//}
// REMOVE_START
assert.strictEqual(res1.total, 3);
// REMOVE_END
// STEP_END

// STEP_START vector2
const res2 = await client.ft.search('idx:bicycle', 
  '@vector:[VECTOR_RANGE 0.9 $query_vector]=>{$YIELD_DISTANCE_AS: vector_dist}', {
    PARAMS: { query_vector: vector_query },
    SORTBY: 'vector_dist',
    RETURN: ['vector_dist', 'description'],
    DIALECT: 2
  }
);
console.log(res2.total); // >>> 1
console.log(res2); // >>>
//{
//  total: 1,
//  documents: [ { id: 'bicycle:0', value: [Object: null prototype] } ]
//}
// REMOVE_START
assert.strictEqual(res2.total, 1);
// REMOVE_END
// STEP_END

// REMOVE_START
// destroy index and data
await client.ft.dropIndex('idx:bicycle', { DD: true });
await client.close();
// REMOVE_END