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

export interface OTelClientAttributes {
  host?: string;
  port?: string | number;
  db?: string | number;
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
  // Command metrics
  dbClientOperationDuration: Histogram<Attributes>;

  // Connection Basic metrics
  dbClientConnectionCount: UpDownCounter<Attributes>;
  dbClientConnectionCreateTime: Histogram<Attributes>;
  redisClientConnectionRelaxedTimeout: UpDownCounter<Attributes>;
  redisClientConnectionHandoff: Counter<Attributes>;

  // Connection Advanced metrics
  dbClientConnectionPendingRequests: UpDownCounter<Attributes>;
  dbClientConnectionTimeouts: Counter<Attributes>;
  dbClientConnectionWaitTime: Histogram<Attributes>;
  dbClientConnectionUseTime: Histogram<Attributes>;
  redisClientConnectionClosed: Counter<Attributes>;

  // Resiliency
  redisClientErrorsHandled: Counter<Attributes>;
  redisClientMaintenanceNotifications: Counter<Attributes>;

  // Pipeline metrics
  redisClientPipelineDuration: Histogram<Attributes>;

  // Healthcheck metrics
  redisClientHealthcheckDuration: Histogram<Attributes>;

  // PubSub metrics
  redisClientPubsubMessages: Counter<Attributes>;

  // Stream metrics
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
  redisClientConnectionNotification: "redis.client.connection.notification",
} as const;

export const DEFAULT_OTEL_ATTRIBUTES = {
  [OTEL_ATTRIBUTES.redisClientLibrary]: "node-redis",
  [OTEL_ATTRIBUTES.dbSystem]: "redis",
} as const;

export const METRIC_NAMES = {
  // Command metrics
  dbClientOperationDuration: "db.client.operation.duration",

  // Connection metrics
  dbClientConnectionCount: "db.client.connection.count",
  dbClientConnectionCreateTime: "db.client.connection.create_time",
  redisClientConnectionRelaxedTimeout:
    "redis.client.connection.relaxed_timeout",
  redisClientConnectionHandoff: "redis.client.connection.handoff",

  // Connection Advanced metrics
  dbClientConnectionPendingRequests: "db.client.connection.pending_requests",
  dbClientConnectionTimeouts: "db.client.connection.timeouts",
  dbClientConnectionWaitTime: "db.client.connection.wait_time",
  dbClientConnectionUseTime: "db.client.connection.use_time",
  redisClientConnectionClosed: "redis.client.connection.closed",

  // Resiliency metrics
  redisClientErrorsHandled: "redis.client.errors.handled",
  redisClientMaintenanceNotifications: "redis.client.maintenance.notifications",

  // Pipeline metrics
  redisClientPipelineDuration: "redis.client.pipeline.duration",

  // Healthcheck metrics
  redisClientHealthcheckDuration: "redis.client.healthcheck.duration",

  // PubSub metrics
  redisClientPubsubMessages: "redis.client.pubsub.messages",

  // Stream metrics
  redisClientStreamProduced: "redis.client.stream.produce.messages",
} as const;

export type BaseInstrumentConfig = {
  name: string;
  unit: string;
  description: string;
  metricGroup: MetricGroup;
};

export type HistogramInstrumentConfig = BaseInstrumentConfig & {
  histogramBoundaries: number[];
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

export const METRIC_ERROR_TYPE = {
  MOVED: "MOVED",
  ASK: "ASK",
  HANDSHAKE_FAILED: "HANDSHAKE_FAILED",
} as const;

export type MetricErrorType =
  (typeof METRIC_ERROR_TYPE)[keyof typeof METRIC_ERROR_TYPE];
