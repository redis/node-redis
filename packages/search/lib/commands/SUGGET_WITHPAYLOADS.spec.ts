import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SUGGET_WITHPAYLOADS from './SUGGET_WITHPAYLOADS';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('FT.SUGGET WITHPAYLOADS', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(SUGGET_WITHPAYLOADS, 'key', 'prefix'),
      ['FT.SUGGET', 'key', 'prefix', 'WITHPAYLOADS']
    );
  });

  describe('client.ft.sugGetWithPayloads', () => {
    testUtils.testWithClient('null', async client => {
      assert.equal(
        await client.ft.sugGetWithPayloads('key', 'prefix'),
        null
      );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('with suggestions', async client => {
      const [, reply] = await Promise.all([
        client.ft.sugAdd('key', 'string', 1, {
          PAYLOAD: 'payload'
        }),
        client.ft.sugGetWithPayloads('key', 'string')
      ]);

      assert.deepEqual(reply, [{
        suggestion: 'string',
        payload: 'payload'
      }]);
    }, GLOBAL.SERVERS.OPEN);
  });
});
