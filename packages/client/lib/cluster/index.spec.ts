import { strict as assert } from 'node:assert';
import { setTimeout } from 'node:timers/promises';
import testUtils, { GLOBAL, blockSetImmediate, waitTillBeenCalled } from '../test-utils';
import RedisCluster from '.';
import { SQUARE_SCRIPT } from '../client/index.spec';
import { AbortError, ClientClosedError, ClientOfflineError, RootNodesUnavailableError, MaxCommandRedirectionsError, ScanIteratorInterruptedError, TimeoutError } from '../errors';
import { spy } from 'sinon';
import RedisClient from '../client';
import { RESP_TYPES } from '../RESP/decoder';
import calculateSlot from '../utils/calculate-slot';
import { CommandParser } from '../client/parser';

describe('Cluster command lifecycle', () => {
  it('rejects commands before connect', async () => {
    const cluster = RedisCluster.create({ rootNodes: [] });
    assert.equal(cluster.isOpen, false);
    assert.equal(cluster.isReady, false);

    await assert.rejects(
      cluster.get('key'),
      ClientClosedError
    );
  });

  it('rejects commands while connect is in progress', async () => {
    const cluster = RedisCluster.create({
      rootNodes: [{
        socket: {
          host: '203.0.113.1',
          port: 6379,
          connectTimeout: 1
        }
      }]
    });
    const connectPromise = cluster.connect().catch(() => undefined);
    assert.equal(cluster.isOpen, true);
    assert.equal(cluster.isReady, false);

    await assert.rejects(
      cluster.get('key'),
      ClientOfflineError
    );

    cluster.destroy();
    await connectPromise;
  });
});

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

  testUtils.testWithCluster('withTypeMapping override reaches multi() replies', async cluster => {
    const value = Buffer.from([0x89, 0x50, 0xff, 0xfe, 0x00, 0x01]);
    await cluster.set('key', value);
    const typed = cluster.withTypeMapping({
      [RESP_TYPES.BLOB_STRING]: Buffer
    });
    assert.deepEqual(await typed.multi().get('key').execAsPipeline(), [value]);
    assert.deepEqual(await typed.multi().get('key').exec(), [value]);
  }, GLOBAL.CLUSTERS.OPEN);

  testUtils.testWithCluster('default commandOptions typeMapping reaches multi() replies', async cluster => {
    const value = Buffer.from([0x89, 0x50, 0xff, 0xfe, 0x00, 0x01]);
    await cluster.set('key', value);
    assert.deepEqual(await cluster.multi().get('key').execAsPipeline(), [value]);
    assert.deepEqual(await cluster.multi().get('key').exec(), [value]);
  }, {
    ...GLOBAL.CLUSTERS.OPEN,
    clusterConfiguration: {
      commandOptions: {
        typeMapping: {
          [RESP_TYPES.BLOB_STRING]: Buffer
        }
      }
    }
  });

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

  describe('batch timeout', () => {
    testUtils.testWithCluster('per-call timeout reaches queued batches', async cluster => {
      const withTimeout = cluster.withCommandOptions({ timeout: 5 });
      const start = Date.now();
      await blockSetImmediate(async () => {
        await assert.rejects(withTimeout.multi().set('key', 'value').exec(), TimeoutError);
        await assert.rejects(withTimeout.multi().set('key', 'value').execAsPipeline(), TimeoutError);
      });
      assert.ok(Date.now() - start < 1000, 'the node client default timeout was used');
    }, GLOBAL.CLUSTERS.OPEN);

    testUtils.testWithCluster('abortSignal reaches queued batches', async cluster => {
      await blockSetImmediate(async () => {
        await assert.rejects(cluster.withCommandOptions({ abortSignal: AbortSignal.timeout(5) }).multi().set('key', 'value').exec(), AbortError);
        await assert.rejects(cluster.withCommandOptions({ abortSignal: AbortSignal.timeout(5) }).multi().set('key', 'value').execAsPipeline(), AbortError);
      });
      assert.equal(await cluster.get('key'), null);
    }, GLOBAL.CLUSTERS.OPEN);
  });

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

  testUtils.testWithCluster('execAsPipeline refreshes the slot map after MOVED', async cluster => {
    const key = 'pipelineMovedKey',
      slot = calculateSlot(key),
      owner = cluster.slots[slot].master,
      target = cluster.masters.find(master => master.id !== owner.id)!,
      [ownerClient, targetClient] = await Promise.all([
        cluster.nodeClient(owner),
        cluster.nodeClient(target)
      ]);

    // Move the empty slot behind the cluster client's back, so its slot map
    // still names the old owner.
    await Promise.all([
      ownerClient.clusterSetSlot(slot, 'NODE', target.id),
      targetClient.clusterSetSlot(slot, 'NODE', target.id)
    ]);

    try {
      // not retried (it can be partially applied), but it must refresh the slot map
      await assert.rejects(
        cluster.multi().set(key, 'value').get(key).execAsPipeline(),
        (err: Error) => err.message.startsWith('MOVED')
      );
      assert.deepEqual(
        await cluster.multi().set(key, 'value').get(key).execAsPipeline(),
        ['OK', 'value']
      );
    } finally {
      await cluster.del(key);
      await Promise.all([
        ownerClient.clusterSetSlot(slot, 'NODE', owner.id),
        targetClient.clusterSetSlot(slot, 'NODE', owner.id)
      ]);
    }
  }, {
    serverArguments: [],
    numberOfMasters: 2
  });

  testUtils.testWithCluster('a keyless command follows MOVED to the node it names', async cluster => {
    const key = 'keylessMovedKey';
    await cluster.set(key, 'value');

    // With no routing key the command goes to a random master; any other
    // master answers MOVED. One redirect must be enough, so the client has to
    // follow the MOVED address rather than retry another random node.
    for (let i = 0; i < 20; i++) {
      assert.equal(
        await cluster.sendCommand(undefined, true, ['GET', key]),
        'value'
      );
    }
  }, {
    ...GLOBAL.CLUSTERS.OPEN,
    numberOfMasters: 3,
    clusterConfiguration: {
      maxCommandRedirections: 1
    }
  });

  testUtils.testWithCluster('should throw MaxCommandRedirectionsError when exceeding maxCommandRedirections', async cluster => {
    const key = 'maxCommandRedirectionsErrorKey',
      slot = calculateSlot(key),
      node1 = cluster.masters[0],
      node2 = cluster.masters[1],
      [client1, client2] = await Promise.all([
        cluster.nodeClient(node1),
        cluster.nodeClient(node2)
      ]);

    // Create a MOVED loop
    await Promise.all([
      client1.clusterSetSlot(slot, 'NODE', node2.id),
      client2.clusterSetSlot(slot, 'NODE', node1.id)
    ]);

    try {
      await assert.rejects(
        cluster.get(key),
        MaxCommandRedirectionsError
      );
    } finally {
      // Revert the slot back to its original owner (node1)
      await Promise.all([
        client1.clusterSetSlot(slot, 'NODE', node1.id),
        client2.clusterSetSlot(slot, 'NODE', node1.id)
      ]);
    }
  }, {
    serverArguments: [],
    numberOfMasters: 2,
    clusterConfiguration: {
      maxCommandRedirections: 2
    }
  });

  testUtils.testWithCluster('sSubscribe should throw MaxCommandRedirectionsError when exceeding maxCommandRedirections', async cluster => {
    const channel = 'maxCommandRedirectionsErrorChannel',
      slot = calculateSlot(channel),
      node1 = cluster.masters[0],
      node2 = cluster.masters[1],
      [client1, client2] = await Promise.all([
        cluster.nodeClient(node1),
        cluster.nodeClient(node2)
      ]);

    // Create a MOVED loop
    await Promise.all([
      client1.clusterSetSlot(slot, 'NODE', node2.id),
      client2.clusterSetSlot(slot, 'NODE', node1.id)
    ]);

    try {
      await assert.rejects(
        cluster.sSubscribe(channel, () => {}),
        MaxCommandRedirectionsError
      );
    } finally {
      // Revert the slot back to its original owner (node1)
      await Promise.all([
        client1.clusterSetSlot(slot, 'NODE', node1.id),
        client2.clusterSetSlot(slot, 'NODE', node1.id)
      ]);
    }
  }, {
    serverArguments: [],
    numberOfMasters: 2,
    clusterConfiguration: {
      maxCommandRedirections: 2
    },
    minimumDockerVersion: [7]
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

  testUtils.testWithCluster('serves reads from a master demoted to replica by a failover', async cluster => {
    const key = 'demoted-master-key',
      slot = calculateSlot(key);

    await cluster.set(key, 'value');

    const previousMaster = cluster.slots[slot].master,
      replica = cluster.slots[slot].replicas![0],
      [previousMasterClient, replicaClient] = await Promise.all([
        cluster.nodeClient(previousMaster),
        cluster.nodeClient(replica)
      ]);

    assert.equal(await previousMasterClient.wait(1, 5000), 1);
    await replicaClient.clusterFailover();

    for (let i = 0; ; i++) {
      const info = await previousMasterClient.sendCommand<string>(['INFO', 'replication']);
      if (info.includes('role:slave')) break;
      if (i === 199) assert.fail('Cluster failover did not complete');
      await setTimeout(50);
    }

    // the write lands on the previous master, whose MOVED reply triggers the rediscovery
    await cluster.set(key, 'value');

    const demoted = cluster.slots[slot].replicas![0];
    assert.equal(demoted.address, previousMaster.address);
    assert.equal(await (await cluster.nodeClient(demoted)).get(key), 'value');
    assert.equal(demoted.readonly, true);
    assert.equal(previousMasterClient.isOpen, false);
    assert.equal(cluster.slots[slot].master.readonly, false);
    assert.equal(await cluster.nodeClient(cluster.slots[slot].master), replicaClient);
  }, {
    serverArguments: [],
    numberOfMasters: 2,
    numberOfReplicas: 1,
    clusterConfiguration: {
      useReplicas: true
    },
    testTimeout: 30000
  });

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

  testUtils.testWithCluster('getNodeClientForKey returns the slot master and supports WATCH/MULTI/EXEC', async cluster => {
    const key = 'key';
    const nodeClient = await cluster.getNodeClientForKey(key);
    assert.ok(nodeClient instanceof RedisClient);
    assert.equal(nodeClient, cluster.slots[calculateSlot(key)].master.client);

    await nodeClient.watch(key);
    const reply = await nodeClient.multi()
      .set(key, 'value')
      .exec();
    assert.deepEqual(reply, ['OK']);
  }, GLOBAL.CLUSTERS.OPEN);

  testUtils.testWithCluster('getNodeClientForKey with isReadonly returns a node from the slot', async cluster => {
    const key = 'key';
    const nodeClient = await cluster.getNodeClientForKey(key, true);
    assert.ok(nodeClient instanceof RedisClient);
  }, GLOBAL.CLUSTERS.WITH_REPLICAS);

  testUtils.testWithCluster('mGet splits cross-slot keys and preserves caller order', async cluster => {
    // 'a' and 'b' hash to different slots — on master this rejected with
    // CROSSSLOT; the multi_shard split routes each key to its shard and
    // reassembles the replies in the caller's key order.
    await Promise.all([cluster.set('a', 'value-a'), cluster.set('b', 'value-b')]);
    assert.deepEqual(await cluster.mGet(['a', 'b']), ['value-a', 'value-b']);
    assert.deepEqual(
      await cluster.mGet(['b', 'missing', 'a']),
      ['value-b', null, 'value-a']
    );
  }, GLOBAL.CLUSTERS.OPEN);

  testUtils.testWithCluster('numeric aggregates honor a NUMBER type mapping', async cluster => {
    const mapped = cluster.withTypeMapping({ [RESP_TYPES.NUMBER]: String });
    await Promise.all([cluster.set('a', '1'), cluster.set('b', '1')]);

    // multi_shard agg_sum: per-node replies aggregate raw, result is re-mapped.
    assert.equal(await mapped.del(['a', 'b']), '2');
    // all_shards agg_sum fan-out.
    assert.equal(typeof await mapped.dbSize(), 'string');
    // Unmapped client on the same cluster is untouched.
    assert.equal(typeof await cluster.dbSize(), 'number');
  }, GLOBAL.CLUSTERS.OPEN);

  testUtils.testWithCluster('cluster-wide SCAN iterates every master', async cluster => {
    const expected = new Set<string>();
    const writes: Array<Promise<unknown>> = [];
    for (let i = 0; i < 100; i++) {
      const key = `scan-all:${i}`;
      expected.add(key);
      writes.push(cluster.set(key, 'v'));
    }
    await Promise.all(writes);

    // Low COUNT forces several iterations per node, exercising both the
    // virtual-token continuation on one node and the advance between nodes.
    const found = new Set<string>();
    let cursor = '0';
    do {
      const reply = await cluster.scan(cursor, { MATCH: 'scan-all:*', COUNT: 29 });
      cursor = reply.cursor;
      for (const key of reply.keys) found.add(key);
    } while (cursor !== '0');

    assert.deepEqual(found, expected);
  }, GLOBAL.CLUSTERS.OPEN);

  testUtils.testWithCluster('cluster-wide SCAN rejects a foreign cursor', async cluster => {
    await assert.rejects(cluster.scan('123456'), /unknown cursor/);
  }, GLOBAL.CLUSTERS.OPEN);

  describe('scan iterators', () => {
    async function setScanKeys(cluster: { set(key: string, value: string): Promise<unknown> }) {
      const keys = new Set<string>();
      const writes: Array<Promise<unknown>> = [];
      for (let i = 0; i < 100; i++) {
        const key = `scan-iterator:${i}`;
        keys.add(key);
        writes.push(cluster.set(key, 'v'));
      }
      await Promise.all(writes);
      return keys;
    }

    testUtils.testWithCluster('scanIterator yields the keys of every master', async cluster => {
      const expected = await setScanKeys(cluster);
      // The keys must be spread over every master for this test to mean anything.
      for (const master of cluster.masters) {
        assert.ok(await (await cluster.nodeClient(master)).dbSize() > 0);
      }

      const found = new Set<string>();
      for await (const keys of cluster.scanIterator({ MATCH: 'scan-iterator:*', COUNT: 10 })) {
        for (const key of keys) found.add(key);
      }

      assert.deepEqual(found, expected);
      assert.equal(cluster._slots.scanCursors.size, 0);
    }, GLOBAL.CLUSTERS.OPEN);

    testUtils.testWithCluster('scanIterator terminates under a Buffer type mapping', async cluster => {
      const expected = await setScanKeys(cluster);
      const mapped = cluster.withTypeMapping({ [RESP_TYPES.BLOB_STRING]: Buffer });

      const found = new Set<string>();
      for await (const keys of mapped.scanIterator({ MATCH: 'scan-iterator:*', COUNT: 10 })) {
        for (const key of keys) {
          assert.ok(Buffer.isBuffer(key));
          found.add(key.toString());
        }
      }

      assert.deepEqual(found, expected);
    }, GLOBAL.CLUSTERS.OPEN);

    testUtils.testWithCluster('scanIterator frees the cursor on an early break', async cluster => {
      await setScanKeys(cluster);

      for await (const _ of cluster.scanIterator({ MATCH: 'scan-iterator:*', COUNT: 10 })) {
        assert.equal(cluster._slots.scanCursors.size, 1);
        break;
      }

      assert.equal(cluster._slots.scanCursors.size, 0);
    }, GLOBAL.CLUSTERS.OPEN);

    testUtils.testWithCluster('scanIterator throws ScanIteratorInterruptedError when the cursor node leaves', async cluster => {
      await setScanKeys(cluster);

      const iterator = cluster.scanIterator({ MATCH: 'scan-iterator:*', COUNT: 10 });
      await iterator.next();

      // Point the in-flight cursor at a node that is not in the cluster.
      const [entry] = cluster._slots.scanCursors.values();
      entry.address = '127.0.0.1:1';

      await assert.rejects(iterator.next(), ScanIteratorInterruptedError);
      assert.equal(cluster._slots.scanCursors.size, 0);
    }, GLOBAL.CLUSTERS.OPEN);

    testUtils.testWithCluster('scanIterator leaves a cursor it does not own alone', async cluster => {
      // A live cursor of another scan-chained command, which SCAN rejects.
      const token = cluster._slots.mintCursorToken();
      cluster._slots.bindScanCursor(token, cluster.masters[0].address, '0', new Set(), 'BLESS SCAN');

      await assert.rejects(cluster.scanIterator({ cursor: token }).next(), /unknown cursor/);
      assert.ok(cluster._slots.lookupScanCursor(token));
    }, GLOBAL.CLUSTERS.OPEN);

    testUtils.testWithCluster('keyed scan iterators keep every page on the master', async cluster => {
      // Above `set-max-listpack-entries`, so SSCAN really takes several pages.
      const members = Array.from({ length: 300 }, (_, i) => `member:${i}`);
      await cluster.sAdd('set', members);

      // With `useReplicas`, read-only commands rotate over the master and its
      // replicas, but a scan cursor is only valid on the node that issued it.
      const replicaSpies = await Promise.all(cluster.replicas.map(async replica =>
        spy(await cluster.nodeClient(replica), '_executeCommand')
      ));
      try {
        const found = new Set<string>();
        for await (const batch of cluster.sScanIterator('set', { COUNT: 5 })) {
          for (const member of batch) found.add(member);
        }
        assert.deepEqual(found, new Set(members));
        for (const replicaSpy of replicaSpies) assert.equal(replicaSpy.callCount, 0);
      } finally {
        for (const replicaSpy of replicaSpies) replicaSpy.restore();
      }
    }, GLOBAL.CLUSTERS.WITH_REPLICAS);

    testUtils.testWithCluster('hScanIterator, sScanIterator and zScanIterator', async cluster => {
      // Above the listpack limits, so each iterator really takes several pages.
      const fields: Record<string, string> = {};
      const members: Array<string> = [];
      for (let i = 0; i < 300; i++) {
        fields[`field:${i}`] = `value:${i}`;
        members.push(`member:${i}`);
      }
      await Promise.all([
        cluster.hSet('hash', fields),
        cluster.sAdd('set', members),
        cluster.zAdd('zset', members.map((value, score) => ({ value, score })))
      ]);

      const hashEntries: Record<string, string> = {};
      for await (const entries of cluster.hScanIterator('hash', { COUNT: 10 })) {
        for (const { field, value } of entries) hashEntries[field] = value;
      }
      assert.deepEqual(hashEntries, fields);

      const hashValues = new Set<string>();
      for await (const values of cluster.hScanValuesIterator('hash', { COUNT: 10 })) {
        for (const value of values) hashValues.add(value);
      }
      assert.deepEqual(hashValues, new Set(Object.values(fields)));

      const hashFields = new Set<string>();
      for await (const batch of cluster.hScanNoValuesIterator('hash', { COUNT: 10 })) {
        for (const field of batch) hashFields.add(field);
      }
      assert.deepEqual(hashFields, new Set(Object.keys(fields)));

      const setMembers = new Set<string>();
      for await (const batch of cluster.sScanIterator('set', { COUNT: 10 })) {
        for (const member of batch) setMembers.add(member);
      }
      assert.deepEqual(setMembers, new Set(members));

      const zsetMembers = new Map<string, number>();
      for await (const batch of cluster.zScanIterator('zset', { COUNT: 10 })) {
        for (const { value, score } of batch) zsetMembers.set(value, score);
      }
      assert.deepEqual(zsetMembers, new Map(members.map((value, score) => [value, score])));
    }, GLOBAL.CLUSTERS.OPEN);
  });

  testUtils.testWithCluster('RANDOMKEY finds the key whichever shard holds it', async cluster => {
    // Single key in the whole cluster: a single-node RANDOMKEY would return
    // nil whenever the randomly-picked node is one of the empty masters; the
    // all_shards fan-out + non-nil reduction must always find it.
    await cluster.set('the-only-key', 'v');
    for (let i = 0; i < 5; i++) {
      assert.equal(await cluster.randomKey(), 'the-only-key');
    }
  }, GLOBAL.CLUSTERS.OPEN);

  // One end-to-end assertion per reachable request/response policy type. The
  // multi_shard MGET/DEL scatter, cluster-wide SCAN and RANDOMKEY cases live
  // above; FT.CURSOR (special) is covered in the search package. These fill
  // the rest of the matrix from .specs/request-response-policies-spec.md.
  describe('request/response policies', () => {
    testUtils.testWithCluster('default-keyed SET/GET round-trips', async cluster => {
      assert.equal(await cluster.set('policy:sg', 'v'), 'OK');
      assert.equal(await cluster.get('policy:sg'), 'v');
    }, GLOBAL.CLUSTERS.OPEN);

    testUtils.testWithCluster('default-keyless ECHO returns the sole reply', async cluster => {
      assert.equal(await cluster.echo('hello'), 'hello');
    }, GLOBAL.CLUSTERS.OPEN);

    testUtils.testWithCluster('all_shards KEYS merges matches from every master', async cluster => {
      await cluster.flushAll();
      const expected = new Set(['pk:a', 'pk:b', 'pk:c', 'pk:d']);
      await Promise.all([...expected].map(key => cluster.set(key, 'v')));
      // default-keyless response over an all_shards fan-out: union, deduped.
      assert.deepEqual(new Set(await cluster.keys('pk:*')), expected);
    }, GLOBAL.CLUSTERS.OPEN);

    testUtils.testWithCluster('all_shards FLUSHALL + PING collapse identical replies', async cluster => {
      await Promise.all([cluster.set('fa:x', '1'), cluster.set('fa:y', '1')]);
      // all_succeeded: every master must ACK; identical replies collapse to one.
      assert.equal(await cluster.flushAll(), 'OK');
      assert.equal(await cluster.dbSize(), 0);
      assert.equal(await cluster.ping(), 'PONG');
    }, GLOBAL.CLUSTERS.OPEN);

    testUtils.testWithCluster('all_shards WAIT returns the min synced-replica count', async cluster => {
      await cluster.set('wait:k', 'v');
      // agg_min: one replica per master → each shard reports >=1; the floor is 1.
      assert.equal(await cluster.wait(1, 1000), 1);
    }, GLOBAL.CLUSTERS.WITH_REPLICAS);

    testUtils.testWithCluster('all_shards SCRIPT EXISTS ANDs presence across masters', async cluster => {
      // SCRIPT LOAD is all_nodes → the script lands on every master.
      const everywhere = await cluster.scriptLoad('return 1');
      assert.deepEqual(await cluster.scriptExists(everywhere), [1]);

      // Load a second script on a single master only → agg_logical_and → 0.
      const oneMaster = await cluster.nodeClient(cluster.masters[0]);
      const partial = await oneMaster.scriptLoad('return 2');
      assert.deepEqual(await cluster.scriptExists(partial), [0]);
    }, GLOBAL.CLUSTERS.OPEN);

    testUtils.testWithCluster('all_nodes CONFIG SET reaches replicas too', async cluster => {
      // all_nodes (not all_shards): replicas must see it directly, not via
      // replication — verify each replica reports the new value.
      assert.equal(await cluster.configSet({ 'maxmemory-samples': '7' }), 'OK');
      for (const replica of cluster.replicas) {
        const client = await cluster.nodeClient(replica);
        assert.equal((await client.configGet('maxmemory-samples'))['maxmemory-samples'], '7');
      }
    }, GLOBAL.CLUSTERS.WITH_REPLICAS);

    testUtils.testWithCluster('all_nodes SLOWLOG LEN fans out and reduces with agg_sum', async cluster => {
      // Raw path: resolves the `slowlog len` subcommand policy (all_nodes /
      // agg_sum). After RESET (all_nodes / all_succeeded) the fan-out reduces
      // to a single scalar count, not a per-node array or a throw.
      await cluster.sendCommand(undefined, false, ['SLOWLOG', 'RESET']);
      const len = await cluster.sendCommand<number>(undefined, false, ['SLOWLOG', 'LEN']);
      assert.equal(typeof len, 'number');
      assert.ok(len >= 0);
    }, GLOBAL.CLUSTERS.OPEN);

    testUtils.testWithCluster('multi_shard EXISTS/TOUCH/UNLINK sum counts across slots', async cluster => {
      await Promise.all([cluster.set('a', '1'), cluster.set('b', '1')]);
      // agg_sum over the per-slot splits.
      assert.equal(await cluster.exists(['a', 'b', 'missing']), 2);
      assert.equal(await cluster.touch(['a', 'b']), 2);
      assert.equal(await cluster.unlink(['a', 'b']), 2);
      assert.equal(await cluster.exists(['a', 'b']), 0);
    }, GLOBAL.CLUSTERS.OPEN);

    testUtils.testWithCluster('multi_shard MSET writes each pair to its own shard', async cluster => {
      // all_succeeded over the split key/value pairs.
      assert.equal(await cluster.mSet([['a', 'va'], ['b', 'vb']]), 'OK');
      assert.deepEqual(await cluster.mGet(['a', 'b']), ['va', 'vb']);
    }, GLOBAL.CLUSTERS.OPEN);

    testUtils.testWithCluster('multi_shard single-slot keys take the no-split fast path', async cluster => {
      // Hash tags pin both keys to one slot → the splitter returns the command
      // unsplit and it routes as a single atomic command to that shard.
      await Promise.all([cluster.set('{t}1', 'v1'), cluster.set('{t}2', 'v2')]);
      assert.deepEqual(await cluster.mGet(['{t}1', '{t}2']), ['v1', 'v2']);
      assert.equal(await cluster.del(['{t}1', '{t}2']), 2);
    }, GLOBAL.CLUSTERS.OPEN);

    testUtils.testWithCluster('multi_shard follows a MOVED/ASK redirect per sub-command', async cluster => {
      // 'key' hashes to slot 12539; find a second key homed on a different
      // master so the mGet genuinely spans two shards.
      const keyA = 'key',
        slot = calculateSlot(keyA),
        migrating = cluster.slots[slot].master,
        importing = cluster.masters.find(master => master.id !== migrating.id)!;

      let keyB = '';
      for (const candidate of ['b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k']) {
        if (cluster.slots[calculateSlot(candidate)].master.id === importing.id) {
          keyB = candidate;
          break;
        }
      }
      assert.ok(keyB, 'expected a key homed on the importing master');

      await Promise.all([cluster.set(keyA, 'va'), cluster.set(keyB, 'vb')]);

      const [importingClient, migratingClient] = await Promise.all([
        cluster.nodeClient(importing),
        cluster.nodeClient(migrating)
      ]);
      await Promise.all([
        importingClient.clusterSetSlot(slot, 'IMPORTING', migrating.id),
        migratingClient.clusterSetSlot(slot, 'MIGRATING', importing.id)
      ]);
      await migratingClient.migrate(importing.host, importing.port, keyA, 0, 10);

      // keyA's sub-command hits the migrating node and follows ASK to importing;
      // keyB's routes straight to importing. Caller order is preserved.
      assert.deepEqual(await cluster.mGet([keyA, keyB]), ['va', 'vb']);

      await Promise.all([
        importingClient.clusterSetSlot(slot, 'NODE', importing.id),
        migratingClient.clusterSetSlot(slot, 'NODE', importing.id)
      ]);

      // Slot now permanently on importing → keyA's sub-command takes MOVED.
      assert.deepEqual(await cluster.mGet([keyA, keyB]), ['va', 'vb']);
    }, {
      serverArguments: [],
      numberOfMasters: 2
    });

    testUtils.testWithCluster('unknown command falls back to key routing (no policy throw)', async cluster => {
      // A made-up wire command is absent from the policy table → the resolver
      // returns {ok:false} → the default-keyed fallback routes by the key and
      // the request reaches that shard, which rejects it as unknown. Reaching
      // the server proves the fallback routed instead of throwing a client-side
      // policy-resolution error before any network call.
      await assert.rejects(
        cluster.custom.unknown('policyless:key'),
        /unknown command/i
      );
    }, {
      ...GLOBAL.CLUSTERS.OPEN,
      clusterConfiguration: {
        modules: {
          custom: {
            unknown: {
              parseCommand(parser: CommandParser, key: string) {
                parser.push('DEFINITELY_NOT_A_COMMAND');
                parser.pushKey(key);
              },
              transformReply: undefined as unknown as () => unknown
            }
          }
        }
      }
    });

    testUtils.testWithCluster('raw sendCommand splits a known multi_shard command', async cluster => {
      await Promise.all([cluster.set('a', 'value-a'), cluster.set('b', 'value-b')]);
      // The resolver returns MGET's keySpecs for the raw args and the splitter
      // works on the flat redisArgs, reassembling replies in caller order.
      assert.deepEqual(
        await cluster.sendCommand(undefined, true, ['MGET', 'a', 'b']),
        ['value-a', 'value-b']
      );
    }, GLOBAL.CLUSTERS.OPEN);
  });

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

      const range = cluster.slots[0].master.address === migrating.address ? {
        key: 'bar', // 5061
        start: 0,
        end: 8191
      } : {
        key: 'foo', // 12182
        start: 8192,
        end: 16383
      };

      // Reassign the whole slot range in one shot with DEL/ADDSLOTSRANGE
      // instead of thousands of per-slot `CLUSTER SETSLOT .. NODE` calls,
      // which overflowed the test timeout on slow CI runners. Release the
      // range on both nodes first (`CLUSTER ADDSLOTS` rejects a slot that is
      // still assigned in the node's own cluster view, and gossip has not yet
      // propagated the migrating node's release to the importing node), then
      // claim it on the importing node, then wait for both nodes to reconverge
      // to a healthy cluster before going on (the reassignment leaves a
      // transient `cluster_state:fail` window).
      const slotRange = { start: range.start, end: range.end };
      await Promise.all([
        migratingClient.clusterDelSlotsRange(slotRange),
        importingClient.clusterDelSlotsRange(slotRange)
      ]);
      await importingClient.clusterAddSlotsRange(slotRange);

      for (const client of [migratingClient, importingClient]) {
        while (!(await client.clusterInfo()).startsWith('cluster_state:ok')) {
          await setTimeout(25);
        }
      }

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
      minimumDockerVersion: [7],
      // range reassignment plus polling both nodes for `cluster_state:ok` can
      // exceed mocha's default 2000ms on slow CI runners
      testTimeout: 30000
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

    testUtils.testWithCluster('closes the sharded pub/sub client of a master demoted by a failover', async cluster => {
      await cluster.connect();

      try {
        const SLOT = 10328, // slot of `channel`
          listener = spy();

        await cluster.sSubscribe('channel', listener);

        const previousMaster = cluster.slots[SLOT].master,
          pubSubClient = previousMaster.pubSub!.client,
          replicaClient = await cluster.nodeClient(cluster.slots[SLOT].replicas![0]);

        await replicaClient.clusterFailover();

        for (let i = 0; ; i++) {
          const info = await replicaClient.sendCommand<string>(['INFO', 'replication']);
          if (info.includes('role:master')) break;
          if (i === 199) assert.fail('Cluster failover did not complete');
          await setTimeout(50);
        }

        for (let i = 0; i < 50 && !listener.called; i++) {
          await cluster.sPublish('channel', 'message');
          await setTimeout(100);
        }

        // the old master's node is now a replica, and its pub/sub client is closed
        assert.ok(listener.calledWithExactly('message', 'channel'));
        assert.equal(cluster.slots[SLOT].replicas![0].address, previousMaster.address);
        assert.equal(pubSubClient.isOpen, false);
      } finally {
        cluster.destroy();
      }
    }, {
      serverArguments: [],
      numberOfMasters: 2,
      numberOfReplicas: 1,
      minimumDockerVersion: [7],
      disableClusterSetup: true,
      clusterConfiguration: {
        useReplicas: true
      },
      testTimeout: 30000
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

    testUtils.testWithCluster('should fire node-connect and node-ready again after a node reconnects', async cluster => {
      const master = cluster.masters[0],
        log: Array<string> = [];

      cluster
        .on('node-reconnecting', () => log.push('node-reconnecting'))
        .on('node-connect', () => log.push('node-connect'))
        .on('node-ready', () => log.push('node-ready'));

      // Drop the server side of exactly the cluster's own connection to this
      // node: ask that node client for its CLIENT ID, then kill that id from a
      // separate connection so nothing else on the node is affected.
      const nodeClientId = await master.client!.sendCommand(['CLIENT', 'ID']),
        killer = RedisClient.create({
          socket: { host: master.host, port: master.port }
        });

      await killer.connect();
      try {
        await killer.sendCommand(['CLIENT', 'KILL', 'ID', String(nodeClientId)]);
      } finally {
        killer.destroy();
      }

      // The node client reconnects on its own; wait for the events rather than
      // for a fixed delay. The budget here (5s) must stay well inside
      // `testTimeout` below, which has to be raised because Mocha's default is
      // 2s. Without the fix `node-reconnecting` is the only one that ever
      // arrives and the loop exhausts -> assertion fails.
      for (let i = 0; i < 100 && !log.includes('node-ready'); i++) {
        await setTimeout(50);
      }

      assert.deepEqual(log, [
        'node-reconnecting',
        'node-connect',
        'node-ready'
      ]);
    }, {
      ...GLOBAL.CLUSTERS.OPEN,
      numberOfMasters: 2,
      numberOfReplicas: 0,
      testTimeout: 30000,
      clusterConfiguration: {
        minimizeConnections: false
      }
    });
  });

});
