import { strict as assert } from 'node:assert';
import { setTimeout } from 'node:timers/promises';
import testUtils, { GLOBAL, waitTillBeenCalled } from '../test-utils';
import RedisCluster from '.';
import { SQUARE_SCRIPT } from '../client/index.spec';
import { RootNodesUnavailableError } from '../errors';
import { spy } from 'sinon';
import RedisClient from '../client';
import { RESP_TYPES } from '../RESP/decoder';

describe('Cluster', () => {
  describe('default commandOptions', () => {
    type WithOptions = { _commandOptions?: { timeout?: number; asap?: boolean } };

    it('applies the 5s default timeout when no commandOptions are passed', () => {
      const cluster = RedisCluster.create({ rootNodes: [] });
      assert.equal((cluster as unknown as WithOptions)._commandOptions?.timeout, 5000);
    });

    it('merges the default timeout with a partial commandOptions override', () => {
      const cluster = RedisCluster.create({ rootNodes: [], commandOptions: { asap: true } });
      const opts = (cluster as unknown as WithOptions)._commandOptions;
      assert.equal(opts?.timeout, 5000);
      assert.equal(opts?.asap, true);
    });

    it('allows opting out of the default timeout with `timeout: undefined`', () => {
      const cluster = RedisCluster.create({ rootNodes: [], commandOptions: { timeout: undefined } });
      assert.equal((cluster as unknown as WithOptions)._commandOptions?.timeout, undefined);
    });
  });

  it('chained withCommandOptions(...).withTypeMapping(...) preserves earlier overrides at dispatch', () => {
    // Regression: cluster's `_commandOptionsProxy` used to layer via `Object.create`,
    // leaving earlier keys on the prototype where the dispatch-time spread dropped them.
    const cluster = RedisCluster.create({ rootNodes: [] });
    const proxy = cluster
      .withCommandOptions({ asap: true })
      .withTypeMapping({ [RESP_TYPES.SIMPLE_STRING]: Buffer });
    type WithOptions = { _commandOptions?: { asap?: boolean; typeMapping?: unknown } };
    const ownKeys = { ...(proxy as unknown as WithOptions)._commandOptions };
    assert.equal(ownKeys.asap, true);
    assert.deepEqual(ownKeys.typeMapping, { [RESP_TYPES.SIMPLE_STRING]: Buffer });
  });

  it('should not have HOTKEYS commands (requires session affinity)', () => {
    // HOTKEYS commands require session affinity and are only available on standalone clients
    const cluster = RedisCluster.create({ rootNodes: [] }) as unknown as Record<string, unknown>;
    assert.equal(cluster.hotkeysStart, undefined);
    assert.equal(cluster.hotkeysStop, undefined);
    assert.equal(cluster.hotkeysGet, undefined);
    assert.equal(cluster.hotkeysReset, undefined);
    assert.equal(cluster.HOTKEYS_START, undefined);
    assert.equal(cluster.HOTKEYS_STOP, undefined);
    assert.equal(cluster.HOTKEYS_GET, undefined);
    assert.equal(cluster.HOTKEYS_RESET, undefined);
  });

  testUtils.testWithCluster('sendCommand', async cluster => {
    assert.equal(
      await cluster.sendCommand(undefined, true, ['PING']),
      'PONG'
    );
  }, GLOBAL.CLUSTERS.OPEN);

  testUtils.testWithCluster('withTypeMapping override reaches raw sendCommand', async cluster => {
    // Regression for `cluster/index.ts:538` (`this._self._commandOptions` →
    // `this._commandOptions`): without this fix, `withTypeMapping`/`withCommandOptions`
    // proxies were silently ignored at cluster dispatch.
    const typed = cluster.withTypeMapping({
      [RESP_TYPES.SIMPLE_STRING]: Buffer
    });
    const resp = await typed.sendCommand(undefined, true, ['PING']);
    assert.deepEqual(resp, Buffer.from('PONG'));
  }, GLOBAL.CLUSTERS.OPEN);

  testUtils.testWithCluster('withTypeMapping override reaches typed commands', async cluster => {
    const typed = cluster.withTypeMapping({
      [RESP_TYPES.SIMPLE_STRING]: Buffer
    });
    const resp = await typed.ping();
    assert.deepEqual(resp, Buffer.from('PONG'));
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

  testUtils.testWithCluster('multi sendCommand', async cluster => {
    const key = 'key';
    assert.deepEqual(
      await cluster.multi()
        .sendCommand(['SET', key, 'value'], {
          firstKey: key,
          isReadonly: false
        })
        .sendCommand(['GET', key], {
          firstKey: key,
          isReadonly: true
        })
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

    // Regression for #3311: subscribe FIRST, then migrate the slot in place.
    // The server pushes SUNSUBSCRIBE to the already-subscribed client, which
    // must drive the cluster to rediscover and reattach the listener on the
    // new owner.
    testUtils.testWithCluster('should resubscribe a sharded channel after in-place slot migration (#3311)', async cluster => {
      const SLOT = 10328, // slot of `channel`
        migrating = cluster.slots[SLOT].master,
        importing = cluster.masters.find(master => master !== migrating)!,
        [migratingClient, importingClient] = await Promise.all([
          cluster.nodeClient(migrating),
          cluster.nodeClient(importing)
        ]);

      const listener = spy();

      // subscribe BEFORE migration -> the sharded PubSub client attaches to `migrating`
      await cluster.sSubscribe('channel', listener);

      // move the slot in-place to `importing`; `migrating` loses the slot and
      // pushes SUNSUBSCRIBE to the subscribed client
      await Promise.all([
        migratingClient.clusterDelSlots(SLOT),
        importingClient.clusterDelSlots(SLOT),
        importingClient.clusterAddSlots(SLOT),
        migratingClient.clusterSetSlot(SLOT, 'NODE', importing.id),
        importingClient.clusterSetSlot(SLOT, 'NODE', importing.id)
      ]);

      // the reattach is async and sharded PubSub does not buffer, so
      // publish until the resubscribed listener receives the message.
      // With the bug this never reattaches and the loop exhausts -> assertion fails.
      for (let i = 0; i < 50 && !listener.called; i++) {
        await cluster.sPublish('channel', 'message');
        await setTimeout(100);
      }

      assert.ok(listener.calledWithExactly('message', 'channel'));
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
