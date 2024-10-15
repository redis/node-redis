import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import GEORADIUSBYMEMBER_RO from './GEORADIUSBYMEMBER_RO';

describe('GEORADIUSBYMEMBER_RO', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      GEORADIUSBYMEMBER_RO.transformArguments('key', 'member', 3, 'm'),
      ['GEORADIUSBYMEMBER_RO', 'key', 'member', '3', 'm']
    );
  });

  testUtils.testAll('geoRadiusByMemberRo', async client => {
    assert.deepEqual(
      await client.geoRadiusByMemberRo('key', 'member', 3, 'm'),
      []
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
