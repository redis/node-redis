import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL, waitTillBeenCalled } from '../test-utils';
import RedisCluster from '.';
import { SQUARE_SCRIPT } from '../client/index.spec';
import { RootNodesUnavailableError } from '../errors';
import { spy } from 'sinon';
import RedisClient from '../client';

describe('Cluster', () => {
  testUtils.testWithCluster('sendCommand', async cluster => {
    assert.equal(
      await cluster.sendCommand(undefined, true, ['PING']),
      'PONG'
    );
  }, GLOBAL.CLUSTERS.OPEN);

  testUtils.testWithCluster('isOpen', async cluster => {
    assert.equal(cluster.isOpen, true);
    await cluster.destroy();
    assert.equal(cluster.isOpen, false);
  }, GLOBAL.CLUSTERS.OPEN);

  testUtils.testWithCluster('connect should throw if already connected', async cluster => {
    await assert.rejects(cluster.connect());
  }, GLOBAL.CLUSTERS.OPEN);

  testUtils.testWithCluster('multi', async cluster => {
    const key = 'key';
    assert.deepEqual(
      await cluster.multi()
        .set(key, 'value')
        .get(key)
        .exec(),
      ['OK', 'value']
    );
  }, GLOBAL.CLUSTERS.OPEN);

  testUtils.testWithCluster('scripts', async cluster => {
    const [, reply] = await Promise.all([
      cluster.set('key', '2'),
      cluster.square('key')
    ]);

    assert.equal(reply, 4);
  }, {
    ...GLOBAL.CLUSTERS.OPEN,
    clusterConfiguration: {
      scripts: {
        square: SQUARE_SCRIPT
      }
    }
  });

  it('should throw RootNodesUnavailableError', async () => {
    const cluster = RedisCluster.create({
      rootNodes: []
    });

    try {
      await assert.rejects(
        cluster.connect(),
        RootNodesUnavailableError
      );
    } catch (err) {
      await cluster.disconnect();
      throw err;
    }
  });

  testUtils.testWithCluster('should handle live resharding', async cluster => {
    const slot = 12539,
      key = 'key',
      value = 'value';
    await cluster.set(key, value);

    const importing = cluster.slots[0].master,
      migrating = cluster.slots[slot].master,
      [importingClient, migratingClient] = await Promise.all([
        cluster.nodeClient(importing),
        cluster.nodeClient(migrating)
      ]);

    await Promise.all([
      importingClient.clusterSetSlot(slot, 'IMPORTING', migrating.id),
      migratingClient.clusterSetSlot(slot, 'MIGRATING', importing.id)
    ]);

    // should be able to get the key from the migrating node
    assert.equal(
      await cluster.get(key),
      value
    );

    await migratingClient.migrate(
      importing.host,
      importing.port,
      key,
      0,
      10
    );

    // should be able to get the key from the importing node using `ASKING`
    assert.equal(
      await cluster.get(key),
      value
    );

    await Promise.all([
      importingClient.clusterSetSlot(slot, 'NODE', importing.id),
      migratingClient.clusterSetSlot(slot, 'NODE', importing.id),
    ]);

    // should handle `MOVED` errors
    assert.equal(
      await cluster.get(key),
      value
    );
  }, {
    serverArguments: [],
    numberOfMasters: 2
  });

  testUtils.testWithCluster('getRandomNode should spread the the load evenly', async cluster => {
    const totalNodes = cluster.masters.length + cluster.replicas.length,
      ids = new Set<string>();
    for (let i = 0; i < totalNodes; i++) {
      ids.add(cluster.getRandomNode().id);
    }

    assert.equal(ids.size, totalNodes);
  }, GLOBAL.CLUSTERS.WITH_REPLICAS);

  testUtils.testWithCluster('getSlotRandomNode should spread the the load evenly', async cluster => {
    const totalNodes = 1 + cluster.slots[0].replicas!.length,
      ids = new Set<string>();
    for (let i = 0; i < totalNodes; i++) {
      ids.add(cluster.getSlotRandomNode(0).id);
    }

    assert.equal(ids.size, totalNodes);
  }, GLOBAL.CLUSTERS.WITH_REPLICAS);

  testUtils.testWithCluster('cluster topology', async cluster => {
    assert.equal(cluster.slots.length, 16384);
    const { numberOfMasters, numberOfReplicas } = GLOBAL.CLUSTERS.WITH_REPLICAS;
    assert.equal(cluster.masters.length, numberOfMasters);
    assert.equal(cluster.replicas.length, numberOfReplicas * numberOfMasters);
    assert.equal(cluster.nodeByAddress.size, numberOfMasters + numberOfMasters * numberOfReplicas);
  }, GLOBAL.CLUSTERS.WITH_REPLICAS);

  testUtils.testWithCluster('getMasters should be backwards competiable (without `minimizeConnections`)', async cluster => {
    const masters = cluster.getMasters();
    assert.ok(Array.isArray(masters));
    for (const master of masters) {
      assert.equal(typeof master.id, 'string');
      assert.ok(master.client instanceof RedisClient);
    }
  }, {
    ...GLOBAL.CLUSTERS.OPEN,
    clusterConfiguration: {
      minimizeConnections: undefined // reset to default
    }
  });

  testUtils.testWithCluster('getSlotMaster should be backwards competiable (without `minimizeConnections`)', async cluster => {
    const master = cluster.getSlotMaster(0);
    assert.equal(typeof master.id, 'string');
    assert.ok(master.client instanceof RedisClient);
  }, {
    ...GLOBAL.CLUSTERS.OPEN,
    clusterConfiguration: {
      minimizeConnections: undefined // reset to default
    }
  });

  testUtils.testWithCluster('should throw CROSSSLOT error', async cluster => {
    await assert.rejects(cluster.mGet(['a', 'b']));
  }, GLOBAL.CLUSTERS.OPEN);

  describe('minimizeConnections', () => {
    testUtils.testWithCluster('false', async cluster => {
      for (const master of cluster.masters) {
        assert.ok(master.client instanceof RedisClient);
      }
    }, {
      ...GLOBAL.CLUSTERS.OPEN,
      clusterConfiguration: {
        minimizeConnections: false
      }
    });

    testUtils.testWithCluster('true', async cluster => {
      for (const master of cluster.masters) {
        assert.equal(master.client, undefined);
      }
    }, {
      ...GLOBAL.CLUSTERS.OPEN,
      clusterConfiguration: {
        minimizeConnections: true
      }
    });
  });

  describe('PubSub', () => {
    testUtils.testWithCluster('subscribe & unsubscribe', async cluster => {
      const listener = spy();

      await cluster.subscribe('channel', listener);

      await Promise.all([
        waitTillBeenCalled(listener),
        cluster.publish('channel', 'message')
      ]);

      assert.ok(listener.calledOnceWithExactly('message', 'channel'));

      await cluster.unsubscribe('channel', listener);

      assert.equal(cluster.pubSubNode, undefined);
    }, GLOBAL.CLUSTERS.OPEN);

    testUtils.testWithCluster('psubscribe & punsubscribe', async cluster => {
      const listener = spy();

      await cluster.pSubscribe('channe*', listener);

      await Promise.all([
        waitTillBeenCalled(listener),
        cluster.publish('channel', 'message')
      ]);

      assert.ok(listener.calledOnceWithExactly('message', 'channel'));

      await cluster.pUnsubscribe('channe*', listener);

      assert.equal(cluster.pubSubNode, undefined);
    }, GLOBAL.CLUSTERS.OPEN);

    testUtils.testWithCluster('should move listeners when PubSub node disconnects from the cluster', async cluster => {
      const listener = spy();
      await cluster.subscribe('channel', listener);

      assert.ok(cluster.pubSubNode);
      const [migrating, importing] = cluster.masters[0].address === cluster.pubSubNode.address ?
        cluster.masters :
        [cluster.masters[1], cluster.masters[0]],
        [migratingClient, importingClient] = await Promise.all([
          cluster.nodeClient(migrating),
          cluster.nodeClient(importing)
        ]);

      const range = cluster.slots[0].master === migrating ? {
        key: 'bar', // 5061
        start: 0,
        end: 8191
      } : {
        key: 'foo', // 12182
        start: 8192,
        end: 16383
      };

      // TODO: is there a better way to migrate slots without causing CLUSTERDOWN?
      const promises: Array<Promise<unknown>> = [];
      for (let i = range.start; i <= range.end; i++) {
        promises.push(
          migratingClient.clusterSetSlot(i, 'NODE', importing.id),
          importingClient.clusterSetSlot(i, 'NODE', importing.id)
        );
      }
      await Promise.all(promises);

      // make sure to cause `MOVED` error
      await cluster.get(range.key);

      await Promise.all([
        cluster.publish('channel', 'message'),
        waitTillBeenCalled(listener)
      ]);

      assert.ok(listener.calledOnceWithExactly('message', 'channel'));
    }, {
      serverArguments: [],
      numberOfMasters: 2,
      minimumDockerVersion: [7]
    });

    testUtils.testWithCluster('ssubscribe & sunsubscribe', async cluster => {
      const listener = spy();

      await cluster.sSubscribe('channel', listener);

      await Promise.all([
        waitTillBeenCalled(listener),
        cluster.sPublish('channel', 'message')
      ]);

      assert.ok(listener.calledOnceWithExactly('message', 'channel'));

      await cluster.sUnsubscribe('channel', listener);

      // 10328 is the slot of `channel`
      assert.equal(cluster.slots[10328].master.pubSub, undefined);
    }, {
      ...GLOBAL.CLUSTERS.OPEN,
      minimumDockerVersion: [7]
    });

    testUtils.testWithCluster('should handle sharded-channel-moved events', async cluster => {
      const SLOT = 10328,
        migrating = cluster.slots[SLOT].master,
        importing = cluster.masters.find(master => master !== migrating)!,
        [migratingClient, importingClient] = await Promise.all([
          cluster.nodeClient(migrating),
          cluster.nodeClient(importing)
        ]);

      await Promise.all([
        migratingClient.clusterDelSlots(SLOT),
        importingClient.clusterDelSlots(SLOT),
        importingClient.clusterAddSlots(SLOT),
        // cause "topology refresh" on both nodes
        migratingClient.clusterSetSlot(SLOT, 'NODE', importing.id),
        importingClient.clusterSetSlot(SLOT, 'NODE', importing.id)
      ]);

      const listener = spy();

      // will trigger `MOVED` error
      await cluster.sSubscribe('channel', listener);

      await Promise.all([
        waitTillBeenCalled(listener),
        cluster.sPublish('channel', 'message')
      ]);

      assert.ok(listener.calledOnceWithExactly('message', 'channel'));
    }, {
      serverArguments: [],
      minimumDockerVersion: [7]
    });
  });

  describe('clusterEvents', () => {
    testUtils.testWithCluster('should fire events', async (cluster) => {
      const log: string[] = [];

      cluster
        .on('connect', () => log.push('connect'))
        .on('disconnect', () => log.push('disconnect'))
        .on('error', () => log.push('error'))
        .on('node-error', () => log.push('node-error'))
        .on('node-reconnecting', () => log.push('node-reconnecting'))
        .on('node-ready', () => log.push('node-ready'))
        .on('node-connect', () => log.push('node-connect'))
        .on('node-disconnect', () => log.push('node-disconnect'))

      await cluster.connect();
      cluster.destroy();

      assert.deepEqual(log, [
        'node-connect',
        'node-connect',
        'node-ready',
        'node-ready',
        'connect',
        'node-disconnect',
        'node-disconnect',
        'disconnect',
      ]);
    }, {
      ...GLOBAL.CLUSTERS.OPEN,
      disableClusterSetup: true,
      numberOfMasters: 2,
      numberOfReplicas: 1,
      clusterConfiguration: {
        minimizeConnections: false
      }
    });
  });

});
