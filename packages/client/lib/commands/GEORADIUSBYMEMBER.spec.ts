import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import GEORADIUSBYMEMBER from './GEORADIUSBYMEMBER';
import { parseArgs } from './generic-transformers';

describe('GEORADIUSBYMEMBER', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(GEORADIUSBYMEMBER, 'key', 'member', 3, 'm'),
      ['GEORADIUSBYMEMBER', 'key', 'member', '3', 'm']
    );
  });

  testUtils.testAll('geoRadiusByMember', async client => {
    assert.deepEqual(
      await client.geoRadiusByMember('key', 'member', 3, 'm'),
      []
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
