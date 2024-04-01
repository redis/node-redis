import { ValkeyCommandArguments } from ".";

export function transformArguments(): ValkeyCommandArguments {
  return ["FUNCTION", "KILL"];
}

export declare function transformReply(): "OK";
