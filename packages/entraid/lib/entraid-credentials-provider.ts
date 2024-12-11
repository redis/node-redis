import { AuthenticationResult } from '@azure/msal-common/node';
import {
  BasicAuth, StreamingCredentialsProvider, IdentityProvider, TokenManager,
  ReAuthenticationError, StreamingCredentialsListener, IDPError, Token
} from '@redis/authx';

/**
 * A streaming credentials provider that uses the Entraid identity provider to provide credentials.
 * Please use one of the factory functions in `entraid-credetfactories.ts` to create an instance of this class for the different
 * type of authentication flows.
 */
export class EntraidCredentialsProvider implements StreamingCredentialsProvider {
  readonly type = 'streaming-credentials-provider';

  private readonly listeners: Set<StreamingCredentialsListener<BasicAuth>> = new Set();

  private tokenManagerDisposable: Disposable | null = null;
  private isStarting: boolean = false;

  private pendingSubscribers: Array<{
    resolve: (value: [BasicAuth, Disposable]) => void;
    reject: (error: Error) => void;
    listener: StreamingCredentialsListener<BasicAuth>;
  }> = [];

  constructor(
    private readonly tokenManager: TokenManager<AuthenticationResult>,
    private readonly idp: IdentityProvider<AuthenticationResult>,
    options: {
      onReAuthenticationError?: (error: ReAuthenticationError) => void
    } = {}
  ) {
    this.onReAuthenticationError = options.onReAuthenticationError ??
      ((error) => console.error('ReAuthenticationError', error));
  }

  async subscribe(
    listener: StreamingCredentialsListener<BasicAuth>
  ): Promise<[BasicAuth, Disposable]> {

    const currentToken = this.tokenManager.getCurrentToken();

    if (currentToken) {
      this.listeners.add(listener);
      return [this.toBasicAuth(currentToken.value), this.createDisposable(listener)];
    }

    if (this.isStarting) {
      return new Promise((resolve, reject) => {
        this.pendingSubscribers.push({ resolve, reject, listener });
      });
    }

    this.isStarting = true;
    try {
      const initialToken = await this.startTokenManagerAndObtainInitialToken();

      this.pendingSubscribers.forEach(({ resolve, listener }) => {
        this.listeners.add(listener);
        resolve([this.toBasicAuth(initialToken.value), this.createDisposable(listener)]);
      });

      this.pendingSubscribers = [];
      this.listeners.add(listener);

      return [this.toBasicAuth(initialToken.value), this.createDisposable(listener)];
    } finally {
      this.isStarting = false;
    }
  }

  onReAuthenticationError: (error: ReAuthenticationError) => void;

  private toBasicAuth(token: AuthenticationResult): BasicAuth {
    return {
      username: token.account?.username ?? undefined,
      password: token.accessToken
    };
  }

  private createTokenManagerListener(subscribers: Set<StreamingCredentialsListener<BasicAuth>>) {
    return {
      onError: (error: IDPError): void => {
        if (error.isFatal) {
          subscribers.forEach(listener => listener.onError(error));
        } else {
          console.log('Transient identity provider error', error);
        }
      },
      onNext: (token: { value: AuthenticationResult }): void => {
        const credentials = this.toBasicAuth(token.value);
        subscribers.forEach(listener => listener.onNext(credentials));
      }
    };
  }

  private createDisposable(listener: StreamingCredentialsListener<BasicAuth>): Disposable {
    return {
      [Symbol.dispose]: () => {
        this.listeners.delete(listener);
        if (this.listeners.size === 0 && this.tokenManagerDisposable) {
          this.tokenManagerDisposable[Symbol.dispose]();
          this.tokenManagerDisposable = null;
        }
      }
    };
  }

  private async startTokenManagerAndObtainInitialToken(): Promise<Token<AuthenticationResult>> {
    const initialResponse = await this.idp.requestToken();
    const token = this.tokenManager.wrapAndSetCurrentToken(initialResponse.token, initialResponse.ttlMs);

    this.tokenManagerDisposable = this.tokenManager.start(
      this.createTokenManagerListener(this.listeners),
      this.tokenManager.calculateRefreshTime(token)
    );
    return token;
  }

  public hasActiveSubscriptions(): boolean {
    return this.tokenManagerDisposable !== null && this.listeners.size > 0;
  }

  public getSubscriptionsCount(): number {
    return this.listeners.size;
  }

}