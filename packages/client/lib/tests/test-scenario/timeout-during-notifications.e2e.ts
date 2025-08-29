import assert from "node:assert";
import { setTimeout } from "node:timers/promises";
import { FaultInjectorClient } from "./fault-injector-client";
import {
  getDatabaseConfig,
  getDatabaseConfigFromEnv,
  getEnvConfig,
  RedisConnectionConfig,
} from "./test-scenario.util";
import { createClient } from "../../../dist";
import { before } from "mocha";
import { TestCommandRunner } from "./test-command-runner";

describe("Timeout Handling During Notifications", () => {
  let clientConfig: RedisConnectionConfig;
  let client: ReturnType<typeof createClient<any, any, any, 3>>;
  let faultInjectorClient: FaultInjectorClient;
  let commandRunner: TestCommandRunner;

  before(() => {
    const envConfig = getEnvConfig();
    const redisConfig = getDatabaseConfigFromEnv(
      envConfig.redisEndpointsConfigPath
    );

    faultInjectorClient = new FaultInjectorClient(envConfig.faultInjectorUrl);
    clientConfig = getDatabaseConfig(redisConfig);
  });

  beforeEach(async () => {
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
      maintMovingEndpointType: "auto",
    });

    client.on("error", (err: Error) => {
      throw new Error(`Client error: ${err.message}`);
    });

    commandRunner = new TestCommandRunner(client);

    await client.connect();
  });

  afterEach(() => {
    client.destroy();
  });

  it("should relax command timeout on MOVING, MIGRATING, and MIGRATED", async () => {
    // PART 1
    // Set very low timeout to trigger errors
    client.options!.maintRelaxedCommandTimeout = 50;

    const { action_id: lowTimeoutBindAndMigrateActionId } =
      await faultInjectorClient.migrateAndBindAction({
        bdbId: clientConfig.bdbId,
        clusterIndex: 0,
      });

    const lowTimeoutWaitPromise = faultInjectorClient.waitForAction(
      lowTimeoutBindAndMigrateActionId
    );

    const lowTimeoutCommandPromises =
      await commandRunner.fireCommandsUntilStopSignal(lowTimeoutWaitPromise);

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
    client.options!.maintRelaxedCommandTimeout = 10000;

    const { action_id: highTimeoutBindAndMigrateActionId } =
      await faultInjectorClient.migrateAndBindAction({
        bdbId: clientConfig.bdbId,
        clusterIndex: 0,
      });

    const highTimeoutWaitPromise = faultInjectorClient.waitForAction(
      highTimeoutBindAndMigrateActionId
    );

    const highTimeoutCommandPromises =
      await commandRunner.fireCommandsUntilStopSignal(highTimeoutWaitPromise);

    const highTimeoutRejectedCommands = (
      await Promise.all(highTimeoutCommandPromises.commandPromises)
    ).filter((result) => result.status === "rejected");

    assert.strictEqual(highTimeoutRejectedCommands.length, 0);
  });

  // TODO this is WIP
  it.skip("should unrelax command timeout after MAINTENANCE", async () => {
    client.options!.maintRelaxedCommandTimeout = 10000;
    client.options!.commandOptions = {
      ...client.options!.commandOptions,
      timeout: 1, // Set very low timeout to trigger errors
    };

    const { action_id: bindAndMigrateActionId } =
      await faultInjectorClient.migrateAndBindAction({
        bdbId: clientConfig.bdbId,
        clusterIndex: 0,
      });

    const lowTimeoutWaitPromise = faultInjectorClient.waitForAction(
      bindAndMigrateActionId
    );

    const relaxedTimeoutCommandPromises =
      await commandRunner.fireCommandsUntilStopSignal(lowTimeoutWaitPromise);

    const relaxedTimeoutRejectedCommands = (
      await Promise.all(relaxedTimeoutCommandPromises.commandPromises)
    ).filter((result) => result.status === "rejected");
    console.log(
      "relaxedTimeoutRejectedCommands",
      relaxedTimeoutRejectedCommands
    );

    assert.ok(relaxedTimeoutRejectedCommands.length === 0);

    const unrelaxedCommandPromises =
      await commandRunner.fireCommandsUntilStopSignal(setTimeout(1 * 1000));

    const unrelaxedRejectedCommands = (
      await Promise.all(unrelaxedCommandPromises.commandPromises)
    ).filter((result) => result.status === "rejected");

    assert.ok(unrelaxedRejectedCommands.length > 0);
  });
});
