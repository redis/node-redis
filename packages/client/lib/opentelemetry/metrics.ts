import { Meter, BatchObservableResult } from "@opentelemetry/api";
import { RedisArgument } from "../RESP/types";
import { ClientRegistry } from "./client-registry";
import {
  ConnectionCloseReason,
  CscEvictionReason,
  CscResult,
  DEFAULT_OTEL_ATTRIBUTES,
  MetricInstruments,
  ObservabilityConfig,
  OTEL_ATTRIBUTES,
  MetricOptions,
  DEFAULT_METRIC_GROUPS,
  DEFAULT_HISTOGRAM_BUCKETS,
  BaseInstrumentConfig,
  MetricGroup,
  METRIC_GROUP,
  METRIC_NAMES,
  HistogramInstrumentConfig,
  OTelClientAttributes,
  IOTelMetrics,
  IOTelCommandMetrics,
  IOTelConnectionBasicMetrics,
  IOTelConnectionAdvancedMetrics,
  IOTelResiliencyMetrics,
  IOTelClientSideCacheMetrics,
  IOTelPubSubMetrics,
  IOTelStreamMetrics,
} from "./types";
import { createNoopMeter } from "./noop-meter";
import { getErrorInfo, noopFunction, parseClientAttributes } from "./utils";
import {
  NoopClientSideCacheMetrics,
  NoopCommandMetrics,
  NoopConnectionAdvancedMetrics,
  NoopConnectionBasicMetrics,
  NoopOTelMetrics,
  NoopPubSubMetrics,
  NoopResiliencyMetrics,
  NoopStreamMetrics,
} from "./noop-metrics";

class OTelCommandMetrics implements IOTelCommandMetrics {
  readonly #instruments: MetricInstruments;
  readonly #options: MetricOptions;
  public readonly createRecordOperationDuration: (
    args: ReadonlyArray<RedisArgument>,
    clientAttributes?: OTelClientAttributes,
  ) => (error?: Error) => void;

  constructor(options: MetricOptions, instruments: MetricInstruments) {
    this.#options = options;
    this.#instruments = instruments;

    // Build the appropriate function based on options
    if (options.hasIncludeCommands || options.hasExcludeCommands) {
      // Version with filtering
      this.createRecordOperationDuration = this.#createWithFiltering.bind(this);
    } else {
      this.createRecordOperationDuration =
        this.#createWithoutFiltering.bind(this);
    }
  }

  #createWithFiltering(
    args: ReadonlyArray<RedisArgument>,
    clientAttributes?: OTelClientAttributes,
  ): (error?: Error) => void {
    const commandName = args[0]?.toString() || "UNKNOWN";

    if (this.isCommandExcluded(commandName)) {
      return noopFunction;
    }

    return this.#recordOperation(commandName, clientAttributes);
  }

  #createWithoutFiltering(
    args: ReadonlyArray<RedisArgument>,
    clientAttributes?: OTelClientAttributes,
  ): (error?: Error) => void {
    const commandName = args[0]?.toString() || "UNKNOWN";
    return this.#recordOperation(commandName, clientAttributes);
  }

  #recordOperation(
    commandName: string,
    clientAttributes?: OTelClientAttributes,
  ): (error?: Error) => void {
    const startTime = performance.now();

    return (error?: Error) => {
      const errorInfo = error ? getErrorInfo(error) : undefined;

      this.#instruments.dbClientOperationDuration.record(
        (performance.now() - startTime) / 1000,
        {
          ...this.#options.attributes,
          [OTEL_ATTRIBUTES.dbOperationName]: commandName,
          [OTEL_ATTRIBUTES.dbNamespace]: clientAttributes?.db,
          [OTEL_ATTRIBUTES.serverAddress]: clientAttributes?.host,
          [OTEL_ATTRIBUTES.serverPort]: clientAttributes?.port,
          ...(errorInfo
            ? {
                [OTEL_ATTRIBUTES.errorType]: errorInfo.errorType,
                [OTEL_ATTRIBUTES.redisClientErrorsCategory]: errorInfo.category,
                ...(errorInfo?.statusCode
                  ? {
                      [OTEL_ATTRIBUTES.dbResponseStatusCode]:
                        errorInfo.statusCode,
                    }
                  : {}),
              }
            : {}),
        },
      );
    };
  }

  createRecordBatchOperationDuration(
    operationName: "MULTI" | "PIPELINE",
    batchSize: number,
    clientAttributes?: OTelClientAttributes,
  ): (error?: Error) => void {
    const startTime = performance.now();

    return (error?: Error) => {
      const errorInfo = error ? getErrorInfo(error) : undefined;
      this.#instruments.dbClientOperationDuration.record(
        (performance.now() - startTime) / 1000,
        {
          ...this.#options.attributes,
          [OTEL_ATTRIBUTES.dbOperationName]: operationName,
          [OTEL_ATTRIBUTES.dbOperationBatchSize]: batchSize,
          [OTEL_ATTRIBUTES.dbNamespace]: clientAttributes?.db,
          [OTEL_ATTRIBUTES.serverAddress]: clientAttributes?.host,
          [OTEL_ATTRIBUTES.serverPort]: clientAttributes?.port,
          ...(errorInfo
            ? {
                [OTEL_ATTRIBUTES.errorType]: errorInfo.errorType,
                [OTEL_ATTRIBUTES.redisClientErrorsCategory]: errorInfo.category,
              }
            : {}),
          ...(errorInfo?.statusCode
            ? { [OTEL_ATTRIBUTES.dbResponseStatusCode]: errorInfo.statusCode }
            : {}),
        },
      );
    };
  }

  private isCommandExcluded(commandName: string) {
    return (
      (this.#options.hasIncludeCommands &&
        !this.#options.includeCommands[commandName]) ||
      this.#options.excludeCommands[commandName]
    );
  }
}

