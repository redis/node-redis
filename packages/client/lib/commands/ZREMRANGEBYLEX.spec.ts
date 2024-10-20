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
});
