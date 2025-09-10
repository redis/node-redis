import { FaultInjectorClient } from "./fault-injector-client";
import {
  createTestClient,
  getDatabaseConfig,
  getDatabaseConfigFromEnv,
  getEnvConfig,
  RedisConnectionConfig,
} from "./test-scenario.util";
import { createClient } from "../../..";
import { before } from "mocha";
import { spy } from "sinon";
import assert from "node:assert";
import net from "node:net";

describe("Connection Handoff", () => {
  let clientConfig: RedisConnectionConfig;
  let client: ReturnType<typeof createClient<any, any, any, any>>;
  let faultInjectorClient: FaultInjectorClient;
  let connectSpy = spy(net, "createConnection");

  before(() => {
    const envConfig = getEnvConfig();
    const redisConfig = getDatabaseConfigFromEnv(
      envConfig.redisEndpointsConfigPath
    );

    faultInjectorClient = new FaultInjectorClient(envConfig.faultInjectorUrl);
    clientConfig = getDatabaseConfig(redisConfig);
  });

  beforeEach(async () => {
    connectSpy.resetHistory();

    client = await createTestClient(clientConfig);

    await client.flushAll();
  });

  afterEach(() => {
    if (client && client.isOpen) {
      client.destroy();
    }
  });

  describe("New Connection Establishment", () => {
    it("should establish new connection", async () => {
      assert.equal(connectSpy.callCount, 1);

      const { action_id: lowTimeoutBindAndMigrateActionId } =
        await faultInjectorClient.migrateAndBindAction({
          bdbId: clientConfig.bdbId,
          clusterIndex: 0,
        });

      await faultInjectorClient.waitForAction(lowTimeoutBindAndMigrateActionId);

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

      await faultInjectorClient.waitForAction(action_id);

      const currentTime = Date.now().toString();
      await client.set("key", currentTime);
      const result = await client.get("key");

      assert.strictEqual(result, currentTime);
    });
  });
});
