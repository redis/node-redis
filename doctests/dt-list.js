// EXAMPLE: list_tutorial
// HIDE_START
import assert from 'assert';
import { createClient } from 'redis';

const client = createClient();
await client.connect();
// HIDE_END
// REMOVE_START
await client.del('bikes:repairs');
await client.del('bikes:finished');
// REMOVE_END

// STEP_START queue
const res1 = await client.lPush('bikes:repairs', 'bike:1');
console.log(res1);  // 1

const res2 = await client.lPush('bikes:repairs', 'bike:2');
console.log(res2);  // 2

const res3 = await client.rPop('bikes:repairs');
console.log(res3);  // bike:1

const res4 = await client.rPop('bikes:repairs');
console.log(res4);  // bike:2
// STEP_END

// REMOVE_START
assert.equal(res1, 1);
assert.equal(res2, 2);
assert.equal(res3, 'bike:1');
assert.equal(res4, 'bike:2');
// REMOVE_END

// STEP_START stack
const res5 = await client.lPush('bikes:repairs', 'bike:1');
console.log(res5);  // 1

const res6 = await client.lPush('bikes:repairs', 'bike:2');
console.log(res6); // 2

const res7 = await client.lPop('bikes:repairs');
console.log(res7);  // bike:2

const res8 = await client.lPop('bikes:repairs');
console.log(res8);  // bike:1
// STEP_END

// REMOVE_START
assert.equal(res5, 1);
assert.equal(res6, 2);
assert.equal(res7, 'bike:2');
assert.equal(res8, 'bike:1');
// REMOVE_END

// STEP_START lLen
const res9 = await client.lLen('bikes:repairs');
console.log(res9); // 0
// STEP_END

// REMOVE_START
assert.equal(res9, 0);
// REMOVE_END

// STEP_START lMove_lRange
const res10 = await client.lPush('bikes:repairs', 'bike:1');
console.log(res10);  // 1

const res11 = await client.lPush('bikes:repairs', 'bike:2');
console.log(res11);  // 2

const res12 = await client.lMove('bikes:repairs', 'bikes:finished', 'LEFT', 'LEFT');
console.log(res12);  // 'bike:2'

const res13 = await client.lRange('bikes:repairs', 0, -1);
console.log(res13);  // ['bike:1']

const res14 = await client.lRange('bikes:finished', 0, -1);
console.log(res14);  // ['bike:2']
// STEP_END

// REMOVE_START
assert.equal(res10, 1);
assert.equal(res11, 2);
assert.equal(res12, 'bike:2');
assert.deepEqual(res13, ['bike:1']);
assert.deepEqual(res14, ['bike:2']);
await client.del('bikes:repairs');
// REMOVE_END

// STEP_START lPush_rPush
const res15 = await client.rPush('bikes:repairs', 'bike:1');
console.log(res15);  // 1

const res16 = await client.rPush('bikes:repairs', 'bike:2');
console.log(res16);  // 2

const res17 = await client.lPush('bikes:repairs', 'bike:important_bike');
console.log(res17);  // 3

const res18 = await client.lRange('bikes:repairs', 0, -1);
console.log(res18);  // ['bike:important_bike', 'bike:1', 'bike:2']
// STEP_END

// REMOVE_START
assert.equal(res15, 1);
assert.equal(res16, 2);
assert.equal(res17, 3);
assert.deepEqual(res18, ['bike:important_bike', 'bike:1', 'bike:2']);
await client.del('bikes:repairs');
// REMOVE_END

// STEP_START variadic
const res19 = await client.rPush('bikes:repairs', ['bike:1', 'bike:2', 'bike:3']);
console.log(res19);  // 3

const res20 = await client.lPush(
  'bikes:repairs', ['bike:important_bike', 'bike:very_important_bike']
);
console.log(res20);  // 5

const res21 = await client.lRange('bikes:repairs', 0, -1);
console.log(res21);  // ['bike:very_important_bike', 'bike:important_bike', 'bike:1', 'bike:2', 'bike:3']
// STEP_END

// REMOVE_START
assert.equal(res19, 3);
assert.equal(res20, 5);
assert.deepEqual(res21, [
  'bike:very_important_bike',
  'bike:important_bike',
  'bike:1',
  'bike:2',
  'bike:3',
]);
await client.del('bikes:repairs');
// REMOVE_END

// STEP_START lPop_rPop
const res22 = await client.rPush('bikes:repairs', ['bike:1', 'bike:2', 'bike:3']);
console.log(res22);  // 3

const res23 = await client.rPop('bikes:repairs');
console.log(res23);  // 'bike:3'

const res24 = await client.lPop('bikes:repairs');
console.log(res24);  // 'bike:1'

const res25 = await client.rPop('bikes:repairs');
console.log(res25);  // 'bike:2'

const res26 = await client.rPop('bikes:repairs');
console.log(res26);  // null
// STEP_END

// REMOVE_START
assert.deepEqual(res22, 3);
assert.equal(res23, 'bike:3');
assert.equal(res24, 'bike:1');
assert.equal(res25, 'bike:2');
assert.equal(res26, null);
// REMOVE_END

// STEP_START lTrim
const res27 = await client.lPush(
  'bikes:repairs', ['bike:1', 'bike:2', 'bike:3', 'bike:4', 'bike:5']
);
console.log(res27);  // 5

