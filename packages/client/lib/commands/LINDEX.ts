import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
  key: ValkeyCommandArgument,
  index: number
): ValkeyCommandArguments {
  return ["LINDEX", key, index.toString()];
}

export declare function transformReply(): ValkeyCommandArgument | null;
