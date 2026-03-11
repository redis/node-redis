import type { TracingChannel as TracingChannelType } from 'node:diagnostics_channel';

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

const commandChannel: TracingChannelType<CommandContext> | undefined = hasTracingChannel
  ? dc.tracingChannel('node-redis:command')
  : undefined;

const connectChannel: TracingChannelType<ConnectTraceContext> | undefined = hasTracingChannel
  ? dc.tracingChannel('node-redis:connect')
  : undefined;

// Note: @types/node incorrectly types tracePromise as returning void,
// but at runtime it returns the promise from the traced function.
// It's fixed in later versions of the types.
export function traceCommand<T>(
  fn: () => Promise<T>,
  context: CommandContext
): Promise<T> {
  if (commandChannel) {
    return commandChannel.tracePromise(fn, context) as unknown as Promise<T>;
  }
  return fn();
}

export function traceConnect<T>(
  fn: () => Promise<T>,
  context: ConnectTraceContext
): Promise<T> {
  if (connectChannel) {
    return connectChannel.tracePromise(fn, context) as unknown as Promise<T>;
  }
  return fn();
}
