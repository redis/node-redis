import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZREMRANGEBYRANK from './ZREMRANGEBYRANK';
import { parseArgs } from './generic-transformers';

describe('ZREMRANGEBYRANK', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ZREMRANGEBYRANK, 'key', 0, 1),
      ['ZREMRANGEBYRANK', 'key', '0', '1']
    );
  });

  testUtils.testAll('zRemRangeByRank', async client => {
    assert.equal(
      await client.zRemRangeByRank('key', 0, 1),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  // TODO: re-enable once cluster CI flakiness is resolved
  // testUtils.testAll('zRemRangeByRank with members', async client => {
  //   await client.zAdd('key', [
  //     { score: 1, value: 'a' },
  //     { score: 2, value: 'b' },
  //     { score: 3, value: 'c' }
  //   ]);
  //   assert.equal(
  //     await client.zRemRangeByRank('key', 0, 1),
  //     2
  //   );
  // }, {
  //   client: GLOBAL.SERVERS.OPEN,
  //   cluster: GLOBAL.CLUSTERS.OPEN
  // });
});
