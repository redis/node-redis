import type * as DC from 'node:diagnostics_channel';
import { Meter, BatchObservableResult } from "@opentelemetry/api";
import { ClientRegistry } from "./client-registry";
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
  OTelClientAttributes,
  IOTelMetrics,
  IOTelCommandMetrics,
  INSTRUMENTATION_SCOPE_NAME,
} from "./types";
import { createNoopMeter } from "./noop-meter";
import {
  getErrorInfo,
  isRedirectionError,
  parseClientAttributes,
} from "./utils";
import { NoopOTelMetrics } from "./noop-metrics";
import { OpenTelemetryError } from "../errors";
import { CHANNELS, getTracingChannel, getChannel } from "../client/tracing";

function resolveClientAttributes(
  clientId?: string,
): OTelClientAttributes | undefined {
  return clientId
    ? ClientRegistry.instance.getById(clientId)?.getAttributes()
    : undefined;
}

interface CommandMetricsState {
  startTime: number;
  clientAttributes: OTelClientAttributes | undefined;
  commandName: string;
}

class OTelCommandMetrics implements IOTelCommandMetrics {
  readonly #instruments: MetricInstruments;
  readonly #options: MetricOptions;
  readonly #metricsState = new WeakMap<object, CommandMetricsState>();
  readonly #unsubscribers: Array<() => void> = [];

  constructor(options: MetricOptions, instruments: MetricInstruments) {
    this.#options = options;
    this.#instruments = instruments;

    this.#subscribeToTracingChannel();
  }

  #subscribeToTracingChannel() {
    const commandTC = getTracingChannel(CHANNELS.TRACE_COMMAND);
    const batchTC = getTracingChannel(CHANNELS.TRACE_BATCH);
    if (!commandTC || !batchTC) return;

    const onStart = (ctx: any) => {
      const commandName = ctx.command?.toString() || "UNKNOWN";

      if (this.#isCommandExcluded(commandName)) return;

      this.#metricsState.set(ctx, {
        startTime: performance.now(),
        clientAttributes: resolveClientAttributes(ctx.clientId),
        commandName,
      });
    };

    const onAsyncEnd = (ctx: any) => {
      const state = this.#metricsState.get(ctx);
      if (!state) return;
      this.#metricsState.delete(ctx);

      this.#instruments.dbClientOperationDuration.record(
        (performance.now() - state.startTime) / 1000,
        {
          ...this.#options.attributes,
          [OTEL_ATTRIBUTES.dbNamespace]: state.clientAttributes?.db?.toString(),
          [OTEL_ATTRIBUTES.serverAddress]: state.clientAttributes?.host,
          [OTEL_ATTRIBUTES.serverPort]: state.clientAttributes?.port?.toString(),
          [OTEL_ATTRIBUTES.dbOperationName]: state.commandName,
        },
      );
    };

    const onError = (ctx: any) => {
      const state = this.#metricsState.get(ctx);
      if (!state) return;
      this.#metricsState.delete(ctx);

      const errorInfo = getErrorInfo(ctx.error);
      this.#instruments.dbClientOperationDuration.record(
        (performance.now() - state.startTime) / 1000,
        {
          ...this.#options.attributes,
          [OTEL_ATTRIBUTES.dbNamespace]: state.clientAttributes?.db?.toString(),
          [OTEL_ATTRIBUTES.serverAddress]: state.clientAttributes?.host,
          [OTEL_ATTRIBUTES.serverPort]: state.clientAttributes?.port?.toString(),
          [OTEL_ATTRIBUTES.dbOperationName]: state.commandName,
          [OTEL_ATTRIBUTES.errorType]: errorInfo.errorType,
          [OTEL_ATTRIBUTES.redisClientErrorsCategory]: errorInfo.category,
          ...(errorInfo.statusCode !== undefined
            ? { [OTEL_ATTRIBUTES.dbResponseStatusCode]: errorInfo.statusCode }
            : {}),
        },
      );
    };

    const onBatchStart = (ctx: any) => {
      this.#metricsState.set(ctx, {
        startTime: performance.now(),
        clientAttributes: resolveClientAttributes(ctx.clientId),
        commandName: ctx.batchMode,
      });
    };

    const onBatchAsyncEnd = (ctx: any) => {
      const state = this.#metricsState.get(ctx);
      if (!state) return;
      this.#metricsState.delete(ctx);

      this.#instruments.dbClientOperationDuration.record(
        (performance.now() - state.startTime) / 1000,
        {
          ...this.#options.attributes,
          [OTEL_ATTRIBUTES.dbNamespace]: state.clientAttributes?.db?.toString(),
          [OTEL_ATTRIBUTES.serverAddress]: state.clientAttributes?.host,
          [OTEL_ATTRIBUTES.serverPort]: state.clientAttributes?.port?.toString(),
          [OTEL_ATTRIBUTES.dbOperationName]: state.commandName,
        },
      );
    };

    const onBatchError = (ctx: any) => {
      const state = this.#metricsState.get(ctx);
      if (!state) return;
      this.#metricsState.delete(ctx);

      const errorInfo = getErrorInfo(ctx.error);
      this.#instruments.dbClientOperationDuration.record(
        (performance.now() - state.startTime) / 1000,
        {
          ...this.#options.attributes,
          [OTEL_ATTRIBUTES.dbNamespace]: state.clientAttributes?.db?.toString(),
          [OTEL_ATTRIBUTES.serverAddress]: state.clientAttributes?.host,
          [OTEL_ATTRIBUTES.serverPort]: state.clientAttributes?.port?.toString(),
          [OTEL_ATTRIBUTES.dbOperationName]: state.commandName,
          [OTEL_ATTRIBUTES.errorType]: errorInfo.errorType,
          [OTEL_ATTRIBUTES.redisClientErrorsCategory]: errorInfo.category,
          ...(errorInfo.statusCode !== undefined
            ? { [OTEL_ATTRIBUTES.dbResponseStatusCode]: errorInfo.statusCode }
            : {}),
        },
      );
    };

    const commandHandlers = { start: onStart, asyncEnd: onAsyncEnd, error: onError } as DC.TracingChannelSubscribers<any>;
    commandTC.subscribe(commandHandlers);
    this.#unsubscribers.push(() => commandTC.unsubscribe(commandHandlers));

    const batchHandlers = { start: onBatchStart, asyncEnd: onBatchAsyncEnd, error: onBatchError } as DC.TracingChannelSubscribers<any>;
    batchTC.subscribe(batchHandlers);
    this.#unsubscribers.push(() => batchTC.unsubscribe(batchHandlers));
  }

  destroy() {
    this.#unsubscribers.forEach(fn => fn());
  }

  #isCommandExcluded(commandName: string) {
    return (
      (this.#options.hasIncludeCommands &&
        !this.#options.includeCommands[commandName]) ||
      this.#options.excludeCommands[commandName]
    );
  }
}

