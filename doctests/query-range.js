// EXAMPLE: query_range
// HIDE_START
import assert from 'assert';
import fs from 'fs';
import { createClient, SchemaFieldTypes, AggregateGroupByReducers, AggregateSteps} from 'redis';

const client = createClient();

await client.connect();

// create index
await client.ft.create('idx:bicycle', {
  '$.description': {
    type: SchemaFieldTypes.TEXT,
    AS: 'description'
  },
  '$.price': {
    type: SchemaFieldTypes.NUMERIC,
    AS: 'price'
  },
  '$.condition': {
    type: SchemaFieldTypes.TAG,
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
let res = await client.ft.search('idx:bicycle', '@price:[500 1000]');
console.log(res.total); // >>> 3
// REMOVE_START
assert.strictEqual(res.total, 3);
// REMOVE_END
// STEP_END

// STEP_START range2
// FILTER is not supported
// res = await client.ft.search('idx:bicycle', '*', {
//   FILTER: {
//     field: 'price',
//     min: 500,
//     max: 1000,
//   }
// });
// console.log(res.total); // >>> 3
// REMOVE_START
// assert.strictEqual(res.total, 3);
// REMOVE_END
// STEP_END

// STEP_START range3
// FILTER is not supported
// res = await client.ft.search('idx:bicycle', '*', {
//   FILTER: {
//     field: 'price',
//     min: '(1000',
//     max: '+inf,
//   }
// });
// console.log(res.total); // >>> 5
// REMOVE_START
// assert.strictEqual(res.total, 5);
// REMOVE_END
// STEP_END

// STEP_START range4
res = await client.ft.search(
  'idx:bicycle',
  '@price:[-inf 2000]',
  {
    SORTBY: 'price',
    LIMIT: { from: 0, size: 5 }
  }
);
console.log(res.total); // >>> 7
console.log(res); // >>> { total: 7, documents: [ { id: 'bicycle:0', value: [Object: null prototype] }, { id: 'bicycle:7', value: [Object: null prototype] }, { id: 'bicycle:5', value: [Object: null prototype] }, { id: 'bicycle:2', value: [Object: null prototype] }, { id: 'bicycle:9', value: [Object: null prototype] } ] }
// REMOVE_START
assert.strictEqual(res.total, 7);
// REMOVE_END
// STEP_END

// REMOVE_START
// destroy index and data
await client.ft.dropIndex('idx:bicycle', { DD: true });
await client.disconnect();
// REMOVE_END
