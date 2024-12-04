import { Clock, SYSTEM_CLOCK } from './clock';

/**
 * A token that can be used to authenticate with a service.
 */
export class Token<T> {
  constructor(
    public readonly value: T,
    //represents the token deadline - the time in milliseconds since the Unix epoch at which the token expires
    public readonly expiresAtMs: number,
    //represents the time in milliseconds since the Unix epoch at which the token was received
    public readonly receivedAtMs: number
  ) {}

  /**
   * Returns the time-to-live of the token in milliseconds.
   * @param clock The clock to use for determining the current time.
   */
  getTtlMs(clock: Clock = SYSTEM_CLOCK): number {
    const now = clock.now();
    if (this.expiresAtMs < now) {
      return 0;
    }
    return this.expiresAtMs - now;
  }
}