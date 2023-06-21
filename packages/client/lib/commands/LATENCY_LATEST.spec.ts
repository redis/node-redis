import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import LATENCY_LATEST from './LATENCY_LATEST';

describe('LATENCY LATEST', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      LATENCY_LATEST.transformArguments(),
      ['LATENCY', 'LATEST']
    );
  });

  testUtils.testWithClient('client.latencyLatest', async client => {
    await Promise.all([
      client.configSet('latency-monitor-threshold', '100'),
      client.sendCommand(['DEBUG', 'SLEEP', '1'])
    ]);
    const latency = await client.latencyLatest();
    assert.ok(Array.isArray(latency));
    for (const [name, timestamp, latestLatency, allTimeLatency] of latency) {
      assert.equal(typeof name, 'string');
      assert.equal(typeof timestamp, 'number');
      assert.equal(typeof latestLatency, 'number');
      assert.equal(typeof allTimeLatency, 'number');
    }
  }, GLOBAL.SERVERS.OPEN);
});
