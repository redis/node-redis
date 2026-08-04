import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import NREVRANGE from './NREVRANGE';
import { TIME_SERIES_AGGREGATION_TYPE } from './CREATERULE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TS.NREVRANGE', () => {
  it('transformArguments (minimal)', () => {
    assert.deepEqual(
      parseArgs(NREVRANGE, ['a', 'b', 'c'], '-', '+'),
      ['TS.NREVRANGE', '3', 'a', 'b', 'c', '-', '+']
    );
  });

  it('transformArguments (one aggregator per key)', () => {
    assert.deepEqual(
      parseArgs(NREVRANGE, ['a', 'b'], '-', '+', {
        AGGREGATION: {
          types: [
            [TIME_SERIES_AGGREGATION_TYPE.MIN],
            [TIME_SERIES_AGGREGATION_TYPE.MAX]
          ],
          timeBucket: 1000
        }
      }),
      [
        'TS.NREVRANGE', '2', 'a', 'b', '-', '+',
        'AGGREGATION', 'MIN', 'MAX', '1000'
      ]
    );
  });

  it('transformArguments (multiple aggregators per key, comma-joined)', () => {
    assert.deepEqual(
      parseArgs(NREVRANGE, ['a', 'b'], '-', '+', {
        AGGREGATION: {
          types: [
            [
              TIME_SERIES_AGGREGATION_TYPE.MIN,
              TIME_SERIES_AGGREGATION_TYPE.MAX
            ],
            [TIME_SERIES_AGGREGATION_TYPE.SUM]
          ],
          timeBucket: 1000
        }
      }),
      [
        'TS.NREVRANGE', '2', 'a', 'b', '-', '+',
        'AGGREGATION', 'MIN,MAX', 'SUM', '1000'
      ]
    );
  });

  testUtils.testWithClient('client.ts.nRevRange (reverse order)', async client => {
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
      await client.ts.nRevRange(['{t}:1', '{t}:2'], '-', '+'),
      [
        { timestamp: 2000, values: [12, NaN] },
        { timestamp: 1000, values: [10, 13] }
      ]
    );
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 10]
  });
});
