// EXAMPLE: query_em
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

// STEP_START em1
let res = await client.ft.search('idx:bicycle', '@price:[270 270]');
console.log(res.total); // >>> 1
// REMOVE_START
assert.strictEqual(res.total, 1);
// REMOVE_END

try {
    res = await client.ft.search('idx:bicycle', '@price:[270]');
    console.log(res.total); // >>> 1
    assert.strictEqual(res.total, 1);
} catch (err) {
    console.log("'@price:[270]' syntax not yet supported.");
}

try {
    res = await client.ft.search('idx:bicycle', '@price==270');
    console.log(res.total); // >>> 1
    assert.strictEqual(res.total, 1);
} catch (err) {
    console.log("'@price==270' syntax not yet supported.");
}

// FILTER is not supported
// res = await client.ft.search('idx:bicycle', '*', {
//   FILTER: {
//       field: 'price',
//       min: 270,
//       max: 270,
//   }
// });
// console.log(res.total); // >>> 1
// REMOVE_START
// assert.strictEqual(res.total, 10);
// REMOVE_END
// STEP_END

// STEP_START em2
res = await client.ft.search('idx:bicycle', '@condition:{new}');
console.log(res.total); // >>> 5
// REMOVE_START
assert.strictEqual(res.total, 5);
// REMOVE_END
// STEP_END

// STEP_START em3
await client.ft.create('idx:email', {
  '$.email': {
    type: SchemaFieldTypes.TAG,
    AS: 'email'
  }
}, {
  ON: 'JSON',
  PREFIX: 'key:'
})

await client.json.set('key:1', '$', { email: 'test@redis.com' });

try {
    res = await client.ft.search('idx:email', 'test@redis.com', { DIALECT: 2 });
    console.log(res);
} catch (err) {
    console.log("'test@redis.com' syntax not yet supported.");
}
// REMOVE_START
await client.ft.dropIndex('idx:email', { DD: true });
// REMOVE_END
// STEP_END

// STEP_START em4
res = await client.ft.search('idx:bicycle', '@description:"rough terrain"');
console.log(res.total); // >>> 1 (Result{1 total, docs: [Document {'id': 'bicycle:8'...)
// REMOVE_START
assert.strictEqual(res.total, 1);
// REMOVE_END
// STEP_END

// REMOVE_START
// destroy index and data
await client.ft.dropIndex('idx:bicycle', { DD: true });
await client.disconnect();
// REMOVE_END
