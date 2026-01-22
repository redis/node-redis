import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HOTKEYS_GET from './HOTKEYS_GET';
import { parseArgs } from './generic-transformers';

describe('HOTKEYS GET', () => {
  testUtils.isVersionGreaterThanHook([8, 4]);

  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(HOTKEYS_GET),
      ['HOTKEYS', 'GET']
    );
  });

  testUtils.testWithClient('client.hotkeysGet returns null when no tracking', async client => {
    // Clean up any existing state first
    await client.hotkeysStop();
    await client.hotkeysReset();

    // GET on empty state should return null
    const reply = await client.hotkeysGet();
    assert.equal(reply, null);
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 6]
  });

  testUtils.testWithClient('client.hotkeysGet returns data during tracking', async client => {
    // Clean up any existing state first
    await client.hotkeysStop();
    await client.hotkeysReset();

    // Start tracking
    await client.hotkeysStart({
      METRICS: { count: 2, CPU: true, NET: true }
    });

    // Perform some operations to generate hotkey data
    await client.set('testKey1', 'value1');
    await client.set('testKey2', 'value2');
    await client.get('testKey1');
    await client.get('testKey2');

    // GET should return data
    const reply = await client.hotkeysGet();
    assert.notEqual(reply, null);

    if (reply !== null) {
      assert.equal(typeof reply.trackingActive, 'number');
      assert.equal(typeof reply.sampleRatio, 'number');
      assert.ok(Array.isArray(reply.selectedSlots));
      assert.equal(typeof reply.collectionStartTimeUnixMs, 'number');
      assert.equal(typeof reply.collectionDurationMs, 'number');
      assert.ok(Array.isArray(reply.byCpuTime));
      assert.ok(Array.isArray(reply.byNetBytes));
    }

    // Stop and reset tracking to clean up
    await client.hotkeysStop();
    await client.hotkeysReset();
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 6]
  });

  testUtils.testWithClient('client.hotkeysGet returns data after stopping', async client => {
    // Clean up any existing state first
    await client.hotkeysStop();
    await client.hotkeysReset();

    // Start tracking
    await client.hotkeysStart({
      METRICS: { count: 1, CPU: true }
    });

    // Perform some operations
    await client.set('testKey', 'value');
    await client.get('testKey');

    // Stop tracking
    await client.hotkeysStop();

    // GET should still return data in STOPPED state
    const reply = await client.hotkeysGet();
    assert.notEqual(reply, null);

    if (reply !== null) {
      // Tracking should be inactive after stop
      assert.equal(reply.trackingActive, 0);
    }

    // Reset to clean up
    await client.hotkeysReset();
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 6]
  });
});

