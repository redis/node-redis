import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import LATENCY_RESET, { LATENCY_EVENTS } from './LATENCY_RESET';
import { parseArgs } from './generic-transformers'; // Re-import parseArgs for unit tests

describe('LATENCY RESET', function () {
  // Set a generous timeout for the entire test suite.
  // This is crucial for the Docker container to spin up and client to connect reliably.
  this.timeout(300000); // 5 minutes

  // --- Unit Tests for transformArguments ---
  // These tests ensure the command arguments are correctly transformed
  // before being sent to the Redis server.

  it('transformArguments with no events', () => {
    assert.deepEqual(
      parseArgs(LATENCY_RESET),
      [
        'LATENCY',
        'RESET'
      ]
    );
  });

  it('transformArguments with one event', () => {
    assert.deepEqual(
      parseArgs(LATENCY_RESET, LATENCY_EVENTS.COMMAND),
      [
        'LATENCY',
        'RESET',
        'command'
      ]
    );
  });

  it('transformArguments with multiple events', () => {
    assert.deepEqual(
      parseArgs(LATENCY_RESET, LATENCY_EVENTS.COMMAND, LATENCY_EVENTS.FORK),
      [
        'LATENCY',
        'RESET',
        'command',
        'fork'
      ]
    );
  });

  // --- Integration Test for client.latencyReset ---
  // This test interacts with a real Redis server to verify end-to-end functionality.
  testUtils.testWithClient('client.latencyReset', async client => {
    // 1. Set a latency monitor threshold to ensure events are logged.
    // Setting it to 1ms ensures even small delays are captured.
    await client.configSet('latency-monitor-threshold', '1');

    // 2. Generate a clear latency event for the 'command' type.
    // Sleeping for 100ms ensures it exceeds the 1ms threshold.
    await client.sendCommand(['DEBUG', 'SLEEP', '0.1']);

    // Optional: Verify latency was recorded before the first reset.
    // This helps confirm the test setup is working.
    const latestLatencyBeforeReset = await client.latencyLatest();
    assert.ok(latestLatencyBeforeReset.length > 0, 'Expected latency events to be recorded before first reset.');
    assert.equal(latestLatencyBeforeReset[0][0], 'command', 'Expected "command" event to be recorded.');
    assert.ok(Number(latestLatencyBeforeReset[0][2]) >= 100, 'Expected latest latency for "command" to be at least 100ms.');

    // 3. Execute LATENCY RESET command without arguments (resets all events).
    const replyAll = await client.latencyReset();
    // The command returns the number of events reset (usually 1 for 'command' event).
    assert.equal(typeof replyAll, 'number');
    assert.ok(replyAll >= 0); // Should be 1 if 'command' was reset.

    // 4. Verify that LATENCY LATEST returns an empty array after resetting all events.
    const latestLatencyAfterAllReset = await client.latencyLatest();
    assert.deepEqual(latestLatencyAfterAllReset, [], 'Expected no latency events after resetting all.');

    // 5. Generate another latency event to test specific reset.
    await client.sendCommand(['DEBUG', 'SLEEP', '0.05']); // Sleep for 50ms
    const latestLatencyBeforeSpecificReset = await client.latencyLatest();
    assert.ok(latestLatencyBeforeSpecificReset.length > 0, 'Expected latency events before specific reset.');

    // 6. Execute LATENCY RESET with a specific event ('command').
    const replySpecific = await client.latencyReset(LATENCY_EVENTS.COMMAND);
    assert.equal(typeof replySpecific, 'number');
    assert.ok(replySpecific >= 0); // Should be 1 if 'command' was reset.

    // 7. Verify that the specific event is reset.
    const latestLatencyAfterSpecificReset = await client.latencyLatest();
    assert.deepEqual(latestLatencyAfterSpecificReset, [], 'Expected no latency events after specific reset of "command".');

    // 8. Generate multiple types of latency events (hypothetically, if more were possible via DEBUG).
    // For simplicity, we'll just generate 'command' again and assert its reset.
    await client.sendCommand(['DEBUG', 'SLEEP', '0.02']); // Generate another 'command' latency
    // In a real scenario, you might have other DEBUG commands to generate 'fork' or 'aof-fsync-always'
    // For this example, we'll just use 'command' again for simplicity.

    const latestLatencyBeforeMultipleReset = await client.latencyLatest();
    assert.ok(latestLatencyBeforeMultipleReset.length > 0, 'Expected latency events before multiple reset.');

    // 9. Execute LATENCY RESET with multiple specific events (e.g., 'command', 'fork').
    // Even if 'fork' wasn't generated, calling reset on it should still work.
    const replyMultiple = await client.latencyReset(LATENCY_EVENTS.COMMAND, LATENCY_EVENTS.FORK);
    assert.equal(typeof replyMultiple, 'number');
    assert.ok(replyMultiple >= 0); // Should be 1 if 'command' was reset.

    // 10. Verify that all specified events are reset.
    const latestLatencyAfterMultipleReset = await client.latencyLatest();
    assert.deepEqual(latestLatencyAfterMultipleReset, [], 'Expected no latency events after multiple specified resets.');

  }, {
    // These options are passed to testUtils.testWithClient for setting up the Redis server and client.
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: { // Configure the client created by testWithClient
      socket: {
        connectTimeout: 300000 // Set client connection timeout to 5 minutes (300000ms)
      }
    }
  });
});

