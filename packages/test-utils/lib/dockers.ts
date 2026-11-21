import { RedisClusterClientOptions } from '@redis/client/dist/lib/cluster';
import { randomUUID } from 'node:crypto';
import { createConnection } from 'node:net';
import { once } from 'node:events';
import { createClient } from '@redis/client/index';
import { mapLikeToObject } from '@redis/client/dist/lib/commands/reply-utils';
import { setTimeout } from 'node:timers/promises';
// import { ClusterSlotsReply } from '@redis/client/dist/lib/commands/CLUSTER_SLOTS';
import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import assert from 'node:assert';

const execAsync = promisify(execFileCallback);

interface ErrorWithCode extends Error {
  code: string;
}

async function isPortAvailable(port: number): Promise<boolean> {
  try {
    const socket = createConnection({ port });
    await once(socket, 'connect');
    socket.end();
  } catch (err) {
    if (err instanceof Error && (err as ErrorWithCode).code === 'ECONNREFUSED') {
      return true;
    }
  }

  return false;
}

const portIterator = (async function* (): AsyncIterableIterator<number> {
  for (let i = 6379; i < 65535; i++) {
    if (await isPortAvailable(i)) {
      yield i;
    }
  }

  throw new Error('All ports are in use');
})();

interface RedisServerDockerConfig {
  image: string;
  version: string;
}

interface SentinelConfig {
  mode: "sentinel";
  mounts: Array<string>;
  port: number;
}

interface ServerConfig {
  mode: "server";
}

export type RedisServerDockerOptions = RedisServerDockerConfig & (SentinelConfig | ServerConfig)

export interface RedisServerDocker {
  port: number;
  dockerId: string;
}

export interface TlsCertificates {
  ca: Buffer;
  cert: Buffer;
  key: Buffer;
}

export interface TlsRedisServerDocker extends RedisServerDocker {
  /** The TLS port */
  tlsPort: number;
  /** TLS certificates for client connection */
  certs: TlsCertificates;
}

export interface TlsConfig {
  /**
   * If provided, enables client certificate CN-based authentication.
   * Sets TLS_CLIENT_CNS env var and uses this CN for the client certificate.
   * If not provided, uses the default 'client' certificate without CN-based auth.
   */
  clientCertCN?: string;
}

/**
 * Default certificate name used for client authentication
 */
const DEFAULT_CLIENT_CERT_NAME = "client";

/**
 * Default path where TLS certificates are stored in the Docker container
 */
const DEFAULT_TLS_PATH = "/redis/work/tls";

export async function spawnRedisServerDocker(
options: RedisServerDockerOptions, serverArguments: Array<string>): Promise<RedisServerDocker> {
  let port;
  if (options.mode == "sentinel") {
    port = options.port;
  } else {
    port = (await portIterator.next()).value;
  }

  const portStr = port.toString();

  const dockerArgs = [
    'run',
    '--init',
    '-e', `PORT=${portStr}`
  ];

  if (options.mode == "sentinel") {
    options.mounts.forEach(mount => {
      dockerArgs.push('-v', mount);
    });
  }

  dockerArgs.push(
    '-d',
    '--network', 'host',
    `${options.image}:${options.version}`
  );

  if (serverArguments.length > 0) {
    for (let i = 0; i < serverArguments.length; i++) {
      dockerArgs.push(serverArguments[i])
    }
  }

  console.log(`[Docker] Spawning Redis container - Image: ${options.image}:${options.version}, Port: ${port}, Mode: ${options.mode}`);

  const { stdout, stderr } = await execAsync('docker', dockerArgs);

  if (!stdout) {
    throw new Error(`docker run error - ${stderr}`);
  }

  while (await isPortAvailable(port)) {
    await setTimeout(50);
  }

  return {
    port,
    dockerId: stdout.trim()
  };
}
const RUNNING_SERVERS = new Map<Array<string>, ReturnType<typeof spawnRedisServerDocker>>();

export interface ProxiedRedisServerDocker {
  ports: number[],
  apiPort: number,
  dockerId: string
}

export interface ProxiedRedisServerConfig {
  nOfProxies: number,
  defaultInterceptors: ('cluster'|'hitless'|'logger')[]
  freshContainer?: boolean;
}

