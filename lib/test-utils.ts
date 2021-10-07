import { strict as assert } from 'assert';
import RedisClient, { RedisClientOptions, RedisClientType } from './client';
import { execSync, spawn } from 'child_process';
import { once } from 'events';
import { RedisSocketOptions } from './socket';
import which from 'which';
import { SinonSpy } from 'sinon';
import RedisCluster, { RedisClusterOptions, RedisClusterType } from './cluster';
import { promises as fs } from 'fs';
import { Context as MochaContext } from 'mocha';
import { promiseTimeout } from './utils';
import { RedisModules } from './commands';
import { RedisLuaScripts } from './lua-script';

type RedisVersion = [major: number, minor: number, patch: number];

type PartialRedisVersion = RedisVersion | [major: number, minor: number] | [major: number];

const REDIS_PATH = which.sync('redis-server');
export const REDIS_VERSION = getRedisVersion();

function getRedisVersion(): RedisVersion {
    const raw = execSync(`${REDIS_PATH} -v`).toString(),
        indexOfVersion = raw.indexOf('v=');

    if (indexOfVersion === -1) {
        throw new Error('Unknown redis version');
    }

    const start = indexOfVersion + 2;
    return raw.substring(
        start,
        raw.indexOf(' ', start)
    ).split('.', 3).map(Number) as RedisVersion;
}

export function isRedisVersionGreaterThan(minimumVersion: PartialRedisVersion | undefined): boolean {
    if (minimumVersion === undefined) return true;

    const lastIndex = minimumVersion.length - 1;
    for (let i = 0; i < lastIndex; i++) {
        if (REDIS_VERSION[i] > minimumVersion[i]) {
            return true;
        } else if (minimumVersion[i] > REDIS_VERSION[i]) {
            return false;
        }
    }

    return REDIS_VERSION[lastIndex] >= minimumVersion[lastIndex];
}

export enum TestRedisServers {
    OPEN,
    PASSWORD
}

export const TEST_REDIS_SERVERS: Record<TestRedisServers, RedisClientOptions<RedisModules, RedisLuaScripts>> = <any>{};

export enum TestRedisClusters {
    OPEN
}

export const TEST_REDIS_CLUSTERES: Record<TestRedisClusters, RedisClusterOptions<RedisModules, RedisLuaScripts>> = <any>{};

let port = 6379;

interface SpawnRedisServerResult {
    port: number;
    cleanup: () => Promise<void>;
}

async function spawnRedisServer(args?: Array<string>): Promise<SpawnRedisServerResult> {
    const currentPort = port++,
        process = spawn(REDIS_PATH, [
            '--save',
            '',
            '--port',
            currentPort.toString(),
            ...(args ?? [])
        ]);

    process
        .once('error', err => console.error('Redis process error', err))
        .once('close', code => console.error(`Redis process closed unexpectedly with code ${code}`));

    for await (const chunk of process.stdout) {
        if (chunk.toString().includes('Ready to accept connections')) {
            break;
        }
    }

    if (process.exitCode !== null) {
        throw new Error('Error while spawning redis server');
    }

    return {
        port: currentPort,
        async cleanup(): Promise<void> {
            process.removeAllListeners('close');
            assert.ok(process.kill());
            await once(process, 'close');
        }
    };
}

async function spawnGlobalRedisServer(args?: Array<string>): Promise<number> {
    const { port, cleanup } = await spawnRedisServer(args);
    after(cleanup);
    return port;
}

const SLOTS = 16384;

interface SpawnRedisClusterNodeResult extends SpawnRedisServerResult {
    client: RedisClientType
}

async function spawnRedisClusterNode(
    type: TestRedisClusters | null,
    nodeIndex: number,
    fromSlot: number,
    toSlot: number,
    args?: Array<string>
): Promise<SpawnRedisClusterNodeResult> {
    const clusterConfigFile = `/tmp/${type}-${nodeIndex}.conf`,
        { port, cleanup: originalCleanup } = await spawnRedisServer([
            '--cluster-enabled',
            'yes',
            '--cluster-node-timeout',
            '5000',
            '--cluster-config-file',
            clusterConfigFile,
            ...(args ?? [])
        ]);

    const client = RedisClient.create({
        socket: {
            port
        }
    });

    await client.connect();

    const range = [];
    for (let i = fromSlot; i < toSlot; i++) {
        range.push(i);
    }

    await Promise.all([
        client.clusterFlushSlots(),
        client.clusterAddSlots(range)
    ]);

    return {
        port,
        async cleanup(): Promise<void> {
            await originalCleanup();

            try {
                await fs.unlink(clusterConfigFile);
            } catch (err: any) {
                if (err.code === 'ENOENT') return;

                throw err;
            }
        },
        client
    };
}

