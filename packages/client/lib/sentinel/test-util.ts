import { createConnection, Socket } from 'node:net';
import { setTimeout } from 'node:timers/promises';
import { once } from 'node:events';
import { promisify } from 'node:util';
import { exec } from 'node:child_process';
import { RedisSentinelOptions, RedisSentinelType } from './types';
import RedisClient, {RedisClientType} from '../client';
import RedisSentinel from '.';
import { RedisArgument, RedisFunctions, RedisModules, RedisScripts, RespVersions, TypeMapping } from '../RESP/types';
const execAsync = promisify(exec);
import RedisSentinelModule from './module'
import TestUtils from '@redis/test-utils';
import { DEBUG_MODE_ARGS } from '../test-utils'
interface ErrorWithCode extends Error {
  code: string;
}

async function isPortAvailable(port: number): Promise<boolean> {
  var socket: Socket | undefined = undefined;
  try {
    socket = createConnection({ port });
    await once(socket, 'connect');
  } catch (err) {
    if (err instanceof Error && (err as ErrorWithCode).code === 'ECONNREFUSED') {
      return true;
    }
  } finally {
    if (socket !== undefined) {
      socket.end();
    }
  }

  return false;
}

const portIterator = (async function* (): AsyncIterableIterator<number> {
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

abstract class DockerBase {
  async spawnRedisServerDocker({ image, version }: RedisServerDockerConfig, serverArguments: Array<string>, environment?: string): Promise<RedisServerDocker> {
    const port = (await portIterator.next()).value;
    let cmdLine = `docker run --init -d --network host `;
    if (environment !== undefined) {
      cmdLine += `-e ${environment} `;
    }
    cmdLine += `${image}:${version} ${serverArguments.join(' ')}`;
    cmdLine = cmdLine.replace('{port}', `--port ${port.toString()}`);
    // console.log("spawnRedisServerDocker: cmdLine = " + cmdLine);
    const { stdout, stderr } = await execAsync(cmdLine);

    if (!stdout) {
      throw new Error(`docker run error - ${stderr}`);
    }

    while (await isPortAvailable(port)) {
      await setTimeout(50);
    }

    return {
      port,
      dockerId: stdout.trim()
    };
  }

  async dockerRemove(dockerId: string): Promise<void> {
    try {
      await this.dockerStop(dockerId); ``
    } catch (err) {
      // its ok if stop failed, as we are just going to remove, will just be slower
      console.log(`dockerStop failed in remove: ${err}`);
    }

    const { stderr } = await execAsync(`docker rm -f ${dockerId}`);
    if (stderr) {
      console.log("docker rm failed");
      throw new Error(`docker rm error - ${stderr}`);
    }
  }

  async dockerStop(dockerId: string): Promise<void> {
    /* this is an optimization to get around slow docker stop times, but will fail if container is already stopped */
    try {
      await execAsync(`docker exec ${dockerId} /bin/bash -c "kill -SIGINT 1"`);
    } catch (err) {
      /* this will fail if container is already not running, can be ignored */
    }

    let ret = await execAsync(`docker stop ${dockerId}`);
    if (ret.stderr) {
      throw new Error(`docker stop error - ${ret.stderr}`);
    }
  }

  async dockerStart(dockerId: string): Promise<void> {
    const { stderr } = await execAsync(`docker start ${dockerId}`);
    if (stderr) {
      throw new Error(`docker start error - ${stderr}`);
    }
  }
}

export interface RedisSentinelConfig {
  numberOfNodes?: number;
  nodeDockerConfig?: RedisServerDockerConfig;
  nodeServerArguments?: Array<string>

  numberOfSentinels?: number;
  sentinelDockerConfig?: RedisServerDockerConfig;
  sentinelServerArgument?: Array<string>

  sentinelName: string;

  password?: string;
}

type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

export interface SentinelController {
  getMaster(): Promise<string>;
  getMasterPort(): Promise<number>;
  getRandomNode(): string;
  getRandonNonMasterNode(): Promise<string>;
  getNodePort(id: string): number;
  getAllNodesPort(): Array<number>;
  getSentinelPort(id: string): number;
  getAllSentinelsPort(): Array<number>;
  getSetinel(i: number): string;
  stopNode(id: string): Promise<void>;
  restartNode(id: string): Promise<void>;
  stopSentinel(id: string): Promise<void>;
  restartSentinel(id: string): Promise<void>;
  getSentinelClient(opts?: Partial<RedisSentinelOptions<{}, {}, {}, 2, {}>>): RedisSentinelType<{}, {}, {}, 2, {}>;
}

export class SentinelFramework extends DockerBase {
  #testUtils: TestUtils;
  #nodeList: Awaited<ReturnType<SentinelFramework['spawnRedisSentinelNodes']>> = [];
  /* port -> docker info/client */
  #nodeMap: Map<string, ArrayElement<Awaited<ReturnType<SentinelFramework['spawnRedisSentinelNodes']>>>>;
  #sentinelList: Awaited<ReturnType<SentinelFramework['spawnRedisSentinelSentinels']>> = [];
  /* port -> docker info/client */
  #sentinelMap: Map<string, ArrayElement<Awaited<ReturnType<SentinelFramework['spawnRedisSentinelSentinels']>>>>;

  config: RedisSentinelConfig;

  #spawned: boolean = false;

  get spawned() {
    return this.#spawned;
  }

  constructor(config: RedisSentinelConfig) {
    super();

    this.config = config;
    this.#testUtils = TestUtils.createFromConfig({
      dockerImageName: 'redislabs/client-libs-test',
      dockerImageVersionArgument: 'redis-version',
      defaultDockerVersion: '8.4-RC1-pre.2'
    });
    this.#nodeMap = new Map<string, ArrayElement<Awaited<ReturnType<SentinelFramework['spawnRedisSentinelNodes']>>>>();
    this.#sentinelMap = new Map<string, ArrayElement<Awaited<ReturnType<SentinelFramework['spawnRedisSentinelSentinels']>>>>();
  }

  getSentinelClient(opts?: Partial<RedisSentinelOptions<RedisModules,
    RedisFunctions,
    RedisScripts,
    RespVersions,
    TypeMapping>>, errors = true) {
    if (opts?.sentinelRootNodes !== undefined) {
      throw new Error("cannot specify sentinelRootNodes here");
    }
    if (opts?.name !== undefined) {
      throw new Error("cannot specify sentinel db name here");
    }

    const options: RedisSentinelOptions<RedisModules, RedisFunctions, RedisScripts, RespVersions, TypeMapping> = {
      ...opts,
      name: this.config.sentinelName,
      sentinelRootNodes: this.#sentinelList.map((sentinel) => { return { host: '127.0.0.1', port: sentinel.port } }),
      passthroughClientErrorEvents: errors
    }

    if (this.config.password !== undefined) {
      if (!options.nodeClientOptions) {
        options.nodeClientOptions = {};
      }
      options.nodeClientOptions.password = this.config.password;

      if (!options.sentinelClientOptions) {
        options.sentinelClientOptions = {};
      }
      options.sentinelClientOptions = {password: this.config.password};
    }

    return RedisSentinel.create(options);
  }

  async spawnRedisSentinel() {
    if (this.#spawned) {
      return;
    }

    if (this.#nodeMap.size != 0 || this.#sentinelMap.size != 0) {
      throw new Error("inconsistent state with partial setup");
    }

    this.#nodeList = await this.spawnRedisSentinelNodes(2);
    this.#nodeList.map((value) => this.#nodeMap.set(value.port.toString(), value));

    this.#sentinelList = await this.spawnRedisSentinelSentinels(this.#nodeList[0].port, 3)
    this.#sentinelList.map((value) => this.#sentinelMap.set(value.port.toString(), value));

    this.#spawned = true;
  }

  async cleanup() {
    if (!this.#spawned) {
      return;
    }

    return Promise.all(
      [...this.#nodeMap!.values(), ...this.#sentinelMap!.values()].map(
        async ({ dockerId }) => {
          this.dockerRemove(dockerId);
        }
      )
    ).finally(async () => {
      this.#spawned = false;
      this.#nodeMap.clear();
      this.#sentinelMap.clear();
    });
  }

  protected async spawnRedisSentinelNodes(replicasCount: number) {
    const master = await this.#testUtils.spawnRedisServer({serverArguments: DEBUG_MODE_ARGS})

    const replicas: Array<RedisServerDocker> = []
    for (let i = 0; i < replicasCount; i++) {
      const replica = await this.#testUtils.spawnRedisServer({serverArguments: DEBUG_MODE_ARGS})
      replicas.push(replica)

      const client = RedisClient.create({
        socket: {
          port: replica.port
        }
      })

      await client.connect();
      await client.replicaOf("127.0.0.1", master.port);
      await client.close();
    }

    return [
      master,
      ...replicas
    ]
  }

  protected async spawnRedisSentinelSentinels(masterPort: number, sentinels: number) {
    return this.#testUtils.spawnRedisSentinels({serverArguments: DEBUG_MODE_ARGS}, masterPort, this.config.sentinelName, sentinels)
  }

  async getAllRunning() {
    for (const port of this.getAllNodesPort()) {
      let first = true;
      while (await isPortAvailable(port)) {
        if (!first) {
          console.log(`problematic restart ${port}`);
          await setTimeout(500);
        } else {
          first = false;
        }
        await this.restartNode(port.toString());
      }
    }

    for (const port of this.getAllSentinelsPort()) {
      let first = true;
      while (await isPortAvailable(port)) {
        if (!first) {
          await setTimeout(500);
        } else {
          first = false;
        }
        await this.restartSentinel(port.toString());
      }
    }
  }

  async addSentinel() {
    const nodes = await this.#testUtils.spawnRedisSentinels({serverArguments: DEBUG_MODE_ARGS}, this.#nodeList[0].port, this.config.sentinelName, 1)
    this.#sentinelList.push(nodes[0]);
    this.#sentinelMap.set(nodes[0].port.toString(), nodes[0]);
  }

  async addNode() {
    const masterPort = await this.getMasterPort();
    const replica = await this.#testUtils.spawnRedisServer({serverArguments: DEBUG_MODE_ARGS})

    const client = RedisClient.create({
      socket: {
        port: replica.port
      }
    })

    await client.connect();
    await client.replicaOf("127.0.0.1", masterPort);
    await client.close();


    this.#nodeList.push(replica);
    this.#nodeMap.set(replica.port.toString(), replica);
  }

  async getMaster(tracer?: Array<string>): Promise<string | undefined> {
    const client = RedisClient.create({
      name: this.config.sentinelName,
      socket: {
        host: "127.0.0.1",
        port: this.#sentinelList[0].port,
      },
      modules: RedisSentinelModule,
    });
    await client.connect()
    const info = await client.sentinel.sentinelMaster(this.config.sentinelName);
    await client.close()

    const master = this.#nodeMap.get(info.port);
    if (master === undefined) {
      throw new Error(`couldn't find master node for ${info.port}`);
    }

    if (tracer) {
      tracer.push(`getMaster: master port is either ${info.port} or ${master.port}`);
    }

    return info.port;
  }

  async getMasterPort(tracer?: Array<string>): Promise<number> {
    const data = await this.getMaster(tracer)

    return this.#nodeMap.get(data!)!.port;
  }

  getRandomNode() {
    return this.#nodeList[Math.floor(Math.random() * this.#nodeList.length)].port.toString();
  }

  async getRandonNonMasterNode(): Promise<string> {
    const masterPort = await this.getMasterPort();
    while (true) {
      const node = this.#nodeList[Math.floor(Math.random() * this.#nodeList.length)];
      if (node.port != masterPort) {
        return node.port.toString();
      }
    }
  }

  async stopNode(id: string) {
//    console.log(`stopping node ${id}`);
    let node = this.#nodeMap.get(id);
    if (node === undefined) {
      throw new Error("unknown node: " + id);
    }

    return await this.dockerStop(node.dockerId);
  }

  async restartNode(id: string) {
    let node = this.#nodeMap.get(id);
    if (node === undefined) {
      throw new Error("unknown node: " + id);
    }

    await this.dockerStart(node.dockerId);
  }

  async stopSentinel(id: string) {
    let sentinel = this.#sentinelMap.get(id);
    if (sentinel === undefined) {
      throw new Error("unknown sentinel: " + id);
    }

    return await this.dockerStop(sentinel.dockerId);
  }

  async restartSentinel(id: string) {
    let sentinel = this.#sentinelMap.get(id);
    if (sentinel === undefined) {
      throw new Error("unknown sentinel: " + id);
    }

    await this.dockerStart(sentinel.dockerId);
  }

  getNodePort(id: string) {
    let node = this.#nodeMap.get(id);
    if (node === undefined) {
      throw new Error("unknown node: " + id);
    }

    return node.port;
  }

  getAllNodesPort() {
    let ports: Array<number> = [];
    for (const node of this.#nodeList) {
      ports.push(node.port);
    }

    return ports
  }

  getAllDockerIds() {
    let ids = new Map<string, number>();
    for (const node of this.#nodeList) {
      ids.set(node.dockerId, node.port);
    }

    return ids;
  }

  getSentinelPort(id: string) {
    let sentinel = this.#sentinelMap.get(id);
    if (sentinel === undefined) {
      throw new Error("unknown sentinel: " + id);
    }

    return sentinel.port;
  }

  getAllSentinelsPort() {
    let ports: Array<number> = [];
    for (const sentinel of this.#sentinelList) {
      ports.push(sentinel.port);
    }

    return ports
  }

  getSetinel(i: number): string {
    return this.#sentinelList[i].port.toString();
  }

  async sentinelSentinels() {
    const client = RedisClient.create({
      name: this.config.sentinelName,
      socket: {
        host: "127.0.0.1",
        port: this.#sentinelList[0].port,
      },
      modules: RedisSentinelModule,
    });
    await client.connect()
    const sentinels = client.sentinel.sentinelSentinels(this.config.sentinelName)
    await client.close()

    return sentinels
  }

  async sentinelMaster() {
    const client = RedisClient.create({
      name: this.config.sentinelName,
      socket: {
        host: "127.0.0.1",
        port: this.#sentinelList[0].port,
      },
      modules: RedisSentinelModule,
    });
    await client.connect()
    const master = client.sentinel.sentinelMaster(this.config.sentinelName)
    await client.close()

    return master
  }

  async sentinelReplicas() {
    const client = RedisClient.create({
      name: this.config.sentinelName,
      socket: {
        host: "127.0.0.1",
        port: this.#sentinelList[0].port,
      },
      modules: RedisSentinelModule,
    });
    await client.connect()
    const replicas = client.sentinel.sentinelReplicas(this.config.sentinelName)
    await client.close()

    return replicas
  }
}
