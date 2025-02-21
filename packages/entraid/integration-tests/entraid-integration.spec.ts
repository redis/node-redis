import { DefaultAzureCredential, EnvironmentCredential } from '@azure/identity';
import { BasicAuth } from '@redis/client/dist/lib/authx';
import { createClient } from '@redis/client';
import { EntraIdCredentialsProviderFactory, REDIS_SCOPE_DEFAULT } from '../lib/entra-id-credentials-provider-factory';
import { strict as assert } from 'node:assert';
import { spy, SinonSpy } from 'sinon';
import { randomUUID } from 'crypto';
import { loadFromFile, RedisEndpointsConfig } from '@redis/test-utils/lib/cae-client-testing';
import { EntraidCredentialsProvider } from '../lib/entraid-credentials-provider';
import * as crypto from 'node:crypto';

describe('EntraID Integration Tests', () => {

  it('client configured with client secret should be able to authenticate/re-authenticate', async () => {
    const config = await readConfigFromEnv();
    await runAuthenticationTest(() =>
      EntraIdCredentialsProviderFactory.createForClientCredentials({
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        authorityConfig: { type: 'multi-tenant', tenantId: config.tenantId },
        tokenManagerConfig: {
          expirationRefreshRatio: 0.0001
        }
      })
    );
  });

  it('client configured with client certificate should be able to authenticate/re-authenticate', async () => {
    const config = await readConfigFromEnv();
    await runAuthenticationTest(() =>
      EntraIdCredentialsProviderFactory.createForClientCredentialsWithCertificate({
        clientId: config.clientId,
        certificate: convertCertsForMSAL(config.cert, config.privateKey),
        authorityConfig: { type: 'multi-tenant', tenantId: config.tenantId },
        tokenManagerConfig: {
          expirationRefreshRatio: 0.0001
        }
      })
    );
  });

  it('client with system managed identity should be able to authenticate/re-authenticate', async () => {
    const config = await readConfigFromEnv();
    await runAuthenticationTest(() =>
      EntraIdCredentialsProviderFactory.createForSystemAssignedManagedIdentity({
        clientId: config.clientId,
        authorityConfig: { type: 'multi-tenant', tenantId: config.tenantId },
        tokenManagerConfig: {
          expirationRefreshRatio: 0.00001
        }
      })
    );
  });

  it('client with DefaultAzureCredential should be able to authenticate/re-authenticate', async () => {

    const azureCredential = new DefaultAzureCredential();

    await runAuthenticationTest(() =>
        EntraIdCredentialsProviderFactory.createForDefaultAzureCredential({
          credential: azureCredential,
          scopes: REDIS_SCOPE_DEFAULT,
          tokenManagerConfig: {
            expirationRefreshRatio: 0.00001
          }
        })
      , { testingDefaultAzureCredential: true });
  });

  it('client with EnvironmentCredential should be able to authenticate/re-authenticate', async () => {
    const envCredential = new EnvironmentCredential();

    await runAuthenticationTest(() =>
        EntraIdCredentialsProviderFactory.createForDefaultAzureCredential({
          credential: envCredential,
          scopes: REDIS_SCOPE_DEFAULT,
          tokenManagerConfig: {
            expirationRefreshRatio: 0.00001
          }
        })
      , { testingDefaultAzureCredential: true });
  });

  interface TestConfig {
    clientId: string;
    clientSecret: string;
    authority: string;
    tenantId: string;
    redisScopes: string;
    cert: string;
    privateKey: string;
    userAssignedManagedId: string;
    endpoints: RedisEndpointsConfig;
  }

  const readConfigFromEnv = async (): Promise<TestConfig> => {
    const requiredEnvVars = {
      AZURE_CLIENT_ID: process.env.AZURE_CLIENT_ID,
      AZURE_CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET,
      AZURE_AUTHORITY: process.env.AZURE_AUTHORITY,
      AZURE_TENANT_ID: process.env.AZURE_TENANT_ID,
      AZURE_REDIS_SCOPES: process.env.AZURE_REDIS_SCOPES,
      AZURE_CERT: process.env.AZURE_CERT,
      AZURE_PRIVATE_KEY: process.env.AZURE_PRIVATE_KEY,
      AZURE_USER_ASSIGNED_MANAGED_ID: process.env.AZURE_USER_ASSIGNED_MANAGED_ID,
      REDIS_ENDPOINTS_CONFIG_PATH: process.env.REDIS_ENDPOINTS_CONFIG_PATH
    };

    Object.entries(requiredEnvVars).forEach(([key, value]) => {
      if (value == undefined) {
        throw new Error(`${key} environment variable must be set`);
      }
    });

    return {
      endpoints: await loadFromFile(requiredEnvVars.REDIS_ENDPOINTS_CONFIG_PATH as string),
      clientId: requiredEnvVars.AZURE_CLIENT_ID as string,
      clientSecret: requiredEnvVars.AZURE_CLIENT_SECRET as string,
      authority: requiredEnvVars.AZURE_AUTHORITY as string,
      tenantId: requiredEnvVars.AZURE_TENANT_ID as string,
      redisScopes: requiredEnvVars.AZURE_REDIS_SCOPES as string,
      cert: requiredEnvVars.AZURE_CERT as string,
      privateKey: requiredEnvVars.AZURE_PRIVATE_KEY as string,
      userAssignedManagedId: requiredEnvVars.AZURE_USER_ASSIGNED_MANAGED_ID as string
    };
  };

  interface TokenDetail {
    token: string;
    exp: number;
    iat: number;
    lifetime: number;
    uti: string;
  }

  const setupTestClient = async (credentialsProvider: EntraidCredentialsProvider) => {
    const config = await readConfigFromEnv();
    const client = createClient({
      url: config.endpoints['standalone-entraid-acl'].endpoints[0],
      credentialsProvider
    });

    const clientInstance = (client as any)._self;
    const reAuthSpy: SinonSpy = spy(clientInstance, 'reAuthenticate');

    return { client, reAuthSpy };
  };

  const runClientOperations = async (client: any) => {
    const startTime = Date.now();
    while (Date.now() - startTime < 1000) {
      const key = randomUUID();
      await client.set(key, 'value');
      const value = await client.get(key);
      assert.equal(value, 'value');
      await client.del(key);
    }
  };

  /**
   * Validates authentication tokens generated during re-authentication
   *
   * @param reAuthSpy - The Sinon spy on the reAuthenticate method
   * @param skipUniqueCheckForDefaultAzureCredential - Skip the unique check for DefaultAzureCredential as there are no guarantees that the tokens will be unique
   * if the test is using default azure credential
   */
  const validateTokens = (reAuthSpy: SinonSpy, skipUniqueCheckForDefaultAzureCredential: boolean) => {
    assert(reAuthSpy.callCount >= 1,
      `reAuthenticate should have been called at least once, but was called ${reAuthSpy.callCount} times`);

    const tokenDetails: TokenDetail[] = reAuthSpy.getCalls().map(call => {
      const creds = call.args[0] as BasicAuth;
      if (!creds.password) {
        throw new Error('Expected password to be set in BasicAuth credentials');
      }
      const tokenPayload = JSON.parse(
        Buffer.from(creds.password.split('.')[1], 'base64').toString()
      );

      return {
        token: creds.password,
        exp: tokenPayload.exp,
        iat: tokenPayload.iat,
        lifetime: tokenPayload.exp - tokenPayload.iat,
        uti: tokenPayload.uti
      };
    });

    // we can't guarantee that the tokens will be unique when using DefaultAzureCredential
    if (!skipUniqueCheckForDefaultAzureCredential) {
      // Verify unique tokens
      const uniqueTokens = new Set(tokenDetails.map(detail => detail.token));
      assert.equal(
        uniqueTokens.size,
        reAuthSpy.callCount,
        `Expected ${reAuthSpy.callCount} different tokens, but got ${uniqueTokens.size} unique tokens`
      );

      // Verify all tokens are not cached (i.e. have the same lifetime)
      const uniqueLifetimes = new Set(tokenDetails.map(detail => detail.lifetime));
      assert.equal(
        uniqueLifetimes.size,
        1,
        `Expected all tokens to have the same lifetime, but found ${uniqueLifetimes.size} different lifetimes: ${(Array.from(uniqueLifetimes).join(','))} seconds`
      );

      // Verify that all tokens have different uti (unique token identifier)
      const uniqueUti = new Set(tokenDetails.map(detail => detail.uti));
      assert.equal(
        uniqueUti.size,
        reAuthSpy.callCount,
        `Expected all tokens to have different uti, but found ${uniqueUti.size} different uti in: ${(Array.from(uniqueUti).join(','))}`
      );
    }
  };

  const runAuthenticationTest = async (setupCredentialsProvider: () => any, options: {
    testingDefaultAzureCredential: boolean
  } = { testingDefaultAzureCredential: false }) => {
    const { client, reAuthSpy } = await setupTestClient(setupCredentialsProvider());

    try {
      await client.connect();
      await runClientOperations(client);
      validateTokens(reAuthSpy, options.testingDefaultAzureCredential);
    } finally {
      await client.destroy();
    }
  };

});

function getCertificate(certBase64) {
  try {
    const decodedCert = Buffer.from(certBase64, 'base64');
    const cert = new crypto.X509Certificate(decodedCert);
    return cert;
  } catch (error) {
    console.error('Error parsing certificate:', error);
    throw error;
  }
}

function getCertificateThumbprint(certBase64) {
  const cert = getCertificate(certBase64);
  return cert.fingerprint.replace(/:/g, '');
}

function convertCertsForMSAL(certBase64, privateKeyBase64) {
  const thumbprint = getCertificateThumbprint(certBase64);

  const privateKeyPEM = `-----BEGIN PRIVATE KEY-----\n${privateKeyBase64}\n-----END PRIVATE KEY-----`;

  return {
    thumbprint: thumbprint,
    privateKey: privateKeyPEM,
    x5c: certBase64
  }

}


