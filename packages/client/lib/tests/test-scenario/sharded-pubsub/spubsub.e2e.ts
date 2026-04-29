import type { ActionRequest } from "@redis/test-utils/lib/fault-injector";
import testUtils from "../../../test-utils";
import { TestCommandRunner } from "./utils/command-runner";
import { CHANNELS, CHANNELS_BY_SLOT } from "./utils/test.util";
import { MessageTracker } from "./utils/message-tracker";
import assert from "node:assert";
import { setTimeout } from "node:timers/promises";

const TEST_TIMEOUT = 180_000;
const CLUSTER_INDEX = 0;
const FAILURE_ACTION_TIMEOUT_MS = 120_000;
const FAILURE_PUBLISH_WARMUP_MS = 1_000;
const FAILURE_RECOVERY_WAIT_MS = 2_000;
const PUBLISH_VERIFICATION_DURATION_MS = 10_000;
const UNSUBSCRIBE_VERIFICATION_DURATION_MS = 5_000;
const POST_RECOVERY_PUBLISH_DURATION_MS = 10_000;
const POST_RECOVERY_DELIVERY_RATIO = 0.9;
const RECOVERY_ASSERTION_TIMEOUT_MS = 45_000;
const RECOVERY_ASSERTION_INTERVAL_MS = 100;

const FAILURE_CASES = [
  {
    name: "should resume publishing and receiving after failover",
    action: {
      type: "failover",
      parameters: {
        cluster_index: CLUSTER_INDEX,
      },
    },
  },
  {
    name: "should resume publishing and receiving after rebooting a cluster node",
    action: {
      type: "node_failure",
      parameters: {
        cluster_index: CLUSTER_INDEX,
        node_id: 1,
        method: "reboot",
      },
    },
  },
  {
    name: "should resume publishing and receiving after restarting the database proxy",
    action: {
      type: "proxy_failure",
      parameters: {
        cluster_index: CLUSTER_INDEX,
        action: "restart",
      },
    },
  },
  {
    name: "should resume publishing and receiving after a shard failure",
    action: {
      type: "shard_failure",
      parameters: {
        cluster_index: CLUSTER_INDEX,
      },
    },
  },
] as const satisfies ReadonlyArray<{
  name: string;
  action: Readonly<ActionRequest>;
}>;

function getChannelStatsOrThrow(messageTracker: MessageTracker, channel: string) {
  const stats = messageTracker.getChannelStats(channel);
  assert.ok(stats, `Expected stats for channel ${channel}`);
  return stats;
}

type BackgroundPublisher = Parameters<
  typeof TestCommandRunner.publishMessagesUntilAbortSignal
>[0];
type BackgroundPublishOptions = Parameters<
  typeof TestCommandRunner.publishMessagesUntilAbortSignal
>[3];

async function createConnectedDuplicate<
  T extends {
    duplicate(): T;
    connect(): Promise<unknown>;
  },
>(client: T): Promise<T> {
  const duplicate = client.duplicate();
  await duplicate.connect();
  return duplicate;
}

async function withBackgroundPublishing<T>(
  client: BackgroundPublisher,
  channels: string[],
  messageTracker: MessageTracker,
  callback: () => Promise<T>,
  options?: BackgroundPublishOptions,
): Promise<T> {
  const { controller, result } =
    TestCommandRunner.publishMessagesUntilAbortSignal(
      client,
      channels,
      messageTracker,
      options,
    );

  let callbackError: unknown;

  try {
    return await callback();
  } catch (error) {
    callbackError = error;
    throw error;
  } finally {
    controller.abort();

    try {
      await result;
    } catch (error) {
      if (callbackError === undefined) {
        // eslint-disable-next-line no-unsafe-finally -- intentionally surface publisher failure when callback succeeded
        throw error;
      }
    }
  }
}

