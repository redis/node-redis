import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';

describe('RedisClientPool', () => {
  testUtils.testWithClientPool('sendCommand', async pool => {
    assert.equal(
      await pool.sendCommand(['PING']),
      'PONG'
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientPool(
    'proper error propagation in sequential operations',
    async (pool) => {
      let hasUnhandledRejection = false;

      process.once('unhandledRejection', () => {
        hasUnhandledRejection = true;
      });

      const groupName = 'test-group';
      const streamName = 'test-stream';

      // First attempt - should succeed
      await pool.xGroupCreate(streamName, groupName, '0', {
        MKSTREAM: true,
      });

      // Subsequent attempts - should all throw BUSYGROUP errors and be handled properly
      for (let i = 0; i < 3; i++) {
        await assert.rejects(
          pool.xGroupCreate(streamName, groupName, '0', {
            MKSTREAM: true,
          })
        );
      }

      assert.equal(hasUnhandledRejection, false);
    },
    GLOBAL.SERVERS.OPEN
  );
});
