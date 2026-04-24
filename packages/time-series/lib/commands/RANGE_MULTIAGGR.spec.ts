import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import RANGE_MULTIAGGR from './RANGE_MULTIAGGR';
import { TIME_SERIES_AGGREGATION_TYPE } from './CREATERULE';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TS.RANGE_MULTIAGGR', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(RANGE_MULTIAGGR, 'key', '-', '+', {
        FILTER_BY_TS: [0],
        FILTER_BY_VALUE: {
          min: 1,
          max: 2
        },
        COUNT: 1,
        ALIGN: '-',
        AGGREGATION: {
          types: [
            TIME_SERIES_AGGREGATION_TYPE.MIN,
            TIME_SERIES_AGGREGATION_TYPE.MAX
          ],
          timeBucket: 1
        }
      }),
      [
        'TS.RANGE', 'key', '-', '+', 'FILTER_BY_TS', '0', 'FILTER_BY_VALUE',
        '1', '2', 'COUNT', '1', 'ALIGN', '-', 'AGGREGATION', 'MIN,MAX', '1'
      ]
    );
  });

  testUtils.testWithClient('client.ts.rangeMultiAggr', async client => {
    await client.ts.create('range-multi');
    await client.ts.add('range-multi', 1000, 100);
    await client.ts.add('range-multi', 1010, 110);
    await client.ts.add('range-multi', 1020, 120);

    const reply = await client.ts.rangeMultiAggr('range-multi', '-', '+', {
      AGGREGATION: {
        types: [
          TIME_SERIES_AGGREGATION_TYPE.MIN,
          TIME_SERIES_AGGREGATION_TYPE.MAX
        ],
        timeBucket: 100
      }
    });

    assert.deepEqual(reply, [{
      timestamp: 1000,
      values: [100, 120]
    }]);
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 8]
  });
});
