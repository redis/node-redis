import assert from "node:assert";
import { setTimeout } from "node:timers/promises";
import diagnostics_channel from "node:diagnostics_channel";

import testUtils from "../../test-utils";
import { DiagnosticsEvent } from "../../client/enterprise-maintenance-manager";
import { FaultInjectorClient, ActionTrigger, ActionType, ActionRequest } from "@redis/test-utils/lib/fault-injector";
import { REClusterTestOptions } from "@redis/test-utils";
import { blockCommand, filterTriggersByArgs } from "./test-scenario.util";

type TestOptions = REClusterTestOptions<{}, {}, {}, 3, {}>

const TEST_TIMEOUT = 2 * 60 * 1000; // 2 minutes
const FI_POLL_INTERVAL = 5000 // 5 seconds
const ACTION_OPTIONS = { maxWaitTimeMs: TEST_TIMEOUT, timeoutMs: FI_POLL_INTERVAL }

// Timeout constants for un-relaxation tests
const NORMAL_COMMAND_TIMEOUT = 1000;
const RELAXED_COMMAND_TIMEOUT = 5000;

const KEYS = [
  "channel:11kv:1000",
  "channel:osy:2000",
  "channel:jn6:3000",
  "channel:l00:4000",
  "channel:4ez:5000",
  "channel:4ek:6000",
  "channel:9vn:7000",
  "channel:dw1:8000",
  "channel:9zi:9000",
  "channel:4vl:10000",
  "channel:utl:11000",
  "channel:lyo:12000",
  "channel:jzn:13000",
  "channel:14uc:14000",
  "channel:mz:15000",
  "channel:d0v:16000",
];

