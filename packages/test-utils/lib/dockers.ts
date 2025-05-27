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

after(() => {
  return Promise.all(
    [...RUNNING_SERVERS.values()].map(async dockerPromise =>
      await dockerRemove((await dockerPromise).dockerId)
    )
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

after(() => {
  return Promise.all(
    [...RUNNING_CLUSTERS.values()].map(async dockersPromise => {
      return Promise.all(
        (await dockersPromise).map(({ dockerId }) => dockerRemove(dockerId))
      );
    })
  );
});


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
  return Promise.all(
    [...RUNNING_NODES.values(), ...RUNNING_SENTINELS.values()].map(async dockersPromise => {
      return Promise.all(
        dockersPromise.map(({ dockerId }) => dockerRemove(dockerId))
      );
    })
  );
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