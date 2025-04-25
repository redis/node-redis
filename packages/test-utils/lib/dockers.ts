import { RedisClusterClientOptions } from '@redis/client/dist/lib/cluster';
import { createConnection } from 'node:net';
import { once } from 'node:events';
import { createClient } from '@redis/client/index';
import { setTimeout } from 'node:timers/promises';
// import { ClusterSlotsReply } from '@redis/client/dist/lib/commands/CLUSTER_SLOTS';
import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';

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

export interface RedisServerDockerConfig {
  image: string;
  version: string;
}

export interface RedisServerDocker {
  port: number;
  dockerId: string;
}

async function spawnRedisServerDocker({
  image,
  version
}: RedisServerDockerConfig, serverArguments: Array<string>, dockerEnv?: Map<string, string>): Promise<RedisServerDocker> {
  const port = (await portIterator.next()).value;
  const portStr = port.toString();

  const dockerArgs = [
    'run',
    '--init',
    '-e', `PORT=${portStr}`
  ];

  dockerEnv?.forEach((key: string, value: string) => {
    dockerArgs.push('-e', `${key}:${value}`);
  });

  dockerArgs.push(
    '-d',
    '--network', 'host',
    `${image}:${version}`
  );

  if (serverArguments.length > 0) {
    for (let i = 0; i < serverArguments.length; i++) {
      dockerArgs.push(serverArguments[i].replace('{port}', `${portStr}`))
    }
  }

  console.log(`[Docker] Spawning Redis container - Image: ${image}:${version}, Port: ${port}`);

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

export function spawnRedisServer(dockerConfig: RedisServerDockerConfig, serverArguments: Array<string>): Promise<RedisServerDocker> {
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

export interface RedisClusterDockersConfig extends RedisServerDockerConfig {
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
  dockersConfig: RedisClusterDockersConfig,
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
  dockerConfigs: RedisServerDockerConfig,
  serverArguments: Array<string>,
  password?: string,
): Promise<Array<RedisServerDocker>> {
    const runningNodes = RUNNING_SENTINELS.get(serverArguments);
    if (runningNodes) {
      return runningNodes;
    }

    const dockerEnv: Map<string, string> = new Map();
    
    if (password !== undefined) {
      dockerEnv.set("REDIS_PASSWORD", password);
      serverArguments.push("--requirepass", password)
    }

    const master = await spawnRedisServerDocker(dockerConfigs, serverArguments, dockerEnv);
    const redisNodes: Array<RedisServerDocker> = [master];
    const replicaPromises: Array<Promise<RedisServerDocker>> = [];
    
    const replicasCount = 2;
    for (let i = 0; i < replicasCount; i++) {
      replicaPromises.push((async () => {
        const replica = await spawnRedisServerDocker(dockerConfigs, serverArguments, dockerEnv);
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
    
    for (let i = 0; i < sentinelCount; i++) {
      sentinelPromises.push((async () => {
        const sentinelArgs: Array<string> = ["sh", "-c"];
        
        let sentinelConfig = `
port {port}
sentinel monitor mymaster 127.0.0.1 ${master.port} 2
sentinel down-after-milliseconds mymaster 5000
sentinel failover-timeout mymaster 6000
`;
        if (password !== undefined) {
          sentinelConfig += `requirepass ${password}\n`
          sentinelConfig += `sentinel auth-pass mymaster ${password}\n`
        }

        sentinelArgs.push(`echo "${sentinelConfig}" > /tmp/sentinel.conf && redis-sentinel /tmp/sentinel.conf`);
        return await spawnRedisServerDocker({image: "redis", version: "latest"}, sentinelArgs);
      })());
    }
    
    const sentinelNodes = await Promise.all(sentinelPromises);
    RUNNING_SENTINELS.set(serverArguments, sentinelNodes);
    
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