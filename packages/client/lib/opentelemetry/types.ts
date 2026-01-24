import {
  Attributes,
  Counter,
  Histogram,
  MeterProvider,
  UpDownCounter,
} from "@opentelemetry/api";
import { RedisArgument } from "../RESP/types";

export const METRIC_GROUP = {
  COMMAND: "command",
  CONNECTION_BASIC: "connection-basic",
  CONNECTION_ADVANCED: "connection-advanced",
  RESILIENCY: "resiliency",
  PUBSUB: "pubsub",
  STREAMING: "streaming",
  CLIENT_SIDE_CACHING: "client-side-caching",
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
  bucketsStreamLag?: number[];
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

export interface MetricOptions extends Required<
  Omit<MetricConfig, "meterProvider" | "includeCommands" | "excludeCommands">
> {
  attributes: Attributes;
  serviceName?: string;
  meterProvider?: MeterProvider;
  includeCommands: Record<string, true>;
  excludeCommands: Record<string, true>;
  hasIncludeCommands: boolean;
  hasExcludeCommands: boolean;
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
  dbClientConnectionWaitTime: Histogram<Attributes>;
  dbClientConnectionUseTime: Histogram<Attributes>;
  redisClientConnectionClosed: Counter<Attributes>;

  // Resiliency
  redisClientErrors: Counter<Attributes>;
  redisClientMaintenanceNotifications: Counter<Attributes>;

  // PubSub metrics
  redisClientPubsubMessages: Counter<Attributes>;

  // Stream metrics
  redisClientStreamLag: Histogram<Attributes>;

  // Client-Side Caching metrics
  redisClientCscRequests: Counter<Attributes>;
  redisClientCscItems: UpDownCounter<Attributes>;
  redisClientCscEvictions: Counter<Attributes>;
  redisClientCscNetworkSaved: Counter<Attributes>;
}>;

export const OTEL_ATTRIBUTES = {
  // Database & network
  dbSystemName: "db.system.name",
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
  dbClientConnectionPoolName: "db.client.connection.pool.name",
  dbClientConnectionState: "db.client.connection.state",

  // Redis-specific extensions
  redisClientLibrary: "redis.client.library",
  redisRedirectionKind: "redis.client.redirection.kind",
  redisClientErrorsInternal: "redis.client.errors.internal",
  redisClientErrorsCategory: "redis.client.errors.category",
  redisClientConnectionCloseReason: "redis.client.connection.close.reason",
  redisClientCscResult: "redis.client.csc.result",
  redisClientCscReason: "redis.client.csc.reason",
  redisClientPubSubChannel: "redis.client.pubsub.channel",
  redisClientPubSubSharded: "redis.client.pubsub.sharded",
  redisClientPubSubMessageDirection: "redis.client.pubsub.message.direction",
  redisClientStreamName: "redis.client.stream.name",
  redisClientConsumerGroup: "redis.client.consumer_group",
  redisClientConsumerName: "redis.client.consumer_name",
  redisClientOperationRetryAttempts: "redis.client.operation.retry_attempts",
  redisClientOperationBlocking: "redis.client.operation.blocking",
  redisClientConnectionNotification: "redis.client.connection.notification",
} as const;

export const ERROR_CATEGORY = {
  NETWORK: "network",
  TLS: "tls",
  AUTH: "auth",
  SERVER: "server",
  OTHER: "other",
} as const;

export type ErrorCategory =
  (typeof ERROR_CATEGORY)[keyof typeof ERROR_CATEGORY];

export const CONNECTION_CLOSE_REASON = {
  APPLICATION_CLOSE: "application_close",
  POOL_EVICTION_IDLE: "pool_eviction_idle",
  SERVER_CLOSE: "server_close",
  ERROR: "error",
  HEALTHCHECK_FAILED: "healthcheck_failed",
} as const;

export type ConnectionCloseReason =
  (typeof CONNECTION_CLOSE_REASON)[keyof typeof CONNECTION_CLOSE_REASON];

export const CSC_RESULT = {
  HIT: "hit",
  MISS: "miss",
} as const;

export type CscResult = (typeof CSC_RESULT)[keyof typeof CSC_RESULT];

export const CSC_EVICTION_REASON = {
  FULL: "full",
  INVALIDATION: "invalidation",
  TTL: "ttl",
} as const;

export type CscEvictionReason =
  (typeof CSC_EVICTION_REASON)[keyof typeof CSC_EVICTION_REASON];

export const DEFAULT_OTEL_ATTRIBUTES = {
  [OTEL_ATTRIBUTES.redisClientLibrary]: "node-redis",
  [OTEL_ATTRIBUTES.dbSystemName]: "redis",
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
  dbClientConnectionWaitTime: "db.client.connection.wait_time",
  dbClientConnectionUseTime: "db.client.connection.use_time",
  redisClientConnectionClosed: "redis.client.connection.closed",

  // Resiliency metrics
  redisClientErrors: "redis.client.errors",
  redisClientMaintenanceNotifications: "redis.client.maintenance.notifications",

  // PubSub metrics
  redisClientPubsubMessages: "redis.client.pubsub.messages",

  // Stream metrics
  redisClientStreamLag: "redis.client.stream.lag",

  // Client-Side Caching metrics
  redisClientCscRequests: "redis.client.csc.requests",
  redisClientCscItems: "redis.client.csc.items",
  redisClientCscEvictions: "redis.client.csc.evictions",
  redisClientCscNetworkSaved: "redis.client.csc.network_saved",
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
  "connection-basic",
  "resiliency",
];

export const DEFAULT_HISTOGRAM_BUCKETS = {
  OPERATION_DURATION: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10],
  CONNECTION_CREATE_TIME: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10],
  CONNECTION_WAIT_TIME: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10],
  CONNECTION_USE_TIME: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10],
  STREAM_LAG: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10],
};

