import EventEmitter from "events";
import { RedisClientOptions } from ".";
import RedisCommandsQueue from "./commands-queue";
import RedisSocket from "./socket";

export default class EnterpriseMaintenanceManager extends EventEmitter {
  #commandsQueue: RedisCommandsQueue;
  #options: RedisClientOptions;
  constructor(commandsQueue: RedisCommandsQueue, options: RedisClientOptions) {
    super();
    this.#commandsQueue = commandsQueue;
    this.#options = options;

    this.#commandsQueue.events.on("moving", this.#onMoving);
    this.#commandsQueue.events.on("migrating", this.#onMigrating);
    this.#commandsQueue.events.on("migrated", this.#onMigrated);
  }

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
    this.emit("pause");

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
    this.emit("resume", newSocket);
  };

  #onMigrating = async () => {
    this.#commandsQueue.setMaintenanceCommandTimeout(this.#getCommandTimeout());
    this.emit("maintenance", this.#getSocketTimeout());
  };

  #onMigrated = async () => {
    this.#commandsQueue.setMaintenanceCommandTimeout(undefined);
    this.emit("maintenance", undefined);
  }

  #getSocketTimeout(): number | undefined {
    return this.#options.gracefulMaintenance?.handleTimeouts === "error"
      ? this.#options.socket?.socketTimeout
      : this.#options.gracefulMaintenance?.handleTimeouts;
  }

  #getCommandTimeout(): number | undefined {
    return this.#options.gracefulMaintenance?.handleTimeouts === "error"
      ? this.#options.commandOptions?.timeout
      : this.#options.gracefulMaintenance?.handleTimeouts;
  }
}
