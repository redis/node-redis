import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import LATENCY_HISTOGRAM from './LATENCY_HISTOGRAM';
import { parseArgs } from './generic-transformers';

describe('LATENCY HISTOGRAM', () => {
  describe('transformArguments', () => {
    it('filtered by command set', () => {
      assert.deepStrictEqual(
        parseArgs(LATENCY_HISTOGRAM, 'set'),
        ['LATENCY', 'HISTOGRAM', 'set'],
      );
    });

    it('show all', () => {
      assert.deepStrictEqual(
        parseArgs(LATENCY_HISTOGRAM),
        ['LATENCY', 'HISTOGRAM'],
      );
    });
  });

  testUtils.testWithClient('client.latencyHistogram', async client => {
    await client.set('histogram-test-key', 42);
    const reply = await client.latencyHistogram('set');
    assert.ok(Array.isArray(reply));
    const command = reply[0];
    const histogram = reply[1];
    assert.strictEqual(typeof command, 'string');
    assert.ok(Array.isArray(histogram));
    const [calls, amount, histogram_usec, stats] = histogram;
    assert.strictEqual(calls, 'calls');
    assert.strictEqual(typeof amount, 'number');
    assert.strictEqual(histogram_usec, 'histogram_usec');
    assert.ok(Array.isArray(stats));
  }, GLOBAL.SERVERS.OPEN);
});