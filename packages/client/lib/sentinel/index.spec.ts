import { RedisSentinelConfig, SentinelFramework } from "./test-util"
import { strict as assert } from 'node:assert';
import { RedisNode, RedisSentinelType } from "./types";
import { setTimeout } from 'node:timers/promises';
import { WatchError } from "../errors";

/* used to ensure test environment resets to normal state
   i.e. 
   - all redis nodes are active
   before allowing things to continue.
*/
async function steadyState(frame: SentinelFramework) {
  let countNodes = 0;

  let nodeResolve;
  const nodePromise = new Promise((res) => {
    nodeResolve = res;
  })

  const numberOfNodes = frame.config.numberOfNodes ?? 1;

  const sentinel = frame.getSentinelClient({useReplicas: true})
  .on('master-change', (node) => {
    countNodes++;
    if (countNodes == numberOfNodes) {
      nodeResolve();
    }
  }).on('replica-added', (node) => {
    countNodes++;
    if (countNodes == numberOfNodes) {
      nodeResolve();
    }
  }).on('error', err => {});

  await sentinel.connect();

  await nodePromise;
  await sentinel.flushAll();
  sentinel.destroy();
}

describe.only('Client', () => {
  const config: RedisSentinelConfig = {sentinelName: "test", numberOfNodes: 3};
  const frame = new SentinelFramework(config);
  let sentinel: RedisSentinelType<{}, {}, {}, 2, {}> | undefined;

  before(async function () {
    this.timeout(15000);

    await frame.spawnRedisSentinel();
  });

  after(async function() {
    this.timeout(15000);

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

  afterEach(async function() {
    if (sentinel !== undefined) {
      sentinel.destroy();
    }

    sentinel = undefined;
  })

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

  // how to confirm that this actually read from a replica?
  it('replica reads', async function() {
    this.timeout(30000);
  
    sentinel = frame.getSentinelClient({useReplicas: true});
    sentinel.on("error", () => {});
    await sentinel.connect();
    assert.equal(await sentinel.set("x", 456), 'OK');
    await setTimeout(5000);
    for (let i=0; i < 15; i++) {
      try {
        assert.equal(await sentinel.get("x"), '456');
        break;
      } catch (err) {
        await setTimeout(1000);
      }
    }
    assert.equal(await sentinel.get("x"), '456');
  });

  it('block on queue', async function () {
    this.timeout(30000);
  
    sentinel = frame.getSentinelClient({useReplicas: true});
    await sentinel.connect();

    const promise = sentinel.use(
      async (client) => {
        await setTimeout(1000);
        return await client.get("x");
      }
    )

    await sentinel.set("x", 1);

    assert.equal(await promise, null);
  });

  it('multiple clients', async function() {
    this.timeout(30000);
  
    sentinel = frame.getSentinelClient({masterPoolSize: 2});
    await sentinel.connect();

    let set = false;

    const promise = sentinel.use(
      async (client) => {
        await setTimeout(1000);
        await client.get("x");
        set = true;
      }
    )

    await sentinel.set("x", 1);
    assert.equal(set, false);
    await promise;
    assert.equal(set, true);
  });

  it('clean watch', async function() {
    this.timeout(30000);
  
    sentinel = frame.getSentinelClient({masterPoolSize: 2});
    await sentinel.connect();

    let promise = sentinel.use(async (client) => {
      client.set("x", 1);
      client.watch("x");
      return client.multi().get("x").exec();
    });

    const ret = await promise as Array<any>;
    assert.equal(ret[0], '1');
  });

  it('dirty watch', async function() {
    this.timeout(30000);
  
    sentinel = frame.getSentinelClient({masterPoolSize: 2});
    await sentinel.connect();

    let promise = sentinel.use(async (client) => {
      client.set("x", 1);
      client.watch("x");
      await sentinel!.set("x", 2);
      return client.multi().get("x").exec();
    });

    await assert.rejects(promise, WatchError);
  });

  it('stop master', async function() {
    this.timeout(30000);

    sentinel = frame.getSentinelClient();
    sentinel.on("error", () => {});
    await sentinel.connect();

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
  });

  it('watch across master change', async function() {
    this.timeout(30000);
  
    sentinel = frame.getSentinelClient({masterPoolSize: 2});
    sentinel.on("error", () => {});
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

    await assert.rejects(async () => {await client.multi().get("x").exec()}, new Error("sentinel config changed in middle of a WATCH Transaction"));
  });

  it('watch before and after master change', async function() {
    this.timeout(30000);
  
    sentinel = frame.getSentinelClient({masterPoolSize: 2});
    sentinel.on("error", () => {});
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
    
    await assert.rejects(async () => {await client.multi().get("x").exec()}, new Error("sentinel config changed in middle of a WATCH Transaction"));
  });  

  it('plain pubsub - channel', async function() {
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

  it('plain pubsub - pattern', async function() {
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

  it('pubsub - channel - with master change', async function() {
    this.timeout(30000);
  
    sentinel = frame.getSentinelClient();
    sentinel.on("error", () => {});
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
  })

  it('pubsub - pattern - with master change', async function() {
    this.timeout(30000);
  
    sentinel = frame.getSentinelClient();
    sentinel.on("error", () => {});
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

    sentinel.once('master-change', (node) => {
      masterChangeResolve(node);
    });

    const masterPort = await frame.getMasterPort();   
    await frame.stopNode(masterPort.toString());

    const newMaster = await masterChangePromise as RedisNode;
    if (masterPort === newMaster.port) {
      console.log(`masterPort = ${masterPort}, newMaster.port = ${newMaster.port}`)
    }
    assert.notEqual(masterPort, newMaster.port);

    await sentinel.publish('testy', 'hello world');
    await pubSubPromise;
  })

  it('command immeaditely after stopping master', async function() {
    this.timeout(30000);
  
    sentinel = frame.getSentinelClient();
    sentinel.on("error", () => {});
    await sentinel.connect();

    let masterChangeResolve;
    const masterChangePromise = new Promise((res) => {
      masterChangeResolve = res;
    })

    sentinel.once('master-change', (node) => {
      masterChangeResolve(node);
    });

    const masterPort = await frame.getMasterPort();
    await frame.stopNode(masterPort.toString());
    assert.equal(await sentinel.set('x', 123), 'OK');

    const newMaster = await masterChangePromise as RedisNode;
    assert.notEqual(masterPort, newMaster.port);

    assert.equal(await sentinel.get('x'), '123');
  })
});