const RUNNING_PROXIED_SERVERS = new Map<string, Promise<ProxiedRedisServerDocker>>();

export async function spawnProxiedRedisServer(config: ProxiedRedisServerConfig): Promise<ProxiedRedisServerDocker> {
  const key = JSON.stringify({
    ...config,
    ...(config.freshContainer ? { randomKey: randomUUID() } : {})
  });
  const runningServer = RUNNING_PROXIED_SERVERS.get(key);
  if (runningServer) {
    return runningServer;
  }

  const server = spawnProxiedRedisServerDocker(config);
  RUNNING_PROXIED_SERVERS.set(key, server);
  return server;
}

export async function spawnProxiedRedisServerDocker(
  config: ProxiedRedisServerConfig,
): Promise<ProxiedRedisServerDocker> {

  assert(config.nOfProxies > 0, 'At least one proxy should be started');
  const ports: number[] = [];
  for (let i = 0; i < config.nOfProxies; i++) {
    ports.push((await portIterator.next()).value);
  }
  const apiPort = (await portIterator.next()).value;

  const dockerArgs =[
    "run",
    "-d",
    "--network", "host",
    "-e", `LISTEN_PORT=${ports.join(',')}`,
    "-e", `API_PORT=${apiPort}`,
    "-e", "TIMEOUT=0",
    "-e", "TARGET_HOST=0.0.0.0",
    "-e", `DEFAULT_INTERCEPTORS=${config.defaultInterceptors.join(',')}`,
    "-e", "ENABLE_LOGGING=true",
    "cae-resp-proxy-standalone"
  ]

  console.log(`[Docker] Spawning Proxy container`, dockerArgs.join(' '));

  const { stdout, stderr } = await execAsync("docker", dockerArgs);

  if (!stdout) {
    throw new Error(`docker run error - ${stderr}`);
  }

  for(const port of ports.concat(apiPort)) {
    while (await isPortAvailable(port)) {
      await setTimeout(50);
    }
  }

  return {
    ports,
    apiPort,
    dockerId: stdout.trim(),
  };
}

export function spawnRedisServer(dockerConfig: RedisServerDockerOptions, serverArguments: Array<string>): Promise<RedisServerDocker> {
  const runningServer = RUNNING_SERVERS.get(serverArguments);
  if (runningServer) {
    return runningServer;
  }

  const dockerPromise = spawnRedisServerDocker(dockerConfig, serverArguments);
  RUNNING_SERVERS.set(serverArguments, dockerPromise);
  return dockerPromise;
}

async function dockerRemove(dockerId: string): Promise<void> {
  const { stderr } = await execAsync('docker', ['rm', '-f', dockerId]);
  if (stderr) {
    throw new Error(`docker rm error - ${stderr}`);
  }
}



/**
 * Reads a file from a Docker container directly into memory
 * @param dockerId - The Docker container ID
 * @param filePath - Path to the file inside the container
 * @returns Buffer containing the file contents
 */
async function readFileFromContainer(
  dockerId: string,
  filePath: string,
): Promise<Buffer> {
  const { stdout, stderr } = await execAsync("docker", [
    "exec",
    dockerId,
    "cat",
    filePath,
  ]);
  if (stderr) {
    throw new Error(`Failed to read ${filePath} from container: ${stderr}`);
  }
  return Buffer.from(stdout);
}

/**
 * Loads TLS certificates from a running Docker container into memory
 * @param dockerId - The Docker container ID
 * @param certName - The certificate name (used for client cert/key naming)
 * @returns TlsCertificates object with ca, cert, and key buffers
 */
async function loadTlsCertificates(
  dockerId: string,
  certName: string,
): Promise<TlsCertificates> {
  const [ca, cert, key] = await Promise.all([
    readFileFromContainer(dockerId, `${DEFAULT_TLS_PATH}/ca.crt`),
    readFileFromContainer(dockerId, `${DEFAULT_TLS_PATH}/${certName}.crt`),
    readFileFromContainer(dockerId, `${DEFAULT_TLS_PATH}/${certName}.key`),
  ]);

  return { ca, cert, key };
}

