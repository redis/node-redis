import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZREMRANGEBYLEX from './ZREMRANGEBYLEX';
import { parseArgs } from './generic-transformers';

describe('ZREMRANGEBYLEX', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(ZREMRANGEBYLEX, 'key', '[a', '[b'),
      ['ZREMRANGEBYLEX', 'key', '[a', '[b']
    );
  });

  testUtils.testAll('zRemRangeByLex', async client => {
    assert.equal(
      await client.zRemRangeByLex('key', '[a', '[b'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  // TODO: re-enable once cluster CI flakiness is resolved
  // testUtils.testAll('zRemRangeByLex with members', async client => {
  //   await client.zAdd('key', [
  //     { score: 0, value: 'a' },
  //     { score: 0, value: 'b' },
  //     { score: 0, value: 'c' },
  //     { score: 0, value: 'd' }
  //   ]);
  //
  //   assert.equal(
  //     await client.zRemRangeByLex('key', '[b', '[c'),
  //     2
  //   );
  // }, {
  //   client: GLOBAL.SERVERS.OPEN,
  //   cluster: GLOBAL.CLUSTERS.OPEN
  // });
});
