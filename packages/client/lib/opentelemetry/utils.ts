import {
  MeterProvider,
  InMemoryMetricExporter,
} from "@opentelemetry/sdk-metrics";
import { OTEL_ATTRIBUTES, OTelClientAttributes, ErrorCategory, ERROR_CATEGORY } from "./types";

export function noopFunction() {}

/**
 * Categorizes an error into one of the predefined error categories.
 *
 * TODO: Implement full error categorization logic. This should analyze the error
 * to determine if it's a network error (connection refused, timeout, DNS failure),
 * TLS error (certificate validation, handshake failure), auth error (wrong password,
 * AUTH required), or server error (OOM, readonly, cluster down). Currently returns
 * 'other' as a placeholder.
 *
 * Future implementation should check:
 * - error.code for network errors (ECONNREFUSED, ETIMEDOUT, ENOTFOUND, etc.)
 * - error message patterns for TLS errors (certificate, handshake, SSL)
 * - Redis error prefixes for auth errors (NOAUTH, WRONGPASS)
 * - Redis error prefixes for server errors (OOM, READONLY, CLUSTERDOWN)
 *
 * @param error - The error to categorize
 * @returns The error category, currently always 'other'
 */
export function categorizeError(error: Error): ErrorCategory {
  // TODO: Implement full error categorization logic per Q1 Option C (deferred)
  return ERROR_CATEGORY.OTHER;
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
  };
};
