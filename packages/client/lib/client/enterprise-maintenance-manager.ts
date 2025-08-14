import { RedisClientOptions } from ".";
import RedisCommandsQueue from "./commands-queue";
import { RedisArgument } from "../..";
import { isIP } from "net";
import { lookup } from "dns/promises";
import assert from "node:assert";
import { setTimeout } from "node:timers/promises";
import RedisSocket from "./socket";

export const MAINTENANCE_EVENTS = {
  PAUSE_WRITING: "pause-writing",
  RESUME_WRITING: "resume-writing",
  TIMEOUTS_UPDATE: "timeouts-update",
} as const;

const PN = {
  MOVING: "MOVING",
  MIGRATING: "MIGRATING",
  MIGRATED: "MIGRATED",
  FAILING_OVER: "FAILING_OVER",
  FAILED_OVER: "FAILED_OVER",
};

export const dbgMaintenance = (...args: any[]) => {
  if (!process.env.DEBUG_MAINTENANCE) return;
  return console.log("[MNT]", ...args);
};

export interface MaintenanceUpdate {
  inMaintenance: boolean;
  relaxedCommandTimeout?: number;
  relaxedSocketTimeout?: number;
}

interface Client {
  _ejectSocket: () => RedisSocket;
  _insertSocket: (socket: RedisSocket) => void;
  _pause: () => void;
  _unpause: () => void;
  _maintenanceUpdate: (update: MaintenanceUpdate) => void;
  duplicate: (options: RedisClientOptions) => Client;
  connect: () => Promise<Client>;
  destroy: () => void;
}

export default class EnterpriseMaintenanceManager {
  #commandsQueue: RedisCommandsQueue;
  #options: RedisClientOptions;
  #isMaintenance = 0;
  #client: Client;

  static setupDefaultMaintOptions(options: RedisClientOptions) {
    if (options.maintPushNotifications === undefined) {
      options.maintPushNotifications =
        options?.RESP === 3 ? "auto" : "disabled";
    }
    if (options.maintMovingEndpointType === undefined) {
      options.maintMovingEndpointType = "auto";
    }
    if (options.maintRelaxedSocketTimeout === undefined) {
      options.maintRelaxedSocketTimeout = 10000;
    }
    if (options.maintRelaxedCommandTimeout === undefined) {
      options.maintRelaxedCommandTimeout = 10000;
    }
  }

  static async getHandshakeCommand(
    tls: boolean,
    host: string,
    options: RedisClientOptions,
  ): Promise<
    | { cmd: Array<RedisArgument>; errorHandler: (error: Error) => void }
    | undefined
  > {
    if (options.maintPushNotifications === "disabled") return;

    const movingEndpointType = await determineEndpoint(tls, host, options);
    return {
      cmd: [
        "CLIENT",
        "MAINT_NOTIFICATIONS",
        "ON",
        "moving-endpoint-type",
        movingEndpointType,
      ],
      errorHandler: (error: Error) => {
        dbgMaintenance("handshake failed:", error);
        if (options.maintPushNotifications === "enabled") {
          throw error;
        }
      },
    };
  }

  constructor(
    commandsQueue: RedisCommandsQueue,
    client: Client,
    options: RedisClientOptions,
  ) {
    this.#commandsQueue = commandsQueue;
    this.#options = options;
    this.#client = client;

    this.#commandsQueue.addPushHandler(this.#onPush);
  }

