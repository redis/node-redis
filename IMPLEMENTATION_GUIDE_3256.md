# Implementation Guide for Issue #3256 Fix

## Overview
This guide provides step-by-step instructions to implement the fix for MOVED error deadlock in node-redis cluster clients.

## Implementation Strategy
**Add a `forceRefresh` parameter to force reconnection of shard connections when MOVED errors persist.**

This is a surgical fix that:
- Only impacts the error recovery path (MOVED handlers)
- Maintains backward compatibility (default forceRefresh=false)
- Solves the deadlock without affecting normal operation

## Changes Required

### File 1: packages/client/lib/cluster/cluster-slots.ts

#### Change 1.1: Add forceRefresh parameter to #discover method

**Location**: Line 206 (method signature)

**Current**:
```typescript
async #discover(rootNode: RedisClusterClientOptions) {
```

**Change to**:
```typescript
async #discover(rootNode: RedisClusterClientOptions, forceRefresh = false) {
```

---

#### Change 1.2: Pass forceRefresh to #initiateSlotNode calls

**Location**: Lines 214-215 (initiating master node)

**Current**:
```typescript
const shard: Shard<M, F, S, RESP, TYPE_MAPPING> = {
  master: this.#initiateSlotNode(master, false, eagerConnect, addressesInUse, promises)
};
```

**Change to**:
```typescript
const shard: Shard<M, F, S, RESP, TYPE_MAPPING> = {
  master: this.#initiateSlotNode(master, false, eagerConnect, addressesInUse, promises, forceRefresh)
};
```

**Rationale**: Pass forceRefresh through to allow connection destruction

---

#### Change 1.3: Pass forceRefresh for replica nodes

**Location**: Lines 218-220 (initiating replica nodes)

**Current**:
```typescript
if (this.#options.useReplicas) {
  shard.replicas = replicas.map(replica =>
    this.#initiateSlotNode(replica, true, eagerConnect, addressesInUse, promises)
  );
}
```

**Change to**:
```typescript
if (this.#options.useReplicas) {
  shard.replicas = replicas.map(replica =>
    this.#initiateSlotNode(replica, true, eagerConnect, addressesInUse, promises, forceRefresh)
  );
}
```

---

#### Change 1.4: Update #initiateSlotNode signature and implementation

**Location**: Line 535 (method signature)

**Current**:
```typescript
#initiateSlotNode(
  shard: NodeAddress & { id: string; },
  readonly: boolean,
  eagerConnent: boolean,
  addressesInUse: Set<string>,
  promises: Array<Promise<unknown>>
)
```

**Change to**:
```typescript
#initiateSlotNode(
  shard: NodeAddress & { id: string; },
  readonly: boolean,
  eagerConnent: boolean,
  addressesInUse: Set<string>,
  promises: Array<Promise<unknown>>,
  forceRefresh = false
)
```

---

#### Change 1.5: Destroy connection if forceRefresh=true

**Location**: After line 542 (after getting existing node)

**Current**:
```typescript
let node = this.nodeByAddress.get(address);
if (!node) {
  node = {
    ...shard,
    address,
    readonly,
    client: undefined,
    connectPromise: undefined
  };

  if (eagerConnent) {
    promises.push(this.#createNodeClient(node));
  }

  this.nodeByAddress.set(address, node);
}
```

**Change to**:
```typescript
let node = this.nodeByAddress.get(address);
if (!node) {
  node = {
    ...shard,
    address,
    readonly,
    client: undefined,
    connectPromise: undefined
  };

  if (eagerConnent) {
    promises.push(this.#createNodeClient(node));
  }

  this.nodeByAddress.set(address, node);
} else if (forceRefresh && node.client) {
  // When forcing refresh due to MOVED errors, destroy the existing (potentially corrupted) connection
  // and create a new one to ensure we get a fresh connection state
  this.#reconnectionTracker.removeClient(node.client._clientId);
  node.client.destroy();
  node.client = undefined;
  node.connectPromise = undefined;

  if (eagerConnent) {
    promises.push(this.#createNodeClient(node));
  }
}
```

