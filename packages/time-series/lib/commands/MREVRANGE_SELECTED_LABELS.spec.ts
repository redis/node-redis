import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import MREVRANGE_SELECTED_LABELS from './MREVRANGE_SELECTED_LABELS';
import { TIME_SERIES_AGGREGATION_TYPE } from './CREATERULE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TS.MREVRANGE_SELECTED_LABELS', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(MREVRANGE_SELECTED_LABELS, '-', '+', 'label', 'label=value', {
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
        'FILTER_BY_TS', '0',
        'FILTER_BY_VALUE', '0', '1',
        'COUNT', '1',
        'ALIGN', '-', 'AGGREGATION', 'AVG', '1',
        'SELECTED_LABELS', 'label',
        'FILTER', 'label=value'
      ]
    );
  });

  testUtils.testWithClient('client.ts.mRevRangeSelectedLabels', async client => {
    const [, reply] = await Promise.all([
      client.ts.add('key', 0, 0, {
        LABELS: { label: 'value' }
      }),
      client.ts.mRevRangeSelectedLabels('-', '+', ['label', 'NX'], 'label=value', {
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

  testUtils.testWithClient('client.ts.mRevRangeSelectedLabels with data', async client => {
    const [, reply] = await Promise.all([
      client.ts.add('key', 0, 0, {
        LABELS: { label: 'value' }
      }),
      client.ts.mRevRangeSelectedLabels('-', '+', ['label'], 'label=value', {
        COUNT: 1
      })
    ]);

    // RESP3 returns Map instead of Array at top level and for labels
    assert.ok(typeof reply === 'object' && !Array.isArray(reply));
    assert.ok('key' in reply);

    const entry = reply['key'];
    // Labels should be a Map/object, not an array of tuples
    assert.ok(typeof entry.labels === 'object' && !Array.isArray(entry.labels));

    // Sample values should be numbers (Double in RESP3) not strings
    assert.equal(entry.samples.length, 1);
    assert.equal(typeof entry.samples[0].value, 'number');
    assert.equal(entry.samples[0].value, 0);
    assert.equal(entry.samples[0].timestamp, 0);
  }, GLOBAL.SERVERS.OPEN);
});
