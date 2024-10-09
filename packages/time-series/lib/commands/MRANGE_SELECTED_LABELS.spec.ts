import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import MRANGE_SELECTED_LABELS from './MRANGE_SELECTED_LABELS';
import { TIME_SERIES_AGGREGATION_TYPE } from './CREATERULE';

describe('TS.MRANGE_SELECTED_LABELS', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      MRANGE_SELECTED_LABELS.transformArguments('-', '+', 'label', 'label=value', {
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
        'FILTER_BY_TS', '0',
        'FILTER_BY_VALUE', '0', '1',
        'COUNT', '1',
        'ALIGN', '-', 'AGGREGATION', 'AVG', '1',
        'SELECTED_LABELS', 'label',
        'FILTER', 'label=value'
      ]
    );
  });

  testUtils.testWithClient('client.ts.mRangeSelectedLabels', async client => {
    const [, reply] = await Promise.all([
      client.ts.add('key', 0, 0, {
        LABELS: { label: 'value' }
      }),
      client.ts.mRangeSelectedLabels('-', '+', ['label', 'NX'], 'label=value', {
        COUNT: 1
      })
    ]);

    assert.deepStrictEqual(
      reply,
      Object.create(null, {
        key: {
          configurable: true,
          enumerable: true,
          value: {
            labels: Object.create(null, {
              label: {
                configurable: true,
                enumerable: true,
                value: 'value'
              },
              NX: {
                configurable: true,
                enumerable: true,
                value: null
              }
            }),
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