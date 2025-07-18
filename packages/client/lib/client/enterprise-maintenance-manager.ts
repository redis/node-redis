import { RedisClientOptions } from ".";
import RedisCommandsQueue from "./commands-queue";
import RedisSocket from "./socket";

export default class EnterpriseMaintenanceManager {
  client: any;
  commandsQueue: RedisCommandsQueue;
  options: RedisClientOptions;
  constructor(
    client: any,
    commandsQueue: RedisCommandsQueue,
    options: RedisClientOptions,
  ) {
    this.client = client;
    this.commandsQueue = commandsQueue;
    this.options = options;

    this.commandsQueue.events.on("moving", this.#onMoving);
  }

  //  Queue
  //     toWrite [ C D E ]
  //     waitingForReply [ A B ]
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
    console.log('[EnterpriseMaintenanceManager] Pausing client');
    // 2 [ACTION] Pause writing
    this.client.pause();

    console.log(`[EnterpriseMaintenanceManager] Creating new socket for ${host}:${port}`);
    const newSocket = new RedisSocket({
      ...this.options.socket,
      host,
      port,
    });
    console.log('[EnterpriseMaintenanceManager] Connecting to new socket');
    await newSocket.connect();
    // 3 [EVENT] New socket connected
    console.log('[EnterpriseMaintenanceManager] New socket connected');

    // Wait until waitingForReply is empty
    console.log('[EnterpriseMaintenanceManager] Waiting for reply queue to empty');
    await new Promise<void>((resolve) => {
      if (!this.commandsQueue.isWaitingForReply()) {
        console.log('[EnterpriseMaintenanceManager] Reply queue already empty');
        resolve();
      } else {
        console.log('[EnterpriseMaintenanceManager] Reply queue not empty, waiting for empty event');
        this.commandsQueue.events.once("waitingForReplyEmpty", () => {
          console.log('[EnterpriseMaintenanceManager] Reply queue now empty');
          resolve();
        });
      }
    });
    // 4 [EVENT] Reply queue now empty

    // 5 [ACTION] Destroy old socket
    // Switch to the new socket and clean up the old one
    console.log('[EnterpriseMaintenanceManager] Switching to new socket and cleaning up old one');
    const oldSocket = this.client.socket;
    this.client.socket = newSocket;
    oldSocket.removeAllListeners();
    oldSocket.destroy();
    console.log('[EnterpriseMaintenanceManager] Old socket destroyed');

    // 6 [ACTION] Resume writing
    console.log('[EnterpriseMaintenanceManager] Resuming client');
    this.client.resume();
    console.log('[EnterpriseMaintenanceManager] Socket migration complete');
  };
}
