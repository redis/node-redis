# @redis/entraid

Secure token-based authentication for Redis clients using Microsoft Entra ID (formerly Azure Active Directory).

## Features

- Token-based authentication using Microsoft Entra ID
- Automatic token refresh before expiration
- Automatic re-authentication of all connections after token refresh
- Support for multiple authentication flows:
  - Managed identities (system-assigned and user-assigned)
  - Service principals (with or without certificates)
  - Authorization Code with PKCE flow
  - DefaultAzureCredential from @azure/identity
- Built-in retry mechanisms for transient failures

## Installation


```bash
npm install "@redis/client@5.0.0-next.7"
npm install "@redis/entraid@5.0.0-next.7"
```

## Getting Started

The first step to using @redis/entraid is choosing the right credentials provider for your authentication needs. The `EntraIdCredentialsProviderFactory` class provides several factory methods to create the appropriate provider:

- `createForSystemAssignedManagedIdentity`: Use when your application runs in Azure with a system-assigned managed identity
- `createForUserAssignedManagedIdentity`: Use when your application runs in Azure with a user-assigned managed identity
- `createForClientCredentials`: Use when authenticating with a service principal using client secret
- `createForClientCredentialsWithCertificate`: Use when authenticating with a service principal using a certificate
- `createForAuthorizationCodeWithPKCE`: Use for interactive authentication flows in user applications
- `createForDefaultAzureCredential`: Use when you want to leverage Azure Identity's DefaultAzureCredential

## Usage Examples

### Service Principal Authentication

```typescript
import { createClient } from '@redis/client';
import { EntraIdCredentialsProviderFactory } from '@redis/entraid';

const provider = EntraIdCredentialsProviderFactory.createForClientCredentials({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  authorityConfig: {
    type: 'multi-tenant',
    tenantId: 'your-tenant-id'
  },
  tokenManagerConfig: {
    expirationRefreshRatio: 0.8 // Refresh token after 80% of its lifetime
  }
});

const client = createClient({
  url: 'redis://your-host',
  credentialsProvider: provider
});

await client.connect();
```

### System-Assigned Managed Identity

```typescript
const provider = EntraIdCredentialsProviderFactory.createForSystemAssignedManagedIdentity({
  clientId: 'your-client-id',
  tokenManagerConfig: {
    expirationRefreshRatio: 0.8
  }
});
```

### User-Assigned Managed Identity

```typescript
const provider = EntraIdCredentialsProviderFactory.createForUserAssignedManagedIdentity({
  clientId: 'your-client-id',
  userAssignedClientId: 'your-user-assigned-client-id',
  tokenManagerConfig: {
    expirationRefreshRatio: 0.8
  }
});
```

### DefaultAzureCredential Authentication

tip: see a real sample here: [samples/interactive-browser/index.ts](./samples/interactive-browser/index.ts)

The DefaultAzureCredential from @azure/identity provides a simplified authentication experience that automatically tries different authentication methods based on the environment. This is especially useful for applications that need to work in different environments (local development, CI/CD, and production).

```typescript
import { createClient } from '@redis/client';
import { getDefaultAzureCredential } from '@azure/identity';
import { EntraIdCredentialsProviderFactory, REDIS_SCOPE_DEFAULT } from '@redis/entraid';

// Create a DefaultAzureCredential instance
const credential = getDefaultAzureCredential();

// Create a provider using DefaultAzureCredential
const provider = EntraIdCredentialsProviderFactory.createForDefaultAzureCredential({

  credential,
  scopes: REDIS_SCOPE_DEFAULT, // The Redis scope
  // Optional additional parameters for getToken
  options: {
    // Any options you would normally pass to azure's default credential.getToken()
  },
  tokenManagerConfig: {
    expirationRefreshRatio: 0.8
  }
});

const client = createClient({
  url: 'redis://your-host',
  credentialsProvider: provider
});

await client.connect();
```

#### Important Notes on Using DefaultAzureCredential

When using the `createForDefaultAzureCredential` method, you need to:

1. Create your own instance of `DefaultAzureCredential`
2. Pass the same parameters to the factory method that you would use with the `getToken()` method:
   - `scopes`: The Redis scope (use the exported `REDIS_SCOPE_DEFAULT` constant)
   - `options`: Any additional options for the getToken method

This factory method creates a wrapper around DefaultAzureCredential that adapts it to the Redis client's
authentication system, while maintaining all the flexibility of the original Azure Identity authentication.

## Important Limitations

### RESP2 PUB/SUB Limitations

When using RESP2 (Redis Serialization Protocol 2), there are important limitations with PUB/SUB:

- **No Re-Authentication in PUB/SUB Mode**: In RESP2, once a connection enters PUB/SUB mode, the socket is blocked and cannot process out-of-band commands like AUTH. This means that connections in PUB/SUB mode cannot be re-authenticated when tokens are refreshed.
- **Connection Eviction**: As a result, PUB/SUB connections will be evicted by the Redis proxy when their tokens expire. The client will need to establish new connections with fresh tokens.

### Transaction Safety

When using token-based authentication, special care must be taken with Redis transactions. The token manager runs in the background and may attempt to re-authenticate connections at any time by sending AUTH commands. This can interfere with manually constructed transactions.

#### ✅ Recommended: Use the Official Transaction API

Always use the official transaction API provided by the client:

```typescript
// Correct way to handle transactions
const multi = client.multi();
multi.set('key1', 'value1');
multi.set('key2', 'value2');
await multi.exec();
```

#### ❌ Avoid: Manual Transaction Construction

Do not manually construct transactions by sending individual MULTI/EXEC commands:

```typescript
// Incorrect and potentially dangerous
await client.sendCommand(['MULTI']);
await client.sendCommand(['SET', 'key1', 'value1']);
await client.sendCommand(['SET', 'key2', 'value2']);
await client.sendCommand(['EXEC']); // Risk of AUTH command being injected before EXEC
```

## Error Handling

The provider includes built-in retry mechanisms for transient errors:

```typescript
const provider = EntraIdCredentialsProviderFactory.createForClientCredentials({
  // ... other config ...
  tokenManagerConfig: {
    retry: {
      maxAttempts: 3,
      initialDelayMs: 100,
      maxDelayMs: 1000,
      backoffMultiplier: 2
    }
  }
});
```