// Async setup and dynamic test generation using Mocha's --delay option
(async function() {
  // Setup Phase: Create fault injector client and fetch all triggers
  const baseUrl = process.env.RE_FAULT_INJECTOR_URL;

  let addTriggers: ActionTrigger[] = [];
  let removeTriggers: ActionTrigger[] = [];
  let removeAddTriggers: ActionTrigger[] = [];
  let slotShuffleTriggers: ActionTrigger[] = [];

  if (baseUrl) {
    const setupFaultInjectorClient = new FaultInjectorClient(baseUrl);

    // Make 4 asynchronous calls to listActionTriggers() in parallel
    const [add, remove, removeAdd, slotShuffle] = await Promise.all([
      setupFaultInjectorClient.listActionTriggers("slot-migrate", "add"),
      setupFaultInjectorClient.listActionTriggers("slot-migrate", "remove"),
      setupFaultInjectorClient.listActionTriggers("slot-migrate", "remove-add"),
      setupFaultInjectorClient.listActionTriggers("slot-migrate", "slot-shuffle"),
    ]);

    // Apply command-line filters (--effect, --trigger, --db/--database)
    ({ addTriggers, removeTriggers, removeAddTriggers, slotShuffleTriggers } =
      filterTriggersByArgs(add, remove, removeAdd, slotShuffle));
  }

  // Dynamic Test Generation
  describe("Cluster Maintenance", () => {

  let diagnosticEvents: DiagnosticsEvent[] = [];

  const onMessage = (message: unknown) => {
    const event = message as DiagnosticsEvent;
    if (["SMIGRATING", "SMIGRATED"].includes(event.type)) {
      diagnosticEvents.push(event);
    }
  };

  beforeEach(function() {
    diagnosticEvents = [];
    diagnostics_channel.subscribe("redis.maintenance", onMessage);
  });

  afterEach(function() {
    diagnostics_channel.unsubscribe("redis.maintenance", onMessage);
  });

  describe("Effect: remove", () => {
    // Dynamically generate tests for each trigger from "remove" effect
    for (const trigger of removeTriggers) {
      for (const requirement of trigger.requirements) {
      const ACTION = {
        type: "slot_migrate",
        parameters: {
          effect: "remove",
          cluster_index: 0,
          trigger: trigger.name,
        },
      } satisfies ActionRequest;
      // Build options with trigger-specific dbConfig if available
      // DataCommands test needs short timeout to verify un-relaxation behavior
      const dataCommandsTestOptions = {
        clusterConfiguration: {
          defaults: {
            maintNotifications: "enabled",
            maintEndpointType: "auto",
            maintRelaxedCommandTimeout: RELAXED_COMMAND_TIMEOUT,
          },
          commandOptions: { timeout: NORMAL_COMMAND_TIMEOUT },
          RESP: 3 as const,
        },
        dbConfig: requirement.dbconfig,
        testTimeout: TEST_TIMEOUT
      } satisfies TestOptions;

      // PubSub tests don't need short timeout - they test subscription preservation
      const pubSubTestOptions = {
        clusterConfiguration: {
          defaults: {
            maintNotifications: "enabled",
            maintEndpointType: "auto",
          },
          RESP: 3 as const,
        },
        dbConfig: requirement.dbconfig,
        testTimeout: TEST_TIMEOUT
      } satisfies TestOptions;

      const baseTestName = `[Trig] ${trigger.name}, [DB] ${requirement.dbconfig.name}, [Test]`;

      testUtils.testWithRECluster(
        `${baseTestName} DataCommands`,
      async (cluster, faultInjectorClient) => {
        const initialMasterAddresses = new Set(
          cluster.masters.map((m) => m.address)
        );
        const initialMasterCount = cluster.masters.length;

        assert.equal(
          diagnosticEvents.length,
          0,
          "should not have received any notifications yet"
        );


        await faultInjectorClient.triggerAction(ACTION, ACTION_OPTIONS);

        // Verify notifications were received
        const sMigratingEventCount = diagnosticEvents.filter(
          (event) => event.type === "SMIGRATING"
        ).length;
        assert(
          sMigratingEventCount >= 1,
          "should have received at least one SMIGRATING notification"
        );
        const sMigratedEventCount = diagnosticEvents.filter(
          (event) => event.type === "SMIGRATED"
        ).length;
        assert(
          sMigratedEventCount >= 1,
          "should have received at least one SMIGRATED notification"
        );

        // Verify topology changed
        assert.equal(
          cluster.masters.length,
          initialMasterCount- 1,
          `should have ${initialMasterCount - 1} masters after migrate`
        );

        // Verify at least one master address changed
        const currentMasterAddresses = new Set(
          cluster.masters.map((m) => m.address)
        );

        assert.notDeepStrictEqual(
          currentMasterAddresses,
          initialMasterAddresses,
          "addresses should NOT be the same"
        );

        // Verify data is still accessible after migrate
        for (const key of KEYS) {
          await cluster.set(key, `updated-${key}`);
          const value = await cluster.get(key);
          assert.strictEqual(
            value,
            `updated-${key}`,
            `New writes should succeed for ${key}`
          );
        }

        // Verify timeout is un-relaxed after SMIGRATED
        const { error, duration } = await blockCommand(async () => {
          await cluster.set("timeout-test-key", "value");
        });

        assert.ok(
          error instanceof Error,
          "Command Timeout error should be instanceof Error"
        );
        assert.ok(
          duration >= NORMAL_COMMAND_TIMEOUT * 0.8 &&
            duration < NORMAL_COMMAND_TIMEOUT * 1.5,
          `Command should timeout within normal timeout range. Duration: ${duration}ms, Expected: [${NORMAL_COMMAND_TIMEOUT * 0.8}, ${NORMAL_COMMAND_TIMEOUT * 1.5})`
        );
        assert.strictEqual(
          error?.constructor?.name,
          "TimeoutError",
          "Command Timeout error should be TimeoutError (not CommandTimeoutDuringMaintenanceError)"
        );
      },
        dataCommandsTestOptions
      );

      testUtils.testWithRECluster(
        `${baseTestName} ShardedPubSub`,
        async (cluster, faultInjectorClient) => {
        const stats: Record<string, { sent: number; received: number }> = {};
        for (const channel of KEYS) {
          stats[channel] = { sent: 0, received: 0 };
        }

        for (const channel of KEYS) {
          await cluster.sSubscribe(channel, (_msg, ch) => {
            stats[ch].received++;
          });
        }

        // Start publishing messages continuously
        const publishController = new AbortController();
        const publishPromise = (async () => {
          while (!publishController.signal.aborted) {
            const batchPromises: Promise<void>[] = [];
            for (const channel of KEYS) {
              const p = cluster
                .sPublish(channel, `${Date.now()}`)
                .then(() => {
                  stats[channel].sent++;
                })
                .catch(() => {
                  // Ignore publish errors during migrate
                });
              batchPromises.push(p);
            }
            await Promise.all(batchPromises);
            await setTimeout(50);
          }
        })();

        // Trigger migration during publishing
        await faultInjectorClient.triggerAction(ACTION, ACTION_OPTIONS);

        // Stop publishing
        publishController.abort();
        await publishPromise;

        for (const channel of KEYS) {
          assert.ok(
            stats[channel].received <= stats[channel].sent,
            `Channel ${channel}: received (${stats[channel].received}) should be <= sent (${stats[channel].sent}) during migrate`
          );
        }

        // Wait for cluster to stabilize
        await setTimeout(1000);

        // Reset stats for after-migration verification
        for (const channel of KEYS) {
          stats[channel] = { sent: 0, received: 0 };
        }

        // Publish messages after migration - all should be received
        for (const channel of KEYS) {
          for (let i = 0; i < 10; i++) {
            await cluster.sPublish(channel, `after-${i}`);
            stats[channel].sent++;
          }
        }

        // Wait for messages to be received
        await setTimeout(500);

        // Verify all messages received after migration (subscription preserved)
        for (const channel of KEYS) {
          assert.strictEqual(
            stats[channel].received,
            stats[channel].sent,
            `Channel ${channel}: all messages (${stats[channel].sent}) should be received after migrate - subscription preserved`
          );
        }
        },
        pubSubTestOptions
      );

      testUtils.testWithRECluster(
        `${baseTestName} PubSub`,
        async (cluster, faultInjectorClient) => {
        const stats: Record<string, { sent: number; received: number }> = {};
        for (const channel of KEYS) {
          stats[channel] = { sent: 0, received: 0 };
        }

        for (const channel of KEYS) {
          await cluster.subscribe(channel, (_msg, ch) => {
            stats[ch].received++;
          });
        }

        // Start publishing messages continuously
        const publishController = new AbortController();
        const publishPromise = (async () => {
          while (!publishController.signal.aborted) {
            const batchPromises: Promise<void>[] = [];
            for (const channel of KEYS) {
              const p = cluster
                .publish(channel, `${Date.now()}`)
                .then(() => {
                  stats[channel].sent++;
                })
                .catch(() => {
                  // Ignore publish errors during migrate
                });
              batchPromises.push(p);
            }
            await Promise.all(batchPromises);
            await setTimeout(50);
          }
        })();

        // Trigger migration during publishing
        await faultInjectorClient.triggerAction(ACTION, ACTION_OPTIONS);

        // Stop publishing
        publishController.abort();
        await publishPromise;

        for (const channel of KEYS) {
          assert.ok(
            stats[channel].received <= stats[channel].sent,
            `Channel ${channel}: received (${stats[channel].received}) should be <= sent (${stats[channel].sent}) during migrate`
          );
        }

        // Wait for cluster to stabilize
        await setTimeout(1000);

        // Reset stats for after-migration verification
        for (const channel of KEYS) {
          stats[channel] = { sent: 0, received: 0 };
        }

        // Publish messages after migration - all should be received
        for (const channel of KEYS) {
          for (let i = 0; i < 10; i++) {
            await cluster.publish(channel, `after-${i}`);
            stats[channel].sent++;
          }
        }

        // Wait for messages to be received
        await setTimeout(500);

        // Verify all messages received after migration (subscription preserved)
        for (const channel of KEYS) {
          assert.strictEqual(
            stats[channel].received,
            stats[channel].sent,
            `Channel ${channel}: all messages (${stats[channel].sent}) should be received after migrate - subscription preserved`
          );
        }
        },
        pubSubTestOptions
      );
      }
    }
  });

  describe("Effect: remove-add", () => {
    // Dynamically generate tests for each trigger from "remove-add" effect
    for (const trigger of removeAddTriggers) {
      for (const requirement of trigger.requirements) {
      const ACTION = {
        type: "slot_migrate",
        parameters: {
          effect: "remove-add",
          cluster_index: 0,
          trigger: trigger.name,
        },
      } satisfies ActionRequest;

      // Build options with trigger-specific dbConfig if available
      // DataCommands test needs short timeout to verify un-relaxation behavior
      const dataCommandsTestOptions = {
        clusterConfiguration: {
          defaults: {
            maintNotifications: "enabled",
            maintEndpointType: "auto",
            maintRelaxedCommandTimeout: RELAXED_COMMAND_TIMEOUT,
          },
          commandOptions: { timeout: NORMAL_COMMAND_TIMEOUT },
          RESP: 3 as const,
        },
        dbConfig: requirement.dbconfig,
        testTimeout: TEST_TIMEOUT
      } satisfies TestOptions;

      // PubSub tests don't need short timeout - they test subscription preservation
      const pubSubTestOptions = {
        clusterConfiguration: {
          defaults: {
            maintNotifications: "enabled",
            maintEndpointType: "auto",
          },
          RESP: 3 as const,
        },
        dbConfig: requirement.dbconfig,
        testTimeout: TEST_TIMEOUT
      } satisfies TestOptions;

      const baseTestName = `[Trig] ${trigger.name}, [DB] ${requirement.dbconfig.name}, [Test]`;

      testUtils.testWithRECluster(
        `${baseTestName} DataCommands`,
      async (cluster, faultInjectorClient) => {
        const initialMasterAddresses = new Set(
          cluster.masters.map((m) => m.address)
        );

        const initialMasterCount = cluster.masters.length;

        assert.equal(
          diagnosticEvents.length,
          0,
          "should not have received any notifications yet"
        );

        // Trigger migration
        await faultInjectorClient.triggerAction(ACTION, ACTION_OPTIONS);

        // Verify notifications were received
        const sMigratingEventCount = diagnosticEvents.filter(
          (event) => event.type === "SMIGRATING"
        ).length;
        assert(
          sMigratingEventCount >= 1,
          "should have received at least one SMIGRATING notification"
        );
        const sMigratedEventCount = diagnosticEvents.filter(
          (event) => event.type === "SMIGRATED"
        ).length;
        assert(
          sMigratedEventCount >= 1,
          "should have received at least one SMIGRATED notification"
        );

        // Verify topology changed
        assert.equal(
          cluster.masters.length,
          initialMasterCount,
          `should have ${initialMasterCount} masters after migrate`
        );

        // Verify at least one master address changed
        const currentMasterAddresses = new Set(
          cluster.masters.map((m) => m.address)
        );

        assert.notDeepStrictEqual(
          currentMasterAddresses,
          initialMasterAddresses,
          "addresses should NOT be the same"
        );

        // Verify data is still accessible after migrate
        for (const key of KEYS) {
          await cluster.set(key, `updated-${key}`);
          const value = await cluster.get(key);
          assert.strictEqual(
            value,
            `updated-${key}`,
            `New writes should succeed for ${key}`
          );
        }

        // Verify timeout is un-relaxed after SMIGRATED
        const { error, duration } = await blockCommand(async () => {
          await cluster.set("timeout-test-key", "value");
        });

        assert.ok(
          error instanceof Error,
          "Command Timeout error should be instanceof Error"
        );
        assert.ok(
          duration >= NORMAL_COMMAND_TIMEOUT * 0.8 &&
            duration < NORMAL_COMMAND_TIMEOUT * 1.5,
          `Command should timeout within normal timeout range. Duration: ${duration}ms, Expected: [${NORMAL_COMMAND_TIMEOUT * 0.8}, ${NORMAL_COMMAND_TIMEOUT * 1.5})`
        );
        assert.strictEqual(
          error?.constructor?.name,
          "TimeoutError",
          "Command Timeout error should be TimeoutError (not CommandTimeoutDuringMaintenanceError)"
        );
        },
        dataCommandsTestOptions
      );

      testUtils.testWithRECluster(
        `${baseTestName} ShardedPubSub`,
        async (cluster, faultInjectorClient) => {
        const stats: Record<string, { sent: number; received: number }> = {};
        for (const channel of KEYS) {
          stats[channel] = { sent: 0, received: 0 };
        }

        for (const channel of KEYS) {
          await cluster.sSubscribe(channel, (_msg, ch) => {
            stats[ch].received++;
          });
        }

        // Start publishing messages continuously
        const publishController = new AbortController();
        const publishPromise = (async () => {
          while (!publishController.signal.aborted) {
            const batchPromises: Promise<void>[] = [];
            for (const channel of KEYS) {
              const p = cluster
                .sPublish(channel, `${Date.now()}`)
                .then(() => {
                  stats[channel].sent++;
                })
                .catch(() => {
                  // Ignore publish errors during migrate
                });
              batchPromises.push(p);
            }
            await Promise.all(batchPromises);
            await setTimeout(50);
          }
        })();

        // Trigger migration during publishing
        await faultInjectorClient.triggerAction(ACTION, ACTION_OPTIONS);

        // Stop publishing
        publishController.abort();
        await publishPromise;

        for (const channel of KEYS) {
          assert.ok(
            stats[channel].received <= stats[channel].sent,
            `Channel ${channel}: received (${stats[channel].received}) should be <= sent (${stats[channel].sent}) during migrate`
          );
        }

        // Wait for cluster to stabilize
        await setTimeout(1000);

        // Reset stats for after-migration verification
        for (const channel of KEYS) {
          stats[channel] = { sent: 0, received: 0 };
        }

        // Publish messages after migration - all should be received
        for (const channel of KEYS) {
          for (let i = 0; i < 10; i++) {
            await cluster.sPublish(channel, `after-${i}`);
            stats[channel].sent++;
          }
        }

        // Wait for messages to be received
        await setTimeout(500);

        // Verify all messages received after migration (subscription preserved)
        for (const channel of KEYS) {
          assert.strictEqual(
            stats[channel].received,
            stats[channel].sent,
            `Channel ${channel}: all messages (${stats[channel].sent}) should be received after migrate - subscription preserved`
          );
        }
        },
        pubSubTestOptions
      );

      testUtils.testWithRECluster(
        `${baseTestName} PubSub`,
        async (cluster, faultInjectorClient) => {
        const stats: Record<string, { sent: number; received: number }> = {};
        for (const channel of KEYS) {
          stats[channel] = { sent: 0, received: 0 };
        }

        for (const channel of KEYS) {
          await cluster.subscribe(channel, (_msg, ch) => {
            stats[ch].received++;
          });
        }

        // Start publishing messages continuously
        const publishController = new AbortController();
        const publishPromise = (async () => {
          while (!publishController.signal.aborted) {
            const batchPromises: Promise<void>[] = [];
            for (const channel of KEYS) {
              const p = cluster
                .publish(channel, `${Date.now()}`)
                .then(() => {
                  stats[channel].sent++;
                })
                .catch(() => {
                  // Ignore publish errors during migrate
                });
              batchPromises.push(p);
            }
            await Promise.all(batchPromises);
            await setTimeout(50);
          }
        })();

        // Trigger migration during publishing
        await faultInjectorClient.triggerAction(ACTION, ACTION_OPTIONS);

        // Stop publishing
        publishController.abort();
        await publishPromise;

        for (const channel of KEYS) {
          assert.ok(
            stats[channel].received <= stats[channel].sent,
            `Channel ${channel}: received (${stats[channel].received}) should be <= sent (${stats[channel].sent}) during migrate`
          );
        }

        // Wait for cluster to stabilize
        await setTimeout(1000);

        // Reset stats for after-migration verification
        for (const channel of KEYS) {
          stats[channel] = { sent: 0, received: 0 };
        }

        // Publish messages after migration - all should be received
        for (const channel of KEYS) {
          for (let i = 0; i < 10; i++) {
            await cluster.publish(channel, `after-${i}`);
            stats[channel].sent++;
          }
        }

        // Wait for messages to be received
        await setTimeout(500);

        // Verify all messages received after migration (subscription preserved)
        for (const channel of KEYS) {
          assert.strictEqual(
            stats[channel].received,
            stats[channel].sent,
            `Channel ${channel}: all messages (${stats[channel].sent}) should be received after migrate - subscription preserved`
          );
        }
        },
        pubSubTestOptions
      );
      }
    }
  });
  describe("Effect: slot-shuffle", () => {
    // Dynamically generate tests for each trigger from "slot-shuffle" effect
    for (const trigger of slotShuffleTriggers) {
      for (const requirement of trigger.requirements) {
      const ACTION = {
        type: "slot_migrate",
        parameters: {
          effect: "slot-shuffle",
          cluster_index: 0,
          trigger: trigger.name,
        },
      } satisfies ActionRequest;

      // Build options with trigger-specific dbConfig if available
      // DataCommands test needs short timeout to verify un-relaxation behavior
      const dataCommandsTestOptions = {
        clusterConfiguration: {
          defaults: {
            maintNotifications: "enabled",
            maintEndpointType: "auto",
            maintRelaxedCommandTimeout: RELAXED_COMMAND_TIMEOUT,
          },
          commandOptions: { timeout: NORMAL_COMMAND_TIMEOUT },
          RESP: 3 as const,
        },
        dbConfig: requirement.dbconfig,
        testTimeout: TEST_TIMEOUT
      } satisfies TestOptions;

      // PubSub tests don't need short timeout - they test subscription preservation
      const pubSubTestOptions = {
        clusterConfiguration: {
          defaults: {
            maintNotifications: "enabled",
            maintEndpointType: "auto",
          },
          RESP: 3 as const,
        },
        dbConfig: requirement.dbconfig,
        testTimeout: TEST_TIMEOUT
      } satisfies TestOptions;

      const baseTestName = `[Trig] ${trigger.name}, [DB] ${requirement.dbconfig.name}, [Test]`;

      testUtils.testWithRECluster(
        `${baseTestName} DataCommands`,
      async (cluster, faultInjectorClient) => {
        const initialMasterAddresses = new Set(
          cluster.masters.map((m) => m.address)
        );

        const initialMasterCount = cluster.masters.length;

        assert.equal(
          diagnosticEvents.length,
          0,
          "should not have received any notifications yet"
        );

        // Trigger migration
        await faultInjectorClient.triggerAction(ACTION, ACTION_OPTIONS);

        // Verify notifications were received
        const sMigratingEventCount = diagnosticEvents.filter(
          (event) => event.type === "SMIGRATING"
        ).length;
        assert(
          sMigratingEventCount >= 1,
          "should have received at least one SMIGRATING notification"
        );
        const sMigratedEventCount = diagnosticEvents.filter(
          (event) => event.type === "SMIGRATED"
        ).length;
        assert(
          sMigratedEventCount >= 1,
          "should have received at least one SMIGRATED notification"
        );

        // Verify topology changed
        assert.equal(
          cluster.masters.length,
          initialMasterCount,
          `should have ${initialMasterCount} masters after migrate`
        );

        // Verify master addresses remain the same (slot-shuffle doesn't change nodes)
        const currentMasterAddresses = new Set(
          cluster.masters.map((m) => m.address)
        );

        assert.deepStrictEqual(
          currentMasterAddresses,
          initialMasterAddresses,
          "addresses should remain the same after slot-shuffle"
        );

        // Verify data is still accessible after migrate
        for (const key of KEYS) {
          await cluster.set(key, `updated-${key}`);
          const value = await cluster.get(key);
          assert.strictEqual(
            value,
            `updated-${key}`,
            `New writes should succeed for ${key}`
          );
        }

        // Verify timeout is un-relaxed after SMIGRATED
        const { error, duration } = await blockCommand(async () => {
          await cluster.set("timeout-test-key", "value");
        });

        assert.ok(
          error instanceof Error,
          "Command Timeout error should be instanceof Error"
        );
        assert.ok(
          duration >= NORMAL_COMMAND_TIMEOUT * 0.8 &&
            duration < NORMAL_COMMAND_TIMEOUT * 1.5,
          `Command should timeout within normal timeout range. Duration: ${duration}ms, Expected: [${NORMAL_COMMAND_TIMEOUT * 0.8}, ${NORMAL_COMMAND_TIMEOUT * 1.5})`
        );
        assert.strictEqual(
          error?.constructor?.name,
          "TimeoutError",
          "Command Timeout error should be TimeoutError (not CommandTimeoutDuringMaintenanceError)"
        );
        },
        dataCommandsTestOptions
      );

      testUtils.testWithRECluster(
        `${baseTestName} ShardedPubSub`,
        async (cluster, faultInjectorClient) => {
        const stats: Record<string, { sent: number; received: number }> = {};
        for (const channel of KEYS) {
          stats[channel] = { sent: 0, received: 0 };
        }

        for (const channel of KEYS) {
          await cluster.sSubscribe(channel, (_msg, ch) => {
            stats[ch].received++;
          });
        }

        // Start publishing messages continuously
        const publishController = new AbortController();
        const publishPromise = (async () => {
          while (!publishController.signal.aborted) {
            const batchPromises: Promise<void>[] = [];
            for (const channel of KEYS) {
              const p = cluster
                .sPublish(channel, `${Date.now()}`)
                .then(() => {
                  stats[channel].sent++;
                })
                .catch(() => {
                  // Ignore publish errors during migrate
                });
              batchPromises.push(p);
            }
            await Promise.all(batchPromises);
            await setTimeout(50);
          }
        })();

        // Trigger migration during publishing
        await faultInjectorClient.triggerAction(ACTION, ACTION_OPTIONS);

        // Stop publishing
        publishController.abort();
        await publishPromise;

        for (const channel of KEYS) {
          assert.ok(
            stats[channel].received <= stats[channel].sent,
            `Channel ${channel}: received (${stats[channel].received}) should be <= sent (${stats[channel].sent}) during migrate`
          );
        }

        // Wait for cluster to stabilize
        await setTimeout(1000);

        // Reset stats for after-migration verification
        for (const channel of KEYS) {
          stats[channel] = { sent: 0, received: 0 };
        }

        // Publish messages after migration - all should be received
        for (const channel of KEYS) {
          for (let i = 0; i < 10; i++) {
            await cluster.sPublish(channel, `after-${i}`);
            stats[channel].sent++;
          }
        }

        // Wait for messages to be received
        await setTimeout(500);

        // Verify all messages received after migration (subscription preserved)
        for (const channel of KEYS) {
          assert.strictEqual(
            stats[channel].received,
            stats[channel].sent,
            `Channel ${channel}: all messages (${stats[channel].sent}) should be received after migrate - subscription preserved`
          );
        }
        },
        pubSubTestOptions
      );

      testUtils.testWithRECluster(
        `${baseTestName} PubSub`,
        async (cluster, faultInjectorClient) => {
        const stats: Record<string, { sent: number; received: number }> = {};
        for (const channel of KEYS) {
          stats[channel] = { sent: 0, received: 0 };
        }

        for (const channel of KEYS) {
          await cluster.subscribe(channel, (_msg, ch) => {
            stats[ch].received++;
          });
        }

        // Start publishing messages continuously
        const publishController = new AbortController();
        const publishPromise = (async () => {
          while (!publishController.signal.aborted) {
            const batchPromises: Promise<void>[] = [];
            for (const channel of KEYS) {
              const p = cluster
                .publish(channel, `${Date.now()}`)
                .then(() => {
                  stats[channel].sent++;
                })
                .catch(() => {
                  // Ignore publish errors during migrate
                });
              batchPromises.push(p);
            }
            await Promise.all(batchPromises);
            await setTimeout(50);
          }
        })();

        // Trigger migration during publishing
        await faultInjectorClient.triggerAction(ACTION, ACTION_OPTIONS);

        // Stop publishing
        publishController.abort();
        await publishPromise;

        for (const channel of KEYS) {
          assert.ok(
            stats[channel].received <= stats[channel].sent,
            `Channel ${channel}: received (${stats[channel].received}) should be <= sent (${stats[channel].sent}) during migrate`
          );
        }

        // Wait for cluster to stabilize
        await setTimeout(1000);

        // Reset stats for after-migration verification
        for (const channel of KEYS) {
          stats[channel] = { sent: 0, received: 0 };
        }

        // Publish messages after migration - all should be received
        for (const channel of KEYS) {
          for (let i = 0; i < 10; i++) {
            await cluster.publish(channel, `after-${i}`);
            stats[channel].sent++;
          }
        }

        // Wait for messages to be received
        await setTimeout(500);

        // Verify all messages received after migration (subscription preserved)
        for (const channel of KEYS) {
          assert.strictEqual(
            stats[channel].received,
            stats[channel].sent,
            `Channel ${channel}: all messages (${stats[channel].sent}) should be received after migrate - subscription preserved`
          );
        }
        },
        pubSubTestOptions
      );
      }
    }
  });

  describe("Effect: add", () => {
    // Dynamically generate tests for each trigger from "add" effect
    for (const trigger of addTriggers) {
      for (const requirement of trigger.requirements) {
      const ACTION = {
        type: "slot_migrate",
        parameters: {
          effect: "add",
          cluster_index: 0,
          trigger: trigger.name,
        },
      } satisfies ActionRequest;

      // Build options with trigger-specific dbConfig if available
      // DataCommands test needs short timeout to verify un-relaxation behavior
      const dataCommandsTestOptions = {
        clusterConfiguration: {
          defaults: {
            maintNotifications: "enabled",
            maintEndpointType: "auto",
            maintRelaxedCommandTimeout: RELAXED_COMMAND_TIMEOUT,
          },
          commandOptions: { timeout: NORMAL_COMMAND_TIMEOUT },
          RESP: 3 as const,
        },
        dbConfig: requirement.dbconfig,
        testTimeout: TEST_TIMEOUT
      } satisfies TestOptions;

      // PubSub tests don't need short timeout - they test subscription preservation
      const pubSubTestOptions = {
        clusterConfiguration: {
          defaults: {
            maintNotifications: "enabled",
            maintEndpointType: "auto",
          },
          RESP: 3 as const,
        },
        dbConfig: requirement.dbconfig,
        testTimeout: TEST_TIMEOUT
      } satisfies TestOptions;

      const baseTestName = `[Trig] ${trigger.name}, [DB] ${requirement.dbconfig.name}, [Test]`;

      testUtils.testWithRECluster(
        `${baseTestName} DataCommands`,
      async (cluster, faultInjectorClient) => {
        const initialMasterAddresses = new Set(
          cluster.masters.map((m) => m.address)
        );
        const initialMasterCount = cluster.masters.length;

        assert.equal(
          diagnosticEvents.length,
          0,
          "should not have received any notifications yet"
        );

        // Trigger migration
        await faultInjectorClient.triggerAction(ACTION, ACTION_OPTIONS);

        // Verify notifications were received
        const sMigratingEventCount = diagnosticEvents.filter(
          (event) => event.type === "SMIGRATING"
        ).length;
        assert(
          sMigratingEventCount >= 1,
          "should have received at least one SMIGRATING notification"
        );
        const sMigratedEventCount = diagnosticEvents.filter(
          (event) => event.type === "SMIGRATED"
        ).length;
        assert(
          sMigratedEventCount >= 1,
          "should have received at least one SMIGRATED notification"
        );

        // Verify topology changed
        assert.equal(
          cluster.masters.length,
          initialMasterCount + 1,
          `should have ${initialMasterCount + 1} masters after migrate`
        );

        // Verify at least one master address changed
        const currentMasterAddresses = new Set(
          cluster.masters.map((m) => m.address)
        );

        assert.notDeepStrictEqual(
          currentMasterAddresses,
          initialMasterAddresses,
          "addresses should NOT be the same"
        );

        // Verify data is still accessible after migrate
        for (const key of KEYS) {
          await cluster.set(key, `updated-${key}`);
          const value = await cluster.get(key);
          assert.strictEqual(
            value,
            `updated-${key}`,
            `New writes should succeed for ${key}`
          );
        }

        // Verify timeout is un-relaxed after SMIGRATED
        const { error, duration } = await blockCommand(async () => {
          await cluster.set("timeout-test-key", "value");
        });

        assert.ok(
          error instanceof Error,
          "Command Timeout error should be instanceof Error"
        );
        assert.ok(
          duration >= NORMAL_COMMAND_TIMEOUT * 0.8 &&
            duration < NORMAL_COMMAND_TIMEOUT * 1.5,
          `Command should timeout within normal timeout range. Duration: ${duration}ms, Expected: [${NORMAL_COMMAND_TIMEOUT * 0.8}, ${NORMAL_COMMAND_TIMEOUT * 1.5})`
        );
        assert.strictEqual(
          error?.constructor?.name,
          "TimeoutError",
          "Command Timeout error should be TimeoutError (not CommandTimeoutDuringMaintenanceError)"
        );
        },
        dataCommandsTestOptions
      );

      testUtils.testWithRECluster(
        `${baseTestName} ShardedPubSub`,
        async (cluster, faultInjectorClient) => {
        const stats: Record<string, { sent: number; received: number }> = {};
        for (const channel of KEYS) {
          stats[channel] = { sent: 0, received: 0 };
        }

        for (const channel of KEYS) {
          await cluster.sSubscribe(channel, (_msg, ch) => {
            stats[ch].received++;
          });
        }

        // Start publishing messages continuously
        const publishController = new AbortController();
        const publishPromise = (async () => {
          while (!publishController.signal.aborted) {
            const batchPromises: Promise<void>[] = [];
            for (const channel of KEYS) {
              const p = cluster
                .sPublish(channel, `${Date.now()}`)
                .then(() => {
                  stats[channel].sent++;
                })
                .catch(() => {
                  // Ignore publish errors during migrate
                });
              batchPromises.push(p);
            }
            await Promise.all(batchPromises);
            await setTimeout(50);
          }
        })();

        // Trigger migration during publishing
        await faultInjectorClient.triggerAction(ACTION, ACTION_OPTIONS);

        // Stop publishing
        publishController.abort();
        await publishPromise;

        for (const channel of KEYS) {
          assert.ok(
            stats[channel].received <= stats[channel].sent,
            `Channel ${channel}: received (${stats[channel].received}) should be <= sent (${stats[channel].sent}) during migrate`
          );
        }

        // Wait for cluster to stabilize
        await setTimeout(1000);

        // Reset stats for after-migration verification
        for (const channel of KEYS) {
          stats[channel] = { sent: 0, received: 0 };
        }

        // Publish messages after migration - all should be received
        for (const channel of KEYS) {
          for (let i = 0; i < 10; i++) {
            await cluster.sPublish(channel, `after-${i}`);
            stats[channel].sent++;
          }
        }

        // Wait for messages to be received
        await setTimeout(500);

        // Verify all messages received after migration (subscription preserved)
        for (const channel of KEYS) {
          assert.strictEqual(
            stats[channel].received,
            stats[channel].sent,
            `Channel ${channel}: all messages (${stats[channel].sent}) should be received after migrate - subscription preserved`
          );
        }
        },
        pubSubTestOptions
      );

      testUtils.testWithRECluster(
        `${baseTestName} PubSub`,
        async (cluster, faultInjectorClient) => {
        const stats: Record<string, { sent: number; received: number }> = {};
        for (const channel of KEYS) {
          stats[channel] = { sent: 0, received: 0 };
        }

        for (const channel of KEYS) {
          await cluster.subscribe(channel, (_msg, ch) => {
            stats[ch].received++;
          });
        }

        // Start publishing messages continuously
        const publishController = new AbortController();
        const publishPromise = (async () => {
          while (!publishController.signal.aborted) {
            const batchPromises: Promise<void>[] = [];
            for (const channel of KEYS) {
              const p = cluster
                .publish(channel, `${Date.now()}`)
                .then(() => {
                  stats[channel].sent++;
                })
                .catch(() => {
                  // Ignore publish errors during migrate
                });
              batchPromises.push(p);
            }
            await Promise.all(batchPromises);
            await setTimeout(50);
          }
        })();

        // Trigger migration during publishing
        await faultInjectorClient.triggerAction(ACTION, ACTION_OPTIONS);

        // Stop publishing
        publishController.abort();
        await publishPromise;

        for (const channel of KEYS) {
          assert.ok(
            stats[channel].received <= stats[channel].sent,
            `Channel ${channel}: received (${stats[channel].received}) should be <= sent (${stats[channel].sent}) during migrate`
          );
        }

        // Wait for cluster to stabilize
        await setTimeout(1000);

        // Reset stats for after-migration verification
        for (const channel of KEYS) {
          stats[channel] = { sent: 0, received: 0 };
        }

        // Publish messages after migration - all should be received
        for (const channel of KEYS) {
          for (let i = 0; i < 10; i++) {
            await cluster.publish(channel, `after-${i}`);
            stats[channel].sent++;
          }
        }

        // Wait for messages to be received
        await setTimeout(500);

        // Verify all messages received after migration (subscription preserved)
        for (const channel of KEYS) {
          assert.strictEqual(
            stats[channel].received,
            stats[channel].sent,
            `Channel ${channel}: all messages (${stats[channel].sent}) should be received after migrate - subscription preserved`
          );
        }
        },
        pubSubTestOptions
      );
      }
    }
  });
  });

  // Signal to Mocha that async setup is complete and tests can run
  run();
})();
