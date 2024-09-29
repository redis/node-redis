import { createConnection } from 'net';
import { once } from 'events';
import RedisClient from '@redis/client/dist/lib/client';
import { promiseTimeout } from '@redis/client/dist/lib/utils';
import { ClusterSlotsReply } from '@redis/client/dist/lib/commands/CLUSTER_SLOTS';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
const execAsync = promisify(exec);

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

const portIterator = (async function*(): AsyncIterableIterator<number> {
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

// ".." cause it'll be in `./dist`
const DOCKER_FODLER_PATH = path.join(__dirname, '../docker');

async function spawnRedisServerDocker({ image, version }: RedisServerDockerConfig, serverArguments: Array<string>): Promise<RedisServerDocker> {
    const port = (await portIterator.next()).value,
        { stdout, stderr } = await execAsync(
            'docker run -d --network host $(' +
                `docker build ${DOCKER_FODLER_PATH} -q ` +
                `--build-arg IMAGE=${image}:${version} ` +
                `--build-arg REDIS_ARGUMENTS="--save '' --port ${port.toString()} ${serverArguments.join(' ')}"` +
            ')'
        );

    if (!stdout) {
        throw new Error(`docker run error - ${stderr}`);
    }

    while (await isPortAvailable(port)) {
        await promiseTimeout(50);
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
    const { stderr } = await execAsync(`docker rm -f ${dockerId}`);
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
    toSlot: number
) {
    const range: Array<number> = [];
    for (let i = fromSlot; i < toSlot; i++) {
        range.push(i);
    }

    const master = await spawnRedisClusterNodeDocker(
        dockersConfig,
        serverArguments
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
            ]).then(async replica => {
                await replica.client.clusterMeet('127.0.0.1', master.docker.port);

                while ((await replica.client.clusterSlots()).length === 0) {
                    await promiseTimeout(50);
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
    serverArguments: Array<string>
) {
    const docker = await spawnRedisServerDocker(dockersConfig, [
            ...serverArguments,
            '--cluster-enabled',
            'yes',
            '--cluster-node-timeout',
            '5000'
        ]),
        client = RedisClient.create({
            socket: {
                port: docker.port
            }
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
    serverArguments: Array<string>
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
                toSlot
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
            while (totalNodes(await client.clusterSlots()) !== nodes.length) {
                await promiseTimeout(50);
            }
        
            return client.disconnect();
        })
    );

    return nodes.map(({ docker }) => docker);
}

function totalNodes(slots: ClusterSlotsReply) {
    let total = slots.length;
    for (const slot of slots) {
        total += slot.replicas.length;
    }

    return total;
}

const RUNNING_CLUSTERS = new Map<Array<string>, ReturnType<typeof spawnRedisClusterDockers>>();

export function spawnRedisCluster(dockersConfig: RedisClusterDockersConfig, serverArguments: Array<string>): Promise<Array<RedisServerDocker>> {
    const runningCluster = RUNNING_CLUSTERS.get(serverArguments);
    if (runningCluster) {
        return runningCluster;
    }

    const dockersPromise = spawnRedisClusterDockers(dockersConfig, serverArguments);
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