const res28 = await client.lTrim('bikes:repairs', 0, 2);
console.log(res28);  // OK

const res29 = await client.lRange('bikes:repairs', 0, -1);
console.log(res29);  // ['bike:5', 'bike:4', 'bike:3']
// STEP_END

// REMOVE_START
assert.equal(res27, 5);
assert.equal(res28, 'OK');
assert.deepEqual(res29, ['bike:5', 'bike:4', 'bike:3']);
await client.del('bikes:repairs');
// REMOVE_END

// STEP_START lTrim_end_of_list
const res27eol = await client.rPush(
  'bikes:repairs', ['bike:1', 'bike:2', 'bike:3', 'bike:4', 'bike:5']
);
console.log(res27eol);  // 5

const res28eol = await client.lTrim('bikes:repairs', -3, -1);
console.log(res28eol);  // 'OK'

const res29eol = await client.lRange('bikes:repairs', 0, -1);
console.log(res29eol);  // ['bike:3', 'bike:4', 'bike:5']
// STEP_END

// REMOVE_START
assert.equal(res27eol, 5);
assert.equal(res28eol, 'OK');
assert.deepEqual(res29eol, ['bike:3', 'bike:4', 'bike:5']);
await client.del('bikes:repairs');
// REMOVE_END

// STEP_START brPop
const res31 = await client.rPush('bikes:repairs', ['bike:1', 'bike:2']);
console.log(res31);  // 2

const res32 = await client.brPop('bikes:repairs', 1);
console.log(res32);  // { key: 'bikes:repairs', element: 'bike:2' }

const res33 = await client.brPop('bikes:repairs', 1);
console.log(res33);  // { key: 'bikes:repairs', element: 'bike:1' }

const res34 = await client.brPop('bikes:repairs', 1);
console.log(res34);  // null
// STEP_END

// REMOVE_START
assert.equal(res31, 2);
assert.deepEqual(res32, { key: 'bikes:repairs', element: 'bike:2' });
assert.deepEqual(res33, { key: 'bikes:repairs', element: 'bike:1' });
assert.equal(res34, null);
await client.del('bikes:repairs');
await client.del('new_bikes');
// REMOVE_END

// STEP_START rule_1
const res35 = await client.del('new_bikes');
console.log(res35); // 0

const res36 = await client.lPush('new_bikes', ['bike:1', 'bike:2', 'bike:3']);
console.log(res36); // 3
// STEP_END

// REMOVE_START
assert.equal(res35, 0);
assert.equal(res36, 3);
await client.del('new_bikes');
// REMOVE_END

// STEP_START rule_1.1
const res37 = await client.set('new_bikes', 'bike:1');
console.log(res37);  // 'OK'

const res38 = await client.type('new_bikes');
console.log(res38);  // 'string'

try {
  const res39 = await client.lPush('new_bikes', 'bike:2', 'bike:3');
  // redis.exceptions.ResponseError:
  // [SimpleError: WRONGTYPE Operation against a key holding the wrong kind of value]
}
catch(e){
  console.log(e);
}
// STEP_END

// REMOVE_START
assert.equal(res37, 'OK');
assert.equal(res38, 'string');
await client.del('new_bikes');
// REMOVE_END

// STEP_START rule_2
await client.lPush('bikes:repairs', ['bike:1', 'bike:2', 'bike:3']);
console.log(res36);  // 3

const res40 = await client.exists('bikes:repairs')
console.log(res40);  // 1

const res41 = await client.lPop('bikes:repairs');
console.log(res41);  // 'bike:3'

const res42 = await client.lPop('bikes:repairs');
console.log(res42);  // 'bike:2'

const res43 = await client.lPop('bikes:repairs');
console.log(res43);  // 'bike:1'

const res44 = await client.exists('bikes:repairs');
console.log(res44);  // 0
// STEP_END

// REMOVE_START
assert.equal(res40, 1);
assert.equal(res41, 'bike:3');
assert.equal(res42, 'bike:2');
assert.equal(res43, 'bike:1');
assert.equal(res44, 0);
await client.del('bikes:repairs');
// REMOVE_END

// STEP_START rule_3
const res45 = await client.del('bikes:repairs');
console.log(res45);  // 0

const res46 = await client.lLen('bikes:repairs');
console.log(res46);  // 0

const res47 = await client.lPop('bikes:repairs');
console.log(res47);  // null
// STEP_END

// REMOVE_START
assert.equal(res45, 0);
assert.equal(res46, 0);
assert.equal(res47, null);
// REMOVE_END

// STEP_START lTrim.1
const res48 = await client.lPush(
  'bikes:repairs', ['bike:1', 'bike:2', 'bike:3', 'bike:4', 'bike:5']
);
console.log(res48);  // 5

const res49 = await client.lTrim('bikes:repairs', 0, 2);
console.log(res49);  // 'OK'

const res50 = await client.lRange('bikes:repairs', 0, -1);
console.log(res50);  // ['bike:5', 'bike:4', 'bike:3']
// STEP_END

// REMOVE_START
assert.equal(res48, 5);
assert.equal(res49, 'OK');
assert.deepEqual(res50, ['bike:5', 'bike:4', 'bike:3']);
await client.del('bikes:repairs');
await client.close();
// REMOVE_END