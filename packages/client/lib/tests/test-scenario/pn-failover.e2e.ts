import assert from "node:assert";
import diagnostics_channel from "node:diagnostics_channel";
import { FaultInjectorClient } from "./fault-injector-client";
import {
  createTestClient,
  getDatabaseConfig,
  getDatabaseConfigFromEnv,
  getEnvConfig,
  RedisConnectionConfig,
} from "./test-scenario.util";
import { createClient } from "../../..";
import { DiagnosticsEvent } from "../../client/enterprise-maintenance-manager";
import { before } from "mocha";

describe("Push Notifications", () => {
  const createNotificationMessageHandler = (
    result: Record<DiagnosticsEvent["type"], number>,
    notifications: Array<DiagnosticsEvent["type"]>
  ) => {
    return (message: unknown) => {
      if (notifications.includes((message as DiagnosticsEvent).type)) {
        const event = message as DiagnosticsEvent;
        result[event.type] = (result[event.type] ?? 0) + 1;
      }
    };
  };

  let onMessageHandler: ReturnType<typeof createNotificationMessageHandler>;
  let clientConfig: RedisConnectionConfig;
  let client: ReturnType<typeof createClient<any, any, any, any>>;
  let faultInjectorClient: FaultInjectorClient;

  before(() => {
    const envConfig = getEnvConfig();
    const redisConfig = getDatabaseConfigFromEnv(
      envConfig.redisEndpointsConfigPath
    );

    faultInjectorClient = new FaultInjectorClient(envConfig.faultInjectorUrl);
    clientConfig = getDatabaseConfig(redisConfig);
  });

  afterEach(() => {
    if (onMessageHandler!) {
      diagnostics_channel.unsubscribe("redis.maintenance", onMessageHandler);
    }

    if (client && client.isOpen) {
      client.destroy();
    }
  });

  describe("Push Notifications Enabled", () => {
    beforeEach(async () => {
      client = await createTestClient(clientConfig);

      await client.flushAll();
    });

    it("should receive FAILING_OVER and FAILED_OVER push notifications", async () => {
      const notifications: Array<DiagnosticsEvent["type"]> = [
        "FAILING_OVER",
        "FAILED_OVER",
      ];

      const diagnosticsMap: Record<DiagnosticsEvent["type"], number> = {};

      onMessageHandler = createNotificationMessageHandler(
        diagnosticsMap,
        notifications
      );

      diagnostics_channel.subscribe("redis.maintenance", onMessageHandler);

      const { action_id: failoverActionId } =
        await faultInjectorClient.triggerAction({
          type: "failover",
          parameters: {
            bdb_id: clientConfig.bdbId.toString(),
            cluster_index: 0,
          },
        });

      await faultInjectorClient.waitForAction(failoverActionId);

      assert.strictEqual(
        diagnosticsMap.FAILING_OVER,
        1,
        "Should have received exactly one FAILING_OVER notification"
      );
      assert.strictEqual(
        diagnosticsMap.FAILED_OVER,
        1,
        "Should have received exactly one FAILED_OVER notification"
      );
    });
  });

  describe("Push Notifications Disabled - Client", () => {
    beforeEach(async () => {
      client = await createTestClient(clientConfig, {
        maintNotifications: "disabled",
      });

      client.on("error", (_err) => {
        // Expect the socket to be closed
        // Ignore errors
      });

      await client.flushAll();
    });

    it("should NOT receive FAILING_OVER and FAILED_OVER push notifications", async () => {
      const notifications: Array<DiagnosticsEvent["type"]> = [
        "FAILING_OVER",
        "FAILED_OVER",
      ];

      const diagnosticsMap: Record<DiagnosticsEvent["type"], number> = {};

      onMessageHandler = createNotificationMessageHandler(
        diagnosticsMap,
        notifications
      );

      diagnostics_channel.subscribe("redis.maintenance", onMessageHandler);

      const { action_id: failoverActionId } =
        await faultInjectorClient.triggerAction({
          type: "failover",
          parameters: {
            bdb_id: clientConfig.bdbId.toString(),
            cluster_index: 0,
          },
        });

      await faultInjectorClient.waitForAction(failoverActionId);

      assert.strictEqual(
        diagnosticsMap.FAILING_OVER,
        undefined,
        "Should have received exactly one FAILING_OVER notification"
      );
      assert.strictEqual(
        diagnosticsMap.FAILED_OVER,
        undefined,
        "Should have received exactly one FAILED_OVER notification"
      );
    });
  });

  describe("Push Notifications Disabled - Server", () => {
    beforeEach(async () => {
      client = await createTestClient(clientConfig);

      client.on("error", (_err) => {
        // Expect the socket to be closed
        // Ignore errors
      });

      await client.flushAll();
    });

    before(async () => {
      const { action_id: disablePushNotificationsActionId } =
        await faultInjectorClient.triggerAction({
          type: "update_cluster_config",
          parameters: {
            config: { client_maint_notifications: false },
          },
        });

      await faultInjectorClient.waitForAction(disablePushNotificationsActionId);
    });

    after(async () => {
      const { action_id: enablePushNotificationsActionId } =
        await faultInjectorClient.triggerAction({
          type: "update_cluster_config",
          parameters: {
            config: { client_maint_notifications: true },
          },
        });

      await faultInjectorClient.waitForAction(enablePushNotificationsActionId);
    });

    it("should NOT receive FAILING_OVER and FAILED_OVER push notifications", async () => {
      const notifications: Array<DiagnosticsEvent["type"]> = [
        "FAILING_OVER",
        "FAILED_OVER",
      ];

      const diagnosticsMap: Record<DiagnosticsEvent["type"], number> = {};

      onMessageHandler = createNotificationMessageHandler(
        diagnosticsMap,
        notifications
      );

      diagnostics_channel.subscribe("redis.maintenance", onMessageHandler);

      const { action_id: failoverActionId } =
        await faultInjectorClient.triggerAction({
          type: "failover",
          parameters: {
            bdb_id: clientConfig.bdbId.toString(),
            cluster_index: 0,
          },
        });

      await faultInjectorClient.waitForAction(failoverActionId);

      assert.strictEqual(
        diagnosticsMap.FAILING_OVER,
        undefined,
        "Should have received exactly one FAILING_OVER notification"
      );
      assert.strictEqual(
        diagnosticsMap.FAILED_OVER,
        undefined,
        "Should have received exactly one FAILED_OVER notification"
      );
    });
  });
});
