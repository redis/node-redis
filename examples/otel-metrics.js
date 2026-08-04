// OpenTelemetry metrics example for node-redis.
// Demonstrates enablement, command activity, and metric export verification.

import { createClient, OpenTelemetry } from 'redis';
import { metrics } from '@opentelemetry/api';
import {
  ConsoleMetricExporter,
  MeterProvider,
  PeriodicExportingMetricReader
} from '@opentelemetry/sdk-metrics';

// Export metrics to console for easy local verification.
const reader = new PeriodicExportingMetricReader({
  exporter: new ConsoleMetricExporter(),
});

const meterProvider = new MeterProvider({
  readers: [reader]
});

metrics.setGlobalMeterProvider(meterProvider);

// Enable OpenTelemetry before creating clients
OpenTelemetry.init({
  metrics: {
    enabled: true,
    enabledMetricGroups: ['command', 'connection-basic', 'resiliency'],
  }
});

const client = createClient();

client.on('error', (err) => {
  console.error('Redis client error:', err);
});

try {
  await client.connect();

  // Normal command traffic.
  await client.ping();
  await client.set('otel:example:key', '1');
  await client.get('otel:example:key');

  // Generate a handled error to demonstrate resiliency metrics.
  await client.hSet('otel:example:hash', 'field', 'value');
  try {
    await client.incr('otel:example:hash');
  } catch (err) {
    console.log('Expected command error:', err);
  }

  // Force export so output is visible immediately.
  await meterProvider.forceFlush();
} finally {
  client.destroy();
  await meterProvider.shutdown();
}
