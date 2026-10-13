import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import RedisClient from './index';

/**
 * Hermetic regression for #3502: oversized MULTI must reject before any
 * command is queued, and the connection must stay usable afterward.
 * Uses a real Redis on 127.0.0.1:6379 (started by deps_install_cmd).
 */
describe('MULTI queue capacity (#3502)', function () {
  this.timeout(30000);

  it('rejects oversized MULTI before any command is queued and keeps the connection usable', async () => {
    const ping = spawnSync('redis-cli', ['-h', '127.0.0.1', '-p', '6379', 'ping'], {
      encoding: 'utf8'
    });
    if (ping.status !== 0 || !String(ping.stdout).includes('PONG')) {
      // docker redis image has redis-cli inside the container; try without host tools
      const dockerPing = spawnSync('docker', ['exec', 'redis-ci', 'redis-cli', 'ping'], {
        encoding: 'utf8'
      });
      if (dockerPing.status !== 0 || !String(dockerPing.stdout).includes('PONG')) {
        assert.fail('Redis is not reachable at 127.0.0.1:6379 (deps_install_cmd should start it)');
      }
    }

    const client = RedisClient.create({
      url: 'redis://127.0.0.1:6379',
      commandsQueueMaxLength: 1000
    });
    await client.connect();
    try {
      const multi = client.multi();
      for (let i = 0; i < 1200; i++) {
        multi.set('key:' + i, 'value');
      }

      await assert.rejects(multi.exec(), /The queue is full/);

      // Let any admitted MULTI commands drain so the next set is not rejected
      // client-side for a full queue. On the bug, Redis stays in MULTI and set
      // answers "QUEUED"; with the fix, set returns "OK".
      await delay(500);

      assert.equal(await client.set('probe:3502', 'value'), 'OK');
      assert.equal(await client.get('probe:3502'), 'value');
    } finally {
      client.destroy();
    }
  });
});
