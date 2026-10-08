/**
 * Multi-db failover against Redis Enterprise, driven by the fault injector's
 * multi-db-failover action. For each member topology the fault injector creates
 * one member per cluster; the test takes the active member offline, expects a
 * failover to the other member, restores it and expects a fallback.
 *
 * Run:
 *   RE_FAULT_INJECTOR_URL=http://localhost:20324 npx mocha -t 1000000 -r tsx \
 *     packages/client/lib/tests/test-scenario/multi-db-failover.e2e.ts
 *
 * MULTI_DB_TOPOLOGY=standalone,oss-cluster,active-active limits the topologies.
 *
 * The after() hook always tears the setup down. If a run is cut short, tear
 * down by hand with the setup id from the log:
 *   curl -X POST "$RE_FAULT_INJECTOR_URL/multi-db-failover/teardown?setup_id=<id>&clean_iptables=true"
 */
import assert from "node:assert";
import { setTimeout } from "node:timers/promises";
import {
  FaultInjectorClient,
  MultiDbInstance,
  MultiDbSetup,
  MultiDbTopology,
} from "@redis/test-utils/lib/fault-injector";
import RedisClient from "../../client";
import RedisCluster from "../../cluster";
import {
  createMultiDbClient,
  createMultiDbCluster,
  type DatabaseDescriptor,
  type MultiDbClientEvents,
  type MultiDbConfig,
  type MultiDbEventEmitter,
} from "../../multi-db";

const ALL_TOPOLOGIES: MultiDbTopology[] = ["standalone", "oss-cluster", "active-active"];

const TOPOLOGIES = process.env.MULTI_DB_TOPOLOGY
  ? (process.env.MULTI_DB_TOPOLOGY.split(",").map(t => t.trim()) as MultiDbTopology[])
  : ALL_TOPOLOGIES;

for (const topology of TOPOLOGIES) {
  assert.ok(ALL_TOPOLOGIES.includes(topology), `Unknown MULTI_DB_TOPOLOGY entry "${topology}"`);
}

const SETUP_TIMEOUT_MS = 20 * 60 * 1000;
const FAILOVER_TIMEOUT_MS = 60_000;
const RECOVERY_TIMEOUT_MS = 120_000;
const TRAFFIC_TIMEOUT_MS = 15_000;

// Fast enough to switch within seconds of the outage, slow enough to tolerate
// the round trip to the clusters.
const MULTI_DB_CONFIG = {
  healthCheck: { interval: 2000, timeout: 1000, numProbes: 1, delayBetweenProbes: 0 },
  failureDetector: { minNumOfFailures: 3, failureRateThreshold: 0, windowSize: 5000 },
  gracePeriod: 5000,
  autoFallbackInterval: 2000,
  maxFailoverAttempts: 30,
  delayBetweenFailoverAttempts: 1000,
  initialAvailability: "ALL",
} as const satisfies MultiDbConfig;

const PRIMARY = "member-0";
const SECONDARY = "member-1";

const log = (...args: unknown[]) => {
  console.log(new Date().toISOString().slice(11, 23), "[multi-db]", ...args);
};

interface MultiDbHandle {
  client: MultiDbEventEmitter & {
    connect(): Promise<unknown>;
    set(key: string, value: string): Promise<unknown>;
    destroy(): unknown;
  };
  controller: {
    getActiveDatabase(): DatabaseDescriptor;
    getDatabases(): ReadonlyArray<DatabaseDescriptor>;
  };
}

interface DirectClient {
  connect(): Promise<unknown>;
  get(key: string): Promise<unknown>;
  destroy(): unknown;
}

function connectionOf(instance: MultiDbInstance) {
  const endpoint = instance.raw_endpoints[0];
  assert.ok(endpoint, `bdb ${instance.bdb_id} has no endpoints`);
  return {
    socket: {
      host: endpoint.dns_name,
      port: endpoint.port,
      ...(instance.tls ? { tls: true as const } : {}),
    },
    username: instance.username,
    password: instance.password,
  };
}

