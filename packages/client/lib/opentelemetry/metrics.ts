import { Meter } from "@opentelemetry/api";
import { RedisArgument } from "../RESP/types";
import {
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
  MetricErrorType,
  OTelClientAttributes,
  IOTelMetrics,
} from "./types";
import { createNoopMeter } from "./noop-meter";
import { noopFunction } from "./utils";
import { NoopOTelMetrics } from "./noop-metrics";

export class OTelMetrics implements IOTelMetrics {
  // Create a noop instance by default
  static #instance: IOTelMetrics = new NoopOTelMetrics();
  static #initialized = false;

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
    OTelMetrics.#instance = new OTelMetrics({ api, config });
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

  public createRecordOperationDuration(
    args: ReadonlyArray<RedisArgument>,
    clientAttributes?: OTelClientAttributes
  ): (error?: Error) => void {
    const commandName = args[0]?.toString() || "UNKNOWN";

    if (
      this.isCommandExcluded(commandName) ||
      !this.#options.enabledMetricGroups.includes(METRIC_GROUP.COMMAND)
    ) {
      return noopFunction;
    }

    const startTime = performance.now();

    const baseAttributes = {
      [OTEL_ATTRIBUTES.dbOperationName]: commandName,
      ...this.parseClientAttributes(clientAttributes),
    };

    return (error?: Error) => {
      this.#instruments.dbClientOperationDuration.record(
        (performance.now() - startTime) / 1000, // convert to seconds
        {
          ...this.#options.attributes,
          ...baseAttributes,
          // TODO add error types
          ...(error ? { [OTEL_ATTRIBUTES.errorType]: error.message } : {}),
        }
      );
    };
  }

  public recordConnectionCount(
    value: number,
    clientAttributes?: OTelClientAttributes
  ) {
    this.#instruments.dbClientConnectionCount.add(value, {
      ...this.#options.attributes,
      ...this.parseClientAttributes(clientAttributes),
    });
  }

  public recordConnectionCreateTime(
    durationMs: number,
    clientAttributes?: OTelClientAttributes
  ) {
    this.#instruments.dbClientConnectionCreateTime.record(
      durationMs / 1000, // convert to seconds
      {
        ...this.#options.attributes,
        ...this.parseClientAttributes(clientAttributes),
      }
    );
  }

  public recordConnectionRelaxedTimeout(
    value: number,
    clientAttributes?: OTelClientAttributes
  ) {
    this.#instruments.redisClientConnectionRelaxedTimeout.add(value, {
      ...this.#options.attributes,
      ...this.parseClientAttributes(clientAttributes),
    });
  }

  public recordConnectionHandoff(clientAttributes: OTelClientAttributes) {
    this.#instruments.redisClientConnectionHandoff.add(1, {
      ...this.#options.attributes,
      ...this.parseClientAttributes(clientAttributes),
    });
  }

  public recordClientErrorsHandled(
    type: MetricErrorType,
    clientAttributes?: OTelClientAttributes
  ) {
    this.#instruments.redisClientErrorsHandled.add(1, {
      ...this.#options.attributes,
      ...this.parseClientAttributes(clientAttributes),
      [OTEL_ATTRIBUTES.errorType]: type,
    });
  }

  public recordMaintenanceNotifications(
    clientAttributes: OTelClientAttributes
  ) {
    this.#instruments.redisClientMaintenanceNotifications.add(1, {
      ...this.#options.attributes,
      [OTEL_ATTRIBUTES.dbNamespace]: clientAttributes.db,
      [OTEL_ATTRIBUTES.serverAddress]: clientAttributes.host,
      [OTEL_ATTRIBUTES.serverPort]: clientAttributes.port,
    });
  }

  public recordPendingRequests(
    value: number,
    clientAttributes?: OTelClientAttributes
  ) {
    this.#instruments.dbClientConnectionPendingRequests.add(value, {
      ...this.#options.attributes,
      ...this.parseClientAttributes(clientAttributes),
    });
  }

  private parseClientAttributes(clientAttributes?: OTelClientAttributes) {
    return {
      ...(clientAttributes?.db === undefined
        ? {}
        : {
            [OTEL_ATTRIBUTES.dbNamespace]: clientAttributes.db.toString(),
          }),
      ...(clientAttributes?.host && {
        [OTEL_ATTRIBUTES.serverAddress]: clientAttributes.host,
      }),
      ...(clientAttributes?.port && {
        [OTEL_ATTRIBUTES.serverPort]: clientAttributes.port.toString(),
      }),
    };
  }

  private isCommandExcluded(commandName: string) {
    return (
      (this.#options.includeCommands.length > 0 &&
        !this.#options.includeCommands.includes(commandName)) ||
      this.#options.excludeCommands.includes(commandName)
    );
  }

  private getMeter(
    api: typeof import("@opentelemetry/api") | undefined,
    options: MetricOptions
  ): Meter {
    if (!api || !options.enabled) {
      return createNoopMeter();
    }

    if (options?.meterProvider) {
      return options.meterProvider.getMeter(
        options.serviceName ??
          DEFAULT_OTEL_ATTRIBUTES[OTEL_ATTRIBUTES.redisClientLibrary]
      );
    }

    return api.metrics.getMeter(
      options.serviceName ??
        DEFAULT_OTEL_ATTRIBUTES[OTEL_ATTRIBUTES.redisClientLibrary]
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
      includeCommands:
        config?.metrics?.includeCommands?.map((c) => c.toUpperCase()) ?? [],
      excludeCommands:
        config?.metrics?.excludeCommands?.map((c) => c.toUpperCase()) ?? [],
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
      bucketsPipelineDuration:
        config?.metrics?.bucketsPipelineDuration ??
        DEFAULT_HISTOGRAM_BUCKETS.PIPELINE_DURATION,
      bucketsHealthcheckDuration:
        config?.metrics?.bucketsHealthcheckDuration ??
        DEFAULT_HISTOGRAM_BUCKETS.HEALTHCHECK_DURATION,
      bucketsPipelineSize:
        config?.metrics?.bucketsPipelineSize ??
        DEFAULT_HISTOGRAM_BUCKETS.PIPELINE_SIZE,
    };
  }

  private createHistorgram(
    meter: Meter,
    enabledMetricGroups: MetricGroup[],
    instrumentConfig: HistogramInstrumentConfig
  ) {
    const isEnabled = enabledMetricGroups.includes(
      instrumentConfig.metricGroup
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
    instrumentConfig: BaseInstrumentConfig
  ) {
    const isEnabled = enabledMetricGroups.includes(
      instrumentConfig.metricGroup
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
    instrumentConfig: BaseInstrumentConfig
  ) {
    const isEnabled = enabledMetricGroups.includes(
      instrumentConfig.metricGroup
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
    options: MetricOptions
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
        }
      ),
      // Basic connection
      dbClientConnectionCount: this.createUpDownCounter(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.dbClientConnectionCount,
          unit: "{connection}",
          description: "Current number of active connections in the pool",
          metricGroup: METRIC_GROUP.CONNECTION_BASIC,
        }
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
        }
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
        }
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
        }
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
        }
      ),
      dbClientConnectionTimeouts: this.createCounter(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.dbClientConnectionTimeouts,
          unit: "{timeout}",
          description: "Number of connection timeout events",
          metricGroup: METRIC_GROUP.CONNECTION_ADVANCED,
        }
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
        }
      ),
      dbClientConnectionPendingRequests: this.createUpDownCounter(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.dbClientConnectionPendingRequests,
          unit: "{request}",
          description: "Number of requests waiting for an available connection",
          metricGroup: METRIC_GROUP.CONNECTION_ADVANCED,
        }
      ),
      redisClientConnectionClosed: this.createCounter(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.redisClientConnectionClosed,
          unit: "{connection}",
          description: "Total number of closed connections",
          metricGroup: METRIC_GROUP.CONNECTION_ADVANCED,
        }
      ),
      // Pipeline
      redisClientPipelineDuration: this.createHistorgram(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.redisClientPipelineDuration,
          unit: "s",
          description: "Duration of pipeline execution",
          metricGroup: METRIC_GROUP.PIPELINE,
          histogramBoundaries: options.bucketsPipelineDuration,
        }
      ),
      // Healthcheck
      redisClientHealthcheckDuration: this.createHistorgram(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.redisClientHealthcheckDuration,
          unit: "s",
          description: "Duration of health check operations",
          metricGroup: METRIC_GROUP.HEALTHCHECK,
          histogramBoundaries: options.bucketsHealthcheckDuration,
        }
      ),
      // Resiliency
      redisClientErrorsHandled: this.createCounter(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.redisClientErrorsHandled,
          unit: "{error}",
          description: "Number of errors handled by the Redis client",
          metricGroup: METRIC_GROUP.RESILIENCY,
        }
      ),
      redisClientMaintenanceNotifications: this.createCounter(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.redisClientMaintenanceNotifications,
          unit: "{notification}",
          description: "Number of maintenance notifications received",
          metricGroup: METRIC_GROUP.RESILIENCY,
        }
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
        }
      ),
      // Streams
      redisClientStreamProduced: this.createCounter(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.redisClientStreamProduced,
          unit: "{message}",
          description: "Number of messages produced to Redis streams",
          metricGroup: METRIC_GROUP.STREAMS,
        }
      ),
    } as const;
  }
}
