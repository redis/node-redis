import { strict as assert } from 'node:assert';
import { setTimeout } from 'node:timers/promises';
import testUtils, { GLOBAL, MATH_FUNCTION } from '../test-utils';
import { RESP_TYPES } from '../RESP/decoder';
import { WatchError } from "../errors";
import { RedisSentinelConfig, SentinelFramework } from "./test-util";
import { RedisSentinelEvent, RedisSentinelType, RedisSentinelClientType, RedisNode } from "./types";
import RedisSentinel from "./index";
import { RedisModules, RedisFunctions, RedisScripts, RespVersions, TypeMapping, NumberReply } from '../RESP/types';
import { promisify } from 'node:util';
import { exec } from 'node:child_process';
import { BasicPooledClientSideCache } from '../client/cache'
import { once } from 'node:events'
const execAsync = promisify(exec);

describe('RedisSentinel', () => {
  describe('initialization', () => {
    describe('clientSideCache validation', () => {
      const clientSideCacheConfig = { ttl: 0, maxEntries: 0 };
      const options = {
        name: 'mymaster',
        sentinelRootNodes: [
          { host: 'localhost', port: 26379 }
        ]
      };

      it('should throw error when clientSideCache is enabled with RESP 2', () => {
        assert.throws(
          () => RedisSentinel.create({
            ...options,
            clientSideCache: clientSideCacheConfig,
            RESP: 2 as const,
          }),
          new Error('Client Side Caching is only supported with RESP3')
        );
      });

      it('should throw error when clientSideCache is enabled with RESP undefined', () => {
        assert.throws(
          () => RedisSentinel.create({
            ...options,
            clientSideCache: clientSideCacheConfig,
          }),
          new Error('Client Side Caching is only supported with RESP3')
        );
      });

      it('should not throw when clientSideCache is enabled with RESP 3', () => {
        assert.doesNotThrow(() =>
          RedisSentinel.create({
            ...options,
            clientSideCache: clientSideCacheConfig,
            RESP: 3 as const,
          })
        );
      });

      testUtils.testWithClientSentinel('should successfully connect to sentinel', async () => {
      }, {
        ...GLOBAL.SENTINEL.OPEN,
        sentinelOptions: {
          RESP: 3,
          clientSideCache: { ttl: 0, maxEntries: 0, evictPolicy: 'LRU'},
        },
      })

    });
  });
});

[GLOBAL.SENTINEL.OPEN, GLOBAL.SENTINEL.PASSWORD].forEach(testOptions => {
  const passIndex = testOptions.serverArguments.indexOf('--requirepass')+1;
  let password: string | undefined = undefined;
  if (passIndex != 0) {
    password = testOptions.serverArguments[passIndex];
  }

  describe(`test with password - ${password}`, () => {
    testUtils.testWithClientSentinel('client should be authenticated', async sentinel => {
      await assert.doesNotReject(sentinel.set('x', 1));
    }, testOptions);

    testUtils.testWithClientSentinel('try to connect multiple times', async sentinel => {
      await assert.rejects(sentinel.connect());
    }, testOptions);


    testUtils.testWithClientSentinel('should respect type mapping', async sentinel => {
      const typeMapped = sentinel.withTypeMapping({
        [RESP_TYPES.SIMPLE_STRING]: Buffer
      });

      const resp = await typeMapped.ping();
      assert.deepEqual(resp, Buffer.from('PONG'));
    }, testOptions);

    testUtils.testWithClientSentinel('many readers', async sentinel => {
      await sentinel.set("x", 1);
      for (let i = 0; i < 10; i++) {
        if (await sentinel.get("x") == "1") {
          break;
        }
        await setTimeout(1000);
      }

      const promises: Array<Promise<string | null>> = [];
      for (let i = 0; i < 500; i++) {
        promises.push(sentinel.get("x"));
      }

      const resp = await Promise.all(promises);
      assert.equal(resp.length, 500);
      for (let i = 0; i < 500; i++) {
        assert.equal(resp[i], "1", `failed on match at ${i}`);
      }
    }, testOptions);

    testUtils.testWithClientSentinel('use', async sentinel => {
      await sentinel.use(
        async (client: any ) => {
          await assert.doesNotReject(client.get('x'));
        }
      );
    }, testOptions);

    testUtils.testWithClientSentinel('watch does not carry over leases', async sentinel => {
      assert.equal(await sentinel.use(client => client.watch("x")), 'OK')
      assert.equal(await sentinel.use(client => client.set('x', 1)), 'OK');
      assert.deepEqual(await sentinel.use(client => client.multi().get('x').exec()), ['1']);
    }, testOptions);

    testUtils.testWithClientSentinel('plain pubsub - channel', async sentinel => {
      let pubSubResolve;
      const pubSubPromise = new Promise((res) => {
        pubSubResolve = res;
      });

      let tester = false;
      await sentinel.subscribe('test', () => {
        tester = true;
        pubSubResolve(1);
      })

      await sentinel.publish('test', 'hello world');
      await pubSubPromise;
      assert.equal(tester, true);

      // now unsubscribe
      tester = false;
      await sentinel.unsubscribe('test')
      await sentinel.publish('test', 'hello world');
      await setTimeout(1000);

      assert.equal(tester, false);
    }, testOptions);

    testUtils.testWithClientSentinel('plain pubsub - pattern', async sentinel => {
      let pubSubResolve;
      const pubSubPromise = new Promise((res) => {
        pubSubResolve = res;
      });

      let tester = false;
      await sentinel.pSubscribe('test*', () => {
        tester = true;
        pubSubResolve(1);
      })

      await sentinel.publish('testy', 'hello world');
      await pubSubPromise;
      assert.equal(tester, true);

      // now unsubscribe
      tester = false;
      await sentinel.pUnsubscribe('test*');
      await sentinel.publish('testy', 'hello world');
      await setTimeout(1000);

      assert.equal(tester, false);
  }, testOptions)
  });
});