export async function spawnRedisCluster(type: TestRedisClusters | null, numberOfNodes: number, args?: Array<string>): Promise<Array<SpawnRedisServerResult>> {
    const spawnPromises = [],
        slotsPerNode = Math.floor(SLOTS / numberOfNodes);
    for (let i = 0; i < numberOfNodes; i++) {
        const fromSlot = i * slotsPerNode;
        spawnPromises.push(
            spawnRedisClusterNode(
                type,
                i,
                fromSlot,
                i === numberOfNodes - 1 ? SLOTS : fromSlot + slotsPerNode,
                args
            )
        );
    }

    const spawnResults = await Promise.all(spawnPromises),
        meetPromises = [];
    for (let i = 1; i < spawnResults.length; i++) {
        meetPromises.push(
            spawnResults[i].client.clusterMeet(
                '127.0.0.1',
                spawnResults[i - 1].port
            )
        );
    }

    await Promise.all(meetPromises);

    while (!(await clusterIsReady(spawnResults))) {
        await promiseTimeout(100);
    }

    await Promise.all(
        spawnResults.map(result => result.client.disconnect())
    );

    return spawnResults;
}

async function clusterIsReady(spawnResults: Array<SpawnRedisClusterNodeResult>): Promise<boolean> {
    const nodesClusetrInfo = await Promise.all(
        spawnResults.map(result => result.client.clusterInfo())
    );

    return nodesClusetrInfo.every(({ state }) => state === 'ok');
}

export async function spawnGlobalRedisCluster(type: TestRedisClusters | null, numberOfNodes: number, args?: Array<string>): Promise<Array<number>> {
    const results = await spawnRedisCluster(type, numberOfNodes, args);

    after(() => Promise.all(
        results.map(({ cleanup }) => cleanup())
    ));

    return results.map(({ port }) => port);
}

async function spawnOpenServer(): Promise<void> {
    TEST_REDIS_SERVERS[TestRedisServers.OPEN] = {
        socket: {
            port: await spawnGlobalRedisServer()
        }
    };
}

async function spawnPasswordServer(): Promise<void> {
    TEST_REDIS_SERVERS[TestRedisServers.PASSWORD] = {
        socket: {
            port: await spawnGlobalRedisServer(['--requirepass', 'password']),
        },
        password: 'password'
    };

    if (isRedisVersionGreaterThan([6])) {
        TEST_REDIS_SERVERS[TestRedisServers.PASSWORD].username = 'default';
    }
}

async function spawnOpenCluster(): Promise<void> {
    TEST_REDIS_CLUSTERES[TestRedisClusters.OPEN] = {
        rootNodes: (await spawnGlobalRedisCluster(TestRedisClusters.OPEN, 3)).map(port => ({
            socket: {
                port
            }
        }))
    };
}

before(function () {
    this.timeout(10000);

    return Promise.all([
        spawnOpenServer(),
        spawnPasswordServer(),
        spawnOpenCluster()
    ]);
});

interface RedisTestOptions {
    minimumRedisVersion?: PartialRedisVersion;
}

export function handleMinimumRedisVersion(mochaContext: MochaContext, minimumVersion: PartialRedisVersion | undefined): boolean {
    if (isRedisVersionGreaterThan(minimumVersion)) {
        return false;
    }

    mochaContext.skip();
    return true;
}

export function describeHandleMinimumRedisVersion(minimumVersion: PartialRedisVersion): void {
    before(function () {
        handleMinimumRedisVersion(this, minimumVersion);
    });
}

export function itWithClient(
    type: TestRedisServers,
    title: string,
    fn: (client: RedisClientType) => Promise<void>,
    options?: RedisTestOptions
): void {
    it(title, async function () {
        if (handleMinimumRedisVersion(this, options?.minimumRedisVersion)) return;

        const client = RedisClient.create(TEST_REDIS_SERVERS[type]);

        await client.connect();

        try {
            await client.flushAll();
            await fn(client);
        } finally {
            await client.flushAll();
            await client.disconnect();
        }
    });
}

export function itWithCluster(
    type: TestRedisClusters,
    title: string,
    fn: (cluster: RedisClusterType) => Promise<void>,
    options?: RedisTestOptions
): void {
    it(title, async function () {
        if (handleMinimumRedisVersion(this, options?.minimumRedisVersion)) return;

        const cluster = RedisCluster.create(TEST_REDIS_CLUSTERES[type]);

        await cluster.connect();

        try {
            await clusterFlushAll(cluster);
            await fn(cluster);
        } finally {
            await clusterFlushAll(cluster);
            await cluster.disconnect();
        }
    });
}

export function itWithDedicatedCluster(title: string, fn: (cluster: RedisClusterType) => Promise<void>): void {
    it(title, async function () {
        this.timeout(10000);

        const spawnResults = await spawnRedisCluster(null, 3),
            cluster = RedisCluster.create({
                rootNodes: [{
                    socket: {
                        port: spawnResults[0].port
                    }
                }]
            });

        await cluster.connect();

        try {
            await fn(cluster);
        } finally {
            await cluster.disconnect();

            for (const { cleanup } of spawnResults) {
                await cleanup();
            }
        }
    });
}

async function clusterFlushAll(cluster: RedisCluster): Promise<void> {
    await Promise.all(
        cluster.getMasters().map(({ client }) => client.flushAll())
    );
}

export async function waitTillBeenCalled(spy: SinonSpy): Promise<void> {
    const start = process.hrtime.bigint(),
        calls = spy.callCount;

    do {
        if (process.hrtime.bigint() - start > 1_000_000_000) {
            throw new Error('Waiting for more than 1 second');
        }

        await promiseTimeout(1);
    } while (spy.callCount === calls)
}
