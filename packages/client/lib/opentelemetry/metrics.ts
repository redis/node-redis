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
  InstrumentConfig,
  MetricGroup,
  METRIC_GROUP,
  METRIC_NAMES,
} from "./types";
import { createNoopMeter } from "./noop-meter";
import { noopFunction } from "./utils";

export class OTelMetrics {
  // Create a noop instance by default
  static #instance: OTelMetrics = new OTelMetrics({
    api: undefined,
    config: undefined,
  });
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

  static get instance() {
    return OTelMetrics.#instance;
  }

  public createRecordOperationDuration(
    args: ReadonlyArray<RedisArgument>,
    options: {
      host: string;
      port: string;
      db: string;
    }
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
      [OTEL_ATTRIBUTES.dbNamespace]: options.db,
      [OTEL_ATTRIBUTES.serverAddress]: options.host,
      [OTEL_ATTRIBUTES.serverPort]: options.port,
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

  public recordConnectionCount(value: number) {
    this.#instruments.dbClientConnectionCount.add(
      value,
      this.#options.attributes
    );
  }

  public recordConnectionCreateTime(durationMs: number) {
    this.#instruments.dbClientConnectionCreateTime.record(
      durationMs / 1000, // convert to seconds
      this.#options.attributes
    );
  }

  public recordPendingRequests(value: number) {
    this.#instruments.dbClientConnectionPendingRequests.add(
      value,
      this.#options.attributes
    );
  }

  private isCommandExcluded(commandName: string) {
    const upperCommandName = commandName?.toUpperCase();
    return (
      (this.#options.includeCommands.length > 0 &&
        !this.#options.includeCommands.includes(upperCommandName)) ||
      this.#options.excludeCommands.includes(upperCommandName)
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
    instrumentConfig: InstrumentConfig
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
    });
  }

  private createCounter(
    meter: Meter,
    enabledMetricGroups: MetricGroup[],
    instrumentConfig: InstrumentConfig
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
    instrumentConfig: InstrumentConfig
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

  private registerInstruments(meter: Meter, options: MetricOptions) {
    return {
      // Command metrics
      dbClientOperationDuration: this.createHistorgram(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.dbClientOperationDuration,
          unit: "s",
          description:
            "Duration of a Redis client operation (includes retries)",
          metricGroup: METRIC_GROUP.COMMAND,
        }
      ),
      // Connection metrics
      dbClientConnectionCreateTime: this.createHistorgram(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.dbClientConnectionCreateTime,
          unit: "s",
          description:
            "Time taken to create a new connection to the Redis server",
          metricGroup: METRIC_GROUP.CONNECTION_BASIC,
        }
      ),
      dbClientConnectionWaitTime: this.createHistorgram(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.dbClientConnectionWaitTime,
          unit: "s",
          description:
            "Time spent waiting for an available connection from the pool",
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
        }
      ),
      redisClientPipelineDuration: this.createHistorgram(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.redisClientPipelineDuration,
          unit: "s",
          description: "Duration of pipeline execution",
          metricGroup: METRIC_GROUP.PIPELINE,
        }
      ),
      redisClientHealthcheckDuration: this.createHistorgram(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.redisClientHealthcheckDuration,
          unit: "s",
          description: "Duration of health check operations",
          metricGroup: METRIC_GROUP.HEALTHCHECK,
        }
      ),
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
      dbClientConnectionIdleMax: this.createUpDownCounter(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.dbClientConnectionIdleMax,
          unit: "{connection}",
          description: "Maximum number of idle connections allowed in the pool",
          metricGroup: METRIC_GROUP.CONNECTION_ADVANCED,
        }
      ),
      dbClientConnectionIdleMin: this.createUpDownCounter(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.dbClientConnectionIdleMin,
          unit: "{connection}",
          description:
            "Minimum number of idle connections maintained in the pool",
          metricGroup: METRIC_GROUP.CONNECTION_ADVANCED,
        }
      ),
      dbClientConnectionMax: this.createUpDownCounter(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.dbClientConnectionMax,
          unit: "{connection}",
          description: "Maximum number of connections allowed in the pool",
          metricGroup: METRIC_GROUP.CONNECTION_ADVANCED,
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
      dbClientConnectionTimeouts: this.createCounter(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.dbClientConnectionTimeouts,
          unit: "{timeout}",
          description: "Number of connection timeout events",
          metricGroup: METRIC_GROUP.RESILIENCY,
        }
      ),
      // Redis-specific metrics
      redisClientClusterRedirections: this.createCounter(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.redisClientClusterRedirections,
          unit: "{redirection}",
          description: "Number of cluster redirection events (MOVED/ASK)",
          metricGroup: METRIC_GROUP.RESILIENCY,
        }
      ),
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
          metricGroup: METRIC_GROUP.MISC,
        }
      ),
      redisClientPubSubMessages: this.createCounter(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.redisClientPubSubMessages,
          unit: "{message}",
          description: "Number of pub/sub messages processed",
          metricGroup: METRIC_GROUP.PUBSUB,
        }
      ),
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
