import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SRANDMEMBER_COUNT from './SRANDMEMBER_COUNT';
import { parseArgs } from './generic-transformers';

describe('SRANDMEMBER COUNT', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(SRANDMEMBER_COUNT, 'key', 1),
      ['SRANDMEMBER', 'key', '1']
    );
  });

  testUtils.testAll('sRandMemberCount', async client => {
    assert.deepEqual(
      await client.sRandMemberCount('key', 1),
      []
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
