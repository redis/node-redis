import { AuthenticationResult } from '@azure/msal-common/node';
import {
  BasicAuth, StreamingCredentialsProvider, IdentityProvider, TokenManager,
  ReAuthenticationError, StreamingCredentialsListener, IDPError, Disposable
} from '@redis/client/lib/client/authx';;

/**
 * A streaming credentials provider that uses the Entraid identity provider to provide credentials.
 * Please use one of the factory functions in `entraid-credetfactories.ts` to create an instance of this class for the different
 * type of authentication flows.
 */
export class EntraidCredentialsProvider implements StreamingCredentialsProvider {

  onReAuthenticationError: (error: ReAuthenticationError) => void;

  constructor(
    private tokenManager: TokenManager<AuthenticationResult>,
    private idp: IdentityProvider<AuthenticationResult>,
    options: {
      onReAuthenticationError?: (error: ReAuthenticationError) => void
    } = {}
  ) {
    this.type = 'streaming-credentials-provider';
    this.onReAuthenticationError = options.onReAuthenticationError ?? ((error) => {
      console.error('ReAuthenticationError', error);
    });
  }

  readonly type: 'streaming-credentials-provider';

  subscribe: (listener: StreamingCredentialsListener<BasicAuth>) => Promise<[BasicAuth, Disposable]> =
    async (listener: StreamingCredentialsListener<BasicAuth>) => {

      return this.idp.requestToken().then((initialTokenResponse) => {

        const token = this.tokenManager.wrapNativeToken(initialTokenResponse.token, initialTokenResponse.ttlMs);
        const initialDelay = this.tokenManager.calculateRefreshTime(token)

        const disposable = this.tokenManager.start({
          onError(error: IDPError): void {
            if (error.isFatal) {
              listener.onError(error);
            } else {
              console.log('Transient identity provider error', error);
            }
          },
          onNext(token): void {
            listener.onNext({
              username: token.value?.account?.username ?? undefined,
              password: token.value.accessToken
            });
          }
        }, initialDelay);

        return [{
          username: initialTokenResponse.token.account?.username ?? undefined,
          password: initialTokenResponse.token.accessToken
        }, disposable];
      });
    }

}