import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZUNIONSTORE from './ZUNIONSTORE';
import { parseArgs } from './generic-transformers';

describe('ZUNIONSTORE', () => {
  describe('transformArguments', () => {
    it('key (string)', () => {
      assert.deepEqual(
        parseArgs(ZUNIONSTORE, 'destination', 'source'),
        ['ZUNIONSTORE', 'destination', '1', 'source']
      );
    });

    it('keys (Array<string>)', () => {
      assert.deepEqual(
        parseArgs(ZUNIONSTORE, 'destination', ['1', '2']),
        ['ZUNIONSTORE', 'destination', '2', '1', '2']
      );
    });

    it('key & weight', () => {
      assert.deepEqual(
        parseArgs(ZUNIONSTORE, 'destination', {
          key: 'source',
          weight: 1
        }),
        ['ZUNIONSTORE', 'destination', '1', 'source', 'WEIGHTS', '1']
      );
    });

    it('keys & weights', () => {
      assert.deepEqual(
        parseArgs(ZUNIONSTORE, 'destination', [{
          key: 'a',
          weight: 1
        }, {
          key: 'b',
          weight: 2
        }]),
        ['ZUNIONSTORE', 'destination', '2', 'a', 'b', 'WEIGHTS', '1', '2']
      );
    });

    it('with AGGREGATE', () => {
      assert.deepEqual(
        parseArgs(ZUNIONSTORE, 'destination', 'source', {
          AGGREGATE: 'SUM'
        }),
        ['ZUNIONSTORE', 'destination', '1', 'source', 'AGGREGATE', 'SUM']
      );
    });

    it('with AGGREGATE COUNT', () => {
      assert.deepEqual(
        parseArgs(ZUNIONSTORE, 'destination', 'source', {
          AGGREGATE: 'COUNT'
        }),
        ['ZUNIONSTORE', 'destination', '1', 'source', 'AGGREGATE', 'COUNT']
      );
    });
  });

  testUtils.testAll('zUnionStore', async client => {
    assert.equal(
      await client.zUnionStore('{tag}destination', '{tag}key'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testAll('zUnionStore with AGGREGATE COUNT', async client => {
    const keys = [
      '{tag}zunionstore-count-1',
      '{tag}zunionstore-count-2',
      '{tag}zunionstore-count-3'
    ];
    const destination = '{tag}zunionstore-count-destination';

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

    assert.equal(
      await client.zUnionStore(destination, keys, {
        AGGREGATE: 'COUNT'
      }),
      7
    );

    const result = await client.zRangeWithScores(destination, 0, -1);
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

  testUtils.testAll('zUnionStore with AGGREGATE SUM, MIN, MAX', async client => {
    const keys = [
      '{tag}zunionstore-other-1',
      '{tag}zunionstore-other-2',
      '{tag}zunionstore-other-3'
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
      const destination = `{tag}zunionstore-other-destination-${aggregate}`;
      assert.equal(
        await client.zUnionStore(destination, keys, {
          AGGREGATE: aggregate
        }),
        7
      );

      const result = await client.zRangeWithScores(destination, 0, -1);
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
