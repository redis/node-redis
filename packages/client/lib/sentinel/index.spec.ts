import { strict as assert } from 'node:assert';
import { setTimeout } from 'node:timers/promises';
import { WatchError } from "../errors";
import { RedisSentinelConfig, SentinelFramework } from "./test-util";
import { RedisNode, RedisSentinelType } from "./types";

/* used to ensure test environment resets to normal state
   i.e. 
   - all redis nodes are active and are part of the topology
   before allowing things to continue.
*/
async function steadyState(frame: SentinelFramework) {
  let countNodes = 0;

  let nodeResolve;
  const nodePromise = new Promise((res) => {
    nodeResolve = res;
  })

  const numberOfNodes = frame.getAllNodesPort.length;

  const seenNodes = new Set<number>();

  const sentinel = frame.getSentinelClient({ useReplicas: true })
    .on('master-change', (node: RedisNode) => {
      seenNodes.add(node.port);
      if (seenNodes.size == frame.getAllNodesPort().length) {
        nodeResolve();
      }
    }).on('replica-added', (node: RedisNode) => {
      seenNodes.add(node.port);
      if (seenNodes.size == frame.getAllNodesPort().length) {
        nodeResolve();
      }
    }).on('error', err => { });

  await sentinel.connect();

  await nodePromise;
  await sentinel.flushAll();
  sentinel.destroy();
}