  #onPush = (push: Array<any>): boolean => {
    dbgMaintenance("ONPUSH:", push.map(String));
    switch (push[0].toString()) {
      case PN.MOVING: {
        // [ 'MOVING', '17', '15', '54.78.247.156:12075' ]
        //             ^seq   ^after    ^new ip
        const afterSeconds = push[2];
        const url: string | null = push[3] ? String(push[3]) : null;
        dbgMaintenance("Received MOVING:", afterSeconds, url);
        this.#onMoving(afterSeconds, url);
        return true;
      }
      case PN.MIGRATING:
      case PN.FAILING_OVER: {
        dbgMaintenance("Received MIGRATING|FAILING_OVER");
        this.#onMigrating();
        return true;
      }
      case PN.MIGRATED:
      case PN.FAILED_OVER: {
        dbgMaintenance("Received MIGRATED|FAILED_OVER");
        this.#onMigrated();
        return true;
      }
    }
    return false;
  };

  //  Queue:
  //     toWrite [ C D E ]
  //     waitingForReply [ A B ]   - aka In-flight commands
  //
  //  time: ---1-2---3-4-5-6---------------------------
  //
  //  1. [EVENT] MOVING PN received
  //  2. [ACTION] Pause writing ( we need to wait for new socket to connect and for all in-flight commands to complete )
  //  3. [EVENT] New socket connected
  //  4. [EVENT] In-flight commands completed
  //  5. [ACTION] Destroy old socket
  //  6. [ACTION] Resume writing -> we are going to write to the new socket from now on
  #onMoving = async (
    afterSeconds: number,
    url: string | null,
  ): Promise<void> => {
    // 1 [EVENT] MOVING PN received
    this.#onMigrating();

    let host: string;
    let port: number;

    // The special value `none` indicates that the `MOVING` message doesn’t need
    // to contain an endpoint. Instead it contains the value `null` then. In
    // such a corner case, the client is expected to schedule a graceful
    // reconnect to its currently configured endpoint after half of the grace
    // period that was communicated by the server is over.
    if (url === null) {
      assert(this.#options.maintMovingEndpointType === "none");
      assert(this.#options.socket !== undefined);
      assert("host" in this.#options.socket);
      assert(typeof this.#options.socket.host === "string");
      host = this.#options.socket.host;
      assert(typeof this.#options.socket.port === "number");
      port = this.#options.socket.port;
      const waitTime = (afterSeconds * 1000) / 2;
      dbgMaintenance(`Wait for ${waitTime}ms`);
      await setTimeout(waitTime);
    } else {
      const split = url.split(":");
      host = split[0];
      port = Number(split[1]);
    }

    // 2 [ACTION] Pause writing
    dbgMaintenance("Pausing writing of new commands to old socket");
    this.#client._pause();

    const tmpClient = this.#client.duplicate({
      maintPushNotifications: "disabled",
      socket: {
        ...this.#options.socket,
        host,
        port,
      },
    });

    dbgMaintenance(`Connecting tmp client: ${host}:${port}`);
    await tmpClient.connect();
    dbgMaintenance(`Connected to tmp client`);
    // 3 [EVENT] New socket connected

    //TODO
    // dbgMaintenance(
    //   `Set timeout for new socket to ${this.#options.maintRelaxedSocketTimeout}`,
    // );
    // newSocket.setMaintenanceTimeout(this.#options.maintRelaxedSocketTimeout);

    dbgMaintenance(`Wait for all in-flight commands to complete`);
    await this.#commandsQueue.waitForInflightCommandsToComplete();
    dbgMaintenance(`In-flight commands completed`);
    // 4 [EVENT] In-flight commands completed

    dbgMaintenance("Swap client sockets...");
    const oldSocket = this.#client._ejectSocket();
    const newSocket = tmpClient._ejectSocket();
    this.#client._insertSocket(newSocket);
    tmpClient._insertSocket(oldSocket);
    tmpClient.destroy();
    dbgMaintenance("Swap client sockets done.");
    // 5 + 6
    dbgMaintenance("Resume writing");
    this.#client._unpause();
    this.#onMigrated();
  };

  #onMigrating = async () => {
    this.#isMaintenance++;
    if (this.#isMaintenance > 1) {
      dbgMaintenance(`Timeout relaxation already done`);
      return;
    }

    const update: MaintenanceUpdate = {
      inMaintenance: true,
      relaxedCommandTimeout: this.#options.maintRelaxedCommandTimeout,
      relaxedSocketTimeout: this.#options.maintRelaxedSocketTimeout,
    };

    this.#client._maintenanceUpdate(update);
  };

  #onMigrated = async () => {
    this.#isMaintenance--;
    assert(this.#isMaintenance >= 0);
    if (this.#isMaintenance > 0) {
      dbgMaintenance(`Not ready to unrelax timeouts yet`);
      return;
    }

    const update: MaintenanceUpdate = {
      inMaintenance : false
    };

    this.#client._maintenanceUpdate(update);
  };
}

export type MovingEndpointType =
  | "auto"
  | "internal-ip"
  | "internal-fqdn"
  | "external-ip"
  | "external-fqdn"
  | "none";

function isPrivateIP(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    const octets = ip.split(".").map(Number);
    return (
      octets[0] === 10 ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
      (octets[0] === 192 && octets[1] === 168)
    );
  }
  if (version === 6) {
    return (
      ip.startsWith("fc") || // Unique local
      ip.startsWith("fd") || // Unique local
      ip === "::1" || // Loopback
      ip.startsWith("fe80") // Link-local unicast
    );
  }
  return false;
}

async function determineEndpoint(
  tlsEnabled: boolean,
  host: string,
  options: RedisClientOptions,
): Promise<MovingEndpointType> {
  assert(options.maintMovingEndpointType !== undefined);
  if (options.maintMovingEndpointType !== "auto") {
    dbgMaintenance(
      `Determine endpoint type: ${options.maintMovingEndpointType}`,
    );
    return options.maintMovingEndpointType;
  }

  const ip = isIP(host) ? host : (await lookup(host, { family: 0 })).address;

  const isPrivate = isPrivateIP(ip);

  let result: MovingEndpointType;
  if (tlsEnabled) {
    result = isPrivate ? "internal-fqdn" : "external-fqdn";
  } else {
    result = isPrivate ? "internal-ip" : "external-ip";
  }

  dbgMaintenance(`Determine endpoint type: ${result}`);
  return result;
}
