import { RedisModules, RedisScripts } from '@node-redis/client/lib/commands';
import RedisClient, { RedisClientType } from '@node-redis/client/lib/client';
import { promiseTimeout } from '@node-redis/client/lib/utils';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import { createConnection } from 'net';
import { once } from 'events';
const execAsync = promisify(exec);

export async function createNetwork(name: string): Promise<void> {
    try {
        await execAsync(`docker network inspect ${name} -f '{{ .Id }}'`);

        console.warn(`${name} network already exists, reusing it`);
        return;
    } catch {}

    const { stderr } = await execAsync(`docker network create ${name}`);
    if (stderr) {
        throw new Error(`docket network create error - ${stderr}`);
    }
}

export async function removeNetwork(name: string): Promise<void> {
    const { stderr } = await execAsync(`docker network rm ${name}`);
    if (stderr) {
        throw new Error(`docket network create error - ${stderr}`);
    }
}

async function getContainerHost(network: string, id: string): Promise<string> {
    const { stdout, stderr } = await execAsync(`docker container inspect ${id} -f '{{ index .NetworkSettings.Networks "${network}" "IPAddress" }}'`);
    if (stderr) {
        throw new Error(stderr);
    }

    return stdout.trim();
}

interface ErrorWithCode extends Error {
    code: string;
}

async function isPortAvailable(host: string, port: number): Promise<boolean> {
    try {
        const socket = createConnection({
            host,
            port
        });
        await once(socket, 'connect');
        socket.end();
    } catch (err) {
        if (err instanceof Error && (err as ErrorWithCode).code === 'ECONNREFUSED') {
            return true;
        }
    }

    return false;
}

export interface RedisServerDockerConfig {
    network: string;
    image: string;
    version: Array<number>;
}

export interface RedisServerDocker {
    host: string;
    dockerId: string;
}

// ".." cause it'll be in `./dist`
const DOCKER_FODLER_PATH = path.join(__dirname, '../docker');

async function spawnRedisServerDocker({ network, image, version }: RedisServerDockerConfig, serverArguments: Array<string>): Promise<RedisServerDocker> {
    const { stdout, stderr } = await execAsync(
        `docker run -d --network ${network} $(` +
            `docker build ${DOCKER_FODLER_PATH} -q ` +
            `--build-arg IMAGE=${image}:${version.join('.')} ` +
            `--build-arg REDIS_ARGUMENTS="--save ${serverArguments.join(' ')}"` +
        ')'
    );

    if (!stdout) {
        throw new Error(`docker run error - ${stderr}`);
    }

    const dockerId = stdout.trim(),
        host = await getContainerHost(network, dockerId);
    while (await isPortAvailable(host, 6379)) {
        await promiseTimeout(50);
    }

    return {
        host,
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

after('remove server dockers', () => {
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
    meetHost?: string
): Promise<RedisServerDocker> {
    const docker = await spawnRedisServerDocker(dockersConfig, [
            ...serverArguments,
            '--cluster-enabled',
            'yes',
            '--cluster-node-timeout',
            '5000'
        ]),
        client = RedisClient.create({ socket: docker });

    await client.connect();

    try {
        const range = [];
        for (let i = fromSlot; i < toSlot; i++) {
            range.push(i);
        }

        const promises: Array<Promise<unknown>> = [client.clusterAddSlots(range)];

        if (meetHost) {
            promises.push(client.clusterMeet(meetHost, 6379));
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

async function waitForClusterState<M extends RedisModules, S extends RedisScripts>(client: RedisClientType<M, S>): Promise<void> {
    while ((await client.clusterInfo()).state !== 'ok') {
        await promiseTimeout(50);
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
                i === 0 ? undefined : dockers[i - 1].host
            )
        );
    }

    const client = RedisClient.create({
        socket: dockers[0]
    });

    await client.connect();

    try {
        while ((await client.clusterInfo()).state !== 'ok') {
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

after('remove cluster dockers', () => {
    return Promise.all(
        [...RUNNING_CLUSTERS.values()].map(async dockersPromise => {
            return Promise.all(
                (await dockersPromise).map(({ dockerId }) => dockerRemove(dockerId))
            );
        })
    );
});
