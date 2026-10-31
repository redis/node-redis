import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SEXPIREAT from './SEXPIREAT';
import { SET_EXPIRATION } from './SEXPIRE';
import { parseArgs, transformEXAT } from './generic-transformers';

describe('SEXPIREAT', () => {
  describe('transformArguments', () => {
    it('number', () => {
      assert.deepEqual(
        parseArgs(SEXPIREAT, 'key', 'member', 1),
        ['SEXPIREAT', 'key', '1', 'MEMBERS', '1', 'member']
      );
    });

    it('date', () => {
      const d = new Date();
      assert.deepEqual(
        parseArgs(SEXPIREAT, 'key', ['member1'], d),
        ['SEXPIREAT', 'key', transformEXAT(d), 'MEMBERS', '1', 'member1']
      );
    });

    it('with set option', () => {
      assert.deepEqual(
        parseArgs(SEXPIREAT, 'key', ['member1', 'member2'], 1, 'NX'),
        ['SEXPIREAT', 'key', '1', 'NX', 'MEMBERS', '2', 'member1', 'member2']
      );
    });
  });

  describe('behavior', () => {
    testUtils.isVersionGreaterThanHook([8, 12]);

    testUtils.testAll('sExpireAt', async client => {
      await client.sAdd('key', ['a', 'b']);

      const expiresAt = Math.floor(Date.now() / 1000) + 60;
      assert.deepEqual(
        await client.sExpireAt('key', ['a', 'missing'], expiresAt),
        [SET_EXPIRATION.UPDATED, SET_EXPIRATION.MEMBER_NOT_EXISTS]
      );
      assert.deepEqual(await client.sExpireTime('key', 'a'), [expiresAt]);
      assert.deepEqual(
        await client.sExpireAt('key', 'a', expiresAt + 60, 'NX'),
        [SET_EXPIRATION.CONDITION_NOT_MET]
      );
      assert.deepEqual(
        await client.sExpireAt('key', 'b', 1),
        [SET_EXPIRATION.DELETED]
      );
    }, {
      client: GLOBAL.SERVERS.OPEN,
      cluster: GLOBAL.CLUSTERS.OPEN
    });
  });
});
