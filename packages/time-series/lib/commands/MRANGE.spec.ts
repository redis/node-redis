import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import MRANGE, { TIME_SERIES_REDUCERS } from './MRANGE';
import { TIME_SERIES_AGGREGATION_TYPE } from './CREATERULE';
import { CommandArguments } from '@redis/client/lib/RESP/types';

describe('TS.MRANGE', () => {
  it('transformArguments', () => {
    const expectedReply: CommandArguments = [
      'TS.MRANGE', '-', '+', 'FILTER_BY_TS', '0', 'FILTER_BY_VALUE', '0', '1',
      'COUNT', '1', 'ALIGN', '-', 'AGGREGATION', 'AVG', '1', 'FILTER', 'label=value',
      'GROUPBY', 'label', 'REDUCE', 'SUM'
    ];
    expectedReply.preserve = true;
    
    assert.deepEqual(
      MRANGE.transformArguments('-', '+', 'label=value', {
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
        },
        GROUPBY: {
          label: 'label',
          reducer: TIME_SERIES_REDUCERS.SUM
        },
      }),
      expectedReply
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

    const obj = Object.assign(Object.create(null), {
      'key': {
        samples: [{
          timestamp: 0,
          value: 0
        }]
      }
    });

    assert.deepStrictEqual(reply, obj);
  }, GLOBAL.SERVERS.OPEN);
});
