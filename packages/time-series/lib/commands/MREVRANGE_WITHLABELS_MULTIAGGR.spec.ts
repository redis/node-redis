import { strict as assert } from 'node:assert';
import MREVRANGE_WITHLABELS_MULTIAGGR from './MREVRANGE_WITHLABELS_MULTIAGGR';
import { TIME_SERIES_AGGREGATION_TYPE } from './CREATERULE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TS.MREVRANGE_WITHLABELS_MULTIAGGR', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(MREVRANGE_WITHLABELS_MULTIAGGR, '-', '+', 'label=value', {
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
        'WITHLABELS',
        'FILTER', 'label=value'
      ]
    );
  });
});