/**
 * Waits for TLS certificates to be available in the container
 * @param dockerId - The Docker container ID
 * @param certName - The certificate name
 * @param maxWaitMs - Maximum time to wait in milliseconds
 */
async function waitForTlsCertificates(
  dockerId: string,
  certName: string,
  maxWaitMs: number = 30000,
): Promise<void> {
  const startTime = Date.now();
  const certFiles = [
    `${DEFAULT_TLS_PATH}/ca.crt`,
    `${DEFAULT_TLS_PATH}/${certName}.crt`,
    `${DEFAULT_TLS_PATH}/${certName}.key`,
  ];

  while (Date.now() - startTime < maxWaitMs) {
    try {
      await Promise.all(
        certFiles.map(file =>
          execAsync("docker", ["exec", dockerId, "test", "-f", file]),
        ),
      );
      // All files exist
      return;
    } catch {
      // Not all files exist yet, wait and retry
      await setTimeout(100);
    }
  }

  throw new Error(`TLS certificates not available after ${maxWaitMs}ms`);
}

/**
 * Spawns a TLS-enabled Redis server Docker container with both TLS and non-TLS ports
 */
export async function spawnTlsRedisServerDocker(
  options: RedisServerDockerOptions,
  serverArguments: Array<string> = [],
  tlsConfig?: TlsConfig,
): Promise<TlsRedisServerDocker> {
  const port = (await portIterator.next()).value;
  const tlsPort = (await portIterator.next()).value;
  const clientCertCN = tlsConfig?.clientCertCN;

  // Use provided CN for cert name, otherwise use default 'client' cert
  const certName = clientCertCN ?? DEFAULT_CLIENT_CERT_NAME;

  const dockerArgs = [
    "run",
    "--init",
    "-e",
    "TLS_ENABLED=yes",
    "-e",
    "NODES=1",
    "-e",
    `PORT=${port}`,
    "-e",
    `TLS_PORT=${tlsPort}`,
  ];

  // Only add client CN auth if specified
  if (clientCertCN) {
    dockerArgs.push("-e", `TLS_CLIENT_CNS=${clientCertCN}`);
  }

  dockerArgs.push(
    "-d",
    "--network",
    "host",
    `${options.image}:${options.version}`,
  );

  for (const arg of serverArguments) {
    dockerArgs.push(arg);
  }

  console.log(
    `[Docker] Spawning TLS Redis container - Image: ${options.image}:${options.version}, Port: ${port}, TLS Port: ${tlsPort}, CertName: ${certName}`,
  );

  const { stdout, stderr } = await execAsync("docker", dockerArgs);

  if (!stdout) {
    throw new Error(`docker run error - ${stderr}`);
  }

  const dockerId = stdout.trim();

  // Wait for both ports to be available
  while ((await isPortAvailable(port)) || (await isPortAvailable(tlsPort))) {
    await setTimeout(50);
  }

  // Wait for TLS certificates to be generated
  await waitForTlsCertificates(dockerId, certName);

  // Load certificates directly into memory from the container
  const certs = await loadTlsCertificates(dockerId, certName);

  return {
    port,
    tlsPort,
    dockerId,
    certs,
  };
}

const RUNNING_TLS_SERVERS = new Map<
  string,
  ReturnType<typeof spawnTlsRedisServerDocker>
>();

/**
 * Spawns a TLS-enabled Redis server, reusing existing containers when possible
 */
export function spawnTlsRedisServer(
  dockerConfig: RedisServerDockerOptions,
  serverArguments: Array<string>,
  tlsConfig?: TlsConfig,
): Promise<TlsRedisServerDocker> {
  const clientCertCN = tlsConfig?.clientCertCN;
  const cacheKey = JSON.stringify({ serverArguments, clientCertCN });

  const runningServer = RUNNING_TLS_SERVERS.get(cacheKey);
  if (runningServer) {
    return runningServer;
  }

  const dockerPromise = spawnTlsRedisServerDocker(
    dockerConfig,
    serverArguments,
    tlsConfig,
  );
  RUNNING_TLS_SERVERS.set(cacheKey, dockerPromise);
  return dockerPromise;
}

/**
 * Cleanup function for TLS servers - removes containers
 */
