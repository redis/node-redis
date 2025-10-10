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

    it('unfiltered', () => {
      assert.deepStrictEqual(
        parseArgs(LATENCY_HISTOGRAM),
        ['LATENCY', 'HISTOGRAM'],
      );
    });
  });

  testUtils.testWithClient('unfiltered list', async client => {
    const reply = await client.latencyHistogram();
    assert.ok(Array.isArray(reply));
    assert.strictEqual(reply.length, 0);
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('filtered by a command list', async client => {
    await client.configSet('latency-monitor-threshold', '100');
    await client.set('histogram-test-key', 42);
    const reply = await client.latencyHistogram('set');
    assert.ok(Array.isArray(reply));

    assert.strictEqual(reply[0], 'set');

    const histogram = reply[1];
    assert.ok(Array.isArray(histogram));
    assert.strictEqual(histogram[0], 'calls');
    assert.strictEqual(typeof histogram[1], 'number');
    assert.strictEqual(histogram[2], 'histogram_usec');
    assert.ok(Array.isArray(histogram[3]));
  }, GLOBAL.SERVERS.OPEN);
});