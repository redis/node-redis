// EXAMPLE: cmds_generic
// REMOVE_START
import assert from "assert";
// REMOVE_END

// HIDE_START
import { createClient } from 'redis';

const client = createClient();
await client.connect();
// HIDE_END

// STEP_START del
let res = await client.set('key1', 'Hello');
console.log(res); // OK

res = await client.set('key2', 'World');
console.log(res); // OK

res = await client.del(['key1', 'key2', 'key3']);
console.log(res); // 2
// REMOVE_START
assert.equal(res, 2);
// REMOVE_END
// STEP_END

// STEP_START expire
res = await client.set('mykey', 'Hello');
console.log(res); // OK

res = await client.expire('mykey', 10);
console.log(res); // true

res = await client.ttl('mykey');
console.log(res); // 10
// REMOVE_START
assert.equal(res, 10);
// REMOVE_END

res = await client.set('mykey', 'Hello World');
console.log(res); // OK

res = await client.ttl('mykey');
console.log(res); // -1
// REMOVE_START
assert.equal(res, -1);
// REMOVE_END

res = await client.expire('mykey', 10, "XX");
console.log(res); // false
// REMOVE_START
assert.equal(res, false)
// REMOVE_END

res = await client.ttl('mykey');
console.log(res); // -1
// REMOVE_START
assert.equal(res, -1);
// REMOVE_END

res = await client.expire('mykey', 10, "NX");
console.log(res); // true
// REMOVE_START
assert.equal(res, true);
// REMOVE_END

res = await client.ttl('mykey');
console.log(res); // 10
// REMOVE_START
assert.equal(res, 10);
await client.del('mykey');
// REMOVE_END
// STEP_END

// STEP_START ttl
res = await client.set('mykey', 'Hello');
console.log(res); // OK

res = await client.expire('mykey', 10);
console.log(res); // true

res = await client.ttl('mykey');
console.log(res); // 10
// REMOVE_START
assert.equal(res, 10);
await client.del('mykey');
// REMOVE_END
// STEP_END

// STEP_START scan1
res = await client.sAdd('myset', ['1', '2', '3', 'foo', 'foobar', 'feelsgood']);
console.log(res); // 6

res = [];
for await (const value of client.sScanIterator('myset', { MATCH: 'f*' })) {
    res.push(value);
}
console.log(res); // ['foo', 'foobar', 'feelsgood']
// REMOVE_START
console.assert(res.sort().toString() === ['foo', 'foobar', 'feelsgood'].sort().toString());
await client.del('myset');
// REMOVE_END
// STEP_END

// STEP_START scan2
// REMOVE_START
for (let i = 1; i <= 1000; i++) {
    await client.set(`key:${i}`, i);
}
// REMOVE_END
let cursor = '0';
let scanResult;

scanResult = await client.scan(cursor, { MATCH: '*11*' });
console.log(scanResult.cursor, scanResult.keys);

scanResult = await client.scan(scanResult.cursor, { MATCH: '*11*' });
console.log(scanResult.cursor, scanResult.keys);

scanResult = await client.scan(scanResult.cursor, { MATCH: '*11*' });
console.log(scanResult.cursor, scanResult.keys);

scanResult = await client.scan(scanResult.cursor, { MATCH: '*11*' });
console.log(scanResult.cursor, scanResult.keys);

scanResult = await client.scan(scanResult.cursor, { MATCH: '*11*', COUNT: 1000 });
console.log(scanResult.cursor, scanResult.keys);
// REMOVE_START
console.assert(scanResult.keys.length === 18);
cursor = '0';
const prefix = 'key:*';
while (cursor !== 0) {
    scanResult = await client.scan(cursor, { MATCH: prefix, COUNT: 1000 });
    console.log(scanResult.cursor, scanResult.keys);
    cursor = scanResult.cursor;
    const keys = scanResult.keys;
    if (keys.length) {
        await client.del(keys);
    }
}
// REMOVE_END
// STEP_END

// STEP_START scan3
res = await client.geoAdd('geokey', { longitude: 0, latitude: 0, member: 'value' });
console.log(res); // 1

res = await client.zAdd('zkey', [{ score: 1000, value: 'value' }]);
console.log(res); // 1

res = await client.type('geokey');
console.log(res); // zset
// REMOVE_START
console.assert(res === 'zset');
// REMOVE_END

res = await client.type('zkey');
console.log(res); // zset
// REMOVE_START
console.assert(res === 'zset');
// REMOVE_END

scanResult = await client.scan('0', { TYPE: 'zset' });
console.log(scanResult.keys); // ['zkey', 'geokey']
// REMOVE_START
console.assert(scanResult.keys.sort().toString() === ['zkey', 'geokey'].sort().toString());
await client.del(['geokey', 'zkey']);
// REMOVE_END
// STEP_END

// STEP_START scan4
res = await client.hSet('myhash', { a: 1, b: 2 });
console.log(res); // 2

scanResult = await client.hScan('myhash', 0);
console.log(scanResult.tuples); // [{field: 'a', value: '1'}, {field: 'b', value: '2'}]
// REMOVE_START
assert.deepEqual(scanResult.tuples, [
  { field: 'a', value: '1' },
  { field: 'b', value: '2' }
]);
// REMOVE_END

scanResult = await client.hScan('myhash', 0, { COUNT: 10 });
let items = scanResult.tuples.map((item) => item.field)
console.log(items); // ['a', 'b']
// REMOVE_START
assert.deepEqual(items, ['a', 'b'])
await client.del('myhash');
// REMOVE_END
// STEP_END

// HIDE_START
await client.quit();
// HIDE_END
