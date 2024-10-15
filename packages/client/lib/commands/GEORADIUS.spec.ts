import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import GEORADIUS from './GEORADIUS';
import { parseArgs } from './generic-transformers';

describe('GEORADIUS', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(GEORADIUS, 'key', {
        longitude: 1,
        latitude: 2
      }, 3, 'm'),
      ['GEORADIUS', 'key', '1', '2', '3', 'm']
    );
  });

  testUtils.testAll('geoRadius', async client => {
    assert.deepEqual(
      await client.geoRadius('key', {
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
