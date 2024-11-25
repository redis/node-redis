import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import MRANGE from './MRANGE';
import { TIME_SERIES_AGGREGATION_TYPE } from './CREATERULE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TS.MRANGE', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(MRANGE, '-', '+', 'label=value', {
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
        'ALIGN', '-',
        'AGGREGATION', 'AVG', '1',
        'FILTER', 'label=value'
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

    assert.deepStrictEqual(
      reply,
      Object.create(null, {
        key: {
          configurable: true,
          enumerable: true,
          value: [{
            timestamp: 0,
            value: 0
          }]
        }
      })
    );
  }, GLOBAL.SERVERS.OPEN);
});
