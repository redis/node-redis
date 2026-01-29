import {
  RedisModules,
  RedisFunctions,
  RedisScripts,
  RespVersions,
  TypeMapping,
  // CommandPolicies,
  createClient,
  createSentinel,
  RedisClientOptions,
  RedisClientType,
  RedisSentinelOptions,
  RedisSentinelType,
  RedisPoolOptions,
  RedisClientPoolType,
  createClientPool,
  createCluster,
  RedisClusterOptions,
  RedisClusterType
} from '@redis/client/index';
import { RedisNode } from '@redis/client/lib/sentinel/types'
import { spawnRedisServer, spawnRedisCluster, spawnRedisSentinel, RedisServerDockerOptions, RedisServerDocker, spawnSentinelNode, spawnRedisServerDocker, spawnTlsRedisServer, TlsConfig } from './dockers';
import { spawnRedisServer, spawnRedisCluster, spawnRedisSentinel, RedisServerDockerOptions, RedisServerDocker, spawnSentinelNode, spawnRedisServerDocker, spawnProxiedRedisServer } from './dockers';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { RedisProxy, getFreePortNumber } from './proxy/redis-proxy';


interface TestUtilsConfig {
  /**
   * The name of the Docker image to use for spawning Redis test instances.
   * This should be a valid Docker image name that contains a Redis server.
   *
   * @example 'redislabs/client-libs-test'
   */
  dockerImageName: string;

  /**
   * The command-line argument name used to specify the Docker image tag.
   * This argument can be passed when running tests / GH actions.
   *
   * @example
   * If set to 'redis-tag', you can run tests with:
   * ```bash
   * npm test -- --redis-tag="8.4"
   * ```
   */
  dockerImageTagArgument: string;

  /**
   * The command-line argument name used to specify the Redis version.
   * This is optional and used when the Docker tag doesn't contain a parseable version.
   * If not provided, the version will be parsed from the tag.
   *
   * @example
   * If set to 'redis-version', you can run tests with:
   * ```bash
   * npm test -- --redis-tag="custom-build" --redis-version="8.6"
   * ```
   * @optional
   */
  dockerImageVersionArgument?: string;

  /**
   * The default Docker version to use if no version is specified via command-line arguments.
   * Can be a string (e.g., '6.2', 'latest', 'edge') or an object with tag and version
   * for cases where the tag doesn't contain a parseable version.
   *
   * @example
   * // Simple string format
   * defaultDockerVersion: '8.4'
   *
   * // Object format for custom tags
   * defaultDockerVersion: { tag: 'custom-build-123', version: '8.6' }
   *
   * @optional
   * @default 'latest'
   */
  defaultDockerVersion?: string | { tag: string; version: string };
}
interface CommonTestOptions {
  serverArguments: Array<string>;
  minimumDockerVersion?: Array<number>;
  skipTest?: boolean;
}

interface ClientTestOptions<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> extends CommonTestOptions {
  clientOptions?: Partial<RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>>;
  disableClientSetup?: boolean;
}

interface TlsClientTestOptions<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> extends ClientTestOptions<M, F, S, RESP, TYPE_MAPPING> {
  tls?: TlsConfig;
}

interface SentinelTestOptions<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> extends CommonTestOptions {
  sentinelOptions?: Partial<RedisSentinelOptions<M, F, S, RESP, TYPE_MAPPING>>;
  clientOptions?: Partial<RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>>;
  scripts?: S;
  functions?: F;
  modules?: M;
  disableClientSetup?: boolean;
  replicaPoolSize?: number;
  masterPoolSize?: number;
  reserveClient?: boolean;
}

interface ClientPoolTestOptions<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> extends CommonTestOptions {
  clientOptions?: Partial<RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>>;
  poolOptions?: RedisPoolOptions;
}

interface ClusterTestOptions<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
  // POLICIES extends CommandPolicies
