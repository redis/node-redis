import { EventEmitter } from "node:events";
import RespFramer from "./resp-framer";
import { Socket } from "node:net";

interface Request {
  resolve: (data: Buffer) => void;
  reject: (reason: any) => void;
}

export default class RespQueue extends EventEmitter {
  queue: Request[] = [];
  respFramer: RespFramer = new RespFramer();

  constructor(private serverSocket: Socket) {
    super();
    this.respFramer.on("message", (msg) => this.handleMessage(msg));
    this.serverSocket.on("data", (data) => this.respFramer.write(data));
  }

  handleMessage(data: Buffer) {
    const request = this.queue.shift();
    if (request) {
      request.resolve(data);
    } else {
      this.emit("push", data);
    }
  }

  request(data: Buffer): Promise<Buffer> {
    let resolve: (data: Buffer) => void;
    let reject: (reason: any) => void;

    const promise = new Promise<Buffer>((rs, rj) => {
      resolve = rs;
      reject = rj;
    });

    //@ts-ignore
    this.queue.push({ resolve, reject });
    this.serverSocket.write(data);
    return promise;
  }
}
