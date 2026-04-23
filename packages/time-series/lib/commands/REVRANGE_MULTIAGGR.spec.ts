import { strict as assert } from 'node:assert';
import REVRANGE_MULTIAGGR from './REVRANGE_MULTIAGGR';
import { TIME_SERIES_AGGREGATION_TYPE } from '../index';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TS.REVRANGE_MULTIAGGR', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(REVRANGE_MULTIAGGR, 'key', '-', '+', {
        FILTER_BY_TS: [0],
        FILTER_BY_VALUE: {
          min: 1,
          max: 2
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
        'TS.REVRANGE', 'key', '-', '+', 'FILTER_BY_TS', '0', 'FILTER_BY_VALUE',
        '1', '2', 'COUNT', '1', 'ALIGN', '-', 'AGGREGATION', 'MIN,MAX', '1'
      ]
    );
  });
});
