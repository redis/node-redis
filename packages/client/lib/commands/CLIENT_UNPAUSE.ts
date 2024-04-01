import { ValkeyCommandArguments } from ".";

export function transformArguments(): ValkeyCommandArguments {
  return ["CLIENT", "UNPAUSE"];
}

export declare function transformReply(): "OK" | Buffer;
