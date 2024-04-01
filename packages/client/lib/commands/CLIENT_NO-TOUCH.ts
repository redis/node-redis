import { ValkeyCommandArguments } from ".";

export function transformArguments(value: boolean): ValkeyCommandArguments {
  return ["CLIENT", "NO-TOUCH", value ? "ON" : "OFF"];
}

export declare function transformReply(): "OK" | Buffer;
