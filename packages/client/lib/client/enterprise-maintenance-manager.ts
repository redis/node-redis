import { RedisClientOptions } from ".";
import RedisCommandsQueue from "./commands-queue";
import { RedisArgument } from "../..";
import { isIP } from "net";
import { lookup } from "dns/promises";
import assert from "node:assert";
import { setTimeout } from "node:timers/promises";
import RedisSocket, { RedisTcpSocketOptions } from "./socket";
import diagnostics_channel from "node:diagnostics_channel";

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

export type DiagnosticsEvent = {
  type: string;
  timestamp: number;
  data?: Object;
};

export const dbgMaintenance = (...args: any[]) => {
  if (!process.env.REDIS_DEBUG_MAINTENANCE) return;
  return console.log("[MNT]", ...args);
};

export const emitDiagnostics = (event: DiagnosticsEvent) => {
  if (!process.env.REDIS_EMIT_DIAGNOSTICS) return;

  const channel = diagnostics_channel.channel("redis.maintenance");
  channel.publish(event);
};

export interface MaintenanceUpdate {
  relaxedCommandTimeout?: number;
  relaxedSocketTimeout?: number;
}

interface Client {
  _ejectSocket: () => RedisSocket;
  _insertSocket: (socket: RedisSocket) => void;
  _pause: () => void;
  _unpause: () => void;
  _maintenanceUpdate: (update: MaintenanceUpdate) => void;
  duplicate: () => Client;
  connect: () => Promise<Client>;
  destroy: () => void;
  on: (event: string, callback: (value: unknown) => void) => void;
}

export default class EnterpriseMaintenanceManager {
  #commandsQueue: RedisCommandsQueue;
  #options: RedisClientOptions;
  #isMaintenance = 0;
  #client: Client;

  static setupDefaultMaintOptions(options: RedisClientOptions) {
    if (options.maintNotifications === undefined) {
      options.maintNotifications =
        options?.RESP === 3 ? "auto" : "disabled";
    }
    if (options.maintEndpointType === undefined) {
      options.maintEndpointType = "auto";
    }
    if (options.maintRelaxedSocketTimeout === undefined) {
      options.maintRelaxedSocketTimeout = 10000;
    }
    if (options.maintRelaxedCommandTimeout === undefined) {
      options.maintRelaxedCommandTimeout = 10000;
    }
  }

  static async getHandshakeCommand(
    options: RedisClientOptions,
  ): Promise<
    | { cmd: Array<RedisArgument>; errorHandler: (error: Error) => void }
    | undefined
  > {
    if (options.maintNotifications === "disabled") return;

    const host = options.url
      ? new URL(options.url).hostname
      : (options.socket as RedisTcpSocketOptions | undefined)?.host;

    if (!host) return;

    const tls = options.socket?.tls ?? false

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
        if (options.maintNotifications === "enabled") {
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

    if (!Array.isArray(push) || !["MOVING", "MIGRATING", "MIGRATED", "FAILING_OVER", "FAILED_OVER"].includes(String(push[0]))) {
      return false;
    }

    const type = String(push[0]);

    emitDiagnostics({
          type,
          timestamp: Date.now(),
          data: {
            push: push.map(String),
          },
        });
    switch (type) {
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
      assert(this.#options.maintEndpointType === "none");
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

    dbgMaintenance("Creating new tmp client");
    let start = performance.now();

    // If the URL is provided, it takes precedense
    // the options object could just be mutated
    if(this.#options.url) {
      const u = new URL(this.#options.url);
      u.hostname = host;
      u.port = String(port);
      this.#options.url = u.toString();
    } else {
      this.#options.socket = {
        ...this.#options.socket,
        host,
        port
      }
    }
    const tmpClient = this.#client.duplicate();
    tmpClient.on('error', (error: unknown) => {
      //We dont know how to handle tmp client errors
      dbgMaintenance(`[ERR]`, error)
    });
    dbgMaintenance(`Tmp client created in ${( performance.now() - start ).toFixed(2)}ms`);
    dbgMaintenance(
      `Set timeout for tmp client to ${this.#options.maintRelaxedSocketTimeout}`,
    );
    tmpClient._maintenanceUpdate({
      relaxedCommandTimeout: this.#options.maintRelaxedCommandTimeout,
      relaxedSocketTimeout: this.#options.maintRelaxedSocketTimeout,
    });
    dbgMaintenance(`Connecting tmp client: ${host}:${port}`);
    start = performance.now();
    await tmpClient.connect();
    dbgMaintenance(`Connected to tmp client in ${(performance.now() - start).toFixed(2)}ms`);
    // 3 [EVENT] New socket connected

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

  #onMigrating = () => {
    this.#isMaintenance++;
    if (this.#isMaintenance > 1) {
      dbgMaintenance(`Timeout relaxation already done`);
      return;
    }

    const update: MaintenanceUpdate = {
      relaxedCommandTimeout: this.#options.maintRelaxedCommandTimeout,
      relaxedSocketTimeout: this.#options.maintRelaxedSocketTimeout,
    };

    this.#client._maintenanceUpdate(update);
  };

  #onMigrated = () => {
    //ensure that #isMaintenance doesnt go under 0
    this.#isMaintenance = Math.max(this.#isMaintenance - 1, 0);
    if (this.#isMaintenance > 0) {
      dbgMaintenance(`Not ready to unrelax timeouts yet`);
      return;
    }

    const update: MaintenanceUpdate = {
      relaxedCommandTimeout: undefined,
      relaxedSocketTimeout: undefined
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
  assert(options.maintEndpointType !== undefined);
  if (options.maintEndpointType !== "auto") {
    dbgMaintenance(
      `Determine endpoint type: ${options.maintEndpointType}`,
    );
    return options.maintEndpointType;
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
