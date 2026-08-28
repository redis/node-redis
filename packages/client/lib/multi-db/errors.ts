export class TemporarilyUnavailableError extends Error {
  constructor() {
    super('All databases are temporarily unavailable');
  }
}

export class PermanentlyUnavailableError extends Error {
  constructor(maxAttempts: number) {
    super(`All databases are unavailable, ${maxAttempts} failover attempts exhausted`);
  }
}
