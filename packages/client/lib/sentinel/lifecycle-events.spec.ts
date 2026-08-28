import { strict as assert } from 'node:assert';
import { once } from 'node:events';
import { setTimeout } from 'node:timers/promises';
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

  // Hangs in getClientLease() if teardown does not return the reserved lease's
  // slot to the pool queue, which is only filled at construction.
  testUtils.testWithClientSentinel('reopens after close() with reserveClient', async sentinel => {
    sentinel.on('error', () => { });

    await sentinel.connect();
    await sentinel.close();
    await sentinel.connect();
    assert.equal(await sentinel.ping(), 'PONG');

    await sentinel.destroy();
  }, { ...OPEN, reserveClient: true });

  // Same reopen hang as above, through a different door: the lease release runs
  // in a finally, so a throwing `end` listener cannot strand the reservation.
  testUtils.testWithClientSentinel('releases the reserved lease when an end listener throws', async sentinel => {
    sentinel.on('error', () => { });
    await sentinel.connect();

    sentinel.once('end', () => { throw new Error('end boom'); });
    await assert.rejects(sentinel.close(), /end boom/);

    await sentinel.connect();
    assert.equal(await sentinel.ping(), 'PONG');

    await sentinel.destroy();
  }, { ...OPEN, reserveClient: true });

  // A reentrant connect() from an `end` listener re-assigns the in-flight promise;
  // the failed original attempt's finally must not clobber it, or close()/destroy()
  // stop awaiting the new attempt and it can emit `ready` after `end`.
  testUtils.testWithClientSentinel('tracks a reentrant connect() from an end listener', async sentinel => {
    const events: Array<string> = [];
    sentinel
      .on('ready', () => events.push('ready'))
      .on('end', () => events.push('end'))
      .on('error', () => { });
    sentinel.once('connect', () => { throw new Error('boom'); });
    sentinel.once('end', () => { sentinel.connect().catch(() => { }); });

    await assert.rejects(sentinel.connect(), /boom/);

    // The reentrant attempt from the end listener is in flight; destroy() must await it.
    await sentinel.destroy();
    await setTimeout(100);

    assert.equal(sentinel.isOpen, false);
    assert.equal(sentinel.isReady, false);
    assert.ok(events.lastIndexOf('ready') < events.lastIndexOf('end'), `ready after end: ${events}`);
  }, OPEN);

  testUtils.testWithClientSentinel('settles closed when a connect listener throws', async sentinel => {
    const events: Array<string> = [];
    sentinel
      .on('ready', () => events.push('ready'))
      .on('end', () => events.push('end'))
      .on('error', () => { })
      .on('connect', () => { throw new Error('listener boom'); });

    await assert.rejects(sentinel.connect(), /listener boom/);

    // Give an abandoned discovery attempt time to resurrect clients — the bug
    // being pinned is `ready` after `end` from a connect that outlived destroy().
    await setTimeout(100);

    assert.equal(sentinel.isOpen, false);
    assert.equal(sentinel.isReady, false);
    assert.deepEqual(events, ['end']);
  }, OPEN);
});
