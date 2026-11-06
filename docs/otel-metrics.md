# OpenTelemetry Metrics

## Get started

### Step 1. Install node-redis dependencies

```bash
npm install redis @opentelemetry/api
```

`@opentelemetry/api` is required at runtime for `OpenTelemetry.init(...)`.

### Step 2. Install OpenTelemetry SDK packages

```bash
npm install @opentelemetry/sdk-metrics
```

Alternative (Node SDK):

```bash
npm install @opentelemetry/sdk-node @opentelemetry/sdk-metrics
```

If you export to OTLP or another backend, install the matching OpenTelemetry exporter package.

For more information, see the [OpenTelemetry Metrics documentation](https://opentelemetry.io/docs/instrumentation/js/exporters/#metrics).

### Step 3. Register OpenTelemetry

Option A: Use `@opentelemetry/sdk-metrics` directly

```typescript
import { metrics } from "@opentelemetry/api";
import {
  ConsoleMetricExporter,
  MeterProvider,
  PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";

const meterProvider = new MeterProvider({
  readers: [
    new PeriodicExportingMetricReader({
      exporter: new ConsoleMetricExporter(),
      exportIntervalMillis: 1000,
    }),
  ],
});

metrics.setGlobalMeterProvider(meterProvider);
```

Option B: Use `@opentelemetry/sdk-node`

```typescript
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  ConsoleMetricExporter,
  PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";

const sdk = new NodeSDK({
  metricReader: new PeriodicExportingMetricReader({
    exporter: new ConsoleMetricExporter(),
    exportIntervalMillis: 1000,
  }),
});

await sdk.start();
```

### Step 4. Initialize node-redis instrumentation before creating clients

```typescript
import { createClient, OpenTelemetry } from "redis";

OpenTelemetry.init({
  metrics: {
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
  metrics: {
    enabled: true,
  },
});
```

### Full Example

```typescript
import { OpenTelemetry } from "redis";

OpenTelemetry.init({
  metrics: {
    enabled: true,
    meterProvider: customMeterProvider,
    enabledMetricGroups: ["command", "pubsub", "streaming", "resiliency"],
    includeCommands: ["GET", "HSET", "XREADGROUP", "PUBLISH"],
    excludeCommands: ["SET"],
    hidePubSubChannelNames: true,
    hideStreamNames: false,
    bucketsOperationDuration: [0.001, 0.01, 0.1, 1],
    bucketsStreamProcessingDuration: [0.01, 0.1, 1, 5],
    customAttributes: { "deployment.environment": "staging", team: "platform" },
  },
});
```

## Configuration

### ObservabilityConfig

| Property | Default | Description |
| -------- | ------- | ----------- |
| metrics |  | OpenTelemetry metrics configuration for node-redis. |

### MetricConfig

| Property | Default | Description |
| -------- | ------- | ----------- |
| enabled | **false** | Enables metric collection. |
| meterProvider |  | Uses this provider instead of the global provider from @opentelemetry/api. |
| includeCommands | **[]** | Case-insensitive allow-list for command metrics. |
| excludeCommands | **[]** | Case-insensitive deny-list for command metrics. If both include and exclude match, exclude wins. |
| enabledMetricGroups | **['connection-basic', 'resiliency']** | Metric groups to enable. Supported groups: command, connection-basic, connection-advanced, resiliency, pubsub, streaming, client-side-caching. |
| hidePubSubChannelNames | **false** | If true, omits redis.client.pubsub.channel to reduce cardinality. |
| hideStreamNames | **false** | If true, omits redis.client.stream.name to reduce cardinality. |
| bucketsOperationDuration | **[0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10]** | Histogram bucket boundaries for db.client.operation.duration (seconds). |
| bucketsConnectionCreateTime | **[0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10]** | Histogram bucket boundaries for db.client.connection.create_time (seconds). |
| bucketsConnectionWaitTime | **[0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10]** | Histogram bucket boundaries for db.client.connection.wait_time (seconds). |
| bucketsStreamProcessingDuration | **[0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10]** | Histogram bucket boundaries for redis.client.stream.lag (seconds). |
| customAttributes | **{}** | Attributes added to every data point of every metric, from every client in the process. See [Custom attributes](#custom-attributes). |

## Custom attributes

Custom attributes label metrics with your own values, for example to tell services or client instances apart in a dashboard. You can set them at two levels:

- **Process:** `customAttributes` in `OpenTelemetry.init`. Applies to every client in the process.
- **Client:** `metrics.customAttributes` in the client options. Applies to every metric that client emits. For a pool, set it in the client options; for a cluster, in `defaults`; for a sentinel, in `nodeClientOptions` and `sentinelClientOptions`. Every client they create then carries it.

```typescript
OpenTelemetry.init({
  metrics: {
    enabled: true,
    customAttributes: { "deployment.environment": "production" },
  },
});

const orders = createClient({ metrics: { customAttributes: { app: "orders" } } });
const billing = createCluster({
  rootNodes: [{ url: "redis://10.0.0.1:30001" }],
  defaults: { metrics: { customAttributes: { app: "billing" } } },
});
```

When the same key is set more than once, the most specific value wins:

1. client attributes
2. process attributes
3. attributes node-redis sets, such as `db.system.name` or `server.address`

Each client only carries its own attributes, so `orders` metrics never carry `app: "billing"`.

> **Warning**: Keep the cardinality of custom attributes low. Every distinct combination of attribute values creates a new time series for every metric, which raises the memory, storage and cost of your metrics backend. Use a few fixed values per process, such as the service, team, region or environment.

> **Note**: A custom attribute replaces a built-in attribute with the same key, which changes how its metrics group. For example, a custom `server.address` merges the data points of every node into one series. Prefer keys outside the namespaces node-redis uses (`db.*`, `server.*`, `network.*`, `error.*` and `redis.*`).

## Metric groups and metrics

| Metric Group | Metric Name |
| ------------ | ----------- |
| command | db.client.operation.duration |
| connection-basic | redis.client.connection.count |
| connection-basic | db.client.connection.create_time |
| connection-basic | redis.client.connection.relaxed_timeout |
| connection-basic | redis.client.connection.handoff |
| connection-advanced | db.client.connection.wait_time |
| connection-advanced | redis.client.connection.closed |
| resiliency | redis.client.errors |
| resiliency | redis.client.maintenance.notifications |
| pubsub | redis.client.pubsub.messages |
| streaming | redis.client.stream.lag |
| client-side-caching | redis.client.csc.requests |
| client-side-caching | redis.client.csc.items |
| client-side-caching | redis.client.csc.evictions |

## Notes

- `OpenTelemetry` is a singleton and a second `init` call throws.
- If `@opentelemetry/api` is not installed, `init` throws.

## Runnable example

See ../examples/otel-metrics.js.
