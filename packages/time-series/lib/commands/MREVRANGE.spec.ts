import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import MREVRANGE from './MREVRANGE';
import { TIME_SERIES_AGGREGATION_TYPE } from './CREATERULE';
import { TIME_SERIES_REDUCERS } from './MRANGE';

describe('TS.MREVRANGE', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      MREVRANGE.transformArguments('-', '+', 'label=value', {
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
        'TS.MREVRANGE', '-', '+', 'FILTER_BY_TS', '0', 'FILTER_BY_VALUE', '0', '1',
        'COUNT', '1', 'ALIGN', '-', 'AGGREGATION', 'AVG', '1', 'FILTER', 'label=value',
        'GROUPBY', 'label', 'REDUCE', 'SUM'
      ]
    );
  });

  testUtils.testWithClient('client.ts.mRevRange', async client => {
    const [, reply] = await Promise.all([
      client.ts.add('key', 0, 0, {
        LABELS: { label: 'value' }
      }),
      client.ts.mRevRange('-', '+', 'label=value', {
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
