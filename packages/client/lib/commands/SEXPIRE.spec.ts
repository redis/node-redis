import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SEXPIRE, { SET_EXPIRATION } from './SEXPIRE';
import { parseArgs } from './generic-transformers';

describe('SEXPIRE', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(SEXPIRE, 'key', 'member', 1),
        ['SEXPIRE', 'key', '1', 'MEMBERS', '1', 'member']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(SEXPIRE, 'key', ['member1', 'member2'], 1),
        ['SEXPIRE', 'key', '1', 'MEMBERS', '2', 'member1', 'member2']
      );
    });

    it('with set option', () => {
      assert.deepEqual(
        parseArgs(SEXPIRE, 'key', ['member1'], 1, 'NX'),
        ['SEXPIRE', 'key', '1', 'NX', 'MEMBERS', '1', 'member1']
      );
    });
  });

  describe('behavior', () => {
    testUtils.isVersionGreaterThanHook([8, 12]);

    testUtils.testAll('sExpire', async client => {
      await client.sAdd('key', ['a', 'b']);

      assert.deepEqual(
        await client.sExpire('key', ['a', 'missing'], 60),
        [SET_EXPIRATION.UPDATED, SET_EXPIRATION.MEMBER_NOT_EXISTS]
      );
      assert.deepEqual(
        await client.sExpire('key', 'a', 30, 'GT'),
        [SET_EXPIRATION.CONDITION_NOT_MET]
      );
      assert.deepEqual(
        await client.sExpire('key', 'a', 0),
        [SET_EXPIRATION.DELETED]
      );
      assert.deepEqual(await client.sMembers('key'), ['b']);
    }, {
      client: GLOBAL.SERVERS.OPEN,
      cluster: GLOBAL.CLUSTERS.OPEN
    });
  });
});