class OTelConnectionBasicMetrics implements IOTelConnectionBasicMetrics {
  readonly #instruments: MetricInstruments;
  readonly #options: MetricOptions;

  constructor(options: MetricOptions, instruments: MetricInstruments) {
    this.#options = options;
    this.#instruments = instruments;
  }

  public createRecordConnectionCreateTime(
    clientAttributes?: OTelClientAttributes,
  ): () => void {
    const startTime = performance.now();

    return () => {
      this.#instruments.dbClientConnectionCreateTime.record(
        (performance.now() - startTime) / 1000,
        {
          ...this.#options.attributes,
          ...parseClientAttributes(clientAttributes),
        },
      );
    };
  }
  public recordConnectionRelaxedTimeout(
    value: number,
    clientAttributes?: OTelClientAttributes,
  ) {
    this.#instruments.redisClientConnectionRelaxedTimeout.add(value, {
      ...this.#options.attributes,
      ...parseClientAttributes(clientAttributes),
    });
  }
  public recordConnectionHandoff(clientAttributes: OTelClientAttributes) {
    this.#instruments.redisClientConnectionHandoff.add(1, {
      ...this.#options.attributes,
      ...parseClientAttributes(clientAttributes),
    });
  }
}

class OTelConnectionAdvancedMetrics implements IOTelConnectionAdvancedMetrics {
  readonly #instruments: MetricInstruments;
  readonly #options: MetricOptions;

  constructor(options: MetricOptions, instruments: MetricInstruments) {
    this.#options = options;
    this.#instruments = instruments;
  }

  public recordConnectionClosed(
    reason: ConnectionCloseReason,
    clientAttributes?: OTelClientAttributes,
  ) {
    this.#instruments.redisClientConnectionClosed.add(1, {
      ...this.#options.attributes,
      ...parseClientAttributes(clientAttributes),
      [OTEL_ATTRIBUTES.redisClientConnectionCloseReason]: reason,
    });
  }

  /**
   * Creates a closure to record connection wait time.
   */
  public createRecordConnectionWaitTime(): () => void {
    const startTime = performance.now();

    return (clientAttributes?: OTelClientAttributes) => {
      this.#instruments.dbClientConnectionWaitTime.record(
        (performance.now() - startTime) / 1000,
        {
          ...this.#options.attributes,
          ...parseClientAttributes(clientAttributes),
        },
      );
    };
  }
}

class OTelResiliencyMetrics implements IOTelResiliencyMetrics {
  readonly #instruments: MetricInstruments;
  readonly #options: MetricOptions;

  constructor(options: MetricOptions, instruments: MetricInstruments) {
    this.#options = options;
    this.#instruments = instruments;
  }

