import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import MREVRANGE_MULTIAGGR from './MREVRANGE_MULTIAGGR';
import { TIME_SERIES_AGGREGATION_TYPE } from './CREATERULE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TS.MREVRANGE_MULTIAGGR', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(MREVRANGE_MULTIAGGR, '-', '+', 'label=value', {
        LATEST: true,
        FILTER_BY_TS: [0],
        FILTER_BY_VALUE: {
          min: 0,
          max: 1
        },
        COUNT: 1,
        ALIGN: '-',
        AGGREGATION: {
          types: [
            TIME_SERIES_AGGREGATION_TYPE.MIN,
            TIME_SERIES_AGGREGATION_TYPE.MAX
          ],
          timeBucket: 1
        }
      }),
      [
        'TS.MREVRANGE', '-', '+',
        'LATEST',
        'FILTER_BY_TS', '0',
        'FILTER_BY_VALUE', '0', '1',
        'COUNT', '1',
        'ALIGN', '-',
        'AGGREGATION', 'MIN,MAX', '1',
        'FILTER', 'label=value'
      ]
    );
  });

  testUtils.testWithClient('client.ts.mRevRangeMultiAggr', async client => {
    await client.ts.add('mrevrange-multiaggr', 1000, 0, {
      LABELS: {
        label: 'value'
      }
    });
    await client.ts.add('mrevrange-multiaggr', 1010, 1);
    await client.ts.add('mrevrange-multiaggr', 1020, 2);

    const reply = await client.ts.mRevRangeMultiAggr('-', '+', 'label=value', {
      AGGREGATION: {
        types: [
          TIME_SERIES_AGGREGATION_TYPE.MIN,
          TIME_SERIES_AGGREGATION_TYPE.MAX
        ],
        timeBucket: 10
      }
    });

    assert.deepStrictEqual(
      reply,
      Object.create(null, {
        'mrevrange-multiaggr': {
          configurable: true,
          enumerable: true,
          value: [
            {
              timestamp: 1020,
              values: [2, 2]
            },
            {
              timestamp: 1010,
              values: [1, 1]
            },
            {
              timestamp: 1000,
              values: [0, 0]
            }
          ]
        }
      })
    );
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 8]
  });
});
