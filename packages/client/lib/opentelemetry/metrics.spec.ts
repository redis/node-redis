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
import { METRIC_NAMES, ObservabilityConfig } from "./types";
import { NOOP_UP_DOWN_COUNTER_METRIC } from "./noop-meter";
import { noopFunction, waitForMetrics } from "./utils";
import testUtils, { GLOBAL } from "../test-utils";

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
    const addSpy = spy(NOOP_UP_DOWN_COUNTER_METRIC, "add");

    OTelMetrics.instance.recordConnectionCount(1);

    assert.equal(addSpy.callCount, 1);

    addSpy.restore();
  });

  it("should create instance with noop meter when API is null", () => {
    const config: ObservabilityConfig = {
      metrics: {
        enabled: true,
      },
    };

    const addSpy = spy(NOOP_UP_DOWN_COUNTER_METRIC, "add");

    OTelMetrics.init({ api: undefined, config });

    OTelMetrics.instance.recordConnectionCount(1);

    assert.equal(addSpy.callCount, 1);

    addSpy.restore();
  });

  it("should create instance with noop meter when metrics are disabled", () => {
    const config: ObservabilityConfig = {
      metrics: {
        enabled: false,
      },
    };

    const addSpy = spy(NOOP_UP_DOWN_COUNTER_METRIC, "add");

    OTelMetrics.init({ api: undefined, config });

    OTelMetrics.instance.recordConnectionCount(1);

    assert.equal(addSpy.callCount, 1);

    addSpy.restore();
  });

  it("should not record excluded commands", () => {
    const config: ObservabilityConfig = {
      metrics: {
        enabled: true,
        excludeCommands: ["GET"],
      },
    };

    OTelMetrics.init({ api: undefined, config });

    const recordGET = OTelMetrics.instance.createRecordOperationDuration(
      ["GET", "key"],
      {
        host: "localhost",
        port: "6379",
        db: "0",
      }
    );

    assert.strictEqual(
      recordGET,
      noopFunction,
      "expect record to be noop function"
    );

    const recordSET = OTelMetrics.instance.createRecordOperationDuration(
      ["SET", "key"],
      {
        host: "localhost",
        port: "6379",
        db: "0",
      }
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
        enabled: true,
        includeCommands: ["SET"],
      },
    };

    OTelMetrics.init({ api: undefined, config });

    const recordGET = OTelMetrics.instance.createRecordOperationDuration(
      ["GET", "key"],
      {
        host: "localhost",
        port: "6379",
        db: "0",
      }
    );

    assert.strictEqual(
      recordGET,
      noopFunction,
      "expect record to be noop function"
    );

    const recordSET = OTelMetrics.instance.createRecordOperationDuration(
      ["SET", "key"],
      {
        host: "localhost",
        port: "6379",
        db: "0",
      }
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

    OTelMetrics.instance.recordConnectionCount(1);
    OTelMetrics.instance.recordConnectionCount(2);
    OTelMetrics.instance.recordConnectionCount(3);

    await meterProvider.forceFlush();

    const resourceMetrics = exporter.getMetrics();

    const metric = resourceMetrics
      .flatMap((rm) => rm.scopeMetrics)
      .flatMap((sm) => sm.metrics)
      .find((m) => m.descriptor.name === "db.client.connection.count");

    assert.ok(
      metric,
      "expected db.client.connection.count metric to be present"
    );
    assert.strictEqual(metric.dataPoints?.[0].value, 6);
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

    OTelMetrics.instance.recordConnectionCount(5);

    await meterProvider.forceFlush();

    const resourceMetrics = exporter.getMetrics();

    const metric = resourceMetrics
      .flatMap((rm) => rm.scopeMetrics)
      .flatMap((sm) => sm.metrics)
      .find((m) => m.descriptor.name === "db.client.connection.count");

    assert.ok(
      metric,
      "expected db.client.connection.count metric to be present"
    );
    assert.strictEqual(metric.dataPoints?.[0].value, 5);
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

      assert.strictEqual(dataPoints[0].value.count, 3);
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

      const beforeMetric = await waitForMetrics(
        meterProvider,
        exporter,
        METRIC_NAMES.dbClientConnectionPendingRequests
      );

      assert.strictEqual(beforeMetric, undefined);

      const blockingPromise = client.blPop("key${tag}", 1);

      const afterMetric = await waitForMetrics(
        meterProvider,
        exporter,
        METRIC_NAMES.dbClientConnectionPendingRequests
      );

      await blockingPromise;

      assert.ok(afterMetric, "expected pending requests metric to be present");
      assert.strictEqual(afterMetric.dataPoints[0].value, 1);
    },
    {
      client: GLOBAL.SERVERS.OPEN,
      cluster: GLOBAL.CLUSTERS.OPEN,
    }
  );
});
