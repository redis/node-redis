import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: ValkeyCommandArgument,
  newKey: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["RENAME", key, newKey];
}

export declare function transformReply(): ValkeyCommandArgument;