export const METRIC_ERROR_TYPE = {
  MOVED: "MOVED",
  ASK: "ASK",
  HANDSHAKE_FAILED: "HANDSHAKE_FAILED",
} as const;

export type MetricErrorType =
  (typeof METRIC_ERROR_TYPE)[keyof typeof METRIC_ERROR_TYPE];

export interface IOTelCommandMetrics {
  createRecordOperationDuration(
    args: ReadonlyArray<RedisArgument>,
    clientAttributes?: OTelClientAttributes,
  ): (error?: Error) => void;

  createRecordBatchOperationDuration(
    operationName: "MULTI" | "PIPELINE",
    batchSize: number,
    clientAttributes?: OTelClientAttributes,
  ): (error?: Error) => void;
}

export interface IOTelConnectionBasicMetrics {
  recordConnectionCount(
    value: number,
    clientAttributes?: OTelClientAttributes,
  ): void;
  createRecordConnectionCreateTime(
    clientAttributes?: OTelClientAttributes,
  ): () => void;
  recordConnectionRelaxedTimeout(
    value: number,
    clientAttributes?: OTelClientAttributes,
  ): void;
  recordConnectionHandoff(clientAttributes: OTelClientAttributes): void;
}

export interface IOTelConnectionAdvancedMetrics {
  recordPendingRequests(
    value: number,
    clientAttributes?: OTelClientAttributes,
  ): void;
  recordConnectionClosed(
    reason: ConnectionCloseReason,
    clientAttributes?: OTelClientAttributes,
  ): void;
  /**
   * Creates a closure to record connection wait time.
   * Call this when a client begins waiting for an available connection from the pool.
   * The returned function should be called when the connection becomes available.
   *
   * TODO: Not applicable in single-socket mode. Implement when connection pooling is added.
   */
  createRecordConnectionWaitTime(
    clientAttributes?: OTelClientAttributes,
  ): () => void;
  /**
   * Creates a closure to record connection use time.
   * Call this when a connection is acquired from the pool for an operation.
   * The returned function should be called when the connection is released back to the pool.
   *
   * TODO: Equals operation duration in single-socket mode. Implement separately when pooling is added.
   */
  createRecordConnectionUseTime(
    clientAttributes?: OTelClientAttributes,
  ): () => void;
}

export interface IOTelResiliencyMetrics {
  recordClientErrors(
    error: Error,
    internal: boolean,
    clientAttributes?: OTelClientAttributes,
    retryAttempts?: number,
  ): void;
  recordMaintenanceNotifications(
    notification: string,
    clientAttributes?: OTelClientAttributes,
  ): void;
}

export interface IOTelClientSideCacheMetrics {
  recordCacheRequest(
    result: CscResult,
    clientAttributes?: OTelClientAttributes,
  ): void;
  recordCacheItemsChange(
    delta: number,
    clientAttributes?: OTelClientAttributes,
  ): void;
  recordCacheEviction(
    reason: CscEvictionReason,
    count?: number,
    clientAttributes?: OTelClientAttributes,
  ): void;
  recordNetworkBytesSaved(
    bytes: number,
    clientAttributes?: OTelClientAttributes,
  ): void;
}

export interface IOTelPubSubMetrics {
  recordPubSubMessage(
    direction: "in" | "out",
    channel?: RedisArgument,
    sharded?: boolean,
    clientAttributes?: OTelClientAttributes,
  ): void;
}

export interface IOTelStreamMetrics {
  recordStreamLag(
    args: ReadonlyArray<RedisArgument>,
    reply: unknown,
    clientAttributes?: OTelClientAttributes,
  ): void;
}

export interface IOTelMetrics {
  commandMetrics: IOTelCommandMetrics;
  connectionBasicMetrics: IOTelConnectionBasicMetrics;
  connectionAdvancedMetrics: IOTelConnectionAdvancedMetrics;
  resiliencyMetrics: IOTelResiliencyMetrics;
  clientSideCacheMetrics: IOTelClientSideCacheMetrics;
  pubSubMetrics: IOTelPubSubMetrics;
  streamMetrics: IOTelStreamMetrics;
}
