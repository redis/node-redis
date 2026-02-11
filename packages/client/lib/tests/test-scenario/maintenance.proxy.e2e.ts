import assert from "node:assert";
import { setTimeout } from "node:timers/promises";
import diagnostics_channel from "node:diagnostics_channel";

import testUtils from "../../test-utils";
import { DiagnosticsEvent } from "../../client/enterprise-maintenance-manager";
import { FaultInjectorClient, ActionTrigger } from "@redis/test-utils/lib/fault-injector";

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
  let addRemoveTriggers: ActionTrigger[] = [];
  let slotShuffleTriggers: ActionTrigger[] = [];

  if (baseUrl) {
    const setupFaultInjectorClient = new FaultInjectorClient(baseUrl);

    // Make 4 asynchronous calls to listActionTriggers() in parallel
    [addTriggers, removeTriggers, addRemoveTriggers, slotShuffleTriggers] = await Promise.all([
      setupFaultInjectorClient.listActionTriggers("slot-migrate", "add"),
      setupFaultInjectorClient.listActionTriggers("slot-migrate", "remove"),
      setupFaultInjectorClient.listActionTriggers("slot-migrate", "remove-add"),
      setupFaultInjectorClient.listActionTriggers("slot-migrate", "slot-shuffle"),
    ]);
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

  beforeEach(() => {
    diagnostics_channel.subscribe("redis.maintenance", onMessage);
    diagnosticEvents = [];
  });

  afterEach(() => {
    diagnostics_channel.unsubscribe("redis.maintenance", onMessage);
  });

  // describe("Notifications", () => {

  //   assert(slotShuffleTriggers.length > 0, "slotShuffleTriggers should have at least one trigger");

  //   for (const trigger of slotShuffleTriggers) {
  //     describe(`[${trigger.name}]`, () => {
  //       const dbConfig = trigger.requirements[0].dbconfig;
  //       // dbConfig.name = 'foo';
  //       const testOptions = {
  //         clusterConfiguration: {
  //           defaults: {
  //             maintNotifications: "enabled",
  //           },
  //           RESP: 3 as const,
  //         },
  //         dbConfig,
  //       } as const;

  //       testUtils.testWithProxiedCluster(
  //         `should NOT receive notifications when maintNotifications is disabled`,
  //         async (cluster, faultInjectorClient) => {
  //           assert.equal(
  //             diagnosticEvents.length,
  //             0,
  //             "should not have received any notifications yet"
  //           );

  //           await cluster.set('key', 'value');
  //           const key = await cluster.get('key');
  //           assert.equal(key, 'value');
  //           console.log(key);

  //           // Trigger migration
  //           await faultInjectorClient.triggerAction({
  //             type: "slot_migrate",
  //             parameters: {
  //               effect: "slot-shuffle",
  //               cluster_index: 0,
  //               trigger: trigger.name,
  //             },
  //           });

  //           // Verify NO maintenance notifications received
  //           assert.strictEqual(
  //             diagnosticEvents.length,
  //             0,
  //             "should NOT receive any SMIGRATING/SMIGRATED notifications when disabled"
  //           );
  //         },
  //         testOptions
  //       );
  //     });
  //   }
  // });

  describe("Migrate - source: dying -> dest: existing", () => {
    const MASTERS_COUNT = 3;

    assert(removeTriggers.length > 0, "removeTriggers should have at least one trigger");

    // Dynamically generate tests for each trigger from "remove" effect
    for (const trigger of removeTriggers) {
      describe(`[${trigger.name}]`, () => {
        const MIGRATE_ACTION = {
          type: "migrate",
          parameters: {
            cluster_index: 0,
            slot_migration: "all",
            destination_type: "existing",
            trigger: trigger.name,
          },
        } as const;

        // Build options with trigger-specific dbConfig if available
        const testOptions = {
          freshContainer: true,
          numberOfMasters: MASTERS_COUNT,
          clusterConfiguration: {
            defaults: {
              maintNotifications: "enabled",
              maintEndpointType: "auto",
            },
            RESP: 3 as const,
          },
          dbConfig: trigger.requirements[0].dbconfig,
        } as const;

        testUtils.testWithRECluster(
          `normal - should handle migration`,
        async (cluster, faultInjectorClient) => {
          const initialMasterAddresses = new Set(
            cluster.masters.map((m) => m.address)
          );

          assert.equal(
            diagnosticEvents.length,
            0,
            "should not have received any notifications yet"
          );
          assert.equal(
            cluster.masters.length,
            MASTERS_COUNT,
            `should have ${MASTERS_COUNT} masters at start`
          );

          // Trigger migration
          await faultInjectorClient.triggerAction(MIGRATE_ACTION);

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
            MASTERS_COUNT - 1,
            `should have ${MASTERS_COUNT - 1} masters after migrate`
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
        },
          testOptions
        );

        testUtils.testWithRECluster(
          `sharded pubsub - should handle migration`,
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
              for (const channel of KEYS) {
                cluster
                  .sPublish(channel, `${Date.now()}`)
                  .then(() => {
                    stats[channel].sent++;
                  })
                  .catch(() => {
                    // Ignore publish errors during migrate
                  });
              }
              await setTimeout(50);
            }
          })();

          // Trigger migration during publishing
          await faultInjectorClient.triggerAction(MIGRATE_ACTION);

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
          testOptions
        );

        testUtils.testWithRECluster(
          `pubsub - should handle migration`,
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
              for (const channel of KEYS) {
                cluster
                  .publish(channel, `${Date.now()}`)
                  .then(() => {
                    stats[channel].sent++;
                  })
                  .catch(() => {
                    // Ignore publish errors during migrate
                  });
              }
              await setTimeout(50);
            }
          })();

          // Trigger migration during publishing
          await faultInjectorClient.triggerAction(MIGRATE_ACTION);

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
          testOptions
        );
      });
    }
  });

  describe("Migrate - source: dying -> dest: new", () => {
    const MASTERS_NODES_COUNT = 3;
    const VISIBLE_NODES_COUNT = 2;

    assert(addTriggers.length > 0, "addTriggers should have at least one trigger");

    // Dynamically generate tests for each trigger from "add" effect
    for (const trigger of addTriggers) {
      describe(`[${trigger.name}]`, () => {
        const MIGRATE_ACTION = {
          type: "migrate",
          parameters: {
            cluster_index: 0,
            slot_migration: "all",
            destination_type: "new",
            trigger: trigger.name,
          },
        } as const;

        // Build options with trigger-specific dbConfig if available
        const testOptions = {
          freshContainer: true,
          numberOfMasters: MASTERS_NODES_COUNT,
          startWithReducedNodes: true,
          clusterConfiguration: {
            defaults: {
              maintNotifications: "enabled",
              maintEndpointType: "auto",
            },
            RESP: 3 as const,
          },
          dbConfig: trigger.requirements[0].dbconfig,
        } as const;

        testUtils.testWithRECluster(
          `normal - should handle migration`,
        async (cluster, faultInjectorClient) => {
          const initialMasterAddresses = new Set(
            cluster.masters.map((m) => m.address)
          );

          assert.equal(
            diagnosticEvents.length,
            0,
            "should not have received any notifications yet"
          );
          assert.equal(
            cluster.masters.length,
            VISIBLE_NODES_COUNT,
            `should have ${VISIBLE_NODES_COUNT} masters at start`
          );

          // Trigger migration
          await faultInjectorClient.triggerAction(MIGRATE_ACTION);

          // Wait for cluster to stabilize
          await setTimeout(1000);

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
            VISIBLE_NODES_COUNT,
            `should have ${VISIBLE_NODES_COUNT} masters after migrate`
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
          },
          testOptions
        );

        testUtils.testWithRECluster(
          `sharded pubsub - should handle migration`,
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
              for (const channel of KEYS) {
                cluster
                  .sPublish(channel, `${Date.now()}`)
                  .then(() => {
                    stats[channel].sent++;
                  })
                  .catch(() => {
                    // Ignore publish errors during migrate
                  });
              }
              await setTimeout(50);
            }
          })();

          // Trigger migration during publishing
          await faultInjectorClient.triggerAction(MIGRATE_ACTION);

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
          testOptions
        );

        testUtils.testWithRECluster(
          `pubsub - should handle migration`,
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
              for (const channel of KEYS) {
                cluster
                  .publish(channel, `${Date.now()}`)
                  .then(() => {
                    stats[channel].sent++;
                  })
                  .catch(() => {
                    // Ignore publish errors during migrate
                  });
              }
              await setTimeout(50);
            }
          })();

          // Trigger migration during publishing
          await faultInjectorClient.triggerAction(MIGRATE_ACTION);

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
          testOptions
        );
      });
    }
  });

  describe("Migrate - source: active -> dest: existing", () => {
    const MASTERS_COUNT = 3;

    assert(addRemoveTriggers.length > 0, "addRemoveTriggers should have at least one trigger");

    // Dynamically generate tests for each trigger from "add-remove" effect
    for (const trigger of addRemoveTriggers) {
      describe(`[${trigger.name}]`, () => {
        const MIGRATE_ACTION = {
          type: "migrate",
          parameters: {
            cluster_index: 0,
            slot_migration: "half",
            destination_type: "existing",
            trigger: trigger.name,
          },
        } as const;

        // Build options with trigger-specific dbConfig if available
        const testOptions = {
          numberOfMasters: MASTERS_COUNT,
          freshContainer: true,
          clusterConfiguration: {
            defaults: {
              maintNotifications: "enabled",
              maintEndpointType: "auto",
            },
            RESP: 3 as const,
          },
          dbConfig: trigger.requirements[0].dbconfig,
        } as const;

        testUtils.testWithRECluster(
          `normal - should handle migration`,
        async (cluster, faultInjectorClient) => {
          const initialMasterAddresses = new Set(
            cluster.masters.map((m) => m.address)
          );

          assert.equal(
            diagnosticEvents.length,
            0,
            "should not have received any notifications yet"
          );
          assert.equal(
            cluster.masters.length,
            MASTERS_COUNT,
            `should have ${MASTERS_COUNT} masters at start`
          );

          // Trigger migration
          await faultInjectorClient.triggerAction(MIGRATE_ACTION);

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
            MASTERS_COUNT,
            `should have ${MASTERS_COUNT} masters after migrate`
          );

          // Verify at least no master address changed
          const currentMasterAddresses = new Set(
            cluster.masters.map((m) => m.address)
          );

          assert.deepStrictEqual(
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
          },
          testOptions
        );

        testUtils.testWithRECluster(
          `sharded pubsub - should handle migration`,
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
              for (const channel of KEYS) {
                cluster
                  .sPublish(channel, `${Date.now()}`)
                  .then(() => {
                    stats[channel].sent++;
                  })
                  .catch(() => {
                    // Ignore publish errors during migrate
                  });
              }
              await setTimeout(50);
            }
          })();

          // Trigger migration during publishing
          await faultInjectorClient.triggerAction(MIGRATE_ACTION);

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
          testOptions
        );

        testUtils.testWithRECluster(
          `pubsub - should handle migration`,
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
              for (const channel of KEYS) {
                cluster
                  .publish(channel, `${Date.now()}`)
                  .then(() => {
                    stats[channel].sent++;
                  })
                  .catch(() => {
                    // Ignore publish errors during migrate
                  });
              }
              await setTimeout(50);
            }
          })();

          // Trigger migration during publishing
          await faultInjectorClient.triggerAction(MIGRATE_ACTION);

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
          testOptions
        );
      });
    }
  });

  describe("Migrate - source: active -> dest: new", () => {
    const MASTERS_NODES_COUNT = 3;
    const VISIBLE_NODES_COUNT = 2;

    assert(slotShuffleTriggers.length > 0, "slotShuffleTriggers should have at least one trigger");

    // Dynamically generate tests for each trigger from "slot-shuffle" effect
    for (const trigger of slotShuffleTriggers) {
      describe(`[${trigger.name}]`, () => {
        const MIGRATE_ACTION = {
          type: "migrate",
          parameters: {
            cluster_index: 0,
            slot_migration: "half",
            destination_type: "new",
            trigger: trigger.name,
          },
        } as const;

        // Build options with trigger-specific dbConfig if available
        const testOptions = {
          numberOfMasters: MASTERS_NODES_COUNT,
          startWithReducedNodes: true,
          freshContainer: true,
          clusterConfiguration: {
            defaults: {
              maintNotifications: "enabled",
              maintEndpointType: "auto",
            },
            RESP: 3 as const,
          },
          dbConfig: trigger.requirements[0].dbconfig,
        } as const;

        testUtils.testWithRECluster(
          `normal - should handle migration`,
        async (cluster, faultInjectorClient) => {
          const initialMasterAddresses = new Set(
            cluster.masters.map((m) => m.address)
          );

          assert.equal(
            diagnosticEvents.length,
            0,
            "should not have received any notifications yet"
          );
          assert.equal(
            cluster.masters.length,
            VISIBLE_NODES_COUNT,
            `should have ${VISIBLE_NODES_COUNT} masters at start`
          );

          // Trigger migration
          await faultInjectorClient.triggerAction(MIGRATE_ACTION);

          // Wait for cluster to stabilize
          await setTimeout(1000);

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
            VISIBLE_NODES_COUNT + 1,
            `should have ${VISIBLE_NODES_COUNT + 1} masters after migrate`
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
          },
          testOptions
        );

        testUtils.testWithRECluster(
          `sharded pubsub - should handle migration`,
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
              for (const channel of KEYS) {
                cluster
                  .sPublish(channel, `${Date.now()}`)
                  .then(() => {
                    stats[channel].sent++;
                  })
                  .catch(() => {
                    // Ignore publish errors during migrate
                  });
              }
              await setTimeout(50);
            }
          })();

          // Trigger migration during publishing
          await faultInjectorClient.triggerAction(MIGRATE_ACTION);

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
          testOptions
        );

        testUtils.testWithRECluster(
          `pubsub - should handle migration`,
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
              for (const channel of KEYS) {
                cluster
                  .publish(channel, `${Date.now()}`)
                  .then(() => {
                    stats[channel].sent++;
                  })
                  .catch(() => {
                    // Ignore publish errors during migrate
                  });
              }
              await setTimeout(50);
            }
          })();

          // Trigger migration during publishing
          await faultInjectorClient.triggerAction(MIGRATE_ACTION);

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
          testOptions
        );
      });
    }
  });
  });

  // Signal to Mocha that async setup is complete and tests can run
  run();
})();
