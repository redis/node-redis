import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export function transformArguments(): ValkeyCommandArguments {
  return ["ACL", "LOG", "RESET"];
}

export declare function transformReply(): ValkeyCommandArgument;