async function waitForAssertion(
  assertion: () => void,
  timeoutMs: number,
  intervalMs = RECOVERY_ASSERTION_INTERVAL_MS,
) {
  const start = Date.now();
  let lastError: unknown;

  while (Date.now() - start < timeoutMs) {
    try {
      assertion();
      return;
    } catch (error) {
      lastError = error;
      await setTimeout(intervalMs);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Assertion did not pass within ${timeoutMs}ms`);
}

describe("Sharded Pub/Sub E2E", () => {
  describe("Single Subscriber", () => {
    testUtils.testWithRECluster(
      "should receive messages published to multiple channels",
      async (cluster) => {
        const messageTracker = new MessageTracker(CHANNELS);
        const publisher = cluster;
        const subscriber = await createConnectedDuplicate(cluster);

        try {
          for (const channel of CHANNELS) {
            await subscriber.sSubscribe(channel, (_message, receivedChannel) =>
              messageTracker.incrementReceived(receivedChannel),
            );
          }

          await withBackgroundPublishing(
            publisher,
            CHANNELS,
            messageTracker,
            async () => {
              await setTimeout(PUBLISH_VERIFICATION_DURATION_MS);
            },
          );

          for (const channel of CHANNELS) {
            const { sent, received } = getChannelStatsOrThrow(
              messageTracker,
              channel,
            );

            assert.strictEqual(
              received,
              sent,
              `Channel ${channel} should receive every published message`,
            );
          }
        } finally {
          subscriber.destroy();
        }
      },
      { testTimeout: TEST_TIMEOUT },
    );

    for (const failureCase of FAILURE_CASES) {
      testUtils.testWithRECluster(
        failureCase.name,
        async (cluster, faultInjectorClient) => {
          const messageTracker = new MessageTracker(CHANNELS);
          const publisher = cluster;
          const subscriber = await createConnectedDuplicate(cluster);

          try {
            for (const channel of CHANNELS) {
              await subscriber.sSubscribe(channel, (_message, receivedChannel) => {
                messageTracker.incrementReceived(receivedChannel);
              });
            }

            await withBackgroundPublishing(
              publisher,
              CHANNELS,
              messageTracker,
              async () => {
                await setTimeout(FAILURE_PUBLISH_WARMUP_MS);

                await faultInjectorClient.triggerAction(failureCase.action, {
                  maxWaitTimeMs: FAILURE_ACTION_TIMEOUT_MS,
                });
              },
            );

            const sentDuringFailure = CHANNELS.reduce(
              (sum, channel) =>
                sum + getChannelStatsOrThrow(messageTracker, channel).sent,
              0,
            );
            const receivedDuringFailure = CHANNELS.reduce(
              (sum, channel) =>
                sum + getChannelStatsOrThrow(messageTracker, channel).received,
              0,
            );

            assert.ok(
              sentDuringFailure > 0,
              "Expected messages to be published during the failure scenario",
            );
            assert.ok(
              receivedDuringFailure > 0,
              "Expected messages to be received during the failure scenario",
            );

            for (const channel of CHANNELS) {
              const { sent, received } = getChannelStatsOrThrow(
                messageTracker,
                channel,
              );

              assert.ok(
                received <= sent,
                `Channel ${channel}: received (${received}) should be <= sent (${sent})`,
              );
              assert.ok(
                received > 0,
                `Channel ${channel} should receive messages during the failure scenario`,
              );
            }

            await setTimeout(FAILURE_RECOVERY_WAIT_MS);
            messageTracker.reset();

            await withBackgroundPublishing(
              publisher,
              CHANNELS,
              messageTracker,
              async () => {
                await waitForAssertion(() => {
                  for (const channel of CHANNELS) {
                    const { received } = getChannelStatsOrThrow(
                      messageTracker,
                      channel,
                    );

                    assert.ok(
                      received > 0,
                      `Channel ${channel} should resume receiving messages after recovery`,
                    );
                  }
                }, RECOVERY_ASSERTION_TIMEOUT_MS);
              },
            );

            messageTracker.reset();

            await withBackgroundPublishing(
              publisher,
              CHANNELS,
              messageTracker,
              async () => {
                await setTimeout(POST_RECOVERY_PUBLISH_DURATION_MS);
              },
            );

            for (const channel of CHANNELS) {
              const { sent, received } = getChannelStatsOrThrow(
                messageTracker,
                channel,
              );
              const deliveryRatio = received / sent;

              assert.ok(
                sent > 0,
                `Channel ${channel} should have sent messages`,
              );
              assert.ok(
                received > 0,
                `Channel ${channel} should have received messages`,
              );
              assert.ok(
                deliveryRatio >= POST_RECOVERY_DELIVERY_RATIO,
                `Channel ${channel} received ${received} of ${sent} messages after recovery (${(
                  deliveryRatio * 100
                ).toFixed(1)}%)`,
              );
            }
          } finally {
            subscriber.destroy();
          }
        },
        { testTimeout: TEST_TIMEOUT },
      );
    }

    testUtils.testWithRECluster(
      "should NOT receive messages after sunsubscribe",
      async (cluster) => {
        const messageTracker = new MessageTracker(CHANNELS);
        const publisher = cluster;
        const subscriber = await createConnectedDuplicate(cluster);

        try {
          for (const channel of CHANNELS) {
            await subscriber.sSubscribe(channel, (_message, receivedChannel) =>
              messageTracker.incrementReceived(receivedChannel),
            );
          }

          await withBackgroundPublishing(
            publisher,
            CHANNELS,
            messageTracker,
            async () => {
              await setTimeout(UNSUBSCRIBE_VERIFICATION_DURATION_MS);
            },
          );

          for (const channel of CHANNELS) {
            const { sent, received } = getChannelStatsOrThrow(
              messageTracker,
              channel,
            );

            assert.strictEqual(
              received,
              sent,
              `Channel ${channel} should receive every published message before unsubscribe`,
            );
          }

          messageTracker.reset();

          const unsubscribeChannels = [
            CHANNELS_BY_SLOT["1000"],
            CHANNELS_BY_SLOT["8000"],
            CHANNELS_BY_SLOT["16000"],
          ];

          for (const channel of unsubscribeChannels) {
            await subscriber.sUnsubscribe(channel);
          }

          await withBackgroundPublishing(
            publisher,
            CHANNELS,
            messageTracker,
            async () => {
              await setTimeout(UNSUBSCRIBE_VERIFICATION_DURATION_MS);
            },
          );

          for (const channel of unsubscribeChannels) {
            assert.strictEqual(
              getChannelStatsOrThrow(messageTracker, channel).received,
              0,
              `Channel ${channel} should not receive messages after unsubscribe`,
            );
          }

          const unsubscribedChannels = new Set<string>(unsubscribeChannels);
          const stillSubscribedChannels = CHANNELS.filter(
            (channel) => !unsubscribedChannels.has(channel),
          );

          for (const channel of stillSubscribedChannels) {
            assert.ok(
              getChannelStatsOrThrow(messageTracker, channel).received > 0,
              `Channel ${channel} should continue receiving messages`,
            );
          }
        } finally {
          subscriber.destroy();
        }
      },
      { testTimeout: TEST_TIMEOUT },
    );
  });

  describe("Multiple Subscribers", () => {
    testUtils.testWithRECluster(
      "should receive messages published to multiple channels",
      async (cluster) => {
        const messageTracker1 = new MessageTracker(CHANNELS);
        const messageTracker2 = new MessageTracker(CHANNELS);
        const publisher = cluster;
        const [subscriber1, subscriber2] = await Promise.all([
          createConnectedDuplicate(cluster),
          createConnectedDuplicate(cluster),
        ]);

        try {
          for (const channel of CHANNELS) {
            await subscriber1.sSubscribe(channel, (_message, receivedChannel) => {
              messageTracker1.incrementReceived(receivedChannel);
            });
            await subscriber2.sSubscribe(channel, (_message, receivedChannel) => {
              messageTracker2.incrementReceived(receivedChannel);
            });
          }

          await withBackgroundPublishing(
            publisher,
            CHANNELS,
            messageTracker1,
            async () => {
              await setTimeout(PUBLISH_VERIFICATION_DURATION_MS);
            },
          );

          for (const channel of CHANNELS) {
            const { sent, received: received1 } = getChannelStatsOrThrow(
              messageTracker1,
              channel,
            );
            const { received: received2 } = getChannelStatsOrThrow(
              messageTracker2,
              channel,
            );

            assert.strictEqual(
              received1,
              sent,
              `Channel ${channel} should deliver every message to subscriber 1`,
            );
            assert.strictEqual(
              received2,
              sent,
              `Channel ${channel} should deliver every message to subscriber 2`,
            );
          }
        } finally {
          subscriber1.destroy();
          subscriber2.destroy();
        }
      },
      { testTimeout: TEST_TIMEOUT },
    );

    testUtils.testWithRECluster(
      "should resume publishing and receiving after failover",
      async (cluster, faultInjectorClient) => {
        const messageTracker1 = new MessageTracker(CHANNELS);
        const messageTracker2 = new MessageTracker(CHANNELS);
        const publisher = cluster;
        const [subscriber1, subscriber2] = await Promise.all([
          createConnectedDuplicate(cluster),
          createConnectedDuplicate(cluster),
        ]);

        try {
          for (const channel of CHANNELS) {
            await subscriber1.sSubscribe(channel, (_message, receivedChannel) => {
              messageTracker1.incrementReceived(receivedChannel);
            });
            await subscriber2.sSubscribe(channel, (_message, receivedChannel) => {
              messageTracker2.incrementReceived(receivedChannel);
            });
          }

          await withBackgroundPublishing(
            publisher,
            CHANNELS,
            messageTracker1,
            async () => {
              await setTimeout(FAILURE_PUBLISH_WARMUP_MS);

              await faultInjectorClient.triggerAction(
                {
                  type: "failover",
                  parameters: {
                    cluster_index: CLUSTER_INDEX,
                  },
                },
                {
                  maxWaitTimeMs: FAILURE_ACTION_TIMEOUT_MS,
                },
              );
            },
          );

          for (const channel of CHANNELS) {
            const sent = getChannelStatsOrThrow(messageTracker1, channel).sent;
            const received1 = getChannelStatsOrThrow(
              messageTracker1,
              channel,
            ).received;
            const received2 = getChannelStatsOrThrow(
              messageTracker2,
              channel,
            ).received;

            assert.ok(
              received1 <= sent,
              `Channel ${channel}: subscriber 1 received (${received1}) should be <= sent (${sent})`,
            );
            assert.ok(
              received2 <= sent,
              `Channel ${channel}: subscriber 2 received (${received2}) should be <= sent (${sent})`,
            );
          }

          await setTimeout(FAILURE_RECOVERY_WAIT_MS);

          messageTracker1.reset();
          messageTracker2.reset();

          await withBackgroundPublishing(
            publisher,
            CHANNELS,
            messageTracker1,
            async () => {
              await setTimeout(PUBLISH_VERIFICATION_DURATION_MS);
            },
          );

          for (const channel of CHANNELS) {
            const sent = getChannelStatsOrThrow(messageTracker1, channel).sent;
            const received1 = getChannelStatsOrThrow(
              messageTracker1,
              channel,
            ).received;
            const received2 = getChannelStatsOrThrow(
              messageTracker2,
              channel,
            ).received;

            assert.ok(sent > 0, `Channel ${channel} should have sent messages`);
            assert.ok(
              received1 > 0,
              `Channel ${channel} should have received messages by subscriber 1`,
            );
            assert.ok(
              received2 > 0,
              `Channel ${channel} should have received messages by subscriber 2`,
            );
            assert.strictEqual(
              received1,
              sent,
              `Channel ${channel} should fully recover for subscriber 1 after failover`,
            );
            assert.strictEqual(
              received2,
              sent,
              `Channel ${channel} should fully recover for subscriber 2 after failover`,
            );
          }
        } finally {
          subscriber1.destroy();
          subscriber2.destroy();
        }
      },
      { testTimeout: TEST_TIMEOUT },
    );
  });
});
