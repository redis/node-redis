import { strict as assert } from "node:assert";

import * as api from "@opentelemetry/api";
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
import { METRIC_NAMES, ObservabilityConfig, OTEL_ATTRIBUTES } from "./types";
import { NOOP_COUNTER_METRIC } from "./noop-meter";
import { noopFunction, waitForMetrics } from "./utils";
import testUtils, { GLOBAL } from "../test-utils";
import { ClientRegistry } from "./client-registry";
import { ClientRole } from "../client/identity";

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

    OTelMetrics.instance.resiliencyMetrics.recordClientErrors(new Error('Test error'), true);

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

    OTelMetrics.instance.resiliencyMetrics.recordClientErrors(new Error('Test error'), true);

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

    OTelMetrics.instance.resiliencyMetrics.recordClientErrors(new Error('Test error'), true);

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

    const recordGET = OTelMetrics.instance.commandMetrics.createRecordOperationDuration(
      ["GET", "key"],
      "test-client",
    );

    assert.strictEqual(
      recordGET,
      noopFunction,
      "expect record to be noop function"
    );

    const recordSET = OTelMetrics.instance.commandMetrics.createRecordOperationDuration(
      ["SET", "key"],
      "test-client",
    );

    assert.notStrictEqual(
      recordSET,
      noopFunction,
      "expect record to not be noop function"
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

    const recordGET = OTelMetrics.instance.commandMetrics.createRecordOperationDuration(
      ["GET", "key"],
      "test-client",
    );

    assert.strictEqual(
      recordGET,
      noopFunction,
      "expect record to be noop function"
    );

    const recordSET = OTelMetrics.instance.commandMetrics.createRecordOperationDuration(
      ["SET", "key"],
      "test-client",
    );

    assert.notStrictEqual(
      recordSET,
      noopFunction,
      "expect record to not be noop function"
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

    OTelMetrics.instance.resiliencyMetrics.recordClientErrors(new Error('Test error 1'), true);
    OTelMetrics.instance.resiliencyMetrics.recordClientErrors(new Error('Test error 2'), true);
    OTelMetrics.instance.resiliencyMetrics.recordClientErrors(new Error('Test error 3'), true);

    await meterProvider.forceFlush();

    const resourceMetrics = exporter.getMetrics();

    const metric = resourceMetrics
      .flatMap((rm) => rm.scopeMetrics)
      .flatMap((sm) => sm.metrics)
      .find((m) => m.descriptor.name === "redis.client.errors");

    assert.ok(
      metric,
      "expected redis.client.errors metric to be present"
    );
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

    OTelMetrics.instance.resiliencyMetrics.recordClientErrors(new Error('Test error 1'), true);
    OTelMetrics.instance.resiliencyMetrics.recordClientErrors(new Error('Test error 2'), true);

    await meterProvider.forceFlush();

    const resourceMetrics = exporter.getMetrics();

    const metric = resourceMetrics
      .flatMap((rm) => rm.scopeMetrics)
      .flatMap((sm) => sm.metrics)
      .find((m) => m.descriptor.name === "redis.client.errors");

    assert.ok(
      metric,
      "expected redis.client.errors metric to be present"
    );
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
    assert.strictEqual(point.attributes[OTEL_ATTRIBUTES.serverPort], 6379);
    assert.strictEqual(point.attributes[OTEL_ATTRIBUTES.dbNamespace], 0);
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
    assert.strictEqual(point.attributes[OTEL_ATTRIBUTES.serverAddress], undefined);
    assert.strictEqual(point.attributes[OTEL_ATTRIBUTES.serverPort], undefined);
    assert.strictEqual(point.attributes[OTEL_ATTRIBUTES.dbNamespace], undefined);
  });

  testUtils.testWithClient(
    "should count connections",
    async (client) => {
      try {
        OTelMetrics.init({
          api,
          config: {
            metrics: {
              enabled: true,
              meterProvider,
            },
          },
        });

        await client.connect();

        await meterProvider.forceFlush();

        const resourceMetrics = exporter.getMetrics();
        const metric = resourceMetrics
        .flatMap((rm) => rm.scopeMetrics)
        .flatMap((sm) => sm.metrics)
        .find(
          (m) => m.descriptor.name === METRIC_NAMES.dbClientConnectionCount
        );

        assert.ok(
          metric,
          "expected db.client.connection.count metric to be present"
        );
        assert.strictEqual(metric.dataPoints?.[0].value, 1);
      } catch (error) {
        throw error;
      } finally {
        await client.destroy();
      }
    },
    {
      ...GLOBAL.SERVERS.OPEN,
      disableClientSetup: true,
    }
  );

  testUtils.testAll(
    "should record commands",
    async (client) => {
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
          (m) => m.descriptor.name === METRIC_NAMES.dbClientOperationDuration
        );

      assert.ok(
        metric,
        "expected db.client.operation.duration metric to be present"
      );

      const dataPoints = metric.dataPoints as DataPoint<Histogram>[];

      const setDataPoint = dataPoints.find(
        (dp) => dp.attributes[OTEL_ATTRIBUTES.dbOperationName] === "SET"
      );

      assert.ok(setDataPoint, "expected SET data point to be present");

      assert.strictEqual(setDataPoint.value.count, 3);
    },
    {
      client: GLOBAL.SERVERS.OPEN,
      cluster: GLOBAL.CLUSTERS.OPEN,
    }
  );

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
          (m) => m.descriptor.name === METRIC_NAMES.dbClientOperationDuration
        );

      assert.strictEqual(metric, undefined);
    },
    {
      client: GLOBAL.SERVERS.OPEN,
      cluster: GLOBAL.CLUSTERS.OPEN,
    }
  );

  testUtils.testAll(
    "should record pending requests",
    async (client) => {
      OTelMetrics.init({
        api,
        config: {
          metrics: {
            enabled: true,
            meterProvider,
            // Make sure connection-advanced is enabled since that's where pending requests is
            enabledMetricGroups: ["connection-advanced"],
          },
        },
      });

      // For standalone client, observable gauges emit with value 0 before any command.
      // For cluster with minimizeConnections: true, no clients are created until a command is sent,
      // so the metric may not exist yet. We check this after the command is sent.

      // Clear the exporter so we get fresh metrics after the blocking command
      exporter.reset();

      // Start a blocking command - this will be pending
      const blockingPromise = client.blPop("key${tag}", 1);

      // Give a small delay to ensure the command has been sent and connection established
      await new Promise((resolve) => setTimeout(resolve, 100));

      const afterMetric = await waitForMetrics(
        meterProvider,
        exporter,
        METRIC_NAMES.dbClientConnectionPendingRequests
      );

      assert.ok(afterMetric, "expected pending requests metric to be present");
      assert.strictEqual(afterMetric.dataPoints[0].value, 1, "expected 1 pending request while blocking command is in flight");

      await blockingPromise;
    },
    {
      client: GLOBAL.SERVERS.OPEN,
      cluster: GLOBAL.CLUSTERS.OPEN,
    }
  );
});
