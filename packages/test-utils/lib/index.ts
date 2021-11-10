import { RedisModules, RedisScripts } from '@redis/client/lib/commands';
import RedisClient, { RedisClientOptions, RedisClientType } from '@redis/client/lib/client';
import RedisCluster, { RedisClusterOptions, RedisClusterType } from '@redis/client/lib/cluster';
import { RedisServerDockerConfig, spawnRedisServer, spawnRedisCluster } from './dockers';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

interface TestUtilsConfig<M extends RedisModules, S extends RedisScripts> {
    dockerImageName: string;
    dockerImageVersionArgument: string;
    defaultDockerVersion: string;
    defaultClientOptions?: Partial<RedisClientOptions<M, S>>;
    defaultClusterOptions?: Partial<RedisClusterOptions<M, S>>;
}

interface CommonTestOptions {
    minimumDockerVersion?: Array<number>;
}

interface ClientTestOptions<M extends RedisModules, S extends RedisScripts> extends CommonTestOptions {
    serverArguments: Array<string>;
    clientOptions?: Partial<RedisClientOptions<M, S>>;
    disableClientSetup?: boolean;
}

interface ClusterTestOptions<M extends RedisModules, S extends RedisScripts> extends CommonTestOptions {
    serverArguments: Array<string>;
    clusterConfiguration?: Partial<RedisClusterOptions<M, S>>;
    numberOfNodes?: number;
}

export default class TestUtils<M extends RedisModules, S extends RedisScripts> {
    static #getVersion(argumentName: string, defaultVersion: string): Array<number> {
        return yargs(hideBin(process.argv))
            .option(argumentName, {
                type: 'string',
                default: defaultVersion
            })
            .coerce(argumentName, (arg: string) => {
                return arg.split('.').map(x => {
                    const value = Number(x);
                    if (Number.isNaN(value)) {
                        throw new TypeError(`${arg} is not a valid redis version`);
                    }

                    return value;
                });
            })
            .demandOption(argumentName)
            .parseSync()[argumentName];
    }

    readonly #DOCKER_IMAGE: RedisServerDockerConfig;

    constructor(config: TestUtilsConfig<M, S>) {
        this.#DOCKER_IMAGE = {
            image: config.dockerImageName,
            version: TestUtils.#getVersion(config.dockerImageVersionArgument, config.defaultDockerVersion)
        };
    }

    isVersionGreaterThan(minimumVersion: Array<number> | undefined): boolean {
        if (minimumVersion === undefined) return true;

        const lastIndex = Math.min(this.#DOCKER_IMAGE.version.length, minimumVersion.length) - 1;
        for (let i = 0; i < lastIndex; i++) {
            if (this.#DOCKER_IMAGE.version[i] > minimumVersion[i]) {
                return true;
            } else if (minimumVersion[i] > this.#DOCKER_IMAGE.version[i]) {
                return false;
            }
        }

        return this.#DOCKER_IMAGE.version[lastIndex] >= minimumVersion[lastIndex];
    }

    isVersionGreaterThanHook(minimumVersion: Array<number> | undefined): void {
        const isVersionGreaterThan = this.isVersionGreaterThan.bind(this);
        before(function () {
            if (!isVersionGreaterThan(minimumVersion)) {
                return this.skip();
            }
        });
    }

    testWithClient<M extends RedisModules, S extends RedisScripts>(
        title: string,
        fn: (client: RedisClientType<M, S>) => Promise<unknown>,
        options: ClientTestOptions<M, S>
    ): void {
        let dockerPromise: ReturnType<typeof spawnRedisServer>;
        if (this.isVersionGreaterThan(options.minimumDockerVersion)) {
            const dockerImage = this.#DOCKER_IMAGE;
            before(function () {
                this.timeout(30000);

                dockerPromise = spawnRedisServer(dockerImage, options.serverArguments);
                return dockerPromise;
            });
        }

        it(title, async function() {
            if (!dockerPromise) return this.skip();

            const client = RedisClient.create({
                ...options?.clientOptions,
                socket: {
                    ...options?.clientOptions?.socket,
                    port: (await dockerPromise).port
                }
            });

            if (options.disableClientSetup) {
                return fn(client);
            }

            await client.connect();

            try {
                await client.flushAll();
                await fn(client);
            } finally {
                if (client.isOpen) {
                    await client.flushAll();
                    await client.disconnect();
                }
            }
        });
    }

    static async #clusterFlushAll<M extends RedisModules, S extends RedisScripts>(cluster: RedisClusterType<M, S>): Promise<void> {
        await Promise.all(
            cluster.getMasters().map(({ client }) => client.flushAll())
        );
    }

    testWithCluster<M extends RedisModules, S extends RedisScripts>(
        title: string,
        fn: (cluster: RedisClusterType<M, S>) => Promise<void>,
        options: ClusterTestOptions<M, S>
    ): void {
        let dockersPromise: ReturnType<typeof spawnRedisCluster>;
        if (this.isVersionGreaterThan(options.minimumDockerVersion)) {
            const dockerImage = this.#DOCKER_IMAGE;
            before(function () {
                this.timeout(30000);

                dockersPromise = spawnRedisCluster({
                    ...dockerImage,
                    numberOfNodes: options?.numberOfNodes
                }, options.serverArguments);
                return dockersPromise;
            });
        }

        it(title, async function () {
            if (!dockersPromise) return this.skip();

            const dockers = await dockersPromise,
                cluster = RedisCluster.create({
                    ...options.clusterConfiguration,
                    rootNodes: dockers.map(({ port }) => ({
                        socket: {
                            port
                        }
                    }))
                });


            await cluster.connect();

            try {
                await TestUtils.#clusterFlushAll(cluster);
                await fn(cluster);
            } finally {
                await TestUtils.#clusterFlushAll(cluster);
                await cluster.disconnect();
            }
        });
    }
}
