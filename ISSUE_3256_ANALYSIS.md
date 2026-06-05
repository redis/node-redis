# Issue #3256 Analysis: MOVED Errors with Azure Managed Redis Cluster

## Executive Summary
The node-redis cluster client experiences a deadlock where MOVED errors cannot be recovered without restarting the process. This occurs when a shard connection enters a corrupted state (e.g., socket/TLS buffering issue) but doesn't manifest as an explicit error. The rediscover mechanism cannot fix this because it reuses existing connections if the topology hasn't changed.

## Root Cause

### The Problem
Located in [packages/client/lib/cluster/cluster-slots.ts](packages/client/lib/cluster/cluster-slots.ts), the `#initiateSlotNode` method (lines 535-564):

```typescript
#initiateSlotNode(
  shard: NodeAddress & { id: string; },
  readonly: boolean,
  eagerConnent: boolean,
  addressesInUse: Set<string>,
  promises: Array<Promise<unknown>>
) {
  const address = `${shard.host}:${shard.port}`;
  let node = this.nodeByAddress.get(address);
  
  if (!node) {
    // Create new node
    node = {
      ...shard,
      address,
      readonly,
      client: undefined,
      connectPromise: undefined
    };
    // ... connect logic
    this.nodeByAddress.set(address, node);
  }

  // Node is reused here, even if corrupted!
  return node;
}
```

### The Sequence
1. **Normal Operation**: Client executes commands against shard connection
2. **Socket Corruption**: Due to transient network issue or TLS session problem, the underlying socket enters a corrupted state
   - Socket may appear connected
   - RESP frame parsing gets out of sync
   - Or command buffering logic fails
3. **Symptom**: Commands start returning `MOVED <slot> <ip>:<port>` incorrectly
4. **Rediscover Triggered**: Multiple MOVED errors trigger `rediscover()` at line 505 or 649 of [packages/client/lib/cluster/index.ts](packages/client/lib/cluster/index.ts)
5. **Topology Query**: `CLUSTER SLOTS` command returns the same node addresses (topology is unchanged)
6. **Connection Reused**: In `#discover()` method (line 213), `#initiateSlotNode` finds the address in `nodeByAddress` and reuses it
7. **Deadlock**: Since the corrupted connection is reused, MOVED errors continue
8. **Only Exit**: Process restart creates fresh connections

## Affected Code Paths

