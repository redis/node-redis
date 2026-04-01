import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import QUERYINDEX from './QUERYINDEX';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('TS.QUERYINDEX', () => {
  describe('transformArguments', () => {
    it('single filter', () => {
      assert.deepEqual(
        parseArgs(QUERYINDEX, '*'),
        ['TS.QUERYINDEX', '*']
      );
    });

    it('multiple filters', () => {
      assert.deepEqual(
        parseArgs(QUERYINDEX, ['a=1', 'b=2']),
        ['TS.QUERYINDEX', 'a=1', 'b=2']
      );
    });
  });

  testUtils.testWithClient('client.ts.queryIndex', async client => {
    const [, reply] = await Promise.all([
      client.ts.create('key', {
        LABELS: {
          label: 'value'
        }
      }),
      client.ts.queryIndex('label=value')
    ]);

    assert.deepEqual(reply, ['key']);
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('client.ts.queryIndex with data', async client => {
    const [, reply] = await Promise.all([
      client.ts.create('key', {
        LABELS: {
          label: 'value'
        }
      }),
      client.ts.queryIndex('label=value')
    ]);

    // RESP3 returns Set reply (decoded as Array with default type mapping)
    assert.ok(Array.isArray(reply));
    assert.deepEqual(reply, ['key']);
  }, GLOBAL.SERVERS.OPEN);
});
