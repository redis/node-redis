import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import GEOHASH from './GEOHASH';
import { parseArgs } from './generic-transformers';

describe('GEOHASH', () => {
  describe('transformArguments', () => {
    it('single member', () => {
      assert.deepEqual(
        parseArgs(GEOHASH, 'key', 'member'),
        ['GEOHASH', 'key', 'member']
      );
    });

    it('multiple members', () => {
      assert.deepEqual(
        parseArgs(GEOHASH, 'key', ['1', '2']),
        ['GEOHASH', 'key', '1', '2']
      );
    });
  });

  testUtils.testAll('geoHash', async client => {
    assert.deepEqual(
      await client.geoHash('key', 'member'),
      [null]
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testAll('geoHash with real geospatial data', async client => {
    await client.geoAdd('geo-key', {
      longitude: 13.361389,
      latitude: 38.115556,
      member: 'Palermo'
    });

    const reply = await client.geoHash('geo-key', 'Palermo');

    assert.ok(Array.isArray(reply));
    assert.equal(reply.length, 1);
    assert.equal(typeof reply[0], 'string');
    assert.ok(reply[0]!.length > 0);
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