// ---------------------------------------------------------------------------
// Channel subscriber classes — subscribe to diagnostics_channel events and
// record OTel metrics. No public methods called from core code.
// ---------------------------------------------------------------------------

class OTelChannelSubscribers {
  readonly #instruments: MetricInstruments;
  readonly #options: MetricOptions;
  readonly #unsubscribers: Array<() => void> = [];

  constructor(
    options: MetricOptions,
    instruments: MetricInstruments,
    enabledGroups: MetricGroup[],
  ) {
    this.#options = options;
    this.#instruments = instruments;

    if (enabledGroups.includes(METRIC_GROUP.CONNECTION_BASIC)) {
      this.#subscribeConnectionBasic();
    }
    if (enabledGroups.includes(METRIC_GROUP.CONNECTION_ADVANCED)) {
      this.#subscribeConnectionAdvanced();
    }
    if (enabledGroups.includes(METRIC_GROUP.RESILIENCY)) {
      this.#subscribeResiliency();
    }
    if (enabledGroups.includes(METRIC_GROUP.CLIENT_SIDE_CACHING)) {
      this.#subscribeClientSideCache();
    }
    if (enabledGroups.includes(METRIC_GROUP.PUBSUB)) {
      this.#subscribePubSub();
    }
    if (enabledGroups.includes(METRIC_GROUP.STREAMING)) {
      this.#subscribeStreaming();
    }
  }

