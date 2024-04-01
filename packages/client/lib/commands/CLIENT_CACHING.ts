import { ValkeyCommandArguments } from ".";

export function transformArguments(value: boolean): ValkeyCommandArguments {
  return ["CLIENT", "CACHING", value ? "YES" : "NO"];
}

export declare function transformReply(): "OK" | Buffer;
