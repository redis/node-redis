import { strict as assert } from 'node:assert';
import MREVRANGE_SELECTED_LABELS_MULTIAGGR from './MREVRANGE_SELECTED_LABELS_MULTIAGGR';
import { TIME_SERIES_AGGREGATION_TYPE } from './CREATERULE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TS.MREVRANGE_SELECTED_LABELS_MULTIAGGR', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(MREVRANGE_SELECTED_LABELS_MULTIAGGR, '-', '+', 'label', 'label=value', {
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
        'FILTER_BY_TS', '0',
        'FILTER_BY_VALUE', '0', '1',
        'COUNT', '1',
        'ALIGN', '-',
        'AGGREGATION', 'MIN,MAX', '1',
        'SELECTED_LABELS', 'label',
        'FILTER', 'label=value'
      ]
    );
  });
});
