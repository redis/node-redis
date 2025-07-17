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

  #onMoving = async (_afterMs: number, host: string, port: number) => {

    this.client.pause()

    const socket = new RedisSocket({
      ...this.options.socket,
      host,
      port
    });
    await socket.connect();

    //wait until waitingForReply is empty
    await new Promise<void>(resolve => {
      if(!this.commandsQueue.isWaitingForReply()) {
        resolve()
      } else {
        this.commandsQueue.events.once('waitingForReplyEmpty', resolve)
      }
    })

    const oldSocket = this.client.socket
    oldSocket.removeAllListeners();
    oldSocket.destroy();

    this.client.socket = socket;

    this.client.resume()
  };

}
