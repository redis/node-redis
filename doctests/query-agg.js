// EXAMPLE: query_agg
// HIDE_START
import assert from 'node:assert';
import fs from 'node:fs';
import { createClient } from 'redis';
import { SCHEMA_FIELD_TYPE, FT_AGGREGATE_STEPS, FT_AGGREGATE_GROUP_BY_REDUCERS } from '@redis/search';

const client = createClient();

await client.connect().catch(console.error);

// create index
await client.ft.create('idx:bicycle', {
  '$.condition': {
    type: SCHEMA_FIELD_TYPE.TAG,
    AS: 'condition'
  },
  '$.price': {
    type: SCHEMA_FIELD_TYPE.NUMERIC,
    AS: 'price'
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

// STEP_START agg1
const res1 = await client.ft.aggregate('idx:bicycle', '@condition:{new}', {
  LOAD: ['__key', 'price'],
  APPLY: {
    expression: '@price - (@price * 0.1)',
    AS: 'discounted'
  }
});

console.log(res1.results.length); // >>> 5
console.log(res1.results); // >>>
//[
//  [Object: null prototype] { __key: 'bicycle:0', price: '270' },
//  [Object: null prototype] { __key: 'bicycle:5', price: '810' },
//  [Object: null prototype] { __key: 'bicycle:6', price: '2300' },
//  [Object: null prototype] { __key: 'bicycle:7', price: '430' },
//  [Object: null prototype] { __key: 'bicycle:8', price: '1200' }
//]
// REMOVE_START
assert.strictEqual(res1.results.length, 5);
// REMOVE_END
// STEP_END

// STEP_START agg2
const res2 = await client.ft.aggregate('idx:bicycle', '*', {
  LOAD: ['@price'],
  STEPS: [{
      type: FT_AGGREGATE_STEPS.APPLY,
      expression: '@price<1000',
      AS: 'price_category'
    },{
      type: FT_AGGREGATE_STEPS.GROUPBY,
      properties: '@condition',
      REDUCE:[{
        type: FT_AGGREGATE_GROUP_BY_REDUCERS.SUM,
        property: '@price_category',
        AS: 'num_affordable'
      }]
    }]
});
console.log(res2.results.length); // >>> 3
console.log(res2.results); // >>>
//[[Object: null prototype] { condition: 'refurbished', num_affordable: '1' },
//  [Object: null prototype] { condition: 'used', num_affordable: '1' },
//  [Object: null prototype] { condition: 'new', num_affordable: '3' }
//]
// REMOVE_START
assert.strictEqual(res2.results.length, 3);
// REMOVE_END
// STEP_END

// STEP_START agg3
const res3 = await client.ft.aggregate('idx:bicycle', '*', {
  STEPS: [{
      type: FT_AGGREGATE_STEPS.APPLY,
      expression: "'bicycle'",
      AS: 'type'
    }, {
      type: FT_AGGREGATE_STEPS.GROUPBY,
      properties: '@type',
      REDUCE: [{
        type: FT_AGGREGATE_GROUP_BY_REDUCERS.COUNT,
        property: null,
        AS: 'num_total'
      }]
    }]
});
console.log(res3.results.length); // >>> 1
console.log(res3.results); // >>>
//[ [Object: null prototype] { type: 'bicycle', num_total: '10' } ]
// REMOVE_START
assert.strictEqual(res3.results.length, 1);
// REMOVE_END
// STEP_END

// STEP_START agg4
const res4 = await client.ft.aggregate('idx:bicycle', '*', {
  LOAD: ['__key'],
  STEPS: [{
      type: FT_AGGREGATE_STEPS.GROUPBY,
      properties: '@condition',
      REDUCE: [{
        type: FT_AGGREGATE_GROUP_BY_REDUCERS.TOLIST,
        property: '__key',
        AS: 'bicycles'
      }]
    }]
});
console.log(res4.results.length); // >>> 3
console.log(res4.results); // >>>
//[[Object: null prototype] {condition: 'refurbished', bicycles: [ 'bicycle:9' ]},
//  [Object: null prototype] {condition: 'used', bicycles: [ 'bicycle:1', 'bicycle:2', 'bicycle:3', 'bicycle:4' ]},
//  [Object: null prototype] {condition: 'new', bicycles: [ 'bicycle:5', 'bicycle:6', 'bicycle:7', 'bicycle:0', 'bicycle:8' ]}]
// REMOVE_START
assert.strictEqual(res4.results.length, 3);
// REMOVE_END
// STEP_END

// REMOVE_START
// destroy index and data
await client.ft.dropIndex('idx:bicycle', { DD: true });
await client.close();
// REMOVE_END