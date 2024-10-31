import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZRANGEBYLEX from './ZRANGEBYLEX';
import { parseArgs } from './generic-transformers';

describe('ZRANGEBYLEX', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(ZRANGEBYLEX, 'src', '-', '+'),
        ['ZRANGEBYLEX', 'src', '-', '+']
      );
    });

    it('with LIMIT', () => {
      assert.deepEqual(
        parseArgs(ZRANGEBYLEX, 'src', '-', '+', {
          LIMIT: {
            offset: 0,
            count: 1
          }
        }),
        ['ZRANGEBYLEX', 'src', '-', '+', 'LIMIT', '0', '1']
      );
    });
  });

  testUtils.testAll('zRangeByLex', async client => {
    assert.deepEqual(
      await client.zRangeByLex('src', '-', '+'),
      []
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
