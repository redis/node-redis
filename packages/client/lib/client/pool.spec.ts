import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import { RedisClientPool } from './pool';

describe('RedisClientPool', () => {
  it('should not have HOTKEYS commands (requires session affinity)', () => {
    // HOTKEYS commands require session affinity and are only available on standalone clients
    const pool = RedisClientPool.create({});
    assert.equal((pool as any).hotkeysStart, undefined);
    assert.equal((pool as any).hotkeysStop, undefined);
    assert.equal((pool as any).hotkeysGet, undefined);
    assert.equal((pool as any).hotkeysReset, undefined);
    assert.equal((pool as any).HOTKEYS_START, undefined);
    assert.equal((pool as any).HOTKEYS_STOP, undefined);
    assert.equal((pool as any).HOTKEYS_GET, undefined);
    assert.equal((pool as any).HOTKEYS_RESET, undefined);
  });

  testUtils.testWithClientPool('sendCommand', async pool => {
    assert.equal(
      await pool.sendCommand(['PING']),
      'PONG'
    );
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientPool('close', async pool => {
    assert.equal(pool.isOpen, true, 'pool should be open before close');
    await pool.close();
    assert.equal(pool.totalClients, 0, 'totalClients should be 0 after close');
    assert.equal(pool.isOpen, false, 'isOpen should be false after close');
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClientPool('destroy', async pool => {
    assert.equal(pool.isOpen, true, 'pool should be open before destroy');
    pool.destroy();
    assert.equal(pool.totalClients, 0, 'totalClients should be 0 after destroy');
    assert.equal(pool.isOpen, false, 'isOpen should be false after destroy');
  }, GLOBAL.SERVERS.OPEN);
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