**Rationale**: 
- Detect if node already exists and forceRefresh is true
- Destroy the old (potentially corrupted) connection
- Create a new one to get fresh connection state

---

### File 2: packages/client/lib/cluster/index.ts

#### Change 2.1: Pass forceRefresh=true for MOVED error in non-readonly commands

**Location**: Line 523 (first MOVED rediscover call)

**Current**:
```typescript
if (!redirectTo) {
  await this._slots.rediscover(client);
  redirectTo = await this._slots.getMasterByAddress(address);
}
```

**Change to**:
```typescript
if (!redirectTo) {
  await this._slots.rediscover(client, true); // forceRefresh=true for MOVED errors
  redirectTo = await this._slots.getMasterByAddress(address);
}
```

**Rationale**: When the target node isn't found after MOVED, force refresh to rebuild connections

---

#### Change 2.2: Pass forceRefresh=true for second MOVED rediscover attempt

**Location**: Line 529 (second MOVED rediscover call)

**Current**:
```typescript
if (!redirectTo) {
  await this._slots.rediscover(client);
  // Recalculate client and slot in case topology changed
  const clientAndSlot = await this._slots.getClientAndSlotNumber(firstKey, isReadonly);
  client = clientAndSlot.client;
  slotNumber = clientAndSlot.slotNumber;
} else {
```

**Change to**:
```typescript
if (!redirectTo) {
  await this._slots.rediscover(client, true); // forceRefresh=true for MOVED errors
  // Recalculate client and slot in case topology changed
  const clientAndSlot = await this._slots.getClientAndSlotNumber(firstKey, isReadonly);
  client = clientAndSlot.client;
  slotNumber = clientAndSlot.slotNumber;
} else {
```

**Rationale**: Ensure all MOVED recovery attempts force connection recreation

---

#### Change 2.3: Pass forceRefresh=true for MOVED error in sharded pub/sub

**Location**: Line 650 (sharded pub/sub MOVED handler)

**Current**:
```typescript
if (err.message.startsWith('MOVED')) {
  await this._self._slots.rediscover(client);
  client = await this._self._slots.getShardedPubSubClient(firstChannel);
  continue;
}
```

**Change to**:
```typescript
if (err.message.startsWith('MOVED')) {
  await this._self._slots.rediscover(client, true); // forceRefresh=true for MOVED errors
  client = await this._self._slots.getShardedPubSubClient(firstChannel);
  continue;
}
```

**Rationale**: Pub/sub MOVED errors also need connection refresh

---

### File 3: packages/client/lib/cluster/cluster-slots.ts (Additional Changes)

#### Change 3.1: Update rediscover method signature

**Location**: Line 634 (rediscover public method)

**Current**:
```typescript
async rediscover(startWith?: RedisClientType<M, F, S, RESP>, excludedAddresses?: ReadonlySet<string>): Promise<void> {
  this.#runningRediscoverPromise ??= this.#rediscover(startWith, excludedAddresses)
    .finally(() => {
      this.#runningRediscoverPromise = undefined
    });
  return this.#runningRediscoverPromise;
}
```

**Change to**:
```typescript
async rediscover(
  startWith?: RedisClientType<M, F, S, RESP>,
  excludedAddresses?: ReadonlySet<string>,
  forceRefresh = false
): Promise<void> {
  this.#runningRediscoverPromise ??= this.#rediscover(startWith, excludedAddresses, forceRefresh)
    .finally(() => {
      this.#runningRediscoverPromise = undefined
    });
  return this.#runningRediscoverPromise;
}
```

**Rationale**: Public API needs to accept forceRefresh parameter

---

#### Change 3.2: Update #rediscover private method signature

