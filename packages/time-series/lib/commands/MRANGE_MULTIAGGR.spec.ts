import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import MRANGE_MULTIAGGR from './MRANGE_MULTIAGGR';
import { TIME_SERIES_AGGREGATION_TYPE } from './CREATERULE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TS.MRANGE_MULTIAGGR', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(MRANGE_MULTIAGGR, '-', '+', 'label=value', {
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
        'TS.MRANGE', '-', '+',
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

  testUtils.testWithClient('client.ts.mRangeMultiAggr', async client => {
    await client.ts.add('mrange-multi', 1000, 0, {
      LABELS: {
        label: 'value'
      }
    });
    await client.ts.add('mrange-multi', 1001, 1);
    await client.ts.add('mrange-multi', 1002, 2);

    const reply = await client.ts.mRangeMultiAggr('-', '+', 'label=value', {
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
        'mrange-multi': {
          configurable: true,
          enumerable: true,
          value: [{
            timestamp: 1000,
            values: [0, 2]
          }]
        }
      })
    );
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 8]
  });
});
