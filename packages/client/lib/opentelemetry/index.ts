import { OpenTelemetryError } from "../errors";
import { ClientRegistry } from "./client-registry";
import { OTelMetrics } from "./metrics";
import { ObservabilityConfig } from "./types";

export class OpenTelemetry {
  private static _instance: OpenTelemetry | null = null;

  // Make sure it's a singleton
  private constructor() {}

  /**
   * Initializes node-redis OpenTelemetry observability.
   *
   * This bootstraps node-redis metrics instrumentation and registers the
   * internal client registry used by metric collectors.
   *
   * Call this once during application startup, before creating Redis clients
   * you want to observe.
   *
   * @param config - Observability configuration.
   *
   * @throws {OpenTelemetryError} If OpenTelemetry is already initialized.
   * @throws {OpenTelemetryError} If `@opentelemetry/api` is not installed.
   *
   * @example
   * ```ts
   * import { metrics } from "@opentelemetry/api";
   * import {
   *   ConsoleMetricExporter,
   *   MeterProvider,
   *   PeriodicExportingMetricReader
   * } from "@opentelemetry/sdk-metrics";
   * import { OpenTelemetry } from "redis";
   *
   * const reader = new PeriodicExportingMetricReader({
   *   exporter: new ConsoleMetricExporter()
   * });
   *
   * const provider = new MeterProvider({ readers: [reader] });
   * metrics.setGlobalMeterProvider(provider);
   *
   * OpenTelemetry.init({
   *   metrics: {
   *     enabled: true,
   *     enabledMetricGroups: ["pubsub", "connection-basic", "resiliency"],
   *     includeCommands: ["GET", "SET"],
   *     hidePubSubChannelNames: true
   *   }
   * });
   * ```
   */
  public static init(config: ObservabilityConfig) {
    if (OpenTelemetry._instance) {
      throw new OpenTelemetryError("OpenTelemetry already initialized");
    }

    let api: typeof import("@opentelemetry/api") | undefined;

    try {
      api = require("@opentelemetry/api");
    } catch (err: unknown) {
      throw new OpenTelemetryError("@opentelemetry/api not found");
    }

    OpenTelemetry._instance = new OpenTelemetry();
    ClientRegistry.init();
    OTelMetrics.init({ api, config });
  }
}

export {
  METRIC_ERROR_TYPE,
  OTelClientAttributes,
  OTEL_ATTRIBUTES,
  ERROR_CATEGORY,
  ErrorCategory,
  CONNECTION_CLOSE_REASON,
  ConnectionCloseReason,
  CSC_RESULT,
  CscResult,
  CSC_EVICTION_REASON,
  CscEvictionReason,
  IOTelClientSideCacheMetrics,
  IOTelPubSubMetrics,
  IOTelStreamMetrics,
} from "./types";
export { OTelMetrics } from "./metrics";
export {
  ClientRegistry,
  ClientMetricsHandle,
  IClientRegistry,
} from "./client-registry";
