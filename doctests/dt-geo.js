// EXAMPLE: geo_tutorial
// HIDE_START
import assert from 'assert';
import { createClient } from 'redis';

const client = createClient();
await client.connect();
// HIDE_END

// REMOVE_START
await client.del('bikes:rentable')
// REMOVE_END

// STEP_START geoAdd
const res1 = await client.geoAdd('bikes:rentable', { 
  longitude: -122.27652,
  latitude: 37.805186,
  member: 'station:1'
});
console.log(res1)  // 1

const res2 = await client.geoAdd('bikes:rentable', {
  longitude: -122.2674626,
  latitude: 37.8062344,
  member: 'station:2'
});
console.log(res2)  // 1

const res3 = await client.geoAdd('bikes:rentable', {
  longitude: -122.2469854,
  latitude: 37.8104049,
  member: 'station:3'
})
console.log(res3)  // 1
// STEP_END

// REMOVE_START
assert.equal(res1, 1);
assert.equal(res2, 1);
assert.equal(res3, 1);
// REMOVE_END

// STEP_START geoSearch
const res4 = await client.geoSearch(
  'bikes:rentable', {
    longitude: -122.27652,
    latitude: 37.805186,
  },
  { radius: 5,
    unit: 'km'
  }
);
console.log(res4)  // ['station:1', 'station:2', 'station:3']
// STEP_END

// REMOVE_START
assert.deepEqual(res4, ['station:1', 'station:2', 'station:3']);
// REMOVE_END
await client.close()
