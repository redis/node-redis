// EXAMPLE: query_geo
// HIDE_START
import assert from 'node:assert';
import fs from 'node:fs';
import { createClient } from 'redis';
import { SCHEMA_FIELD_TYPE } from '@redis/search';

const client = createClient();

await client.connect().catch(console.error);

// create index
await client.ft.create('idx:bicycle', {
  '$.store_location': {
    type: SCHEMA_FIELD_TYPE.GEO,
    AS: 'store_location'
  },
   '$.pickup_zone': {
    type: SCHEMA_FIELD_TYPE.GEOSHAPE,
    AS: 'pickup_zone'
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

// STEP_START geo1
const res1= await client.ft.search('idx:bicycle', '@store_location:[-0.1778 51.5524 20 mi]');
console.log(res1.total); // >>> 1
console.log(res1); // >>> {total: 1, documents: [ { id: 'bicycle:5', value: [Object: null prototype] } ]}
// REMOVE_START
assert.strictEqual(res1.total, 1);
// REMOVE_END
// STEP_END

// STEP_START geo2
const params_dict_geo2 = { bike: 'POINT(-0.1278 51.5074)' };
const q_geo2 = '@pickup_zone:[CONTAINS $bike]';
const res2 = await client.ft.search('idx:bicycle', q_geo2, { PARAMS: params_dict_geo2, DIALECT: 3 });
console.log(res2.total); // >>> 1
console.log(res2); // >>> {total: 1, documents: [ { id: 'bicycle:5', value: [Object: null prototype] } ]}
// REMOVE_START
assert.strictEqual(res2.total, 1);
// REMOVE_END
// STEP_END

// STEP_START geo3
const params_dict_geo3 = { europe: 'POLYGON((-25 35, 40 35, 40 70, -25 70, -25 35))' };
const q_geo3 = '@pickup_zone:[WITHIN $europe]';
const res3 = await client.ft.search('idx:bicycle', q_geo3, { PARAMS: params_dict_geo3, DIALECT: 3 });
console.log(res3.total); // >>> 5
console.log(res3); // >>>
// {
//   total: 5,
//   documents: [
//     { id: 'bicycle:5', value: [Object: null prototype] },
//     { id: 'bicycle:6', value: [Object: null prototype] },
//     { id: 'bicycle:7', value: [Object: null prototype] },
//     { id: 'bicycle:8', value: [Object: null prototype] },
//     { id: 'bicycle:9', value: [Object: null prototype] }
//   ]
// }
// REMOVE_START
assert.strictEqual(res3.total, 5);
// REMOVE_END
// STEP_END

// REMOVE_START
// destroy index and data
await client.ft.dropIndex('idx:bicycle', { DD: true });
await client.close();
// REMOVE_END