describe(`test with scripts`, () => {
  testUtils.testWithClientSentinel('with script', async sentinel => {
    const [, reply] = await Promise.all([
      sentinel.set('key', '2'),
      sentinel.square('key')
    ]);

    assert.equal(reply, 4);
  }, GLOBAL.SENTINEL.WITH_SCRIPT);

  testUtils.testWithClientSentinel('with script multi', async sentinel => {
    const reply = await sentinel.multi().set('key', 2).square('key').exec();
    assert.deepEqual(reply, ['OK', 4]);
  }, GLOBAL.SENTINEL.WITH_SCRIPT);

  testUtils.testWithClientSentinel('use with script', async sentinel => {
    const reply = await sentinel.use(
      async (client: any) => {
        assert.equal(await client.set('key', '2'), 'OK');
        assert.equal(await client.get('key'), '2');
        return client.square('key')
      }
    );
  }, GLOBAL.SENTINEL.WITH_SCRIPT)
});

describe(`test with functions`, () => {
  testUtils.testWithClientSentinel('with function', async sentinel => {
    await sentinel.functionLoad(
      MATH_FUNCTION.code,
      { REPLACE: true }
    );

    await sentinel.set('key', '2');
    const resp = await sentinel.math.square('key');

    assert.equal(resp, 4);
  }, GLOBAL.SENTINEL.WITH_FUNCTION);

  testUtils.testWithClientSentinel('with function multi', async sentinel => {
    await sentinel.functionLoad(
      MATH_FUNCTION.code,
      { REPLACE: true }
    );

    const reply = await sentinel.multi().set('key', 2).math.square('key').exec();
    assert.deepEqual(reply, ['OK', 4]);
  }, GLOBAL.SENTINEL.WITH_FUNCTION);

  testUtils.testWithClientSentinel('use with function', async sentinel => {
    await sentinel.functionLoad(
      MATH_FUNCTION.code,
      { REPLACE: true }
    );

    const reply = await sentinel.use(
      async (client: any) => {
        await client.set('key', '2');
        return client.math.square('key');
      }
    );

    assert.equal(reply, 4);
  }, GLOBAL.SENTINEL.WITH_FUNCTION);
});

describe(`test with modules`, () => {
  testUtils.testWithClientSentinel('with module', async sentinel => {
    const resp = await sentinel.bf.add('key', 'item')
    assert.equal(resp, true);
  }, GLOBAL.SENTINEL.WITH_MODULE);

  testUtils.testWithClientSentinel('with module multi', async sentinel => {
    const resp = await sentinel.multi().bf.add('key', 'item').exec();
    assert.deepEqual(resp, [true]);
  }, GLOBAL.SENTINEL.WITH_MODULE);

  testUtils.testWithClientSentinel('use with module', async sentinel => {
    const reply = await sentinel.use(
      async (client: any) => {
        return client.bf.add('key', 'item');
      }
    );

    assert.equal(reply, true);
  }, GLOBAL.SENTINEL.WITH_MODULE);
});

