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

export class SocketTimeoutDuringMaintenanceError extends TimeoutError {
  constructor(timeout: number) {
    super(`Socket timeout during maintenance. Expecting data, but didn't receive any in ${timeout}ms.`);
  }
}

export class CommandTimeoutDuringMaintenanceError extends TimeoutError {
  constructor(timeout: number) {
    super(`Command timeout during maintenance. Waited to write command for more than ${timeout}ms.`);
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
