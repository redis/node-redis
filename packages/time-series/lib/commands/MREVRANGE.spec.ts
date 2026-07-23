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

  it('transformArguments with EXCLUDEEMPTY', () => {
    assert.deepEqual(
      parseArgs(MREVRANGE, '-', '+', 'label=value', {
        COUNT: 1,
        EXCLUDEEMPTY: true
      }),
      [
        'TS.MREVRANGE', '-', '+',
        'COUNT', '1',
        'EXCLUDEEMPTY',
        'FILTER', 'label=value'
      ]
    );
  });

  testUtils.testWithClient('client.ts.mRevRange EXCLUDEEMPTY omits empty series', async client => {
    await Promise.all([
      client.ts.add('s', 100, 100, { LABELS: { sensor: '1' } }),
      client.ts.add('t', 100, 100, { LABELS: { sensor: '1' } }),
      client.ts.create('u', { LABELS: { sensor: '1' } })
    ]);
    await client.ts.add('u', 2000, 2000);

    const reply = await client.ts.mRevRange('-', 500, 'sensor=1', {
      EXCLUDEEMPTY: true
    });

    assert.ok('s' in reply);
    assert.ok('t' in reply);
    assert.ok(!('u' in reply), 'series "u" has no samples in range and must be omitted');
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 10]
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
