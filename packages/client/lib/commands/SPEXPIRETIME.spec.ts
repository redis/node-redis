import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SPEXPIRETIME from './SPEXPIRETIME';
import { SET_EXPIRATION_TIME } from './SEXPIRETIME';
import { parseArgs } from './generic-transformers';

describe('SPEXPIRETIME', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(SPEXPIRETIME, 'key', 'member'),
        ['SPEXPIRETIME', 'key', 'MEMBERS', '1', 'member']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(SPEXPIRETIME, 'key', ['member1', 'member2']),
        ['SPEXPIRETIME', 'key', 'MEMBERS', '2', 'member1', 'member2']
      );
    });
  });

  describe('behavior', () => {
    testUtils.isVersionGreaterThanHook([8, 12]);

    testUtils.testAll('spExpireTime', async client => {
      await client.sAdd('key', ['a', 'b']);

      const expiresAt = Date.now() + 60_000;
      await client.spExpireAt('key', 'a', expiresAt);

      assert.deepEqual(
        await client.spExpireTime('key', ['a', 'b', 'missing']),
        [
          expiresAt,
          SET_EXPIRATION_TIME.NO_EXPIRATION,
          SET_EXPIRATION_TIME.MEMBER_NOT_EXISTS
        ]
      );
    }, {
      client: GLOBAL.SERVERS.OPEN,
      cluster: GLOBAL.CLUSTERS.OPEN
    });
  });
});
