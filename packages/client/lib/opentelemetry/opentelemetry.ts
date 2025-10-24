import { OTelMetrics } from "./metrics";
import { ObservabilityConfig } from "./types";

export class OpenTelemetry {
  private static _instance: OpenTelemetry | null = null;

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
