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
 * Work bound to a member was cut short because traffic switched away from it:
 * a command still queued, unsent, at the switch (rejected so it can never
 * execute on the demoted member when that member reconnects later), a pinned
 * `multi()` executed after the switch, or a pinned scan iterator's next batch.
 * @experimental
 */
export class CommandAbandonedError extends Error {
  constructor() {
    super('Command abandoned: its database failed over while the command was still queued');
    this.name = 'CommandAbandonedError';
  }
}
