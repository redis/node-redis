import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZRANDMEMBER_COUNT from './ZRANDMEMBER_COUNT';

describe('ZRANDMEMBER COUNT', () => {
  testUtils.isVersionGreaterThanHook([6, 2, 5]);

  it('transformArguments', () => {
    assert.deepEqual(
      ZRANDMEMBER_COUNT.transformArguments('key', 1),
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
