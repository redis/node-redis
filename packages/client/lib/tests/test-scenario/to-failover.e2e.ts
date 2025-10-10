import assert from "node:assert";

import { FaultInjectorClient } from "./fault-injector-client";
import {
  getDatabaseConfig,
  getDatabaseConfigFromEnv,
  getEnvConfig,
  RedisConnectionConfig,
  blockCommand,
  createTestClient,
} from "./test-scenario.util";
import { createClient } from "../../..";
import { before } from "mocha";
import diagnostics_channel from "node:diagnostics_channel";
import { DiagnosticsEvent } from "../../client/enterprise-maintenance-manager";

describe("Timeout Handling During Notifications", () => {
  let clientConfig: RedisConnectionConfig;
  let faultInjectorClient: FaultInjectorClient;
  let client: ReturnType<typeof createClient<any, any, any, any>>;

  const NORMAL_COMMAND_TIMEOUT = 50;
  const RELAXED_COMMAND_TIMEOUT = 2000;

  /**
   * Creates a handler for the `redis.maintenance` channel that will execute and block a command on the client
   * when a notification is received and save the result in the `result` object.
   * This is used to test that the command timeout is relaxed during notifications.
   */
  const createNotificationMessageHandler = (
    client: ReturnType<typeof createClient<any, any, any, any>>,
    result: Record<DiagnosticsEvent["type"], { error: any; duration: number }>,
    notifications: Array<DiagnosticsEvent["type"]>
  ) => {
    return (message: unknown) => {
      if (notifications.includes((message as DiagnosticsEvent).type)) {
        setImmediate(async () => {
          result[(message as DiagnosticsEvent).type] = await blockCommand(
            async () => {
              await client.set("key", "value");
            }
          );
        });
      }
    };
  };

  before(() => {
    const envConfig = getEnvConfig();
    const redisConfig = getDatabaseConfigFromEnv(
      envConfig.redisEndpointsConfigPath
    );

    clientConfig = getDatabaseConfig(redisConfig);
    faultInjectorClient = new FaultInjectorClient(envConfig.faultInjectorUrl);
  });

  beforeEach(async () => {
    client = await createTestClient(clientConfig, {
      commandOptions: { timeout: NORMAL_COMMAND_TIMEOUT },
      maintRelaxedCommandTimeout: RELAXED_COMMAND_TIMEOUT,
    });

    await client.flushAll();
  });

  afterEach(() => {
    if (client && client.isOpen) {
      client.destroy();
    }
  });

  it("should relax command timeout on FAILING_OVER", async () => {
    const notifications: Array<DiagnosticsEvent["type"]> = ["FAILING_OVER"];

    const result: Record<
      DiagnosticsEvent["type"],
      { error: any; duration: number }
    > = {};

    const onMessageHandler = createNotificationMessageHandler(
      client,
      result,
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

    diagnostics_channel.unsubscribe("redis.maintenance", onMessageHandler);

    notifications.forEach((notification) => {
      assert.ok(
        result[notification]?.error instanceof Error,
        `${notification} notification error should be instanceof Error`
      );
      assert.ok(
        result[notification]?.duration >= RELAXED_COMMAND_TIMEOUT &&
          result[notification]?.duration < RELAXED_COMMAND_TIMEOUT * 1.2,
        `${notification} notification should timeout within relaxed timeout`
      );
      assert.strictEqual(
        result[notification]?.error?.constructor?.name,
        "CommandTimeoutDuringMaintenanceError",
        `${notification} notification error should be CommandTimeoutDuringMaintenanceError`
      );
    });
  });

  it("should unrelax command timeout after FAILED_OVER", async () => {
    const { action_id: failoverActionId } =
      await faultInjectorClient.triggerAction({
        type: "failover",
        parameters: {
          bdb_id: clientConfig.bdbId.toString(),
          cluster_index: 0,
        },
      });

    await faultInjectorClient.waitForAction(failoverActionId);

    const { error, duration } = await blockCommand(async () => {
      await client.set("key", "value");
    });

    assert.ok(
      error instanceof Error,
      "Command Timeout error should be instanceof Error"
    );
    assert.ok(
      duration >= NORMAL_COMMAND_TIMEOUT &&
        duration < NORMAL_COMMAND_TIMEOUT * 1.2,
      `Normal command should timeout within normal timeout ms`
    );
    assert.strictEqual(
      error?.constructor?.name,
      "TimeoutError",
      "Command Timeout error should be TimeoutError"
    );
  });
});
