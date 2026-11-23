export class AbortError extends Error {
  constructor() {
    super('The command was aborted');
  }
}

export class WatchError extends Error {
  constructor(message = 'One (or more) of the watched keys has been changed') {
    super(message);
  }
}

export class ConnectionTimeoutError extends Error {
  constructor() {
    super('Connection timeout');
  }
}

export class SocketTimeoutError extends Error {
  constructor(timeout: number) {
    super(`Socket timeout timeout. Expecting data, but didn't receive any in ${timeout}ms.`);
  }
}

export class ClientClosedError extends Error {
  constructor() {
    super('The client is closed');
  }
}

export class ClientOfflineError extends Error {
  constructor() {
    super('The client is offline');
  }
}

export class DisconnectsClientError extends Error {
  constructor() {
    super('Disconnects client');
  }
}

export class SocketClosedUnexpectedlyError extends Error {
  constructor() {
    super('Socket closed unexpectedly');
  }
}

export class RootNodesUnavailableError extends Error {
  constructor() {
    super('All the root nodes are unavailable');
  }
}

export class ScanIteratorInterruptedError extends Error {
  constructor(
    cause?: unknown,
    message = 'Scan iteration was interrupted by a Sentinel master change'
  ) {
    super(message, cause === undefined ? undefined : { cause });
  }
}

export class ReconnectStrategyError extends Error {
  originalError: Error;
  socketError: unknown;

  constructor(originalError: Error, socketError: unknown) {
    super(originalError.message);
    this.originalError = originalError;
    this.socketError = socketError;
  }
}

export class ErrorReply extends Error {}

export class SimpleError extends ErrorReply {}

export class BlobError extends ErrorReply {}

export class TimeoutError extends Error {}

/**
 * A command timed out after it was sent, while it waited for its reply. The server may
 * have executed it: retry only if the command is idempotent. Not a `TimeoutError`, which
 * means the command was never sent. Thrown with `rejectInFlight: true`, and when a
 * cluster slot migration stops waiting for the replies of the source node.
 * @experimental
 */
export class TimeoutReadError extends Error {
  constructor(timeout: number) {
    super(`Command timed out after ${timeout}ms waiting for a reply; it may have been executed`);
  }
}

/**
 * A command was aborted after it was sent, while it waited for its reply. The server may
 * have executed it: retry only if the command is idempotent. Not an `AbortError`, which
 * means the command was never sent. Thrown only with `rejectInFlight: true`.
 * @experimental
 */
export class AbortReadError extends Error {
  // `multi-db/error-filter.ts:defaultErrorFilter` must skip this error like `AbortError`.
  constructor() {
    super('Command aborted while waiting for a reply; it may have been executed');
  }
}

/**
 * The socket received no data for the relaxed maintenance timeout and was closed. Commands
 * that waited for a reply reject with this error. The server may have executed them: retry
 * only if the command is idempotent.
 */
export class SocketTimeoutDuringMaintenanceError extends TimeoutReadError {
  constructor(timeout: number) {
    super(timeout);
    this.message = `Socket timeout during maintenance. Expecting data, but didn't receive any in ${timeout}ms.`;
  }
}

export class CommandTimeoutDuringMaintenanceError extends TimeoutError {
  constructor(timeout: number) {
    super(`Command timeout during maintenance. Waited to write command for more than ${timeout}ms.`);
  }
}

/**
 * A command sent during a maintenance window timed out while it waited for its reply,
 * using the relaxed maintenance timeout. The server may have executed it: retry only if
 * the command is idempotent. Thrown only with `rejectInFlight: true`.
 * @experimental
 */
export class CommandTimeoutReadDuringMaintenanceError extends TimeoutReadError {
  constructor(timeout: number) {
    super(timeout);
    this.message = `Command timeout during maintenance. Waited for a reply for more than ${timeout}ms; it may have been executed.`;
  }
}

export class MultiErrorReply extends ErrorReply {
  replies: Array<ErrorReply>;
  errorIndexes: Array<number>;

  constructor(replies: Array<ErrorReply>, errorIndexes: Array<number>) {
    super(`${errorIndexes.length} commands failed, see .replies and .errorIndexes for more information`);
    this.replies = replies;
    this.errorIndexes = errorIndexes;
  }

  *errors() {
    for (const index of this.errorIndexes) {
        yield this.replies[index];
    }
  }
}

export class OpenTelemetryError extends Error { }

export class MaxCommandRedirectionsError extends Error {
  constructor(cause?: unknown) {
    super('Too many Cluster redirections', cause === undefined ? undefined : { cause });
  }
}

export class ClientSideCacheMarkError extends Error {
  readonly command: string;

  constructor(command: string) {
    super(`The "cache" command option has no effect on ${command}: its replies are not eligible for client-side caching`);
    this.command = command;
  }
}

export class ClientSideCacheCommandError extends Error {
  readonly command: string;

  constructor(command: string) {
    super(`${command} is not allowed on a connection managed by client-side caching`);
    this.command = command;
  }
}
