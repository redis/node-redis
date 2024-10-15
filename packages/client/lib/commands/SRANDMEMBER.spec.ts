import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SRANDMEMBER from './SRANDMEMBER';
import { parseArgs } from './generic-transformers';

describe('SRANDMEMBER', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(SRANDMEMBER, 'key'),
      ['SRANDMEMBER', 'key']
    );
  });

  testUtils.testAll('sRandMember', async client => {
    assert.equal(
      await client.sRandMember('key'),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
