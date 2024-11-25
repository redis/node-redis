import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZRANGEBYSCORE_WITHSCORES from './ZRANGEBYSCORE_WITHSCORES';
import { parseArgs } from './generic-transformers';

describe('ZRANGEBYSCORE WITHSCORES', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(ZRANGEBYSCORE_WITHSCORES, 'src', 0, 1),
        ['ZRANGEBYSCORE', 'src', '0', '1', 'WITHSCORES']
      );
    });

    it('with LIMIT', () => {
      assert.deepEqual(
        parseArgs(ZRANGEBYSCORE_WITHSCORES, 'src', 0, 1, {
          LIMIT: {
            offset: 0,
            count: 1
          }
        }),
        ['ZRANGEBYSCORE', 'src', '0', '1', 'LIMIT', '0', '1', 'WITHSCORES']
      );
    });
  });

  testUtils.testAll('zRangeByScoreWithScores', async client => {
    assert.deepEqual(
      await client.zRangeByScoreWithScores('src', 0, 1),
      []
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
