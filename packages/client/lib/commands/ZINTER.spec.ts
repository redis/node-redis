import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZINTER from './ZINTER';
import { parseArgs } from './generic-transformers';

describe('ZINTER', () => {
  testUtils.isVersionGreaterThanHook([6, 2]);

  describe('transformArguments', () => {
    it('key (string)', () => {
      assert.deepEqual(
        parseArgs(ZINTER, 'key'),
        ['ZINTER', '1', 'key']
      );
    });

    it('keys (Array<string>)', () => {
      assert.deepEqual(
        parseArgs(ZINTER, ['1', '2']),
        ['ZINTER', '2', '1', '2']
      );
    });

    it('key & weight', () => {
      assert.deepEqual(
        parseArgs(ZINTER, {
          key: 'key',
          weight: 1
        }),
        ['ZINTER', '1', 'key', 'WEIGHTS', '1']
      );
    });

    it('keys & weights', () => {
      assert.deepEqual(
        parseArgs(ZINTER, [{
          key: 'a',
          weight: 1
        }, {
          key: 'b',
          weight: 2
        }]),
        ['ZINTER', '2', 'a', 'b', 'WEIGHTS', '1', '2']
      );
    });

    it('with AGGREGATE', () => {
      assert.deepEqual(
        parseArgs(ZINTER, 'key', {
          AGGREGATE: 'SUM'
        }),
        ['ZINTER', '1', 'key', 'AGGREGATE', 'SUM']
      );
    });

    it('with AGGREGATE COUNT', () => {
      assert.deepEqual(
        parseArgs(ZINTER, 'key', {
          AGGREGATE: 'COUNT'
        }),
        ['ZINTER', '1', 'key', 'AGGREGATE', 'COUNT']
      );
    });
  });

  testUtils.testAll('zInter', async client => {
    assert.deepEqual(
      await client.zInter('key'),
      []
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testAll('zInter with AGGREGATE COUNT', async client => {
    const keys = [
      '{tag}zinter-count-1',
      '{tag}zinter-count-2',
      '{tag}zinter-count-3'
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

    assert.deepEqual(
      await client.zInter(keys, {
        AGGREGATE: 'COUNT'
      }),
      ['common1', 'common2']
    );
  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 8] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 8] }
  });

  testUtils.testAll('zInter with AGGREGATE SUM, MIN, MAX', async client => {
    const keys = [
      '{tag}zinter-other-1',
      '{tag}zinter-other-2',
      '{tag}zinter-other-3'
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

    const aggregators = ['SUM', 'MIN', 'MAX'] as const;
    for (const aggregate of aggregators) {
      const result = await client.zInter(keys, {
        AGGREGATE: aggregate
      });

      assert.deepEqual(result.sort(), ['common1', 'common2']);
    }
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
