import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import FLUSHALL, { REDIS_FLUSH_MODES } from './FLUSHALL';
import { parseArgs } from './generic-transformers';

describe('FLUSHALL', () => {
  describe('transformArguments', () => {
    it('default', () => {
      assert.deepEqual(
        parseArgs(FLUSHALL),
        ['FLUSHALL']
      );
    });

    it('ASYNC', () => {
      assert.deepEqual(
        parseArgs(FLUSHALL,REDIS_FLUSH_MODES.ASYNC),
        ['FLUSHALL', 'ASYNC']
      );
    });

    it('SYNC', () => {
      assert.deepEqual(
        parseArgs(FLUSHALL, REDIS_FLUSH_MODES.SYNC),
        ['FLUSHALL', 'SYNC']
      );
    });
  });

  testUtils.testWithClient('client.flushAll', async client => {
    assert.equal(
      await client.flushAll(),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);
});
