import {
  MeterProvider,
  InMemoryMetricExporter,
  DataPoint,
} from "@opentelemetry/sdk-metrics";

export const waitForMetrics = async (
  meterProvider: MeterProvider,
  exporter: InMemoryMetricExporter,
  metricName: string,
  timeoutMs = 1000,
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

/**
 * Returns the data points for a given metric name.
 *
 * @throws Error if metric is not found
 */
export const getMetricDataPoints = <T>(
  resourceMetrics: ReturnType<InMemoryMetricExporter["getMetrics"]>,
  metricName: string,
): DataPoint<T>[] => {
  const metric = resourceMetrics
    .flatMap((rm) => rm.scopeMetrics)
    .flatMap((sm) => sm.metrics)
    .find((m) => m.descriptor.name === metricName);

  if (!metric) {
    throw new Error(`expected ${metricName} metric to be present`);
  }

  return metric.dataPoints as DataPoint<T>[];
};
