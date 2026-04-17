import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import MREVRANGE from './MREVRANGE';
import { TIME_SERIES_AGGREGATION_TYPE } from './CREATERULE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TS.MREVRANGE', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(MREVRANGE, '-', '+', 'label=value', {
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
        'FILTER', 'label=value'
      ]
    );
  });

  testUtils.testWithClient('client.ts.mRevRange', async client => {
    const [, reply] = await Promise.all([
      client.ts.add('key', 0, 0, {
        LABELS: {
          label: 'value'
        }
      }),
      client.ts.mRevRange('-', '+', 'label=value', {
        COUNT: 1
      })
    ]);

    assert.deepStrictEqual(
      reply,
      Object.defineProperties({}, {
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

  testUtils.testWithClient('client.ts.mRevRange with data', async client => {
    const [, reply] = await Promise.all([
      client.ts.add('key', 0, 0, {
        LABELS: {
          label: 'value'
        }
      }),
      client.ts.mRevRange('-', '+', 'label=value', {
        COUNT: 1
      })
    ]);

    // RESP3 returns Map reply (converted to object) with Double values instead of
    // RESP2's Array reply with Simple string values
    assert.deepStrictEqual(
      reply,
      Object.defineProperties({}, {
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
