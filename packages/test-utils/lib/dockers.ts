import { RedisClusterClientOptions } from '@redis/client/dist/lib/cluster';
import { randomUUID } from 'node:crypto';
import { createConnection } from 'node:net';
import { once } from 'node:events';
import { createClient } from '@redis/client/index';
import { setTimeout } from 'node:timers/promises';
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

const CLUSTER_BUS_PORT_OFFSET = 10000;

async function reservePorts(count: number): Promise<number[]> {
  const ports: number[] = [];
  for (let i = 0; i < count; i++) {
    ports.push((await portIterator.next()).value);
  }
  return ports;
}

// Spawns one redis-server node that's part of a cluster where *all* nodes
// share a single Docker network namespace, instead of `--network host`.
//
// Why: on macOS/Windows, `--network host` only reaches the Docker Desktop VM,
// not the real host, so the host test process can't connect to the nodes at
// all (see #2358). Publishing ports (`-p`) the usual way fixes host access,
// but Redis Cluster nodes can only *announce* one address for themselves --
// an address that's valid for sibling containers (their bridge-network IP)
// is *not* valid for the host, and vice-versa.
//
// Fix: put every node in the cluster in the *same* network namespace via
// `--network container:<id>`. The first node spawned ("owner") gets a normal
// network and publishes every port the whole cluster will ever use; every
// other node joins the owner's namespace instead of getting its own. From
// then on, `127.0.0.1:<port>` means the same thing to the host *and* to every
// sibling node, so `--cluster-announce-ip 127.0.0.1` is simultaneously valid
// for both audiences.
async function spawnClusterNetworkNode(
  dockersConfig: RedisServerDockerOptions,
  serverArguments: Array<string>,
  port: number,
  ownerPorts: number[] | undefined,
  networkOwnerId: string | undefined
): Promise<RedisServerDocker> {
  const portStr = port.toString();
  const busPort = port + CLUSTER_BUS_PORT_OFFSET;

  const dockerArgs = ['run', '--init', '-e', `PORT=${portStr}`];

  if (networkOwnerId) {
    dockerArgs.push('--network', `container:${networkOwnerId}`);
  } else {
    for (const p of ownerPorts!) {
      dockerArgs.push(
        '-p', `${p}:${p}`,
        '-p', `${p + CLUSTER_BUS_PORT_OFFSET}:${p + CLUSTER_BUS_PORT_OFFSET}`
      );
    }
  }

  dockerArgs.push('-d', `${dockersConfig.image}:${dockersConfig.version}`);
  dockerArgs.push(
    ...serverArguments,
    '--cluster-announce-ip', '127.0.0.1',
    '--cluster-announce-port', portStr,
    '--cluster-announce-bus-port', busPort.toString()
  );

  console.log(`[Docker] Spawning cluster node - Port: ${port}, network: ${networkOwnerId ? `container:${networkOwnerId}` : '(owner)'}`);

  const { stdout, stderr } = await execAsync('docker', dockerArgs);
  if (!stdout) {
    throw new Error(`docker run error - ${stderr}`);
  }

  while (await isPortAvailable(port)) {
    await setTimeout(50);
  }

  return { port, dockerId: stdout.trim() };
}

const SLOTS = 16384;

