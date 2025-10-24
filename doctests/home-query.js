// EXAMPLE: js_home_query
// BINDER_ID nodejs-js_home_query
// REMOVE_START
import assert from "node:assert";
// REMOVE_END
// STEP_START import
import {
    createClient,
    SCHEMA_FIELD_TYPE,
    FT_AGGREGATE_GROUP_BY_REDUCERS,
    FT_AGGREGATE_STEPS,
} from 'redis';
// STEP_END

// STEP_START create_data
const user1 = {
    name: 'Paul John',
    email: 'paul.john@example.com',
    age: 42,
    city: 'London'
};

const user2 = {
    name: 'Eden Zamir',
    email: 'eden.zamir@example.com',
    age: 29,
    city: 'Tel Aviv'
};

const user3 = {
    name: 'Paul Zamir',
    email: 'paul.zamir@example.com',
    age: 35,
    city: 'Tel Aviv'
};
// STEP_END

// STEP_START connect
const client = await createClient();
await client.connect();
// STEP_END

// STEP_START cleanup_json
await client.ft.dropIndex('idx:users', { DD: true }).then(() => {}, () => {});
// STEP_END

// STEP_START create_index
await client.ft.create('idx:users', {
    '$.name': {
        type: SCHEMA_FIELD_TYPE.TEXT,
        AS: 'name'
    },
    '$.city': {
        type: SCHEMA_FIELD_TYPE.TEXT,
        AS: 'city'
    },
    '$.age': {
        type: SCHEMA_FIELD_TYPE.NUMERIC,
        AS: 'age'
    }
}, {
    ON: 'JSON',
    PREFIX: 'user:'
});
// STEP_END

// STEP_START add_data
const [user1Reply, user2Reply, user3Reply] = await Promise.all([
    client.json.set('user:1', '$', user1),
    client.json.set('user:2', '$', user2),
    client.json.set('user:3', '$', user3)
]);
// STEP_END
// REMOVE_START
assert.equal(user1Reply, 'OK');
assert.equal(user2Reply, 'OK');
assert.equal(user3Reply, 'OK');
// REMOVE_END

// STEP_START query1
let findPaulResult = await client.ft.search('idx:users', 'Paul @age:[30 40]');

console.log(findPaulResult.total); // >>> 1

findPaulResult.documents.forEach(doc => {
    console.log(`ID: ${doc.id}, name: ${doc.value.name}, age: ${doc.value.age}`);
});
// >>> ID: user:3, name: Paul Zamir, age: 35
// STEP_END
// REMOVE_START
assert.equal(findPaulResult.total, 1);
assert.equal(findPaulResult.documents[0].id, 'user:3');
// REMOVE_END

// STEP_START query2
let citiesResult = await client.ft.search('idx:users', '*',{
    RETURN: 'city'
});

console.log(citiesResult.total); // >>> 3

citiesResult.documents.forEach(cityDoc => {
    console.log(cityDoc.value);
});
// >>> { city: 'London' }
// >>> { city: 'Tel Aviv' }
// >>> { city: 'Tel Aviv' }
// STEP_END
// REMOVE_START
assert.equal(citiesResult.total, 3);
citiesResult.documents.sort((a, b) => a.value.city.localeCompare(b.value.city));
assert.deepEqual(citiesResult.documents.map(doc => doc.value.city), [
    'London',
    'Tel Aviv',
    'Tel Aviv'
]);
// REMOVE_END

// STEP_START query3
let aggResult = await client.ft.aggregate('idx:users', '*', {
    STEPS: [{
        type: FT_AGGREGATE_STEPS.GROUPBY,
        properties: '@city',
        REDUCE: [{
            type: FT_AGGREGATE_GROUP_BY_REDUCERS.COUNT,
            AS: 'count'
        }]
    }]
});

console.log(aggResult.total); // >>> 2

aggResult.results.forEach(result => {
    console.log(`${result.city} - ${result.count}`);
});
// >>> London - 1
// >>> Tel Aviv - 2
// STEP_END
// REMOVE_START
assert.equal(aggResult.total, 2);
aggResult.results.sort((a, b) => a.city.localeCompare(b.city));
assert.deepEqual(aggResult.results.map(result => result.city), [
    'London',
    'Tel Aviv'
]);
assert.deepEqual(aggResult.results.map(result => result.count), [
    1,
    2
]);
// REMOVE_END

// STEP_START cleanup_hash
await client.ft.dropIndex('hash-idx:users', { DD: true }).then(() => {}, () => {});
// STEP_END

// STEP_START create_hash_index
await client.ft.create('hash-idx:users', {
    'name': {
        type: SCHEMA_FIELD_TYPE.TEXT
    },
    'city': {
        type: SCHEMA_FIELD_TYPE.TEXT
    },
    'age': {
        type: SCHEMA_FIELD_TYPE.NUMERIC
    }
}, {
    ON: 'HASH',
    PREFIX: 'huser:'
});
// STEP_END

// STEP_START add_hash_data
const [huser1Reply, huser2Reply, huser3Reply] = await Promise.all([
    client.hSet('huser:1', user1),
    client.hSet('huser:2', user2),
    client.hSet('huser:3', user3)
]);
// STEP_END
// REMOVE_START
assert.equal(huser1Reply, 4);
assert.equal(huser2Reply, 4);
assert.equal(huser3Reply, 4);
// REMOVE_END

// STEP_START query1_hash
let findPaulHashResult = await client.ft.search(
    'hash-idx:users', 'Paul @age:[30 40]'
);

console.log(findPaulHashResult.total); // >>> 1

findPaulHashResult.documents.forEach(doc => {
    console.log(`ID: ${doc.id}, name: ${doc.value.name}, age: ${doc.value.age}`);
});
// >>> ID: huser:3, name: Paul Zamir, age: 35
// STEP_END
// REMOVE_START
assert.equal(findPaulHashResult.total, 1);
assert.equal(findPaulHashResult.documents[0].id, 'huser:3');
// REMOVE_END

// STEP_START close
await client.quit();
// STEP_END
