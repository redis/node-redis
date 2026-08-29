/** All members are currently down but failover attempts remain — the condition may clear. */
export class TemporarilyUnavailableError extends Error {
  constructor() {
    super('All databases are temporarily unavailable');
  }
}

/** All members are down and the configured `maxFailoverAttempts` are exhausted — the client has stopped retrying. */
export class PermanentlyUnavailableError extends Error {
  constructor(maxAttempts: number) {
    super(`All databases are unavailable, ${maxAttempts} failover attempts exhausted`);
  }
}
