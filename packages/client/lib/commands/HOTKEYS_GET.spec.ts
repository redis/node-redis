import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HOTKEYS_GET from './HOTKEYS_GET';
import { parseArgs } from './generic-transformers';

describe('HOTKEYS GET', () => {
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

  testUtils.testWithClient('client.hotkeysGet returns all required fields during tracking', async client => {
    // Clean up any existing state first
    await client.hotkeysStop();
    await client.hotkeysReset();

    // Start tracking with both CPU and NET metrics
    await client.hotkeysStart({
      METRICS: { count: 2, CPU: true, NET: true }
    });

    // Perform some operations to generate hotkey data
    await client.set('testKey1', 'value1');
    await client.set('testKey2', 'value2');
    await client.get('testKey1');
    await client.get('testKey2');

    // GET should return data with all required fields
    const reply = await client.hotkeysGet();
    assert.ok(reply, 'Expected reply to not be null');

    // Required fields - must be present
    assert.equal(typeof reply.trackingActive, 'number');
    assert.equal(typeof reply.sampleRatio, 'number');
    assert.ok(Array.isArray(reply.selectedSlots));
    assert.equal(typeof reply.allCommandsAllSlotsUs, 'number');
    assert.equal(typeof reply.netBytesAllCommandsAllSlots, 'number');
    assert.equal(typeof reply.collectionStartTimeUnixMs, 'number');
    assert.equal(typeof reply.collectionDurationMs, 'number');
    assert.equal(typeof reply.totalCpuTimeSysMs, 'number');
    assert.equal(typeof reply.totalCpuTimeUserMs, 'number');
    assert.equal(typeof reply.totalNetBytes, 'number');

    // Metric arrays - present when requested
    assert.ok(Array.isArray(reply.byCpuTimeUs));
    assert.ok(Array.isArray(reply.byNetBytes));

    // Stop and reset tracking to clean up
    await client.hotkeysStop();
    await client.hotkeysReset();
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 6]
  });

  testUtils.testWithCluster('cluster.hotkeysGet returns slot-specific fields with SLOTS option', async cluster => {
    const client = await cluster.nodeClient(cluster.masters[0]);

    // Get the slots owned by this master node
    const clusterSlots = await client.clusterSlots();
    const masterSlots = clusterSlots[0]; // First slot range
    const slotStart = masterSlots.from as number;
    const slotEnd = Math.min(slotStart + 1, masterSlots.to as number);

    // Clean up any existing state first
    await client.hotkeysStop();
    await client.hotkeysReset();

    // Start tracking with SLOTS option using slots owned by this master
    await client.hotkeysStart({
      METRICS: { count: 2, CPU: true, NET: true },
      SLOTS: { count: 2, slots: [slotStart, slotEnd] }
    });

    // Perform some operations using the cluster (which routes correctly)
    await cluster.set('testKey1', 'value1');
    await cluster.get('testKey1');

    const reply = await client.hotkeysGet();
    assert.ok(reply, 'Expected reply to not be null');

    // When SLOTS is specified, these fields should be present
    assert.equal(typeof reply.allCommandsSelectedSlotsUs, 'number');
    assert.equal(typeof reply.netBytesAllCommandsSelectedSlots, 'number');

    // selectedSlots should contain the specified slots
    assert.ok(Array.isArray(reply.selectedSlots));
    assert.ok(reply.selectedSlots.length > 0);

    // Stop and reset tracking to clean up
    await client.hotkeysStop();
    await client.hotkeysReset();
  }, {
    ...GLOBAL.CLUSTERS.OPEN,
    minimumDockerVersion: [8, 6]
  });

  testUtils.testWithCluster('cluster.hotkeysGet returns sampled fields with SAMPLE and SLOTS options', async cluster => {
    const client = await cluster.nodeClient(cluster.masters[0]);

    // Get the slots owned by this master node
    const clusterSlots = await client.clusterSlots();
    const masterSlots = clusterSlots[0]; // First slot range
    const slotStart = masterSlots.from as number;
    const slotEnd = Math.min(slotStart + 1, masterSlots.to as number);

    // Clean up any existing state first
    await client.hotkeysStop();
    await client.hotkeysReset();

    // Start tracking with SAMPLE > 1 and SLOTS using slots owned by this master
    await client.hotkeysStart({
      METRICS: { count: 2, CPU: true, NET: true },
      SAMPLE: 2,
      SLOTS: { count: 2, slots: [slotStart, slotEnd] }
    });

    // Perform some operations using the cluster (which routes correctly)
    await cluster.set('testKey1', 'value1');
    await cluster.get('testKey1');

    const reply = await client.hotkeysGet();
    assert.ok(reply, 'Expected reply to not be null');

    // When SAMPLE > 1 AND SLOTS is specified, these fields should be present
    assert.equal(typeof reply.sampledCommandsSelectedSlotsUs, 'number');
    assert.equal(typeof reply.netBytesSampledCommandsSelectedSlots, 'number');

    // Stop and reset tracking to clean up
    await client.hotkeysStop();
    await client.hotkeysReset();
  }, {
    ...GLOBAL.CLUSTERS.OPEN,
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
    assert.ok(reply, 'Expected reply to not be null');
    // Tracking should be inactive after stop
    assert.equal(reply.trackingActive, 0);

    // Reset to clean up
    await client.hotkeysReset();
  }, {
    ...GLOBAL.SERVERS.OPEN,
    minimumDockerVersion: [8, 6]
  });
});

