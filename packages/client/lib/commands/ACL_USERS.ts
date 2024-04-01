import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export function transformArguments(): ValkeyCommandArguments {
  return ["ACL", "USERS"];
}

export declare function transformReply(): Array<ValkeyCommandArgument>;
