// OpenTelemetry tracing example for node-redis.
// Demonstrates span creation for commands, MULTI transactions, and nested app spans.

import { createClient, OpenTelemetry } from 'redis';
import { trace, context } from '@opentelemetry/api';
import {
  BasicTracerProvider,
  SimpleSpanProcessor,
  ConsoleSpanExporter,
} from '@opentelemetry/sdk-trace-base';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';

// Export spans to console for easy local verification.
const provider = new BasicTracerProvider({
  spanProcessors: [
    new SimpleSpanProcessor(new ConsoleSpanExporter()),
  ],
});

context.setGlobalContextManager(new AsyncLocalStorageContextManager());
trace.setGlobalTracerProvider(provider);

// Enable OpenTelemetry before creating clients.
OpenTelemetry.init({
  tracing: {
    enabled: true,
    enableConnectionSpans: true,
  },
});

const client = createClient();

client.on('error', (err) => {
  console.error('Redis client error:', err);
});

const tracer = trace.getTracer('example-app');

try {
  await client.connect();

  // Normal command traffic — each creates a span.
  await client.set('otel:example:key', 'hello');
  await client.get('otel:example:key');

  // MULTI transaction — creates a parent batch span with child command spans.
  await client.multi()
    .set('otel:example:a', '1')
    .set('otel:example:b', '2')
    .get('otel:example:a')
    .exec();

  // Application span wrapping Redis commands — demonstrates parent-child propagation.
  await tracer.startActiveSpan('myApp.processRequest', async (span) => {
    await client.get('otel:example:key');
    await client.set('otel:example:visited', 'true');
    span.end();
  });

  // Generate a handled error to demonstrate error span recording.
  await client.hSet('otel:example:hash', 'field', 'value');
  try {
    await client.incr('otel:example:hash');
  } catch (err) {
    console.log('Expected command error:', err);
  }

  // Force export so output is visible immediately.
  await provider.forceFlush();
} finally {
  client.destroy();
  await provider.shutdown();
}
