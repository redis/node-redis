import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import MGET from './MGET';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TS.MGET', () => {
  describe('transformArguments', () => {
    it('without options', () => {
      assert.deepEqual(
        parseArgs(MGET, 'label=value'),
        ['TS.MGET', 'FILTER', 'label=value']
      );
    });

    it('with LATEST', () => {
      assert.deepEqual(
        parseArgs(MGET, 'label=value', {
          LATEST: true
        }),
        ['TS.MGET', 'LATEST', 'FILTER', 'label=value']
      );
    });
  });

  testUtils.testWithClient('client.ts.mGet', async client => {
    const [, reply] = await Promise.all([
      client.ts.add('key', 0, 0, {
        LABELS: { label: 'value' }
      }),
      client.ts.mGet('label=value')
    ]);

    assert.deepStrictEqual(reply, Object.create(null, {
      key: {
        configurable: true,
        enumerable: true,
        value: {
          sample: {
            timestamp: 0,
            value: 0
          }
        }
      }
    }));
  }, GLOBAL.SERVERS.OPEN);
});
