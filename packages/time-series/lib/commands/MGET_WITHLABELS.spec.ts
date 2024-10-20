import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import MGET_WITHLABELS from './MGET_WITHLABELS';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TS.MGET_WITHLABELS', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(MGET_WITHLABELS, 'label=value'),
      ['TS.MGET', 'WITHLABELS', 'FILTER', 'label=value']
    );
  });

  testUtils.testWithClient('client.ts.mGetWithLabels', async client => {
    const [, reply] = await Promise.all([
      client.ts.add('key', 0, 0, {
        LABELS: { label: 'value' }
      }),
      client.ts.mGetWithLabels('label=value')
    ]);
    
    assert.deepStrictEqual(reply, Object.create(null, {
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
          sample: {
            timestamp: 0,
            value: 0
          }
        }
      }
    }));
  }, GLOBAL.SERVERS.OPEN);
});
