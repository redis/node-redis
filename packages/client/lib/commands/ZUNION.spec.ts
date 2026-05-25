import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZUNION from './ZUNION';
import { parseArgs } from './generic-transformers';

describe('ZUNION', () => {
  testUtils.isVersionGreaterThanHook([6, 2]);

  describe('transformArguments', () => {
    it('key (string)', () => {
      assert.deepEqual(
        parseArgs(ZUNION, 'key'),
        ['ZUNION', '1', 'key']
      );
    });

    it('keys (Array<string>)', () => {
      assert.deepEqual(
        parseArgs(ZUNION, ['1', '2']),
        ['ZUNION', '2', '1', '2']
      );
    });

    it('key & weight', () => {
      assert.deepEqual(
        parseArgs(ZUNION, {
          key: 'key',
          weight: 1
        }),
        ['ZUNION', '1', 'key', 'WEIGHTS', '1']
      );
    });

    it('keys & weights', () => {
      assert.deepEqual(
        parseArgs(ZUNION, [{
          key: 'a',
          weight: 1
        }, {
          key: 'b',
          weight: 2
        }]),
        ['ZUNION', '2', 'a', 'b', 'WEIGHTS', '1', '2']
      );
    });

    it('with AGGREGATE', () => {
      assert.deepEqual(
        parseArgs(ZUNION, 'key', {
          AGGREGATE: 'SUM'
        }),
        ['ZUNION', '1', 'key', 'AGGREGATE', 'SUM']
      );
    });

    it('with AGGREGATE COUNT', () => {
      assert.deepEqual(
        parseArgs(ZUNION, 'key', {
          AGGREGATE: 'COUNT'
        }),
        ['ZUNION', '1', 'key', 'AGGREGATE', 'COUNT']
      );
    });
  });

  testUtils.testAll('zUnion', async client => {
    assert.deepEqual(
      await client.zUnion('key'),
      []
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testAll('zUnion with AGGREGATE COUNT', async client => {
    const keys = [
      '{tag}zunion-count-1',
      '{tag}zunion-count-2',
      '{tag}zunion-count-3'
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

    const result = await client.zUnion(keys, {
      AGGREGATE: 'COUNT'
    });

    assert.deepEqual(
      result.sort(),
      ['common1', 'common2', 'only1', 'only2', 'only3', 'pair12', 'pair23']
    );
  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 8] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 8] }
  });

  testUtils.testAll('zUnion with AGGREGATE SUM, MIN, MAX', async client => {
    const keys = [
      '{tag}zunion-other-1',
      '{tag}zunion-other-2',
      '{tag}zunion-other-3'
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

    const aggregators = ['SUM', 'MIN', 'MAX'] as const;
    for (const aggregate of aggregators) {
      const result = await client.zUnion(keys, {
        AGGREGATE: aggregate
      });

      assert.deepEqual(
        result.sort(),
        ['common1', 'common2', 'only1', 'only2', 'only3', 'pair12', 'pair23']
      );
    }
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
