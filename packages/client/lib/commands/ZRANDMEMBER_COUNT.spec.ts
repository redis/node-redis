import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZRANDMEMBER_COUNT from './ZRANDMEMBER_COUNT';
import { parseArgs } from './generic-transformers';

describe('ZRANDMEMBER COUNT', () => {
  testUtils.isVersionGreaterThanHook([6, 2, 5]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ZRANDMEMBER_COUNT, 'key', 1),
      ['ZRANDMEMBER', 'key', '1']
    );
  });

  testUtils.testAll('zRandMemberCount', async client => {
    assert.deepEqual(
      await client.zRandMemberCount('key', 1),
      []
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
