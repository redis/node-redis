import EventEmitter from "events";
import { RedisClientOptions } from ".";
import RedisCommandsQueue from "./commands-queue";
import RedisSocket from "./socket";
import { RedisArgument } from "../..";
import { isIP } from "net";
import { lookup } from "dns/promises";
import assert from "node:assert";

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

export interface SocketTimeoutUpdate {
  inMaintenance: boolean;
  timeout?: number;
}

const DEFAULT_OPTIONS = {
  maintPushNotifications: "auto",
  maintMovingEndpointType: "auto",
  maintRelaxedCommandTimeout: 1000,
  maintRelaxedSocketTimeout: 1000,
} as const;

export const dbgMaintenance = (...args: any[]) => {
  if (!process.env.DEBUG_MAINTENANCE) return;
  return console.log("[MNT]", ...args);
};

export default class EnterpriseMaintenanceManager extends EventEmitter {
  #commandsQueue: RedisCommandsQueue;
  #options: RedisClientOptions;
  #isMaintenance = 0;

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
        dbgMaintenance('handshake failed:', error);
        if(options.maintPushNotifications === 'enabled') {
          throw error;
        }
      },
    };
  }

  constructor(commandsQueue: RedisCommandsQueue, options: RedisClientOptions) {
    super();
    this.#commandsQueue = commandsQueue;
    this.#options = { ...DEFAULT_OPTIONS, ...options };

    this.#commandsQueue.addPushHandler(this.#onPush);
  }

  #onPush = (push: Array<any>): boolean => {
    dbgMaintenance(push.map((item) => item.toString()));
    switch (push[0].toString()) {
      case PN.MOVING: {
        // [ 'MOVING', '17', '15', '54.78.247.156:12075' ]
        //             ^seq   ^after    ^new ip
        const afterMs = push[2];
        const url = push[3];
        const [host, port] = url.toString().split(":");
        dbgMaintenance("Received MOVING:", afterMs, host, Number(port));
        this.#onMoving(afterMs, host, Number(port));
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
    _afterMs: number,
    host: string,
    port: number,
  ): Promise<void> => {
    // 1 [EVENT] MOVING PN received
    this.#onMigrating();

    // 2 [ACTION] Pause writing
    dbgMaintenance("Pausing writing of new commands to old socket");
    this.emit(MAINTENANCE_EVENTS.PAUSE_WRITING);

    const newSocket = new RedisSocket({
      ...this.#options.socket,
      host,
      port,
    });
    dbgMaintenance(
      `Set timeout for new socket to ${this.#options.maintRelaxedSocketTimeout}`,
    );
    newSocket.setMaintenanceTimeout(this.#options.maintRelaxedSocketTimeout);
    dbgMaintenance(`Connecting to new socket: ${host}:${port}`);
    await newSocket.connect();
    dbgMaintenance(`Connected to new socket`);
    // 3 [EVENT] New socket connected

    dbgMaintenance(`Wait for all in-flight commands to complete`);
    await this.#commandsQueue.waitForInflightCommandsToComplete();
    dbgMaintenance(`In-flight commands completed`);
    // 4 [EVENT] In-flight commands completed

    // 5 + 6
    dbgMaintenance("Resume writing");
    this.emit(MAINTENANCE_EVENTS.RESUME_WRITING, newSocket);
    this.#onMigrated();
  };

  #onMigrating = async () => {
    this.#isMaintenance++;
    if (this.#isMaintenance > 1) {
      dbgMaintenance(`Timeout relaxation already done`);
      return;
    }

    this.#commandsQueue.inMaintenance = true;
    this.#commandsQueue.setMaintenanceCommandTimeout(
      this.#options.maintRelaxedCommandTimeout,
    );

    this.emit(MAINTENANCE_EVENTS.TIMEOUTS_UPDATE, {
      inMaintenance: true,
      timeout: this.#options.maintRelaxedSocketTimeout,
    } satisfies SocketTimeoutUpdate);
  };

  #onMigrated = async () => {
    this.#isMaintenance--;
    assert(this.#isMaintenance >= 0);
    if (this.#isMaintenance > 0) {
      dbgMaintenance(`Not ready to unrelax timeouts yet`);
      return;
    }

    this.#commandsQueue.inMaintenance = false;
    this.#commandsQueue.setMaintenanceCommandTimeout(undefined);

    this.emit(MAINTENANCE_EVENTS.TIMEOUTS_UPDATE, {
      inMaintenance: false,
      timeout: undefined,
    } satisfies SocketTimeoutUpdate);
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
  options: RedisClientOptions
): Promise<MovingEndpointType> {

  assert(options.maintMovingEndpointType !== undefined);
  if (options.maintMovingEndpointType !== 'auto') return options.maintMovingEndpointType;

  const ip = isIP(host) ? host : (await lookup(host, { family: 0 })).address;

  const isPrivate = isPrivateIP(ip);

  let result: MovingEndpointType;
  if (tlsEnabled) {
    result = isPrivate ? "internal-fqdn" : "external-fqdn";
  } else {
    result = isPrivate ? "internal-ip" : "external-ip";
  }

  dbgMaintenance(`Determine endpoint format: ${result}`);
  return result;
}
