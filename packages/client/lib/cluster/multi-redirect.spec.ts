import { strict as assert } from 'node:assert';
import { setTimeout } from 'node:timers/promises';
import calculateSlot from '../utils/calculate-slot';
import testUtils from '../test-utils';
import { ErrorReply } from '../errors';

describe('Cluster MULTI redirects', () => {
  testUtils.testWithCluster('retries MULTI after master failover while the previous master remains reachable', async cluster => {
    const key = 'multi-failover-key';
    const slot = calculateSlot(key);

    await cluster.set(key, '0');

    const shard = cluster.slots[slot];
    const previousMaster = shard.master;
    assert.ok(shard.replicas?.length);
    const replica = shard.replicas[0];
    const [previousMasterClient, replicaClient] = await Promise.all([
      cluster.nodeClient(previousMaster),
      cluster.nodeClient(replica)
    ]);

    assert.equal(await previousMasterClient.wait(1, 5000), 1);

    try {
      await replicaClient.clusterFailover();

      for (let i = 0; i < 200; i++) {
        const [replicaInfo, previousMasterInfo] = await Promise.all([
          replicaClient.sendCommand<string>(['INFO', 'replication']),
          previousMasterClient.sendCommand<string>(['INFO', 'replication'])
        ]);
        if (
          replicaInfo.includes('role:master') &&
          previousMasterInfo.includes('role:slave')
        ) {
          break;
        }
        if (i === 199) {
          assert.fail('Cluster failover did not complete');
        }
        await setTimeout(50);
      }

      // The previous master is still reachable, so no reconnect event can repair
      // the stale slot map. MULTI must handle the MOVED reply itself.
      assert.equal(await previousMasterClient.ping(), 'PONG');
      assert.equal(cluster.slots[slot].master.id, previousMaster.id);
      await assert.rejects(
        previousMasterClient.get(key),
        error => error instanceof ErrorReply && error.message.startsWith(`MOVED ${slot} `)
      );

      assert.deepEqual(
        await cluster.multi()
          .incr(key)
          .get(key)
          .exec(),
        [1, '1']
      );
      assert.equal(cluster.slots[slot].master.id, replica.id);
    } catch (error) {
      // After any post-failover failure, repair the cached topology before
      // test-utils flushes the cluster so the original error is not masked.
      await cluster.set(key, '0').catch(() => undefined);
      throw error;
    }
  }, {
    serverArguments: [],
    numberOfMasters: 2,
    numberOfReplicas: 1,
    clusterConfiguration: {
      useReplicas: true
    },
    testTimeout: 30000
  });
});
