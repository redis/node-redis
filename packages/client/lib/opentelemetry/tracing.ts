import type * as DC from 'node:diagnostics_channel';
import type {
  Span,
  SpanOptions,
  Tracer,
} from '@opentelemetry/api';
import {
  CHANNELS,
  getTracingChannel,
} from '../client/tracing';
import {
  DEFAULT_OTEL_ATTRIBUTES,
  INSTRUMENTATION_SCOPE_NAME,
  OTEL_ATTRIBUTES,
  TracingConfig,
} from './types';
import { getErrorInfo } from './utils';

interface TracingOptions {
  includeCommands: Record<string, true>;
  excludeCommands: Record<string, true>;
  hasIncludeCommands: boolean;
  hasExcludeCommands: boolean;
  enableConnectionSpans: boolean;
}

// Symbol used to attach the span to the TracingChannel context object.
// Using a symbol avoids collisions with channel context properties.
const SPAN_KEY = Symbol('otel.span');

interface WithSpan {
  [SPAN_KEY]?: Span;
}

/**
 * OTel span creation via TracingChannel subscribers.
 *
 * Context propagation uses `channel.start.bindStore()` on OTel's internal
 * AsyncLocalStorage so that spans created in the `start` handler become
 * the active span for the duration of the traced operation. This is required
 * because OTel's context manager and Node.js TracingChannel do not integrate
 * automatically (yet). All APM consumers must do the same.
 *
 * See: https://github.com/open-telemetry/opentelemetry-js/issues/4986
 */
export class OTelTracing {
  static #instance: OTelTracing | undefined;
  static #initialized = false;

  readonly #tracer: Tracer;
  readonly #options: TracingOptions;
  readonly #unsubscribers: Array<() => void> = [];
  readonly #api: typeof import('@opentelemetry/api');
  readonly #otelStorage: any; // OTel's internal AsyncLocalStorage (if accessible)

  private constructor(
    api: typeof import('@opentelemetry/api'),
    config?: TracingConfig,
  ) {
    this.#api = api;
    this.#tracer = config?.tracerProvider
      ? config.tracerProvider.getTracer(INSTRUMENTATION_SCOPE_NAME)
      : api.trace.getTracer(INSTRUMENTATION_SCOPE_NAME);

    // Attempt to grab OTel's internal AsyncLocalStorage for context propagation.
    const contextManager = (api.context as any)._getContextManager?.();
    this.#otelStorage = contextManager?._asyncLocalStorage;

    this.#options = {
      includeCommands: (config?.includeCommands ?? []).reduce<Record<string, true>>((acc, c) => {
        acc[c.toUpperCase()] = true;
        return acc;
      }, {}),
      hasIncludeCommands: !!config?.includeCommands?.length,
      excludeCommands: (config?.excludeCommands ?? []).reduce<Record<string, true>>((acc, c) => {
        acc[c.toUpperCase()] = true;
        return acc;
      }, {}),
      hasExcludeCommands: !!config?.excludeCommands?.length,
      enableConnectionSpans: config?.enableConnectionSpans ?? false,
    };

    this.#subscribeCommands();
    this.#subscribeBatch();

