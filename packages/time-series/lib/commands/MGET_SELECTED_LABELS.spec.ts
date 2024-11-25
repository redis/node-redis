import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import MGET_SELECTED_LABELS from './MGET_SELECTED_LABELS';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TS.MGET_SELECTED_LABELS', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(MGET_SELECTED_LABELS, 'label=value', 'label'),
      ['TS.MGET', 'SELECTED_LABELS', 'label', 'FILTER', 'label=value']
    );
  });

  testUtils.testWithClient('client.ts.mGetSelectedLabels', async client => {
    const [, reply] = await Promise.all([
      client.ts.add('key', 0, 0, {
        LABELS: { label: 'value' }
      }),
      client.ts.mGetSelectedLabels('label=value', ['label', 'NX'])
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
            },
            NX: {
              configurable: true,
              enumerable: true,
              value: null
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