describe(`test with replica pool size 1`, () => {
  testUtils.testWithClientSentinel('client lease', async sentinel => {
    sentinel.on("error", () => { });

    const clientLease = await sentinel.acquire();
    clientLease.set('x', 456);

    let matched = false;
    /* waits for replication */
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
  }, GLOBAL.SENTINEL.WITH_REPLICA_POOL_SIZE_1);

  testUtils.testWithClientSentinel('block on pool', async sentinel => {
    const promise = sentinel.use(
      async client => {
        await setTimeout(1000);
        return await client.get("x");
      }
    )

    await sentinel.set("x", 1);
    assert.equal(await promise, null);
  }, GLOBAL.SENTINEL.WITH_REPLICA_POOL_SIZE_1);

  testUtils.testWithClientSentinel('pipeline', async sentinel => {
    const resp = await sentinel.multi().set('x', 1).get('x').execAsPipeline();
    assert.deepEqual(resp, ['OK', '1']);
  }, GLOBAL.SENTINEL.WITH_REPLICA_POOL_SIZE_1);
});

describe(`test with masterPoolSize 2, reserve client true`, () => {
  // TODO: flaky test, sometimes fails with `promise1 === null`
  testUtils.testWithClientSentinel('reserve client, takes a client out of pool', async sentinel => {
    const promise1 = sentinel.use(
      async client => {
        const val = await client.get("x");
        await client.set("x", 2);
        return val;
      }
    )

    const promise2 = sentinel.use(
      async client => {
        return client.get("x");
      }
    )

    await sentinel.set("x", 1);
    assert.equal(await promise1, "1");
    assert.equal(await promise2, "2");
  }, Object.assign(GLOBAL.SENTINEL.WITH_RESERVE_CLIENT_MASTER_POOL_SIZE_2, {skipTest: true}));
});

describe(`test with masterPoolSize 2`, () => {
  testUtils.testWithClientSentinel('multple clients', async sentinel => {
    sentinel.on("error", () => { });

    const promise = sentinel.use(
      async client => {
        await sentinel!.set("x", 1);
        await client.get("x");
      }
    )

    await assert.doesNotReject(promise);
  }, GLOBAL.SENTINEL.WITH_MASTER_POOL_SIZE_2);

  testUtils.testWithClientSentinel('use - watch - clean', async sentinel => {
    let promise = sentinel.use(async (client) => {
      await client.set("x", 1);
      await client.watch("x");
      return client.multi().get("x").exec();
    });

    assert.deepEqual(await promise, ['1']);
  }, GLOBAL.SENTINEL.WITH_MASTER_POOL_SIZE_2);

  testUtils.testWithClientSentinel('use - watch - dirty', async sentinel => {
    let promise = sentinel.use(async (client) => {
      await client.set('x', 1);
      await client.watch('x');
      await sentinel!.set('x', 2);
      return client.multi().get('x').exec();
    });

    await assert.rejects(promise, new WatchError());
  }, GLOBAL.SENTINEL.WITH_MASTER_POOL_SIZE_2);

  testUtils.testWithClientSentinel('lease - watch - clean', async sentinel => {
    const leasedClient = await sentinel.acquire();
    await leasedClient.set('x', 1);
    await leasedClient.watch('x');
    assert.deepEqual(await leasedClient.multi().get('x').exec(), ['1'])
  }, GLOBAL.SENTINEL.WITH_MASTER_POOL_SIZE_2);

  testUtils.testWithClientSentinel('lease - watch - dirty', async sentinel => {
    const leasedClient = await sentinel.acquire();
    await leasedClient.set('x', 1);
    await leasedClient.watch('x');
    await leasedClient.set('x', 2);

    await assert.rejects(leasedClient.multi().get('x').exec(), new WatchError());
  }, GLOBAL.SENTINEL.WITH_MASTER_POOL_SIZE_2);
});

