import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SPTTL from './SPTTL';
import { SET_EXPIRATION_TIME } from './SEXPIRETIME';
import { parseArgs } from './generic-transformers';

describe('SPTTL', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(SPTTL, 'key', 'member'),
        ['SPTTL', 'key', 'MEMBERS', '1', 'member']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(SPTTL, 'key', ['member1', 'member2']),
        ['SPTTL', 'key', 'MEMBERS', '2', 'member1', 'member2']
      );
    });
  });

  describe('behavior', () => {
    testUtils.isVersionGreaterThanHook([8, 12]);

    testUtils.testAll('spTTL', async client => {
      assert.deepEqual(
        await client.spTTL('key', 'a'),
        [SET_EXPIRATION_TIME.MEMBER_NOT_EXISTS]
      );

      await client.sAdd('key', ['a', 'b']);
      await client.spExpire('key', 'a', 60_000);

      const [ttl, ...rest] = await client.spTTL('key', ['a', 'b', 'missing']);
      assert.ok(ttl > 0 && ttl <= 60_000);
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
