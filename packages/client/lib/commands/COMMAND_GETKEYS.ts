import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const IS_READ_ONLY = true;

export function transformArguments(
  args: Array<ValkeyCommandArgument>
): ValkeyCommandArguments {
  return ["COMMAND", "GETKEYS", ...args];
}

export declare function transformReply(): Array<ValkeyCommandArgument>;
