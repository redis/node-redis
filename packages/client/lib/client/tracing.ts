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

export interface CommandTraceContext {
  command: string;
  args: ReadonlyArray<unknown>;
  database: number;
  serverAddress: string;
  serverPort: number | undefined;
}

export interface BatchCommandTraceContext extends CommandTraceContext {
  batchMode: 'MULTI' | 'PIPELINE';
  batchSize: number;
}

export interface ConnectTraceContext {
  serverAddress: string;
  serverPort: number | undefined;
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
