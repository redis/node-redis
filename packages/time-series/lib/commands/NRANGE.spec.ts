import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import NRANGE from './NRANGE';
import { TIME_SERIES_AGGREGATION_TYPE } from './CREATERULE';
import { TIME_SERIES_BUCKET_TIMESTAMP } from './RANGE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TS.NRANGE', () => {
  it('transformArguments (minimal)', () => {
    assert.deepEqual(
      parseArgs(NRANGE, ['a', 'b', 'c'], '-', '+'),
      ['TS.NRANGE', '3', 'a', 'b', 'c', '-', '+']
    );
  });

  it('transformArguments preserves key order and duplicates', () => {
    assert.deepEqual(
      parseArgs(NRANGE, ['k', 'k'], '-', '+'),
      ['TS.NRANGE', '2', 'k', 'k', '-', '+']
    );
  });

  it('transformArguments (all options, aggregators as separate tokens)', () => {
    assert.deepEqual(
      parseArgs(NRANGE, ['a', 'b', 'c'], '-', '+', {
        LATEST: true,
        FILTER_BY_TS: [0, 1],
        FILTER_BY_VALUE: {
          min: 1,
          max: 2
        },
        COUNT: 1,
        ALIGN: '-',
        AGGREGATION: {
          types: [
            TIME_SERIES_AGGREGATION_TYPE.FIRST,
            TIME_SERIES_AGGREGATION_TYPE.MAX,
            TIME_SERIES_AGGREGATION_TYPE.MIN
          ],
          timeBucket: 10000,
          BUCKETTIMESTAMP: TIME_SERIES_BUCKET_TIMESTAMP.LOW,
          EMPTY: true
        }
      }),
      [
        'TS.NRANGE', '3', 'a', 'b', 'c', '-', '+', 'LATEST',
        'FILTER_BY_TS', '0', '1', 'FILTER_BY_VALUE', '1', '2', 'COUNT', '1',
        'ALIGN', '-', 'AGGREGATION', 'FIRST', 'MAX', 'MIN', '10000',
        'BUCKETTIMESTAMP', '-', 'EMPTY'
      ]
    );
  });

  testUtils.testWithClient('client.ts.nRange (raw)', async client => {
    await Promise.all([
      client.ts.create('{t}:1'),
      client.ts.create('{t}:2')
    ]);
    await Promise.all([
      client.ts.add('{t}:1', 1000, 10),
      client.ts.add('{t}:1', 2000, 12),
      client.ts.add('{t}:2', 1000, 13)
    ]);

    assert.deepEqual(
      await client.ts.nRange(['{t}:1', '{t}:2'], '-', '+'),
      [
        { timestamp: 1000, values: [10, 13] },
        { timestamp: 2000, values: [12, NaN] }
      ]
    );
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 10]
  });

  testUtils.testWithClient('client.ts.nRange (aggregation)', async client => {
    await Promise.all([
      client.ts.create('{t}:1'),
      client.ts.create('{t}:2')
    ]);
    await Promise.all([
      client.ts.add('{t}:1', 1000, 10),
      client.ts.add('{t}:1', 1500, 20),
      client.ts.add('{t}:2', 1000, 5)
    ]);

    const reply = await client.ts.nRange(['{t}:1', '{t}:2'], 0, 3000, {
      AGGREGATION: {
        types: [
          TIME_SERIES_AGGREGATION_TYPE.MAX,
          TIME_SERIES_AGGREGATION_TYPE.MIN
        ],
        timeBucket: 1000
      }
    });

    assert.deepEqual(reply, [
      { timestamp: 1000, values: [20, 5] }
    ]);
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 10]
  });

  testUtils.testWithClient('client.ts.nRange (empty result)', async client => {
    await client.ts.create('{t}:1');

    assert.deepEqual(
      await client.ts.nRange(['{t}:1'], 5000, 6000),
      []
    );
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 10]
  });
});