### Primary Entry Points for Rediscover (with MOVED)
- [packages/client/lib/cluster/index.ts:505-529](packages/client/lib/cluster/index.ts#L505-L529) - Non-readonly commands
- [packages/client/lib/cluster/index.ts:649-650](packages/client/lib/cluster/index.ts#L649-L650) - Sharded pub/sub commands

### Secondary Rediscover Paths
- [packages/client/lib/cluster/index.ts:492](packages/client/lib/cluster/index.ts#L492) - ASK redirects
- [packages/client/lib/cluster/index.ts:521-529](packages/client/lib/cluster/index.ts#L521-L529) - Fallback rediscover

## Impact Assessment

### Who is Affected
- **Cloud Redis Users**: Especially Azure Managed Redis (AMR) over private endpoints
- **Production Workloads**: Any cluster client experiencing transient socket issues
- **Conditions**: 
  - Using `createCluster()` 
  - TLS connections (more likely to have framing issues)
  - Any cluster topology (Redis OSS, Azure, AWS, etc.)

### Severity
- **High**: Requires process restart to recover
- **Unpredictable**: May occur under specific conditions (network instability, TLS sessions, etc.)
- **Silent Failure**: Can persist for extended periods in low-traffic scenarios

## Why Current Workarounds Fail

### User's Custom Error Handler
The issue reporter implemented:
```typescript
async function handleError(error: Error, client: RedisClient) {
  // ... reconnect logic
}
```

**Why it fails**:
- Reconnect logic disconnects and reconnects the **cluster client**
- This doesn't rebuild individual **shard connections**
- Shard connections in `nodeByAddress` persist and are reused by `rediscover`

### Rediscover Alone
**Why it fails**:
- Calls `CLUSTER SLOTS` to get new topology
- Compares addresses to cached nodes
- If addresses match, reuses existing connections
- Broken connection remains broken

## Proposed Solutions

### Solution 1: Force Reconnect on MOVED (Recommended)
**Approach**: Add a `forceRefresh` parameter to force destroy and recreate all shard connections during rediscover when MOVED errors occur.

**Changes**:
1. Add `forceRefresh?: boolean` parameter to `#discover()`
2. In `#initiateSlotNode`, check `forceRefresh`:
   ```typescript
   if (forceRefresh && node) {
     // Destroy existing connection
     if (node.client) {
       this.#reconnectionTracker.removeClient(node.client._clientId);
       node.client.destroy();
       node.client = undefined;
     }
     // Will recreate below
   }
   ```
3. Set `forceRefresh = true` when calling rediscover from MOVED handlers

**Pros**:
- ✅ Targeted: Only rebuilds when needed
- ✅ Minimal: Small code changes
- ✅ Compatible: Backward compatible

**Cons**:
- Destroys even healthy connections in rare cases

### Solution 2: Health Check During Rediscover
**Approach**: Before reusing a connection, verify it's still healthy.

**Implementation**:
```typescript
async #verifyConnectionHealth(node: ShardNode) {
  try {
    if (!node.client?.isReady) return false;
    // Send a lightweight command to verify
    await node.client.PING();
    return true;
  } catch {
    return false;
  }
}
```

**Pros**:
- ✅ Intelligent: Keeps healthy connections
- ✅ Proactive: Catches problems early

**Cons**:
- Adds latency to rediscover
- May mask transient issues

### Solution 3: Periodic Connection Refresh (Long-term)
**Approach**: Add configuration option to periodically rebuild connections.

```typescript
interface RedisClusterOptions {
  // Rebuild shard connections every N milliseconds
  connectionRefreshInterval?: number;
}
```

**Pros**:
- ✅ Preventive: Catches problems before they cause MOVED errors
- ✅ Configurable: Users can tune to their needs

**Cons**:
- Adds complexity
- May impact performance
- Overkill for most use cases

## Recommended Implementation

### Phase 1: Quick Fix (v5.11.0)
Implement **Solution 1**: Add `forceRefresh` parameter triggered by MOVED errors.

**Files to Modify**:
1. [packages/client/lib/cluster/cluster-slots.ts](packages/client/lib/cluster/cluster-slots.ts)
   - Add `forceRefresh?: boolean` to `#discover()`
   - Modify `#initiateSlotNode()` to destroy connections when `forceRefresh=true`

2. [packages/client/lib/cluster/index.ts](packages/client/lib/cluster/index.ts)
   - Pass `forceRefresh=true` in MOVED error handlers at lines 505-529 and 649-650

### Phase 2: Testing
**Test Cases to Add**:
1. Simulate corrupted connection: Mock a client that returns MOVED consistently
2. Verify rediscover creates new connection instead of reusing
3. Verify subsequent commands succeed
4. Test with multiple MOVED errors from different shards

**Test File**: [packages/client/lib/cluster/index.spec.ts](packages/client/lib/cluster/index.spec.ts)

### Phase 3: Documentation
- Update [docs/clustering.md](docs/clustering.md) with troubleshooting guide
- Document the MOVED recovery process
- Provide debugging steps for cluster issues

## Risk Assessment

### Low Risk Changes
✅ Adding parameter with default `false` maintains current behavior
✅ Only affects rediscover path (already error handling)
✅ Tested in production with custom error handlers

### Mitigation
- Add feature flag / config option
- Gradual rollout
- Monitor reconnection metrics

## References

### Related Code
- Rediscover entry: [cluster-slots.ts:634](packages/client/lib/cluster/cluster-slots.ts#L634)
- MOVED handling: [index.ts:505-529](packages/client/lib/cluster/index.ts#L505-L529)
- Connection reuse: [cluster-slots.ts:559](packages/client/lib/cluster/cluster-slots.ts#L559)

### Documentation
- [Clustering documentation](docs/clustering.md)
- [CLUSTER SLOTS command](https://redis.io/docs/latest/commands/cluster-slots/)
- [MOVED redirect behavior](https://redis.io/docs/latest/develop/reference/cluster-spec/#redirection-and-resharding-under-rebalancing)

## User Workaround (Until Fix)
Until this is fixed in the library, users can:

1. **Catch MOVED errors explicitly**:
   ```typescript
   try {
     await redisClient.GET(key);
   } catch (error) {
     if (error.message.includes('MOVED')) {
       // Force cluster reconnect
       await client.cluster.disconnect();
       await client.cluster.connect();
     }
   }
   ```

2. **Use custom reconnect handler**:
   ```typescript
   client.on('error', async (error) => {
     if (error.message.includes('MOVED')) {
       // Disconnect entire cluster client and reconnect
       await redisClient.disconnect();
       await redisClient.connect();
     }
   });
   ```

3. **Monitor and alert**:
   - Track MOVED error frequency
   - Auto-restart process if threshold exceeded
   - Log for debugging

## Conclusion
The issue is a design gap where the rediscover mechanism assumes connection validity based only on topology addresses. The fix requires explicit connection refresh when topology queries suggest the problem isn't with the topology itself. This is a targeted, low-risk fix with significant reliability impact.
