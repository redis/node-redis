import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SPEXPIRE from './SPEXPIRE';
import { SET_EXPIRATION } from './SEXPIRE';
import { parseArgs } from './generic-transformers';

describe('SPEXPIRE', () => {
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(SPEXPIRE, 'key', 'member', 1),
        ['SPEXPIRE', 'key', '1', 'MEMBERS', '1', 'member']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(SPEXPIRE, 'key', ['member1', 'member2'], 1),
        ['SPEXPIRE', 'key', '1', 'MEMBERS', '2', 'member1', 'member2']
      );
    });

    it('with set option', () => {
      assert.deepEqual(
        parseArgs(SPEXPIRE, 'key', ['member1'], 1, 'XX'),
        ['SPEXPIRE', 'key', '1', 'XX', 'MEMBERS', '1', 'member1']
      );
    });
  });

  describe('behavior', () => {
    testUtils.isVersionGreaterThanHook([8, 12]);

    testUtils.testAll('spExpire', async client => {
      await client.sAdd('key', 'a');

      assert.deepEqual(
        await client.spExpire('key', 'a', 60_000, 'XX'),
        [SET_EXPIRATION.CONDITION_NOT_MET]
      );
      assert.deepEqual(
        await client.spExpire('key', ['a', 'missing'], 60_000),
        [SET_EXPIRATION.UPDATED, SET_EXPIRATION.MEMBER_NOT_EXISTS]
      );
    }, {
      client: GLOBAL.SERVERS.OPEN,
      cluster: GLOBAL.CLUSTERS.OPEN
    });
  });
});
