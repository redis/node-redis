import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZREMRANGEBYLEX from './ZREMRANGEBYLEX';

describe('ZREMRANGEBYLEX', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      ZREMRANGEBYLEX.transformArguments('key', '[a', '[b'),
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
