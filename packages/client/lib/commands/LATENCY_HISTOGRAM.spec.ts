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
    await client.configResetStat();
    await client.lPush('push-key', 'hello ');
    await client.set('set-key', 'world!');
    const histogram = await client.latencyHistogram();
    const commands = ['config|resetstat', 'latency|histogram', 'set', 'lpush'];
    for (const command of commands) {
      assert.ok(histogram.includes(command));
    }
    assert.equal(histogram.length, 8);
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('filtered by a command list', async client => {
    await client.configSet('latency-monitor-threshold', '100');
    await client.set('set-key', 'hello');
    const reply = await client.latencyHistogram('set');
    assert.ok(Array.isArray(reply));
    assert.equal(reply[0], 'set');
    const histogram = reply[1];
    assert.ok(Array.isArray(histogram));
    assert.equal(histogram[0], 'calls');
    assert.equal(typeof histogram[1], 'number');
    assert.equal(histogram[2], 'histogram_usec');
    assert.ok(Array.isArray(histogram[3]));
  }, GLOBAL.SERVERS.OPEN);
});