import { AuthenticationResult } from '@azure/msal-common/node';
import { AccessToken } from '@azure/core-auth';
import {
  BasicAuth, StreamingCredentialsProvider, IdentityProvider, TokenManager,
  ReAuthenticationError, StreamingCredentialsListener, IDPError, Token, Disposable
} from '@redis/client/dist/lib/authx';

/**
 * A streaming credentials provider that uses the Entraid identity provider to provide credentials.
 * Please use one of the factory functions in `entraid-credetfactories.ts` to create an instance of this class for the different
 * type of authentication flows.
 */

export type AuthenticationResponse = AuthenticationResult | AccessToken

export class EntraidCredentialsProvider implements StreamingCredentialsProvider {
  readonly type = 'streaming-credentials-provider';

  readonly #listeners: Set<StreamingCredentialsListener<BasicAuth>> = new Set();

  #tokenManagerDisposable: Disposable | null = null;
  #isStarting: boolean = false;

  #pendingSubscribers: Array<{
    resolve: (value: [BasicAuth, Disposable]) => void;
    reject: (error: Error) => void;
    pendingListener: StreamingCredentialsListener<BasicAuth>;
  }> = [];

  constructor(
    public readonly tokenManager: TokenManager<AuthenticationResponse>,
    public readonly idp: IdentityProvider<AuthenticationResponse>,
    private readonly options: {
      onReAuthenticationError?: (error: ReAuthenticationError) => void;
      credentialsMapper?: (token: AuthenticationResponse) => BasicAuth;
      onRetryableError?: (error: string) => void;
    } = {}
  ) {
    this.onReAuthenticationError = options.onReAuthenticationError ?? DEFAULT_ERROR_HANDLER;
    this.#credentialsMapper = options.credentialsMapper ?? DEFAULT_CREDENTIALS_MAPPER;
  }

  async subscribe(
    listener: StreamingCredentialsListener<BasicAuth>
  ): Promise<[BasicAuth, Disposable]> {

    const currentToken = this.tokenManager.getCurrentToken();

    if (currentToken) {
      return [this.#credentialsMapper(currentToken.value), this.#createDisposable(listener)];
    }

    if (this.#isStarting) {
      return new Promise((resolve, reject) => {
        this.#pendingSubscribers.push({ resolve, reject, pendingListener: listener });
      });
    }

    this.#isStarting = true;
    try {
      const initialToken = await this.#startTokenManagerAndObtainInitialToken();

      this.#pendingSubscribers.forEach(({ resolve, pendingListener }) => {
        resolve([this.#credentialsMapper(initialToken.value), this.#createDisposable(pendingListener)]);
      });
      this.#pendingSubscribers = [];

      return [this.#credentialsMapper(initialToken.value), this.#createDisposable(listener)];
    } finally {
      this.#isStarting = false;
    }
  }

  onReAuthenticationError: (error: ReAuthenticationError) => void;

  #credentialsMapper: (token: AuthenticationResponse) => BasicAuth;

  #createTokenManagerListener(subscribers: Set<StreamingCredentialsListener<BasicAuth>>) {
    return {
      onError: (error: IDPError): void => {
        if (!error.isRetryable) {
          subscribers.forEach(listener => listener.onError(error));
        } else {
          this.options.onRetryableError?.(error.message);
        }
      },
      onNext: (token: { value: AuthenticationResult | AccessToken }): void => {
        const credentials = this.#credentialsMapper(token.value);
        subscribers.forEach(listener => listener.onNext(credentials));
      }
    };
  }

  #createDisposable(listener: StreamingCredentialsListener<BasicAuth>): Disposable {
    this.#listeners.add(listener);

    return {
      dispose: () => {
        this.#listeners.delete(listener);
        if (this.#listeners.size === 0 && this.#tokenManagerDisposable) {
          this.#tokenManagerDisposable.dispose();
          this.#tokenManagerDisposable = null;
        }
      }
    };
  }

  async #startTokenManagerAndObtainInitialToken(): Promise<Token<AuthenticationResponse>> {
    const { ttlMs, token: initialToken } = await this.idp.requestToken();

    const token = this.tokenManager.wrapAndSetCurrentToken(initialToken, ttlMs);
    this.#tokenManagerDisposable = this.tokenManager.start(
      this.#createTokenManagerListener(this.#listeners),
      this.tokenManager.calculateRefreshTime(token)
    );
    return token;
  }

  public hasActiveSubscriptions(): boolean {
    return this.#tokenManagerDisposable !== null && this.#listeners.size > 0;
  }

  public getSubscriptionsCount(): number {
    return this.#listeners.size;
  }

  public getTokenManager() {
    return this.tokenManager;
  }

  public getCurrentCredentials(): BasicAuth | null {
    const currentToken = this.tokenManager.getCurrentToken();
    return currentToken ? this.#credentialsMapper(currentToken.value) : null;
  }

}

export const DEFAULT_CREDENTIALS_MAPPER = (token: AuthenticationResponse): BasicAuth => {
  if (isAuthenticationResult(token)) {
    return {
      username: token.uniqueId,
      password: token.accessToken
    }
  } else {
    return OID_CREDENTIALS_MAPPER(token)
  }
};

const DEFAULT_ERROR_HANDLER = (error: ReAuthenticationError) =>
  console.error('ReAuthenticationError', error);

export const OID_CREDENTIALS_MAPPER = (token: (AuthenticationResult | AccessToken)) => {

  if (isAuthenticationResult(token)) {
    // Client credentials flow is app-only authentication (no user context),
    // so only access token is provided without user-specific claims (uniqueId, idToken, ...)
    // this means that we need to extract the oid from the access token manually
    const accessToken = JSON.parse(Buffer.from(token.accessToken.split('.')[1], 'base64').toString());

    return ({
      username: accessToken.oid,
      password: token.accessToken
    })
  } else {
    const accessToken = JSON.parse(Buffer.from(token.token.split('.')[1], 'base64').toString());

    return ({
      username: accessToken.oid,
      password: token.token
    })
  }

}

/**
 * Type guard to check if a token is an MSAL AuthenticationResult
 * 
 * @param auth - The token to check
 * @returns true if the token is an AuthenticationResult
 */
export function isAuthenticationResult(auth: AuthenticationResult | AccessToken): auth is AuthenticationResult {
  return typeof (auth as AuthenticationResult).accessToken === 'string' && 
         !('token' in auth)
}

/**
 * Type guard to check if a token is an Azure Identity AccessToken
 * 
 * @param auth - The token to check
 * @returns true if the token is an AccessToken
 */
export function isAccessToken(auth: AuthenticationResult | AccessToken): auth is AccessToken {
  return typeof (auth as AccessToken).token === 'string' && 
         !('accessToken' in auth);
}