import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const IS_READ_ONLY = true;

export function transformArguments(
  message: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["ECHO", message];
}

export declare function transformReply(): ValkeyCommandArgument;
