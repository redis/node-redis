import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';

describe('RedisClientPool', () => {
  testUtils.testWithClientPool('sendCommand', async pool => {
    assert.equal(
      await pool.sendCommand(['PING']),
      'PONG'
    );
  }, GLOBAL.SERVERS.OPEN);
});
