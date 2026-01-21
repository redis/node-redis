import { Meter } from "@opentelemetry/api";
import { RedisArgument } from "../RESP/types";
import { Tail } from "../commands/generic-transformers";
import XADD, { parseXAddArguments } from "../commands/XADD";
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
import SPUBLISH from "../commands/SPUBLISH";
import PUBLISH from "../commands/PUBLISH";

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

  public recordConnectionCount(
    value: number,

    clientAttributes?: OTelClientAttributes,
  ) {
    this.#instruments.dbClientConnectionCount.add(value, {
      ...this.#options.attributes,
      ...parseClientAttributes(clientAttributes),
    });
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

  public recordPendingRequests(
    value: number,
    clientAttributes?: OTelClientAttributes,
  ) {
    this.#instruments.dbClientConnectionPendingRequests.add(value, {
      ...this.#options.attributes,
      ...parseClientAttributes(clientAttributes),
    });
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
   *
   * TODO: Not applicable in single-socket mode. Implement when connection pooling is added.
   * In single-socket mode, there is no pool to wait for, so this metric is not recorded.
   */
  public createRecordConnectionWaitTime(
    clientAttributes?: OTelClientAttributes,
  ): () => void {
    const startTime = performance.now();

    return () => {
      this.#instruments.dbClientConnectionWaitTime.record(
        (performance.now() - startTime) / 1000,
        {
          ...this.#options.attributes,
          ...parseClientAttributes(clientAttributes),
        },
      );
    };
  }

  /**
   * Creates a closure to record connection use time.
   *
   * TODO: Equals operation duration in single-socket mode. Implement separately when pooling is added.
   * In single-socket mode, the connection use time equals the operation duration.
   */
  public createRecordConnectionUseTime(
    clientAttributes?: OTelClientAttributes,
  ): () => void {
    const startTime = performance.now();

    return () => {
      this.#instruments.dbClientConnectionUseTime.record(
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

  public recordCacheItemsChange(
    delta: number,
    clientAttributes?: OTelClientAttributes,
  ) {
    this.#instruments.redisClientCscItems.add(delta, {
      ...this.#options.attributes,
      ...parseClientAttributes(clientAttributes),
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
    channel?: string,
    sharded?: boolean,
    clientAttributes?: OTelClientAttributes,
  ) {
    this.#instruments.redisClientPubsubMessages.add(1, {
      ...this.#options.attributes,
      ...parseClientAttributes(clientAttributes),
      [OTEL_ATTRIBUTES.redisClientPubSubMessageDirection]: direction,
      ...(channel !== undefined && !this.#options.hidePubSubChannelNames
        ? { [OTEL_ATTRIBUTES.redisClientPubSubChannel]: channel }
        : {}),
      ...(sharded !== undefined
        ? { [OTEL_ATTRIBUTES.redisClientPubSubSharded]: sharded }
        : {}),
    });
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
    stream: string,
    lagSec: number,
    clientAttributes?: OTelClientAttributes,
  ) {
    this.#instruments.redisClientStreamLag.record(lagSec, {
      ...this.#options.attributes,
      ...parseClientAttributes(clientAttributes),
      ...(!this.#options.hideStreamNames
        ? { [OTEL_ATTRIBUTES.redisClientStreamName]: stream }
        : {}),
    });
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

  /**
   * Wraps a command function with metrics recording if the command needs special metrics.
   * This is evaluated once at command creation time (factory-time), not on every command execution.
   * If the relevant metric group is not enabled, returns the original function unchanged.
   *
   * @param commandName - The Redis command name (e.g., 'PUBLISH', 'SPUBLISH', 'XADD')
   * @param fn - The original command function
   * @returns The wrapped function with metrics, or the original function if no metrics apply
   */
  static wrapWithMetrics(commandName: string, fn: Function) {
    switch (commandName.toUpperCase()) {
      case "PUBLISH":
        return async function (
          this: any,
          ...args: Tail<Parameters<(typeof PUBLISH)["parseCommand"]>>
        ) {
          const result = (await fn.call(this, ...args)) as ReturnType<
            (typeof PUBLISH)["transformReply"]
          >;
          try {
            const client = this._self ?? this;
            OTelMetrics.instance.pubSubMetrics.recordPubSubMessage(
              "out",
              args[0]?.toString(),
              false,
              client._getClientOTelAttributes(),
            );
          } catch (error) {
            // noop
          }
          return result;
        };
      case "SPUBLISH":
        return async function (
          this: any,
          ...args: Tail<Parameters<(typeof SPUBLISH)["parseCommand"]>>
        ) {
          const result = (await fn.call(this, ...args)) as ReturnType<
            (typeof SPUBLISH)["transformReply"]
          >;
          try {
            const client = this._self ?? this;
            OTelMetrics.instance.pubSubMetrics.recordPubSubMessage(
              "out",
              args[0]?.toString(),
              true,
              client._getClientOTelAttributes(),
            );
          } catch (error) {
            // noop
          }
          return result;
        };
      case "XADD":
        // TODO check if we need to add XADD_NOMKSTREAM
        return async function (
          this: any,
          ...args: Tail<Tail<Parameters<typeof parseXAddArguments>>>
        ) {
          const result = (await fn.call(this, ...args)) as ReturnType<
            (typeof XADD)["transformReply"]
          >;
          const rawId = result.toString();
          const [tsPart] = rawId.split("-");
          const messageTimestamp = Number.parseInt(tsPart, 10);

          if (Number.isFinite(messageTimestamp)) {
            const lagSeconds = (Date.now() - messageTimestamp) / 1000;
            const client = this._self ?? this;
            OTelMetrics.instance.streamMetrics.recordStreamLag(
              args[0]?.toString(),
              lagSeconds,
              client._getClientOTelAttributes(),
            );
          }
          return result;
        };
      default:
        // TODO check if we need to wrap other commands instead of recording in sendCommand
        return fn;
    }
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
      bucketsConnectionUseTime:
        config?.metrics?.bucketsConnectionUseTime ??
        DEFAULT_HISTOGRAM_BUCKETS.CONNECTION_WAIT_TIME,
      bucketsStreamLag:
        config?.metrics?.bucketsStreamLag ??
        DEFAULT_HISTOGRAM_BUCKETS.STREAM_LAG,
    };
  }

  private createHistorgram(
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

  private registerInstruments(
    meter: Meter,
    options: MetricOptions,
  ): MetricInstruments {
    return {
      // Command
      dbClientOperationDuration: this.createHistorgram(
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
      // TODO: Convert to Observable Gauge for accurate point-in-time reporting.
      // Observable Gauges use callback-based collection to report the current value on demand,
      // which is more appropriate for "current count" metrics. This requires architecture changes
      // to support callback-based gauge collection. See deferred items in PRD.
      dbClientConnectionCount: this.createUpDownCounter(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.dbClientConnectionCount,
          unit: "{connection}",
          description: "Current number of active connections in the pool",
          metricGroup: METRIC_GROUP.CONNECTION_BASIC,
        },
      ),
      dbClientConnectionCreateTime: this.createHistorgram(
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
      dbClientConnectionWaitTime: this.createHistorgram(
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
      dbClientConnectionUseTime: this.createHistorgram(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.dbClientConnectionUseTime,
          unit: "s",
          description:
            "Time a connection is actively used for executing operations",
          metricGroup: METRIC_GROUP.CONNECTION_ADVANCED,
          histogramBoundaries: options.bucketsConnectionUseTime,
        },
      ),
      // TODO: Convert to Observable Gauge for accurate point-in-time reporting.
      // Observable Gauges use callback-based collection to report the current value on demand,
      // which is more appropriate for "pending count" metrics. This requires architecture changes
      // to support callback-based gauge collection. See deferred items in PRD.
      dbClientConnectionPendingRequests: this.createUpDownCounter(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.dbClientConnectionPendingRequests,
          unit: "{request}",
          description: "Number of requests waiting for an available connection",
          metricGroup: METRIC_GROUP.CONNECTION_ADVANCED,
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
      redisClientStreamLag: this.createHistorgram(
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
      // TODO: Convert to Observable Gauge when architecture supports callback-based collection.
      // An Observable Gauge reports the current cache size on demand via a callback,
      // which is more appropriate for "current count" metrics.
      // See deferred items in PRD for full context.
      redisClientCscItems: this.createUpDownCounter(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.redisClientCscItems,
          unit: "{item}",
          description: "Current number of items in the client-side cache",
          metricGroup: METRIC_GROUP.CLIENT_SIDE_CACHING,
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
