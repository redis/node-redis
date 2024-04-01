import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const IS_READ_ONLY = true;

export function transformArguments(
  username: ValkeyCommandArgument,
  command: Array<ValkeyCommandArgument>
): ValkeyCommandArguments {
  return ["ACL", "DRYRUN", username, ...command];
}

export declare function transformReply(): ValkeyCommandArgument;
