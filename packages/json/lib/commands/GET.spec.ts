import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import GET from './GET';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('JSON.GET', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(GET, 'key'),
        ['JSON.GET', 'key']
      );
    });

    describe('with path', () => {
      it('string', () => {
        assert.deepEqual(
          parseArgs(GET, 'key', { path: '$' }),
          ['JSON.GET', 'key', '$']
        );
      });

      it('array', () => {
        assert.deepEqual(
          parseArgs(GET, 'key', { path: ['$.1', '$.2'] }),
          ['JSON.GET', 'key', '$.1', '$.2']
        );
      });
    });
  });

  testUtils.testWithClient('client.json.get', async client => {
    assert.equal(
      await client.json.get('key'),
      null
    );

    await client.json.set('noderedis:users:1', '$', { name: 'Alice', age: 32, })
    const res = await client.json.get('noderedis:users:1');
    assert.equal(typeof res, 'object')
    assert.deepEqual(res, { name: 'Alice', age: 32, })

  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.json.get with reviver', async client => {
    assert.equal(
      await client.json.get('key',{ reviver: ()=>{ assert.fail() } }),
      null
    );

    await client.json.set('noderedis:users:1', '$', { name: 'Alice', birthday: new Date('1998-02-12') });
    const res = await client.json.get('noderedis:users:1', { reviver: (key, value) => { if (key === 'birthday') return new Date(value); else return value; } });
    assert(typeof res === 'object' && res !== null && 'birthday' in res && res.birthday instanceof Date && res.birthday.getTime() === new Date('1998-02-12').getTime());

  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.multi().json.get with reviver', async client => {
    assert.equal(
      (await client.multi().json.get('key',{ reviver: ()=>{ assert.fail() } }).exec())[0],
      null
    );

    await client.json.set('noderedis:users:1', '$', { name: 'Alice', birthday: new Date('1998-02-12') });
    const res = (await client.multi().json.get('noderedis:users:1', { reviver: (key, value) => { if (key === 'birthday') return new Date(value); else return value; } }).exec())[0];
    assert(typeof res === 'object' && res !== null && 'birthday' in res && res.birthday instanceof Date && res.birthday.getTime() === new Date('1998-02-12').getTime());

  }, GLOBAL.SERVERS.OPEN);
  
  testUtils.testWithClient('client.json.get with path', async client => {
    await client.json.set('json:path:test', '$', {
      user: { name: 'Bob', age: 25 },
      count: 42
    });

    // Test JSONPath syntax ($ prefix) - returns array
    const jsonPathResult = await client.json.get('json:path:test', { path: '$.user' });
    assert.ok(Array.isArray(jsonPathResult), 'JSONPath $ syntax returns array');
    assert.equal(jsonPathResult.length, 1);
    assert.deepEqual(jsonPathResult[0], { name: 'Bob', age: 25 });

    // Test legacy path syntax (. prefix) - returns value directly (not array)
    const legacyPathResult = await client.json.get('json:path:test', { path: '.user' });
    assert.ok(!Array.isArray(legacyPathResult), 'Legacy . syntax should not return array');
    assert.deepEqual(legacyPathResult, { name: 'Bob', age: 25 });
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.json.get with responseMap', async client => {
    await client.json.set('json:map:test', '$', {
      '.pets[1].name': 'Rex',
      '.pets[1].age': 3,
      otherField: 'ignored'
    });

    const res = await client.json.get('json:map:test', {
      responseMap: {
        '.pets[1].name': 'name',
        '.pets[1].age': 'age'
      }
    });

    assert.deepEqual(res, {
      name: 'Rex',
      age: 3
    });
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.json.get with advanced responseMap, nested paths, and edge cases', async client => {
  await client.json.set('vehicle:fleet:alpha', '$', {
    fleet: {
      id: 'FL-992-NX',
      region: 'North-West',
      metrics: {
        totalVehicles: 45,
        operational: 42
      }
    },
    vehicles: [
      { code: 'v-01', model: 'Transit EV', mileage: 14500, active: true },
      { code: 'v-02', model: 'Model Y', mileage: 8200, active: false },
      { code: 'v-03', model: 'Sprinter', mileage: 31000, active: true }
    ],
    tags: ['logistics', 'electric', 'express']
  });

  const res = await client.json.get('vehicle:fleet:alpha', {
    responseMap: {
      'fleet.id': 'fleetId',
      'fleet.metrics.operational': 'activeFleetCount',
      'vehicles[2].model': 'featuredModel',
      'vehicles[2].mileage': 'featuredMileage',
      'vehicles[2].active': 'isFeaturedActive',
      'tags[0]': 'primaryTag',
      'nonexistent.deep.path': 'missingField' 
    }
  });

  assert.deepEqual(res, {
    fleetId: 'FL-992-NX',
    activeFleetCount: 42,
    featuredModel: 'Sprinter',
    featuredMileage: 31000,
    isFeaturedActive: true,
    primaryTag: 'logistics'
   
  });

  const nullRes = await client.json.get('vehicle:fleet:nonexistent', {
    responseMap: { 'fleet.id': 'fleetId' }
  });
  assert.equal(nullRes, null);

  const emptyMapRes = await client.json.get('vehicle:fleet:alpha', {
    responseMap: {}
  });
  assert.deepEqual(emptyMapRes, {});

 
  const subDocRes = await client.json.get('vehicle:fleet:alpha', {
    responseMap: {
      'vehicles[1].model': 'secondModel',
      'vehicles[1].active': 'secondActive'
    }
  });

  assert.deepEqual(subDocRes, {
    secondModel: 'Model Y',
    secondActive: false
  });
}, GLOBAL.SERVERS.OPEN);

testUtils.testWithClient('client.json.get with responseMap edge cases (arrays, primitives, duplicate keys)', async client => {

    await client.json.set('json:array:root', '$', ['a', 'b', 'c']);
    const arrayRes = await client.json.get('json:array:root', {
      responseMap: { '0': 'first' }
    });
    assert.deepEqual(arrayRes, ['a', 'b', 'c']);

    await client.json.set('json:primitive:root', '$', 100);
    const primRes = await client.json.get('json:primitive:root', {
      responseMap: { '': 'value' }
    });
    assert.equal(primRes, 100);

    await client.json.set('json:dup:test', '$', { a: 'firstVal', b: 'secondVal' });
    const dupRes = await client.json.get('json:dup:test', {
      responseMap: {
        'a': 'targetKey',
        'b': 'targetKey'
      }
    });
    assert.deepEqual(dupRes, { targetKey: 'secondVal' });
  }, GLOBAL.SERVERS.OPEN);
});
