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
    await Promise.all([
      client.lPush('push-key', 'hello '),
      client.set('set-key', 'world!'),
    ]);
    const histogram = await client.latencyHistogram();
    const commands = ['config|resetstat', 'set', 'lpush'];
    for (const command of commands) {
      assert.ok(typeof histogram[command]['calls'], 'number');
      assert.ok(Array.isArray(histogram[command]['histogram_usec']));
    }
  }, GLOBAL.SERVERS.OPEN);

  testUtils.testWithClient('filtered by a command list', async client => {
    await client.configSet('latency-monitor-threshold', '100');
    await client.set('set-key', 'hello');
    const histogram = await client.latencyHistogram('set');
    assert.ok(typeof histogram.set['calls'], 'number');
    assert.ok(Array.isArray(histogram.set['histogram_usec']));
  }, GLOBAL.SERVERS.OPEN);
});