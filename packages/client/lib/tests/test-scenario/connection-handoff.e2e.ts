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
import { spy } from "sinon";
import assert from "node:assert";
import { TestCommandRunner } from "./test-command-runner";
import net from "node:net";

describe("Connection Handoff", () => {
  const diagnosticsLog: DiagnosticsEvent[] = [];

  const onMessageHandler = (message: unknown) => {
    diagnosticsLog.push(message as DiagnosticsEvent);
  };

  let clientConfig: RedisConnectionConfig;
  let client: ReturnType<typeof createClient<any, any, any, 3>>;
  let faultInjectorClient: FaultInjectorClient;
  let connectSpy = spy(net, "createConnection");

  before(() => {
    const envConfig = getEnvConfig();
    const redisConfig = getDatabaseConfigFromEnv(
      envConfig.redisEndpointsConfigPath,
    );

    faultInjectorClient = new FaultInjectorClient(envConfig.faultInjectorUrl);
    clientConfig = getDatabaseConfig(redisConfig);
  });

  beforeEach(async () => {
    diagnosticsLog.length = 0;
    diagnostics_channel.subscribe("redis.maintenance", onMessageHandler);

    connectSpy.resetHistory();

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
    await client.flushAll();
  });

  afterEach(() => {
    diagnostics_channel.unsubscribe("redis.maintenance", onMessageHandler);
    client.destroy();
  });

  describe("New Connection Establishment", () => {
    it("should establish new connection", async () => {
      assert.equal(connectSpy.callCount, 1);

      const { action_id: lowTimeoutBindAndMigrateActionId } =
        await faultInjectorClient.migrateAndBindAction({
          bdbId: clientConfig.bdbId,
          clusterIndex: 0,
        });

      const lowTimeoutWaitPromise = faultInjectorClient.waitForAction(
        lowTimeoutBindAndMigrateActionId,
      );

      await lowTimeoutWaitPromise;
      assert.equal(connectSpy.callCount, 2);
    });
  });

  describe("TLS Connection Handoff", () => {
    it("TODO receiveMessagesWithTLSEnabledTest", async () => {
      //
    });
    it("TODO connectionHandoffWithStaticInternalNameTest", async () => {
      //
    });
    it("TODO connectionHandoffWithStaticExternalNameTest", async () => {
      //
    });
  });

  describe("Traffic Resumption", () => {
    it("Traffic resumed after handoff", async () => {
      const { action_id } = await faultInjectorClient.migrateAndBindAction({
        bdbId: clientConfig.bdbId,
        clusterIndex: 0,
      });

      const workloadPromise = faultInjectorClient.waitForAction(action_id);

      const commandPromises =
        await TestCommandRunner.fireCommandsUntilStopSignal(
          client,
          workloadPromise,
        );

      const rejected = (
        await Promise.all(commandPromises.commandPromises)
      ).filter((result) => result.status === "rejected");

      assert.ok(rejected.length === 0);
    });
  });
});
