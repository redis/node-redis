/**
 * A clock that provides the current time in milliseconds since the epoch.
 */
export interface Clock {
  // returns milliseconds since epoch
  now(): number;
}

/**
 * A clock that uses the system time ( Date.now() ) to provide the current time.
 */
export class SystemClock implements Clock {
  now(): number {
    return Date.now();
  }
}

/**
 * A fake clock that allows the time to be manually advanced.
 */
export class FakeClock implements Clock {
  constructor(private timeMs: number) {}

  now(): number {
    return this.timeMs;
  }

  advance(ms: number): void {
    this.timeMs += ms;
  }
}

export const SYSTEM_CLOCK = new SystemClock();