function createMultiDb(topology: MultiDbTopology, setup: MultiDbSetup): MultiDbHandle {
  const [primary, secondary] = setup.instances;

  if (topology === "oss-cluster") {
    const memberOf = (instance: MultiDbInstance) => {
      const { socket, username, password } = connectionOf(instance);
      return {
        rootNodes: [{ socket }],
        defaults: { username, password, ...(instance.tls ? { socket: { tls: true as const } } : {}) },
      };
    };
    return createMultiDbCluster({
      ...MULTI_DB_CONFIG,
      databases: [
        { id: PRIMARY, weight: 1, options: memberOf(primary) },
        { id: SECONDARY, weight: 0.5, options: memberOf(secondary) },
      ],
    });
  }

  return createMultiDbClient({
    ...MULTI_DB_CONFIG,
    databases: [
      { id: PRIMARY, weight: 1, options: connectionOf(primary) },
      { id: SECONDARY, weight: 0.5, options: connectionOf(secondary) },
    ],
  });
}

function createDirect(topology: MultiDbTopology, instance: MultiDbInstance): DirectClient {
  const { socket, username, password } = connectionOf(instance);
  if (topology === "oss-cluster") {
    return RedisCluster.create({
      rootNodes: [{ socket }],
      defaults: { username, password, ...(instance.tls ? { socket: { tls: true as const } } : {}) },
    });
  }
  return RedisClient.create({ socket, username, password });
}

interface CapturedEvent<E extends keyof MultiDbClientEvents> {
  args: MultiDbClientEvents[E];
  /** When the event fired, not when the test read it. */
  at: number;
}

/**
 * Starts listening at once, so an event that fires during a blocking fault
 * injector call is not missed. The timeout starts only when the returned
 * function is called.
 */
function captureEvent<E extends keyof MultiDbClientEvents>(
  emitter: MultiDbEventEmitter,
  event: E,
  predicate: (...args: MultiDbClientEvents[E]) => boolean = () => true
): (timeoutMs: number) => Promise<CapturedEvent<E>> {
  let captured: CapturedEvent<E> | undefined;
  let notify: ((captured: CapturedEvent<E>) => void) | undefined;
  const listener = (...args: MultiDbClientEvents[E]) => {
    if (!predicate(...args)) return;
    emitter.off(event, listener);
    captured = { args, at: Date.now() };
    notify?.(captured);
  };
  emitter.on(event, listener);

  return timeoutMs => {
    if (captured) return Promise.resolve(captured);
    return new Promise((resolve, reject) => {
      const timer = globalThis.setTimeout(() => {
        emitter.off(event, listener);
        reject(new Error(`Timed out after ${timeoutMs}ms waiting for "${event}"`));
      }, timeoutMs);
      notify = captured => {
        globalThis.clearTimeout(timer);
        resolve(captured);
      };
    });
  };
}

async function waitFor(condition: () => boolean, timeoutMs: number, what: string) {
  const deadline = Date.now() + timeoutMs;
  while (!condition()) {
    if (Date.now() > deadline) throw new Error(`Timed out after ${timeoutMs}ms waiting for ${what}`);
    await setTimeout(100);
  }
}

/**
 * Fires a SET every `intervalMs` without waiting for the previous one, so a
 * command stuck on a dead socket cannot stall the traffic.
 */
function startTraffic(client: MultiDbHandle["client"], intervalMs = 100) {
  const results: Array<{ sentAt: number; ok: boolean; error?: unknown }> = [];
  let seq = 0;
  const timer = setInterval(() => {
    const sentAt = Date.now();
    client.set("{mdb}traffic", String(seq++)).then(
      () => results.push({ sentAt, ok: true }),
      error => results.push({ sentAt, ok: false, error })
    );
  }, intervalMs);

  return {
    succeededSince: (since: number) => results.some(r => r.ok && r.sentAt >= since),
    summary: () => ({
      sent: seq,
      succeeded: results.filter(r => r.ok).length,
      failed: results.filter(r => !r.ok).length,
    }),
    stop: () => clearInterval(timer),
  };
}

