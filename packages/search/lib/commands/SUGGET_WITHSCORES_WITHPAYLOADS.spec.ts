import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SUGGET_WITHSCORES_WITHPAYLOADS from './SUGGET_WITHSCORES_WITHPAYLOADS';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('FT.SUGGET WITHSCORES WITHPAYLOADS', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(SUGGET_WITHSCORES_WITHPAYLOADS, 'key', 'prefix'),
      ['FT.SUGGET', 'key', 'prefix', 'WITHSCORES', 'WITHPAYLOADS']
    );
  });

  describe('client.ft.sugGetWithScoresWithPayloads', () => {
    testUtils.testWithClient('null', async client => {
      assert.equal(
        await client.ft.sugGetWithScoresWithPayloads('key', 'prefix'),
        null
      );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('with suggestions', async client => {
      const [, reply] = await Promise.all([
        client.ft.sugAdd('key', 'string', 1, {
          PAYLOAD: 'payload'
        }),
        client.ft.sugGetWithScoresWithPayloads('key', 'string')
      ]);

      assert.ok(Array.isArray(reply));
      assert.equal(reply.length, 1);
      assert.equal(reply[0].suggestion, 'string');
      assert.equal(typeof reply[0].score, 'number');
      assert.equal(reply[0].payload, 'payload');
    }, GLOBAL.SERVERS.OPEN);
  });
});