  public recordClientErrors(
    error: Error,
    internal: boolean,
    clientAttributes?: OTelClientAttributes,
    retryAttempts?: number,
  ) {
    const errorInfo = getErrorInfo(error);
    this.#instruments.redisClientErrors.add(1, {
      ...this.#options.attributes,
      ...parseClientAttributes(clientAttributes),
      [OTEL_ATTRIBUTES.errorType]: errorInfo.errorType,
      [OTEL_ATTRIBUTES.redisClientErrorsCategory]: errorInfo.category,
      [OTEL_ATTRIBUTES.redisClientErrorsInternal]: internal,
      ...(retryAttempts !== undefined && {
        [OTEL_ATTRIBUTES.redisClientOperationRetryAttempts]: retryAttempts,
      }),
      ...(errorInfo.statusCode !== undefined && {
        [OTEL_ATTRIBUTES.dbResponseStatusCode]: errorInfo.statusCode,
      }),
    });
  }

  public recordMaintenanceNotifications(
    notification: string,
    clientAttributes?: OTelClientAttributes,
  ) {
    this.#instruments.redisClientMaintenanceNotifications.add(1, {
      ...this.#options.attributes,
      ...parseClientAttributes(clientAttributes),
      [OTEL_ATTRIBUTES.redisClientConnectionNotification]: notification,
    });
  }
}

class OTelClientSideCacheMetrics implements IOTelClientSideCacheMetrics {
  readonly #instruments: MetricInstruments;
  readonly #options: MetricOptions;

  constructor(options: MetricOptions, instruments: MetricInstruments) {
    this.#options = options;
    this.#instruments = instruments;
  }

  public recordCacheRequest(
    result: CscResult,
    clientAttributes?: OTelClientAttributes,
  ) {
    this.#instruments.redisClientCscRequests.add(1, {
      ...this.#options.attributes,
      ...parseClientAttributes(clientAttributes),
      [OTEL_ATTRIBUTES.redisClientCscResult]: result,
    });
  }

  public recordCacheEviction(
    reason: CscEvictionReason,
    count: number = 1,
    clientAttributes?: OTelClientAttributes,
  ) {
    this.#instruments.redisClientCscEvictions.add(count, {
      ...this.#options.attributes,
      ...parseClientAttributes(clientAttributes),
      [OTEL_ATTRIBUTES.redisClientCscReason]: reason,
    });
  }

  public recordNetworkBytesSaved(
    bytes: number,
    clientAttributes?: OTelClientAttributes,
  ) {
    this.#instruments.redisClientCscNetworkSaved.add(bytes, {
      ...this.#options.attributes,
      ...parseClientAttributes(clientAttributes),
    });
  }
}

class OTelPubSubMetrics implements IOTelPubSubMetrics {
  readonly #instruments: MetricInstruments;
  readonly #options: MetricOptions;

  constructor(options: MetricOptions, instruments: MetricInstruments) {
    this.#options = options;
    this.#instruments = instruments;
  }

  public recordPubSubMessage(
    direction: "in" | "out",
    channel?: RedisArgument,
    sharded?: boolean,
    clientAttributes?: OTelClientAttributes,
  ) {
    this.#instruments.redisClientPubsubMessages.add(
      1,
      {
        ...this.#options.attributes,
        ...parseClientAttributes(clientAttributes),
        [OTEL_ATTRIBUTES.redisClientPubSubMessageDirection]: direction,
        ...(channel !== undefined && !this.#options.hidePubSubChannelNames
          ? { [OTEL_ATTRIBUTES.redisClientPubSubChannel]: channel.toString() }
          : {}),
        ...(sharded !== undefined
          ? { [OTEL_ATTRIBUTES.redisClientPubSubSharded]: sharded }
          : {}),
      },
    );
  }
}

class OTelStreamMetrics implements IOTelStreamMetrics {
  readonly #instruments: MetricInstruments;
  readonly #options: MetricOptions;

  constructor(options: MetricOptions, instruments: MetricInstruments) {
    this.#options = options;
    this.#instruments = instruments;
  }

