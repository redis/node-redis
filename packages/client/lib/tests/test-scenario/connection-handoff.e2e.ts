import { FaultInjectorClient } from "./fault-injector-client";
import {
  createTestClient,
  getDatabaseConfig,
  getDatabaseConfigFromEnv,
  getEnvConfig,
  RedisConnectionConfig,
} from "./test-scenario.util";
import { createClient, RedisClientOptions } from "../../..";
import { before } from "mocha";
import Sinon, { SinonSpy, spy, stub } from "sinon";
import assert from "node:assert";

/**
 * Creates a spy on a duplicated client method
 * @param client - The Redis client instance
 * @param funcName - The name of the method to spy on
 * @returns Object containing the promise that resolves with the spy and restore function
 */
const spyOnTemporaryClientInstanceMethod = (
  client: ReturnType<typeof createClient<any, any, any, any>>,
  methodName: string
) => {
  const { promise, resolve } = (
    Promise as typeof Promise & {
      withResolvers: () => {
        promise: Promise<{ spy: SinonSpy<any[], any>; restore: () => void }>;
        resolve: (value: any) => void;
      };
    }
  ).withResolvers();

  const originalDuplicate = client.duplicate.bind(client);

  const duplicateStub: Sinon.SinonStub<any[], any> = stub(
    // Temporary clients (in the context of hitless upgrade)
    // are created by calling the duplicate method on the client.
    Object.getPrototypeOf(client),
    "duplicate"
  ).callsFake((opts) => {
    const tmpClient = originalDuplicate(opts);
    resolve({
      spy: spy(tmpClient, methodName),
      restore: duplicateStub.restore,
    });

    return tmpClient;
  });

  return {
    getSpy: () => promise,
  };
};

describe("Connection Handoff", () => {
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

  afterEach(async () => {
    if (client && client.isOpen) {
      await client.flushAll();
      client.destroy();
    }
  });

  describe("New Connection Establishment & Traffic Resumption", () => {
    const cases: Array<{
      name: string;
      clientOptions: Partial<RedisClientOptions>;
    }> = [
      {
        name: "default options",
        clientOptions: {},
      },
      {
        name: "external-ip",
        clientOptions: {
          maintEndpointType: "external-ip",
        },
      },
      {
        name: "external-fqdn",
        clientOptions: {
          maintEndpointType: "external-fqdn",
        },
      },
      {
        name: "auto",
        clientOptions: {
          maintEndpointType: "auto",
        },
      },
      {
        name: "none",
        clientOptions: {
          maintEndpointType: "none",
        },
      },
    ];

    for (const { name, clientOptions } of cases) {
      it(`should establish new connection and resume traffic afterwards - ${name}`, async () => {
        client = await createTestClient(clientConfig, clientOptions);

        const spyObject = spyOnTemporaryClientInstanceMethod(client, "connect");

        // PART 1 Establish initial connection
        const { action_id: lowTimeoutBindAndMigrateActionId } =
          await faultInjectorClient.migrateAndBindAction({
            bdbId: clientConfig.bdbId,
            clusterIndex: 0,
          });

        await faultInjectorClient.waitForAction(
          lowTimeoutBindAndMigrateActionId
        );

        const spyResult = await spyObject.getSpy();

        assert.strictEqual(spyResult.spy.callCount, 1);

        // PART 2 Verify traffic resumption
        const currentTime = Date.now().toString();
        await client.set("key", currentTime);
        const result = await client.get("key");

        assert.strictEqual(result, currentTime);

        spyResult.restore();
      });
    }
  });

  describe("TLS Connection Handoff", () => {
    it.skip("TODO receiveMessagesWithTLSEnabledTest", async () => {
      //
    });
    it.skip("TODO connectionHandoffWithStaticInternalNameTest", async () => {
      //
    });
    it.skip("TODO connectionHandoffWithStaticExternalNameTest", async () => {
      //
    });
  });

  describe("Connection Cleanup", () => {
    it("should shut down old connection", async () => {
      client = await createTestClient(clientConfig);
      const spyObject = spyOnTemporaryClientInstanceMethod(client, "destroy");

      const { action_id: lowTimeoutBindAndMigrateActionId } =
        await faultInjectorClient.migrateAndBindAction({
          bdbId: clientConfig.bdbId,
          clusterIndex: 0,
        });

      await faultInjectorClient.waitForAction(lowTimeoutBindAndMigrateActionId);

      const spyResult = await spyObject.getSpy();

      assert.equal(spyResult.spy.callCount, 1);

      spyResult.restore();
    });
  });
});
