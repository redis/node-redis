// EXAMPLE: query_combined
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

  if (vectorOutput == null) {
    throw new Error('vectorOutput is undefined');
  }

  const embedding = Object.values(vectorOutput.data);

  return embedding;
}

let vector_query = float32Buffer(await embedText('That is a very happy person'));

const client = createClient();
await client.connect().catch(console.error);

// create index
await client.ft.create('idx:bicycle', {
    '$.description': {
      type: SCHEMA_FIELD_TYPE.TEXT,
      AS: 'description'
    },
    '$.condition': {
      type: SCHEMA_FIELD_TYPE.TAG,
      AS: 'condition'
    },
    '$.price': {
      type: SCHEMA_FIELD_TYPE.NUMERIC,
      AS: 'price'
    },
    '$.description_embeddings': {
        type: SCHEMA_FIELD_TYPE.VECTOR,
        TYPE: 'FLOAT32',
        ALGORITHM: SCHEMA_VECTOR_FIELD_ALGORITHM.FLAT,
        DIM: 384,
        DISTANCE_METRIC: 'COSINE',
        AS: 'vector',
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

// STEP_START combined1
const res1 = await client.ft.search('idx:bicycle', '@price:[500 1000] @condition:{new}');
console.log(res1.total); // >>> 1
console.log(res1); // >>>
//{
//  total: 1,
//  documents: [ { id: 'bicycle:5', value: [Object: null prototype] } ]
//}
// REMOVE_START
assert.strictEqual(res1.total, 1);
// REMOVE_END
// STEP_END

// STEP_START combined2
const res2 = await client.ft.search('idx:bicycle', 'kids @price:[500 1000] @condition:{used}');
console.log(res2.total); // >>> 1
console.log(res2); // >>>
// {
//   total: 1,
//   documents: [ { id: 'bicycle:2', value: [Object: null prototype] } ]
// }
// REMOVE_START
assert.strictEqual(res2.total, 1);
// REMOVE_END
// STEP_END

// STEP_START combined3
const res3 = await client.ft.search('idx:bicycle', '(kids | small) @condition:{used}');
console.log(res3.total); // >>> 2
console.log(res3); // >>>
//{
//  total: 2,
//  documents: [
//    { id: 'bicycle:2', value: [Object: null prototype] },
//    { id: 'bicycle:1', value: [Object: null prototype] }
//  ]
//}
// REMOVE_START
assert.strictEqual(res3.total, 2);
// REMOVE_END
// STEP_END

// STEP_START combined4
const res4 = await client.ft.search('idx:bicycle', '@description:(kids | small) @condition:{used}');
console.log(res4.total); // >>> 2
console.log(res4); // >>>
//{
//  total: 2,
//  documents: [
//    { id: 'bicycle:2', value: [Object: null prototype] },
//    { id: 'bicycle:1', value: [Object: null prototype] }
//  ]
//}
// REMOVE_START
assert.strictEqual(res4.total, 2);
// REMOVE_END
// STEP_END

// STEP_START combined5
const res5 = await client.ft.search('idx:bicycle', '@description:(kids | small) @condition:{new | used}');
console.log(res5.total); // >>> 3
console.log(res5); // >>>
//{
//  total: 3,
//  documents: [
//    { id: 'bicycle:1', value: [Object: null prototype] },
//    { id: 'bicycle:0', value: [Object: null prototype] },
//    { id: 'bicycle:2', value: [Object: null prototype] }
//  ]
//}
// REMOVE_START
assert.strictEqual(res5.total, 3);
// REMOVE_END
// STEP_END

// STEP_START combined6
const res6 = await client.ft.search('idx:bicycle', '@price:[500 1000] -@condition:{new}');
console.log(res6.total); // >>> 2
console.log(res6); // >>>
//{
//  total: 2,
//  documents: [
//    { id: 'bicycle:2', value: [Object: null prototype] },
//    { id: 'bicycle:9', value: [Object: null prototype] }
//  ]
//}
// REMOVE_START
assert.strictEqual(res6.total, 2);
// REMOVE_END
// STEP_END

// STEP_START combined7
const res7 = await client.ft.search('idx:bicycle', 
  '(@price:[500 1000] -@condition:{new})=>[KNN 3 @vector $query_vector]', {
    PARAMS: { query_vector: vector_query },
    DIALECT: 2
  }
);
console.log(res7.total); // >>> 2
console.log(res7); // >>>
//{
//  total: 2,
//  documents: [
//    { id: 'bicycle:2', value: [Object: null prototype] },
//    { id: 'bicycle:9', value: [Object: null prototype] }
//  ]
//}
// REMOVE_START
assert.strictEqual(res7.total, 2);
// REMOVE_END
// STEP_END

// REMOVE_START
// destroy index and data
await client.ft.dropIndex('idx:bicycle', { DD: true });
await client.close();
// REMOVE_END