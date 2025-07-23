// EXAMPLE: query_ft
// HIDE_START
import assert from 'node:assert';
import fs from 'node:fs';
import { createClient, SCHEMA_FIELD_TYPE } from 'redis';

const client = createClient();

await client.connect().catch(console.error);

// create index
await client.ft.create('idx:bicycle', {
  '$.model': {
    type: SCHEMA_FIELD_TYPE.TEXT,
    AS: 'model'
  },
  '$.brand': {
    type: SCHEMA_FIELD_TYPE.TEXT,
    AS: 'brand'
  },
  '$.description': {
    type: SCHEMA_FIELD_TYPE.TEXT,
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
const res1 = await client.ft.search('idx:bicycle', '@description: kids');
console.log(res1.total); // >>> 2
// REMOVE_START
assert.strictEqual(res1.total, 2);
// REMOVE_END
// STEP_END

// STEP_START ft2
const res2 = await client.ft.search('idx:bicycle', '@model: ka*');
console.log(res2.total); // >>> 1
// REMOVE_START
assert.strictEqual(res2.total, 1);
// REMOVE_END
// STEP_END

// STEP_START ft3
const res3 = await client.ft.search('idx:bicycle', '@brand: *bikes');
console.log(res3.total); // >>> 2
// REMOVE_START
assert.strictEqual(res3.total, 2);
// REMOVE_END
// STEP_END

// STEP_START ft4
const res4 = await client.ft.search('idx:bicycle', '%optamized%');
console.log(res4); // >>> { total: 1, documents: [ { id: 'bicycle:3', value: [Object: null prototype] } ]}
// REMOVE_START
assert.strictEqual(res4.total, 1);
// REMOVE_END
// STEP_END

// STEP_START ft5
const res5 = await client.ft.search('idx:bicycle', '%%optamised%%');
console.log(res5); // >>> { total: 1, documents: [ { id: 'bicycle:3', value: [Object: null prototype] } ]}
// REMOVE_START
assert.strictEqual(res5.total, 1);
// REMOVE_END
// STEP_END

// REMOVE_START
// destroy index and data
await client.ft.dropIndex('idx:bicycle', { DD: true });
await client.close();
// REMOVE_END