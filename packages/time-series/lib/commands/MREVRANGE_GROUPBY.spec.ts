import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import MREVRANGE_GROUPBY from './MREVRANGE_GROUPBY';
import { TIME_SERIES_REDUCERS } from './MRANGE_GROUPBY';
import { TIME_SERIES_AGGREGATION_TYPE } from './CREATERULE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TS.MREVRANGE_GROUPBY', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(MREVRANGE_GROUPBY, '-', '+', 'label=value', {
        REDUCE: TIME_SERIES_REDUCERS.AVG,
        label: 'label'
      }, {
        LATEST: true,
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
        }
      }),
      [
        'TS.MREVRANGE', '-', '+',
        'LATEST',
        'FILTER_BY_TS', '0',
        'FILTER_BY_VALUE', '0', '1',
        'COUNT', '1',
        'ALIGN', '-', 'AGGREGATION', 'AVG', '1',
        'FILTER', 'label=value',
        'GROUPBY', 'label', 'REDUCE', 'AVG'
      ]
    );
  });

  testUtils.testWithClient('client.ts.mRevRangeGroupBy', async client => {
    const [, reply] = await Promise.all([
      client.ts.add('key', 0, 0, {
        LABELS: { label: 'value' }
      }),
      client.ts.mRevRangeGroupBy('-', '+', 'label=value', {
        REDUCE: TIME_SERIES_REDUCERS.AVG,
        label: 'label'
      })
    ]);

    assert.deepStrictEqual(
      reply,
      Object.create(null, {
        'label=value': {
          configurable: true,
          enumerable: true,
          value: {  
            samples: [{
              timestamp: 0,
              value: 0
            }]
          }
        }
      })
    );
  }, GLOBAL.SERVERS.OPEN);
});
