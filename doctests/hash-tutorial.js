// EXAMPLE: hash_tutorial
// REMOVE_START
import assert from 'assert';
// REMOVE_END

// HIDE_START
import { createClient } from 'redis';

const client = createClient();

client.on('error', err => console.log('Redis Client Error', err));

await client.connect();
// HIDE_END

// STEP_START set_get_all
const fieldsAdded = await client.hSet(
    'bike:1',
    {
        model: 'Deimos',
        brand: 'Ergonom',
        type: 'Enduro bikes',
        price: 4972,
    },
)
console.log(`Number of fields were added: ${fieldsAdded}`);
// Number of fields were added: 4
//REMOVE_START
assert.equal(fieldsAdded, 4);
//REMOVE_END

const model = await client.hGet('bike:1', 'model');
console.log(`Model: ${model}`);
// Model: Deimos
// REMOVE_START
assert.equal(model, 'Deimos');
// REMOVE_END

const price = await client.hGet('bike:1', 'price');
console.log(`Price: ${price}`);
// Price: 4972
// REMOVE_START
assert.equal(price, '4972');
// REMOVE_END

const bike = await client.hGetAll('bike:1');
console.log(bike);
// {
//   model: 'Deimos',
//   brand: 'Ergonom',
//   type: 'Enduro bikes',
//   price: '4972'
// }
// REMOVE_START
assert.equal(Object.keys(bike).length, 4);
// REMOVE_END
// STEP_END

// STEP_START hmget
const fields = await client.hmGet('bike:1', ['model', 'price']);
console.log(fields);
// [ 'Deimos', '4972' ]
// REMOVE_START
assert.equal(fields.length, 2);
// REMOVE_END
// STEP_END

// STEP_START hincrby
let newPrice = await client.hIncrBy('bike:1', 'price', 100);
console.log(newPrice);
// 5072
// REMOVE_START
assert.equal(newPrice, 5072);
// REMOVE_END
newPrice = await client.hIncrBy('bike:1', 'price', -100);
console.log(newPrice);
// 4972
// REMOVE_START
assert.equal(newPrice, 4972);
// REMOVE_END
// STEP_END

// STEP_START incrby_get_mget
let rides = await client.hIncrBy('bike:1:stats', 'rides', 1);
console.log(rides);
// 1

rides = await client.hIncrBy('bike:1:stats', 'rides', 1);
console.log(rides);
// 2

rides = await client.hIncrBy('bike:1:stats', 'rides', 1);
console.log(rides);
// 3

let crashes = await client.hIncrBy('bike:1:stats', 'crashes', 1);
console.log(crashes);
// 1

let owners = await client.hIncrBy('bike:1:stats', 'owners', 1);
console.log(owners);
// 1

rides = await client.hGet('bike:1:stats', 'rides');
console.log(`Total rides: ${rides}`);
// Total rides: 3
// REMOVE_START
assert.equal(rides, 3);
// REMOVE_END
const stats = await client.hmGet('bike:1:stats', ['crashes', 'owners']);
console.log(`Bike stats: crashes=${stats[0]}, owners=${stats[1]}`);
// Bike stats: crashes=1, owners=1
// REMOVE_START
assert.equal(stats.length, 2);
// REMOVE_END
// STEP_END

// HIDE_START
await client.quit();
// HIDE_END