  public recordStreamLag(
    args: ReadonlyArray<RedisArgument>,
    reply: unknown,
    clientAttributes?: OTelClientAttributes,
  ) {
    if (!reply || !Array.isArray(reply) || reply.length === 0) {
      return;
    }

    const now = Date.now();

    // Extract consumer group and consumer name from XREADGROUP args
    // XREADGROUP args format: ['XREADGROUP', 'GROUP', group, consumer, ...]
    const isXReadGroup =
      args[0]?.toString().toUpperCase() === "XREADGROUP" &&
      args[1]?.toString().toUpperCase() === "GROUP";
    const consumerGroup = isXReadGroup ? args[2]?.toString() : undefined;
    const consumerName = isXReadGroup ? args[3]?.toString() : undefined;

    for (const streamData of reply) {
      if (!streamData || typeof streamData !== "object") {
        continue;
      }

      const { name: stream, messages } = streamData as {
        name: string;
        messages: Array<{ id: string; message: unknown }>;
      };

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        continue;
      }

      // Build common attributes for this stream
      const streamAttributes = {
        ...this.#options.attributes,
        ...parseClientAttributes(clientAttributes),
        ...(!this.#options.hideStreamNames
          ? { [OTEL_ATTRIBUTES.redisClientStreamName]: stream }
          : {}),
        ...(consumerGroup !== undefined
          ? { [OTEL_ATTRIBUTES.redisClientConsumerGroup]: consumerGroup }
          : {}),
        ...(consumerName !== undefined
          ? { [OTEL_ATTRIBUTES.redisClientConsumerName]: consumerName }
          : {}),
      };

      // Record lag for each message
      for (const message of messages) {
        if (!message?.id) {
          continue;
        }

        const [tsPart] = message.id.split("-");
        const messageTimestamp = Number.parseInt(tsPart, 10);

        if (!Number.isFinite(messageTimestamp)) {
          continue;
        }

        const lagSec = (now - messageTimestamp) / 1000;

        this.#instruments.redisClientStreamLag.record(lagSec, streamAttributes);
      }
    }
  }
}

export class OTelMetrics implements IOTelMetrics {
  // Create a noop instance by default
  static #instance: IOTelMetrics = new NoopOTelMetrics();
  static #initialized = false;

  readonly commandMetrics: IOTelCommandMetrics;
  readonly connectionBasicMetrics: IOTelConnectionBasicMetrics;
  readonly connectionAdvancedMetrics: IOTelConnectionAdvancedMetrics;
  readonly resiliencyMetrics: IOTelResiliencyMetrics;
  readonly clientSideCacheMetrics: IOTelClientSideCacheMetrics;
  readonly pubSubMetrics: IOTelPubSubMetrics;
  readonly streamMetrics: IOTelStreamMetrics;

  readonly #meter: Meter;
  readonly #instruments: MetricInstruments;
  readonly #options: MetricOptions;

  private constructor({
    api,
    config,
  }: {
    api?: typeof import("@opentelemetry/api");
    config?: ObservabilityConfig;
  }) {
    this.#options = this.parseOptions(config);
    this.#meter = this.getMeter(api, this.#options);
    this.#instruments = this.registerInstruments(this.#meter, this.#options);

    if (this.#options.enabledMetricGroups.includes(METRIC_GROUP.COMMAND)) {
      this.commandMetrics = new OTelCommandMetrics(
        this.#options,
        this.#instruments,
      );
    } else {
      this.commandMetrics = new NoopCommandMetrics();
    }

    if (
      this.#options.enabledMetricGroups.includes(METRIC_GROUP.CONNECTION_BASIC)
    ) {
      this.connectionBasicMetrics = new OTelConnectionBasicMetrics(
        this.#options,
        this.#instruments,
      );
    } else {
      this.connectionBasicMetrics = new NoopConnectionBasicMetrics();
    }

    if (
      this.#options.enabledMetricGroups.includes(
        METRIC_GROUP.CONNECTION_ADVANCED,
      )
    ) {
      this.connectionAdvancedMetrics = new OTelConnectionAdvancedMetrics(
        this.#options,
        this.#instruments,
      );
    } else {
      this.connectionAdvancedMetrics = new NoopConnectionAdvancedMetrics();
    }

    if (this.#options.enabledMetricGroups.includes(METRIC_GROUP.RESILIENCY)) {
      this.resiliencyMetrics = new OTelResiliencyMetrics(
        this.#options,
        this.#instruments,
      );
    } else {
      this.resiliencyMetrics = new NoopResiliencyMetrics();
    }

