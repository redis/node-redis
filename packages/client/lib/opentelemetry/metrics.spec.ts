import { strict as assert } from "node:assert";

import * as api from "@opentelemetry/api";
import { Counter, ObservableGauge } from "@opentelemetry/api";
import {
  AggregationTemporality,
  DataPoint,
  Histogram,
  InMemoryMetricExporter,
  MeterProvider,
  PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";
import { spy } from "sinon";

import { OTelMetrics } from "./metrics";
import {
  CONNECTION_CLOSE_REASON,
  CSC_EVICTION_REASON,
  CSC_RESULT,
  ERROR_CATEGORY,
  METRIC_NAMES,
  ObservabilityConfig,
  OTEL_ATTRIBUTES,
} from "./types";
import { NOOP_COUNTER_METRIC } from "./noop-meter";
import { noopFunction } from "./utils";
import testUtils, { GLOBAL } from "../test-utils";
import { ClientRegistry } from "./client-registry";
import { ClientRole } from "../client/identity";
import { getMetricDataPoints, waitForMetrics } from "./utils/test.util";

describe("OTel Metrics Unit Tests", () => {
  afterEach(async () => {
    OTelMetrics.reset();
  });

  it("should init only once", () => {
    OTelMetrics.init({
      api: undefined,
      config: undefined,
    });

    assert.throws(() => {
      OTelMetrics.init({
        api: undefined,
        config: undefined,
      });
    });
  });

  it("should be noop if not initialized", () => {
    const addSpy = spy(NOOP_COUNTER_METRIC, "add");

    OTelMetrics.instance.resiliencyMetrics.recordClientErrors(
      new Error("Test error"),
      true,
    );

    assert.equal(addSpy.callCount, 1);

    addSpy.restore();
  });

  it("should create instance with noop meter when API is null", () => {
    const config: ObservabilityConfig = {
      metrics: {
        enabled: true,
      },
    };

    const addSpy = spy(NOOP_COUNTER_METRIC, "add");

    OTelMetrics.init({ api: undefined, config });

    OTelMetrics.instance.resiliencyMetrics.recordClientErrors(
      new Error("Test error"),
      true,
    );

    assert.equal(addSpy.callCount, 1);

    addSpy.restore();
  });

  it("should create instance with noop meter when metrics are disabled", () => {
    const config: ObservabilityConfig = {
      metrics: {
        enabled: false,
      },
    };

    const addSpy = spy(NOOP_COUNTER_METRIC, "add");

    OTelMetrics.init({ api: undefined, config });

    OTelMetrics.instance.resiliencyMetrics.recordClientErrors(
      new Error("Test error"),
      true,
    );

    assert.equal(addSpy.callCount, 1);

    addSpy.restore();
  });

  it("should not record excluded commands", () => {
    const config: ObservabilityConfig = {
      metrics: {
        enabledMetricGroups: ["command"],
        enabled: true,
        excludeCommands: ["GET"],
      },
    };

    OTelMetrics.init({ api: undefined, config });

    const recordGET =
      OTelMetrics.instance.commandMetrics.createRecordOperationDuration(
        ["GET", "key"],
        "test-client",
      );

    assert.strictEqual(
      recordGET,
      noopFunction,
      "expect record to be noop function",
    );

    const recordSET =
      OTelMetrics.instance.commandMetrics.createRecordOperationDuration(
        ["SET", "key"],
        "test-client",
      );

    assert.notStrictEqual(
      recordSET,
      noopFunction,
      "expect record to not be noop function",
    );
  });

  it("should only record included commands", () => {
    const config: ObservabilityConfig = {
      metrics: {
        enabledMetricGroups: ["command"],
        enabled: true,
        includeCommands: ["SET"],
      },
    };

    OTelMetrics.init({ api: undefined, config });

    const recordGET =
      OTelMetrics.instance.commandMetrics.createRecordOperationDuration(
        ["GET", "key"],
        "test-client",
      );

    assert.strictEqual(
      recordGET,
      noopFunction,
      "expect record to be noop function",
    );

    const recordSET =
      OTelMetrics.instance.commandMetrics.createRecordOperationDuration(
        ["SET", "key"],
        "test-client",
      );

    assert.notStrictEqual(
      recordSET,
      noopFunction,
      "expect record to not be noop function",
    );
  });
});

describe("OTel Metrics E2E", function () {
  let exporter: InMemoryMetricExporter;
  let meterProvider: MeterProvider;
  let reader: PeriodicExportingMetricReader;

  this.timeout(5000);

  beforeEach(function () {
    // Initialize ClientRegistry before any client is created
    // This is important because observable gauges read from the registry
    ClientRegistry.init();

    exporter = new InMemoryMetricExporter(AggregationTemporality.CUMULATIVE);
    reader = new PeriodicExportingMetricReader({
      exporter,
    });
    meterProvider = new MeterProvider({
      readers: [reader],
    });
  });

  afterEach(async function () {
    OTelMetrics.reset();
    ClientRegistry.reset();

    // Disable global meter provider
    api.metrics.disable();

    // Drain anything pending, then shut everything down
    await reader.collect().catch(() => {});
    await meterProvider.shutdown().catch(() => {});
  });

  it("should work with injected meter provider", async () => {
    const config: ObservabilityConfig = {
      metrics: {
        enabled: true,
        meterProvider,
      },
    };

    OTelMetrics.init({ api, config });

    OTelMetrics.instance.resiliencyMetrics.recordClientErrors(
      new Error("Test error 1"),
      true,
    );
    OTelMetrics.instance.resiliencyMetrics.recordClientErrors(
      new Error("Test error 2"),
      true,
    );
    OTelMetrics.instance.resiliencyMetrics.recordClientErrors(
      new Error("Test error 3"),
      true,
    );

    await meterProvider.forceFlush();

    const resourceMetrics = exporter.getMetrics();

    const metric = resourceMetrics
      .flatMap((rm) => rm.scopeMetrics)
      .flatMap((sm) => sm.metrics)
      .find((m) => m.descriptor.name === "redis.client.errors");

    assert.ok(metric, "expected redis.client.errors metric to be present");
    assert.strictEqual(metric.dataPoints?.[0].value, 3);
  });

  it("should use global meter provider from api.metrics", async () => {
    // Register the test's meter provider as the global one
    api.metrics.setGlobalMeterProvider(meterProvider);

    const config: ObservabilityConfig = {
      metrics: {
        enabled: true,
        // No meterProvider
      },
    };

    OTelMetrics.init({ api, config });

    OTelMetrics.instance.resiliencyMetrics.recordClientErrors(
      new Error("Test error 1"),
      true,
    );
    OTelMetrics.instance.resiliencyMetrics.recordClientErrors(
      new Error("Test error 2"),
      true,
    );

    await meterProvider.forceFlush();

    const resourceMetrics = exporter.getMetrics();

    const metric = resourceMetrics
      .flatMap((rm) => rm.scopeMetrics)
      .flatMap((sm) => sm.metrics)
      .find((m) => m.descriptor.name === "redis.client.errors");

    assert.ok(metric, "expected redis.client.errors metric to be present");
    assert.strictEqual(metric.dataPoints?.[0].value, 2);
  });

  it("should resolve client attributes by clientId", async () => {
    OTelMetrics.init({
      api,
      config: {
        metrics: {
          enabled: true,
          meterProvider,
        },
      },
    });

    ClientRegistry.instance.register({
      identity: { id: "client-1", role: ClientRole.STANDALONE },
      getAttributes: () => ({
        host: "127.0.0.1",
        port: 6379,
        db: 0,
        clientId: "client-1",
      }),
      getPendingRequests: () => 0,
      getCacheItemCount: () => 0,
      isConnected: () => true,
    });

    OTelMetrics.instance.resiliencyMetrics.recordClientErrors(
      new Error("Test error"),
      true,
      "client-1",
    );

    await meterProvider.forceFlush();

    const resourceMetrics = exporter.getMetrics();
    const metric = resourceMetrics
      .flatMap((rm) => rm.scopeMetrics)
      .flatMap((sm) => sm.metrics)
      .find((m) => m.descriptor.name === METRIC_NAMES.redisClientErrors);

    assert.ok(metric, "expected redis.client.errors metric to be present");
    const point = metric.dataPoints?.[0];
    assert.ok(point, "expected data point to be present");
    assert.strictEqual(
      point.attributes[OTEL_ATTRIBUTES.serverAddress],
      "127.0.0.1",
    );
    assert.strictEqual(point.attributes[OTEL_ATTRIBUTES.serverPort], "6379");
    assert.strictEqual(point.attributes[OTEL_ATTRIBUTES.dbNamespace], "0");
  });

  it("should emit metric when clientId lookup misses", async () => {
    OTelMetrics.init({
      api,
      config: {
        metrics: {
          enabled: true,
          meterProvider,
        },
      },
    });

    OTelMetrics.instance.resiliencyMetrics.recordClientErrors(
      new Error("Test error"),
      true,
      "missing-client",
    );

    await meterProvider.forceFlush();

    const resourceMetrics = exporter.getMetrics();
    const metric = resourceMetrics
      .flatMap((rm) => rm.scopeMetrics)
      .flatMap((sm) => sm.metrics)
      .find((m) => m.descriptor.name === METRIC_NAMES.redisClientErrors);

    assert.ok(metric, "expected redis.client.errors metric to be present");
    const point = metric.dataPoints?.[0];
    assert.ok(point, "expected data point to be present");
    assert.strictEqual(point.value, 1);
    assert.strictEqual(
      point.attributes[OTEL_ATTRIBUTES.serverAddress],
      undefined,
    );
    assert.strictEqual(point.attributes[OTEL_ATTRIBUTES.serverPort], undefined);
    assert.strictEqual(
      point.attributes[OTEL_ATTRIBUTES.dbNamespace],
      undefined,
    );
  });

  describe("Resiliency metrics", () => {
    beforeEach(() => {
      OTelMetrics.init({
        api,
        config: {
          metrics: {
            enabled: true,
            meterProvider,
          },
        },
      });
    });

    testUtils.testAll(
      "should record redis.client.errors",
      async (client) => {
        await client.hSet("key", "field", "value");
        await assert.rejects(client.incr("key"));

        await meterProvider.forceFlush();

        const resourceMetrics = exporter.getMetrics();
        const metricDataPoints = getMetricDataPoints(
          resourceMetrics,
          METRIC_NAMES.redisClientErrors,
        );

        const { value, attributes } = metricDataPoints[0];

        assert.strictEqual(value, 1);
        assert.ok(OTEL_ATTRIBUTES.dbNamespace in attributes);
        assert.ok(attributes[OTEL_ATTRIBUTES.redisClientLibrary]);
        assert.ok(attributes[OTEL_ATTRIBUTES.dbSystemName]);
        assert.ok(attributes[OTEL_ATTRIBUTES.serverAddress]);
        assert.ok(attributes[OTEL_ATTRIBUTES.serverPort]);
        assert.strictEqual(
          attributes[OTEL_ATTRIBUTES.errorType],
          "SimpleError",
        );
        assert.strictEqual(
          attributes[OTEL_ATTRIBUTES.redisClientErrorsCategory],
          ERROR_CATEGORY.SERVER,
        );
        assert.strictEqual(
          attributes[OTEL_ATTRIBUTES.dbResponseStatusCode],
          "WRONGTYPE",
        );
        assert.strictEqual(
          attributes[OTEL_ATTRIBUTES.redisClientErrorsInternal],
          false,
        );
      },
      {
        client: GLOBAL.SERVERS.OPEN,
        cluster: GLOBAL.CLUSTERS.OPEN,
      },
    );

    // TODO add tests for hitless upgrades
    // TODO possibly it would be better to add them to the hitless e2e tests
  });

  describe("Connection metrics", () => {
    beforeEach(() => {
      OTelMetrics.init({
        api,
        config: {
          metrics: {
            enabled: true,
            meterProvider,
          },
        },
      });
    });

    testUtils.testAll(
      "should record db.client.connection.count",
      async (client) => {
        try {
          await client.connect();

          // Make sure cluster clients are created and connected
          await client.ping();

          await meterProvider.forceFlush();

          const resourceMetrics = exporter.getMetrics();
          const metricDataPoints = getMetricDataPoints(
            resourceMetrics,
            METRIC_NAMES.dbClientConnectionCount,
          );

          const { value, attributes } = metricDataPoints[0];

          // Cluster clients should have different ids in the attributes so this should be 1
          assert.strictEqual(value, 1);

          assert.ok(attributes[OTEL_ATTRIBUTES.dbClientConnectionState]);
          assert.strictEqual(
            attributes[OTEL_ATTRIBUTES.redisClientConnectionPubsub],
            false,
          );
          assert.ok(attributes[OTEL_ATTRIBUTES.dbClientConnectionPoolName]);
          assert.ok(attributes[OTEL_ATTRIBUTES.dbNamespace]);
          assert.ok(attributes[OTEL_ATTRIBUTES.serverAddress]);
          assert.ok(attributes[OTEL_ATTRIBUTES.serverPort]);
          assert.ok(attributes[OTEL_ATTRIBUTES.redisClientLibrary]);
          assert.ok(attributes[OTEL_ATTRIBUTES.dbSystemName]);
        } catch (error) {
          throw error;
        } finally {
          await client.destroy();
        }
      },
      {
        client: {
          ...GLOBAL.SERVERS.OPEN,
          disableClientSetup: true,
        },
        cluster: {
          ...GLOBAL.CLUSTERS.OPEN,
          disableClusterSetup: true,
        },
      },
    );

    testUtils.testAll(
      "should record db.client.connection.create_time",
      async (client) => {
        try {
          await client.connect();

          await meterProvider.forceFlush();

          const resourceMetrics = exporter.getMetrics();
          const metricDataPoints = getMetricDataPoints(
            resourceMetrics,
            METRIC_NAMES.dbClientConnectionCreateTime,
          );

          const { value, attributes } =
            metricDataPoints[0] as DataPoint<Histogram>;

          assert.strictEqual(value.count, 1);
          assert.ok(attributes[OTEL_ATTRIBUTES.dbClientConnectionPoolName]);
          assert.ok(attributes[OTEL_ATTRIBUTES.redisClientLibrary]);
          assert.ok(attributes[OTEL_ATTRIBUTES.dbSystemName]);
        } catch (error) {
          throw error;
        } finally {
          await client.destroy();
        }
      },
      {
        client: {
          ...GLOBAL.SERVERS.OPEN,
          disableClientSetup: true,
        },
        cluster: {
          ...GLOBAL.CLUSTERS.OPEN,
          disableClusterSetup: true,
        },
      },
    );

    // TODO add tests for hitless upgrades
    // TODO possibly it would be better to add them to the hitless e2e tests
  });

  describe("Command metrics", () => {
    beforeEach(() => {
      OTelMetrics.init({
        api,
        config: {
          metrics: {
            enabledMetricGroups: ["command"],
            enabled: true,
            meterProvider,
          },
        },
      });
    });

    testUtils.testAll(
      "should record db.client.operation.duration",
      async (client) => {
        await Promise.all([
          client.set("key", "value"),
          client.set("key", "value"),
          client.set("key", "value"),
        ]);

        await meterProvider.forceFlush();

        const resourceMetrics = exporter.getMetrics();

        const dataPoints = getMetricDataPoints<Histogram>(
          resourceMetrics,
          METRIC_NAMES.dbClientOperationDuration,
        );

        const setDataPoint = dataPoints.find(
          (dp) => dp.attributes[OTEL_ATTRIBUTES.dbOperationName] === "SET",
        );

        assert.ok(setDataPoint, "expected SET data point to be present");

        const { value, attributes } = setDataPoint;

        assert.strictEqual(value.count, 3);
        assert.strictEqual(attributes[OTEL_ATTRIBUTES.dbOperationName], "SET");
        assert.ok(OTEL_ATTRIBUTES.dbNamespace in attributes);
        assert.ok(attributes[OTEL_ATTRIBUTES.serverAddress]);
        assert.ok(attributes[OTEL_ATTRIBUTES.serverPort]);
        assert.ok(attributes[OTEL_ATTRIBUTES.redisClientLibrary]);
        assert.ok(attributes[OTEL_ATTRIBUTES.dbSystemName]);
      },
      {
        client: GLOBAL.SERVERS.OPEN,
        cluster: GLOBAL.CLUSTERS.OPEN,
      },
    );

    testUtils.testAll(
      "should record db.client.operation.duration with errors",
      async (client) => {
        await client.hSet("key", "field", "value");
        await assert.rejects(client.incr("key"));

        await meterProvider.forceFlush();

        const resourceMetrics = exporter.getMetrics();
        const operationDataPoints = getMetricDataPoints<Histogram>(
          resourceMetrics,
          METRIC_NAMES.dbClientOperationDuration,
        );

        const incrDataPoint = operationDataPoints.find(
          (dataPoint) =>
            dataPoint.attributes[OTEL_ATTRIBUTES.dbOperationName] === "INCR",
        );

        assert.ok(
          incrDataPoint,
          "expected INCR error data point to be present",
        );

        const { attributes } = incrDataPoint as DataPoint<Histogram>;

        assert.strictEqual(
          attributes[OTEL_ATTRIBUTES.errorType],
          "SimpleError",
        );
        assert.strictEqual(
          attributes[OTEL_ATTRIBUTES.redisClientErrorsCategory],
          ERROR_CATEGORY.SERVER,
        );
        assert.strictEqual(
          attributes[OTEL_ATTRIBUTES.dbResponseStatusCode],
          "WRONGTYPE",
        );
      },
      {
        client: GLOBAL.SERVERS.OPEN,
        cluster: GLOBAL.CLUSTERS.OPEN,
      },
    );
  });

  describe("Connection Advanced metrics", () => {
    beforeEach(() => {
      OTelMetrics.init({
        api,
        config: {
          metrics: {
            enabled: true,
            meterProvider,
            enabledMetricGroups: ["connection-advanced"],
          },
        },
      });
    });

    testUtils.testAll(
      "should record db.client.connection.pending_requests",
      async (client) => {
        // For standalone client, observable gauges emit with value 0 before any command.
        // For cluster with minimizeConnections: true, no clients are created until a command is sent,
        // so the metric may not exist yet. We check this after the command is sent.

        // Clear the exporter so we get fresh metrics after the blocking command
        exporter.reset();

        // Start a blocking command - this will be pending
        const blockingPromise = client.blPop("key${tag}", 1);

        // Give a small delay to ensure the command has been sent and connection established
        await new Promise((resolve) => setTimeout(resolve, 100));

        const metric = await waitForMetrics(
          meterProvider,
          exporter,
          METRIC_NAMES.dbClientConnectionPendingRequests,
        );

        assert.ok(metric, "expected pending requests metric to be present");
        assert.strictEqual(
          metric.dataPoints[0].value,
          1,
          "expected 1 pending request while blocking command is in flight",
        );

        const { attributes } = metric.dataPoints[0];

        assert.ok(attributes[OTEL_ATTRIBUTES.dbSystemName]);
        assert.ok(attributes[OTEL_ATTRIBUTES.redisClientLibrary]);
        assert.ok(attributes[OTEL_ATTRIBUTES.dbClientConnectionPoolName]);
        assert.ok(attributes[OTEL_ATTRIBUTES.serverAddress]);
        assert.ok(attributes[OTEL_ATTRIBUTES.serverPort]);
        assert.ok(OTEL_ATTRIBUTES.dbNamespace in attributes);

        await blockingPromise;
      },
      {
        client: GLOBAL.SERVERS.OPEN,
        cluster: GLOBAL.CLUSTERS.OPEN,
      },
    );

    testUtils.testWithClientPool(
      "should record db.client.connection.wait_time",
      async (pool) => {
        exporter.reset();

        await pool.ping();

        await meterProvider.forceFlush();

        const resourceMetrics = exporter.getMetrics();
        const metricDataPoints = getMetricDataPoints<Histogram>(
          resourceMetrics,
          METRIC_NAMES.dbClientConnectionWaitTime,
        );

        const { value, attributes } =
          metricDataPoints[0] as DataPoint<Histogram>;

        assert.ok(
          value,
          "expected db.client.connection.wait_time data point to be present",
        );
        assert.ok(
          value.count >= 1,
          "expected wait time metric count to be at least 1",
        );
        assert.ok(attributes[OTEL_ATTRIBUTES.redisClientLibrary]);
        assert.ok(attributes[OTEL_ATTRIBUTES.dbSystemName]);
        assert.ok(attributes[OTEL_ATTRIBUTES.serverAddress]);
        assert.ok(attributes[OTEL_ATTRIBUTES.serverPort]);
        assert.ok(OTEL_ATTRIBUTES.dbNamespace in attributes);
        assert.ok(attributes[OTEL_ATTRIBUTES.dbClientConnectionPoolName]);
      },
      {
        ...GLOBAL.SERVERS.OPEN,
      },
    );

    testUtils.testAll(
      "should record redis.client.connection.closed",
      async (client) => {
        // Send a command to ensure the client is connected
        await client.ping();
        exporter.reset();

        client.destroy();

        const metric = await waitForMetrics(
          meterProvider,
          exporter,
          METRIC_NAMES.redisClientConnectionClosed,
        );

        assert.ok(
          metric,
          "expected redis.client.connection.closed metric to be present",
        );

        const closedDataPoint = metric.dataPoints.find(
          (dataPoint) =>
            dataPoint.attributes[
              OTEL_ATTRIBUTES.redisClientConnectionCloseReason
            ] === CONNECTION_CLOSE_REASON.APPLICATION_CLOSE,
        );

        assert.ok(
          closedDataPoint,
          "expected application_close data point to be present",
        );
        assert.ok(
          Number(closedDataPoint.value) >= 1,
          "expected at least one closed connection",
        );
        assert.ok(
          closedDataPoint.attributes[OTEL_ATTRIBUTES.redisClientLibrary],
        );
        assert.ok(closedDataPoint.attributes[OTEL_ATTRIBUTES.dbSystemName]);
        assert.ok(
          closedDataPoint.attributes[
            OTEL_ATTRIBUTES.dbClientConnectionPoolName
          ],
        );
      },
      {
        client: GLOBAL.SERVERS.OPEN,
        cluster: GLOBAL.CLUSTERS.OPEN,
      },
    );
  });

  describe("Client Side Cache metrics", () => {
    beforeEach(() => {
      OTelMetrics.init({
        api,
        config: {
          metrics: {
            enabled: true,
            meterProvider,
            enabledMetricGroups: ["client-side-caching"],
          },
        },
      });
    });

    testUtils.testAll(
      "should record redis.client.csc.requests",
      async (client) => {
        // Ensure a client handle exists in the registry for both standalone and cluster.
        await client.ping();

        await client.set("key", "value");
        await client.get("key");

        await meterProvider.forceFlush();

        const resourceMetrics = exporter.getMetrics();
        const dataPoints = getMetricDataPoints<Counter>(
          resourceMetrics,
          METRIC_NAMES.redisClientCscRequests,
        );

        assert.ok(
          dataPoints.length > 0,
          "expected redis.client.csc.requests metric to be present",
        );

        const { value, attributes } = dataPoints[0] as DataPoint<Counter>;

        assert.strictEqual(value, 1);
        assert.ok(attributes[OTEL_ATTRIBUTES.redisClientLibrary]);
        assert.ok(attributes[OTEL_ATTRIBUTES.dbSystemName]);
        assert.ok(attributes[OTEL_ATTRIBUTES.serverAddress]);
        assert.ok(attributes[OTEL_ATTRIBUTES.serverPort]);
        assert.ok(attributes[OTEL_ATTRIBUTES.dbClientConnectionPoolName]);
        assert.strictEqual(
          attributes[OTEL_ATTRIBUTES.redisClientCscResult],
          CSC_RESULT.MISS,
        );
      },
      {
        client: {
          ...GLOBAL.SERVERS.OPEN,
          clientOptions: {
            RESP: 3,
            clientSideCache: {
              ttl: 1000,
              maxEntries: 100,
            },
          },
        },
        cluster: {
          ...GLOBAL.CLUSTERS.OPEN,
          clusterConfiguration: {
            RESP: 3,
            clientSideCache: {
              ttl: 1000,
              maxEntries: 100,
            },
          },
        },
      },
    );

    testUtils.testAll(
      "should record redis.client.csc.items",
      async (client) => {
        // Ensure client is registered for observable gauge callback.
        await client.ping();
        await client.set("key", "value");
        await client.get("key");

        const metric = await waitForMetrics(
          meterProvider,
          exporter,
          METRIC_NAMES.redisClientCscItems,
        );

        assert.ok(
          metric,
          "expected redis.client.csc.items metric to be present",
        );

        const itemDataPoint = (
          metric.dataPoints as unknown as DataPoint<ObservableGauge>[]
        ).find((dp) => Number(dp.value) >= 1);

        assert.ok(
          itemDataPoint,
          "expected redis.client.csc.items to report at least one cached item",
        );

        const { attributes } = itemDataPoint as DataPoint<ObservableGauge>;
        assert.ok(attributes[OTEL_ATTRIBUTES.redisClientLibrary]);
        assert.strictEqual(attributes[OTEL_ATTRIBUTES.dbSystemName], "redis");
        assert.ok(attributes[OTEL_ATTRIBUTES.dbClientConnectionPoolName]);
      },
      {
        client: {
          ...GLOBAL.SERVERS.OPEN,
          clientOptions: {
            RESP: 3,
            clientSideCache: {
              ttl: 1000,
              maxEntries: 100,
            },
          },
        },
        cluster: {
          ...GLOBAL.CLUSTERS.OPEN,
          clusterConfiguration: {
            RESP: 3,
            clientSideCache: {
              ttl: 1000,
              maxEntries: 100,
            },
          },
        },
      },
    );

    testUtils.testAll(
      "should record redis.client.csc.evictions with full and invalidation reasons",
      async (client) => {
        await client.ping();

        // Fill cache entry for key1.
        await client.set("key1", "value1");
        await client.get("key1");

        // Caching key2 with maxEntries=1 should evict key1 due to capacity (full).
        await client.set("key2", "value2");
        await client.get("key2");

        // Mutating key2 should invalidate the cached entry from server tracking.
        await client.set("key2", "value3");

        const metric = await waitForMetrics(
          meterProvider,
          exporter,
          METRIC_NAMES.redisClientCscEvictions,
        );

        assert.ok(
          metric,
          "expected redis.client.csc.evictions metric to be present",
        );
        assert.strictEqual(metric.descriptor.unit, "{eviction}");

        const dataPoints = metric.dataPoints as unknown as DataPoint<Counter>[];

        const fullEviction = dataPoints.find(
          (dp) =>
            dp.attributes[OTEL_ATTRIBUTES.redisClientCscReason] ===
            CSC_EVICTION_REASON.FULL,
        );
        assert.ok(
          fullEviction,
          "expected full eviction data point to be present",
        );
        assert.ok(
          Number((fullEviction as DataPoint<Counter>).value) >= 1,
          "expected full eviction count to be at least 1",
        );
        assert.ok(
          (fullEviction as DataPoint<Counter>).attributes[
            OTEL_ATTRIBUTES.redisClientLibrary
          ],
        );
        assert.strictEqual(
          (fullEviction as DataPoint<Counter>).attributes[
            OTEL_ATTRIBUTES.dbSystemName
          ],
          "redis",
        );

        const invalidationEviction = dataPoints.find(
          (dp) =>
            dp.attributes[OTEL_ATTRIBUTES.redisClientCscReason] ===
            "invalidation",
        );
        assert.ok(
          invalidationEviction,
          "expected invalidation eviction data point to be present",
        );
        assert.ok(
          Number((invalidationEviction as DataPoint<Counter>).value) >= 1,
          "expected invalidation eviction count to be at least 1",
        );
        assert.ok(
          (invalidationEviction as DataPoint<Counter>).attributes[
            OTEL_ATTRIBUTES.redisClientLibrary
          ],
        );
        assert.strictEqual(
          (invalidationEviction as DataPoint<Counter>).attributes[
            OTEL_ATTRIBUTES.dbSystemName
          ],
          "redis",
        );
      },
      {
        client: {
          ...GLOBAL.SERVERS.OPEN,
          clientOptions: {
            RESP: 3,
            clientSideCache: {
              ttl: 1000,
              maxEntries: 1,
            },
          },
        },
        cluster: {
          ...GLOBAL.CLUSTERS.OPEN,
          clusterConfiguration: {
            RESP: 3,
            clientSideCache: {
              ttl: 1000,
              maxEntries: 1,
            },
          },
        },
      },
    );

    testUtils.testAll(
      "should record redis.client.csc.network_saved",
      async (client) => {
        await client.ping();
        await client.set("key", "value");
        await client.get("key");
        await client.get("key");

        const metric = await waitForMetrics(
          meterProvider,
          exporter,
          METRIC_NAMES.redisClientCscNetworkSaved,
        );

        assert.ok(
          metric,
          "expected redis.client.csc.network_saved metric to be present",
        );
        assert.strictEqual(metric.descriptor.unit, "By");

        const savedBytesPoint = (
          metric.dataPoints as unknown as DataPoint<Counter>[]
        ).find((dp) => Number(dp.value) > 0);
        assert.ok(
          savedBytesPoint,
          "expected redis.client.csc.network_saved value to be greater than 0",
        );

        const { attributes } = savedBytesPoint as DataPoint<Counter>;
        assert.ok(attributes[OTEL_ATTRIBUTES.redisClientLibrary]);
        assert.strictEqual(attributes[OTEL_ATTRIBUTES.dbSystemName], "redis");
      },
      {
        client: {
          ...GLOBAL.SERVERS.OPEN,
          clientOptions: {
            RESP: 3,
            clientSideCache: {
              ttl: 1000,
              maxEntries: 100,
            },
          },
        },
        cluster: {
          ...GLOBAL.CLUSTERS.OPEN,
          clusterConfiguration: {
            RESP: 3,
            clientSideCache: {
              ttl: 1000,
              maxEntries: 100,
            },
          },
        },
      },
    );
  });

  describe("PubSub metrics", () => {
    const listener = () => {};

    beforeEach(() => {
      OTelMetrics.init({
        api,
        config: {
          metrics: {
            enabled: true,
            meterProvider,
            enabledMetricGroups: ["pubsub"],
          },
        },
      });
    });

    testUtils.testWithClient(
      "should record redis.client.pubsub.messages for publish and subscribe - single client",
      async (client) => {
        const channel = "otel-pubsub-channel";

        const subscriber = await client.duplicate().connect();

        try {
          await subscriber.subscribe(channel, listener);
          await client.publish(channel, "hello");
          await subscriber.unsubscribe(channel, listener);
        } finally {
          subscriber.destroy();
        }

        await meterProvider.forceFlush();

        const resourceMetrics = exporter.getMetrics();
        const dataPoints = getMetricDataPoints<Counter>(
          resourceMetrics,
          METRIC_NAMES.redisClientPubsubMessages,
        );

        const outPoint = dataPoints.find(
          (dp) =>
            dp.attributes[OTEL_ATTRIBUTES.redisClientPubSubMessageDirection] ===
            "out",
        );
        const inPoint = dataPoints.find(
          (dp) =>
            dp.attributes[OTEL_ATTRIBUTES.redisClientPubSubMessageDirection] ===
            "in",
        );

        // Outgoing message
        assert.ok(outPoint, "expected outgoing pubsub message data point");
        assert.strictEqual(
          outPoint.attributes[OTEL_ATTRIBUTES.redisClientPubSubSharded],
          false,
        );
        assert.ok(outPoint.attributes[OTEL_ATTRIBUTES.redisClientLibrary]);
        assert.ok(outPoint.attributes[OTEL_ATTRIBUTES.dbSystemName]);
        assert.ok(
          outPoint.attributes[OTEL_ATTRIBUTES.dbClientConnectionPoolName],
        );

        // Incoming message
        assert.ok(inPoint, "expected incoming pubsub message data point");
        assert.strictEqual(
          inPoint.attributes[OTEL_ATTRIBUTES.redisClientPubSubSharded],
          false,
        );
        assert.ok(inPoint.attributes[OTEL_ATTRIBUTES.redisClientLibrary]);
        assert.ok(inPoint.attributes[OTEL_ATTRIBUTES.dbSystemName]);
        assert.ok(
          inPoint.attributes[OTEL_ATTRIBUTES.dbClientConnectionPoolName],
        );
      },
      GLOBAL.SERVERS.OPEN,
    );

    testUtils.testWithCluster(
      "should record redis.client.pubsub.messages for publish and subscribe - cluster",
      async (client) => {
        const channel = "otel-pubsub-channel";

        await client.subscribe(channel, listener);
        await client.publish(channel, "hello");
        await client.unsubscribe(channel, listener);

        await meterProvider.forceFlush();

        const resourceMetrics = exporter.getMetrics();
        const dataPoints = getMetricDataPoints<Counter>(
          resourceMetrics,
          METRIC_NAMES.redisClientPubsubMessages,
        );

        const outPoint = dataPoints.find(
          (dp) =>
            dp.attributes[OTEL_ATTRIBUTES.redisClientPubSubMessageDirection] ===
            "out",
        );
        const inPoint = dataPoints.find(
          (dp) =>
            dp.attributes[OTEL_ATTRIBUTES.redisClientPubSubMessageDirection] ===
            "in",
        );

        // Outgoing message
        assert.ok(outPoint, "expected outgoing pubsub message data point");
        assert.strictEqual(
          outPoint.attributes[OTEL_ATTRIBUTES.redisClientPubSubSharded],
          false,
        );
        assert.ok(outPoint.attributes[OTEL_ATTRIBUTES.redisClientLibrary]);
        assert.ok(outPoint.attributes[OTEL_ATTRIBUTES.dbSystemName]);
        assert.ok(
          outPoint.attributes[OTEL_ATTRIBUTES.dbClientConnectionPoolName],
        );

        // Incoming message
        assert.ok(inPoint, "expected incoming pubsub message data point");
        assert.strictEqual(
          inPoint.attributes[OTEL_ATTRIBUTES.redisClientPubSubSharded],
          false,
        );
        assert.ok(inPoint.attributes[OTEL_ATTRIBUTES.redisClientLibrary]);
        assert.ok(inPoint.attributes[OTEL_ATTRIBUTES.dbSystemName]);
        assert.ok(
          inPoint.attributes[OTEL_ATTRIBUTES.dbClientConnectionPoolName],
        );
      },
      GLOBAL.CLUSTERS.OPEN,
    );

    testUtils.testWithCluster(
      "should record redis.client.pubsub.messages for spublish and ssubscribe",
      async (cluster) => {
        const channel = "otel-sharded-channel";

        const listener = () => {};
        await cluster.sSubscribe(channel, listener);
        await cluster.sPublish(channel, "hello");
        await cluster.sUnsubscribe(channel, listener);

        await meterProvider.forceFlush();

        const resourceMetrics = exporter.getMetrics();
        const dataPoints = getMetricDataPoints<Counter>(
          resourceMetrics,
          METRIC_NAMES.redisClientPubsubMessages,
        );

        const outPoint = dataPoints.find(
          (dp) =>
            dp.attributes[OTEL_ATTRIBUTES.redisClientPubSubMessageDirection] ===
            "out",
        );
        const inPoint = dataPoints.find(
          (dp) =>
            dp.attributes[OTEL_ATTRIBUTES.redisClientPubSubMessageDirection] ===
            "in",
        );

        // Outgoing message
        assert.ok(outPoint, "expected outgoing pubsub message data point");
        assert.strictEqual(
          outPoint.attributes[OTEL_ATTRIBUTES.redisClientPubSubSharded],
          true,
        );
        assert.ok(outPoint.attributes[OTEL_ATTRIBUTES.redisClientLibrary]);
        assert.ok(outPoint.attributes[OTEL_ATTRIBUTES.dbSystemName]);
        assert.ok(
          outPoint.attributes[OTEL_ATTRIBUTES.dbClientConnectionPoolName],
        );

        // Incoming message
        assert.ok(inPoint, "expected incoming pubsub message data point");
        assert.strictEqual(
          inPoint.attributes[OTEL_ATTRIBUTES.redisClientPubSubSharded],
          true,
        );
        assert.ok(inPoint.attributes[OTEL_ATTRIBUTES.redisClientLibrary]);
        assert.ok(inPoint.attributes[OTEL_ATTRIBUTES.dbSystemName]);
        assert.ok(
          inPoint.attributes[OTEL_ATTRIBUTES.dbClientConnectionPoolName],
        );
      },
      {
        ...GLOBAL.CLUSTERS.OPEN,
        minimumDockerVersion: [7],
      },
    );
  });

  describe("Stream metrics", () => {
    beforeEach(() => {
      OTelMetrics.init({
        api,
        config: {
          metrics: {
            enabled: true,
            meterProvider,
            enabledMetricGroups: ["streaming"],
          },
        },
      });
    });

    testUtils.testAll(
      "should record redis.client.stream.lag",
      async (client) => {
        const stream = "otel-stream";
        const group = "otel-group";
        const consumer = "otel-consumer";
        const lagDelayMs = 100;

        await client.xGroupCreate(stream, group, "$", { MKSTREAM: true });
        await client.xAdd(stream, "*", { field: "value" });
        // Ensure measurable lag between production and consumption.
        await new Promise((resolve) => setTimeout(resolve, lagDelayMs));
        await client.xReadGroup(group, consumer, { key: stream, id: ">" });

        await meterProvider.forceFlush();

        const resourceMetrics = exporter.getMetrics();
        const dataPoints = getMetricDataPoints<Histogram>(
          resourceMetrics,
          METRIC_NAMES.redisClientStreamLag,
        );

        const streamPoint = dataPoints.find(
          (dp) =>
            dp.attributes[OTEL_ATTRIBUTES.redisClientStreamName] === stream &&
            dp.attributes[OTEL_ATTRIBUTES.redisClientConsumerGroup] === group &&
            dp.attributes[OTEL_ATTRIBUTES.redisClientConsumerName] === consumer,
        );

        assert.ok(streamPoint, "expected stream lag data point to be present");

        const { value, attributes } = streamPoint as DataPoint<Histogram>;
        assert.ok(
          value.count >= 1,
          "expected stream lag count to be at least 1",
        );
        assert.ok(
          value.sum! >= 0,
          `expected stream lag sum to greater than 0`,
        );
        assert.strictEqual(
          attributes[OTEL_ATTRIBUTES.redisClientLibrary],
          "node-redis",
        );
        assert.strictEqual(attributes[OTEL_ATTRIBUTES.dbSystemName], "redis");
        assert.ok(OTEL_ATTRIBUTES.dbNamespace in attributes);
        assert.ok(attributes[OTEL_ATTRIBUTES.serverAddress]);
        assert.ok(attributes[OTEL_ATTRIBUTES.serverPort]);
        assert.ok(attributes[OTEL_ATTRIBUTES.dbClientConnectionPoolName]);
      },
      {
        client: GLOBAL.SERVERS.OPEN,
        cluster: GLOBAL.CLUSTERS.OPEN,
      },
    );

    testUtils.testAll(
      "should record redis.client.stream.lag with xRead",
      async (client) => {
        const stream = "otel-stream-xread";
        const lagDelayMs = 100;

        await client.xAdd(stream, "*", { field: "value" });
        // Ensure measurable lag between production and consumption.
        await new Promise((resolve) => setTimeout(resolve, lagDelayMs));
        await client.xRead({ key: stream, id: "0-0" });

        await meterProvider.forceFlush();

        const resourceMetrics = exporter.getMetrics();
        const dataPoints = getMetricDataPoints<Histogram>(
          resourceMetrics,
          METRIC_NAMES.redisClientStreamLag,
        );

        const streamPoint = dataPoints.find(
          (dp) => dp.attributes[OTEL_ATTRIBUTES.redisClientStreamName] === stream,
        );

        assert.ok(streamPoint, "expected stream lag data point to be present");

        const { value, attributes } = streamPoint as DataPoint<Histogram>;
        assert.ok(
          value.count >= 1,
          "expected stream lag count to be at least 1",
        );
        assert.ok(
          value.sum! >= 0,
          `expected stream lag sum to greater than 0`,
        );
        assert.strictEqual(
          attributes[OTEL_ATTRIBUTES.redisClientLibrary],
          "node-redis",
        );
        assert.strictEqual(attributes[OTEL_ATTRIBUTES.dbSystemName], "redis");
        assert.ok(OTEL_ATTRIBUTES.dbNamespace in attributes);
        assert.ok(attributes[OTEL_ATTRIBUTES.serverAddress]);
        assert.ok(attributes[OTEL_ATTRIBUTES.serverPort]);
        assert.ok(attributes[OTEL_ATTRIBUTES.dbClientConnectionPoolName]);
        assert.strictEqual(
          attributes[OTEL_ATTRIBUTES.redisClientStreamName],
          stream,
        );
        assert.strictEqual(
          attributes[OTEL_ATTRIBUTES.redisClientConsumerGroup],
          undefined,
        );
        assert.strictEqual(
          attributes[OTEL_ATTRIBUTES.redisClientConsumerName],
          undefined,
        );
      },
      {
        client: GLOBAL.SERVERS.OPEN,
        cluster: GLOBAL.CLUSTERS.OPEN,
      },
    );
  });

  testUtils.testAll(
    "should NOT record commands when disabled",
    async (client) => {
      OTelMetrics.init({
        api,
        config: {
          metrics: {
            enabled: false,
          },
        },
      });

      await Promise.all([
        client.set("key", "value"),
        client.set("key", "value"),
        client.set("key", "value"),
      ]);

      await meterProvider.forceFlush();

      const resourceMetrics = exporter.getMetrics();
      const metric = resourceMetrics
        .flatMap((rm) => rm.scopeMetrics)
        .flatMap((sm) => sm.metrics)
        .find(
          (m) => m.descriptor.name === METRIC_NAMES.dbClientOperationDuration,
        );

      assert.strictEqual(metric, undefined);
    },
    {
      client: GLOBAL.SERVERS.OPEN,
      cluster: GLOBAL.CLUSTERS.OPEN,
    },
  );
});
