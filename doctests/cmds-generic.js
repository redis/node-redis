// EXAMPLE: cmds_generic
// REMOVE_START
import assert from "node:assert";
// REMOVE_END

// HIDE_START
import { createClient } from 'redis';

const client = createClient();
await client.connect().catch(console.error);
// HIDE_END

// STEP_START del
const delRes1 = await client.set('key1', 'Hello');
console.log(delRes1); // OK

const delRes2 = await client.set('key2', 'World');
console.log(delRes2); // OK

const delRes3 = await client.del(['key1', 'key2', 'key3']);
console.log(delRes3); // 2
// REMOVE_START
assert.equal(delRes3, 2);
// REMOVE_END
// STEP_END

// STEP_START expire
const expireRes1 = await client.set('mykey', 'Hello');
console.log(expireRes1); // OK

const expireRes2 = await client.expire('mykey', 10);
console.log(expireRes2); // true

const expireRes3 = await client.ttl('mykey');
console.log(expireRes3); // 10
// REMOVE_START
assert.equal(expireRes3, 10);
// REMOVE_END

const expireRes4 = await client.set('mykey', 'Hello World');
console.log(expireRes4); // OK

const expireRes5 = await client.ttl('mykey');
console.log(expireRes5); // -1
// REMOVE_START
assert.equal(expireRes5, -1);
// REMOVE_END

const expireRes6 = await client.expire('mykey', 10, "XX");
console.log(expireRes6); // false
// REMOVE_START
assert.equal(expireRes6, false)
// REMOVE_END

const expireRes7 = await client.ttl('mykey');
console.log(expireRes7); // -1
// REMOVE_START
assert.equal(expireRes7, -1);
// REMOVE_END

const expireRes8 = await client.expire('mykey', 10, "NX");
console.log(expireRes8); // true
// REMOVE_START
assert.equal(expireRes8, true);
// REMOVE_END

const expireRes9 = await client.ttl('mykey');
console.log(expireRes9); // 10
// REMOVE_START
assert.equal(expireRes9, 10);
await client.del('mykey');
// REMOVE_END
// STEP_END

// STEP_START ttl
const ttlRes1 = await client.set('mykey', 'Hello');
console.log(ttlRes1); // OK

const ttlRes2 = await client.expire('mykey', 10);
console.log(ttlRes2); // true

const ttlRes3 = await client.ttl('mykey');
console.log(ttlRes3); // 10
// REMOVE_START
assert.equal(ttlRes3, 10);
await client.del('mykey');
// REMOVE_END
// STEP_END

// STEP_START scan1
const scan1Res1 = await client.sAdd('myset', ['1', '2', '3', 'foo', 'foobar', 'feelsgood']);
console.log(scan1Res1); // 6

const scan1Res2 = [];
for await (const value of client.sScanIterator('myset', { MATCH: 'f*' })) {
    scan1Res2.push(value);
}
console.log(scan1Res2); // ['foo', 'foobar', 'feelsgood']
// REMOVE_START
console.assert(scan1Res2.sort().toString() === ['foo', 'foobar', 'feelsgood'].sort().toString());
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
const scan3Res1 = await client.geoAdd('geokey', { longitude: 0, latitude: 0, member: 'value' });
console.log(scan3Res1); // 1

const scan3Res2 = await client.zAdd('zkey', [{ score: 1000, value: 'value' }]);
console.log(scan3Res2); // 1

const scan3Res3 = await client.type('geokey');
console.log(scan3Res3); // zset
// REMOVE_START
console.assert(scan3Res3 === 'zset');
// REMOVE_END

const scan3Res4 = await client.type('zkey');
console.log(scan3Res4); // zset
// REMOVE_START
console.assert(scan3Res4 === 'zset');
// REMOVE_END

const scan3Res5 = await client.scan('0', { TYPE: 'zset' });
console.log(scan3Res5.keys); // ['zkey', 'geokey']
// REMOVE_START
console.assert(scan3Res5.keys.sort().toString() === ['zkey', 'geokey'].sort().toString());
await client.del(['geokey', 'zkey']);
// REMOVE_END
// STEP_END

// STEP_START scan4
const scan4Res1 = await client.hSet('myhash', { a: 1, b: 2 });
console.log(scan4Res1); // 2

const scan4Res2 = await client.hScan('myhash', 0);
console.log(scan4Res2.tuples); // [{field: 'a', value: '1'}, {field: 'b', value: '2'}]
// REMOVE_START
assert.deepEqual(scan4Res2.tuples, [
  { field: 'a', value: '1' },
  { field: 'b', value: '2' }
]);
// REMOVE_END

const scan4Res3 = await client.hScan('myhash', 0, { COUNT: 10 });
const items = scan4Res3.tuples.map((item) => item.field)
console.log(items); // ['a', 'b']
// REMOVE_START
assert.deepEqual(items, ['a', 'b'])
await client.del('myhash');
// REMOVE_END
// STEP_END

// HIDE_START
await client.quit();
// HIDE_END
