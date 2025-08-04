import EventEmitter from "events";
import { RedisClientOptions } from ".";
import RedisCommandsQueue from "./commands-queue";
import RedisSocket, { RedisSocketOptions, RedisTcpSocketOptions } from "./socket";
import { RedisArgument } from "../..";
import { isIP } from "net";
import { lookup } from "dns/promises";

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

export default class EnterpriseMaintenanceManager extends EventEmitter {
  #commandsQueue: RedisCommandsQueue;
  #options: RedisClientOptions;

  static async getHandshakeCommand(tls: boolean, host: string): Promise<Array<RedisArgument>> {
    const movingEndpointType = await determineEndpoint(tls, host);
    return ["CLIENT", "MAINT_NOTIFICATIONS", "ON", "moving-endpoint-type", movingEndpointType];
  }

  constructor(commandsQueue: RedisCommandsQueue, options: RedisClientOptions) {
    super();
    this.#commandsQueue = commandsQueue;
    this.#options = options;

    this.#commandsQueue.addPushHandler(this.#onPush);
  }

  #onPush = (push: Array<any>): boolean => {
    switch (push[0].toString()) {
      case PN.MOVING: {
        const [_, afterMs, url] = push;
        const [host, port] = url.toString().split(":");
        this.#onMoving(afterMs, host, Number(port));
        return true;
      }
      case PN.MIGRATING:
      case PN.FAILING_OVER: {
        this.#onMigrating();
        return true;
      }
      case PN.MIGRATED:
      case PN.FAILED_OVER: {
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
    // 2 [ACTION] Pause writing
    this.emit(MAINTENANCE_EVENTS.PAUSE_WRITING);
    this.#onMigrating();

    const newSocket = new RedisSocket({
      ...this.#options.socket,
      host,
      port,
    });
    //todo
    newSocket.setMaintenanceTimeout();
    await newSocket.connect();
    // 3 [EVENT] New socket connected

    await this.#commandsQueue.waitForInflightCommandsToComplete();
    // 4 [EVENT] In-flight commands completed

    // 5 + 6
    this.emit(MAINTENANCE_EVENTS.RESUME_WRITING, newSocket);
    this.#onMigrated();
  };

  #onMigrating = async () => {
    this.#commandsQueue.inMaintenance = true;
    this.#commandsQueue.setMaintenanceCommandTimeout(
      this.#options.gracefulMaintenance?.relaxedCommandTimeout,
    );

    this.emit(MAINTENANCE_EVENTS.TIMEOUTS_UPDATE, {
      inMaintenance: true,
      timeout: this.#options.gracefulMaintenance?.relaxedSocketTimeout,
    } satisfies SocketTimeoutUpdate);
  };

  #onMigrated = async () => {
    this.#commandsQueue.inMaintenance = false;
    this.#commandsQueue.setMaintenanceCommandTimeout(undefined);

    this.emit(MAINTENANCE_EVENTS.TIMEOUTS_UPDATE, {
      inMaintenance: false,
      timeout: undefined,
    } satisfies SocketTimeoutUpdate);
  };
}

type MovingEndpointType =
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
): Promise<MovingEndpointType> {

  const ip = isIP(host)
    ? host
    : (await lookup(host, {family: 0})).address

  const isPrivate = isPrivateIP(ip);

  if (tlsEnabled) {
    return isPrivate ? "internal-fqdn" : "external-fqdn";
  } else {
    return isPrivate ? "internal-ip" : "external-ip";
  }
}