    if (this.#options.enableConnectionSpans) {
      this.#subscribeConnect();
      this.#subscribeConnectionWait();
    }
  }

  static init({
    api,
    config,
  }: {
    api: typeof import('@opentelemetry/api');
    config?: TracingConfig;
  }) {
    if (OTelTracing.#initialized) return;
    OTelTracing.#instance = new OTelTracing(api, config);
    OTelTracing.#initialized = true;
  }

  static reset() {
    OTelTracing.#instance?.destroy();
    OTelTracing.#instance = undefined;
    OTelTracing.#initialized = false;
  }

  static get isInitialized() {
    return OTelTracing.#initialized;
  }

  destroy() {
    this.#unsubscribers.forEach(fn => fn());
  }

  // ---------------------------------------------------------------------------
  // Core tracing helper
  // ---------------------------------------------------------------------------

  /**
   * Subscribes to a TracingChannel with span lifecycle management.
   *
   * When OTel's ALS is accessible, uses `bindStore` so the span is propagated
   * as the active context for the duration of the traced operation (enabling
   * automatic parent-child relationships for nested channels like batch > command).
   *
   * When ALS is not accessible, falls back to a WeakMap-based approach where
   * spans are still created and ended, but won't act as parents for nested spans.
   *
   * @param onStart - called with the channel context, returns span name + options
   *                  or `undefined` to skip (e.g. excluded commands)
   */
  #traceChannel(
    tc: DC.TracingChannel<any>,
    onStart: (ctx: any) => { name: string; options: SpanOptions } | undefined,
  ) {
    const { trace, context } = this.#api;

    if (this.#otelStorage) {
      // Bind OTel's ALS to the start channel for context propagation
      (tc as any).start.bindStore(this.#otelStorage, (data: WithSpan & any) => {
        const desc = onStart(data);
        if (!desc) return context.active();

        const parentCtx = context.active();
        const span = this.#tracer.startSpan(desc.name, desc.options, parentCtx);
        data[SPAN_KEY] = span;
        return trace.setSpan(parentCtx, span);
      });

      const handlers = {
        asyncEnd: (ctx: WithSpan) => {
          ctx[SPAN_KEY]?.end();
        },
        error: (ctx: WithSpan & { error?: Error }) => {
          const span = ctx[SPAN_KEY];
          if (span) {
            this.#endSpanWithError(span, ctx.error!);
          }
        },
      } as DC.TracingChannelSubscribers<any>;

      tc.subscribe(handlers);
      this.#unsubscribers.push(() => {
        tc.unsubscribe(handlers);
        (tc as any).start.unbindStore(this.#otelStorage);
      });
    } else {
      // Fallback: WeakMap-based span tracking (no context propagation)
      const spans = new WeakMap<object, Span>();

      const handlers = {
        start: (ctx: any) => {
          const desc = onStart(ctx);
          if (!desc) return;
          spans.set(ctx, this.#tracer.startSpan(desc.name, desc.options));
        },
        asyncEnd: (ctx: any) => {
          const span = spans.get(ctx);
          if (span) {
            span.end();
            spans.delete(ctx);
          }
        },
        error: (ctx: any) => {
          const span = spans.get(ctx);
          if (span) {
            this.#endSpanWithError(span, ctx.error);
            spans.delete(ctx);
          }
        },
      } as DC.TracingChannelSubscribers<any>;

      tc.subscribe(handlers);
      this.#unsubscribers.push(() => tc.unsubscribe(handlers));
    }
  }

  // ---------------------------------------------------------------------------
  // Command spans
  // ---------------------------------------------------------------------------

  #subscribeCommands() {
    const tc = getTracingChannel(CHANNELS.TRACE_COMMAND);
    if (!tc) return;

    const { SpanKind } = this.#api;

    this.#traceChannel(tc, (ctx) => {
      const commandName = ctx.command?.toString() ?? 'UNKNOWN';
      if (this.#isCommandExcluded(commandName)) return undefined;

      return {
        name: commandName,
        options: {
          kind: SpanKind.CLIENT,
          attributes: {
            ...DEFAULT_OTEL_ATTRIBUTES,
            [OTEL_ATTRIBUTES.dbOperationName]: commandName,
            [OTEL_ATTRIBUTES.dbNamespace]: String(ctx.database),
            [OTEL_ATTRIBUTES.serverAddress]: ctx.serverAddress,
            ...(ctx.serverPort !== undefined && {
              [OTEL_ATTRIBUTES.serverPort]: ctx.serverPort,
            }),
            'db.query.text': (ctx.args as ReadonlyArray<string>).join(' '),
          },
        },
      };
    });
  }

  // ---------------------------------------------------------------------------
  // Batch spans (MULTI / PIPELINE)
  // ---------------------------------------------------------------------------

  #subscribeBatch() {
    const tc = getTracingChannel(CHANNELS.TRACE_BATCH);
    if (!tc) return;

    const { SpanKind } = this.#api;

    this.#traceChannel(tc, (ctx) => {
      const batchMode = ctx.batchMode ?? 'PIPELINE';

      return {
        name: batchMode,
        options: {
          kind: SpanKind.CLIENT,
          attributes: {
            ...DEFAULT_OTEL_ATTRIBUTES,
            [OTEL_ATTRIBUTES.dbOperationName]: batchMode,
            [OTEL_ATTRIBUTES.dbNamespace]: String(ctx.database),
            [OTEL_ATTRIBUTES.serverAddress]: ctx.serverAddress,
            ...(ctx.serverPort !== undefined && {
              [OTEL_ATTRIBUTES.serverPort]: ctx.serverPort,
            }),
            [OTEL_ATTRIBUTES.dbOperationBatchSize]: ctx.batchSize,
          },
        },
      };
    });
  }

  // ---------------------------------------------------------------------------
  // Connection spans
  // ---------------------------------------------------------------------------

  #subscribeConnect() {
    const tc = getTracingChannel(CHANNELS.TRACE_CONNECT);
    if (!tc) return;

    const { SpanKind } = this.#api;

    this.#traceChannel(tc, (ctx) => ({
      name: 'redis connect',
      options: {
        kind: SpanKind.CLIENT,
        attributes: {
          ...DEFAULT_OTEL_ATTRIBUTES,
          [OTEL_ATTRIBUTES.serverAddress]: ctx.serverAddress,
          ...(ctx.serverPort !== undefined && {
            [OTEL_ATTRIBUTES.serverPort]: ctx.serverPort,
          }),
        },
      },
    }));
  }

  // ---------------------------------------------------------------------------
  // Connection wait spans
  // ---------------------------------------------------------------------------

  #subscribeConnectionWait() {
    const tc = getTracingChannel(CHANNELS.TRACE_CONNECTION_WAIT);
    if (!tc) return;

    const { SpanKind } = this.#api;

    this.#traceChannel(tc, () => ({
      name: 'redis connection:wait',
      options: {
        kind: SpanKind.INTERNAL,
        attributes: {
          ...DEFAULT_OTEL_ATTRIBUTES,
        },
      },
    }));
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  #endSpanWithError(span: Span, error: Error) {
    const { SpanStatusCode } = this.#api;
    const errorInfo = getErrorInfo(error);

    span.recordException(error);
    span.setAttribute(OTEL_ATTRIBUTES.errorType, errorInfo.errorType);
    if (errorInfo.statusCode !== undefined) {
      span.setAttribute(OTEL_ATTRIBUTES.dbResponseStatusCode, errorInfo.statusCode);
    }
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    span.end();
  }

  #isCommandExcluded(commandName: string) {
    const name = commandName?.toUpperCase() ?? '';
    return (
      (this.#options.hasIncludeCommands && !this.#options.includeCommands[name]) ||
      this.#options.excludeCommands[name]
    );
  }
}
