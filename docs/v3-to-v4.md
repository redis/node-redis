# v3 to v4 Migration Guide

Version 4 of Node Redis is a major refactor. While we have tried to maintain backwards compatibility where possible, several interfaces have changed. Read this guide to understand the differences and how to implement version 4 in your application.

## Breaking Changes

See the [Change Log](../packages/client/CHANGELOG.md).

## Promises

Node Redis now uses native [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) by default for all functions.

## Legacy Mode

Use legacy mode to preserve the backwards compatibility of commands while still getting access to the updated experience:

```typescript
const client = createClient({
    legacyMode: true
});

// legacy mode
client.set('key', 'value', 'NX', (err, reply) => {
    // ...
});

// version 4 interface is still accessible
await client.v4.set('key', 'value', {
    NX: true
});
```

## `createClient`

The configuration object passed to `createClient` has changed significantly with this release. See the [client configuration guide](./client-configuration.md) for details.