**Location**: Line 642 (#rediscover private method)

**Current**:
```typescript
async #rediscover(startWith?: RedisClientType<M, F, S, RESP>, excludedAddresses?: ReadonlySet<string>): Promise<void> {
  if (startWith && await this.#discover(startWith.options!)) return;

  if (await this.#discoverWithKnownNodes(excludedAddresses)) return;

  return this.#discoverWithRootNodes();
}
```

**Change to**:
```typescript
async #rediscover(
  startWith?: RedisClientType<M, F, S, RESP>,
  excludedAddresses?: ReadonlySet<string>,
  forceRefresh = false
): Promise<void> {
  if (startWith && await this.#discover(startWith.options!, forceRefresh)) return;

  if (await this.#discoverWithKnownNodes(excludedAddresses)) return;

  return this.#discoverWithRootNodes();
}
```

**Rationale**: Pass forceRefresh to #discover when using startWith client

---

## Summary of Changes

| File | Changes | Reason |
|------|---------|--------|
| cluster-slots.ts | Add forceRefresh param to 5 methods | Enable connection recreation |
| index.ts | Pass forceRefresh=true in 3 MOVED handlers | Trigger connection refresh on errors |

**Total Lines Added**: ~15  
**Total Lines Modified**: ~10  
**Backward Compatibility**: ✅ 100% (default forceRefresh=false)

## Testing Strategy

### Unit Tests
1. Test #initiateSlotNode with forceRefresh=true destroys old connection
2. Test #initiateSlotNode with forceRefresh=false reuses connection
3. Test forceRefresh parameter propagation through methods

### Integration Tests
1. Simulate MOVED error from mock Redis
2. Verify rediscover is called with forceRefresh=true
3. Verify connection is recreated
4. Verify command retry succeeds

### Manual Testing
1. Use Azure Managed Redis cluster setup
2. Inject network fault to trigger MOVED
3. Verify automatic recovery without restart

## Rollout Plan

### Phase 1: Implementation
- [ ] Implement changes in cluster-slots.ts
- [ ] Implement changes in index.ts
- [ ] Run existing test suite
- [ ] Create new tests from MOVED-recovery.spec.ts

### Phase 2: Review
- [ ] Code review
- [ ] Performance impact analysis
- [ ] Backward compatibility verification

### Phase 3: Pre-release Testing
- [ ] Test on Azure Managed Redis
- [ ] Test on AWS ElastiCache
- [ ] Test on self-hosted Redis Cluster
- [ ] Load testing

### Phase 4: Release
- [ ] Merge to main branch
- [ ] Tag as v5.11.0+ (or similar)
- [ ] Update CHANGELOG.md
- [ ] Publish to npm

## Debugging Tips for Future Issues

### Detect if Issue Reoccurs
```typescript
// Track MOVED error frequency
let movedErrors = 0;
client.on('error', (error) => {
  if (error.message.includes('MOVED')) {
    movedErrors++;
    if (movedErrors > 5) {
      console.warn('High MOVED error frequency - possible connection corruption');
    }
  }
});
```

### Enable Debug Logging
```typescript
// Enable cluster debugging
process.env.DEBUG = 'redis:cluster';
```

### Verify Connection Recreation
```typescript
// Check that new clients are created during rediscover
const connectionIds = new Set();
client.on('node-ready', (node) => {
  connectionIds.add(node.client?._clientId);
});
```

## References

- **Issue**: https://github.com/redis/node-redis/issues/3256
- **Analysis**: ISSUE_3256_ANALYSIS.md (in same directory)
- **Test Suite**: MOVED-recovery.spec.ts (in same directory)
- **Cluster Documentation**: docs/clustering.md

## Success Criteria

✅ Issue fixed when:
1. MOVED errors no longer cause permanent deadlock
2. Corrupted connections are recreated automatically
3. Commands succeed after MOVED recovery
4. No process restart needed
5. Backward compatible with existing code

## Open Questions

1. Should forceRefresh also clear client-side caches?
   - Currently: Not included in this fix
   - Future: May need additional handling

2. Should we track forceRefresh statistics?
   - Currently: No instrumentation
   - Future: Could add metrics for observability

3. Should there be a configuration option for forceRefresh behavior?
   - Currently: Always true for MOVED
   - Future: May want to make configurable for performance-sensitive use cases
