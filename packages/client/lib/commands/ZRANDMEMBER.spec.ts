import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZRANDMEMBER from './ZRANDMEMBER';
import { parseArgs } from './generic-transformers';

describe('ZRANDMEMBER', () => {
  testUtils.isVersionGreaterThanHook([6, 2]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ZRANDMEMBER, 'key'),
      ['ZRANDMEMBER', 'key']
    );
  });

  testUtils.testAll('zRandMember', async client => {
    assert.equal(
      await client.zRandMember('key'),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
