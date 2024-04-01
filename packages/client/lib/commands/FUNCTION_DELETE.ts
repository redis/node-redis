import { ValkeyCommandArguments } from ".";

export function transformArguments(library: string): ValkeyCommandArguments {
  return ["FUNCTION", "DELETE", library];
}

export declare function transformReply(): "OK";
