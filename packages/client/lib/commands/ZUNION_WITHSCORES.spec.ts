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

    it('with AGGREGATE COUNT', () => {
      assert.deepEqual(
        parseArgs(ZUNION_WITHSCORES, 'key', {
          AGGREGATE: 'COUNT'
        }),
        ['ZUNION', '1', 'key', 'AGGREGATE', 'COUNT', 'WITHSCORES']
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

  testUtils.testAll('zUnionWithScores with AGGREGATE COUNT', async client => {
    const keys = [
      '{tag}zunionws-count-1',
      '{tag}zunionws-count-2',
      '{tag}zunionws-count-3'
    ];

    await Promise.all([
      client.zAdd(keys[0], [
        { value: 'common1', score: 1 },
        { value: 'common2', score: 2 },
        { value: 'pair12', score: 3 },
        { value: 'only1', score: 4 }
      ]),
      client.zAdd(keys[1], [
        { value: 'common1', score: 5 },
        { value: 'common2', score: 6 },
        { value: 'pair12', score: 7 },
        { value: 'pair23', score: 8 },
        { value: 'only2', score: 9 }
      ]),
      client.zAdd(keys[2], [
        { value: 'common1', score: 10 },
        { value: 'common2', score: 11 },
        { value: 'pair23', score: 12 },
        { value: 'only3', score: 13 }
      ])
    ]);

    const result = await client.zUnionWithScores(keys, {
      AGGREGATE: 'COUNT'
    });

    assert.deepEqual(
      Object.fromEntries(result.map(({ value, score }) => [value.toString(), score])),
      {
        common1: 3,
        common2: 3,
        only1: 1,
        only2: 1,
        only3: 1,
        pair12: 2,
        pair23: 2
      }
    );

    const scores = result.map(item => item.score);
    assert.equal(Math.min(...scores), 1);
    assert.equal(Math.max(...scores), 3);
  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 8] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 8] }
  });

  testUtils.testAll('zUnionWithScores with AGGREGATE SUM, MIN, MAX', async client => {
    const keys = [
      '{tag}zunionws-other-1',
      '{tag}zunionws-other-2',
      '{tag}zunionws-other-3'
    ];

    await Promise.all([
      client.zAdd(keys[0], [
        { value: 'common1', score: 1 },
        { value: 'common2', score: 10 },
        { value: 'pair12', score: 3 },
        { value: 'only1', score: 4 }
      ]),
      client.zAdd(keys[1], [
        { value: 'common1', score: 5 },
        { value: 'common2', score: 2 },
        { value: 'pair12', score: 7 },
        { value: 'pair23', score: 8 },
        { value: 'only2', score: 9 }
      ]),
      client.zAdd(keys[2], [
        { value: 'common1', score: 7 },
        { value: 'common2', score: 4 },
        { value: 'pair23', score: 12 },
        { value: 'only3', score: 13 }
      ])
    ]);

    const expectedByAggregate = {
      SUM: {
        common1: 13,
        common2: 16,
        pair12: 10,
        pair23: 20,
        only1: 4,
        only2: 9,
        only3: 13
      },
      MIN: {
        common1: 1,
        common2: 2,
        pair12: 3,
        pair23: 8,
        only1: 4,
        only2: 9,
        only3: 13
      },
      MAX: {
        common1: 7,
        common2: 10,
        pair12: 7,
        pair23: 12,
        only1: 4,
        only2: 9,
        only3: 13
      }
    };

    const aggregators = ['SUM', 'MIN', 'MAX'] as const;
    for (const aggregate of aggregators) {
      const result = await client.zUnionWithScores(keys, {
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
