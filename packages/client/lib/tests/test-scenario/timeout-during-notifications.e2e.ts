import assert from "node:assert";

import { FaultInjectorClient } from "./fault-injector-client";
import {
  ClientFactory,
  getDatabaseConfig,
  getDatabaseConfigFromEnv,
  getEnvConfig,
  RedisConnectionConfig,
  blockSetImmediate
} from "./test-scenario.util";
import { createClient } from "../../..";
import { before } from "mocha";
import { TestCommandRunner } from "./test-command-runner";

describe("Timeout Handling During Notifications", () => {
  let clientConfig: RedisConnectionConfig;
  let clientFactory: ClientFactory;
  let faultInjectorClient: FaultInjectorClient;
  let defaultClient: ReturnType<typeof createClient<any, any, any, any>>;

  before(() => {
    const envConfig = getEnvConfig();
    const redisConfig = getDatabaseConfigFromEnv(
      envConfig.redisEndpointsConfigPath
    );

    clientConfig = getDatabaseConfig(redisConfig);
    faultInjectorClient = new FaultInjectorClient(envConfig.faultInjectorUrl);
    clientFactory = new ClientFactory(clientConfig);
  });

  beforeEach(async () => {
    defaultClient = await clientFactory.create("default");

    await defaultClient.flushAll();
  });

  afterEach(async () => {
    clientFactory.destroyAll();
  });

  it("should relax command timeout on MOVING, MIGRATING, and MIGRATED", async () => {
    // PART 1
    // Set very low timeout to trigger errors
    const lowTimeoutClient = await clientFactory.create("lowTimeout", {
      maintRelaxedCommandTimeout: 50,
    });

    const { action_id: lowTimeoutBindAndMigrateActionId } =
      await faultInjectorClient.migrateAndBindAction({
        bdbId: clientConfig.bdbId,
        clusterIndex: 0,
      });

    const lowTimeoutWaitPromise = faultInjectorClient.waitForAction(
      lowTimeoutBindAndMigrateActionId
    );

    const lowTimeoutCommandPromises =
      await TestCommandRunner.fireCommandsUntilStopSignal(
        lowTimeoutClient,
        lowTimeoutWaitPromise
      );

    const lowTimeoutRejectedCommands = (
      await Promise.all(lowTimeoutCommandPromises.commandPromises)
    ).filter((result) => result.status === "rejected");

    assert.ok(lowTimeoutRejectedCommands.length > 0);
    assert.strictEqual(
      lowTimeoutRejectedCommands.filter((rejected) => {
        return (
          // TODO instanceof doesn't work for some reason
          rejected.error.constructor.name ===
          "CommandTimeoutDuringMaintananceError"
        );
      }).length,
      lowTimeoutRejectedCommands.length
    );

    // PART 2
    // Set high timeout to avoid errors
    const highTimeoutClient = await clientFactory.create("highTimeout", {
      maintRelaxedCommandTimeout: 10000,
    });

    const { action_id: highTimeoutBindAndMigrateActionId } =
      await faultInjectorClient.migrateAndBindAction({
        bdbId: clientConfig.bdbId,
        clusterIndex: 0,
      });

    const highTimeoutWaitPromise = faultInjectorClient.waitForAction(
      highTimeoutBindAndMigrateActionId
    );

    const highTimeoutCommandPromises =
      await TestCommandRunner.fireCommandsUntilStopSignal(
        highTimeoutClient,
        highTimeoutWaitPromise
      );

    const highTimeoutRejectedCommands = (
      await Promise.all(highTimeoutCommandPromises.commandPromises)
    ).filter((result) => result.status === "rejected");

    assert.strictEqual(highTimeoutRejectedCommands.length, 0);
  });

  it("should unrelax command timeout after MAINTENANCE", async () => {
    const clientWithCommandTimeout = await clientFactory.create(
      "clientWithCommandTimeout",
      {
        commandOptions: {
          timeout: 100,
        },
      }
    );

    const { action_id: bindAndMigrateActionId } =
      await faultInjectorClient.migrateAndBindAction({
        bdbId: clientConfig.bdbId,
        clusterIndex: 0,
      });

    const lowTimeoutWaitPromise = faultInjectorClient.waitForAction(
      bindAndMigrateActionId
    );

    const relaxedTimeoutCommandPromises =
      await TestCommandRunner.fireCommandsUntilStopSignal(
        clientWithCommandTimeout,
        lowTimeoutWaitPromise
      );

    const relaxedTimeoutRejectedCommands = (
      await Promise.all(relaxedTimeoutCommandPromises.commandPromises)
    ).filter((result) => result.status === "rejected");

    assert.ok(relaxedTimeoutRejectedCommands.length === 0);

    const start = performance.now();

    let error: any;
    await blockSetImmediate(async () => {
      try {
        await clientWithCommandTimeout.set("key", "value");
      } catch (err: any) {
        error = err;
      }
    });

    // Make sure it took less than 1sec to fail
    assert.ok(performance.now() - start < 1000);
    assert.ok(error instanceof Error);
    assert.ok(error.constructor.name === "TimeoutError");
  });
});
