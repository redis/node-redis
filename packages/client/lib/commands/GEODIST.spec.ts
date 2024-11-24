import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import GEODIST from './GEODIST';
import { parseArgs } from './generic-transformers';

describe('GEODIST', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(GEODIST, 'key', '1', '2'),
        ['GEODIST', 'key', '1', '2']
      );
    });

    it('with unit', () => {
      assert.deepEqual(
        parseArgs(GEODIST, 'key', '1', '2', 'm'),
        ['GEODIST', 'key', '1', '2', 'm']
      );
    });
  });

  testUtils.testAll('geoDist null', async client => {
    assert.equal(
      await client.geoDist('key', '1', '2'),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testAll('geoDist with member', async client => {
    const [, dist] = await Promise.all([
      client.geoAdd('key', [{
        member: '1',
        longitude: 1,
        latitude: 1
      }, {
        member: '2',
        longitude: 2,
        latitude: 2
      }]),
      client.geoDist('key', '1', '2')
    ]);

    assert.equal(
      dist,
      157270.0561
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
