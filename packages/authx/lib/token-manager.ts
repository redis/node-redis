import { IdentityProvider, TokenResponse } from './identity-provider';
import { Token } from './token';

/**
 * The configuration for retrying token refreshes.
 */
export interface RetryPolicy {
  // The maximum number of attempts to retry token refreshes.
  maxAttempts: number;
  // The initial delay in milliseconds before the first retry.
  initialDelayMs: number;
  // The maximum delay in milliseconds between retries (the calculated delay will be capped at this value).
  maxDelayMs: number;
  // The multiplier for exponential backoff between retries. e.g. 2 will double the delay each time.
  backoffMultiplier: number;
  // The percentage of jitter to apply to the delay. e.g. 0.1 will add or subtract up to 10% of the delay.
  jitterPercentage?: number;
  // A custom function to determine if a retry should be attempted based on the error and attempt number.
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

/**
 * the configuration for the TokenManager.
 */
export interface TokenManagerConfig {

  /**
   * Represents the ratio of a token's lifetime at which a refresh should be triggered.
   * For example, a value of 0.75 means the token should be refreshed when 75% of its lifetime has elapsed (or when
   * 25% of its lifetime remains).
   */
  expirationRefreshRatio: number;

  // The retry policy for token refreshes. If not provided, no retries will be attempted.
  retry?: RetryPolicy;
}


/**
 * IDPError is an error that occurs while calling the underlying IdentityProvider.
 *
 * It can be transient and if retry policy is configured, the token manager will attempt to obtain a token again.
 * This means that receiving non-fatal error is not a stream termination event.
 * The stream will be terminated only if the error is fatal.
 */
export class IDPError extends Error {
  constructor(public readonly message: string, public readonly isFatal: boolean) {
    super(message);
    this.name = 'IDPError';
  }
}

/**
 * TokenStreamListener is an interface for objects that listen to token changes.
 */
export type TokenStreamListener<T> = {
  /**
   * Called each time a new token is received.
   * @param token
   */
  onNext: (token: Token<T>) => void;

  /**
   * Called when an error occurs while calling the underlying IdentityProvider. The error can be
   * transient and the token manager will attempt to obtain a token again if retry policy is configured.
   *
   * Only fatal errors will terminate the stream and stop the token manager.
   *
   * @param error
   */
  onError: (error: IDPError) => void;

}

/**
 * TokenManager is responsible for obtaining/refreshing tokens and notifying listeners about token changes.
 * It uses an IdentityProvider to request tokens. The token refresh is scheduled based on the token's TTL and
 * the expirationRefreshRatio configuration.
 *
 * The TokenManager should be disposed when it is no longer needed by calling the dispose method on the Disposable
 * returned by start.
 */
export class TokenManager<T> {
  private currentToken: Token<T> | null = null;
  private refreshTimeout: NodeJS.Timeout | null = null;
  private listener: TokenStreamListener<T> | null = null;
  private retryAttempt: number = 0;

  constructor(
    private readonly identityProvider: IdentityProvider<T>,
    private readonly config: TokenManagerConfig,
  ) {
    if (this.config.expirationRefreshRatio > 1) {
      throw new Error('expirationRefreshRatio must be less than or equal to 1');
    }
    if (this.config.expirationRefreshRatio < 0) {
      throw new Error('expirationRefreshRatio must be greater or equal to 0');
    }
  }

  /**
   * Starts the token manager and returns a Disposable that can be used to stop the token manager.
   *
   * @param listener The listener that will receive token updates.
   * @param initialDelayMs The initial delay in milliseconds before the first token refresh.
   */
  public start(listener: TokenStreamListener<T>, initialDelayMs: number = 0): Disposable {
    if (this.listener) {
      console.log('TokenManager is already running, stopping the previous instance');
      this.stop();
    }

    this.listener = listener;
    this.retryAttempt = 0;

    this.scheduleNextRefresh(initialDelayMs);

    return {
      [Symbol.dispose]: () => this.stop()
    };
  }

  public calculateRetryDelay(): number {
    if (!this.config.retry) return 0;

    const { initialDelayMs, maxDelayMs, backoffMultiplier, jitterPercentage } = this.config.retry;

    let delay = initialDelayMs * Math.pow(backoffMultiplier, this.retryAttempt - 1);

    delay = Math.min(delay, maxDelayMs);

    if (jitterPercentage) {
      const jitterRange = delay * (jitterPercentage / 100);
      const jitterAmount = Math.random() * jitterRange - (jitterRange / 2);
      delay += jitterAmount;
    }

    let result = Math.max(0, Math.floor(delay));

    return result;
  }

  private shouldRetry(error: unknown): boolean {
    if (!this.config.retry) return false;

    const { maxAttempts, shouldRetry } = this.config.retry;

    if (this.retryAttempt >= maxAttempts) {
      return false;
    }

    if (shouldRetry) {
      return shouldRetry(error, this.retryAttempt);
    }

    return false;
  }

  public isRunning(): boolean {
    return this.listener !== null;
  }

  private async refresh(): Promise<void> {
    if (!this.listener) {
      throw new Error('TokenManager is not running, but refresh was called');
    }

    try {
      await this.identityProvider.requestToken().then(this.handleNewToken);
      this.retryAttempt = 0;
    } catch (error) {

      if (this.shouldRetry(error)) {
        this.retryAttempt++;
        const retryDelay = this.calculateRetryDelay();
        this.notifyError(`Token refresh failed (attempt ${this.retryAttempt}), retrying in ${retryDelay}ms: ${error}`, false)
        this.scheduleNextRefresh(retryDelay);
      } else {
        this.notifyError(error, true);
        this.stop();
      }
    }
  }

  private handleNewToken = async ({ token: nativeToken, ttlMs }: TokenResponse<T>): Promise<void> => {
    if (!this.listener) {
      throw new Error('TokenManager is not running, but a new token was received');
    }
    const token = this.wrapNativeToken(nativeToken, ttlMs);
    this.currentToken = token;
    this.listener.onNext(token);

    this.scheduleNextRefresh(this.calculateRefreshTime(token));
  }

  /**
   * Wraps a native token obtained from identity provider.
   * @param nativeToken
   * @param ttlMs
   */
  public wrapNativeToken(nativeToken: T, ttlMs: number): Token<T> {
    const now = Date.now();
    const token = new Token(
      nativeToken,
      now + ttlMs,
      now
    );
    return token;
  }

  private scheduleNextRefresh(delayMs: number): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
    if (delayMs === 0) {
      this.refresh();
    } else {
      this.refreshTimeout = setTimeout(() => this.refresh(), delayMs);
    }

  }

  /**
   * Calculates the time in milliseconds when the token should be refreshed
   * based on the token's TTL and the expirationRefreshRatio configuration.
   *
   * @param token The token to calculate the refresh time for.
   * @param now The current time in milliseconds. Defaults to Date.now().
   */
  public calculateRefreshTime(token: Token<T>, now:number = Date.now()): number {
    const ttlMs = token.getTtlMs(now);
    return Math.floor(ttlMs * this.config.expirationRefreshRatio);
  }

  private stop(): void {

    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }

    this.listener = null;
    this.currentToken = null;
    this.retryAttempt = 0;
  }

  /**
   * Returns the current token or null if no token is available.
   */
  public getCurrentToken(): Token<T> | null {
    return this.currentToken;
  }

  private notifyError = (error: unknown, isFatal: boolean): void => {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (!this.listener) {
      throw new Error(`TokenManager is not running but received an error: ${errorMessage}`);
    }

    this.listener.onError(new IDPError(errorMessage, isFatal));
  }
}