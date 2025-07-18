// EXAMPLE: query_em
// HIDE_START
import assert from 'node:assert';
import fs from 'node:fs';
import { createClient, SCHEMA_FIELD_TYPE } from 'redis';

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

// STEP_START em1
const res1 = await client.ft.search('idx:bicycle', '@price:[270 270]');
console.log(res1.total); // >>> 1
// REMOVE_START
assert.strictEqual(res1.total, 1);
// REMOVE_END

try {
    const res2 = await client.ft.search('idx:bicycle', '@price:[270]');
    console.log(res2.total); // >>> 1
    assert.strictEqual(res2.total, 1);
} catch (err) {
    console.log("'@price:[270]' syntax not yet supported.");
}

try {
    const res3 = await client.ft.search('idx:bicycle', '@price==270');
    console.log(res3.total); // >>> 1
    assert.strictEqual(res3.total, 1);
} catch (err) {
    console.log("'@price==270' syntax not yet supported.");
}

// FILTER is not supported
// const res4 = await client.ft.search('idx:bicycle', '*', {
//   FILTER: {
//       field: 'price',
//       min: 270,
//       max: 270,
//   }
// });
// console.log(res4.total); // >>> 1
// REMOVE_START
// assert.strictEqual(res4.total, 10);
// REMOVE_END
// STEP_END

// STEP_START em2
const res5 = await client.ft.search('idx:bicycle', '@condition:{new}');
console.log(res5.total); // >>> 5
// REMOVE_START
assert.strictEqual(res5.total, 5);
// REMOVE_END
// STEP_END

// STEP_START em3
await client.ft.create('idx:email', {
  '$.email': {
    type: SCHEMA_FIELD_TYPE.TAG,
    AS: 'email'
  }
}, {
  ON: 'JSON',
  PREFIX: 'key:'
})

await client.json.set('key:1', '$', { email: 'test@redis.com' });

try {
    const res6 = await client.ft.search('idx:email', 'test@redis.com', { DIALECT: 2 });
    console.log(res6);
} catch (err) {
    console.log("'test@redis.com' syntax not yet supported.");
}
// REMOVE_START
await client.ft.dropIndex('idx:email', { DD: true });
// REMOVE_END
// STEP_END

// STEP_START em4
const res7 = await client.ft.search('idx:bicycle', '@description:"rough terrain"');
console.log(res7.total); // >>> 1 (Result{1 total, docs: [Document {'id': 'bicycle:8'...)
// REMOVE_START
assert.strictEqual(res7.total, 1);
// REMOVE_END
// STEP_END

// REMOVE_START
// destroy index and data
await client.ft.dropIndex('idx:bicycle', { DD: true });
await client.close();
// REMOVE_END