for (const topology of TOPOLOGIES) {
  describe(`Multi-db failover - ${topology}`, () => {
    let faultInjector: FaultInjectorClient;
    let setup: MultiDbSetup | undefined;
    let multiDb: MultiDbHandle | undefined;
    let direct: DirectClient | undefined;
    let traffic: ReturnType<typeof startTraffic> | undefined;

    before(async function () {
      this.timeout(SETUP_TIMEOUT_MS);
      const faultInjectorUrl = process.env.RE_FAULT_INJECTOR_URL;
      if (!faultInjectorUrl) {
        throw new Error("RE_FAULT_INJECTOR_URL environment variable must be set");
      }
      faultInjector = new FaultInjectorClient(faultInjectorUrl);
      setup = await faultInjector.multiDbSetup(topology);
      assert.ok(setup.instances.length >= 2, `expected 2 members, got ${setup.instances.length}`);
    });

    after(async function () {
      this.timeout(SETUP_TIMEOUT_MS);
      traffic?.stop();
      await Promise.allSettled([multiDb?.client.destroy(), direct?.destroy()]);
      if (!setup) {
        log("setup did not complete; nothing to tear down");
        return;
      }
      await faultInjector.multiDbTeardown(setup.setup_id);
    });

    it("fails over when the active member goes offline and falls back after restore", async function () {
      this.timeout(SETUP_TIMEOUT_MS);
      assert.ok(setup);
      const { setup_id: setupId } = setup;

      multiDb = createMultiDb(topology, setup);
      const { client, controller } = multiDb;
      client.on("error", err => log("error:", err));
      client.on("member-error", ({ id, error }) => log("member-error:", id, error.message));
      client.on("database-unhealthy", ({ id, cause }) => log("database-unhealthy:", id, cause.message));
      client.on("database-recovered", ({ id }) => log("database-recovered:", id));
      client.on("failover", event => log("failover:", event));
      client.on("fallback", event => log("fallback:", event));

      await client.connect();
      assert.equal(controller.getActiveDatabase().id, PRIMARY);

      traffic = startTraffic(client);
      await waitFor(() => traffic!.succeededSince(0), TRAFFIC_TIMEOUT_MS, "initial traffic");

      // Outage of the active member
      const failover = captureEvent(client, "failover");
      const outageAt = Date.now();
      await faultInjector.multiDbTakeOffline(setupId, 0);
      log("member offline after", Date.now() - outageAt, "ms");

      const {
        args: [{ from, to, reason }],
        at: failoverAt,
      } = await failover(FAILOVER_TIMEOUT_MS);
      log("failover after", failoverAt - outageAt, "ms; traffic:", traffic.summary());
      assert.equal(from, PRIMARY);
      assert.equal(to, SECONDARY);
      assert.ok(
        ["health-check", "failure-detector", "connection-ended"].includes(reason),
        `unexpected failover reason "${reason}"`
      );
      assert.equal(controller.getActiveDatabase().id, SECONDARY);
      assert.notEqual(controller.getDatabases()[0].circuitState, "CLOSED");

      await waitFor(() => traffic!.succeededSince(failoverAt), TRAFFIC_TIMEOUT_MS, "traffic after failover");

      // The secondary serves the writes
      const marker = `after-failover-${Date.now()}`;
      await client.set("{mdb}marker", marker);
      direct = createDirect(topology, setup.instances[1]);
      await direct.connect();
      assert.equal(await direct.get("{mdb}marker"), marker);

      // Restore and fall back
      const recovered = captureEvent(client, "database-recovered", ({ id }) => id === PRIMARY);
      const fallback = captureEvent(client, "fallback");
      const restoreAt = Date.now();
      await faultInjector.multiDbRestore(setupId, 0);
      log("member restored after", Date.now() - restoreAt, "ms");

      const { at: recoveredAt } = await recovered(RECOVERY_TIMEOUT_MS);
      const {
        args: [fallbackEvent],
        at: fallbackAt,
      } = await fallback(RECOVERY_TIMEOUT_MS);
      log(
        "recovered after", recoveredAt - restoreAt, "ms; fallback after", fallbackAt - restoreAt,
        "ms; traffic:", traffic.summary()
      );
      assert.deepEqual(fallbackEvent, { from: SECONDARY, to: PRIMARY });
      assert.equal(controller.getActiveDatabase().id, PRIMARY);

      await waitFor(() => traffic!.succeededSince(fallbackAt), TRAFFIC_TIMEOUT_MS, "traffic after fallback");
      traffic.stop();
      log("final traffic:", traffic.summary());
    });
  });
}
