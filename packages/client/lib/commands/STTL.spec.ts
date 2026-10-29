import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import STTL from './STTL';
import { SET_EXPIRATION_TIME } from './SEXPIRETIME';
import { parseArgs } from './generic-transformers';

describe('STTL', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(STTL, 'key', 'member'),
        ['STTL', 'key', 'MEMBERS', '1', 'member']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(STTL, 'key', ['member1', 'member2']),
        ['STTL', 'key', 'MEMBERS', '2', 'member1', 'member2']
      );
    });
  });

  describe('behavior', () => {
    testUtils.isVersionGreaterThanHook([8, 12]);

    testUtils.testAll('sTTL', async client => {
      assert.deepEqual(
        await client.sTTL('key', 'a'),
        [SET_EXPIRATION_TIME.MEMBER_NOT_EXISTS]
      );

      await client.sAdd('key', ['a', 'b']);
      await client.sExpire('key', 'a', 60);

      const [ttl, ...rest] = await client.sTTL('key', ['a', 'b', 'missing']);
      assert.ok(ttl > 0 && ttl <= 60);
      assert.deepEqual(rest, [
        SET_EXPIRATION_TIME.NO_EXPIRATION,
        SET_EXPIRATION_TIME.MEMBER_NOT_EXISTS
      ]);
    }, {
      client: GLOBAL.SERVERS.OPEN,
      cluster: GLOBAL.CLUSTERS.OPEN
    });
  });
});
