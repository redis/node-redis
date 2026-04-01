import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import MREVRANGE_WITHLABELS from './MREVRANGE_WITHLABELS';
import { TIME_SERIES_AGGREGATION_TYPE } from './CREATERULE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TS.MREVRANGE_WITHLABELS', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(MREVRANGE_WITHLABELS, '-', '+', 'label=value', {
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
        'ALIGN', '-',
        'AGGREGATION', 'AVG', '1',
        'WITHLABELS',
        'FILTER', 'label=value'
      ]
    );
  });

  testUtils.testWithClient('client.ts.mRevRangeWithLabels', async client => {
    const [, reply] = await Promise.all([
      client.ts.add('key', 0, 0, {
        LABELS: { label: 'value' }
      }),
      client.ts.mRevRangeWithLabels('-', '+', 'label=value')
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

  testUtils.testWithClient('client.ts.mRevRangeWithLabels with data', async client => {
    const [, reply] = await Promise.all([
      client.ts.add('key', 0, 0, {
        LABELS: { label: 'value' }
      }),
      client.ts.mRevRangeWithLabels('-', '+', 'label=value')
    ]);

    // RESP3 returns Map reply (converted to object) instead of Array reply
    assert.ok(typeof reply === 'object' && !Array.isArray(reply));
    assert.ok('key' in reply);

    const entry = reply['key'];
    // Labels should be a Map/object (RESP3) not an array of tuples (RESP2)
    assert.ok(typeof entry.labels === 'object' && !Array.isArray(entry.labels));
    assert.equal(entry.labels['label'], 'value');

    // Sample values should be numbers (Double in RESP3) not strings (Simple string in RESP2)
    assert.equal(entry.samples.length, 1);
    assert.equal(typeof entry.samples[0].value, 'number');
    assert.equal(entry.samples[0].value, 0);
    assert.equal(entry.samples[0].timestamp, 0);
  }, GLOBAL.SERVERS.OPEN);
});
