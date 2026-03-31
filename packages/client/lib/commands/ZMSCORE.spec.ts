import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import ZMSCORE from './ZMSCORE';
import { parseArgs } from './generic-transformers';

describe('ZMSCORE', () => {
  testUtils.isVersionGreaterThanHook([6, 2]);

  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        parseArgs(ZMSCORE, 'key', 'member'),
        ['ZMSCORE', 'key', 'member']
      );
    });

    it('array', () => {
      assert.deepEqual(
        parseArgs(ZMSCORE, 'key', ['1', '2']),
        ['ZMSCORE', 'key', '1', '2']
      );
    });
  });

  testUtils.testAll('zmScore - non-existent member', async client => {
    assert.deepEqual(
      await client.zmScore('key', 'member'),
      [null]
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });

  testUtils.testAll('zmScore - existing members', async client => {
    await client.zAdd('key', [
      { value: 'a', score: 1.5 },
      { value: 'b', score: 2.5 }
    ]);
    assert.deepEqual(
      await client.zmScore('key', ['a', 'b', 'c']),
      [1.5, 2.5, null]
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
