import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import MGET_WITHLABELS from './MGET_WITHLABELS';

describe('TS.MGET_WITHLABELS', () => {
  describe('transformArguments', () => {
    it('without options', () => {
      assert.deepEqual(
        MGET_WITHLABELS.transformArguments('label=value'),
        ['TS.MGET', 'WITHLABELS', 'FILTER', 'label=value']
      );
    });

    it('with SELECTED_LABELS', () => {
      assert.deepEqual(
        MGET_WITHLABELS.transformArguments('label=value', {
          SELECTED_LABELS: 'label'
        }),
        ['TS.MGET', 'SELECTED_LABELS', 'label', 'FILTER', 'label=value']
      );
    });
  });

  testUtils.testWithClient('client.ts.mGetWithLabels', async client => {
    const [, reply] = await Promise.all([
      client.ts.add('key', 0, 0, {
        LABELS: { label: 'value' }
      }),
      client.ts.mGetWithLabels('label=value')
    ]);

    const obj = Object.assign(Object.create(null), {
      'key': {
        labels: { label: 'value' },
        sample: {
          timestamp: 0,
          value: 0
        }
      }
    });
    
    assert.deepStrictEqual(reply, obj);
  }, GLOBAL.SERVERS.OPEN);
});
