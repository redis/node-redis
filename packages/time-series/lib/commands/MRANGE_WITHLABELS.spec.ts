import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import MRANGE_WITHLABELS from './MRANGE_WITHLABELS';
import { TIME_SERIES_AGGREGATION_TYPE } from './CREATERULE';
import { TIME_SERIES_REDUCERS } from './MRANGE';

describe('TS.MRANGE_WITHLABELS', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      MRANGE_WITHLABELS.transformArguments('-', '+', 'label=value', {
        FILTER_BY_TS: [0],
        FILTER_BY_VALUE: {
          min: 0,
          max: 1
        },
        SELECTED_LABELS: ['label'],
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
      ['TS.MRANGE', '-', '+', 'FILTER_BY_TS', '0', 'FILTER_BY_VALUE', '0', '1',
        'COUNT', '1', 'ALIGN', '-', 'AGGREGATION', 'AVG', '1', 'SELECTED_LABELS', 'label',
        'FILTER', 'label=value', 'GROUPBY', 'label', 'REDUCE', 'SUM']
    );
  });

  testUtils.testWithClient('client.ts.mRangeWithLabels', async client => {
    await client.ts.add('key', 0, 0, {
      LABELS: { label: 'value' }
    });

    assert.deepEqual(
      await client.ts.mRangeWithLabels('-', '+', 'label=value', {
        COUNT: 1
      }),
      [{
        key: 'key',
        labels: { label: 'value' },
        samples: [{
          timestamp: 0,
          value: 0
        }]
      }]
    );
  }, GLOBAL.SERVERS.OPEN);
});
