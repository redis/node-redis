import { createConnection } from "net";
import { once } from "events";
import ValkeyClient from "@valkey/client/dist/lib/client";
import { promiseTimeout } from "@valkey/client/dist/lib/utils";
import { ClusterSlotsReply } from "@valkey/client/dist/lib/commands/CLUSTER_SLOTS";
import * as path from "path";
import { promisify } from "util";
import { exec } from "child_process";
const execAsync = promisify(exec);

interface ErrorWithCode extends Error {
  code: string;
}

async function isPortAvailable(port: number): Promise<boolean> {
  try {
    const socket = createConnection({ port });
    await once(socket, "connect");
    socket.end();
  } catch (err) {
    if (
      err instanceof Error &&
      (err as ErrorWithCode).code === "ECONNREFUSED"
    ) {
      return true;
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

  throw new Error("All ports are in use");
})();

export interface ValkeyServerDockerConfig {
  image: string;
  version: string;
}

export interface ValkeyServerDocker {
  port: number;
  dockerId: string;
}

// ".." cause it'll be in `./dist`
const DOCKER_FODLER_PATH = path.join(__dirname, "../docker");

async function spawnValkeyServerDocker(
  { image, version }: ValkeyServerDockerConfig,
  serverArguments: Array<string>
): Promise<ValkeyServerDocker> {
  const port = (await portIterator.next()).value,
    { stdout, stderr } = await execAsync(
      "docker run -d --network host $(" +
        `docker build ${DOCKER_FODLER_PATH} -q ` +
        `--build-arg IMAGE=${image}:${version} ` +
        `--build-arg REDIS_ARGUMENTS="--save '' --port ${port.toString()} ${serverArguments.join(
          " "
        )}"` +
        ")"
    );

  if (!stdout) {
    throw new Error(`docker run error - ${stderr}`);
  }

  while (await isPortAvailable(port)) {
    await promiseTimeout(50);
  }

  return {
    port,
    dockerId: stdout.trim(),
  };
}

const RUNNING_SERVERS = new Map<
  Array<string>,
  ReturnType<typeof spawnValkeyServerDocker>
>();

export function spawnValkeyServer(
  dockerConfig: ValkeyServerDockerConfig,
  serverArguments: Array<string>
): Promise<ValkeyServerDocker> {
  const runningServer = RUNNING_SERVERS.get(serverArguments);
  if (runningServer) {
    return runningServer;
  }

  const dockerPromise = spawnValkeyServerDocker(dockerConfig, serverArguments);
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
    [...RUNNING_SERVERS.values()].map(
      async (dockerPromise) =>
        await dockerRemove((await dockerPromise).dockerId)
    )
  );
});

export interface ValkeyClusterDockersConfig extends ValkeyServerDockerConfig {
  numberOfMasters?: number;
  numberOfReplicas?: number;
}

async function spawnValkeyClusterNodeDockers(
  dockersConfig: ValkeyClusterDockersConfig,
  serverArguments: Array<string>,
  fromSlot: number,
  toSlot: number
) {
  const range: Array<number> = [];
  for (let i = fromSlot; i < toSlot; i++) {
    range.push(i);
  }

  const master = await spawnValkeyClusterNodeDocker(
    dockersConfig,
    serverArguments
  );

  await master.client.clusterAddSlots(range);

  if (!dockersConfig.numberOfReplicas) return [master];

  const replicasPromises: Array<
    ReturnType<typeof spawnValkeyClusterNodeDocker>
  > = [];
  for (let i = 0; i < (dockersConfig.numberOfReplicas ?? 0); i++) {
    replicasPromises.push(
      spawnValkeyClusterNodeDocker(dockersConfig, [
        ...serverArguments,
        "--cluster-enabled",
        "yes",
        "--cluster-node-timeout",
        "5000",
      ]).then(async (replica) => {
        await replica.client.clusterMeet("127.0.0.1", master.docker.port);

        while ((await replica.client.clusterSlots()).length === 0) {
          await promiseTimeout(50);
        }

        await replica.client.clusterReplicate(
          await master.client.clusterMyId()
        );

        return replica;
      })
    );
  }

  return [master, ...(await Promise.all(replicasPromises))];
}

async function spawnValkeyClusterNodeDocker(
  dockersConfig: ValkeyClusterDockersConfig,
  serverArguments: Array<string>
) {
  const docker = await spawnValkeyServerDocker(dockersConfig, [
      ...serverArguments,
      "--cluster-enabled",
      "yes",
      "--cluster-node-timeout",
      "5000",
    ]),
    client = ValkeyClient.create({
      socket: {
        port: docker.port,
      },
    });

  await client.connect();

  return {
    docker,
    client,
  };
}

const SLOTS = 16384;

async function spawnValkeyClusterDockers(
  dockersConfig: ValkeyClusterDockersConfig,
  serverArguments: Array<string>
): Promise<Array<ValkeyServerDocker>> {
  const numberOfMasters = dockersConfig.numberOfMasters ?? 2,
    slotsPerNode = Math.floor(SLOTS / numberOfMasters),
    spawnPromises: Array<ReturnType<typeof spawnValkeyClusterNodeDockers>> = [];
  for (let i = 0; i < numberOfMasters; i++) {
    const fromSlot = i * slotsPerNode,
      toSlot = i === numberOfMasters - 1 ? SLOTS : fromSlot + slotsPerNode;
    spawnPromises.push(
      spawnValkeyClusterNodeDockers(
        dockersConfig,
        serverArguments,
        fromSlot,
        toSlot
      )
    );
  }

  const nodes = (await Promise.all(spawnPromises)).flat(),
    meetPromises: Array<Promise<unknown>> = [];
  for (let i = 1; i < nodes.length; i++) {
    meetPromises.push(
      nodes[i].client.clusterMeet("127.0.0.1", nodes[0].docker.port)
    );
  }

  await Promise.all(meetPromises);

  await Promise.all(
    nodes.map(async ({ client }) => {
      while (totalNodes(await client.clusterSlots()) !== nodes.length) {
        await promiseTimeout(50);
      }

      return client.disconnect();
    })
  );

  return nodes.map(({ docker }) => docker);
}

function totalNodes(slots: ClusterSlotsReply) {
  let total = slots.length;
  for (const slot of slots) {
    total += slot.replicas.length;
  }

  return total;
}

const RUNNING_CLUSTERS = new Map<
  Array<string>,
  ReturnType<typeof spawnValkeyClusterDockers>
>();

export function spawnValkeyCluster(
  dockersConfig: ValkeyClusterDockersConfig,
  serverArguments: Array<string>
): Promise<Array<ValkeyServerDocker>> {
  const runningCluster = RUNNING_CLUSTERS.get(serverArguments);
  if (runningCluster) {
    return runningCluster;
  }

  const dockersPromise = spawnValkeyClusterDockers(
    dockersConfig,
    serverArguments
  );
  RUNNING_CLUSTERS.set(serverArguments, dockersPromise);
  return dockersPromise;
}

after(() => {
  return Promise.all(
    [...RUNNING_CLUSTERS.values()].map(async (dockersPromise) => {
      return Promise.all(
        (await dockersPromise).map(({ dockerId }) => dockerRemove(dockerId))
      );
    })
  );
});
