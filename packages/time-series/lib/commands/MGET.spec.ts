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

    assert.deepStrictEqual(reply, Object.defineProperties({}, {
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

  for (const RESP of [2, 3] as const) {
    testUtils.testWithClient(`client.ts.mGet with an empty series (RESP${RESP})`, async client => {
      await client.ts.create('key', { LABELS: { label: 'value' } });

      const reply = await client.ts.mGet('label=value');
      assert.equal(reply.key.sample, null);
    }, {
      ...GLOBAL.SERVERS.OPEN,
      clientOptions: {
        ...GLOBAL.SERVERS.OPEN.clientOptions,
        RESP
      }
    });
  }
});
