import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import FLUSHDB from './FLUSHDB';
import { REDIS_FLUSH_MODES } from './FLUSHALL';
import { parseArgs } from './generic-transformers';

describe('FLUSHDB', () => {
  describe('transformArguments', () => {
    it('default', () => {
      assert.deepEqual(
        parseArgs(FLUSHDB),
        ['FLUSHDB']
      );
    });

    it('ASYNC', () => {
      assert.deepEqual(
        parseArgs(FLUSHDB, REDIS_FLUSH_MODES.ASYNC),
        ['FLUSHDB', 'ASYNC']
      );
    });

    it('SYNC', () => {
      assert.deepEqual(
        parseArgs(FLUSHDB, REDIS_FLUSH_MODES.SYNC),
        ['FLUSHDB', 'SYNC']
      );
    });
  });

  testUtils.testWithClient('client.flushDb', async client => {
    assert.equal(
      await client.flushDb(),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);
});
