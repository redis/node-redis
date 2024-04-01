import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export function transformArguments(): ValkeyCommandArguments {
  return ["ACL", "LOAD"];
}

export declare function transformReply(): ValkeyCommandArgument;
