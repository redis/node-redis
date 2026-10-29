import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SPERSIST from './SPERSIST';
import { SET_EXPIRATION_TIME } from './SEXPIRETIME';
import { parseArgs } from './generic-transformers';

describe('SPERSIST', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(SPERSIST, 'key', 'member'),
        ['SPERSIST', 'key', 'MEMBERS', '1', 'member']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(SPERSIST, 'key', ['member1', 'member2']),
        ['SPERSIST', 'key', 'MEMBERS', '2', 'member1', 'member2']
      );
    });
  });

  describe('behavior', () => {
    testUtils.isVersionGreaterThanHook([8, 12]);

    testUtils.testAll('sPersist', async client => {
      assert.deepEqual(
        await client.sPersist('key', 'a'),
        [SET_EXPIRATION_TIME.MEMBER_NOT_EXISTS]
      );

      await client.sAdd('key', ['a', 'b']);
      await client.sExpire('key', 'a', 60);

      assert.deepEqual(
        await client.sPersist('key', ['a', 'b', 'missing']),
        [
          1,
          SET_EXPIRATION_TIME.NO_EXPIRATION,
          SET_EXPIRATION_TIME.MEMBER_NOT_EXISTS
        ]
      );
      assert.deepEqual(
        await client.sTTL('key', 'a'),
        [SET_EXPIRATION_TIME.NO_EXPIRATION]
      );
    }, {
      client: GLOBAL.SERVERS.OPEN,
      cluster: GLOBAL.CLUSTERS.OPEN
    });
  });
});
