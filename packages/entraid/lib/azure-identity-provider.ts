import type { AccessToken } from '@azure/core-auth';

import { IdentityProvider, TokenResponse } from '@redis/client/dist/lib/authx';

export class AzureIdentityProvider implements IdentityProvider<AccessToken> {
  private readonly getToken: () => Promise<AccessToken>;

  constructor(getToken: () => Promise<AccessToken>) {
    this.getToken = getToken;
  }

  async requestToken(): Promise<TokenResponse<AccessToken>> {
    const result = await this.getToken();
    return {
      token: result,
      ttlMs: result.expiresOnTimestamp - Date.now()
    };
  }

}


