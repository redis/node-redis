import type { TracingChannel as NodeTracingChannel } from 'node:diagnostics_channel';

// @types/node is missing hasSubscribers on TracingChannel and types
// tracePromise as returning void. Both exist at runtime.
interface TracingChannel<ContextType extends object> extends NodeTracingChannel<unknown, ContextType> {
  readonly hasSubscribers: boolean;
  tracePromise<T>(fn: () => Promise<T>, context?: ContextType): Promise<T>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const dc: any = (() => {
  try {
    return ('getBuiltinModule' in process)
      ? (process as any).getBuiltinModule('node:diagnostics_channel')
      : require('node:diagnostics_channel');
  } catch {
    return undefined;
  }
})();

const hasTracingChannel = typeof dc?.tracingChannel === 'function';

export const CHANNELS = {
  // TracingChannel names (async lifecycle — use with dc.tracingChannel())
  TRACE_COMMAND: 'node-redis:command',
  TRACE_BATCH: 'node-redis:batch',
  TRACE_CONNECT: 'node-redis:connect',
  // Point-event channel names (fire-and-forget — use with dc.channel())
  CONNECTION_READY: 'node-redis:connection:ready',
  CONNECTION_CLOSED: 'node-redis:connection:closed',
  CONNECTION_RELAXED_TIMEOUT: 'node-redis:connection:relaxed-timeout',
  CONNECTION_HANDOFF: 'node-redis:connection:handoff',
  CONNECTION_WAIT_START: 'node-redis:connection:wait:start',
  CONNECTION_WAIT_END: 'node-redis:connection:wait:end',
  ERROR: 'node-redis:error',
  MAINTENANCE: 'node-redis:maintenance',
  PUBSUB: 'node-redis:pubsub',
  CACHE_REQUEST: 'node-redis:cache:request',
  CACHE_EVICTION: 'node-redis:cache:eviction',
  COMMAND_REPLY: 'node-redis:command:reply',
} as const;

/**
 * Argument sanitization rules adapted from @opentelemetry/redis-common (Apache 2.0).
 * Controls how many arguments after the command name are included in trace context.
 * https://github.com/open-telemetry/opentelemetry-js-contrib/blob/main/packages/redis-common/src/index.ts
 */
const SERIALIZATION_SUBSETS: Array<{ regex: RegExp; args: number }> = [
  { regex: /^ECHO/i, args: 0 },
  { regex: /^(LPUSH|MSET|PFA|PUBLISH|RPUSH|SADD|SET|SPUBLISH|XADD|ZADD)/i, args: 1 },
  { regex: /^(HSET|HMSET|LSET|LINSERT)/i, args: 2 },
  { regex: /^(ACL|BIT|B[LRZ]|CLIENT|CLUSTER|CONFIG|COMMAND|DECR|DEL|EVAL|EX|FUNCTION|GEO|GET|HINCR|HMGET|HSCAN|INCR|L[TRLM]|MEMORY|P[EFISTU]|RPOP|S[CDIMORSU]|XACK|X[CDGILPRT]|Z[CDILMPRS])/i, args: -1 },
];

export function sanitizeArgs(args: ReadonlyArray<unknown>): ReadonlyArray<string> {
  if (args.length === 0) return [];

  const commandName = String(args[0]);
  let allowedArgCount = 0; // default: command name only for unlisted commands

  for (const subset of SERIALIZATION_SUBSETS) {
    if (subset.regex.test(commandName)) {
      allowedArgCount = subset.args;
      break;
    }
  }

  // All args are safe (structural/read commands)
  if (allowedArgCount === -1) {
    return args.map(a => String(a));
  }

  const result: string[] = [commandName];
  for (let i = 1; i < args.length; i++) {
    if (i <= allowedArgCount) {
      result.push(String(args[i]));
    } else {
      result.push('?');
    }
  }
  return result;
}

export interface CommandTraceContext {
  command: string;
  args: ReadonlyArray<string>;
  database: number;
  serverAddress: string;
  serverPort: number | undefined;
  clientId: string;
}

export interface BatchCommandTraceContext extends CommandTraceContext {
  batchMode: 'MULTI' | 'PIPELINE';
  batchSize: number;
}

export interface ConnectTraceContext {
  serverAddress: string;
  serverPort: number | undefined;
  clientId: string;
}

export interface BatchTraceContext {
  batchMode: 'MULTI' | 'PIPELINE';
  batchSize: number;
  database: number;
  serverAddress: string;
  serverPort: number | undefined;
  clientId: string;
}

type CommandContext = CommandTraceContext | BatchCommandTraceContext;

// Check explicitly for `false` rather than truthiness because `hasSubscribers`
// is not available on all Node.js versions that support TracingChannel.
// When `hasSubscribers` is `undefined` (older Node), we assume there are
// subscribers and trace unconditionally, keeping the zero-cost optimization
// only for versions where we can reliably check.
function shouldTrace(channel: TracingChannel<any> | undefined): channel is TracingChannel<any> {
  return !!channel && channel.hasSubscribers !== false;
}

const commandChannel: TracingChannel<CommandContext> | undefined = hasTracingChannel
  ? dc.tracingChannel(CHANNELS.TRACE_COMMAND)
  : undefined;

const connectChannel: TracingChannel<ConnectTraceContext> | undefined = hasTracingChannel
  ? dc.tracingChannel(CHANNELS.TRACE_CONNECT)
  : undefined;

const batchChannel: TracingChannel<BatchTraceContext> | undefined = hasTracingChannel
  ? dc.tracingChannel(CHANNELS.TRACE_BATCH)
  : undefined;

export function traceCommand<T>(
  fn: () => Promise<T>,
  contextFactory: () => CommandContext
): Promise<T> {
  if (shouldTrace(commandChannel)) {
    return commandChannel.tracePromise(fn, contextFactory());
  }
  return fn();
}

export function traceBatch<T>(
  fn: () => Promise<T>,
  contextFactory: () => BatchTraceContext
): Promise<T> {
  if (shouldTrace(batchChannel)) {
    return batchChannel.tracePromise(fn, contextFactory());
  }
  return fn();
}

export function traceConnect<T>(
  fn: () => Promise<T>,
  contextFactory: () => ConnectTraceContext
): Promise<T> {
  if (shouldTrace(connectChannel)) {
    return connectChannel.tracePromise(fn, contextFactory());
  }
  return fn();
}

// ---------------------------------------------------------------------------
// Point-event channels (plain dc.channel — fire-and-forget, no async lifecycle)
// ---------------------------------------------------------------------------

// Connection lifecycle
export interface ConnectionReadyEvent {
  clientId: string;
  serverAddress?: string;
  serverPort?: number;
  createTimeMs: number;
}

export interface ConnectionClosedEvent {
  clientId: string;
  reason: string;
}

export interface ConnectionRelaxedTimeoutEvent {
  clientId: string;
  value: number; // +1 relaxed, -1 unrelaxed
}

export interface ConnectionHandoffEvent {
  clientId: string;
}

export interface ConnectionWaitStartEvent {
  clientId?: string;
  startTime: number;
}

export interface ConnectionWaitEndEvent {
  clientId?: string;
  durationMs: number;
}

// Errors and maintenance
export interface ClientErrorEvent {
  error: Error;
  origin: string;
  internal: boolean;
  clientId?: string;
  retryCount?: number;
}

export interface MaintenanceNotificationEvent {
  notification: string;
  clientId?: string;
}

// PubSub
export interface PubSubMessageEvent {
  direction: 'in' | 'out';
  clientId: string;
  channel?: unknown;
  sharded?: boolean;
}

// Client-side cache
export interface CacheRequestEvent {
  result: string; // 'hit' | 'miss'
  clientId?: string;
}

export interface CacheEvictionEvent {
  reason: string;
  count: number;
  clientId?: string;
}

// Command reply (for pubsub out + stream lag)
export interface CommandReplyEvent {
  args: ReadonlyArray<unknown>;
  reply: unknown;
  clientId: string;
}

export interface ChannelEvents {
  [CHANNELS.CONNECTION_READY]: ConnectionReadyEvent;
  [CHANNELS.CONNECTION_CLOSED]: ConnectionClosedEvent;
  [CHANNELS.CONNECTION_RELAXED_TIMEOUT]: ConnectionRelaxedTimeoutEvent;
  [CHANNELS.CONNECTION_HANDOFF]: ConnectionHandoffEvent;
  [CHANNELS.CONNECTION_WAIT_START]: ConnectionWaitStartEvent;
  [CHANNELS.CONNECTION_WAIT_END]: ConnectionWaitEndEvent;
  [CHANNELS.ERROR]: ClientErrorEvent;
  [CHANNELS.MAINTENANCE]: MaintenanceNotificationEvent;
  [CHANNELS.PUBSUB]: PubSubMessageEvent;
  [CHANNELS.CACHE_REQUEST]: CacheRequestEvent;
  [CHANNELS.CACHE_EVICTION]: CacheEvictionEvent;
  [CHANNELS.COMMAND_REPLY]: CommandReplyEvent;
}

const channelCache = new Map<string, { hasSubscribers: boolean; publish(message: any): void }>();

function getChannel(name: string) {
  if (!dc?.channel) return undefined;
  let ch = channelCache.get(name);
  if (!ch) {
    ch = dc.channel(name) as { hasSubscribers: boolean; publish(message: any): void };
    channelCache.set(name, ch);
  }
  return ch!;
}

export function publish<K extends keyof ChannelEvents>(
  name: K,
  factory: () => ChannelEvents[K]
): void {
  const ch = getChannel(name);
  if (ch?.hasSubscribers) {
    ch.publish(factory());
  }
}