async function spawnRedisClusterDockers(
  dockersConfig: RedisClusterDockersConfig,
  serverArguments: Array<string>,
  clientConfig?: Partial<RedisClusterClientOptions>
): Promise<Array<RedisServerDocker>> {
  const numberOfMasters = dockersConfig.numberOfMasters ?? 2,
    numberOfReplicas = dockersConfig.numberOfReplicas ?? 0,
    totalNodeCount = numberOfMasters * (1 + numberOfReplicas),
    slotsPerNode = Math.floor(SLOTS / numberOfMasters);

  // All ports must be known up-front: the network "owner" node has to
  // publish every port the cluster will use in its single `docker run`.
  const ports = await reservePorts(totalNodeCount);
  const nodeArguments = [...serverArguments, '--cluster-enabled', 'yes', '--cluster-node-timeout', '5000'];

  const ownerDocker = await spawnClusterNetworkNode(dockersConfig, nodeArguments, ports[0], ports, undefined);
  const restDockers = await Promise.all(
    ports.slice(1).map(port =>
      spawnClusterNetworkNode(dockersConfig, nodeArguments, port, undefined, ownerDocker.dockerId)
    )
  );
  const dockers = [ownerDocker, ...restDockers];

  const nodes = await Promise.all(
    dockers.map(async docker => {
      const client = createClient({ socket: { port: docker.port }, ...clientConfig });
      await client.connect();
      return { docker, client };
    })
  );

  // First `numberOfMasters` nodes are masters (one per shard); the rest are
  // replicas, handed out round-robin across the masters.
  const masters = nodes.slice(0, numberOfMasters);
  const replicasByMaster: (typeof nodes)[] = masters.map(() => []);
  for (let i = numberOfMasters; i < nodes.length; i++) {
    replicasByMaster[(i - numberOfMasters) % numberOfMasters].push(nodes[i]);
  }

  for (let i = 0; i < numberOfMasters; i++) {
    const fromSlot = i * slotsPerNode,
      toSlot = i === numberOfMasters - 1 ? SLOTS : fromSlot + slotsPerNode,
      range: Array<number> = [];
    for (let s = fromSlot; s < toSlot; s++) range.push(s);
    await masters[i].client.clusterAddSlots(range);
  }

  const meetPromises: Array<Promise<unknown>> = [];
  for (let i = 1; i < nodes.length; i++) {
    meetPromises.push(
      nodes[i].client.clusterMeet('127.0.0.1', nodes[0].docker.port)
    );
  }
  await Promise.all(meetPromises);

  // Wait for gossip to cover all slots before replicating -- this only needs
  // the masters to be visible, not the (not-yet-configured) replicas, so it
  // must happen *before* clusterReplicate below, not after.
  await Promise.all(
    nodes.map(async ({ client }) => {
      while (
        !(await client.sendCommand<string>(['CLUSTER', 'INFO'])).startsWith('cluster_state:ok') // TODO
        ) {
        await setTimeout(50);
      }
    })
  );

  for (let i = 0; i < numberOfMasters; i++) {
    for (const replica of replicasByMaster[i]) {
      const requirePassIndex = serverArguments.findIndex((x) => x === '--requirepass');
      if (requirePassIndex !== -1) {
        const password = serverArguments[requirePassIndex + 1];
        await replica.client.configSet({ 'masterauth': password });
      }
      await replica.client.clusterReplicate(await masters[i].client.clusterMyId());
    }
  }

  // Now that replicas are attached, wait for every node to see the full
  // node count (masters + replicas) before handing the cluster back.
  await Promise.all(
    nodes.map(async ({ client }) => {
      while (totalNodes(await client.clusterSlots()) !== nodes.length) {
        await setTimeout(50);
      }
    })
  );

  for (const { client } of nodes) {
    client.destroy();
  }

  return dockers;
}

type ClusterSlotsReply = Awaited<ReturnType<ReturnType<typeof createClient>['clusterSlots']>>;

function totalNodes(slots: ClusterSlotsReply) {
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
const RUNNING_SENTINELS = new Map<Array<string>, Array<RedisServerDocker>>();

export async function spawnRedisSentinel(
  dockerConfigs: RedisServerDockerOptions,
  serverArguments: Array<string>,
): Promise<Array<RedisServerDocker>> {
    const runningNodes = RUNNING_SENTINELS.get(serverArguments);
    if (runningNodes) {
      return runningNodes;
    }

    const passIndex = serverArguments.indexOf('--requirepass')+1;
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
        await client.replicaOf("127.0.0.1", master.port);
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
          "mymaster",
          path.join(tmpDir, i.toString()),
          password,
        ),
      )
    }

    const sentinelNodes = await Promise.all(sentinelPromises);
    RUNNING_SENTINELS.set(serverArguments, sentinelNodes);

    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true });
    }

    return sentinelNodes;
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
    ...Array.from(RUNNING_SENTINELS.values()).map(dockersPromise =>
      Promise.all(dockersPromise.map(({ dockerId }) => dockerRemove(dockerId)))
    ),
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
  fs.writeFile(`${dir}/redis.conf`, sentinelConfig, err => {
    if (err) {
      console.error("failed to create temporary config file", err);
    }
  });

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
