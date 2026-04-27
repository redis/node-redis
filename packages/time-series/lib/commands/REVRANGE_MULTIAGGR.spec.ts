import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import REVRANGE_MULTIAGGR from './REVRANGE_MULTIAGGR';
import { TIME_SERIES_AGGREGATION_TYPE } from '../index';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TS.REVRANGE_MULTIAGGR', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(REVRANGE_MULTIAGGR, 'key', '-', '+', {
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
        'TS.REVRANGE', 'key', '-', '+', 'FILTER_BY_TS', '0', 'FILTER_BY_VALUE',
        '1', '2', 'COUNT', '1', 'ALIGN', '-', 'AGGREGATION', 'MIN,MAX', '1'
      ]
    );
  });

  testUtils.testWithClient('client.ts.revRangeMultiAggr', async client => {
    await client.ts.create('revrange-multiaggr');
    await client.ts.add('revrange-multiaggr', 1000, 100);
    await client.ts.add('revrange-multiaggr', 1010, 110);
    await client.ts.add('revrange-multiaggr', 1020, 120);

    const reply = await client.ts.revRangeMultiAggr('revrange-multiaggr', '-', '+', {
      AGGREGATION: {
        types: [
          TIME_SERIES_AGGREGATION_TYPE.MIN,
          TIME_SERIES_AGGREGATION_TYPE.MAX
        ],
        timeBucket: 10
      }
    });

    assert.deepEqual(reply, [
      {
        timestamp: 1020,
        values: [120, 120]
      },
      {
        timestamp: 1010,
        values: [110, 110]
      },
      {
        timestamp: 1000,
        values: [100, 100]
      }
    ]);
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 8]
  });
});
