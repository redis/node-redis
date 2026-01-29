import {
  MeterProvider,
  InMemoryMetricExporter,
} from "@opentelemetry/sdk-metrics";
import { OTEL_ATTRIBUTES, OTelClientAttributes } from "../types";

export { getErrorInfo } from "./error.util";
export type { ErrorInfo } from "./error.util";

export function noopFunction() {}

/**
 * Formats a pool name for the db.client.connection.pool.name attribute.
 *
 * @param host - The Redis server host (defaults to 'unknown')
 * @param port - The Redis server port (defaults to 6379)
 * @param db - The Redis database number (defaults to 0)
 * @returns Formatted pool name in the format {host}:{port}/{db}
 */
export function formatPoolName(
  host?: string,
  port?: string | number,
  db?: string | number
): string {
  const hostStr = host ?? 'unknown';
  const portStr = port?.toString() ?? '6379';
  const dbStr = db?.toString() ?? '0';
  return `${hostStr}:${portStr}/${dbStr}`;
}

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
    [OTEL_ATTRIBUTES.dbClientConnectionPoolName]: formatPoolName(
      clientAttributes?.host,
      clientAttributes?.port,
      clientAttributes?.db
    ),
  };
};
