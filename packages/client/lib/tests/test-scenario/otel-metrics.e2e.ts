import assert from "node:assert";
import {
  AggregationTemporality,
  InMemoryMetricExporter,
  MeterProvider,
  PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";
import {
  FaultInjectorClient,
  getCreateDatabaseConfig,
  CreateDatabaseConfigType,
  DatabaseConfig,
} from "@redis/test-utils/lib/fault-injector";

import { createClient, OpenTelemetry } from "@redis/client";
import { getEnvConfig } from "./test-scenario.util";

describe("OTel Metrics Scenario Tests", () => {
  let client: ReturnType<typeof createClient<any, any, any, any>>;
  let faultInjectorClient: FaultInjectorClient;
  let dbConfig: DatabaseConfig;
  let exporter: InMemoryMetricExporter;
  let meterProvider: MeterProvider;

  before(() => {
    const envConfig = getEnvConfig();
    faultInjectorClient = new FaultInjectorClient(envConfig.faultInjectorUrl);

    exporter = new InMemoryMetricExporter(AggregationTemporality.CUMULATIVE);
    meterProvider = new MeterProvider({
      readers: [
        new PeriodicExportingMetricReader({
          exporter,
          exportIntervalMillis: 10_000,
        }),
      ],
    });

    OpenTelemetry.init({
      metrics: {
        enabled: true,
        enabledMetricGroups: ["connection-basic", "resiliency"],
        meterProvider,
      },
    });
  });

  beforeEach(async function () {
    this.timeout(30000);

    const createDbConfig = getCreateDatabaseConfig(
      CreateDatabaseConfigType.STANDALONE,
      `otel-test-${Date.now()}`,
    );

    dbConfig =
      await faultInjectorClient.createAndSelectDatabase(createDbConfig);

    client = await createClient({
      socket: {
        host: dbConfig.host,
        port: dbConfig.port,
        ...(dbConfig.tls ? { tls: true } : {}),
      },
      password: dbConfig.password,
      username: dbConfig.username,
      RESP: 3,
      maintNotifications: "auto",
      maintEndpointType: "auto",
    }).connect();
  });

  afterEach(async function () {
    this.timeout(30000);
    client?.destroy();
    exporter.reset();
    if (dbConfig?.bdbId) {
      await faultInjectorClient.deleteDatabase(dbConfig.bdbId);
    }
  });

  it("should record maintenance-related metrics during migrate and bind", async function () {
    this.timeout(60000);

    // Keep these assertions in one test because OpenTelemetry is initialized as a singleton
    // for this suite, so running this scenario once avoids cross-test metric accumulation.
    await faultInjectorClient.migrateAndBindAction({
      bdbId: dbConfig.bdbId,
      clusterIndex: 0,
    });

    await meterProvider.forceFlush();
    const allMetrics = exporter.getMetrics();

    // PART 1: redis.client.maintenance.notifications
    const notificationsMetric = allMetrics
      .flatMap((rm) => rm.scopeMetrics)
      .flatMap((sm) => sm.metrics)
      // Make sure we get the latest metric data point
      .filter(
        (m) => m.descriptor.name === "redis.client.maintenance.notifications",
      )
      .at(-1);

    assert.ok(
      notificationsMetric,
      "expected redis.client.maintenance.notifications metric to be present",
    );
    assert.strictEqual(
      notificationsMetric.dataPoints.length,
      3,
      "expected exactly 3 data points for notifications",
    );
    for (const dataPoint of notificationsMetric.dataPoints) {
      assert.ok(
        dataPoint.attributes["redis.client.connection.notification"],
        `expected notification attribute to be present for data point: ${JSON.stringify(
          dataPoint,
        )}`,
      );
    }

    // PART 2: redis.client.connection.relaxed_timeout
    const relaxedTimeoutMetric = allMetrics
      .flatMap((rm) => rm.scopeMetrics)
      .flatMap((sm) => sm.metrics)
      // Make sure we get the latest metric data point
      .filter(
        (m) => m.descriptor.name === "redis.client.connection.relaxed_timeout",
      )
      .at(-1);

    assert.ok(
      relaxedTimeoutMetric,
      "expected redis.client.connection.relaxed_timeout metric to be present",
    );
    assert.ok(
      relaxedTimeoutMetric.dataPoints.length > 0,
      "expected at least one data point for relaxed timeout",
    );

    // PART 3: redis.client.connection.handoff
    const handoffMetric = allMetrics
      .flatMap((rm) => rm.scopeMetrics)
      .flatMap((sm) => sm.metrics)
      // Make sure we get the latest metric data point
      .filter((m) => m.descriptor.name === "redis.client.connection.handoff")
      .at(-1);

    assert.ok(
      handoffMetric,
      "expected redis.client.connection.handoff metric to be present",
    );
    assert.strictEqual(
      handoffMetric.dataPoints.length,
      1,
      "expected one data point for handoff",
    );
  });
});
