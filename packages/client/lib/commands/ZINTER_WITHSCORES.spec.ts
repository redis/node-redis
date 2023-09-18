import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZINTER_WITHSCORES from './ZINTER_WITHSCORES';

describe('ZINTER WITHSCORES', () => {
  testUtils.isVersionGreaterThanHook([6, 2]);

  describe('transformArguments', () => {
    it('key (string)', () => {
      assert.deepEqual(
        ZINTER_WITHSCORES.transformArguments('key'),
        ['ZINTER', '1', 'key', 'WITHSCORES']
      );
    });

    it('keys (Array<string>)', () => {
      assert.deepEqual(
        ZINTER_WITHSCORES.transformArguments(['1', '2']),
        ['ZINTER', '2', '1', '2', 'WITHSCORES']
      );
    });

    it('key & weight', () => {
      assert.deepEqual(
        ZINTER_WITHSCORES.transformArguments({
          key: 'key',
          weight: 1
        }),
        ['ZINTER', '1', 'key', 'WEIGHTS', '1', 'WITHSCORES']
      );
    });

    it('keys & weights', () => {
      assert.deepEqual(
        ZINTER_WITHSCORES.transformArguments([{
          key: 'a',
          weight: 1
        }, {
          key: 'b',
          weight: 2
        }]),
        ['ZINTER', '2', 'a', 'b', 'WEIGHTS', '1', '2', 'WITHSCORES']
      );
    });

    it('with AGGREGATE', () => {
      assert.deepEqual(
        ZINTER_WITHSCORES.transformArguments('key', {
          AGGREGATE: 'SUM'
        }),
        ['ZINTER', '1', 'key', 'AGGREGATE', 'SUM', 'WITHSCORES']
      );
    });
  });

  testUtils.testAll('zInterWithScores', async client => {
    assert.deepEqual(
      await client.zInterWithScores('key'),
      []
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
