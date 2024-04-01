import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: ValkeyCommandArgument,
  value: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["GETSET", key, value];
}

export declare function transformReply(): ValkeyCommandArgument | null;