> extends CommonTestOptions {
  clusterConfiguration?: Partial<RedisClusterOptions<M, F, S, RESP, TYPE_MAPPING/*, POLICIES*/>>;
  numberOfMasters?: number;
  numberOfReplicas?: number;
  disableClusterSetup?: boolean;
}

interface AllTestOptions<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
  // POLICIES extends CommandPolicies
> {
  client: ClientTestOptions<M, F, S, RESP, TYPE_MAPPING>;
  cluster: ClusterTestOptions<M, F, S, RESP, TYPE_MAPPING/*, POLICIES*/>;
}

interface Version {
  tag: string;
  numbers: Array<number>;
}

export default class TestUtils {
  static parseVersionNumber(version: string): Array<number> {
    if (version === 'latest' || version === 'edge') return [Infinity];


    // Match complete version number patterns
    const versionMatch = version.match(/(^|\-)\d+(\.\d+)*($|\-)/);
    if (!versionMatch) {
      throw new TypeError(`${version} is not a valid redis version`);
    }

    // Extract just the numbers and dots between first and last dash (or start/end)
    const versionNumbers = versionMatch[0].replace(/^\-|\-$/g, '');

    return versionNumbers.split('.').map(x => {
      const value = Number(x);
      if (Number.isNaN(value)) {
        throw new TypeError(`${version} is not a valid redis version`);
      }
      return value;
    });
  }
  static #getVersion(
    tagArgumentName: string,
    versionArgumentName: string | undefined,
    defaultVersion: string | { tag: string; version: string } = 'latest'
  ): Version {
    const isObjectFormat = typeof defaultVersion !== 'string';
    const defaultTag = isObjectFormat ? defaultVersion.tag : defaultVersion;
    const defaultVersionString = isObjectFormat ? defaultVersion.version : undefined;

    const args = yargs(hideBin(process.argv))
      .option(tagArgumentName, {
        type: 'string',
        default: defaultTag,
        description: 'Docker image tag to use'
      })
      .option(versionArgumentName ?? 'redis-version', {
        type: 'string',
        description: 'Redis version (if not parseable from tag)'
      })
      .parseSync();

    const tag = args[tagArgumentName] as string;
    const explicitVersion = versionArgumentName ? args[versionArgumentName] as string | undefined : undefined;

    // Priority: 1) CLI --redis-version, 2) default version from object format, 3) parse from tag
    let versionToParse: string;
    if (explicitVersion) {
      versionToParse = explicitVersion;
    } else if (tag === defaultTag && defaultVersionString) {
      // Using default tag and we have an explicit version for it
      versionToParse = defaultVersionString;
    } else {
      versionToParse = tag;
    }

    return {
      tag,
      numbers: TestUtils.parseVersionNumber(versionToParse)
    };
  }

  readonly #VERSION_NUMBERS: Array<number>;
  readonly #DOCKER_IMAGE: RedisServerDockerOptions;

  /**
   * Cleans up non-default ACL users using a temporary client connection
   */
  static async cleanupAclUsers(port: number, clientOptions?: Partial<RedisClientOptions>): Promise<void> {
    const cleanupClient = createClient({
      ...clientOptions,
      socket: {
        ...clientOptions?.socket,
        port,
      },
    });

    try {
      await cleanupClient.connect();

      const users = await cleanupClient.aclUsers();

      for (const user of users) {
        if (user !== 'default') {
          await cleanupClient.aclDelUser(user);
        }
      }
    } finally {
      if (cleanupClient.isOpen) {
        cleanupClient.destroy();
      }
    }
  }

  constructor({ tag, numbers }: Version, dockerImageName: string) {
    this.#VERSION_NUMBERS = numbers;
    this.#DOCKER_IMAGE = {
      image: dockerImageName,
      version: tag,
      mode: "server"
    };
  }

  /**
   * Creates a new TestUtils instance from a configuration object.
   *
   * @param config - Configuration object containing Docker image and version settings
   * @param config.dockerImageName - The name of the Docker image to use for tests
   * @param config.dockerImageTagArgument - The command-line argument name for specifying Docker image tag
   * @param config.dockerImageVersionArgument - Optional command-line argument name for specifying Redis version
   * @param config.defaultDockerVersion - Optional default Docker version if not specified via arguments
   * @returns A new TestUtils instance configured with the provided settings
   */
  public static createFromConfig(config: TestUtilsConfig) {
    return new TestUtils(
      TestUtils.#getVersion(
        config.dockerImageTagArgument,
        config.dockerImageVersionArgument,
        config.defaultDockerVersion
      ),
      config.dockerImageName
    );
  }

  isVersionGreaterThan(minimumVersion: Array<number> | undefined): boolean {
    if (minimumVersion === undefined) return true;
    return TestUtils.compareVersions(this.#VERSION_NUMBERS, minimumVersion) >= 0;
  }

  isVersionGreaterThanHook(minimumVersion: Array<number> | undefined): void {
    const isVersionGreaterThanHook = this.isVersionGreaterThan.bind(this);
    const versionNumber = this.#VERSION_NUMBERS.join('.');
    const minimumVersionString = minimumVersion?.join('.');
    before(function () {
      if (!isVersionGreaterThanHook(minimumVersion)) {
        console.warn(`TestUtils: Version ${versionNumber} is less than minimum version ${minimumVersionString}, skipping test`);
        return this.skip();
      }
    });
  }

  isVersionInRange(minVersion: Array<number>, maxVersion: Array<number>): boolean {
    return TestUtils.compareVersions(this.#VERSION_NUMBERS, minVersion) >= 0 &&
      TestUtils.compareVersions(this.#VERSION_NUMBERS, maxVersion) <= 0
  }

  /**
   * Compares two semantic version arrays and returns:
   * -1 if version a is less than version b
   *  0 if version a equals version b
   *  1 if version a is greater than version b
   *
   * @param a First version array
   * @param b Second version array
   * @returns -1 | 0 | 1
   */
  static compareVersions(a: Array<number>, b: Array<number>): -1 | 0 | 1 {
    const maxLength = Math.max(a.length, b.length);

    const paddedA = [...a, ...Array(maxLength - a.length).fill(0)];
    const paddedB = [...b, ...Array(maxLength - b.length).fill(0)];

    for (let i = 0; i < maxLength; i++) {
      if (paddedA[i] > paddedB[i]) return 1;
      if (paddedA[i] < paddedB[i]) return -1;
    }

    return 0;
  }

  testWithClient<
    M extends RedisModules = {},
    F extends RedisFunctions = {},
    S extends RedisScripts = {},
    RESP extends RespVersions = 2,
    TYPE_MAPPING extends TypeMapping = {}
  >(
    title: string,
    fn: (client: RedisClientType<M, F, S, RESP, TYPE_MAPPING>) => unknown,
    options: ClientTestOptions<M, F, S, RESP, TYPE_MAPPING>
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
      if (options.skipTest) return this.skip();
      if (!dockerPromise) return this.skip();

      const client = createClient({
        ...options.clientOptions,
        socket: {
          ...options.clientOptions?.socket,
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

  /**
   * Runs a test using a TLS-enabled Redis client.
   * Automatically spawns a TLS-enabled Redis container with both TLS and non-TLS ports,
   * extracts certificates, and configures the TLS client.
   *
   * @param title - Test title
   * @param fn - Test function receiving the TLS client and port information
   * @param options - TLS client test options
   */
  testWithTlsClient<
    M extends RedisModules = {},
    F extends RedisFunctions = {},
    S extends RedisScripts = {},
    RESP extends RespVersions = 2,
    TYPE_MAPPING extends TypeMapping = {},
  >(
    title: string,
    fn: (
      client: RedisClientType<M, F, S, RESP, TYPE_MAPPING>,
      ports: { port: number; tlsPort: number },
    ) => unknown,
    options: TlsClientTestOptions<M, F, S, RESP, TYPE_MAPPING>,
  ): void {
    let dockerPromise: ReturnType<typeof spawnTlsRedisServer>;
    if (this.isVersionGreaterThan(options.minimumDockerVersion)) {
      const dockerImage = this.#DOCKER_IMAGE;
      before(function () {
        this.timeout(60000); // TLS setup takes longer

        dockerPromise = spawnTlsRedisServer(
          dockerImage,
          options.serverArguments,
          options.tls,
        );
        return dockerPromise;
      });
    }

    it(title, async function () {
      if (options.skipTest) return this.skip();
      if (!dockerPromise) return this.skip();

      const docker = await dockerPromise;

      // Create TLS client
      const client = createClient({
        ...options.clientOptions,
        socket: {
          ...options.clientOptions?.socket,
          port: docker.tlsPort,
          tls: true,
          ca: docker.certs.ca,
          cert: docker.certs.cert,
          key: docker.certs.key,
        },
      });

      const ports = { port: docker.port, tlsPort: docker.tlsPort };

      if (options.disableClientSetup) {
        return fn(client, ports);
      }

      await client.connect();

      try {
        await client.flushAll();
        await fn(client, ports);
      } finally {
        if (client.isOpen) {
          await client.flushAll();
          client.destroy();
        }
        // Clean up any leftover ACL users from previous test runs
        // ! This MUST be done last because it will disconnect the client !
        await TestUtils.cleanupAclUsers(docker.port, options.clientOptions);
  testWithProxiedCluster<
    M extends RedisModules = {},
    F extends RedisFunctions = {},
    S extends RedisScripts = {},
    RESP extends RespVersions = 2,
    TYPE_MAPPING extends TypeMapping = {}
  >(
    title: string,
    fn: (proxiedClusterClient: RedisClusterType<M, F, S, RESP, TYPE_MAPPING>, proxyUrl: string) => unknown,
    options: Omit<ClusterTestOptions<M, F, S, RESP, TYPE_MAPPING>, 'numberOfReplicas' | 'minimumDockerVersion' | 'serverArguments'>
  ) {
    let spawnPromise: ReturnType<typeof spawnProxiedRedisServer>;
    before(function () {
      this.timeout(30000);
      spawnPromise = spawnProxiedRedisServer({ nOfProxies: options.numberOfMasters ?? 3, defaultInterceptors: ['cluster', 'hitless'] });
    });

    it(title, async function () {
      if (!spawnPromise) return this.skip();
      const { ports } = await spawnPromise;

      const cluster = createCluster({
        rootNodes: ports.map(port => ({
          socket: {
            port
          }
        })),
        minimizeConnections: options.clusterConfiguration?.minimizeConnections ?? true,
        ...options.clusterConfiguration
      });

      if(options.disableClusterSetup) {
        return fn(cluster, 'hh');
      }

      await cluster.connect();

      try {
        await TestUtils.#clusterFlushAll(cluster);
        await fn(cluster, 'hi');
      } finally {
        await TestUtils.#clusterFlushAll(cluster);
        cluster.destroy();
      }
    });
  }

  testWithProxiedClient(
    title: string,
    fn: (proxiedClient: RedisClientType<any, any, any, any, any>, proxy: RedisProxy) => unknown,
    options: ClientTestOptions<any, any, any, any, any>
  ) {

    this.testWithClient(title, async (client) => {
      const freePort = await getFreePortNumber()
      const socketOptions = client?.options?.socket;
      const proxy = new RedisProxy({
        listenHost: '127.0.0.1',
        listenPort: freePort,
        //@ts-ignore
        targetPort: socketOptions.port,
        //@ts-ignore
        targetHost: socketOptions.host ?? '127.0.0.1',
        enableLogging: true
      });

      await proxy.start();
      const proxyClient = client.duplicate({
        socket: {
          port: proxy.config.listenPort,
          host: proxy.config.listenHost
        },
      });

      await proxyClient.connect();

      try {
        await fn(proxyClient, proxy);
      } finally {
        await proxyClient.destroy();
        await proxy.stop()
      }
    }, options);
  }
  testWithClientSentinel<
    M extends RedisModules = {},
    F extends RedisFunctions = {},
    S extends RedisScripts = {},
    RESP extends RespVersions = 2,
    TYPE_MAPPING extends TypeMapping = {}
  >(
    title: string,
    fn: (sentinel: RedisSentinelType<M, F, S, RESP, TYPE_MAPPING>) => unknown,
    options: SentinelTestOptions<M, F, S, RESP, TYPE_MAPPING>
  ): void {
    let dockerPromises: ReturnType<typeof spawnRedisSentinel>;

    const passIndex = options.serverArguments.indexOf('--requirepass')+1;
    let password: string | undefined = undefined;
    if (passIndex != 0) {
      password = options.serverArguments[passIndex];
    }

    if (this.isVersionGreaterThan(options.minimumDockerVersion)) {
      const dockerImage = this.#DOCKER_IMAGE;
      before(function () {
        this.timeout(30000);
        dockerPromises = spawnRedisSentinel(dockerImage, options.serverArguments);
        return dockerPromises;
      });
    }

    it(title, async function () {
      this.timeout(30000);
      if (options.skipTest) return this.skip();
      if (!dockerPromises) return this.skip();


      const promises = await dockerPromises;
      const rootNodes: Array<RedisNode> = promises.map(promise => ({
        host: "127.0.0.1",
        port: promise.port
      }));


      const sentinel = createSentinel({
        name: 'mymaster',
        sentinelRootNodes: rootNodes,
        nodeClientOptions: {
          commandOptions: options.clientOptions?.commandOptions,
          password: password || undefined,
        },
        sentinelClientOptions: {
          password: password || undefined,
        },
        replicaPoolSize: options?.replicaPoolSize || 0,
        scripts: options?.scripts || {},
        modules: options?.modules || {},
        functions: options?.functions || {},
        masterPoolSize: options?.masterPoolSize || undefined,
        reserveClient: options?.reserveClient || false,
        ...options?.sentinelOptions
      }) as RedisSentinelType<M, F, S, RESP, TYPE_MAPPING>;

      if (options.disableClientSetup) {
        return fn(sentinel);
      }

      await sentinel.connect();

      try {
        await sentinel.flushAll();
        await fn(sentinel);
      } finally {
        if (sentinel.isOpen) {
          await sentinel.flushAll();
          sentinel.destroy();
        }
      }
    });
  }

  testWithClientIfVersionWithinRange<
    M extends RedisModules = {},
    F extends RedisFunctions = {},
    S extends RedisScripts = {},
    RESP extends RespVersions = 2,
    TYPE_MAPPING extends TypeMapping = {}
  >(
    range: ([minVersion: Array<number>, maxVersion: Array<number>] | [minVersion: Array<number>, 'LATEST']),
    title: string,
    fn: (client: RedisClientType<M, F, S, RESP, TYPE_MAPPING>) => unknown,
    options: ClientTestOptions<M, F, S, RESP, TYPE_MAPPING>
  ): void {

    if (this.isVersionInRange(range[0], range[1] === 'LATEST' ? [Infinity, Infinity, Infinity] : range[1])) {
      return this.testWithClient(`${title}  [${range[0].join('.')}] - [${(range[1] === 'LATEST') ? range[1] : range[1].join(".")}] `, fn, options)
    } else {
      console.warn(`Skipping test ${title} because server version ${this.#VERSION_NUMBERS.join('.')} is not within range ${range[0].join(".")} - ${range[1] !== 'LATEST' ? range[1].join(".") : 'LATEST'}`)
    }
  }

  testWithClienSentineltIfVersionWithinRange<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 2,
  TYPE_MAPPING extends TypeMapping = {}
  >(
    range: ([minVersion: Array<number>, maxVersion: Array<number>] | [minVersion: Array<number>, 'LATEST']),
    title: string,
    fn: (sentinel: RedisSentinelType<M, F, S, RESP, TYPE_MAPPING>) => unknown,
    options: SentinelTestOptions<M, F, S, RESP, TYPE_MAPPING>
  ): void {

    if (this.isVersionInRange(range[0], range[1] === 'LATEST' ? [Infinity, Infinity, Infinity] : range[1])) {
      return this.testWithClientSentinel(`${title}  [${range[0].join('.')}] - [${(range[1] === 'LATEST') ? range[1] : range[1].join(".")}] `, fn, options)
    } else {
      console.warn(`Skipping test ${title} because server version ${this.#VERSION_NUMBERS.join('.')} is not within range ${range[0].join(".")} - ${range[1] !== 'LATEST' ? range[1].join(".") : 'LATEST'}`)
    }
  }

  testWithClientPool<
    M extends RedisModules = {},
    F extends RedisFunctions = {},
    S extends RedisScripts = {},
    RESP extends RespVersions = 2,
    TYPE_MAPPING extends TypeMapping = {}
  >(
    title: string,
    fn: (client: RedisClientPoolType<M, F, S, RESP, TYPE_MAPPING>) => unknown,
    options: ClientPoolTestOptions<M, F, S, RESP, TYPE_MAPPING>
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
      if (options.skipTest) return this.skip();
      if (!dockerPromise) return this.skip();

      const pool = createClientPool({
        ...options.clientOptions,
        socket: {
          ...options.clientOptions?.socket,
          port: (await dockerPromise).port
        }
      }, options.poolOptions);

      await pool.connect();

      try {
        await pool.flushAll();
        await fn(pool);
      } finally {
        await pool.flushAll();
        pool.close();
      }
    });
  }

  static async #clusterFlushAll<
    M extends RedisModules,
    F extends RedisFunctions,
    S extends RedisScripts,
    RESP extends RespVersions,
    TYPE_MAPPING extends TypeMapping
    // POLICIES extends CommandPolicies
  >(cluster: RedisClusterType<M, F, S, RESP, TYPE_MAPPING/*, POLICIES*/>): Promise<unknown> {
    return Promise.all(
      cluster.masters.map(async master => {
        if (master.client) {
          await (await cluster.nodeClient(master)).flushAll();
        }
      })
    );
  }

  testWithCluster<
    M extends RedisModules = {},
    F extends RedisFunctions = {},
    S extends RedisScripts = {},
    RESP extends RespVersions = 2,
    TYPE_MAPPING extends TypeMapping = {}
    // POLICIES extends CommandPolicies = {}
  >(
    title: string,
    fn: (cluster: RedisClusterType<M, F, S, RESP, TYPE_MAPPING/*, POLICIES*/>) => unknown,
    options: ClusterTestOptions<M, F, S, RESP, TYPE_MAPPING/*, POLICIES*/>
  ): void {
    let dockersPromise: ReturnType<typeof spawnRedisCluster>;
    if (this.isVersionGreaterThan(options.minimumDockerVersion)) {
      const dockerImage = this.#DOCKER_IMAGE;
      before(function () {
        this.timeout(30000);

        dockersPromise = spawnRedisCluster({
          ...dockerImage,
          numberOfMasters: options.numberOfMasters,
          numberOfReplicas: options.numberOfReplicas
        }, options.serverArguments,
          options.clusterConfiguration?.defaults);
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
          minimizeConnections: options.clusterConfiguration?.minimizeConnections ?? true,
          ...options.clusterConfiguration
        });

      if(options.disableClusterSetup) {
        return fn(cluster);
      }

      await cluster.connect();

      try {
        await TestUtils.#clusterFlushAll(cluster);
        await fn(cluster);
      } finally {
        await TestUtils.#clusterFlushAll(cluster);
        cluster.destroy();
      }
    });
  }

  testAll<
    M extends RedisModules = {},
    F extends RedisFunctions = {},
    S extends RedisScripts = {},
    RESP extends RespVersions = 2,
    TYPE_MAPPING extends TypeMapping = {}
    // POLICIES extends CommandPolicies = {}
  >(
    title: string,
    fn: (client: RedisClientType<M, F, S, RESP, TYPE_MAPPING> | RedisClusterType<M, F, S, RESP, TYPE_MAPPING/*, POLICIES*/>) => unknown,
    options: AllTestOptions<M, F, S, RESP, TYPE_MAPPING/*, POLICIES*/>
  ) {
    this.testWithClient(`client.${title}`, fn, options.client);
    this.testWithCluster(`cluster.${title}`, fn, options.cluster);
  }

  /**
   * Tests with both a regular client and a cluster client, automatically generating the cluster
   * configuration from the client configuration.
   *
   * Modules, functions, and scripts are placed at the cluster level, while other client options
   * (password, socket, etc.) are placed under cluster defaults.
   *
   * @param title - The test title
   * @param fn - The test function
   * @param clientOptions - Client test options (cluster config will be auto-generated)
   */
  testAllAuto<
    M extends RedisModules = {},
    F extends RedisFunctions = {},
    S extends RedisScripts = {},
    RESP extends RespVersions = 2,
    TYPE_MAPPING extends TypeMapping = {}
    // POLICIES extends CommandPolicies = {}
  >(
    title: string,
    fn: (client: RedisClientType<M, F, S, RESP, TYPE_MAPPING> | RedisClusterType<M, F, S, RESP, TYPE_MAPPING/*, POLICIES*/>) => unknown,
    clientOptions: ClientTestOptions<M, F, S, RESP, TYPE_MAPPING>
  ) {
    this.testWithClient(`client.${title}`, fn, clientOptions);

    // Auto-generate cluster configuration from client options
    const clusterOptions: ClusterTestOptions<M, F, S, RESP, TYPE_MAPPING> = {
      serverArguments: clientOptions.serverArguments,
      minimumDockerVersion: clientOptions.minimumDockerVersion,
      skipTest: clientOptions.skipTest,
      clusterConfiguration: {}
    };

    if (clientOptions.clientOptions) {
      const { modules, functions, scripts, ...clientDefaults } = clientOptions.clientOptions as any;

      if (modules) {
        clusterOptions.clusterConfiguration!.modules = modules;
      }
      if (functions) {
        clusterOptions.clusterConfiguration!.functions = functions;
      }
      if (scripts) {
        clusterOptions.clusterConfiguration!.scripts = scripts;
      }

      // Other client options go under defaults
      if (Object.keys(clientDefaults).length > 0) {
        clusterOptions.clusterConfiguration!.defaults = clientDefaults;
      }
    }

    this.testWithCluster(`cluster.${title}`, fn, clusterOptions);
  }


  spawnRedisServer<
    M extends RedisModules = {},
    F extends RedisFunctions = {},
    S extends RedisScripts = {},
    RESP extends RespVersions = 2,
    TYPE_MAPPING extends TypeMapping = {}
    // POLICIES extends CommandPolicies = {}
  >(
    options: ClientPoolTestOptions<M, F, S, RESP, TYPE_MAPPING>
  ): Promise<RedisServerDocker> {
    return spawnRedisServerDocker(this.#DOCKER_IMAGE, options.serverArguments)
  }

  async spawnRedisSentinels<
    M extends RedisModules = {},
    F extends RedisFunctions = {},
    S extends RedisScripts = {},
    RESP extends RespVersions = 2,
    TYPE_MAPPING extends TypeMapping = {}
    // POLICIES extends CommandPolicies = {}
  >(
    options: ClientPoolTestOptions<M, F, S, RESP, TYPE_MAPPING>,
    masterPort: number,
    sentinelName: string,
    count: number
  ): Promise<Array<RedisServerDocker>> {
    const sentinels: Array<RedisServerDocker> = [];
    for (let i = 0; i < count; i++) {
      const appPrefix = 'sentinel-config-dir';
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), appPrefix));

      sentinels.push(await spawnSentinelNode(this.#DOCKER_IMAGE, options.serverArguments, masterPort, sentinelName, tmpDir))

      if (tmpDir) {
        fs.rmSync(tmpDir, { recursive: true });
      }
    }

    return sentinels
  }
}