  #sub(name: string, handler: (ctx: any) => void) {
    const ch = getChannel(name);
    if (!ch) return;
    ch.subscribe(handler);
    this.#unsubscribers.push(() => ch.unsubscribe(handler));
  }

  destroy() {
    this.#unsubscribers.forEach(fn => fn());
  }

  // -- Connection Basic --

  #subscribeConnectionBasic() {
    this.#sub(CHANNELS.CONNECTION_READY, (ctx: any) => {
      const clientAttributes = resolveClientAttributes(ctx.clientId);
      this.#instruments.dbClientConnectionCreateTime.record(
        ctx.createTimeMs / 1000,
        {
          ...this.#options.attributes,
          ...parseClientAttributes(clientAttributes),
        },
      );
      this.#instruments.dbClientConnectionCount.add(1, {
        ...this.#options.attributes,
        ...parseClientAttributes(clientAttributes),
        [OTEL_ATTRIBUTES.dbClientConnectionState]: "used",
      });
    });

    this.#sub(CHANNELS.CONNECTION_CLOSED, (ctx: any) => {
      const clientAttributes = resolveClientAttributes(ctx.clientId);
      if (ctx.wasConnected) {
        this.#instruments.dbClientConnectionCount.add(-1, {
          ...this.#options.attributes,
          ...parseClientAttributes(clientAttributes),
          [OTEL_ATTRIBUTES.dbClientConnectionState]: "used",
        });
      }
      this.#instruments.redisClientConnectionClosed.add(1, {
        ...this.#options.attributes,
        ...parseClientAttributes(clientAttributes),
        [OTEL_ATTRIBUTES.redisClientConnectionCloseReason]: ctx.reason,
      });
    });

    this.#sub(CHANNELS.CONNECTION_RELAXED_TIMEOUT, (ctx: any) => {
      const clientAttributes = resolveClientAttributes(ctx.clientId);
      this.#instruments.redisClientConnectionRelaxedTimeout.add(ctx.value, {
        ...this.#options.attributes,
        ...parseClientAttributes(clientAttributes),
      });
    });

    this.#sub(CHANNELS.CONNECTION_HANDOFF, (ctx: any) => {
      const clientAttributes = resolveClientAttributes(ctx.clientId);
      this.#instruments.redisClientConnectionHandoff.add(1, {
        ...this.#options.attributes,
        ...parseClientAttributes(clientAttributes),
      });
    });
  }

  // -- Connection Advanced --

  #subscribeConnectionAdvanced() {
    const tc = getTracingChannel(CHANNELS.TRACE_CONNECTION_WAIT);
    if (!tc) return;

    const startTimes = new WeakMap<object, number>();

    const handlers = {
      start: (ctx: any) => {
        startTimes.set(ctx, performance.now());
      },
      asyncEnd: (ctx: any) => {
        const startTime = startTimes.get(ctx);
        if (startTime === undefined) return;
        startTimes.delete(ctx);

        const clientAttributes = resolveClientAttributes(ctx.clientId);
        this.#instruments.dbClientConnectionWaitTime.record(
          (performance.now() - startTime) / 1000,
          {
            ...this.#options.attributes,
            ...parseClientAttributes(clientAttributes),
          },
        );
      },
    };

    const tcHandlers = handlers as DC.TracingChannelSubscribers<any>;
    tc.subscribe(tcHandlers);
    this.#unsubscribers.push(() => tc.unsubscribe(tcHandlers));
  }

  // -- Resiliency --

  #subscribeResiliency() {
    this.#sub(CHANNELS.ERROR, (ctx: any) => {
      const clientAttributes = resolveClientAttributes(ctx.clientId);
      const errorInfo = getErrorInfo(ctx.error);

      // Avoid double-counting ASK/MOVED errors: command-level paths can observe
      // the same redirection that cluster-level retry logic already records.
      if (ctx.origin === 'client' && isRedirectionError(errorInfo.statusCode)) {
        return;
      }

      this.#instruments.redisClientErrors.add(1, {
        ...this.#options.attributes,
        ...parseClientAttributes(clientAttributes),
        [OTEL_ATTRIBUTES.errorType]: errorInfo.errorType,
        [OTEL_ATTRIBUTES.redisClientErrorsCategory]: errorInfo.category,
        [OTEL_ATTRIBUTES.redisClientErrorsInternal]: ctx.internal,
        ...(ctx.retryCount !== undefined && {
          [OTEL_ATTRIBUTES.redisClientOperationRetryAttempts]: ctx.retryCount,
        }),
        ...(errorInfo.statusCode !== undefined && {
          [OTEL_ATTRIBUTES.dbResponseStatusCode]: errorInfo.statusCode,
        }),
      });
    });

    this.#sub(CHANNELS.MAINTENANCE, (ctx: any) => {
      const clientAttributes = resolveClientAttributes(ctx.clientId);
      this.#instruments.redisClientMaintenanceNotifications.add(1, {
        ...this.#options.attributes,
        ...parseClientAttributes(clientAttributes),
        [OTEL_ATTRIBUTES.redisClientConnectionNotification]: ctx.notification,
      });
    });
  }

  // -- Client-Side Cache --

  #subscribeClientSideCache() {
    this.#sub(CHANNELS.CACHE_REQUEST, (ctx: any) => {
      const clientAttributes = resolveClientAttributes(ctx.clientId);
      this.#instruments.redisClientCscRequests.add(1, {
        ...this.#options.attributes,
        [OTEL_ATTRIBUTES.serverAddress]: clientAttributes?.host,
        [OTEL_ATTRIBUTES.serverPort]: clientAttributes?.port?.toString(),
        [OTEL_ATTRIBUTES.dbClientConnectionPoolName]: clientAttributes?.clientId,
        [OTEL_ATTRIBUTES.redisClientCscResult]: ctx.result,
      });
    });

    this.#sub(CHANNELS.CACHE_EVICTION, (ctx: any) => {
      const clientAttributes = resolveClientAttributes(ctx.clientId);
      this.#instruments.redisClientCscEvictions.add(ctx.count ?? 1, {
        ...this.#options.attributes,
        [OTEL_ATTRIBUTES.serverAddress]: clientAttributes?.host,
        [OTEL_ATTRIBUTES.serverPort]: clientAttributes?.port?.toString(),
        [OTEL_ATTRIBUTES.dbClientConnectionPoolName]: clientAttributes?.clientId,
        [OTEL_ATTRIBUTES.redisClientCscReason]: ctx.reason,
      });
    });
  }

  // -- PubSub --

  #subscribePubSub() {
    this.#sub(CHANNELS.PUBSUB, (ctx: any) => {
      const clientAttributes = resolveClientAttributes(ctx.clientId);
      this.#instruments.redisClientPubsubMessages.add(1, {
        ...this.#options.attributes,
        ...parseClientAttributes(clientAttributes),
        [OTEL_ATTRIBUTES.redisClientPubSubMessageDirection]: ctx.direction,
        [OTEL_ATTRIBUTES.redisClientPubSubSharded]: ctx.sharded ?? false,
        ...(ctx.channel !== undefined && !this.#options.hidePubSubChannelNames
          ? { [OTEL_ATTRIBUTES.redisClientPubSubChannel]: ctx.channel.toString() }
          : {}),
      });
    });

    // Command reply handler for outgoing PUBLISH/SPUBLISH
    this.#sub(CHANNELS.COMMAND_REPLY, (ctx: any) => {
      const commandName = ctx.args[0]?.toString().toUpperCase();
      if (commandName === 'PUBLISH') {
        const clientAttributes = resolveClientAttributes(ctx.clientId);
        this.#instruments.redisClientPubsubMessages.add(1, {
          ...this.#options.attributes,
          ...parseClientAttributes(clientAttributes),
          [OTEL_ATTRIBUTES.redisClientPubSubMessageDirection]: 'out',
          [OTEL_ATTRIBUTES.redisClientPubSubSharded]: false,
          ...(ctx.args[1] !== undefined && !this.#options.hidePubSubChannelNames
            ? { [OTEL_ATTRIBUTES.redisClientPubSubChannel]: ctx.args[1].toString() }
            : {}),
        });
      } else if (commandName === 'SPUBLISH') {
        const clientAttributes = resolveClientAttributes(ctx.clientId);
        this.#instruments.redisClientPubsubMessages.add(1, {
          ...this.#options.attributes,
          ...parseClientAttributes(clientAttributes),
          [OTEL_ATTRIBUTES.redisClientPubSubMessageDirection]: 'out',
          [OTEL_ATTRIBUTES.redisClientPubSubSharded]: true,
          ...(ctx.args[1] !== undefined && !this.#options.hidePubSubChannelNames
            ? { [OTEL_ATTRIBUTES.redisClientPubSubChannel]: ctx.args[1].toString() }
            : {}),
        });
      }
    });
  }

  // -- Streaming --

  #subscribeStreaming() {
    this.#sub(CHANNELS.COMMAND_REPLY, (ctx: any) => {
      const commandName = ctx.args[0]?.toString().toUpperCase();
      if (commandName !== 'XREAD' && commandName !== 'XREADGROUP') return;

      const reply = ctx.reply;
      if (!reply || !Array.isArray(reply) || reply.length === 0) return;

      const now = Date.now();
      const clientAttributes = resolveClientAttributes(ctx.clientId);

      const isXReadGroup =
        commandName === 'XREADGROUP' &&
        ctx.args[1]?.toString().toUpperCase() === 'GROUP';
      const consumerGroup = isXReadGroup ? ctx.args[2]?.toString() : undefined;

      for (const streamData of reply) {
        if (!streamData || typeof streamData !== 'object') continue;

        const { name: stream, messages } = streamData as {
          name: string;
          messages: Array<{ id: string; message: unknown }>;
        };

        if (!messages || !Array.isArray(messages) || messages.length === 0) continue;

        const streamAttributes = {
          ...this.#options.attributes,
          ...parseClientAttributes(clientAttributes),
          ...(!this.#options.hideStreamNames
            ? { [OTEL_ATTRIBUTES.redisClientStreamName]: stream }
            : {}),
          ...(consumerGroup !== undefined
            ? { [OTEL_ATTRIBUTES.redisClientConsumerGroup]: consumerGroup }
            : {}),
        };

        for (const message of messages) {
          if (!message?.id) continue;

          const [tsPart] = message.id.split('-');
          const messageTimestamp = Number.parseInt(tsPart, 10);
          if (!Number.isFinite(messageTimestamp)) continue;

          this.#instruments.redisClientStreamLag.record(
            (now - messageTimestamp) / 1000,
            streamAttributes,
          );
        }
      }
    });
  }
}

