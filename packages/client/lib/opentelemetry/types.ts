import {
  Attributes,
  Counter,
  Histogram,
  MeterProvider,
  ObservableGauge,
  UpDownCounter,
} from "@opentelemetry/api";
import { version } from "../../package.json";
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
  bucketsOperationDuration?: number[];
  bucketsConnectionCreateTime?: number[];
  bucketsConnectionWaitTime?: number[];
  bucketsStreamLag?: number[];
}

export interface OTelClientAttributes {
  host?: string;
  port?: string | number;
  db?: string | number;
  clientId?: string;
  parentId?: string;
  isPubSub?: boolean;
}

export interface ObservabilityConfig {
  metrics?: MetricConfig;
}

export interface MetricOptions extends Required<
  Omit<MetricConfig, "meterProvider" | "includeCommands" | "excludeCommands">
> {
  attributes: Attributes;
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
  dbClientConnectionCount: ObservableGauge<Attributes>;
  dbClientConnectionCreateTime: Histogram<Attributes>;
  redisClientConnectionRelaxedTimeout: UpDownCounter<Attributes>;
  redisClientConnectionHandoff: Counter<Attributes>;

  // Connection Advanced metrics
  dbClientConnectionPendingRequests: ObservableGauge<Attributes>;
  dbClientConnectionWaitTime: Histogram<Attributes>;
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
  redisClientCscItems: ObservableGauge<Attributes>;
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
  dbStoredProcedureName: "db.stored_procedure.name",
  dbClientConnectionPoolName: "db.client.connection.pool.name",
  dbClientConnectionState: "db.client.connection.state",

  // Redis-specific extensions
  redisClientLibrary: "redis.client.library",
  redisRedirectionKind: "redis.client.redirection.kind",
  redisClientErrorsInternal: "redis.client.errors.internal",
  redisClientErrorsCategory: "redis.client.errors.category",
  redisClientConnectionPubsub: "redis.client.connection.pubsub",
  redisClientConnectionCloseReason: "redis.client.connection.close.reason",
  redisClientCscResult: "redis.client.csc.result",
  redisClientCscReason: "redis.client.csc.reason",
  redisClientPubSubChannel: "redis.client.pubsub.channel",
  redisClientPubSubSharded: "redis.client.pubsub.sharded",
  redisClientPubSubMessageDirection: "redis.client.pubsub.message.direction",
  redisClientStreamName: "redis.client.stream.name",
  redisClientConsumerGroup: "redis.client.stream.consumer_group",
  redisClientOperationRetryAttempts: "redis.client.operation.retry_attempts",
  redisClientOperationBlocking: "redis.client.operation.blocking",
  redisClientConnectionNotification: "redis.client.connection.notification",
  redisClientParentId: "redis.client.parent.id",
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

export const INSTRUMENTATION_SCOPE_NAME = "node-redis";

export const DEFAULT_OTEL_ATTRIBUTES = {
  [OTEL_ATTRIBUTES.redisClientLibrary]: `node-redis:${version}`,
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

const DEFAULT_HISTOGRAM_BUCKET = [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10];

export const DEFAULT_HISTOGRAM_BUCKETS = {
  OPERATION_DURATION: DEFAULT_HISTOGRAM_BUCKET,
  CONNECTION_CREATE_TIME: DEFAULT_HISTOGRAM_BUCKET,
  CONNECTION_WAIT_TIME: DEFAULT_HISTOGRAM_BUCKET,
  CONNECTION_USE_TIME: DEFAULT_HISTOGRAM_BUCKET,
  STREAM_LAG: DEFAULT_HISTOGRAM_BUCKET,
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
    clientId?: string,
  ): (error?: Error) => void;

  createRecordBatchOperationDuration(
    operationName: "MULTI" | "PIPELINE",
    clientId?: string,
  ): (error?: Error) => void;
}

export interface IOTelConnectionBasicMetrics {
  createRecordConnectionCreateTime(clientId?: string): () => void;
  recordConnectionRelaxedTimeout(value: number, clientId?: string): void;
  recordConnectionHandoff(clientId?: string): void;
}

export interface IOTelConnectionAdvancedMetrics {
  recordConnectionClosed(
    reason: ConnectionCloseReason,
    clientId?: string,
  ): void;
  /**
   * Creates a closure to record connection wait time.
   * Call this when a client begins waiting for an available connection from the pool.
   * The returned function should be called when the connection becomes available.
   */
  createRecordConnectionWaitTime(): (clientId?: string) => void;
}

export interface IOTelResiliencyMetrics {
  recordClientErrors(
    error: Error,
    internal: boolean,
    clientId?: string,
    retryAttempts?: number,
  ): void;
  recordMaintenanceNotifications(notification: string, clientId?: string): void;
}

export interface IOTelClientSideCacheMetrics {
  recordCacheRequest(result: CscResult, clientId?: string): void;
  recordCacheEviction(
    reason: CscEvictionReason,
    count?: number,
    clientId?: string,
  ): void;
  recordNetworkBytesSaved(bytes: number, clientId?: string): void;
}

export interface IOTelPubSubMetrics {
  recordPubSubMessage(
    direction: "in" | "out",
    clientId: string,
    channel?: RedisArgument,
    sharded?: boolean,
  ): void;
}

export interface IOTelStreamMetrics {
  recordStreamLag(
    args: ReadonlyArray<RedisArgument>,
    reply: unknown,
    clientId?: string,
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
