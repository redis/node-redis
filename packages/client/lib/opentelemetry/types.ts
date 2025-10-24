import {
  Attributes,
  Counter,
  Histogram,
  MeterProvider,
  UpDownCounter,
} from "@opentelemetry/api";

export const METRIC_GROUP = {
  COMMAND: "command",
  CONNECTION_BASIC: "connection-basic",
  CONNECTION_ADVANCED: "connection-advanced",
  RESILIENCY: "resiliency",
  PUBSUB: "pubsub",
  STREAMS: "streams",
  PIPELINE: "pipeline",
  HEALTHCHECK: "healthcheck",
  MISC: "misc",
} as const;

export type MetricGroup = (typeof METRIC_GROUP)[keyof typeof METRIC_GROUP];

export const HISTOGRAM_AGGREGATION = {
  EXPLICIT_BUCKET_HISTOGRAM: "explicit_bucket_histogram",
  BASE2_EXPONENTIAL_BUCKET_HISTOGRAM: "base2_exponential_bucket_histogram",
} as const;

export type HistogramAggregation =
  (typeof HISTOGRAM_AGGREGATION)[keyof typeof HISTOGRAM_AGGREGATION];

export const METRIC_INSTRUMENT_TYPE = {
  COUNTER: "counter",
  HISTOGRAM: "histogram",
  UP_DOWN_COUNTER: "up_down_counter",
};

export interface MetricConfig {
  enabled?: boolean;
  meterProvider?: MeterProvider;
  includeCommands?: string[];
  excludeCommands?: string[];
  enabledMetricGroups?: MetricGroup[];
  hidePubSubChannelNames?: boolean;
  hideStreamNames?: boolean;
  histAggregation?: HistogramAggregation;
  bucketsOperationDuration?: number[];
  bucketsConnectionCreateTime?: number[];
  bucketsConnectionWaitTime?: number[];
  bucketsConnectionUseTime?: number[];
  bucketsPipelineDuration?: number[];
  bucketsHealthcheckDuration?: number[];
  bucketsPipelineSize?: number[];
}

export interface ObservabilityConfig {
  serviceName?: string;
  resourceAttributes?: Attributes;
  metrics?: MetricConfig;
}

export interface MetricOptions
  extends Required<Omit<MetricConfig, "meterProvider">> {
  attributes: Attributes;
  serviceName?: string;
  meterProvider?: MeterProvider;
}

export type MetricInstruments = Readonly<{
  // Histograms
  dbClientOperationDuration: Histogram<Attributes>;
  dbClientConnectionCreateTime: Histogram<Attributes>;
  dbClientConnectionWaitTime: Histogram<Attributes>;
  dbClientConnectionUseTime: Histogram<Attributes>;
  redisClientPipelineDuration: Histogram<Attributes>;
  redisClientHealthcheckDuration: Histogram<Attributes>;

  // UpDownCounters
  dbClientConnectionCount: UpDownCounter<Attributes>;
  dbClientConnectionIdleMax: UpDownCounter<Attributes>;
  dbClientConnectionIdleMin: UpDownCounter<Attributes>;
  dbClientConnectionMax: UpDownCounter<Attributes>;
  dbClientConnectionPendingRequests: UpDownCounter<Attributes>;

  // Counters
  dbClientConnectionTimeouts: Counter<Attributes>;
  redisClientClusterRedirections: Counter<Attributes>;
  redisClientErrorsHandled: Counter<Attributes>;
  redisClientMaintenanceNotifications: Counter<Attributes>;
  redisClientPubSubMessages: Counter<Attributes>;
  redisClientStreamProduced: Counter<Attributes>;
}>;

export const OTEL_ATTRIBUTES = {
  // Database & network
  dbSystem: "db.system",
  dbNamespace: "db.namespace",
  dbOperationName: "db.operation.name",
  dbResponseStatusCode: "db.response.status_code",
  errorType: "error.type",
  serverAddress: "server.address",
  serverPort: "server.port",
  networkPeerAddress: "network.peer.address",
  networkPeerPort: "network.peer.port",
  dbOperationBatchSize: "db.operation.batch.size",
  dbStoredProcedureName: "db.stored_procedure.name",
  connectionPoolName: "db.client.connection.pool.name",
  connectionState: "db.client.connection.state",

  // Redis-specific extensions
  redisClientLibrary: "redis.client.library",
  redisRedirectionKind: "redis.client.redirection.kind",
  redisClientErrorsHandled: "redis.client.errors.handled",
  redisClientPubSubChannel: "redis.client.pubsub.channel",
  redisClientPubSubSharded: "redis.client.pubsub.sharded",
  redisClientStreamName: "redis.client.stream.name",
  redisClientOperationRetryAttempts: "redis.client.operation.retry_attempts",
  redisClientOperationBlocking: "redis.client.operation.blocking",
} as const;

export const DEFAULT_OTEL_ATTRIBUTES = {
  [OTEL_ATTRIBUTES.redisClientLibrary]: "node-redis",
  [OTEL_ATTRIBUTES.dbSystem]: "redis",
} as const;

export const METRIC_NAMES = {
  dbClientOperationDuration: "db.client.operation.duration",
  dbClientConnectionCreateTime: "db.client.connection.create.time",
  dbClientConnectionWaitTime: "db.client.connection.wait.time",
  dbClientConnectionUseTime: "db.client.connection.use.time",
  redisClientPipelineDuration: "redis.client.pipeline.duration",
  redisClientHealthcheckDuration: "redis.client.healthcheck.duration",
  dbClientConnectionCount: "db.client.connection.count",
  dbClientConnectionIdleMax: "db.client.connection.idle.max",
  dbClientConnectionIdleMin: "db.client.connection.idle.min",
  dbClientConnectionMax: "db.client.connection.max",
  dbClientConnectionPendingRequests: "db.client.connection.pending_requests",
  dbClientConnectionTimeouts: "db.client.connection.timeouts",
  redisClientClusterRedirections: "redis.client.cluster.redirections",
  redisClientErrorsHandled: "redis.client.errors.handled",
  redisClientMaintenanceNotifications: "redis.client.maintenance.notifications",
  redisClientPubSubMessages: "redis.client.pubsub.messages",
  redisClientStreamProduced: "redis.client.stream.produced",
} as const;

export type InstrumentConfig = {
  name: string;
  unit: string;
  description: string;
  metricGroup: MetricGroup;
};

export const DEFAULT_METRIC_GROUPS: MetricGroup[] = [
  "command",
  "connection-basic",
  "resiliency",
];

export const DEFAULT_HISTOGRAM_BUCKETS = {
  OPERATION_DURATION: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10],
  CONNECTION_CREATE_TIME: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10],
  CONNECTION_WAIT_TIME: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10],
  CONNECTION_USE_TIME: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10],
  PIPELINE_DURATION: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2.5, 5],
  HEALTHCHECK_DURATION: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2.5],
  PIPELINE_SIZE: [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000],
};
