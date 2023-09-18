import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import GEOHASH from './GEOHASH';

describe('GEOHASH', () => {
  describe('transformArguments', () => {
    it('single member', () => {
      assert.deepEqual(
        GEOHASH.transformArguments('key', 'member'),
        ['GEOHASH', 'key', 'member']
      );
    });

    it('multiple members', () => {
      assert.deepEqual(
        GEOHASH.transformArguments('key', ['1', '2']),
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
});