after(function() {
  this.timeout(30000); // 30 seconds for Docker cleanup
  return Promise.all(
    [...RUNNING_TLS_SERVERS.values()].map(async (dockerPromise) => {
      const docker = await dockerPromise;
      await dockerRemove(docker.dockerId);
    }),
  );
});

export type RedisClusterDockersConfig = RedisServerDockerOptions & {
  numberOfMasters?: number;
  numberOfReplicas?: number;
}

/**
 * Redis 8.9+ adds `cluster-bus-port-protected-mode`, on by default, which aborts
 * a cluster-enabled server started without TLS. The test containers run without
 * TLS, so cluster nodes must turn it off. But the directive does not exist in
 * every build the CI matrix runs (some report the same version yet predate it),
 * and an unknown directive is a fatal startup error. So detect support at
 * runtime — once per image — instead of guessing from the version number.
 */
const clusterBusPortProtectedModeArgs = new Map<string, Promise<Array<string>>>();

function clusterNodeExtraArguments(dockersConfig: RedisServerDockerOptions): Promise<Array<string>> {
  const key = `${dockersConfig.image}:${dockersConfig.version}`;
  let args = clusterBusPortProtectedModeArgs.get(key);
  if (!args) {
    args = (async () => {
      const probe = await spawnRedisServerDocker(dockersConfig, []),
        client = createClient({ socket: { port: probe.port } });
      try {
        await client.connect();
        const reply = await client.configGet('cluster-bus-port-protected-mode');
        return Object.keys(reply).length > 0
          ? ['--cluster-bus-port-protected-mode', 'no']
          : [];
      } finally {
        if (client.isOpen) client.destroy();
        await dockerRemove(probe.dockerId);
      }
    })();
    clusterBusPortProtectedModeArgs.set(key, args);
  }

  return args;
}

async function spawnRedisClusterNodeDockers(
  dockersConfig: RedisClusterDockersConfig,
  serverArguments: Array<string>,
  fromSlot: number,
  toSlot: number,
  clientConfig?: Partial<RedisClusterClientOptions>
) {
  const range: Array<number> = [];
  for (let i = fromSlot; i < toSlot; i++) {
    range.push(i);
  }

  const master = await spawnRedisClusterNodeDocker(
    dockersConfig,
    serverArguments,
    clientConfig
  );

  await master.client.clusterAddSlots(range);

  if (!dockersConfig.numberOfReplicas) return [master];

  const replicasPromises: Array<ReturnType<typeof spawnRedisClusterNodeDocker>> = [];
  for (let i = 0; i < (dockersConfig.numberOfReplicas ?? 0); i++) {
    replicasPromises.push(
      spawnRedisClusterNodeDocker(dockersConfig, [
        ...serverArguments,
        '--cluster-enabled',
        'yes',
        '--cluster-node-timeout',
        '5000'
      ], clientConfig).then(async replica => {

        const requirePassIndex = serverArguments.findIndex((x) => x === '--requirepass');
        if (requirePassIndex !== -1) {
          const password = serverArguments[requirePassIndex + 1];
          await replica.client.configSet({ 'masterauth': password })
        }
        await replica.client.clusterMeet('127.0.0.1', master.docker.port);

        while ((await replica.client.clusterSlots()).length === 0) {
          await setTimeout(25);
        }

        await replica.client.clusterReplicate(
          await master.client.clusterMyId()
        );

        return replica;
      })
    );
  }

  return [
    master,
    ...await Promise.all(replicasPromises)
  ];
}

async function spawnRedisClusterNodeDocker(
  dockersConfig: RedisServerDockerOptions,
  serverArguments: Array<string>,
  clientConfig?: Partial<RedisClusterClientOptions>
) {
  const docker = await spawnRedisServerDocker(dockersConfig, [
      ...serverArguments,
      '--cluster-enabled',
      'yes',
      '--cluster-node-timeout',
      '5000',
      ...await clusterNodeExtraArguments(dockersConfig)
    ]),
    client = createClient({
      socket: {
        port: docker.port
      },
      ...clientConfig
    });

  await client.connect();

  return {
    docker,
    client
  };
}

const SLOTS = 16384;

