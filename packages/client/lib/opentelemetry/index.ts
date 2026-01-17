import { OTelMetrics } from "./metrics";
import { ObservabilityConfig } from "./types";

export class OpenTelemetry {
  private static _instance: OpenTelemetry | null = null;

  // Make sure it's a singleton
  private constructor() {}

  public static init(config?: ObservabilityConfig) {
    if (OpenTelemetry._instance) {
      throw new Error("OpenTelemetry already initialized");
    }

    let api: typeof import("@opentelemetry/api") | undefined;

    try {
      api = require("@opentelemetry/api");
    } catch (err: unknown) {
      // TODO add custom errors
      throw new Error("OpenTelemetry not found");
    }

    OpenTelemetry._instance = new OpenTelemetry();
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
} from "./types";
export { OTelMetrics } from "./metrics";
export { categorizeError, formatPoolName, extractRedisStatusCode } from "./utils";
