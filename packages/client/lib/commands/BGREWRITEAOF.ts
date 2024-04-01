import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export function transformArguments(): ValkeyCommandArguments {
  return ["BGREWRITEAOF"];
}

export declare function transformReply(): ValkeyCommandArgument;
