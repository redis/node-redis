import { RedisModules, RedisFunctions, RedisScripts } from '@redis/client/lib/commands';
import RedisClient, { RedisClientOptions, RedisClientType } from '@redis/client/lib/client';
import RedisCluster, { RedisClusterOptions, RedisClusterType } from '@redis/client/lib/cluster';
import { RedisSocketCommonOptions } from '@redis/client/lib/client/socket';
import { RedisServerDockerConfig, spawnRedisServer, spawnRedisCluster } from './dockers';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

interface TestUtilsConfig {
    dockerImageName: string;
    dockerImageVersionArgument: string;
    defaultDockerVersion?: string;
}

interface CommonTestOptions {
    minimumDockerVersion?: Array<number>;
}

interface ClientTestOptions<
    M extends RedisModules,
    F extends RedisFunctions,
    S extends RedisScripts
> extends CommonTestOptions {
    serverArguments: Array<string>;
    clientOptions?: Partial<Omit<RedisClientOptions<M, F, S>, 'socket'> & { socket: RedisSocketCommonOptions }>;
    disableClientSetup?: boolean;
}

interface ClusterTestOptions<
    M extends RedisModules,
    F extends RedisFunctions,
    S extends RedisScripts
> extends CommonTestOptions {
    serverArguments: Array<string>;
    clusterConfiguration?: Partial<RedisClusterOptions<M, F, S>>;
    numberOfMasters?: number;
    numberOfReplicas?: number;
}

interface Version {
    string: string;
    numbers: Array<number>;
}

export default class TestUtils {
    static #parseVersionNumber(version: string): Array<number> {
        if (version === 'latest' || version === 'edge') return [Infinity];

        const dashIndex = version.indexOf('-');
        return (dashIndex === -1 ? version : version.substring(0, dashIndex))
            .split('.')
            .map(x => {
                const value = Number(x);
                if (Number.isNaN(value)) {
                    throw new TypeError(`${version} is not a valid redis version`);
                }

                return value;
            });
    }

    static #getVersion(argumentName: string, defaultVersion = 'latest'): Version {
        return yargs(hideBin(process.argv))
            .option(argumentName, {
                type: 'string',
                default: defaultVersion
            })
            .coerce(argumentName, (version: string) => {
                return {
                    string: version,
                    numbers: TestUtils.#parseVersionNumber(version)
                };
            })
            .demandOption(argumentName)
            .parseSync()[argumentName];
    }

    readonly #VERSION_NUMBERS: Array<number>;
    readonly #DOCKER_IMAGE: RedisServerDockerConfig;

    constructor(config: TestUtilsConfig) {
        const { string, numbers } = TestUtils.#getVersion(config.dockerImageVersionArgument, config.defaultDockerVersion);
        this.#VERSION_NUMBERS = numbers;
        this.#DOCKER_IMAGE = {
            image: config.dockerImageName,
            version: string
        };
    }

    isVersionGreaterThan(minimumVersion: Array<number> | undefined): boolean {
        if (minimumVersion === undefined) return true;

        const lastIndex = Math.min(this.#VERSION_NUMBERS.length, minimumVersion.length) - 1;
        for (let i = 0; i < lastIndex; i++) {
            if (this.#VERSION_NUMBERS[i] > minimumVersion[i]) {
                return true;
            } else if (minimumVersion[i] > this.#VERSION_NUMBERS[i]) {
                return false;
            }
        }

        return this.#VERSION_NUMBERS[lastIndex] >= minimumVersion[lastIndex];
    }

    isVersionGreaterThanHook(minimumVersion: Array<number> | undefined): void {
        const isVersionGreaterThan = this.isVersionGreaterThan.bind(this);
        before(function () {
            if (!isVersionGreaterThan(minimumVersion)) {
                return this.skip();
            }
        });
    }

    testWithClient<
        M extends RedisModules,
        F extends RedisFunctions,
        S extends RedisScripts
    >(
        title: string,
        fn: (client: RedisClientType<M, F, S>) => unknown,
        options: ClientTestOptions<M, F, S>
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

    static async #clusterFlushAll<
        M extends RedisModules,
        F extends RedisFunctions,
        S extends RedisScripts
    >(cluster: RedisClusterType<M, F, S>): Promise<unknown> {
        return Promise.all(
            cluster.masters.map(async ({ client }) => {
                if (client) {
                    await (await client).flushAll();
                }
            })
        );
    }

    testWithCluster<
        M extends RedisModules,
        F extends RedisFunctions,
        S extends RedisScripts
    >(
        title: string,
        fn: (cluster: RedisClusterType<M, F, S>) => unknown,
        options: ClusterTestOptions<M, F, S>
    ): void {
        let dockersPromise: ReturnType<typeof spawnRedisCluster>;
        if (this.isVersionGreaterThan(options.minimumDockerVersion)) {
            const dockerImage = this.#DOCKER_IMAGE;
            before(function () {
                this.timeout(30000);

                dockersPromise = spawnRedisCluster({
                    ...dockerImage,
                    numberOfMasters: options?.numberOfMasters,
                    numberOfReplicas: options?.numberOfReplicas 
                }, options.serverArguments);
                return dockersPromise;
            });
        }

        it(title, async function () {
            if (!dockersPromise) return this.skip();

            const dockers = await dockersPromise,
                cluster = RedisCluster.create({
                    rootNodes: dockers.map(({ port }) => ({
                        socket: {
                            port
                        }
                    })),
                    minimizeConnections: true,
                    ...options.clusterConfiguration
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
