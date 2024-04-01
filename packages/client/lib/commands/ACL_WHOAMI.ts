import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export function transformArguments(): ValkeyCommandArguments {
  return ["ACL", "WHOAMI"];
}

export declare function transformReply(): ValkeyCommandArgument;
