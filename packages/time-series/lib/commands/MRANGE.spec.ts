import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import MRANGE, { TIME_SERIES_REDUCERS } from './MRANGE';
import { TIME_SERIES_AGGREGATION_TYPE } from './CREATERULE';

describe('TS.MRANGE', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      MRANGE.transformArguments('-', '+', 'label=value', {
        FILTER_BY_TS: [0],
        FILTER_BY_VALUE: {
          min: 0,
          max: 1
        },
        COUNT: 1,
        ALIGN: '-',
        AGGREGATION: {
          type: TIME_SERIES_AGGREGATION_TYPE.AVG,
          timeBucket: 1
        },
        GROUPBY: {
          label: 'label',
          reducer: TIME_SERIES_REDUCERS.SUM
        },
      }),
      [
        'TS.MRANGE', '-', '+', 'FILTER_BY_TS', '0', 'FILTER_BY_VALUE', '0', '1',
        'COUNT', '1', 'ALIGN', '-', 'AGGREGATION', 'AVG', '1', 'FILTER', 'label=value',
        'GROUPBY', 'label', 'REDUCE', 'SUM'
      ]
    );
  });

  testUtils.testWithClient('client.ts.mRange', async client => {
    const [, reply] = await Promise.all([
      client.ts.add('key', 0, 0, {
        LABELS: {
          label: 'value'
        }
      }),
      client.ts.mRange('-', '+', 'label=value', {
        COUNT: 1
      })
    ]);

    assert.deepEqual(reply, [{
      key: 'key',
      samples: [{
        timestamp: 0,
        value: 0
      }]
    }]);
  }, GLOBAL.SERVERS.OPEN);
});
