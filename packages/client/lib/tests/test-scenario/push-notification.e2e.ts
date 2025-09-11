import assert from "node:assert";
import diagnostics_channel from "node:diagnostics_channel";
import { FaultInjectorClient } from "./fault-injector-client";
import {
  getDatabaseConfig,
  getDatabaseConfigFromEnv,
  getEnvConfig,
  RedisConnectionConfig,
} from "./test-scenario.util";
import { createClient } from "../../..";
import { DiagnosticsEvent } from "../../client/enterprise-maintenance-manager";
import { before } from "mocha";

describe("Push Notifications", () => {
  const diagnosticsLog: DiagnosticsEvent[] = [];

  const onMessageHandler = (message: unknown) => {
    diagnosticsLog.push(message as DiagnosticsEvent);
  };

  let clientConfig: RedisConnectionConfig;
  let client: ReturnType<typeof createClient<any, any, any, 3>>;
  let faultInjectorClient: FaultInjectorClient;

  before(() => {
    const envConfig = getEnvConfig();
    const redisConfig = getDatabaseConfigFromEnv(
      envConfig.redisEndpointsConfigPath
    );

    faultInjectorClient = new FaultInjectorClient(envConfig.faultInjectorUrl);
    clientConfig = getDatabaseConfig(redisConfig);
  });

  beforeEach(async () => {
    diagnosticsLog.length = 0;
    diagnostics_channel.subscribe("redis.maintenance", onMessageHandler);

    client = createClient({
      socket: {
        host: clientConfig.host,
        port: clientConfig.port,
        ...(clientConfig.tls === true ? { tls: true } : {}),
      },
      password: clientConfig.password,
      username: clientConfig.username,
      RESP: 3,
      maintPushNotifications: "auto",
      maintMovingEndpointType: "external-ip",
      maintRelaxedCommandTimeout: 10000,
      maintRelaxedSocketTimeout: 10000,
    });

    client.on("error", (err: Error) => {
      throw new Error(`Client error: ${err.message}`);
    });

    await client.connect();
  });

  afterEach(() => {
    diagnostics_channel.unsubscribe("redis.maintenance", onMessageHandler);
    client.destroy();
  });

  it("should receive MOVING, MIGRATING, and MIGRATED push notifications", async () => {
    const { action_id: migrateActionId } =
      await faultInjectorClient.triggerAction<{ action_id: string }>({
        type: "migrate",
        parameters: {
          cluster_index: "0",
        },
      });

    await faultInjectorClient.waitForAction(migrateActionId);

    const { action_id: bindActionId } =
      await faultInjectorClient.triggerAction<{ action_id: string }>({
        type: "bind",
        parameters: {
          cluster_index: "0",
          bdb_id: `${clientConfig.bdbId}`,
        },
      });

    await faultInjectorClient.waitForAction(bindActionId);

    const pushNotificationLogs = diagnosticsLog.filter((log) => {
      return ["MOVING", "MIGRATING", "MIGRATED"].includes(log?.type);
    });

    assert.strictEqual(pushNotificationLogs.length, 3);
  });
});
