import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZINTER_WITHSCORES from './ZINTER_WITHSCORES';
import { parseArgs } from './generic-transformers';

describe('ZINTER WITHSCORES', () => {
  testUtils.isVersionGreaterThanHook([6, 2]);

  describe('transformArguments', () => {
    it('key (string)', () => {
      assert.deepEqual(
        parseArgs(ZINTER_WITHSCORES, 'key'),
        ['ZINTER', '1', 'key', 'WITHSCORES']
      );
    });

    it('keys (Array<string>)', () => {
      assert.deepEqual(
        parseArgs(ZINTER_WITHSCORES, ['1', '2']),
        ['ZINTER', '2', '1', '2', 'WITHSCORES']
      );
    });

    it('key & weight', () => {
      assert.deepEqual(
        parseArgs(ZINTER_WITHSCORES, {
          key: 'key',
          weight: 1
        }),
        ['ZINTER', '1', 'key', 'WEIGHTS', '1', 'WITHSCORES']
      );
    });

    it('keys & weights', () => {
      assert.deepEqual(
        parseArgs(ZINTER_WITHSCORES, [{
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
        parseArgs(ZINTER_WITHSCORES, 'key', {
          AGGREGATE: 'SUM'
        }),
        ['ZINTER', '1', 'key', 'AGGREGATE', 'SUM', 'WITHSCORES']
      );
    });

    it('with AGGREGATE COUNT', () => {
      assert.deepEqual(
        parseArgs(ZINTER_WITHSCORES, 'key', {
          AGGREGATE: 'COUNT'
        }),
        ['ZINTER', '1', 'key', 'AGGREGATE', 'COUNT', 'WITHSCORES']
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

  testUtils.testAll('zInterWithScores with AGGREGATE COUNT', async client => {
    const keys = [
      '{tag}zinterws-count-1',
      '{tag}zinterws-count-2',
      '{tag}zinterws-count-3'
    ];

    await Promise.all([
      client.zAdd(keys[0], [
        { value: 'common1', score: 1 },
        { value: 'common2', score: 2 },
        { value: 'only1', score: 3 }
      ]),
      client.zAdd(keys[1], [
        { value: 'common1', score: 4 },
        { value: 'common2', score: 5 },
        { value: 'only2', score: 6 }
      ]),
      client.zAdd(keys[2], [
        { value: 'common1', score: 7 },
        { value: 'common2', score: 8 },
        { value: 'only3', score: 9 }
      ])
    ]);

    const result = await client.zInterWithScores(keys, {
      AGGREGATE: 'COUNT'
    });

    assert.deepEqual(result, [
      { value: 'common1', score: 3 },
      { value: 'common2', score: 3 }
    ]);

    const scores = result.map(item => item.score);
    assert.equal(Math.min(...scores), 3);
    assert.equal(Math.max(...scores), 3);
  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 8] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 8] }
  });

  testUtils.testAll('zInterWithScores with AGGREGATE SUM, MIN, MAX', async client => {
    const keys = [
      '{tag}zinterws-other-1',
      '{tag}zinterws-other-2',
      '{tag}zinterws-other-3'
    ];

    await Promise.all([
      client.zAdd(keys[0], [
        { value: 'common1', score: 1 },
        { value: 'common2', score: 10 },
        { value: 'only1', score: 3 }
      ]),
      client.zAdd(keys[1], [
        { value: 'common1', score: 5 },
        { value: 'common2', score: 2 },
        { value: 'only2', score: 6 }
      ]),
      client.zAdd(keys[2], [
        { value: 'common1', score: 7 },
        { value: 'common2', score: 4 },
        { value: 'only3', score: 9 }
      ])
    ]);

    const expectedByAggregate = {
      SUM: {
        common1: 13,
        common2: 16
      },
      MIN: {
        common1: 1,
        common2: 2
      },
      MAX: {
        common1: 7,
        common2: 10
      }
    };

    const aggregators = ['SUM', 'MIN', 'MAX'] as const;
    for (const aggregate of aggregators) {
      const result = await client.zInterWithScores(keys, {
        AGGREGATE: aggregate
      });

      assert.deepEqual(
        Object.fromEntries(result.map(({ value, score }) => [value.toString(), score])),
        expectedByAggregate[aggregate]
      );
    }
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
