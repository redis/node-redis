import { createConnection } from 'net';
import { once } from 'events';
import { RedisModules, RedisFunctions, RedisScripts } from '@redis/client/dist/lib/commands';
import RedisClient, { RedisClientType } from '@redis/client/dist/lib/client';
import { promiseTimeout } from '@redis/client/dist/lib/utils';
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
    numberOfNodes?: number;
    numberOfReplicas?: number;
}

export interface RedisClusterNodeDocker extends RedisServerDocker {
    nodeId: string;
}

async function spawnRedisClusterNodeDockers(
    dockersConfig: RedisClusterDockersConfig,
    serverArguments: Array<string>,
    fromSlot: number,
    toSlot: number
): Promise<Array<RedisClusterNodeDocker>> {
    const range: Array<number> = [];
    for (let i = fromSlot; i < toSlot; i++) {
        range.push(i);
    }

    const master = await spawnRedisClusterNodeDocker(
        dockersConfig,
        serverArguments,
        client => client.clusterAddSlots(range)
    );

    if (!dockersConfig.numberOfReplicas) return [master];

    const replicasPromises: Array<Promise<RedisClusterNodeDocker>> = [];
    for (let i = 0; i < dockersConfig.numberOfReplicas; i++) {
        replicasPromises.push(
            spawnRedisClusterNodeDocker(dockersConfig, [
                ...serverArguments,
                '--cluster-enabled',
                'yes',
                '--cluster-node-timeout',
                '5000'
            ], async client => {
                await client.clusterMeet('127.0.0.1', master.port);
                while ((await client.clusterSlots()).length === 0) {
                    await promiseTimeout(50);
                }

                await client.clusterReplicate(master.nodeId);
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
    initiate: (client: RedisClientType<RedisModules, RedisFunctions, RedisScripts>) => Promise<unknown>
): Promise<RedisClusterNodeDocker> {
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

    let nodeId: string;
    try {
        [nodeId] = await Promise.all([
            client.clusterMyId(),
            initiate(client)
        ]);
    } finally {
        await client.disconnect();
    }

    return {
        nodeId,
        ...docker
    };
}

async function totalNodes<
    M extends RedisModules,
    F extends RedisFunctions,
    S extends RedisScripts
>(client: RedisClientType<M, F, S>): Promise<number> {
    const slots = await client.clusterSlots();

    let replicas = 0;
    for (const { replicas: { length } } of slots) {
        replicas += length;
    }

    return slots.length + replicas;
}

const SLOTS = 16384;

async function spawnRedisClusterDockers(
    dockersConfig: RedisClusterDockersConfig,
    serverArguments: Array<string>
): Promise<Array<RedisClusterNodeDocker>> {
    const numberOfNodes = dockersConfig.numberOfNodes ?? 3,
        slotsPerNode = Math.floor(SLOTS / numberOfNodes),
        promises: Array<Promise<Array<RedisClusterNodeDocker>>> = [];
    for (let i = 0; i < numberOfNodes; i++) {
        const fromSlot = i * slotsPerNode,
            toSlot = i === numberOfNodes - 1 ? SLOTS : fromSlot + slotsPerNode;
        promises.push(
            spawnRedisClusterNodeDockers(
                dockersConfig,
                serverArguments,
                fromSlot,
                toSlot
            )
        );
    }

    const dockers = (await Promise.all(promises)).flat(),
        client = RedisClient.create({
            socket: {
                port: dockers[0].port
            }
        });

    await client.connect();

    try {
        const promises: Array<Promise<unknown>> = [];
        for (let i = 1; i < dockers.length; i++) {
            promises.push(
                client.clusterMeet('127.0.0.1', dockers[i].port)
            );
        }

        await Promise.all(promises);

        const expectedNodes = numberOfNodes * (1 + (dockersConfig.numberOfReplicas ?? 0))
        while (await totalNodes(client) !== expectedNodes) {
            await promiseTimeout(50);
        }
    } finally {
        await client.disconnect();
    }

    return dockers;
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
