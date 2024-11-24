import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SUGGET_WITHSCORES from './SUGGET_WITHSCORES';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('FT.SUGGET WITHSCORES', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(SUGGET_WITHSCORES, 'key', 'prefix'),
      ['FT.SUGGET', 'key', 'prefix', 'WITHSCORES']
    );
  });

  describe('client.ft.sugGetWithScores', () => {
    testUtils.testWithClient('null', async client => {
      assert.equal(
        await client.ft.sugGetWithScores('key', 'prefix'),
        null
      );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('with suggestions', async client => {
      const [, reply] = await Promise.all([
        client.ft.sugAdd('key', 'string', 1),
        client.ft.sugGetWithScores('key', 's')
      ]);

      assert.ok(Array.isArray(reply));
      assert.equal(reply.length, 1);
      assert.equal(reply[0].suggestion, 'string');
      assert.equal(typeof reply[0].score, 'number');
    }, GLOBAL.SERVERS.OPEN);
  });
});
