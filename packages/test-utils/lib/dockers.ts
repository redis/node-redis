import { RedisClusterClientOptions } from '@redis/client/dist/lib/cluster';
import { createConnection } from 'node:net';
import { once } from 'node:events';
import { createClient } from '@redis/client/index';
import { setTimeout } from 'node:timers/promises';
// import { ClusterSlotsReply } from '@redis/client/dist/lib/commands/CLUSTER_SLOTS';
import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

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
after(() => {
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
      '5000'
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

// TODO: type ClusterSlotsReply
function totalNodes(slots: any) {
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

after(() => {
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