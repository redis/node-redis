import { strict as assert } from 'node:assert';
import { once } from 'node:events';
import testUtils, { GLOBAL } from '../test-utils';

// `disableClientSetup` hands us an un-connected sentinel so we can attach
// listeners before `connect()` and observe the full lifecycle ourselves.
const OPEN = Object.assign({ disableClientSetup: true }, GLOBAL.SENTINEL.OPEN);

describe('RedisSentinel lifecycle events', () => {
  testUtils.testWithClientSentinel('emits connect then ready on connect(), end on close()', async sentinel => {
    const events: Array<string> = [];
    sentinel
      .on('connect', () => events.push('connect'))
      .on('ready', () => events.push('ready'))
      .on('end', () => events.push('end'))
      .on('error', () => { });

    await sentinel.connect();
    assert.deepEqual(events, ['connect', 'ready']);

    await sentinel.close();
    assert.deepEqual(events, ['connect', 'ready', 'end']);
  }, OPEN);

  testUtils.testWithClientSentinel('emits end on destroy()', async sentinel => {
    sentinel.on('error', () => { });
    await sentinel.connect();

    const ended = once(sentinel, 'end');
    await sentinel.destroy();
    await ended; // rejects/hangs (test times out) if `end` never fires
  }, OPEN);

  testUtils.testWithClientSentinel('fires end exactly once across repeated close()/destroy()', async sentinel => {
    sentinel.on('error', () => { });
    await sentinel.connect();

    let endCount = 0;
    sentinel.on('end', () => endCount++);

    await sentinel.close();
    await sentinel.close();
    await sentinel.destroy();

    assert.equal(endCount, 1);
  }, OPEN);

  // Pins the ordering in `close()`: `#destroy` must be cleared before
  // `#setOpen(false)`, otherwise a later `connect()` ends up half-open
  // (`connect` without `ready`).
  testUtils.testWithClientSentinel('reopens after close(): connect+ready emitted again', async sentinel => {
    const events: Array<string> = [];
    sentinel
      .on('connect', () => events.push('connect'))
      .on('ready', () => events.push('ready'))
      .on('end', () => events.push('end'))
      .on('error', () => { });

    await sentinel.connect();
    await sentinel.close();
    await sentinel.connect();
    assert.deepEqual(events, ['connect', 'ready', 'end', 'connect', 'ready']);

    await sentinel.destroy();
  }, OPEN);
});
