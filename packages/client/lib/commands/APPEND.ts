import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: ValkeyCommandArgument,
  value: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["APPEND", key, value];
}

export declare function transformReply(): number;
