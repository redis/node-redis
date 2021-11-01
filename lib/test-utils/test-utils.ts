import { RedisModules, RedisScripts } from '../commands';
import RedisClient, { RedisClientOptions, RedisClientType } from '../client';
import RedisCluster, { RedisClusterOptions, RedisClusterType } from '../cluster';
import { RedisServerDockerConfig, spawnRedisServer, spawnRedisCluster } from './dockers';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

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
}

interface TestsUtilsConfig {
    dockerImageName: string;
    dockerImageVersionArgument: string;
    defaultDockerVersion: string;
}

export default class TestUtils {
    static #getVersion(config: TestsUtilsConfig): Array<number> {
        return yargs(hideBin(process.argv))
            .option('redis-version', {
                type: 'string',
                default: config.defaultDockerVersion
            })
            .coerce(config.dockerImageVersionArgument, (arg: string) => {
                return arg.split('.').map(x => {
                    const value = Number(x);
                    if (Number.isNaN(value)) {
                        throw new TypeError(`${arg} is not a valid redis version`);
                    }

                    return value;
                });
            })
            .demandOption(config.dockerImageVersionArgument)
            .parseSync()[config.dockerImageVersionArgument];
    }

    readonly #DOCKER_IMAGE: RedisServerDockerConfig;

    constructor(config: TestsUtilsConfig) {
        this.#DOCKER_IMAGE = {
            image: config.dockerImageName,
            version: TestUtils.#getVersion(config)
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
    ): Mocha.Test {
        let dockerPromise: ReturnType<typeof spawnRedisServer>;
        if (this.isVersionGreaterThan(options.minimumDockerVersion)) {
            const dockerImage = this.#DOCKER_IMAGE;
            before(function () {
                this.timeout(5000);

                dockerPromise = spawnRedisServer(dockerImage, options.serverArguments);
                return dockerPromise;
            });
        }

        return it(title, async function() {
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

            try {
                await client.connect();
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
    ): Mocha.Test {
        let dockersPromise: ReturnType<typeof spawnRedisCluster>;
        if (this.isVersionGreaterThan(options.minimumDockerVersion)) {
            const dockerImage = this.#DOCKER_IMAGE;
            before(function () {
                this.timeout(10000);

                dockersPromise = spawnRedisCluster(dockerImage, options.serverArguments);
                return dockersPromise;
            });
        }

        return it(title, async function () {
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
