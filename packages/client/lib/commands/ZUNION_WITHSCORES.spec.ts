import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZUNION_WITHSCORES from './ZUNION_WITHSCORES';
import { parseArgs } from './generic-transformers';

describe('ZUNION WITHSCORES', () => {
  testUtils.isVersionGreaterThanHook([6, 2]);

  describe('transformArguments', () => {
    it('key (string)', () => {
      assert.deepEqual(
        parseArgs(ZUNION_WITHSCORES, 'key'),
        ['ZUNION', '1', 'key', 'WITHSCORES']
      );
    });

    it('keys (Array<string>)', () => {
      assert.deepEqual(
        parseArgs(ZUNION_WITHSCORES, ['1', '2']),
        ['ZUNION', '2', '1', '2', 'WITHSCORES']
      );
    });

    it('key & weight', () => {
      assert.deepEqual(
        parseArgs(ZUNION_WITHSCORES, {
          key: 'key',
          weight: 1
        }),
        ['ZUNION', '1', 'key', 'WEIGHTS', '1', 'WITHSCORES']
      );
    });

    it('keys & weights', () => {
      assert.deepEqual(
        parseArgs(ZUNION_WITHSCORES, [{
          key: 'a',
          weight: 1
        }, {
          key: 'b',
          weight: 2
        }]),
        ['ZUNION', '2', 'a', 'b', 'WEIGHTS', '1', '2', 'WITHSCORES']
      );
    });

    it('with AGGREGATE', () => {
      assert.deepEqual(
        parseArgs(ZUNION_WITHSCORES, 'key', {
          AGGREGATE: 'SUM'
        }),
        ['ZUNION', '1', 'key', 'AGGREGATE', 'SUM', 'WITHSCORES']
      );
    });
  });

  testUtils.testAll('zUnionWithScores', async client => {
    assert.deepEqual(
      await client.zUnionWithScores('key'),
      []
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
