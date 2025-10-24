import {
  MeterProvider,
  InMemoryMetricExporter,
} from "@opentelemetry/sdk-metrics";

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
