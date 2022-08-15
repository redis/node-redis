// Store, retrieve and manipulate JSON data atomically with RedisJSON.

import { createClient } from 'redis';

const client = createClient();

await client.connect();
await client.del('noderedis:jsondata');

// Store a JSON object...
await client.json.set('noderedis:jsondata', '$', {
  name: 'Roberta McDonald',
  pets: [
    {
      name: 'Fluffy',
      species: 'dog',
      age: 5,
      isMammal: true
    },
    {
      name: 'Rex',
      species: 'dog',
      age: 3,
      isMammal: true
    },
    {
      name: 'Goldie',
      species: 'fish',
      age: 2,
      isMammal: false
    }
  ],
  address: {
    number: 99,
    street: 'Main Street',
    city: 'Springfield',
    state: 'OH',
    country: 'USA'
  }
});

// Retrieve the name and age of the second pet in the pets array.
let results = await client.json.get('noderedis:jsondata', {
  path: [
    '$.pets[1].name',
    '$.pets[1].age'
  ]
});

// { '$.pets[1].name': [ 'Rex' ], '$.pets[1].age': [ 3 ] }
console.log(results);

// Goldie had a birthday, increment the age...
await client.json.numIncrBy('noderedis:jsondata', '$.pets[2].age', 1);
results = await client.json.get('noderedis:jsondata', {
  path: '$.pets[2].age'
});

// Goldie is 3 years old now.
console.log(`Goldie is ${JSON.stringify(results[0])} years old now.`);

// Add a new pet...
await client.json.arrAppend('noderedis:jsondata', '$.pets', {
  name: 'Robin',
  species: 'bird',
  isMammal: false,
  age: 1
});

// How many pets do we have now?
const numPets = await client.json.arrLen('noderedis:jsondata', '$.pets');

// We now have 4 pets.
console.log(`We now have ${numPets} pets.`);

await client.quit();