    if (
      this.#options.enabledMetricGroups.includes(
        METRIC_GROUP.CLIENT_SIDE_CACHING,
      )
    ) {
      this.clientSideCacheMetrics = new OTelClientSideCacheMetrics(
        this.#options,
        this.#instruments,
      );
    } else {
      this.clientSideCacheMetrics = new NoopClientSideCacheMetrics();
    }

    if (this.#options.enabledMetricGroups.includes(METRIC_GROUP.PUBSUB)) {
      this.pubSubMetrics = new OTelPubSubMetrics(
        this.#options,
        this.#instruments,
      );
    } else {
      this.pubSubMetrics = new NoopPubSubMetrics();
    }

    if (this.#options.enabledMetricGroups.includes(METRIC_GROUP.STREAMING)) {
      this.streamMetrics = new OTelStreamMetrics(
        this.#options,
        this.#instruments,
      );
    } else {
      this.streamMetrics = new NoopStreamMetrics();
    }
  }

  public static init({
    api,
    config,
  }: {
    api?: typeof import("@opentelemetry/api");
    config?: ObservabilityConfig;
  }) {
    if (OTelMetrics.#initialized) {
      throw new Error("OTelMetrics already initialized");
    }
    const instance = new OTelMetrics({ api, config });
    OTelMetrics.#instance = instance;
    OTelMetrics.#initialized = true;
  }

  /**
   * Reset the instance to noop. Used for testing.
   *
   * @internal
   */
  public static reset() {
    OTelMetrics.#instance = new OTelMetrics({
      api: undefined,
      config: undefined,
    });
    OTelMetrics.#initialized = false;
  }

  public static isInitialized() {
    return OTelMetrics.#initialized;
  }

  static get instance() {
    return OTelMetrics.#instance;
  }

  private getMeter(
    api: typeof import("@opentelemetry/api") | undefined,
    options: MetricOptions,
  ): Meter {
    if (!api || !options.enabled) {
      return createNoopMeter();
    }

    if (options?.meterProvider) {
      return options.meterProvider.getMeter(
        options.serviceName ??
          DEFAULT_OTEL_ATTRIBUTES[OTEL_ATTRIBUTES.redisClientLibrary],
      );
    }

    return api.metrics.getMeter(
      options.serviceName ??
        DEFAULT_OTEL_ATTRIBUTES[OTEL_ATTRIBUTES.redisClientLibrary],
    );
  }

  private parseOptions(config?: ObservabilityConfig) {
    return {
      enabled: !!config?.metrics?.enabled,
      attributes: {
        ...DEFAULT_OTEL_ATTRIBUTES,
        ...config?.resourceAttributes,
      },
      meterProvider: config?.metrics?.meterProvider,
      serviceName: config?.serviceName,
      includeCommands: (config?.metrics?.includeCommands ?? []).reduce<
        Record<string, true>
      >((acc, c) => {
        acc[c.toUpperCase()] = true;
        return acc;
      }, {}),
      hasIncludeCommands: !!config?.metrics?.includeCommands?.length,
      excludeCommands: (config?.metrics?.excludeCommands ?? []).reduce<
        Record<string, true>
      >((acc, c) => {
        acc[c.toUpperCase()] = true;
        return acc;
      }, {}),
      hasExcludeCommands: !!config?.metrics?.excludeCommands?.length,
      enabledMetricGroups:
        config?.metrics?.enabledMetricGroups ?? DEFAULT_METRIC_GROUPS,
      hidePubSubChannelNames: config?.metrics?.hidePubSubChannelNames ?? false,
      hideStreamNames: config?.metrics?.hideStreamNames ?? false,
      histAggregation:
        config?.metrics?.histAggregation ?? "explicit_bucket_histogram",
      bucketsOperationDuration:
        config?.metrics?.bucketsOperationDuration ??
        DEFAULT_HISTOGRAM_BUCKETS.OPERATION_DURATION,
      bucketsConnectionCreateTime:
        config?.metrics?.bucketsConnectionCreateTime ??
        DEFAULT_HISTOGRAM_BUCKETS.CONNECTION_CREATE_TIME,
      bucketsConnectionWaitTime:
        config?.metrics?.bucketsConnectionWaitTime ??
        DEFAULT_HISTOGRAM_BUCKETS.CONNECTION_WAIT_TIME,
      bucketsStreamLag:
        config?.metrics?.bucketsStreamLag ??
        DEFAULT_HISTOGRAM_BUCKETS.STREAM_LAG,
    };
  }

  private createHistogram(
    meter: Meter,
    enabledMetricGroups: MetricGroup[],
    instrumentConfig: HistogramInstrumentConfig,
  ) {
    const isEnabled = enabledMetricGroups.includes(
      instrumentConfig.metricGroup,
    );

    if (!isEnabled) {
      return createNoopMeter().createHistogram(instrumentConfig.name);
    }

    return meter.createHistogram(instrumentConfig.name, {
      unit: instrumentConfig.unit,
      description: instrumentConfig.description,
      ...(instrumentConfig?.histogramBoundaries?.length
        ? {
            advice: {
              explicitBucketBoundaries: instrumentConfig.histogramBoundaries,
            },
          }
        : {}),
    });
  }

  private createCounter(
    meter: Meter,
    enabledMetricGroups: MetricGroup[],
    instrumentConfig: BaseInstrumentConfig,
  ) {
    const isEnabled = enabledMetricGroups.includes(
      instrumentConfig.metricGroup,
    );

    if (!isEnabled) {
      return createNoopMeter().createCounter(instrumentConfig.name);
    }

    return meter.createCounter(instrumentConfig.name, {
      unit: instrumentConfig.unit,
      description: instrumentConfig.description,
    });
  }

  private createUpDownCounter(
    meter: Meter,
    enabledMetricGroups: MetricGroup[],
    instrumentConfig: BaseInstrumentConfig,
  ) {
    const isEnabled = enabledMetricGroups.includes(
      instrumentConfig.metricGroup,
    );

    if (!isEnabled) {
      return createNoopMeter().createUpDownCounter(instrumentConfig.name);
    }

    return meter.createUpDownCounter(instrumentConfig.name, {
      unit: instrumentConfig.unit,
      description: instrumentConfig.description,
    });
  }

  private createObservableGaugeWithCallback(
    meter: Meter,
    enabledMetricGroups: MetricGroup[],
    instrumentConfig: BaseInstrumentConfig,
    options: MetricOptions,
    callback: (
      observableResult: BatchObservableResult,
      options: MetricOptions,
    ) => void,
  ) {
    const isEnabled = enabledMetricGroups.includes(
      instrumentConfig.metricGroup,
    );

    if (!isEnabled) {
      return createNoopMeter().createObservableGauge(instrumentConfig.name);
    }

    const gauge = meter.createObservableGauge(instrumentConfig.name, {
      unit: instrumentConfig.unit,
      description: instrumentConfig.description,
    });

    meter.addBatchObservableCallback(
      (observableResult) => callback(observableResult, options),
      [gauge],
    );

    return gauge;
  }

  private registerInstruments(
    meter: Meter,
    options: MetricOptions,
  ): MetricInstruments {
    return {
      // Command
      dbClientOperationDuration: this.createHistogram(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.dbClientOperationDuration,
          unit: "s",
          description:
            "Duration of a Redis client operation (includes retries)",
          metricGroup: METRIC_GROUP.COMMAND,
          histogramBoundaries: options.bucketsOperationDuration,
        },
      ),
      // Basic connection
      // Observable Gauge: emits 1 per registered client (each client = 1 connection)
      dbClientConnectionCount: this.createObservableGaugeWithCallback(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.dbClientConnectionCount,
          unit: "{connection}",
          description: "Current number of active connections",
          metricGroup: METRIC_GROUP.CONNECTION_BASIC,
        },
        options,
        (observableResult, opts) => {
          for (const handle of ClientRegistry.instance.getAll()) {
            if (!handle.isConnected()) {
              continue;
            }

            const attributes = handle.getAttributes();
            const isUsed = handle.getPendingRequests() > 0;

            observableResult.observe(
              this.#instruments.dbClientConnectionCount,
              1,
              {
                ...opts.attributes,
                ...parseClientAttributes(attributes),
                [OTEL_ATTRIBUTES.dbClientConnectionState]: isUsed
                  ? "used"
                  : "idle",
                [OTEL_ATTRIBUTES.redisClientConnectionPubsub]:
                  attributes.isPubSub ?? false,
              },
            );
          }
        },
      ),
      dbClientConnectionCreateTime: this.createHistogram(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.dbClientConnectionCreateTime,
          unit: "s",
          description:
            "Time taken to create a new connection to the Redis server",
          metricGroup: METRIC_GROUP.CONNECTION_BASIC,
          histogramBoundaries: options.bucketsConnectionCreateTime,
        },
      ),
      redisClientConnectionRelaxedTimeout: this.createUpDownCounter(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.redisClientConnectionRelaxedTimeout,
          unit: "{relaxation}",
          description: `How many times the connection timeout has been increased/decreased (after a server maintenance notification).
           Counts up for relaxed timeout, counts down for unrelaxed timeout`,
          metricGroup: METRIC_GROUP.CONNECTION_BASIC,
        },
      ),
      redisClientConnectionHandoff: this.createCounter(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.redisClientConnectionHandoff,
          unit: "{handoff}",
          description:
            "Connections that have been handed off to another node (e.g after a MOVING notification)",
          metricGroup: METRIC_GROUP.CONNECTION_BASIC,
        },
      ),
      // Advanced connection
      dbClientConnectionWaitTime: this.createHistogram(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.dbClientConnectionWaitTime,
          unit: "s",
          description:
            "Time spent waiting for an available connection from the pool",
          metricGroup: METRIC_GROUP.CONNECTION_ADVANCED,
          histogramBoundaries: options.bucketsConnectionWaitTime,
        },
      ),
      dbClientConnectionPendingRequests: this.createObservableGaugeWithCallback(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.dbClientConnectionPendingRequests,
          unit: "{request}",
          description: "Current number of pending requests per connection",
          metricGroup: METRIC_GROUP.CONNECTION_ADVANCED,
        },
        options,
        (observableResult, opts) => {
          for (const handle of ClientRegistry.instance.getAll()) {
            observableResult.observe(
              this.#instruments.dbClientConnectionPendingRequests,
              handle.getPendingRequests(),
              {
                ...opts.attributes,
                ...parseClientAttributes(handle.getAttributes()),
              },
            );
          }
        },
      ),
      redisClientConnectionClosed: this.createCounter(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.redisClientConnectionClosed,
          unit: "{connection}",
          description: "Total number of closed connections",
          metricGroup: METRIC_GROUP.CONNECTION_ADVANCED,
        },
      ),
      // Resiliency
      redisClientErrors: this.createCounter(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.redisClientErrors,
          unit: "{error}",
          description:
            "A counter of all errors (both returned and handled internally)",
          metricGroup: METRIC_GROUP.RESILIENCY,
        },
      ),
      redisClientMaintenanceNotifications: this.createCounter(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.redisClientMaintenanceNotifications,
          unit: "{notification}",
          description: "Number of maintenance notifications received",
          metricGroup: METRIC_GROUP.RESILIENCY,
        },
      ),
      // PubSub
      redisClientPubsubMessages: this.createCounter(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.redisClientPubsubMessages,
          unit: "{message}",
          description: "Number of pub/sub messages processed",
          metricGroup: METRIC_GROUP.PUBSUB,
        },
      ),
      // Streams
      redisClientStreamLag: this.createHistogram(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.redisClientStreamLag,
          unit: "s",
          description: "End-to-end lag per message",
          metricGroup: METRIC_GROUP.STREAMING,
          histogramBoundaries: options.bucketsStreamLag,
        },
      ),
      // Client-Side Caching
      redisClientCscRequests: this.createCounter(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.redisClientCscRequests,
          unit: "{request}",
          description: "Number of client-side cache requests (hits and misses)",
          metricGroup: METRIC_GROUP.CLIENT_SIDE_CACHING,
        },
      ),
      redisClientCscItems: this.createObservableGaugeWithCallback(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.redisClientCscItems,
          unit: "{item}",
          description: "Current number of items in the client-side cache",
          metricGroup: METRIC_GROUP.CLIENT_SIDE_CACHING,
        },
        options,
        (observableResult, opts) => {
          for (const handle of ClientRegistry.instance.getAll()) {
            observableResult.observe(
              this.#instruments.redisClientCscItems,
              handle.getCacheItemCount(),
              {
                ...opts.attributes,
                ...parseClientAttributes(handle.getAttributes()),
              },
            );
          }
        },
      ),
      redisClientCscEvictions: this.createCounter(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.redisClientCscEvictions,
          unit: "{eviction}",
          description: "Number of items evicted from the client-side cache",
          metricGroup: METRIC_GROUP.CLIENT_SIDE_CACHING,
        },
      ),
      redisClientCscNetworkSaved: this.createCounter(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.redisClientCscNetworkSaved,
          unit: "By",
          description: "Estimated bytes saved by client-side cache hits",
          metricGroup: METRIC_GROUP.CLIENT_SIDE_CACHING,
        },
      ),
    } as const;
  }
}
