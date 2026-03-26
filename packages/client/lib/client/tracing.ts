import type * as DC from 'node:diagnostics_channel';

const dc: typeof DC | undefined = (() => {
  try {
    return ('getBuiltinModule' in process)
      ? (process as { getBuiltinModule: (name: string) => typeof DC }).getBuiltinModule('node:diagnostics_channel')
      : require('node:diagnostics_channel');
  } catch {
    return undefined;
  }
})();

const hasTracingChannel = typeof dc?.tracingChannel === 'function';

export const CHANNELS = {
  // TracingChannel (async lifecycle)
  TRACE_COMMAND: 'node-redis:command',
  TRACE_BATCH: 'node-redis:batch',
  TRACE_CONNECT: 'node-redis:connect',
  TRACE_CONNECTION_WAIT: 'node-redis:connection:wait',
  // Point events (fire-and-forget)
  CONNECTION_READY: 'node-redis:connection:ready',
  CONNECTION_CLOSED: 'node-redis:connection:closed',
  CONNECTION_RELAXED_TIMEOUT: 'node-redis:connection:relaxed-timeout',
  CONNECTION_HANDOFF: 'node-redis:connection:handoff',
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

/**
 * Sanitizes the arguments of a command to remove sensitive information.
 */
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

// Context for the batch operation itself (MULTI/PIPELINE as a whole).
// Distinct from BatchCommandTraceContext which is a single command within a batch.
export interface BatchOperationContext {
  batchMode: 'MULTI' | 'PIPELINE';
  batchSize: number;
  database: number;
  serverAddress: string;
  serverPort: number | undefined;
  clientId: string;
}

type CommandContext = CommandTraceContext | BatchCommandTraceContext;

interface TracingChannelContextMap {
  [CHANNELS.TRACE_COMMAND]: CommandContext;
  [CHANNELS.TRACE_BATCH]: BatchOperationContext;
  [CHANNELS.TRACE_CONNECT]: ConnectTraceContext;
  [CHANNELS.TRACE_CONNECTION_WAIT]: ConnectionWaitContext;
}

/**
 * Acquires a tracing channel from the diagnostics channel, avoids re-acquiring the same channel.
 * Check explicitly for `false` rather than truthiness because `hasSubscribers`
 * is not available on all Node.js versions that support TracingChannel.
 * When `hasSubscribers` is `undefined` (older Node), we assume there are
 * subscribers and trace unconditionally, keeping the zero-cost optimization
 * only for versions where we can reliably check.
 */
const tracingChannelCache = new Map<string, DC.TracingChannel<any>>();

export function getTracingChannel<K extends keyof TracingChannelContextMap>(
  name: K
): DC.TracingChannel<TracingChannelContextMap[K]> | undefined {
  if (!hasTracingChannel) return undefined;

  let ch = tracingChannelCache.get(name);
  if (!ch) {
    ch = dc?.tracingChannel(name);
    tracingChannelCache.set(name, ch);
  }

  return ch as DC.TracingChannel<TracingChannelContextMap[K]>;
}

/**
 * Checks if a tracing channel has subscribers.
 */
function shouldTrace(channel: DC.TracingChannel<any> | undefined): channel is DC.TracingChannel<any> {
  return !!channel && (channel as DC.TracingChannel & { hasSubscribers?: boolean }).hasSubscribers !== false;
}

export function trace<K extends keyof TracingChannelContextMap, T>(
  name: K,
  fn: () => Promise<T>,
  contextFactory: () => TracingChannelContextMap[K]
): Promise<T> {
  const channel = getTracingChannel(name);
  if (shouldTrace(channel)) {
    // Node types are outdated and don't match the runtime, tracePromise returns the same promise type
    // as the function, so we need to cast it to the correct type.
    return channel.tracePromise(fn, contextFactory()) as unknown as Promise<T>;
  }
  return fn();
}

// ---------------------------------------------------------------------------
// Point-event channel payloads
// ---------------------------------------------------------------------------

// Connection lifecycle
export interface ConnectionReadyEvent {
  clientId: string;
  serverAddress: string | undefined;
  serverPort: number | undefined;
  createTimeMs: number;
}

export interface ConnectionClosedEvent {
  clientId: string;
  reason: string;
  wasConnected: boolean;
}

export interface ConnectionRelaxedTimeoutEvent {
  clientId: string;
  value: number; // +1 relaxed, -1 unrelaxed
}

export interface ConnectionHandoffEvent {
  clientId: string;
}

export interface ConnectionWaitContext {
  clientId?: string;
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
  [CHANNELS.ERROR]: ClientErrorEvent;
  [CHANNELS.MAINTENANCE]: MaintenanceNotificationEvent;
  [CHANNELS.PUBSUB]: PubSubMessageEvent;
  [CHANNELS.CACHE_REQUEST]: CacheRequestEvent;
  [CHANNELS.CACHE_EVICTION]: CacheEvictionEvent;
  [CHANNELS.COMMAND_REPLY]: CommandReplyEvent;
}

interface Channel {
  readonly hasSubscribers: boolean;
  publish(message: unknown): void;
  subscribe(handler: (message: any) => void): void;
  unsubscribe(handler: (message: any) => void): void;
}

const channelCache = new Map<string, Channel>();

/**
 * Acquires a channel from the diagnostics channel, avoids re-acquiring the same channel.
 */
export function getChannel(name: string): Channel | undefined {
  if (!dc?.channel) return undefined;

  let ch = channelCache.get(name);
  if (!ch) {
    ch = dc.channel(name) as unknown as Channel;
    channelCache.set(name, ch);
  }

  return ch;
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
