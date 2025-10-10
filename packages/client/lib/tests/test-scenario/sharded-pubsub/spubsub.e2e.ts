import type { Cluster, TestConfig } from "./utils/test.util";
import { createClusterTestClient, getConfig } from "./utils/test.util";
import { FaultInjectorClient } from "../fault-injector-client";
import { TestCommandRunner } from "./utils/command-runner";
import { CHANNELS, CHANNELS_BY_SLOT } from "./utils/test.util";
import { MessageTracker } from "./utils/message-tracker";
import assert from "node:assert";
import { setTimeout } from "node:timers/promises";

describe("Sharded Pub/Sub E2E", () => {
  let faultInjectorClient: FaultInjectorClient;
  let config: TestConfig;

  before(() => {
    config = getConfig();

    faultInjectorClient = new FaultInjectorClient(config.faultInjectorUrl);
  });

  describe("Single Subscriber", () => {
    let subscriber: Cluster;
    let publisher: Cluster;
    let messageTracker: MessageTracker;

    beforeEach(async () => {
      messageTracker = new MessageTracker(CHANNELS);
      subscriber = createClusterTestClient(config.clientConfig, {});
      publisher = createClusterTestClient(config.clientConfig, {});
      await Promise.all([subscriber.connect(), publisher.connect()]);
    });

    afterEach(async () => {
      await Promise.all([subscriber.quit(), publisher.quit()]);
    });

    it("should receive messages published to multiple channels", async () => {
      for (const channel of CHANNELS) {
        await subscriber.sSubscribe(channel, (_msg, channel) =>
          messageTracker.incrementReceived(channel),
        );
      }
      const { controller, result } =
        TestCommandRunner.publishMessagesUntilAbortSignal(
          publisher,
          CHANNELS,
          messageTracker,
        );
      // Wait for 10 seconds, while publishing messages
      await setTimeout(10_000);
      controller.abort();
      await result;

      for (const channel of CHANNELS) {
        assert.strictEqual(
          messageTracker.getChannelStats(channel)?.received,
          messageTracker.getChannelStats(channel)?.sent,
        );
      }
    });

    it("should resume publishing and receiving after failover", async () => {
      for (const channel of CHANNELS) {
        await subscriber.sSubscribe(channel, (_msg, channel) => {
          messageTracker.incrementReceived(channel);
        });
      }

      // Trigger failover twice
      for (let i = 0; i < 2; i++) {
        // Start publishing messages
        const { controller: publishAbort, result: publishResult } =
          TestCommandRunner.publishMessagesUntilAbortSignal(
            publisher,
            CHANNELS,
            messageTracker,
          );

        // Trigger failover during publishing
        const { action_id: failoverActionId } =
          await faultInjectorClient.triggerAction({
            type: "failover",
            parameters: {
              bdb_id: config.clientConfig.bdbId.toString(),
              cluster_index: 0,
            },
          });

        // Wait for failover to complete
        await faultInjectorClient.waitForAction(failoverActionId);

        publishAbort.abort();
        await publishResult;

        for (const channel of CHANNELS) {
          const sent = messageTracker.getChannelStats(channel)!.sent;
          const received = messageTracker.getChannelStats(channel)!.received;

          assert.ok(
            received <= sent,
            `Channel ${channel}: received (${received}) should be <= sent (${sent})`,
          );
        }

        // Wait for 2 seconds before resuming publishing
        await setTimeout(2_000);
        messageTracker.reset();

        const {
          controller: afterFailoverController,
          result: afterFailoverResult,
        } = TestCommandRunner.publishMessagesUntilAbortSignal(
          publisher,
          CHANNELS,
          messageTracker,
        );

        await setTimeout(10_000);
        afterFailoverController.abort();
        await afterFailoverResult;

        for (const channel of CHANNELS) {
          const sent = messageTracker.getChannelStats(channel)!.sent;
          const received = messageTracker.getChannelStats(channel)!.received;
          assert.ok(sent > 0, `Channel ${channel} should have sent messages`);
          assert.ok(
            received > 0,
            `Channel ${channel} should have received messages`,
          );
          assert.strictEqual(
            messageTracker.getChannelStats(channel)!.received,
            messageTracker.getChannelStats(channel)!.sent,
            `Channel ${channel} received (${received}) should equal sent (${sent}) once resumed after failover`,
          );
        }
      }
    });

    it("should NOT receive messages after sunsubscribe", async () => {
      for (const channel of CHANNELS) {
        await subscriber.sSubscribe(channel, (_msg, channel) => messageTracker.incrementReceived(channel));
      }

      const { controller, result } =
        TestCommandRunner.publishMessagesUntilAbortSignal(
          publisher,
          CHANNELS,
          messageTracker,
        );

      // Wait for 5 seconds, while publishing messages
      await setTimeout(5_000);
      controller.abort();
      await result;

      for (const channel of CHANNELS) {
        assert.strictEqual(
          messageTracker.getChannelStats(channel)?.received,
          messageTracker.getChannelStats(channel)?.sent,
        );
      }

      // Reset message tracker
      messageTracker.reset();

      const unsubscribeChannels = [
        CHANNELS_BY_SLOT["1000"],
        CHANNELS_BY_SLOT["8000"],
        CHANNELS_BY_SLOT["16000"],
      ];

      for (const channel of unsubscribeChannels) {
        await subscriber.sUnsubscribe(channel);
      }

      const {
        controller: afterUnsubscribeController,
        result: afterUnsubscribeResult,
      } = TestCommandRunner.publishMessagesUntilAbortSignal(
        publisher,
        CHANNELS,
        messageTracker,
      );

      // Wait for 5 seconds, while publishing messages
      await setTimeout(5_000);
      afterUnsubscribeController.abort();
      await afterUnsubscribeResult;

      for (const channel of unsubscribeChannels) {
        assert.strictEqual(
          messageTracker.getChannelStats(channel)?.received,
          0,
          `Channel ${channel} should not have received messages after unsubscribe`,
        );
      }

      // All other channels should have received messages
      const stillSubscribedChannels = CHANNELS.filter(
        (channel) => !unsubscribeChannels.includes(channel as any),
      );

      for (const channel of stillSubscribedChannels) {
        assert.ok(
          messageTracker.getChannelStats(channel)!.received > 0,
          `Channel ${channel} should have received messages`,
        );
      }
    });
  });

  describe("Multiple Subscribers", () => {
    let subscriber1: Cluster;
    let subscriber2: Cluster;

    let publisher: Cluster;

    let messageTracker1: MessageTracker;
    let messageTracker2: MessageTracker;

    beforeEach(async () => {
      messageTracker1 = new MessageTracker(CHANNELS);
      messageTracker2 = new MessageTracker(CHANNELS);
      subscriber1 = createClusterTestClient(config.clientConfig);
      subscriber2 = createClusterTestClient(config.clientConfig);
      publisher = createClusterTestClient(config.clientConfig);
      await Promise.all([
        subscriber1.connect(),
        subscriber2.connect(),
        publisher.connect(),
      ]);
    });

    afterEach(async () => {
      await Promise.all([
        subscriber1.quit(),
        subscriber2.quit(),
        publisher.quit(),
      ]);
    });

    it("should receive messages published to multiple channels", async () => {
      for (const channel of CHANNELS) {
        await subscriber1.sSubscribe(channel, (_msg, channel) => { messageTracker1.incrementReceived(channel); });
        await subscriber2.sSubscribe(channel, (_msg, channel) => { messageTracker2.incrementReceived(channel); });
      }

      const { controller, result } =
        TestCommandRunner.publishMessagesUntilAbortSignal(
          publisher,
          CHANNELS,
          messageTracker1, // Use messageTracker1 for all publishing
        );

      // Wait for 10 seconds, while publishing messages
      await setTimeout(10_000);
      controller.abort();
      await result;

      for (const channel of CHANNELS) {
        assert.strictEqual(
          messageTracker1.getChannelStats(channel)?.received,
          messageTracker1.getChannelStats(channel)?.sent,
        );
        assert.strictEqual(
          messageTracker2.getChannelStats(channel)?.received,
          messageTracker1.getChannelStats(channel)?.sent,
        );
      }
    });

    it("should resume publishing and receiving after failover", async () => {
      for (const channel of CHANNELS) {
        await subscriber1.sSubscribe(channel, (_msg, channel) => { messageTracker1.incrementReceived(channel); });
        await subscriber2.sSubscribe(channel, (_msg, channel) => { messageTracker2.incrementReceived(channel); });
      }

      // Start publishing messages
      const { controller: publishAbort, result: publishResult } =
        TestCommandRunner.publishMessagesUntilAbortSignal(
          publisher,
          CHANNELS,
          messageTracker1, // Use messageTracker1 for all publishing
        );

      // Trigger failover during publishing
      const { action_id: failoverActionId } =
        await faultInjectorClient.triggerAction({
          type: "failover",
          parameters: {
            bdb_id: config.clientConfig.bdbId.toString(),
            cluster_index: 0,
          },
        });

      // Wait for failover to complete
      await faultInjectorClient.waitForAction(failoverActionId);

      publishAbort.abort();
      await publishResult;

      for (const channel of CHANNELS) {
        const sent = messageTracker1.getChannelStats(channel)!.sent;
        const received1 = messageTracker1.getChannelStats(channel)!.received;

        const received2 = messageTracker2.getChannelStats(channel)!.received;

        assert.ok(
          received1 <= sent,
          `Channel ${channel}: received (${received1}) should be <= sent (${sent})`,
        );
        assert.ok(
          received2 <= sent,
          `Channel ${channel}: received2 (${received2}) should be <= sent (${sent})`,
        );
      }

      // Wait for 2 seconds before resuming publishing
      await setTimeout(2_000);

      messageTracker1.reset();
      messageTracker2.reset();

      const {
        controller: afterFailoverController,
        result: afterFailoverResult,
      } = TestCommandRunner.publishMessagesUntilAbortSignal(
        publisher,
        CHANNELS,
        messageTracker1,
      );

      await setTimeout(10_000);
      afterFailoverController.abort();
      await afterFailoverResult;

      for (const channel of CHANNELS) {
        const sent = messageTracker1.getChannelStats(channel)!.sent;
        const received1 = messageTracker1.getChannelStats(channel)!.received;
        const received2 = messageTracker2.getChannelStats(channel)!.received;
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
          `Channel ${channel} received (${received1}) should equal sent (${sent}) once resumed after failover by subscriber 1`,
        );
        assert.strictEqual(
          received2,
          sent,
          `Channel ${channel} received (${received2}) should equal sent (${sent}) once resumed after failover by subscriber 2`,
        );
      }
    });
  });
});
