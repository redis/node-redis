import type { TracingChannel as NodeTracingChannel } from 'node:diagnostics_channel';

// @types/node is missing hasSubscribers on TracingChannel and types
// tracePromise as returning void. Both exist at runtime.
interface TracingChannel<ContextType extends object> extends NodeTracingChannel<unknown, ContextType> {
  readonly hasSubscribers: boolean;
  tracePromise<T>(fn: () => Promise<T>, context?: ContextType): Promise<T>;
}

const dc: any = (() => {
  try {
    return ('getBuiltinModule' in process)
      ? (process as any).getBuiltinModule('node:diagnostics_channel')
      : require('node:diagnostics_channel');
  } catch {
    return undefined;
  }
})();

const hasTracingChannel = typeof dc?.tracingChannel === 'function';

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
  ? dc.tracingChannel('node-redis:command')
  : undefined;

const connectChannel: TracingChannel<ConnectTraceContext> | undefined = hasTracingChannel
  ? dc.tracingChannel('node-redis:connect')
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

export function traceConnect<T>(
  fn: () => Promise<T>,
  contextFactory: () => ConnectTraceContext
): Promise<T> {
  if (shouldTrace(connectChannel)) {
    return connectChannel.tracePromise(fn, contextFactory());
  }
  return fn();
}
