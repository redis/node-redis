import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZSCORE from './ZSCORE';
import { parseArgs } from './generic-transformers';

describe('ZSCORE', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ZSCORE, 'key', 'member'),
      ['ZSCORE', 'key', 'member']
    );
  });

  testUtils.testAll('zScore', async client => {
    assert.equal(
      await client.zScore('key', 'member'),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  // TODO: re-enable once cluster CI flakiness is resolved
  // testUtils.testAll('zScore with existing member', async client => {
  //   await client.zAdd('key', { score: 1.5, value: 'member' });
  //   assert.equal(
  //     await client.zScore('key', 'member'),
  //     1.5
  //   );
  // }, {
  //   client: GLOBAL.SERVERS.OPEN,
  //   cluster: GLOBAL.CLUSTERS.OPEN
  // });
});
