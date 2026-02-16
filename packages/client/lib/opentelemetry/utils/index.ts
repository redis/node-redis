import {
  MeterProvider,
  InMemoryMetricExporter,
} from "@opentelemetry/sdk-metrics";
import { OTEL_ATTRIBUTES, OTelClientAttributes } from "../types";

export { getErrorInfo } from "./error.util";
export type { ErrorInfo } from "./error.util";

export function noopFunction() {}

export const waitForMetrics = async (
  meterProvider: MeterProvider,
  exporter: InMemoryMetricExporter,
  metricName: string,
  timeoutMs = 1000
) => {
  const startTime = performance.now();

  while (performance.now() - startTime < timeoutMs) {
    await meterProvider.forceFlush();
    const beforeResourceMetrics = exporter.getMetrics();
    const beforeMetric = beforeResourceMetrics
      .flatMap((rm) => rm.scopeMetrics)
      .flatMap((sm) => sm.metrics)
      .find((m) => m.descriptor.name === metricName);

    if (beforeMetric) {
      return beforeMetric;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }
};

export const parseClientAttributes = (
  clientAttributes?: OTelClientAttributes
) => {
  return {
    ...(clientAttributes?.db === undefined
      ? {}
      : {
          [OTEL_ATTRIBUTES.dbNamespace]: clientAttributes.db.toString(),
        }),
    ...(clientAttributes?.host && {
      [OTEL_ATTRIBUTES.serverAddress]: clientAttributes.host,
    }),
    ...(clientAttributes?.port && {
      [OTEL_ATTRIBUTES.serverPort]: clientAttributes.port.toString(),
    }),
    ...(clientAttributes?.clientId && {
      [OTEL_ATTRIBUTES.dbClientConnectionPoolName]: clientAttributes.clientId,
    }),
    ...(clientAttributes?.parentId && {
      [OTEL_ATTRIBUTES.redisClientParentId]: clientAttributes.parentId,
    })
  };
};