export class OTelMetrics implements IOTelMetrics {
  // Create a noop instance by default
  static #instance: IOTelMetrics = new NoopOTelMetrics();
  static #initialized = false;

  readonly commandMetrics: IOTelCommandMetrics;
  readonly #channelSubscribers: OTelChannelSubscribers;

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
      this.commandMetrics = { destroy() {} };
    }

    this.#channelSubscribers = new OTelChannelSubscribers(
      this.#options,
      this.#instruments,
      this.#options.enabledMetricGroups,
    );
  }

  public static init({
    api,
    config,
  }: {
    api?: typeof import("@opentelemetry/api");
    config?: ObservabilityConfig;
  }) {
    if (OTelMetrics.#initialized) {
      throw new OpenTelemetryError("OTelMetrics already initialized");
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
    const prev = OTelMetrics.#instance;
    if (prev instanceof OTelMetrics) {
      prev.commandMetrics.destroy();
      prev.#channelSubscribers.destroy();
    }
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
      return options.meterProvider.getMeter(INSTRUMENTATION_SCOPE_NAME);
    }

    return api.metrics.getMeter(INSTRUMENTATION_SCOPE_NAME);
  }

  private parseOptions(config?: ObservabilityConfig) {
    return {
      enabled: !!config?.metrics?.enabled,
      attributes: {
        ...DEFAULT_OTEL_ATTRIBUTES,
      },
      meterProvider: config?.metrics?.meterProvider,
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
      bucketsOperationDuration:
        config?.metrics?.bucketsOperationDuration ??
        DEFAULT_HISTOGRAM_BUCKETS.OPERATION_DURATION,
      bucketsConnectionCreateTime:
        config?.metrics?.bucketsConnectionCreateTime ??
        DEFAULT_HISTOGRAM_BUCKETS.CONNECTION_CREATE_TIME,
      bucketsConnectionWaitTime:
        config?.metrics?.bucketsConnectionWaitTime ??
        DEFAULT_HISTOGRAM_BUCKETS.CONNECTION_WAIT_TIME,
      bucketsStreamProcessingDuration:
        config?.metrics?.bucketsStreamProcessingDuration ??
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
      dbClientConnectionCount: this.createUpDownCounter(
        meter,
        options.enabledMetricGroups,
        {
          name: METRIC_NAMES.dbClientConnectionCount,
          unit: "{connection}",
          description: "Current number of active connections",
          metricGroup: METRIC_GROUP.CONNECTION_BASIC,
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
      // The DB semconv models pending requests as an UpDownCounter on pooled
      // connections. That does not map cleanly to node-redis today, so we keep
      // this disabled for now and may reintroduce it later as an async gauge
      // with a client-specific name.
      // See: https://opentelemetry.io/docs/specs/semconv/db/database-metrics/#connection-pools
      // dbClientConnectionPendingRequests: this.createObservableGaugeWithCallback(
      //   meter,
      //   options.enabledMetricGroups,
      //   {
      //     name: METRIC_NAMES.dbClientConnectionPendingRequests,
      //     unit: "{request}",
      //     description: "Current number of pending requests per connection",
      //     metricGroup: METRIC_GROUP.CONNECTION_ADVANCED,
      //   },
      //   options,
      //   (observableResult, opts) => {
      //     for (const handle of ClientRegistry.instance.getAll()) {
      //       observableResult.observe(
      //         this.#instruments.dbClientConnectionPendingRequests,
      //         handle.getPendingRequests(),
      //         {
      //           ...opts.attributes,
      //           ...parseClientAttributes(handle.getAttributes()),
      //         },
      //       );
      //     }
      //   },
      // ),
      dbClientConnectionPendingRequests: createNoopMeter().createObservableGauge(
        METRIC_NAMES.dbClientConnectionPendingRequests,
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
          histogramBoundaries: options.bucketsStreamProcessingDuration,
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
