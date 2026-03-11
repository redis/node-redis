import type { TracingChannel as NodeTracingChannel } from 'node:diagnostics_channel';

// @types/node is missing hasSubscribers on TracingChannel and types
// tracePromise as returning void. Both exist at runtime.
interface TracingChannel<ContextType extends object> extends NodeTracingChannel<unknown, ContextType> {
  readonly hasSubscribers: boolean;
  tracePromise<T>(fn: () => Promise<T>, context?: ContextType): Promise<T>;
}

const dc = ('getBuiltinModule' in process)
  ? (process as any).getBuiltinModule('node:diagnostics_channel')
  : require('node:diagnostics_channel');

const hasTracingChannel = typeof dc.tracingChannel === 'function';

export interface CommandTraceContext {
  command: string;
  args: ReadonlyArray<unknown>;
  database: number;
  serverAddress: string;
  serverPort: number;
}

export interface BatchCommandTraceContext extends CommandTraceContext {
  batchMode: 'MULTI' | 'PIPELINE';
  batchSize: number;
}

export interface ConnectTraceContext {
  serverAddress: string;
  serverPort: number;
}

type CommandContext = CommandTraceContext | BatchCommandTraceContext;

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
  if (commandChannel?.hasSubscribers) {
    return commandChannel.tracePromise(fn, contextFactory());
  }
  return fn();
}

export function traceConnect<T>(
  fn: () => Promise<T>,
  contextFactory: () => ConnectTraceContext
): Promise<T> {
  if (connectChannel?.hasSubscribers) {
    return connectChannel.tracePromise(fn, contextFactory());
  }
  return fn();
}
