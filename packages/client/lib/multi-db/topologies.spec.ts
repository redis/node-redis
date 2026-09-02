import { strict as assert } from 'node:assert';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { spawnRedisCluster } from '../../../test-utils/lib/dockers';
import type { RedisServerDocker } from '@redis/test-utils';
import { createMultiDbCluster, createMultiDbSentinel } from '.';
import type { MultiDbController } from './controller';
import type { AnyRedisClientType } from '.';
import { SentinelFramework } from '../sentinel/test-util';

const execFileAsync = promisify(execFile);

const DOCKER_IMAGE = {
  image: 'redislabs/client-libs-test',
  version: 'custom-30445126297-debian',
  mode: 'server' as const
};

// count-only detection, as in failover.spec.ts: pre-failure successes in the
// window must not dilute a rate threshold
const FAST_FAILOVER = {
  failureDetector: { minNumOfFailures: 3, failureRateThreshold: 0, windowSize: 10_000 },
  healthCheck: { interval: 3000, timeout: 1000, numProbes: 1, delayBetweenProbes: 0 },
  maxFailoverAttempts: 2,
  delayBetweenFailoverAttempts: 200
};

function kill(dockerId: string) {
  return execFileAsync('docker', ['kill', dockerId]);
}

function once<T>(controller: MultiDbController<AnyRedisClientType>, event: string, timeoutMs = 20_000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`timed out waiting for '${event}' after ${timeoutMs}ms`)),
      timeoutMs
    );
    (controller as { once(event: string, listener: (payload: T) => void): void }).once(event, payload => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

/** issue a command every `intervalMs`, collecting outcomes without ever throwing */
function startTraffic(run: () => Promise<unknown>, intervalMs = 50) {
  const errors: Array<Error> = [];
  let successes = 0;
  const timer = setInterval(() => {
    try {
      run().then(
        () => successes++,
        (err: Error) => errors.push(err)
      );
    } catch (err) {
      errors.push(err as Error);
    }
  }, intervalMs);
  return { errors, successes: () => successes, stop: () => clearInterval(timer) };
}

describe('multi-db topologies', function () {
  this.timeout(120_000);

  describe('cluster members', () => {
    let clusterA: Array<RedisServerDocker>;
    let clusterB: Array<RedisServerDocker>;

    const memberOf = (cluster: Array<RedisServerDocker>) => ({
      options: {
        rootNodes: cluster.map(({ port }) => ({ socket: { host: '127.0.0.1', port } }))
      }
    });

    before(async function () {
      this.timeout(240_000);
      // distinct serverArguments identities → two independent clusters
      [clusterA, clusterB] = await Promise.all([
        spawnRedisCluster({ ...DOCKER_IMAGE, numberOfMasters: 3 }, []),
        spawnRedisCluster({ ...DOCKER_IMAGE, numberOfMasters: 3 }, [])
      ]);
    });

    // no after() here: spawnRedisCluster registers the containers for the
    // docker harness's global cleanup — removing them twice fails the run

    it('fails over from one cluster to the other when the whole cluster dies', async () => {
      const { client, controller } = createMultiDbCluster({
        ...FAST_FAILOVER,
        databases: [memberOf(clusterA), memberOf(clusterB)]
      });
      await client.connect();
      controller.on('error', () => {
        // the dying cluster's teardown noise is not what this test asserts
      });
      const traffic = startTraffic(() => client.incr('counter'));
      try {
        assert.equal(controller.getActiveDatabase().id, 'db-0');

        const failover = once<{ from: string; to: string; reason: string }>(controller, 'failover');
        await Promise.all(clusterA.map(({ dockerId }) => kill(dockerId)));
        assert.deepEqual(await failover, { from: 'db-0', to: 'db-1', reason: 'failure-detector' });

        await client.set('after-failover', 'served');
        assert.equal(await client.get('after-failover'), 'served');
      } finally {
        traffic.stop();
        client.destroy();
      }
    });
  });

  describe('sentinel members', () => {
    const frameA = new SentinelFramework({ sentinelName: 'mymaster' });
    const frameB = new SentinelFramework({ sentinelName: 'mymaster' });

    const memberOf = (frame: SentinelFramework) => ({
      options: {
        name: 'mymaster',
        sentinelRootNodes: frame.getAllSentinelsPort().map(port => ({ host: '127.0.0.1', port }))
      }
    });

    before(async function () {
      this.timeout(240_000);
      await Promise.all([frameA.spawnRedisSentinel(), frameB.spawnRedisSentinel()]);
      await Promise.all([frameA.getAllRunning(), frameB.getAllRunning()]);
    });

    after(async function () {
      this.timeout(120_000);
      await Promise.all([frameA.cleanup(), frameB.cleanup()]);
    });

    it("the sentinel's own master change does not fail the member over", async () => {
      const { client, controller } = createMultiDbSentinel({
        // default detector thresholds: the promotion blip must stay under them
        healthCheck: FAST_FAILOVER.healthCheck,
        databases: [memberOf(frameA), memberOf(frameB)]
      });
      await client.connect();
      controller.on('error', () => {
        // node errors during the sentinel-internal promotion are expected
      });
      const failovers: Array<unknown> = [];
      controller.on('failover', event => {
        failovers.push(event);
      });
      const traffic = startTraffic(() => client.incr('counter'));
      try {
        const masterPort = await frameA.getMasterPort();
        await frameA.stopNode(masterPort.toString());

        // sentinel promotion (down-after 500ms + failover) completes well within this window
        await new Promise(resolve => setTimeout(resolve, 8000));

        assert.deepEqual(failovers, [], 'a sentinel-internal master change must not trip the member circuit');
        assert.equal(controller.getActiveDatabase().id, 'db-0');

        // traffic must flow again on the SAME member after the promotion
        const before = traffic.successes();
        await new Promise(resolve => setTimeout(resolve, 1000));
        assert.ok(traffic.successes() > before, 'traffic must resume on the promoted master');
      } finally {
        traffic.stop();
        client.destroy();
      }
    });

    it('fails over to the other deployment when the whole deployment dies', async () => {
      const { client, controller } = createMultiDbSentinel({
        ...FAST_FAILOVER,
        databases: [memberOf(frameA), memberOf(frameB)]
      });
      await client.connect();
      controller.on('error', () => {
        // the dying deployment's teardown noise is not what this test asserts
      });
      const traffic = startTraffic(() => client.incr('counter'));
      try {
        assert.equal(controller.getActiveDatabase().id, 'db-0');

        const failover = once<{ from: string; to: string; reason: string }>(controller, 'failover');
        // killing every data node leaves the deployment without a servable
        // master; one node may already be down from the previous test
        await Promise.all([...frameA.getAllDockerIds().keys()].map(id => kill(id).catch(() => {})));
        assert.deepEqual(await failover, { from: 'db-0', to: 'db-1', reason: 'failure-detector' });

        await client.set('after-failover', 'served');
        assert.equal(await client.get('after-failover'), 'served');
      } finally {
        traffic.stop();
        client.destroy();
      }
    });
  });
});
