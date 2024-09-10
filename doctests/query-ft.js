// EXAMPLE: query_ft
// HIDE_START
import assert from 'assert';
import fs from 'fs';
import { createClient, SchemaFieldTypes, AggregateGroupByReducers, AggregateSteps} from 'redis';

const client = createClient();

await client.connect();

// create index
await client.ft.create('idx:bicycle', {
  '$.model': {
    type: SchemaFieldTypes.TEXT,
    AS: 'model'
  },
  '$.brand': {
    type: SchemaFieldTypes.TEXT,
    AS: 'brand'
  },
  '$.description': {
    type: SchemaFieldTypes.TEXT,
    AS: 'description'
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

// STEP_START ft1
let res = await client.ft.search('idx:bicycle', '@description: kids');
console.log(res.total); // >>> 2
// REMOVE_START
assert.strictEqual(res.total, 2);
// REMOVE_END
// STEP_END

// STEP_START ft2
res = await client.ft.search('idx:bicycle', '@model: ka*');
console.log(res.total); // >>> 1
// REMOVE_START
assert.strictEqual(res.total, 1);
// REMOVE_END
// STEP_END

// STEP_START ft3
res = await client.ft.search('idx:bicycle', '@brand: *bikes');
console.log(res.total); // >>> 2
// REMOVE_START
assert.strictEqual(res.total, 2);
// REMOVE_END
// STEP_END

// STEP_START ft4
res = await client.ft.search('idx:bicycle', '%optamized%');
console.log(res); // >>> { total: 1, documents: [ { id: 'bicycle:3', value: [Object: null prototype] } ]}
// REMOVE_START
assert.strictEqual(res.total, 1);
// REMOVE_END
// STEP_END

// STEP_START ft5
res = await client.ft.search('idx:bicycle', '%%optamised%%');
console.log(res); // >>> { total: 1, documents: [ { id: 'bicycle:3', value: [Object: null prototype] } ]}
// REMOVE_START
assert.strictEqual(res.total, 1);
// REMOVE_END
// STEP_END

// REMOVE_START
// destroy index and data
await client.ft.dropIndex('idx:bicycle', { DD: true });
await client.disconnect();
// REMOVE_END
