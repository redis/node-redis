import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import GEOSEARCHSTORE from './GEOSEARCHSTORE';
import { parseArgs } from './generic-transformers';

describe('GEOSEARCHSTORE', () => {
  testUtils.isVersionGreaterThanHook([6, 2]);

  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(GEOSEARCHSTORE, 'source', 'destination', 'member', {
          radius: 1,
          unit: 'm'
        }),
        ['GEOSEARCHSTORE', 'source', 'destination', 'FROMMEMBER', 'member', 'BYRADIUS', '1', 'm']
      );
    });

    it('with STOREDIST', () => {
      assert.deepEqual(
        parseArgs(GEOSEARCHSTORE, 'destination', 'source', 'member', {
          radius: 1,
          unit: 'm'
        }, {
          STOREDIST: true
        }),
        ['GEOSEARCHSTORE', 'destination', 'source', 'FROMMEMBER', 'member', 'BYRADIUS', '1', 'm', 'STOREDIST']
      );
    });
  });

  testUtils.testAll('geoSearchStore', async client => {
    assert.equal(
      await client.geoSearchStore('{tag}destination', '{tag}source', 'member', {
        radius: 1,
        unit: 'm'
      }),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