async function spawnRedisClusterDockers(
  dockersConfig: RedisClusterDockersConfig,
  serverArguments: Array<string>,
  clientConfig?: Partial<RedisClusterClientOptions>
): Promise<Array<RedisServerDocker>> {
  const numberOfMasters = dockersConfig.numberOfMasters ?? 2,
    slotsPerNode = Math.floor(SLOTS / numberOfMasters),
    spawnPromises: Array<ReturnType<typeof spawnRedisClusterNodeDockers>> = [];
  for (let i = 0; i < numberOfMasters; i++) {
    const fromSlot = i * slotsPerNode,
      toSlot = i === numberOfMasters - 1 ? SLOTS : fromSlot + slotsPerNode;
    spawnPromises.push(
      spawnRedisClusterNodeDockers(
        dockersConfig,
        serverArguments,
        fromSlot,
        toSlot,
        clientConfig
      )
    );
  }

  const nodes = (await Promise.all(spawnPromises)).flat(),
    meetPromises: Array<Promise<unknown>> = [];
  for (let i = 1; i < nodes.length; i++) {
    meetPromises.push(
      nodes[i].client.clusterMeet('127.0.0.1', nodes[0].docker.port)
    );
  }

  await Promise.all(meetPromises);

  await Promise.all(
    nodes.map(async ({ client }) => {
      while (
        totalNodes(await client.clusterSlots()) !== nodes.length ||
        !(await client.sendCommand<string>(['CLUSTER', 'INFO'])).startsWith('cluster_state:ok') // TODO
        ) {
        await setTimeout(50);
      }

      client.destroy();
    })
  );

  return nodes.map(({ docker }) => docker);
}

function totalNodes(slots: Array<{ replicas: Array<unknown> }>) {
  let total = slots.length;
  for (const slot of slots) {
    total += slot.replicas.length;
  }

  return total;
}

const RUNNING_CLUSTERS = new Map<Array<string>, ReturnType<typeof spawnRedisClusterDockers>>();

export function spawnRedisCluster(
  dockersConfig: RedisClusterDockersConfig,
  serverArguments: Array<string>,
  clientConfig?: Partial<RedisClusterClientOptions>): Promise<Array<RedisServerDocker>> {

  const runningCluster = RUNNING_CLUSTERS.get(serverArguments);
  if (runningCluster) {
    return runningCluster;
  }

  const dockersPromise = spawnRedisClusterDockers(dockersConfig, serverArguments, clientConfig);

  RUNNING_CLUSTERS.set(serverArguments, dockersPromise);
  return dockersPromise;
}




const RUNNING_NODES = new Map<Array<string>, Array<RedisServerDocker>>();
const RUNNING_SENTINELS = new Map<Array<string>, Promise<Array<RedisServerDocker>>>();

/**
 * Normalizes a raw `SENTINEL MASTER` reply into a string record.
 *
 * RESP2 returns a flat tuple array. RESP3 returns a map — by default as a
 * plain object (`#decodeMapAsObject`), or as a `Map` when type-mapped.
 * `mapLikeToObject` covers all three shapes.
 */
function sentinelMasterInfo(reply: unknown): Record<string, string> {
  const info: Record<string, string> = {};
  for (const [key, value] of Object.entries(mapLikeToObject(reply))) {
    info[key] = String(value);
  }
  return info;
}

/**
 * Resolves `promise` or rejects when `ms` elapses. Clears the timer on settle
 * so a late timeout cannot become an unhandled rejection.
 */
async function raceAgainstDeadline<T>(
  promise: Promise<T>,
  ms: number,
  onTimeout: () => void,
): Promise<T> {
  let timer: ReturnType<typeof globalThis.setTimeout> | undefined;
  // Swallow late rejections from `promise` after the timer wins — otherwise
  // destroy()-aborted connect/sendCommand can become an unhandled rejection.
  const guarded = promise.then(
    value => ({ ok: true as const, value }),
    error => ({ ok: false as const, error }),
  );
  try {
    const result = await Promise.race([
      guarded,
      new Promise<never>((_, reject) => {
        timer = globalThis.setTimeout(() => {
          try {
            onTimeout();
          } catch {
            // ignore destroy errors during timeout
          }
          reject(new Error(`timed out after ${ms}ms`));
        }, ms);
      }),
    ]);
    if (!result.ok) {
      throw result.error;
    }
    return result.value;
  } finally {
    if (timer !== undefined) {
      globalThis.clearTimeout(timer);
    }
  }
}

