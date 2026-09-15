/**
 * All members are currently down but failover attempts remain — the condition may clear.
 * @experimental
 */
export class TemporarilyUnavailableError extends Error {
  constructor() {
    super('All databases are temporarily unavailable');
    this.name = 'TemporarilyUnavailableError';
  }
}

/**
 * All members are down and the configured `maxFailoverAttempts` are exhausted — the client has stopped retrying.
 * @experimental
 */
export class PermanentlyUnavailableError extends Error {
  constructor(maxAttempts: number) {
    super(`All databases are unavailable, ${maxAttempts} failover attempts exhausted`);
    this.name = 'PermanentlyUnavailableError';
  }
}

/**
 * A command was still queued, unsent, on a member when traffic switched away
 * from it. It is rejected at the switch so it can never execute on the demoted
 * member when that member reconnects later.
 * @experimental
 */
export class CommandAbandonedError extends Error {
  constructor() {
    super('Command abandoned: its database failed over while the command was still queued');
    this.name = 'CommandAbandonedError';
  }
}