async function steadyState(frame: SentinelFramework) {
  // wait a bit to ensure that sentinels are seeing eachother
  await setTimeout(2000)
  let checkedMaster = false;
  let checkedReplicas = false;
  while (!checkedMaster || !checkedReplicas) {
    if (!checkedMaster) {
      const master = await frame.sentinelMaster();
      if (master?.flags === 'master') {
        checkedMaster = true;
      }
    }
    if (!checkedReplicas) {
      const replicas = (await frame.sentinelReplicas());
      checkedReplicas = true;
      for (const replica of replicas!) {
        checkedReplicas &&= (replica.flags === 'slave');
      }
    }
  }
  let nodeResolve, nodeReject;
  const nodePromise = new Promise((res, rej) => {
    nodeResolve = res;
    nodeReject = rej;
  })
  const seenNodes = new Set<number>();
  let sentinel: RedisSentinelType<RedisModules, RedisFunctions, RedisScripts, RespVersions, TypeMapping> | undefined;
  const tracer = [];
  try {
    sentinel = frame.getSentinelClient({ replicaPoolSize: 1, scanInterval: 2000 }, false)
      .on('topology-change', (event: RedisSentinelEvent) => {
        if (event.type == "MASTER_CHANGE" || event.type == "REPLICA_ADD") {
          seenNodes.add(event.node.port);
          if (seenNodes.size == frame.getAllNodesPort().length) {
            nodeResolve();
          }
        }
      }).on('error', err => { });
    sentinel.setTracer(tracer);
    await sentinel.connect();
    await nodePromise;

    await sentinel.flushAll();
  } finally {
    if (sentinel !== undefined) {
      sentinel.destroy();
    }
  }
}

