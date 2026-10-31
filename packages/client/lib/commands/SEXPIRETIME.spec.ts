import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SEXPIRETIME from './SEXPIRETIME';
import { SET_EXPIRATION_TIME } from './SEXPIRETIME';
import { parseArgs } from './generic-transformers';

describe('SEXPIRETIME', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(SEXPIRETIME, 'key', 'member'),
        ['SEXPIRETIME', 'key', 'MEMBERS', '1', 'member']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(SEXPIRETIME, 'key', ['member1', 'member2']),
        ['SEXPIRETIME', 'key', 'MEMBERS', '2', 'member1', 'member2']
      );
    });
  });

  describe('behavior', () => {
    testUtils.isVersionGreaterThanHook([8, 12]);

    testUtils.testAll('sExpireTime', async client => {
      await client.sAdd('key', ['a', 'b']);

      const expiresAt = Math.floor(Date.now() / 1000) + 60;
      await client.sExpireAt('key', 'a', expiresAt);

      assert.deepEqual(
        await client.sExpireTime('key', ['a', 'b', 'missing']),
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
