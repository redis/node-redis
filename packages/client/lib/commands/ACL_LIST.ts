import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export function transformArguments(): ValkeyCommandArguments {
  return ["ACL", "LIST"];
}

export declare function transformReply(): Array<ValkeyCommandArgument>;