/**
 * Polls the spawned sentinels until one reports an electable master for
 * `masterName` (same flags check the sentinel client uses in `parseNode`).
 */
async function waitForSentinelMasterElectable(
  sentinels: Array<RedisServerDocker>,
  masterName: string,
  password?: string,
  timeoutMs = 30_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;

  while (Date.now() < deadline) {
    for (const sentinel of sentinels) {
      // Bound each probe by the remaining deadline and disable reconnects.
      // `connectTimeout` only covers TCP; HELLO/AUTH can still hang, so race
      // the whole handshake + SENTINEL MASTER against the deadline.
      const remainingMs = Math.max(1, deadline - Date.now());
      const client = createClient({
        socket: {
          port: sentinel.port,
          reconnectStrategy: false,
          connectTimeout: remainingMs,
        },
        password,
        commandOptions: { timeout: remainingMs },
      });
      try {
        const info = await raceAgainstDeadline(
          (async () => {
            await client.connect();
            // sendCommand returns RESP3 Maps by default — do not assume a flat array.
            return sentinelMasterInfo(
              await client.sendCommand(['SENTINEL', 'MASTER', masterName])
            );
          })(),
          remainingMs,
          () => client.destroy(),
        );

        const flags = info.flags ?? '';
        if (
          info.ip &&
          info.port &&
          !flags.includes('s_down') &&
          !flags.includes('disconnected') &&
          !flags.includes('failover_in_progress')
        ) {
          return;
        }

        lastError = new Error(`master not electable yet (flags=${flags || 'missing'})`);
      } catch (err) {
        lastError = err;
      } finally {
        client.destroy();
      }
    }

    await setTimeout(100);
  }

  throw new Error(
    `Timed out waiting for sentinel master "${masterName}" to become electable: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  );
}

async function spawnRedisSentinelDockers(
  dockerConfigs: RedisServerDockerOptions,
  serverArguments: Array<string>,
): Promise<Array<RedisServerDocker>> {
  const passIndex = serverArguments.indexOf('--requirepass') + 1;
  let password: string | undefined = undefined;
  if (passIndex != 0) {
    password = serverArguments[passIndex];
  }

  const master = await spawnRedisServerDocker(dockerConfigs, serverArguments);
  const redisNodes: Array<RedisServerDocker> = [master];
  const replicaPromises: Array<Promise<RedisServerDocker>> = [];

  const replicasCount = 2;
  for (let i = 0; i < replicasCount; i++) {
    replicaPromises.push((async () => {
      const replica = await spawnRedisServerDocker(dockerConfigs, serverArguments);
      const client = createClient({
        socket: {
          port: replica.port
        },
        password: password
      });

      await client.connect();
      await client.replicaOf('127.0.0.1', master.port);
      await client.close();

      return replica;
    })());
  }

  const replicas = await Promise.all(replicaPromises);
  redisNodes.push(...replicas);
  RUNNING_NODES.set(serverArguments, redisNodes);

  const sentinelPromises: Array<Promise<RedisServerDocker>> = [];
  const sentinelCount = 3;

  const appPrefix = 'sentinel-config-dir';
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), appPrefix));

  for (let i = 0; i < sentinelCount; i++) {
    sentinelPromises.push(
      spawnSentinelNode(
        dockerConfigs,
        serverArguments,
        master.port,
        'mymaster',
        path.join(tmpDir, i.toString()),
        password,
      ),
    );
  }

  let sentinelNodes: Array<RedisServerDocker>;
  try {
    sentinelNodes = await Promise.all(sentinelPromises);

    // Containers can be up before any sentinel has an electable master (and
    // before the suite's first SENTINEL MASTER probe). Wait so callers don't
    // cascade on "no valid master node" / before-hook timeouts (#3650 A).
    await waitForSentinelMasterElectable(sentinelNodes, 'mymaster', password);
  } catch (err) {
    // Tear down everything started for this attempt so a failed readiness wait
    // (or mid-flight sentinel spawn) does not leak containers. Master/replicas
    // are already in RUNNING_NODES; remove them too or a retry would orphan the
    // first batch when it overwrites that entry.
    const startedSentinels = (
      await Promise.allSettled(sentinelPromises)
    ).flatMap(result => result.status === 'fulfilled' ? [result.value] : []);
    await Promise.allSettled([
      ...startedSentinels.map(({ dockerId }) => dockerRemove(dockerId)),
      ...redisNodes.map(({ dockerId }) => dockerRemove(dockerId)),
    ]);
    RUNNING_NODES.delete(serverArguments);
    fs.rmSync(tmpDir, { recursive: true, force: true });
    throw err;
  }

  // Temp-dir cleanup is best-effort and outside the failure catch so a delete
  // error cannot tear down an already-electable topology.
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // ignore
  }
  return sentinelNodes;
}

export function spawnRedisSentinel(
  dockerConfigs: RedisServerDockerOptions,
  serverArguments: Array<string>,
): Promise<Array<RedisServerDocker>> {
  const running = RUNNING_SENTINELS.get(serverArguments);
  if (running) {
    return running;
  }

  // Register the in-flight promise immediately (same pattern as
  // spawnRedisCluster) so overlapping callers share one topology — especially
  // important now that we wait for an electable master before resolving.
  // Evict on rejection so a transient failure does not poison later suites
  // that reuse the same serverArguments array.
  const dockersPromise = spawnRedisSentinelDockers(dockerConfigs, serverArguments)
    .catch(err => {
      RUNNING_SENTINELS.delete(serverArguments);
      throw err;
    });
  RUNNING_SENTINELS.set(serverArguments, dockersPromise);
  return dockersPromise;
}

after(function() {
  this.timeout(30000); // 30 seconds for Docker cleanup
  return Promise.all([
    ...Array.from(RUNNING_SERVERS.values()).map(async dockerPromise =>
      dockerRemove((await dockerPromise).dockerId)
    ),
    ...Array.from(RUNNING_CLUSTERS.values()).map(async dockersPromise =>
      Promise.all((await dockersPromise).map(({ dockerId }) => dockerRemove(dockerId)))
    ),
    ...Array.from(RUNNING_NODES.values()).map(dockersPromise =>
      Promise.all(dockersPromise.map(({ dockerId }) => dockerRemove(dockerId)))
    ),
    ...Array.from(RUNNING_SENTINELS.values()).map(async dockersPromise => {
      try {
        const nodes = await dockersPromise;
        await Promise.all(nodes.map(({ dockerId }) => dockerRemove(dockerId)));
      } catch {
        // Spawn failed and already cleaned up / was evicted from the map.
      }
    }),
    ...Array.from(RUNNING_PROXIED_SERVERS.values()).map(async dockerPromise =>
      dockerRemove((await dockerPromise).dockerId)
    )
  ]);
});


export async function spawnSentinelNode(
  dockerConfigs: RedisServerDockerOptions,
  serverArguments: Array<string>,
  masterPort: number,
  sentinelName: string,
  tmpDir: string,
  password?: string,
) {
  const port = (await portIterator.next()).value;

  let sentinelConfig = `port ${port}
sentinel monitor ${sentinelName} 127.0.0.1 ${masterPort} 2
sentinel down-after-milliseconds ${sentinelName} 500
sentinel failover-timeout ${sentinelName} 1000
`;
  if (password !== undefined) {
    sentinelConfig += `requirepass ${password}\n`;
    sentinelConfig += `sentinel auth-pass ${sentinelName} ${password}\n`;
  }

  const dir = fs.mkdtempSync(tmpDir);
  // Must be sync: the config is bind-mounted into the container next, and an
  // async writeFile can leave an empty/missing file when the sentinel starts.
  fs.writeFileSync(`${dir}/redis.conf`, sentinelConfig);

  return await spawnRedisServerDocker(
    {
      image: dockerConfigs.image,
      version: dockerConfigs.version,
      mode: "sentinel",
        mounts: [`${dir}/redis.conf:/redis/config/node-sentinel-1/redis.conf`],
        port: port,
    },
    serverArguments,
  );
}
