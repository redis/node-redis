import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SPEXPIREAT from './SPEXPIREAT';
import { SET_EXPIRATION } from './SEXPIRE';
import { parseArgs, transformPXAT } from './generic-transformers';

describe('SPEXPIREAT', () => {
  describe('transformArguments', () => {
    it('number', () => {
      assert.deepEqual(
        parseArgs(SPEXPIREAT, 'key', 'member', 1),
        ['SPEXPIREAT', 'key', '1', 'MEMBERS', '1', 'member']
      );
    });

    it('date', () => {
      const d = new Date();
      assert.deepEqual(
        parseArgs(SPEXPIREAT, 'key', ['member1'], d),
        ['SPEXPIREAT', 'key', transformPXAT(d), 'MEMBERS', '1', 'member1']
      );
    });

    it('with set option', () => {
      assert.deepEqual(
        parseArgs(SPEXPIREAT, 'key', ['member1', 'member2'], 1, 'NX'),
        ['SPEXPIREAT', 'key', '1', 'NX', 'MEMBERS', '2', 'member1', 'member2']
      );
    });
  });

  describe('behavior', () => {
    testUtils.isVersionGreaterThanHook([8, 12]);

    testUtils.testAll('spExpireAt', async client => {
      await client.sAdd('key', ['a', 'b']);

      const expiresAt = Date.now() + 60_000;
      assert.deepEqual(
        await client.spExpireAt('key', ['a', 'missing'], expiresAt),
        [SET_EXPIRATION.UPDATED, SET_EXPIRATION.MEMBER_NOT_EXISTS]
      );
      assert.deepEqual(await client.spExpireTime('key', 'a'), [expiresAt]);
      assert.deepEqual(
        await client.spExpireAt('key', 'a', expiresAt + 60, 'NX'),
        [SET_EXPIRATION.CONDITION_NOT_MET]
      );
      assert.deepEqual(
        await client.spExpireAt('key', 'b', 1),
        [SET_EXPIRATION.DELETED]
      );
    }, {
      client: GLOBAL.SERVERS.OPEN,
      cluster: GLOBAL.CLUSTERS.OPEN
    });
  });
});
