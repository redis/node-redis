import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZRANGE_WITHSCORES from './ZRANGE_WITHSCORES';
import { parseArgs } from './generic-transformers';

describe('ZRANGE WITHSCORES', () => {
  describe('transformArguments', () => {
    it('simple', () => {
      assert.deepEqual(
        parseArgs(ZRANGE_WITHSCORES, 'src', 0, 1),
        ['ZRANGE', 'src', '0', '1', 'WITHSCORES']
      );
    });

    it('with BY', () => {
      assert.deepEqual(
        parseArgs(ZRANGE_WITHSCORES, 'src', 0, 1, {
          BY: 'SCORE'
        }),
        ['ZRANGE', 'src', '0', '1', 'BYSCORE', 'WITHSCORES']
      );
    });

    it('with REV', () => {
      assert.deepEqual(
        parseArgs(ZRANGE_WITHSCORES, 'src', 0, 1, {
          REV: true
        }),
        ['ZRANGE', 'src', '0', '1', 'REV', 'WITHSCORES']
      );
    });

    it('with LIMIT', () => {
      assert.deepEqual(
        parseArgs(ZRANGE_WITHSCORES, 'src', 0, 1, {
          LIMIT: {
            offset: 0,
            count: 1
          }
        }),
        ['ZRANGE', 'src', '0', '1', 'LIMIT', '0', '1', 'WITHSCORES']
      );
    });

    it('with BY & REV & LIMIT', () => {
      assert.deepEqual(
        parseArgs(ZRANGE_WITHSCORES, 'src', 0, 1, {
          BY: 'SCORE',
          REV: true,
          LIMIT: {
            offset: 0,
            count: 1
          }
        }),
        ['ZRANGE', 'src', '0', '1', 'BYSCORE', 'REV', 'LIMIT', '0', '1', 'WITHSCORES']
      );
    });
  });

  testUtils.testAll('zRangeWithScores', async client => {
    const members = [{
      value: '1',
      score: 1
    }];

    const [, reply] = await Promise.all([
      client.zAdd('key', members),
      client.zRangeWithScores('key', 0, 1)
    ]);

    assert.deepEqual(reply, members);
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