describe('legacy tests', () => {
  const config: RedisSentinelConfig = { sentinelName: "test", numberOfNodes: 3, password: undefined };
  const frame = new SentinelFramework(config);
  let tracer = new Array<string>();
  let stopMeasuringBlocking = false;
  let longestDelta = 0;
  let longestTestDelta = 0;
  let last: number;


  describe('Sentinel Client', function () {
    let sentinel: RedisSentinelType<RedisModules, RedisFunctions, RedisScripts, RespVersions, TypeMapping> | undefined;

    beforeEach(async function () {
      this.timeout(15000);

      last = Date.now();

      function deltaMeasurer() {
        const delta = Date.now() - last;
        if (delta > longestDelta) {
          longestDelta = delta;
        }
        if (delta > longestTestDelta) {
          longestTestDelta = delta;
        }
        if (!stopMeasuringBlocking) {
          last = Date.now();
          setImmediate(deltaMeasurer);
        }
      }
      setImmediate(deltaMeasurer);
      await frame.spawnRedisSentinel();
      await frame.getAllRunning();
      await steadyState(frame);
      longestTestDelta = 0;
    })

    afterEach(async function () {
      this.timeout(60000);
      // avoid errors in afterEach that end testing
      if (sentinel !== undefined) {
        sentinel.on('error', () => { });
      }

      if (this!.currentTest!.state === 'failed') {
        console.log(`longest event loop blocked delta: ${longestDelta}`);
        console.log(`longest event loop blocked in failing test: ${longestTestDelta}`);
        console.log("trace:");
        for (const line of tracer) {
          console.log(line);
        }
        console.log(`sentinel object state:`)
        console.log(`master: ${JSON.stringify(sentinel?.getMasterNode())}`)
        console.log(`replicas: ${JSON.stringify(sentinel?.getReplicaNodes().entries)}`)
        const results = await Promise.all([
          frame.sentinelSentinels(),
          frame.sentinelMaster(),
          frame.sentinelReplicas()
        ])

        console.log(`sentinel sentinels:\n${JSON.stringify(results[0], undefined, '\t')}`);
        console.log(`sentinel master:\n${JSON.stringify(results[1], undefined, '\t')}`);
        console.log(`sentinel replicas:\n${JSON.stringify(results[2], undefined, '\t')}`);
        const { stdout, stderr } = await execAsync("docker ps -a");
        console.log(`docker stdout:\n${stdout}`);
        const ids = frame.getAllDockerIds();
        console.log("docker logs");
        for (const [id, port] of ids) {
          console.log(`${id}/${port}\n`);
          const { stdout, stderr } = await execAsync(`docker logs ${id}`, {maxBuffer: 8192 * 8192 * 4});
          console.log(stdout);
        }
      }
      tracer.length = 0;

      if (sentinel !== undefined) {
        await sentinel.destroy();
        sentinel = undefined;
      }

      stopMeasuringBlocking = true;

      await frame.cleanup();
    })

    it('use', async function () {
      this.timeout(60000);

      sentinel = frame.getSentinelClient({ replicaPoolSize: 1 });
      sentinel.on("error", () => { });
      await sentinel.connect();

      await sentinel.use(
        async (client: RedisSentinelClientType<RedisModules, RedisFunctions, RedisScripts, RespVersions, TypeMapping>, ) => {
          const masterNode = sentinel!.getMasterNode();
          await frame.stopNode(masterNode!.port.toString());
          await assert.doesNotReject(client.get('x'));
        }
      );
    });

    // stops master to force sentinel to update
    it('stop master', async function () {
      this.timeout(60000);

      sentinel = frame.getSentinelClient();
      sentinel.setTracer(tracer);
      sentinel.on("error", () => { });
      await sentinel.connect();

      tracer.push(`connected`);

      let masterChangeResolve;
      const masterChangePromise = new Promise((res) => {
        masterChangeResolve = res;
      })

      const masterNode = await sentinel.getMasterNode();
      sentinel.on('topology-change', (event: RedisSentinelEvent) => {
        tracer.push(`got topology-change event: ${JSON.stringify(event)}`);
        if (event.type === "MASTER_CHANGE" && event.node.port != masterNode!.port) {
          tracer.push(`got expected master change event`);
          masterChangeResolve(event.node);
        }
      });

      tracer.push(`stopping master node`);
      await frame.stopNode(masterNode!.port.toString());
      tracer.push(`stopped master node`);

      tracer.push(`waiting on master change promise`);
      const newMaster = await masterChangePromise as RedisNode;
      tracer.push(`got new master node of ${newMaster.port}`);
      assert.notEqual(masterNode!.port, newMaster.port);
    });

    // if master changes, client should make sure user knows watches are invalid
    it('watch across master change', async function () {
      this.timeout(60000);

      sentinel = frame.getSentinelClient({ masterPoolSize: 2 });
      sentinel.setTracer(tracer);
      sentinel.on("error", () => { });
      await sentinel.connect();

      tracer.push("connected");

      const client = await sentinel.acquire();
      tracer.push("acquired lease");

      await client.set("x", 1);
      await client.watch("x");

      tracer.push("did a watch on lease");

      let resolve;
      const promise = new Promise((res) => {
        resolve = res;
      })

      const masterNode = sentinel.getMasterNode();
      tracer.push(`got masterPort as ${masterNode!.port}`);

      sentinel.on('topology-change', (event: RedisSentinelEvent) => {
        tracer.push(`got topology-change event: ${JSON.stringify(event)}`);
        if (event.type === "MASTER_CHANGE" && event.node.port != masterNode!.port) {
          tracer.push("resolving promise");
          resolve(event.node);
        }
      });

      tracer.push("stopping master node");
      await frame.stopNode(masterNode!.port.toString());
      tracer.push("stopped master node and waiting on promise");

      const newMaster = await promise as RedisNode;
      tracer.push(`promise returned, newMaster = ${JSON.stringify(newMaster)}`);
      assert.notEqual(masterNode!.port, newMaster.port);
      tracer.push(`newMaster does not equal old master`);

      tracer.push(`waiting to assert that a multi/exec now fails`);
      await assert.rejects(async () => { await client.multi().get("x").exec() }, new Error("sentinel config changed in middle of a WATCH Transaction"));
      tracer.push(`asserted that a multi/exec now fails`);
    });

    // same as above, but set a watch before and after master change, shouldn't change the fact that watches are invalid
    it('watch before and after master change', async function () {
      this.timeout(60000);

      sentinel = frame.getSentinelClient({ masterPoolSize: 2 });
      sentinel.setTracer(tracer);
      sentinel.on("error", () => { });
      await sentinel.connect();
      tracer.push("connected");

      const client = await sentinel.acquire();
      tracer.push("got leased client");
      await client.set("x", 1);
      await client.watch("x");

      tracer.push("set and watched x");

      let resolve;
      const promise = new Promise((res) => {
        resolve = res;
      })

      const masterNode = sentinel.getMasterNode();
      tracer.push(`initial masterPort = ${masterNode!.port} `);

      sentinel.on('topology-change', (event: RedisSentinelEvent) => {
        tracer.push(`got topology-change event: ${JSON.stringify(event)}`);
        if (event.type === "MASTER_CHANGE" && event.node.port != masterNode!.port) {
          tracer.push("got a master change event that is not the same as before");
          resolve(event.node);
        }
      });

      tracer.push("stopping master");
      await frame.stopNode(masterNode!.port.toString());
      tracer.push("stopped master");

      tracer.push("waiting on master change promise");
      const newMaster = await promise as RedisNode;
      tracer.push(`got master change port as ${newMaster.port}`);
      assert.notEqual(masterNode!.port, newMaster.port);

      tracer.push("watching again, shouldn't matter");
      await client.watch("y");

      tracer.push("expecting multi to be rejected");
      await assert.rejects(async () => { await client.multi().get("x").exec() }, new Error("sentinel config changed in middle of a WATCH Transaction"));
      tracer.push("multi was rejected");
    });


    // pubsub continues to work, even with a master change
    it('pubsub - channel - with master change', async function () {
      this.timeout(60000);

      sentinel = frame.getSentinelClient();
      sentinel.setTracer(tracer);
      sentinel.on("error", () => { });
      await sentinel.connect();
      tracer.push(`connected`);

      let pubSubResolve;
      const pubSubPromise = new Promise((res) => {
        pubSubResolve = res;
      })

      let tester = false;
      await sentinel.subscribe('test', () => {
        tracer.push(`got pubsub message`);
        tester = true;
        pubSubResolve(1);
      })

      let masterChangeResolve;
      const masterChangePromise = new Promise((res) => {
        masterChangeResolve = res;
      })

      const masterNode = sentinel.getMasterNode();
      tracer.push(`got masterPort as ${masterNode!.port}`);

      sentinel.on('topology-change', (event: RedisSentinelEvent) => {
        tracer.push(`got topology-change event: ${JSON.stringify(event)}`);
        if (event.type === "MASTER_CHANGE" && event.node.port != masterNode!.port) {
          tracer.push("got a master change event that is not the same as before");
          masterChangeResolve(event.node);
        }
      });

      tracer.push("stopping master");
      await frame.stopNode(masterNode!.port.toString());
      tracer.push("stopped master and waiting on change promise");

      const newMaster = await masterChangePromise as RedisNode;
      tracer.push(`got master change port as ${newMaster.port}`);
      assert.notEqual(masterNode!.port, newMaster.port);

      tracer.push(`publishing pubsub message`);
      await sentinel.publish('test', 'hello world');
      tracer.push(`published pubsub message and waiting pn pubsub promise`);
      await pubSubPromise;
      tracer.push(`got pubsub promise`);

      assert.equal(tester, true);

      // now unsubscribe
      tester = false
      await sentinel.unsubscribe('test')
      await sentinel.publish('test', 'hello world');
      await setTimeout(1000);

      assert.equal(tester, false);
    });

    it('pubsub - pattern - with master change', async function () {
      this.timeout(60000);

      sentinel = frame.getSentinelClient();
      sentinel.setTracer(tracer);
      sentinel.on("error", () => { });
      await sentinel.connect();
      tracer.push(`connected`);

      let pubSubResolve;
      const pubSubPromise = new Promise((res) => {
        pubSubResolve = res;
      })

      let tester = false;
      await sentinel.pSubscribe('test*', () => {
        tracer.push(`got pubsub message`);
        tester = true;
        pubSubResolve(1);
      })

      let masterChangeResolve;
      const masterChangePromise = new Promise((res) => {
        masterChangeResolve = res;
      })

      const masterNode = sentinel.getMasterNode();
      tracer.push(`got masterPort as ${masterNode!.port}`);

      sentinel.on('topology-change', (event: RedisSentinelEvent) => {
        tracer.push(`got topology-change event: ${JSON.stringify(event)}`);
        if (event.type === "MASTER_CHANGE" && event.node.port != masterNode!.port) {
          tracer.push("got a master change event that is not the same as before");
          masterChangeResolve(event.node);
        }
      });

      tracer.push("stopping master");
      await frame.stopNode(masterNode!.port.toString());
      tracer.push("stopped master and waiting on master change promise");

      const newMaster = await masterChangePromise as RedisNode;
      tracer.push(`got master change port as ${newMaster.port}`);
      assert.notEqual(masterNode!.port, newMaster.port);

      tracer.push(`publishing pubsub message`);
      await sentinel.publish('testy', 'hello world');
      tracer.push(`published pubsub message and waiting on pubsub promise`);
      await pubSubPromise;
      tracer.push(`got pubsub promise`);
      assert.equal(tester, true);

      // now unsubscribe
      tester = false
      await sentinel.pUnsubscribe('test*');
      await sentinel.publish('testy', 'hello world');
      await setTimeout(1000);

      assert.equal(tester, false);
    });

    // if we stop a node, the comand should "retry" until we reconfigure topology and execute on new topology
    it('command immeaditely after stopping master', async function () {
      this.timeout(60000);

      sentinel = frame.getSentinelClient();
      sentinel.setTracer(tracer);
      sentinel.on("error", () => { });
      await sentinel.connect();

      tracer.push("connected");

      let masterChangeResolve;
      const masterChangePromise = new Promise((res) => {
        masterChangeResolve = res;
      })

      const masterNode = sentinel.getMasterNode();
      tracer.push(`original master port = ${masterNode!.port}`);

      let changeCount = 0;
      sentinel.on('topology-change', (event: RedisSentinelEvent) => {
        tracer.push(`got topology-change event: ${JSON.stringify(event)}`);
        if (event.type === "MASTER_CHANGE" && event.node.port != masterNode!.port) {
          changeCount++;
          tracer.push(`got topology-change event we expected`);
          masterChangeResolve(event.node);
        }
      });

      tracer.push(`stopping masterNode`);
      await frame.stopNode(masterNode!.port.toString());
      tracer.push(`stopped masterNode`);
      assert.equal(await sentinel.set('x', 123), 'OK');
      tracer.push(`did the set operation`);
      const presumamblyNewMaster = sentinel.getMasterNode();
      tracer.push(`new master node seems to be ${presumamblyNewMaster?.port} and waiting on master change promise`);

      const newMaster = await masterChangePromise as RedisNode;
      tracer.push(`got new masternode event saying master is at ${newMaster.port}`);
      assert.notEqual(masterNode!.port, newMaster.port);

      tracer.push(`doing the get`);
      const val = await sentinel.get('x');
      tracer.push(`did the get and got ${val}`);
      const newestMaster = sentinel.getMasterNode()
      tracer.push(`after get, we see master as ${newestMaster?.port}`);

      switch (changeCount) {
        case 1:
          // if we only changed masters once, we should have the proper value
          assert.equal(val, '123');
          break;
        case 2:
          // we changed masters twice quickly, so probably didn't replicate
          // therefore, this is soewhat flakey, but the above is the common case
          assert(val == '123' || val == null);
          break;
        default:
          assert(false, "unexpected case");
      }
    });

    it('shutdown sentinel node', async function () {
      this.timeout(60000);
      sentinel = frame.getSentinelClient();
      sentinel.setTracer(tracer);
      sentinel.on("error", () => { });
      await sentinel.connect();
      tracer.push("connected");

      let sentinelChangeResolve;
      const sentinelChangePromise = new Promise((res) => {
        sentinelChangeResolve = res;
      })

      const sentinelNode = sentinel.getSentinelNode();
      tracer.push(`sentinelNode = ${sentinelNode?.port}`)

      sentinel.on('topology-change', (event: RedisSentinelEvent) => {
        tracer.push(`got topology-change event: ${JSON.stringify(event)}`);
        if (event.type === "SENTINEL_CHANGE") {
          tracer.push("got sentinel change event");
          sentinelChangeResolve(event.node);
        }
      });

      tracer.push("Stopping sentinel node");
      await frame.stopSentinel(sentinelNode!.port.toString());
      tracer.push("Stopped sentinel node and waiting on sentinel change promise");
      const newSentinel = await sentinelChangePromise as RedisNode;
      tracer.push("got sentinel change promise");
      assert.notEqual(sentinelNode!.port, newSentinel.port);
    });

    it('timer works, and updates sentinel list', async function () {
      this.timeout(60000);

      sentinel = frame.getSentinelClient({ scanInterval: 1000 });
      sentinel.setTracer(tracer);
      await sentinel.connect();
      tracer.push("connected");

      let sentinelChangeResolve;
      const sentinelChangePromise = new Promise((res) => {
        sentinelChangeResolve = res;
      })

      sentinel.on('topology-change', (event: RedisSentinelEvent) => {
        tracer.push(`got topology-change event: ${JSON.stringify(event)}`);
        if (event.type === "SENTINE_LIST_CHANGE" && event.size == 4) {
          tracer.push(`got sentinel list change event with right size`);
          sentinelChangeResolve(event.size);
        }
      });

      tracer.push(`adding sentinel`);
      await frame.addSentinel();
      tracer.push(`added sentinel and waiting on sentinel change promise`);
      const newSentinelSize = await sentinelChangePromise as number;

      assert.equal(newSentinelSize, 4);
    });

    it('stop replica, bring back replica', async function () {
      this.timeout(60000);

      sentinel = frame.getSentinelClient({ replicaPoolSize: 1 });
      sentinel.setTracer(tracer);
      sentinel.on('error', err => { });
      await sentinel.connect();
      tracer.push("connected");

      let sentinelRemoveResolve;
      const sentinelRemovePromise = new Promise((res) => {
        sentinelRemoveResolve = res;
      })

      const replicaPort = await frame.getRandonNonMasterNode();

      sentinel.on('topology-change', (event: RedisSentinelEvent) => {
        tracer.push(`got topology-change event: ${JSON.stringify(event)}`);
        if (event.type === "REPLICA_REMOVE") {
          if (event.node.port.toString() == replicaPort) {
            tracer.push("got expected replica removed event");
            sentinelRemoveResolve(event.node);
          } else {
            tracer.push(`got replica removed event for a different node: ${event.node.port}`);
          }
        }
      });

      tracer.push(`replicaPort = ${replicaPort} and stopping it`);
      await frame.stopNode(replicaPort);
      tracer.push("stopped replica and waiting on sentinel removed promise");
      const stoppedNode = await sentinelRemovePromise as RedisNode;
      tracer.push("got removed promise");
      assert.equal(stoppedNode.port, Number(replicaPort));

      let sentinelRestartedResolve;
      const sentinelRestartedPromise = new Promise((res) => {
        sentinelRestartedResolve = res;
      })

      sentinel.on('topology-change', (event: RedisSentinelEvent) => {
        tracer.push(`got topology-change event: ${JSON.stringify(event)}`);
        if (event.type === "REPLICA_ADD") {
          tracer.push("got replica added event");
          sentinelRestartedResolve(event.node);
        }
      });

      tracer.push("restarting replica");
      await frame.restartNode(replicaPort);
      tracer.push("restarted replica and waiting on restart promise");
      const restartedNode = await sentinelRestartedPromise as RedisNode;
      tracer.push("got restarted promise");
      assert.equal(restartedNode.port, Number(replicaPort));
    })

    it('add a node / new replica', async function () {
      this.timeout(60000);

      sentinel = frame.getSentinelClient({ scanInterval: 2000, replicaPoolSize: 1 });
      sentinel.setTracer(tracer);
      // need to handle errors, as the spawning a new docker node can cause existing connections to time out
      sentinel.on('error', err => { });
      await sentinel.connect();
      tracer.push("connected");

      let nodeAddedResolve: (value: RedisNode) => void;
      const nodeAddedPromise = new Promise((res) => {
        nodeAddedResolve = res as (value: RedisNode) => void;
      });

      const portSet = new Set<number>();
      for (const port of frame.getAllNodesPort()) {
        portSet.add(port);
      }

      // "on" and not "once" as due to connection timeouts, can happen multiple times, and want right one
      sentinel.on('topology-change', (event: RedisSentinelEvent) => {
        tracer.push(`got topology-change event: ${JSON.stringify(event)}`);
        if (event.type === "REPLICA_ADD") {
          if (!portSet.has(event.node.port)) {
            tracer.push("got expected replica added event");
            nodeAddedResolve(event.node);
          }
        }
      });

      tracer.push("adding node");
      await frame.addNode();
      tracer.push("added node and waiting on added promise");
      await nodeAddedPromise;
    })

    it('with client side caching', async function() {
      this.timeout(30000);
      const csc = new BasicPooledClientSideCache();

      sentinel = frame.getSentinelClient({nodeClientOptions: {RESP: 3 as const}, RESP: 3 as const, clientSideCache: csc, masterPoolSize: 5});
      await sentinel.connect();

      await sentinel.set('x', 1);
      await sentinel.get('x');
      await sentinel.get('x');
      await sentinel.get('x');
      await sentinel.get('x');

      assert.equal(1, csc.stats().missCount);
      assert.equal(3, csc.stats().hitCount);

      const invalidatePromise = once(csc, 'invalidate');
      await sentinel.set('x', 2);
      await invalidatePromise;
      await sentinel.get('x');
      await sentinel.get('x');
      await sentinel.get('x');
      await sentinel.get('x');

      assert.equal(csc.stats().missCount, 2);
      assert.equal(csc.stats().hitCount, 6);
    })
  });
});
