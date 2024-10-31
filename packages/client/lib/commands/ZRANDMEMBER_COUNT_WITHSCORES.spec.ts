import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZRANDMEMBER_COUNT_WITHSCORES from './ZRANDMEMBER_COUNT_WITHSCORES';
import { parseArgs } from './generic-transformers';

describe('ZRANDMEMBER COUNT WITHSCORES', () => {
  testUtils.isVersionGreaterThanHook([6, 2, 5]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ZRANDMEMBER_COUNT_WITHSCORES, 'key', 1),
      ['ZRANDMEMBER', 'key', '1', 'WITHSCORES']
    );
  });

  testUtils.testAll('zRandMemberCountWithScores', async client => {
    assert.deepEqual(
      await client.zRandMemberCountWithScores('key', 1),
      []
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
