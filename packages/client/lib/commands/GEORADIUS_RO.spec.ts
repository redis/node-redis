import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import GEORADIUS_RO from './GEORADIUS_RO';

describe('GEORADIUS_RO', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      GEORADIUS_RO.transformArguments('key', {
        longitude: 1,
        latitude: 2
      }, 3, 'm'),
      ['GEORADIUS_RO', 'key', '1', '2', '3', 'm']
    );
  });

  testUtils.testAll('geoRadiusRo', async client => {
    assert.deepEqual(
      await client.geoRadiusRo('key', {
        longitude: 1,
        latitude: 2
      }, 3, 'm'),
      []
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
