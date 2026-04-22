import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZINTERSTORE from './ZINTERSTORE';
import { parseArgs } from './generic-transformers';

describe('ZINTERSTORE', () => {
  describe('transformArguments', () => {
    it('key (string)', () => {
      assert.deepEqual(
        parseArgs(ZINTERSTORE, 'destination', 'source'),
        ['ZINTERSTORE', 'destination', '1', 'source']
      );
    });

    it('keys (Array<string>)', () => {
      assert.deepEqual(
        parseArgs(ZINTERSTORE, 'destination', ['1', '2']),
        ['ZINTERSTORE', 'destination', '2', '1', '2']
      );
    });

    it('key & weight', () => {
      assert.deepEqual(
        parseArgs(ZINTERSTORE, 'destination', {
          key: 'source',
          weight: 1
        }),
        ['ZINTERSTORE', 'destination', '1', 'source', 'WEIGHTS', '1']
      );
    });

    it('keys & weights', () => {
      assert.deepEqual(
        parseArgs(ZINTERSTORE, 'destination', [{
          key: 'a',
          weight: 1
        }, {
          key: 'b',
          weight: 2
        }]),
        ['ZINTERSTORE', 'destination', '2', 'a', 'b', 'WEIGHTS', '1', '2']
      );
    });

    it('with AGGREGATE', () => {
      assert.deepEqual(
        parseArgs(ZINTERSTORE, 'destination', 'source', {
          AGGREGATE: 'SUM'
        }),
        ['ZINTERSTORE', 'destination', '1', 'source', 'AGGREGATE', 'SUM']
      );
    });

    it('with AGGREGATE COUNT', () => {
      assert.deepEqual(
        parseArgs(ZINTERSTORE, 'destination', 'source', {
          AGGREGATE: 'COUNT'
        }),
        ['ZINTERSTORE', 'destination', '1', 'source', 'AGGREGATE', 'COUNT']
      );
    });
  });

  testUtils.testAll('zInterStore', async client => {
    assert.equal(
      await client.zInterStore('{tag}destination', '{tag}key'),
      0
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testAll('zInterStore with AGGREGATE COUNT', async client => {
    const keys = [
      '{tag}zinterstore-count-1',
      '{tag}zinterstore-count-2',
      '{tag}zinterstore-count-3'
    ];
    const destination = '{tag}zinterstore-count-destination';

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

    assert.equal(
      await client.zInterStore(destination, keys, {
        AGGREGATE: 'COUNT'
      }),
      2
    );

    const result = await client.zRangeWithScores(destination, 0, -1);
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

  testUtils.testAll('zInterStore with AGGREGATE SUM, MIN, MAX', async client => {
    const keys = [
      '{tag}zinterstore-other-1',
      '{tag}zinterstore-other-2',
      '{tag}zinterstore-other-3'
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
      const destination = `{tag}zinterstore-other-destination-${aggregate}`;
      assert.equal(
        await client.zInterStore(destination, keys, {
          AGGREGATE: aggregate
        }),
        2
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