describe.only('Client', () => {
  const config: RedisSentinelConfig = { sentinelName: "test", numberOfNodes: 3 };
  const frame = new SentinelFramework(config);
  let sentinel: RedisSentinelType<{}, {}, {}, 2, {}> | undefined;

  before(async function () {
    this.timeout(15000);

    await frame.spawnRedisSentinel();
  });

  after(async function () {
    this.timeout(15000);

    if (sentinel !== undefined) {
      await sentinel.destroy();
    }
    sentinel = undefined;

    await frame.cleanup();
  })

  beforeEach(async function () {
    this.timeout(15000);

    for (const port of frame.getAllNodesPort()) {
      await frame.restartNode(port.toString());
    }

    for (const port of frame.getAllSentinelsPort()) {
      await frame.restartSentinel(port.toString());
    }

    await steadyState(frame);
  })

  afterEach(async function () {
    if (sentinel !== undefined) {
      await sentinel.destroy();
    }

    sentinel = undefined;
  })

  it('figure out how to automate validation against tls');
  it('test with a script');
  it('test with a function');
  it('test with a module?');
  it('test with a type mapping');
  it('test with a pipeline that is not a multi');
  it('test p/unsubscribe');
  it('test many readers, that it loops around correctly')

  it('basic bootstrap', async function () {   
    sentinel = frame.getSentinelClient();
    await sentinel.connect();

    assert.equal(await sentinel.set('x', 1), 'OK');
  });

  it('basic teardown worked', async function () {
    const nodePorts = frame.getAllNodesPort();
    const sentinelPorts = frame.getAllSentinelsPort();

    assert.notEqual(nodePorts.length, 0);
    assert.notEqual(sentinelPorts.length, 0);

    sentinel = frame.getSentinelClient();
    await sentinel.connect();

    assert.equal(await sentinel.get('x'), null);
  });

  it('try to connect multiple times', async function () {
    sentinel = frame.getSentinelClient();
    const connectPromise = sentinel.connect();
    assert.rejects(sentinel.connect());
    await connectPromise;
  });

  it('reselient use', async function () {
    this.timeout(30000);

    sentinel = frame.getSentinelClient({ useReplicas: true });
    sentinel.on("error", () => { });
    await sentinel.connect();

    const promise = sentinel.use(
      async (client) => {
        await setTimeout(5000);
        return await client.get('x');
      },
      true
    );

    const masterPort = await frame.getMasterPort();
    await frame.stopNode(masterPort.toString());

    assert.equal(await promise, null);
  });

  it('non reselient use', async function () {
    this.timeout(30000);

    sentinel = frame.getSentinelClient({ useReplicas: true });
    sentinel.on("error", () => { });
    await sentinel.connect();

    const promise = sentinel.use(
      async (client) => {
        await setTimeout(5000);
        return await client.get('x');
      },
      false
    );

    const masterPort = await frame.getMasterPort();
    await frame.stopNode(masterPort.toString());

    assert.rejects(promise);
  });

  it('block on pool', async function () {
    this.timeout(30000);

    sentinel = frame.getSentinelClient({ useReplicas: true });
    sentinel.on("error", () => { });
    await sentinel.connect();
    const promise = sentinel.use(
      async (client) => {
        await setTimeout(1000);
        return await client.get("x");
      }, true
    )
    await sentinel.set("x", 1);
    assert.equal(await promise, null);
  });

  it('multiple clients', async function () {
    this.timeout(30000);

    sentinel = frame.getSentinelClient({ masterPoolSize: 2 });
    sentinel.on("error", () => { });
    await sentinel.connect();

    let set = false;

    const promise = sentinel.use(
      async (client) => {
        await setTimeout(1000);
        await client.get("x");
        set = true;
      }, true
    )

    await sentinel.set("x", 1);
    assert.equal(set, false);
    await promise;
    assert.equal(set, true);
  });

  // by taking a lease, we know we will block on master as no clients are available, but as read occuring, means replica read occurs
  it('replica reads', async function () {
    this.timeout(30000);

    sentinel = frame.getSentinelClient({ useReplicas: true });
    sentinel.on("error", () => { });
    await sentinel.connect();

    const clientLease = await sentinel.getMasterClientLease();
    clientLease.set('x', 456);

    let matched = false;
    for (let i = 0; i < 15; i++) {
      try {
        assert.equal(await sentinel.get("x"), '456');
        matched = true;
        break;
      } catch (err) {
        await setTimeout(1000);
      }
    }

    clientLease.release();

    assert.equal(matched, true);
  });

  it('use - watch - clean', async function () {
    this.timeout(30000);

    sentinel = frame.getSentinelClient({ masterPoolSize: 2 });
    await sentinel.connect();

    let promise = sentinel.use(async (client) => {
      await client.set("x", 1);
      await client.watch("x");
      return client.multi().get("x").exec();
    });

    assert.deepEqual(await promise, ['1']);
  });

  it('use - watch - dirty', async function () {
    this.timeout(30000);

    sentinel = frame.getSentinelClient({ masterPoolSize: 2 });
    await sentinel.connect();

    let promise = sentinel.use(async (client) => {
      await client.set('x', 1);
      await client.watch('x');
      await sentinel!.set('x', 2);
      return client.multi().get('x').exec();
    });

    await assert.rejects(promise, WatchError);
  });

  it('lease - watch - clean', async function () {
    sentinel = frame.getSentinelClient({ masterPoolSize: 2 });
    await sentinel.connect();

    const leasedClient = await sentinel.getMasterClientLease();
    await leasedClient.set('x', 1);
    await leasedClient.watch('x');
    assert.deepEqual(await leasedClient.multi().get('x').exec(), ['1'])
  });

  it('lease - watch - dirty', async function () {
    sentinel = frame.getSentinelClient({ masterPoolSize: 2 });
    await sentinel.connect();

    const leasedClient = await sentinel.getMasterClientLease();
    await leasedClient.set('x', 1);
    await leasedClient.watch('x');
    await leasedClient.set('x', 2);

    await assert.rejects(leasedClient.multi().get('x').exec(), WatchError);
  });


  it('watch does not carry through leases', async function () {
    sentinel = frame.getSentinelClient();
    await sentinel.connect();

    // each of these commands is an independent lease
    assert.equal(await sentinel.watch("x"), 'OK')
    assert.equal(await sentinel.set('x', 1), 'OK');
    assert.deepEqual(await sentinel.multi().get('x').exec(), ['1']);
  });

  // stops master to force sentinel to update 
  it('stop master', async function () {
    this.timeout(30000);

    sentinel = frame.getSentinelClient();
    sentinel.on("error", () => { });
    await sentinel.connect();

    let masterChangeResolve;
    const masterChangePromise = new Promise((res) => {
      masterChangeResolve = res;
    })

    const masterPort = await frame.getMasterPort();
    sentinel.on('master-change', (node: RedisNode) => {
      if (node.port != masterPort) {
        masterChangeResolve(node);
      }
    });

    await frame.stopNode(masterPort.toString());

    const newMaster = await masterChangePromise as RedisNode;
    assert.notEqual(masterPort, newMaster.port);
  });

  // if master changes, client should make sure user knows watches are invalid
  it('watch across master change', async function () {
    this.timeout(30000);

    sentinel = frame.getSentinelClient({ masterPoolSize: 2 });
    sentinel.on("error", () => { });
    await sentinel.connect();

    const client = await sentinel.getMasterClientLease();
    await client.set("x", 1);
    await client.watch("x");

    let resolve;
    const promise = new Promise((res) => {
      resolve = res;
    })

    sentinel.once('master-change', (node) => {
      resolve(node);
    });

    const masterPort = await frame.getMasterPort();
    await frame.stopNode(masterPort.toString());

    const newMaster = await promise as RedisNode;
    assert.notEqual(masterPort, newMaster.port);

    await assert.rejects(async () => { await client.multi().get("x").exec() }, new Error("sentinel config changed in middle of a WATCH Transaction"));
  });

  // same as above, but set a watch before and after master change, shouldn't change the fact that watches are invalid
  it('watch before and after master change', async function () {
    this.timeout(30000);

    sentinel = frame.getSentinelClient({ masterPoolSize: 2 });
    sentinel.on("error", () => { });
    await sentinel.connect();

    const client = await sentinel.getMasterClientLease();
    await client.set("x", 1);
    await client.watch("x");

    let resolve;
    const promise = new Promise((res) => {
      resolve = res;
    })

    sentinel.once('master-change', (node) => {
      resolve(node);
    });

    const masterPort = await frame.getMasterPort();
    await frame.stopNode(masterPort.toString());

    const newMaster = await promise as RedisNode;
    assert.notEqual(masterPort, newMaster.port);

    await client.watch("y");

    await assert.rejects(async () => { await client.multi().get("x").exec() }, new Error("sentinel config changed in middle of a WATCH Transaction"));
  });

  it('plain pubsub - channel', async function () {
    this.timeout(30000);

    sentinel = frame.getSentinelClient();
    await sentinel.connect();

    let pubSubResolve;
    const pubSubPromise = new Promise((res) => {
      pubSubResolve = res;
    })

    await sentinel.subscribe('test', () => {
      pubSubResolve(1);
    })

    await sentinel.publish('test', 'hello world');
    await pubSubPromise;
  });

  it('plain pubsub - pattern', async function () {
    this.timeout(30000);

    sentinel = frame.getSentinelClient();
    await sentinel.connect();

    let pubSubResolve;
    const pubSubPromise = new Promise((res) => {
      pubSubResolve = res;
    })

    await sentinel.pSubscribe('test*', () => {
      pubSubResolve(1);
    })

    await sentinel.publish('testy', 'hello world');
    await pubSubPromise;
  });

  // pubsub continues to work, even with a master change
  it('pubsub - channel - with master change', async function () {
    this.timeout(30000);

    sentinel = frame.getSentinelClient();
    sentinel.on("error", () => { });
    await sentinel.connect();

    let pubSubResolve;
    const pubSubPromise = new Promise((res) => {
      pubSubResolve = res;
    })

    await sentinel.subscribe('test', () => {
      pubSubResolve(1);
    })

    let masterChangeResolve;
    const masterChangePromise = new Promise((res) => {
      masterChangeResolve = res;
    })

    sentinel.once('master-change', (node) => {
      masterChangeResolve(node);
    });

    const masterPort = await frame.getMasterPort();
    await frame.stopNode(masterPort.toString());

    const newMaster = await masterChangePromise as RedisNode;
    assert.notEqual(masterPort, newMaster.port);

    await sentinel.publish('test', 'hello world');
    await pubSubPromise;
  });

  it('pubsub - pattern - with master change', async function () {  
    this.timeout(30000);

    sentinel = frame.getSentinelClient();
    sentinel.on("error", () => { });
    await sentinel.connect();

    let pubSubResolve;
    const pubSubPromise = new Promise((res) => {
      pubSubResolve = res;
    })

    await sentinel.pSubscribe('test*', () => {
      pubSubResolve(1);
    })

    let masterChangeResolve;
    const masterChangePromise = new Promise((res) => {
      masterChangeResolve = res;
    })

    const masterPort = await frame.getMasterPort();
    sentinel.on('master-change', (node: RedisNode) => {
      if (node.port != masterPort) {
        masterChangeResolve(node);
      }
    });

    await frame.stopNode(masterPort.toString());

    const newMaster = await masterChangePromise as RedisNode;
    assert.notEqual(masterPort, newMaster.port);

    await sentinel.publish('testy', 'hello world');
    await pubSubPromise;
  });

  // if we stop a node, the comand should "retry" until we reconfigure topology and execute on new topology
  it('command immeaditely after stopping master', async function () {
    this.timeout(30000);

    sentinel = frame.getSentinelClient();
    sentinel.on("error", () => { });
    await sentinel.connect();

    let masterChangeResolve;
    const masterChangePromise = new Promise((res) => {
      masterChangeResolve = res;
    })

    const masterPort = await frame.getMasterPort();
    sentinel.on('master-change', (node: RedisNode) => {
      if (node.port != masterPort) {
        masterChangeResolve(node);
      }
    });

    await frame.stopNode(masterPort.toString());
    assert.equal(await sentinel.set('x', 123), 'OK');

    const newMaster = await masterChangePromise as RedisNode;
    assert.notEqual(masterPort, newMaster.port);

    assert.equal(await sentinel.get('x'), '123');
  });

  it('shutdown sentinel node', async function () {
    this.timeout(10000);

    sentinel = frame.getSentinelClient();
    sentinel.on("error", () => { });
    await sentinel.connect();

    let sentinelChangeResolve;
    const sentinelChangePromise = new Promise((res) => {
      sentinelChangeResolve = res;
    })

    sentinel.once('sentinel-change', node => {
      sentinelChangeResolve(node);
    });

    const sentinelPort = sentinel.options.sentinelRootNodes[0].port;
    await frame.stopSentinel(sentinelPort.toString());

    const newSentinel = await sentinelChangePromise as RedisNode;
    assert.notEqual(sentinelPort, newSentinel.port);
  });

  it('timer works, and updates sentinel list', async function () {
    this.timeout(30000);

    sentinel = frame.getSentinelClient({ scanInterval: 1000 });
    await sentinel.connect();

    let sentinelChangeResolve;
    const sentinelChangePromise = new Promise((res) => {
      sentinelChangeResolve = res;
    })

    sentinel.once('sentinels-modified', size => {
      if (size == 4) {
        sentinelChangeResolve(size);
      }
    });

    await frame.addSentinel();
    const newSentinelSize = await sentinelChangePromise as number;

    assert.equal(newSentinelSize, 4);
  });

  it('stop replica, bring back replica', async function () {
    this.timeout(30000);

    sentinel = frame.getSentinelClient({ useReplicas: true });
    sentinel.on('error', err => {});
    await sentinel.connect();

    let sentinelRemoveResolve;
    const sentinelRemovePromise = new Promise((res) => {
      sentinelRemoveResolve = res;
    })

    sentinel.once('replica-removed', (node: RedisNode) => {
      sentinelRemoveResolve(node);
    });

    const replicaPort = await frame.getRandonNonMasterNode();
    await frame.stopNode(replicaPort);

    const stoppedNode = await sentinelRemovePromise as RedisNode;
    assert.equal(stoppedNode.port, Number(replicaPort));

    let sentinelRestartedResolve;
    const sentinelRestartedPromise = new Promise((res) => {
      sentinelRestartedResolve = res;
    })

    sentinel.once('replica-added', (node: RedisNode) => {
      sentinelRestartedResolve(node);
    });

    await frame.restartNode(replicaPort);

    const restartedNode = await sentinelRestartedPromise as RedisNode;
    assert.equal(restartedNode.port, Number(replicaPort));
  })

  it('add a node / new replica', async function () {
    this.timeout(30000);

    sentinel = frame.getSentinelClient({ scanInterval: 2000, useReplicas: true });
    // need to handle errors, as the spawning a new docker node can cause existing connections to time out
    sentinel.on('error', err => {});
    await sentinel.connect();

    let nodeAddedResolve: (value: RedisNode) => void;
    const nodeAddedPromise = new Promise((res) => {
      nodeAddedResolve = res as (value: RedisNode) => void;
    });

    const portSet = new Set<number>();
    for (const port of frame.getAllNodesPort()) {
      portSet.add(port);
    }

    // "on" and not "once" as due to connection timeouts, can happen multiple times, and want right one
    sentinel.on('replica-added', (node: RedisNode) => {
      if (!portSet.has(node.port)) {
        nodeAddedResolve(node);
      }
    });

    await frame.addNode();

    await nodeAddedPromise;
  })
});