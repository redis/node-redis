// EXAMPLE: query_range
// HIDE_START
import assert from 'node:assert';
import fs from 'node:fs';
import { createClient, SCHEMA_FIELD_TYPE,} from 'redis';

const client = createClient();

await client.connect().catch(console.error);

// create index
await client.ft.create('idx:bicycle', {
  '$.description': {
    type: SCHEMA_FIELD_TYPE.TEXT,
    AS: 'description'
  },
  '$.price': {
    type: SCHEMA_FIELD_TYPE.NUMERIC,
    AS: 'price'
  },
  '$.condition': {
    type: SCHEMA_FIELD_TYPE.TAG,
    AS: 'condition'
  }
}, {
    ON: 'JSON',
    PREFIX: 'bicycle:'
})

// load data
const bicycles = JSON.parse(fs.readFileSync('data/query_em.json', 'utf8'));

await Promise.all(
  bicycles.map((bicycle, bid) => {
      return client.json.set(`bicycle:${bid}`, '$', bicycle);
  })
);
// HIDE_END

// STEP_START range1
const res1 = await client.ft.search('idx:bicycle', '@price:[500 1000]');
console.log(res1.total); // >>> 3
// REMOVE_START
assert.strictEqual(res1.total, 3);
// REMOVE_END
// STEP_END

// STEP_START range2
// FILTER is not supported
// const res2 = await client.ft.search('idx:bicycle', '*', {
//   FILTER: {
//     field: 'price',
//     min: 500,
//     max: 1000,
//   }
// });
// console.log(res2.total); // >>> 3
// REMOVE_START
// assert.strictEqual(res2.total, 3);
// REMOVE_END
// STEP_END

// STEP_START range3
// FILTER is not supported
// const res3 = await client.ft.search('idx:bicycle', '*', {
//   FILTER: {
//     field: 'price',
//     min: '(1000',
//     max: '+inf,
//   }
// });
// console.log(res3.total); // >>> 5
// REMOVE_START
// assert.strictEqual(res3.total, 5);
// REMOVE_END
// STEP_END

// STEP_START range4
const res4 = await client.ft.search(
  'idx:bicycle',
  '@price:[-inf 2000]',
  {
    SORTBY: 'price',
    LIMIT: { from: 0, size: 5 }
  }
);
console.log(res4.total); // >>> 7
console.log(res4); // >>> { total: 7, documents: [ { id: 'bicycle:0', value: [Object: null prototype] }, { id: 'bicycle:7', value: [Object: null prototype] }, { id: 'bicycle:5', value: [Object: null prototype] }, { id: 'bicycle:2', value: [Object: null prototype] }, { id: 'bicycle:9', value: [Object: null prototype] } ] }
// REMOVE_START
assert.strictEqual(res4.total, 7);
// REMOVE_END
// STEP_END

// REMOVE_START
// destroy index and data
await client.ft.dropIndex('idx:bicycle', { DD: true });
await client.close();
// REMOVE_END