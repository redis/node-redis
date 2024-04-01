import { ValkeyCommandArguments } from ".";

export function transformArguments(value: boolean): ValkeyCommandArguments {
  return ["CLIENT", "NO-EVICT", value ? "ON" : "OFF"];
}

export declare function transformReply(): "OK" | Buffer;
