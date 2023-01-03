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
        await promiseTimeout(500);
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
}

async function spawnRedisClusterNodeDocker(
    dockersConfig: RedisClusterDockersConfig,
    serverArguments: Array<string>,
    fromSlot: number,
    toSlot: number,
    waitForState: boolean,
    meetPort?: number
): Promise<RedisServerDocker> {
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

    try {
        const range = [];
        for (let i = fromSlot; i < toSlot; i++) {
            range.push(i);
        }

        const promises: Array<Promise<unknown>> = [client.clusterAddSlots(range)];

        if (meetPort) {
            promises.push(client.clusterMeet('127.0.0.1', meetPort));
        }

        if (waitForState) {
            promises.push(waitForClusterState(client));
        }

        await Promise.all(promises);

        return docker;
    } finally {
        await client.disconnect();
    }
}

async function waitForClusterState<
    M extends RedisModules,
    F extends RedisFunctions,
    S extends RedisScripts
>(client: RedisClientType<M, F, S>): Promise<void> {
    while ((await client.clusterInfo()).state !== 'ok') {
        await promiseTimeout(500);
    }
}

const SLOTS = 16384;

async function spawnRedisClusterDockers(dockersConfig: RedisClusterDockersConfig, serverArguments: Array<string>): Promise<Array<RedisServerDocker>> {
    const numberOfNodes = dockersConfig.numberOfNodes ?? 3,
        slotsPerNode = Math.floor(SLOTS / numberOfNodes),
        dockers: Array<RedisServerDocker> = [];
    for (let i = 0; i < numberOfNodes; i++) {
        const fromSlot = i * slotsPerNode,
            [ toSlot, waitForState ] = i === numberOfNodes - 1 ? [SLOTS, true] : [fromSlot + slotsPerNode, false];
        dockers.push(
            await spawnRedisClusterNodeDocker(
                dockersConfig,
                serverArguments,
                fromSlot,
                toSlot,
                waitForState,
                i === 0 ? undefined : dockers[i - 1].port
            )
        );
    }

    const client = RedisClient.create({
        socket: {
            port: dockers[0].port
        }
    });

    await client.connect();

    try {
        while ((await client.clusterInfo()).state !== 'ok') {
            await promiseTimeout(500);
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
