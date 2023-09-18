import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import FLUSHALL, { REDIS_FLUSH_MODES } from './FLUSHALL';

describe('FLUSHALL', () => {
  describe('transformArguments', () => {
    it('default', () => {
      assert.deepEqual(
        FLUSHALL.transformArguments(),
        ['FLUSHALL']
      );
    });

    it('ASYNC', () => {
      assert.deepEqual(
        FLUSHALL.transformArguments(REDIS_FLUSH_MODES.ASYNC),
        ['FLUSHALL', 'ASYNC']
      );
    });

    it('SYNC', () => {
      assert.deepEqual(
        FLUSHALL.transformArguments(REDIS_FLUSH_MODES.SYNC),
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
