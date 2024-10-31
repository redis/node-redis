import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZRANGEBYSCORE from './ZRANGEBYSCORE';
import { parseArgs } from './generic-transformers';

describe('ZRANGEBYSCORE', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(ZRANGEBYSCORE, 'src', 0, 1),
        ['ZRANGEBYSCORE', 'src', '0', '1']
      );
    });

    it('with LIMIT', () => {
      assert.deepEqual(
        parseArgs(ZRANGEBYSCORE, 'src', 0, 1, {
          LIMIT: {
            offset: 0,
            count: 1
          }
        }),
        ['ZRANGEBYSCORE', 'src', '0', '1', 'LIMIT', '0', '1']
      );
    });
  });

  testUtils.testAll('zRangeByScore', async client => {
    assert.deepEqual(
      await client.zRangeByScore('src', 0, 1),
      []
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
