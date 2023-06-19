import {
  RedisModules,
  RedisFunctions,
  RedisScripts,
  RespVersions,
  createClient,
  RedisClientOptions,
  RedisClientType,
  createCluster,
  RedisClusterOptions,
  RedisClusterType
} from '@redis/client/index';
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
  S extends RedisScripts,
  RESP extends RespVersions
> extends CommonTestOptions {
  serverArguments: Array<string>;
  clientOptions?: Partial<RedisClientOptions<M, F, S, RESP>>;
  disableClientSetup?: boolean;
}

interface ClusterTestOptions<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions
> extends CommonTestOptions {
  serverArguments: Array<string>;
  clusterConfiguration?: Partial<RedisClusterOptions<M, F, S, RESP>>;
  numberOfMasters?: number;
  numberOfReplicas?: number;
}

interface AllTestOptions<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions
> {
  client: ClientTestOptions<M, F, S, RESP>;
  cluster: ClusterTestOptions<M, F, S, RESP>;
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
    M extends RedisModules = {},
    F extends RedisFunctions = {},
    S extends RedisScripts = {},
    RESP extends RespVersions = 2
  >(
    title: string,
    fn: (client: RedisClientType<M, F, S, RESP>) => unknown,
    options: ClientTestOptions<M, F, S, RESP>
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

    it(title, async function () {
      if (!dockerPromise) return this.skip();

      const client = createClient({
        ...options?.clientOptions,
        socket: {
          ...options?.clientOptions?.socket,
          // TODO
          // @ts-ignore
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
          client.destroy();
        }
      }
    });
  }

  static async #clusterFlushAll<
    M extends RedisModules,
    F extends RedisFunctions,
    S extends RedisScripts,
    RESP extends RespVersions
  >(cluster: RedisClusterType<M, F, S, RESP>): Promise<unknown> {
    return Promise.all(
      cluster.masters.map(async ({ client }) => {
        if (client) {
          await (await client).flushAll();
        }
      })
    );
  }

  testWithCluster<
    M extends RedisModules = {},
    F extends RedisFunctions = {},
    S extends RedisScripts = {},
    RESP extends RespVersions = 2
  >(
    title: string,
    fn: (cluster: RedisClusterType<M, F, S, RESP>) => unknown,
    options: ClusterTestOptions<M, F, S, RESP>
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
        cluster = createCluster({
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

  testAll<
    M extends RedisModules = {},
    F extends RedisFunctions = {},
    S extends RedisScripts = {},
    RESP extends RespVersions = 2
  >(
    title: string,
    fn: (client: RedisClientType<M, F, S, RESP> | RedisClusterType<M, F, S, RESP>) => unknown,
    options: AllTestOptions<M, F, S, RESP>
  ) {
    this.testWithClient(`client.${title}`, fn, options.client);
    this.testWithCluster(`cluster.${title}`, fn, options.cluster);
  }
}
