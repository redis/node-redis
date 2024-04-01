import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export function transformArguments(): ValkeyCommandArguments {
  return ["ACL", "SAVE"];
}

export declare function transformReply(): ValkeyCommandArgument;
