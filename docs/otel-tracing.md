# OpenTelemetry Tracing

## Get started

### Step 1. Install node-redis dependencies

```bash
npm install redis @opentelemetry/api
```

`@opentelemetry/api` is required at runtime for `OpenTelemetry.init(...)`.

### Step 2. Install OpenTelemetry SDK packages

```bash
npm install @opentelemetry/sdk-trace-base @opentelemetry/context-async-hooks
```

Alternative (Node SDK):

```bash
npm install @opentelemetry/sdk-node
```

If you export to OTLP or another backend, install the matching OpenTelemetry exporter package (e.g. `@opentelemetry/exporter-trace-otlp-http`).

For more information, see the [OpenTelemetry Tracing documentation](https://opentelemetry.io/docs/instrumentation/js/exporters/#traces).

### Step 3. Register OpenTelemetry

Option A: Use `@opentelemetry/sdk-trace-base` directly

```typescript
import { trace, context } from "@opentelemetry/api";
import {
  BasicTracerProvider,
  SimpleSpanProcessor,
  ConsoleSpanExporter,
} from "@opentelemetry/sdk-trace-base";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";

const provider = new BasicTracerProvider({
  spanProcessors: [
    new SimpleSpanProcessor(new ConsoleSpanExporter()),
  ],
});

context.setGlobalContextManager(new AsyncLocalStorageContextManager());
trace.setGlobalTracerProvider(provider);
```

Option B: Use `@opentelemetry/sdk-node`

```typescript
import { NodeSDK } from "@opentelemetry/sdk-node";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-base";

const sdk = new NodeSDK({
  traceExporter: new ConsoleSpanExporter(),
});

await sdk.start();
```

### Step 4. Initialize node-redis instrumentation before creating clients

```typescript
import { createClient, OpenTelemetry } from "redis";

OpenTelemetry.init({
  tracing: {
    enabled: true,
  },
});

const client = createClient();
await client.connect();
```

## Examples

### Minimal Example

```typescript
import { OpenTelemetry } from "redis";

OpenTelemetry.init({
  tracing: {
    enabled: true,
  },
});
```

### Full Example

```typescript
import { OpenTelemetry } from "redis";

OpenTelemetry.init({
  tracing: {
    enabled: true,
    tracerProvider: customTracerProvider,
    includeCommands: ["GET", "SET", "HSET"],
    excludeCommands: ["PING"],
    enableConnectionSpans: true,
  },
});
```

### Combined with Metrics

```typescript
import { OpenTelemetry } from "redis";

OpenTelemetry.init({
  metrics: {
    enabled: true,
  },
  tracing: {
    enabled: true,
    enableConnectionSpans: true,
  },
});
```

## Configuration

### TracingConfig

| Property | Default | Description |
| -------- | ------- | ----------- |
| enabled | **false** | Enables span creation. |
| tracerProvider |  | Uses this provider instead of the global provider from @opentelemetry/api. |
| includeCommands | **[]** | Case-insensitive allow-list for command spans. |
| excludeCommands | **[]** | Case-insensitive deny-list for command spans. If both include and exclude match, exclude wins. |
| enableConnectionSpans | **false** | Creates spans for `connect()` calls. |

## Span types

### Command spans

Created for each Redis command (`GET`, `SET`, `HSET`, etc.).

| Attribute | Value |
| --------- | ----- |
| `db.system.name` | `redis` |
| `db.operation.name` | The command name (e.g. `SET`) |
| `db.namespace` | The selected database index |
| `db.query.text` | The sanitized command and arguments |
| `server.address` | Redis server host |
| `server.port` | Redis server port |
| `redis.client.library` | `node-redis:<version>` |

### Batch spans (MULTI / PIPELINE)

Created for `MULTI`/`EXEC` transactions and pipelines. Individual commands within the batch are traced as child spans.

| Attribute | Value |
| --------- | ----- |
| `db.system.name` | `redis` |
| `db.operation.name` | `MULTI` or `PIPELINE` |
| `db.namespace` | The selected database index |
| `db.operation.batch.size` | Number of commands in the batch |
| `server.address` | Redis server host |
| `server.port` | Redis server port |
| `redis.client.library` | `node-redis:<version>` |

### Connection spans

Created for `connect()` calls when `enableConnectionSpans` is `true`.

| Attribute | Value |
| --------- | ----- |
| `db.system.name` | `redis` |
| `server.address` | Redis server host |
| `server.port` | Redis server port |
| `redis.client.library` | `node-redis:<version>` |

## Error handling

When a command fails, the span records the exception and sets the following:

| Attribute | Value |
| --------- | ----- |
| `error.type` | The error class name |
| `db.response.status_code` | The Redis error prefix (e.g. `WRONGTYPE`) if available |

The span status is set to `ERROR` with the error message.

## Context propagation

Spans created by node-redis automatically participate in the active OpenTelemetry context. If you create an application-level span and execute Redis commands within it, the Redis spans appear as children:

```typescript
const tracer = trace.getTracer("my-app");

await tracer.startActiveSpan("handleRequest", async (span) => {
  // These Redis spans are children of "handleRequest"
  await client.get("session:abc");
  await client.set("last-seen", Date.now().toString());
  span.end();
});
```

This also works with nested batch operations — individual command spans appear as children of their `MULTI` or `PIPELINE` parent span.

Context propagation requires `@opentelemetry/context-async-hooks` (or the Node SDK) to be registered.

## Notes

- `OpenTelemetry` is a singleton and a second `init` call throws.
- If `@opentelemetry/api` is not installed, `init` throws.
- Command arguments in `db.query.text` are sanitized — values for write commands are replaced with `?` to avoid leaking sensitive data.
- Tracing is built on top of the [Diagnostics Channel](./diagnostics-channel.md) `TracingChannel` infrastructure. Requires Node.js >= 18.19.0.

## Runnable example

See ../examples/otel-tracing.js.
