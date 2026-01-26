import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import MRANGE_GROUPBY, { TIME_SERIES_REDUCERS } from './MRANGE_GROUPBY';
import { TIME_SERIES_AGGREGATION_TYPE } from './CREATERULE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TS.MRANGE_GROUPBY', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(MRANGE_GROUPBY, '-', '+', 'label=value', {
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
        'TS.MRANGE', '-', '+',
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

  it('transformArguments with COUNTNAN reducer', () => {
    assert.deepEqual(
      parseArgs(MRANGE_GROUPBY, '-', '+', 'label=value', {
        REDUCE: TIME_SERIES_REDUCERS.COUNTNAN,
        label: 'label'
      }),
      [
        'TS.MRANGE', '-', '+',
        'FILTER', 'label=value',
        'GROUPBY', 'label', 'REDUCE', 'COUNTNAN'
      ]
    );
  });

  it('transformArguments with COUNTALL reducer', () => {
    assert.deepEqual(
      parseArgs(MRANGE_GROUPBY, '-', '+', 'label=value', {
        REDUCE: TIME_SERIES_REDUCERS.COUNTALL,
        label: 'label'
      }),
      [
        'TS.MRANGE', '-', '+',
        'FILTER', 'label=value',
        'GROUPBY', 'label', 'REDUCE', 'COUNTALL'
      ]
    );
  });

  testUtils.testWithClient('client.ts.mRangeGroupBy', async client => {
    const [, reply] = await Promise.all([
      client.ts.add('key', 0, 0, {
        LABELS: { label: 'value' }
      }),
      client.ts.mRangeGroupBy('-', '+', 'label=value', {
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

  testUtils.testWithClient('client.ts.mRangeGroupBy with COUNTNAN', async client => {
    await client.ts.add('key-countnan', 0, Number.NaN, {
      LABELS: { label: 'countnan' }
    });

    const reply = await client.ts.mRangeGroupBy('-', '+', 'label=countnan', {
      REDUCE: TIME_SERIES_REDUCERS.COUNTNAN,
      label: 'label'
    });

    assert.ok(reply['label=countnan']);
    assert.ok(reply['label=countnan'].samples.length > 0);
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 6]
  });

  testUtils.testWithClient('client.ts.mRangeGroupBy with COUNTALL', async client => {
    await client.ts.add('key-countall', 0, 1, {
      LABELS: { label: 'countall' }
    });

    const reply = await client.ts.mRangeGroupBy('-', '+', 'label=countall', {
      REDUCE: TIME_SERIES_REDUCERS.COUNTALL,
      label: 'label'
    });

    assert.ok(reply['label=countall']);
    assert.ok(reply['label=countall'].samples.length > 0);
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 6]
  });
});
