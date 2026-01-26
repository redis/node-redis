import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import RANGE from './RANGE';
import { TIME_SERIES_AGGREGATION_TYPE } from './CREATERULE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TS.RANGE', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(RANGE, 'key', '-', '+', {
        FILTER_BY_TS: [0],
        FILTER_BY_VALUE: {
          min: 1,
          max: 2
        },
        COUNT: 1,
        ALIGN: '-',
        AGGREGATION: {
          type: TIME_SERIES_AGGREGATION_TYPE.AVG,
          timeBucket: 1
        }
      }),
      [
        'TS.RANGE', 'key', '-', '+', 'FILTER_BY_TS', '0', 'FILTER_BY_VALUE',
        '1', '2', 'COUNT', '1', 'ALIGN', '-', 'AGGREGATION', 'AVG', '1'
      ]
    );
  });

  it('transformArguments with COUNTNAN aggregation', () => {
    assert.deepEqual(
      parseArgs(RANGE, 'key', '-', '+', {
        AGGREGATION: {
          type: TIME_SERIES_AGGREGATION_TYPE.COUNT_NAN,
          timeBucket: 1
        }
      }),
      [
        'TS.RANGE', 'key', '-', '+', 'AGGREGATION', 'COUNTNAN', '1'
      ]
    );
  });

  it('transformArguments with COUNTALL aggregation', () => {
    assert.deepEqual(
      parseArgs(RANGE, 'key', '-', '+', {
        AGGREGATION: {
          type: TIME_SERIES_AGGREGATION_TYPE.COUNT_ALL,
          timeBucket: 1
        }
      }),
      [
        'TS.RANGE', 'key', '-', '+', 'AGGREGATION', 'COUNTALL', '1'
      ]
    );
  });

  testUtils.testWithClient('client.ts.range', async client => {
    const [, reply] = await Promise.all([
      client.ts.add('key', 1, 2),
      client.ts.range('key', '-', '+')
    ]);

    assert.deepEqual(reply, [{
      timestamp: 1,
      value: 2
    }]);
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.ts.range with COUNTNAN aggregation', async client => {
    await client.ts.create('key-countnan');
    await client.ts.add('key-countnan', 1000, Number.NaN);
    await client.ts.add('key-countnan', 2000, Number.NaN);

    const reply = await client.ts.range('key-countnan', '-', '+', {
      AGGREGATION: {
        type: TIME_SERIES_AGGREGATION_TYPE.COUNT_NAN,
        timeBucket: 5000
      }
    });

    assert.ok(Array.isArray(reply));
    assert.equal(reply.length, 1);
    assert.equal(reply[0].value, 2);
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 6]
  });

  testUtils.testWithClient('client.ts.range with COUNTALL aggregation', async client => {
    await client.ts.create('key-countall');
    await client.ts.add('key-countall', 1000, 1);
    await client.ts.add('key-countall', 2000, 2);

    const reply = await client.ts.range('key-countall', '-', '+', {
      AGGREGATION: {
        type: TIME_SERIES_AGGREGATION_TYPE.COUNT_ALL,
        timeBucket: 5000
      }
    });

    assert.ok(Array.isArray(reply));
    assert.equal(reply.length, 1);
    assert.equal(reply[0].value, 2);
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 6]
  });
});
