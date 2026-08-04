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

    assert.deepStrictEqual(reply, Object.defineProperties({}, {
      key: {
        configurable: true,
        enumerable: true,
        value: {
          labels: Object.defineProperties({}, {
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

  testUtils.testWithClient('client.ts.mGetWithLabels with data', async client => {
    const [, reply] = await Promise.all([
      client.ts.add('key', 0, 0, {
        LABELS: { label: 'value' }
      }),
      client.ts.mGetWithLabels('label=value')
    ]);

    // RESP3 returns Map instead of Array at top level and for labels
    assert.ok(typeof reply === 'object' && !Array.isArray(reply));
    assert.ok('key' in reply);

    const entry = reply['key'];
    // Labels should be a Map/object, not an array of tuples
    assert.ok(typeof entry.labels === 'object' && !Array.isArray(entry.labels));
    assert.equal(entry.labels['label'], 'value');

    // Sample value should be a number (Double in RESP3) not a string
    assert.equal(typeof entry.sample.value, 'number');
    assert.equal(entry.sample.value, 0);
    assert.equal(entry.sample.timestamp, 0);
  }, GLOBAL.SERVERS.OPEN);
});
