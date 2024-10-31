import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import REVRANGE from './REVRANGE';
import { TIME_SERIES_AGGREGATION_TYPE } from '../index';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TS.REVRANGE', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(REVRANGE, 'key', '-', '+', {
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
        'TS.REVRANGE', 'key', '-', '+', 'FILTER_BY_TS', '0', 'FILTER_BY_VALUE',
        '1', '2', 'COUNT', '1', 'ALIGN', '-', 'AGGREGATION', 'AVG', '1'
      ]
    );
  });

  testUtils.testWithClient('client.ts.revRange', async client => {
    const [, reply] = await Promise.all([
      client.ts.add('key', 1, 2),
      client.ts.revRange('key', '-', '+')
    ]);

    assert.deepEqual(reply, [{
      timestamp: 1,
      value: 2
    }]);
  }, GLOBAL.SERVERS.OPEN);
});
