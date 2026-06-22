import { strict as assert } from 'node:assert';
import { once } from 'node:events';
import testUtils, { GLOBAL } from '../test-utils';

describe('RedisSentinel lifecycle events', () => {
  testUtils.testWithClientSentinel('should emit connect, ready and end events', async sentinel => {
    const events: string[] = [];

    sentinel
      .on('connect', () => events.push('connect'))
      .on('ready', () => events.push('ready'))
      .on('end', () => events.push('end'));

    await sentinel.connect();
    assert.deepEqual(events, ['connect', 'ready']);

    const endPromise = once(sentinel, 'end');
    await sentinel.close();
    await endPromise;

    assert.deepEqual(events, ['connect', 'ready', 'end']);
  }, {
    ...GLOBAL.SENTINEL.OPEN,
    disableClientSetup: true
  });
});
